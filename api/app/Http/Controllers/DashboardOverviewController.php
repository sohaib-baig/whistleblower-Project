<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Models\ActivityLog;
use App\Models\CaseAttachment;
use App\Models\CaseLog;
use App\Models\CaseModel;
use App\Models\Category;
use App\Models\EmailTemplate;
use App\Models\News;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class DashboardOverviewController extends Controller
{
    use ApiResponse;

    private const TIME_PERIODS = ['daily', 'weekly', 'monthly', 'yearly', 'all-time'];

    public function overview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_date' => ['nullable', 'date'],
            'to_date' => ['nullable', 'date', 'after_or_equal:from_date'],
            'time_period' => ['nullable', 'in:' . implode(',', self::TIME_PERIODS)],
            'company_id' => ['nullable', 'uuid', 'exists:users,id'],
        ]);

        $user = $request->user();
        if (!$user) {
            return $this->error('Authentication required', 401);
        }

        $timePeriod = $validated['time_period'] ?? 'all-time';
        [$start, $end, $granularity] = $this->resolveDateRange(
            $validated['from_date'] ?? null,
            $validated['to_date'] ?? null,
            $timePeriod
        );

        [$previousStart, $previousEnd] = $this->previousRange($start, $end);

        $requestedCompanyId = $validated['company_id'] ?? null;
        $companyId = null;

        if ($user->hasRole('admin')) {
            $companyId = $requestedCompanyId;
        } elseif ($user->hasRole('company')) {
            $companyId = $user->id;
        } elseif ($user->hasRole('case_manager')) {
            $companyId = $user->company_id ?? null;
            if (!$companyId) {
                return $this->error('Associated company not found for case manager', 403);
            }
        }

        $buckets = $this->generateBuckets($start, $end, $granularity);
        $bucketKeys = array_column($buckets, 'key');
        $bucketLabels = array_column($buckets, 'label');
        $positions = array_flip($bucketKeys);

        // Cases dataset -----------------------------------------------------
        $caseQuery = CaseModel::query()
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->whereBetween('created_at', [$start, $end]);

        $cases = $caseQuery->get(['id', 'company_id', 'created_at', 'updated_at', 'status', 'open_deadline_number', 'open_deadline_period', 'close_deadline_number', 'close_deadline_period']);

        // Debug: Log deadline period values for troubleshooting
        // Uncomment if needed: \Log::info('Deadline periods in cases', ['periods' => $cases->pluck('open_deadline_period', 'close_deadline_period')->toArray()]);

        $caseIds = $cases->pluck('id');

        $firstActionsMap = CaseLog::query()
            ->whereIn('case_id', $caseIds)
            ->whereNotIn('action_type', ['case created', 'Case created'])
            ->whereNull('deleted_at')
            ->selectRaw('case_id, MIN(created_at) as first_action_at')
            ->groupBy('case_id')
            ->pluck('first_action_at', 'case_id');

        $caseCountsSeries = $this->countSeriesFromCollection($cases, $buckets, $granularity);

        $caseDurations = $this->computeCaseDurations($cases, $firstActionsMap, $buckets, $granularity);

        $totalCases = $cases->count();
        $avgDaysUntilReceived = $caseDurations['avg_received'];
        $avgDaysUntilClosed = $caseDurations['avg_closed'];

        // Map time period to deadline period filter
        // For 'all-time', we don't filter by period (show all)
        $deadlinePeriodFilter = $timePeriod !== 'all-time' ? $timePeriod : null;
        
        // For deadline counting, query ALL cases (not just those in date range)
        // because deadlines are a property of cases regardless of creation date
        $deadlineCaseQuery = CaseModel::query()
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId));

        // Apply deadline period filter if set
        if ($deadlinePeriodFilter !== null) {
            $deadlineCaseQuery->where(function ($q) use ($deadlinePeriodFilter) {
                $q->where(function ($subQ) use ($deadlinePeriodFilter) {
                    $subQ->whereNotNull('open_deadline_number')
                         ->whereNotNull('open_deadline_period')
                         ->whereRaw('LOWER(TRIM(open_deadline_period)) = ?', [strtolower(trim($deadlinePeriodFilter))]);
                })->orWhere(function ($subQ) use ($deadlinePeriodFilter) {
                    $subQ->whereNotNull('close_deadline_number')
                         ->whereNotNull('close_deadline_period')
                         ->whereRaw('LOWER(TRIM(close_deadline_period)) = ?', [strtolower(trim($deadlinePeriodFilter))]);
                });
            });
        } else {
            // For 'all-time', get all cases with any deadline set
            $deadlineCaseQuery->where(function ($q) {
                $q->where(function ($subQ) {
                    $subQ->whereNotNull('open_deadline_number')
                         ->whereNotNull('open_deadline_period');
                })->orWhere(function ($subQ) {
                    $subQ->whereNotNull('close_deadline_number')
                         ->whereNotNull('close_deadline_period');
                });
            });
        }

        $deadlineCases = $deadlineCaseQuery->get(['id', 'company_id', 'created_at', 'open_deadline_number', 'open_deadline_period', 'close_deadline_number', 'close_deadline_period']);

        // Calculate total open and close state deadlines
        $totalOpenStateDeadline = $deadlineCases->filter(function ($case) use ($deadlinePeriodFilter) {
            if ($case->open_deadline_number === null || $case->open_deadline_period === null) {
                return false;
            }
            // If filter is set, only count matching periods
            if ($deadlinePeriodFilter !== null) {
                $casePeriod = (string) $case->open_deadline_period;
                $filterPeriod = (string) $deadlinePeriodFilter;
                return strtolower(trim($casePeriod)) === strtolower(trim($filterPeriod));
            }
            // For 'all-time', count all cases with deadline set
            return true;
        })->count();

        $totalCloseStateDeadline = $deadlineCases->filter(function ($case) use ($deadlinePeriodFilter) {
            if ($case->close_deadline_number === null || $case->close_deadline_period === null) {
                return false;
            }
            // If filter is set, only count matching periods
            if ($deadlinePeriodFilter !== null) {
                $casePeriod = (string) $case->close_deadline_period;
                $filterPeriod = (string) $deadlinePeriodFilter;
                return strtolower(trim($casePeriod)) === strtolower(trim($filterPeriod));
            }
            // For 'all-time', count all cases with deadline set
            return true;
        })->count();

        // Calculate series for open and close state deadlines
        // For series, we still use cases within the date range but filter by deadline period
        $openDeadlineSeries = $this->countDeadlineSeries($cases, $buckets, $granularity, 'open', $deadlinePeriodFilter);
        $closeDeadlineSeries = $this->countDeadlineSeries($cases, $buckets, $granularity, 'close', $deadlinePeriodFilter);

        // Load previous period data for comparison
        $previousCasesData = $this->loadPreviousCases($previousStart, $previousEnd, $companyId);
        
        // For previous period deadline count, query all cases (not filtered by date) with the deadline period
        $previousDeadlineQuery = CaseModel::query()
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId));
        
        if ($deadlinePeriodFilter !== null) {
            $previousDeadlineQuery->where(function ($q) use ($deadlinePeriodFilter) {
                $q->where(function ($subQ) use ($deadlinePeriodFilter) {
                    $subQ->whereNotNull('open_deadline_number')
                         ->whereNotNull('open_deadline_period')
                         ->whereRaw('LOWER(TRIM(open_deadline_period)) = ?', [strtolower(trim($deadlinePeriodFilter))]);
                })->orWhere(function ($subQ) use ($deadlinePeriodFilter) {
                    $subQ->whereNotNull('close_deadline_number')
                         ->whereNotNull('close_deadline_period')
                         ->whereRaw('LOWER(TRIM(close_deadline_period)) = ?', [strtolower(trim($deadlinePeriodFilter))]);
                });
            });
        } else {
            $previousDeadlineQuery->where(function ($q) {
                $q->where(function ($subQ) {
                    $subQ->whereNotNull('open_deadline_number')
                         ->whereNotNull('open_deadline_period');
                })->orWhere(function ($subQ) {
                    $subQ->whereNotNull('close_deadline_number')
                         ->whereNotNull('close_deadline_period');
                });
            });
        }
        
        $previousDeadlineCases = $previousDeadlineQuery->get();
        $previousOpenDeadlineCount = $previousDeadlineCases->filter(function ($case) use ($deadlinePeriodFilter) {
            if ($case->open_deadline_number === null || $case->open_deadline_period === null) {
                return false;
            }
            if ($deadlinePeriodFilter !== null) {
                $casePeriod = (string) $case->open_deadline_period;
                $filterPeriod = (string) $deadlinePeriodFilter;
                return strtolower(trim($casePeriod)) === strtolower(trim($filterPeriod));
            }
            return true;
        })->count();
        
        $previousCloseDeadlineCount = $previousDeadlineCases->filter(function ($case) use ($deadlinePeriodFilter) {
            if ($case->close_deadline_number === null || $case->close_deadline_period === null) {
                return false;
            }
            if ($deadlinePeriodFilter !== null) {
                $casePeriod = (string) $case->close_deadline_period;
                $filterPeriod = (string) $deadlinePeriodFilter;
                return strtolower(trim($casePeriod)) === strtolower(trim($filterPeriod));
            }
            return true;
        })->count();

        // Case attachments ---------------------------------------------------
        $attachments = CaseAttachment::query()
            ->whereBetween('created_at', [$start, $end])
            ->whereHas('case', function ($query) use ($companyId) {
                $query->when($companyId, fn ($q) => $q->where('company_id', $companyId));
            })
            ->get(['id', 'created_at']);

        $attachmentsSeries = $this->countSeriesFromCollection($attachments, $buckets, $granularity);
        $totalAttachments = $attachments->count();
        $previousAttachmentsCount = CaseAttachment::query()
            ->whereBetween('created_at', [$previousStart, $previousEnd])
            ->whereHas('case', function ($query) use ($companyId) {
                $query->when($companyId, fn ($q) => $q->where('company_id', $companyId));
            })
            ->count();

        // Case logs ---------------------------------------------------------
        $caseLogs = CaseLog::query()
            ->whereBetween('created_at', [$start, $end])
            ->whereNull('deleted_at')
            ->whereHas('case', function ($query) use ($companyId) {
                $query->when($companyId, fn ($q) => $q->where('company_id', $companyId));
            })
            ->get(['id', 'created_at']);

        $caseLogsSeries = $this->countSeriesFromCollection($caseLogs, $buckets, $granularity);
        $totalCaseLogs = $caseLogs->count();
        $previousCaseLogsCount = CaseLog::query()
            ->whereBetween('created_at', [$previousStart, $previousEnd])
            ->whereNull('deleted_at')
            ->whereHas('case', function ($query) use ($companyId) {
                $query->when($companyId, fn ($q) => $q->where('company_id', $companyId));
            })
            ->count();

        // Email templates ----------------------------------------------------
        $emailTemplates = EmailTemplate::query()
            ->whereNull('deleted_at')
            ->whereBetween('created_at', [$start, $end])
            ->get(['id', 'created_at']);

        $emailTemplateSeries = $this->countSeriesFromCollection($emailTemplates, $buckets, $granularity);
        $totalEmailTemplates = $emailTemplates->count();
        $previousEmailTemplatesCount = EmailTemplate::query()
            ->whereNull('deleted_at')
            ->whereBetween('created_at', [$previousStart, $previousEnd])
            ->count();

        // Companies ---------------------------------------------------------
        $companies = User::role('company')
            ->whereNull('deleted_at')
            ->when($companyId, fn ($q) => $q->where('id', $companyId))
            ->whereBetween('created_at', [$start, $end])
            ->get(['id', 'name', 'company_name', 'phone', 'address', 'created_at']);

        $companySeries = $this->countSeriesFromCollection($companies, $buckets, $granularity);
        $totalCompanies = $companies->count();
        $previousCompaniesCount = User::role('company')
            ->whereNull('deleted_at')
            ->when($companyId, fn ($q) => $q->where('id', $companyId))
            ->whereBetween('created_at', [$previousStart, $previousEnd])
            ->count();

        // Case managers -----------------------------------------------------
        $caseManagers = User::role('case_manager')
            ->whereNull('deleted_at')
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->whereBetween('created_at', [$start, $end])
            ->get(['id', 'created_at']);

        $caseManagerSeries = $this->countSeriesFromCollection($caseManagers, $buckets, $granularity);
        $totalCaseManagers = $caseManagers->count();
        $previousCaseManagerCount = User::role('case_manager')
            ->whereNull('deleted_at')
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->whereBetween('created_at', [$previousStart, $previousEnd])
            ->count();

        // News --------------------------------------------------------------
        $newsItems = News::query()
            ->whereNull('deleted_at')
            ->when($companyId, fn ($q) => $q->where('user_id', $companyId))
            ->whereBetween('created_at', [$start, $end])
            ->get(['id', 'created_at']);

        $newsSeries = $this->countSeriesFromCollection($newsItems, $buckets, $granularity);
        $totalNews = $newsItems->count();
        $previousNewsCount = News::query()
            ->whereNull('deleted_at')
            ->when($companyId, fn ($q) => $q->where('user_id', $companyId))
            ->whereBetween('created_at', [$previousStart, $previousEnd])
            ->count();

        // Category breakdown ------------------------------------------------
        $categoryBreakdown = $this->categoryBreakdown($start, $end, $companyId);

        // Time of reporting (cases by bucket) -------------------------------
        $timeOfReportingSeries = [
            [
                'name' => 'Cases',
                'data' => $caseCountsSeries,
            ],
        ];

        // User activity -----------------------------------------------------
        $userActivityLogs = ActivityLog::query()
            ->where('action', 'auth.login')
            ->whereBetween('created_at', [$start, $end])
            ->when($companyId, function ($query) use ($companyId) {
                $query->where(function ($sub) use ($companyId) {
                    $sub->where('user_id', $companyId)
                        ->orWhereHas('user', function ($userQuery) use ($companyId) {
                            $userQuery->whereNull('deleted_at')
                                ->where(function ($inner) use ($companyId) {
                                    $inner->where('id', $companyId)
                                        ->orWhere('company_id', $companyId);
                                });
                        });
                });
            })
            ->get(['id', 'created_at']);

        $userActivitySeries = [
            [
                'name' => 'Active Users',
                'data' => $this->countSeriesFromCollection($userActivityLogs, $buckets, $granularity),
            ],
        ];

        // Companies chart (monthly registrations) --------------------------
        $companyChartBuckets = $this->generateBuckets($start, $end, 'monthly');
        $companyChartSeries = $this->countSeriesFromCollection($companies, $companyChartBuckets, 'monthly');
        $companyChartLabels = array_column($companyChartBuckets, 'label');

        // Latest companies --------------------------------------------------
        $latestCompanies = User::role('company')
            ->whereNull('deleted_at')
            ->when($companyId, fn ($q) => $q->where('id', $companyId))
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'name', 'company_name', 'phone', 'address', 'created_at'])
            ->map(fn ($company) => [
                'id' => $company->id,
                'name' => $company->company_name ?? $company->name,
                'phone' => $company->phone ?? 'N/A',
                'address' => $company->address ?? 'N/A',
                'date' => $company->created_at ? $company->created_at->format('Y-m-d') : '',
            ]);

        // Company options for filter ---------------------------------------
        $companyOptionsQuery = User::role('company')
            ->whereNull('deleted_at');

        if ($user->hasRole('admin')) {
            $companyOptionsQuery->orderBy('company_name')->orderBy('name');
        } elseif ($user->hasRole('company')) {
            $companyOptionsQuery->where('id', $user->id);
        } elseif ($user->hasRole('case_manager')) {
            $companyOptionsQuery->where('id', $companyId);
        } else {
            $companyOptionsQuery->whereRaw('1 = 0');
        }

        $companyOptions = $companyOptionsQuery
            ->get(['id', 'name', 'company_name'])
            ->map(fn ($company) => [
                'id' => $company->id,
                'label' => $company->company_name ?? $company->name,
            ]);

        $metricsResponse = [
            'totalCases' => [
                'value' => $totalCases,
                'percent' => $this->percentChange($totalCases, $previousCasesData['count']),
                'chart' => [
                    'categories' => $bucketLabels,
                    'series' => $caseCountsSeries,
                ],
                'periodText' => 'vs previous period',
            ],
            'avgDaysUntilReceived' => [
                'value' => $avgDaysUntilReceived !== null ? round($avgDaysUntilReceived, 2) : null,
                'percent' => $this->percentChange($avgDaysUntilReceived, $previousCasesData['avg_received']),
                'chart' => [
                    'categories' => $bucketLabels,
                    'series' => $caseDurations['received_series'],
                ],
                'periodText' => 'vs previous period',
            ],
            'avgDaysUntilClosed' => [
                'value' => $avgDaysUntilClosed !== null ? round($avgDaysUntilClosed, 2) : null,
                'percent' => $this->percentChange($avgDaysUntilClosed, $previousCasesData['avg_closed']),
                'chart' => [
                    'categories' => $bucketLabels,
                    'series' => $caseDurations['closed_series'],
                ],
                'periodText' => 'vs previous period',
            ],
            'totalMessageTemplates' => [
                'value' => $totalEmailTemplates,
                'percent' => $this->percentChange($totalEmailTemplates, $previousEmailTemplatesCount),
                'chart' => [
                    'categories' => $bucketLabels,
                    'series' => $emailTemplateSeries,
                ],
                'periodText' => 'vs previous period',
            ],
            'totalDocuments' => [
                'value' => $totalAttachments,
                'percent' => $this->percentChange($totalAttachments, $previousAttachmentsCount),
                'chart' => [
                    'categories' => $bucketLabels,
                    'series' => $attachmentsSeries,
                ],
                'periodText' => 'vs previous period',
            ],
            'totalCompanies' => [
                'value' => $totalCompanies,
                'percent' => $this->percentChange($totalCompanies, $previousCompaniesCount),
                'chart' => [
                    'categories' => $bucketLabels,
                    'series' => $companySeries,
                ],
                'periodText' => 'vs previous period',
            ],
            'totalLogs' => [
                'value' => $totalCaseLogs,
                'percent' => $this->percentChange($totalCaseLogs, $previousCaseLogsCount),
                'chart' => [
                    'categories' => $bucketLabels,
                    'series' => $caseLogsSeries,
                ],
                'periodText' => 'vs previous period',
            ],
            'totalCaseManagers' => [
                'value' => $totalCaseManagers,
                'percent' => $this->percentChange($totalCaseManagers, $previousCaseManagerCount),
                'chart' => [
                    'categories' => $bucketLabels,
                    'series' => $caseManagerSeries,
                ],
                'periodText' => 'vs previous period',
            ],
            'totalNews' => [
                'value' => $totalNews,
                'percent' => $this->percentChange($totalNews, $previousNewsCount),
                'chart' => [
                    'categories' => $bucketLabels,
                    'series' => $newsSeries,
                ],
                'periodText' => 'vs previous period',
            ],
            'totalOpenStateDeadline' => [
                'value' => $totalOpenStateDeadline,
                'percent' => $this->percentChange($totalOpenStateDeadline, $previousOpenDeadlineCount),
                'chart' => [
                    'categories' => $bucketLabels,
                    'series' => $openDeadlineSeries,
                ],
                'periodText' => 'vs previous period',
            ],
            'totalCloseStateDeadline' => [
                'value' => $totalCloseStateDeadline,
                'percent' => $this->percentChange($totalCloseStateDeadline, $previousCloseDeadlineCount),
                'chart' => [
                    'categories' => $bucketLabels,
                    'series' => $closeDeadlineSeries,
                ],
                'periodText' => 'vs previous period',
            ],
        ];

        return $this->success([
            'filters' => [
                'time_period' => $timePeriod,
                'granularity' => $granularity,
                'from_date' => $start->toDateString(),
                'to_date' => $end->toDateString(),
                'company_id' => $companyId,
                'companies' => $companyOptions,
            ],
            'metrics' => $metricsResponse,
            'companiesChart' => [
                'categories' => $companyChartLabels,
                'series' => $companyChartSeries,
            ],
            'categoryBreakdown' => [
                'series' => $categoryBreakdown,
            ],
            'timeOfReporting' => [
                'categories' => $bucketLabels,
                'series' => $timeOfReportingSeries,
            ],
            'userActivity' => [
                'categories' => $bucketLabels,
                'series' => $userActivitySeries,
            ],
            'latestCompanies' => $latestCompanies,
        ]);
    }

    private function resolveDateRange(?string $fromDate, ?string $toDate, string $timePeriod): array
    {
        $timezone = config('app.timezone', 'UTC');
        $end = $toDate
            ? Carbon::parse($toDate, $timezone)->endOfDay()
            : Carbon::now($timezone)->endOfDay();

        if ($fromDate) {
            $start = Carbon::parse($fromDate, $timezone)->startOfDay();
        } else {
            $start = match ($timePeriod) {
                'daily' => $end->copy()->subDays(6)->startOfDay(),
                'weekly' => $end->copy()->subWeeks(11)->startOfWeek(),
                'monthly' => $end->copy()->subMonths(11)->startOfMonth(),
                'yearly' => $end->copy()->subYears(4)->startOfYear(),
                default => $this->resolveAllTimeStart($end),
            };
        }

        if ($start->greaterThan($end)) {
            $start = $end->copy()->subDay()->startOfDay();
        }

        $granularity = $timePeriod === 'all-time' ? 'monthly' : $timePeriod;

        return [$start, $end, $granularity];
    }

    private function resolveAllTimeStart(Carbon $end): Carbon
    {
        $earliestCase = CaseModel::query()->min('created_at');
        if ($earliestCase) {
            return Carbon::parse($earliestCase)->startOfMonth();
        }

        return $end->copy()->subMonths(11)->startOfMonth();
    }

    private function previousRange(Carbon $currentStart, Carbon $currentEnd): array
    {
        $days = max(1, $currentStart->diffInDays($currentEnd) + 1);
        $previousEnd = $currentStart->copy()->subDay()->endOfDay();
        $previousStart = $previousEnd->copy()->subDays($days - 1)->startOfDay();

        return [$previousStart, $previousEnd];
    }

    private function generateBuckets(Carbon $start, Carbon $end, string $granularity): array
    {
        $buckets = [];

        switch ($granularity) {
            case 'daily':
                $cursor = $start->copy();
                while ($cursor <= $end) {
                    $bucketStart = $cursor->copy()->startOfDay();
                    $bucketEnd = $cursor->copy()->endOfDay();
                    $buckets[] = [
                        'key' => $this->bucketKey($bucketStart, 'daily'),
                        'label' => $bucketStart->format('d M'),
                        'start' => $bucketStart,
                        'end' => $bucketEnd,
                    ];
                    $cursor->addDay();
                }
                break;
            case 'weekly':
                $cursor = $start->copy()->startOfWeek();
                while ($cursor <= $end) {
                    $bucketStart = $cursor->copy()->startOfWeek();
                    $bucketEnd = $cursor->copy()->endOfWeek();
                    if ($bucketEnd > $end) {
                        $bucketEnd = $end->copy();
                    }
                    $buckets[] = [
                        'key' => $this->bucketKey($bucketStart, 'weekly'),
                        'label' => sprintf('Week %02d %d', $bucketStart->isoWeek, $bucketStart->isoWeekYear),
                        'start' => $bucketStart,
                        'end' => $bucketEnd,
                    ];
                    $cursor->addWeek();
                }
                break;
            case 'yearly':
                $cursor = $start->copy()->startOfYear();
                while ($cursor <= $end) {
                    $bucketStart = $cursor->copy()->startOfYear();
                    $bucketEnd = $cursor->copy()->endOfYear();
                    if ($bucketEnd > $end) {
                        $bucketEnd = $end->copy();
                    }
                    $buckets[] = [
                        'key' => $this->bucketKey($bucketStart, 'yearly'),
                        'label' => $bucketStart->format('Y'),
                        'start' => $bucketStart,
                        'end' => $bucketEnd,
                    ];
                    $cursor->addYear();
                }
                break;
            case 'monthly':
            default:
                $cursor = $start->copy()->startOfMonth();
                while ($cursor <= $end) {
                    $bucketStart = $cursor->copy()->startOfMonth();
                    $bucketEnd = $cursor->copy()->endOfMonth();
                    if ($bucketEnd > $end) {
                        $bucketEnd = $end->copy();
                    }
                    $buckets[] = [
                        'key' => $this->bucketKey($bucketStart, 'monthly'),
                        'label' => $bucketStart->format('M Y'),
                        'start' => $bucketStart,
                        'end' => $bucketEnd,
                    ];
                    $cursor->addMonth();
                }
                break;
        }

        return $buckets;
    }

    private function bucketKey(Carbon $date, string $granularity): string
    {
        return match ($granularity) {
            'daily' => $date->format('Y-m-d'),
            'weekly' => sprintf('%d-W%02d', $date->isoWeekYear, $date->isoWeek),
            'yearly' => $date->format('Y'),
            default => $date->format('Y-m'),
        };
    }

    private function countSeriesFromCollection(Collection $items, array $buckets, string $granularity): array
    {
        $series = array_fill(0, count($buckets), 0);
        $positions = array_flip(array_column($buckets, 'key'));

        foreach ($items as $item) {
            if (!isset($item->created_at)) {
                continue;
            }
            $created = $item->created_at instanceof Carbon ? $item->created_at : Carbon::parse($item->created_at);
            $key = $this->bucketKey($created, $granularity);
            if (isset($positions[$key])) {
                $series[$positions[$key]]++;
            }
        }

        return array_map('intval', $series);
    }

    private function computeCaseDurations(Collection $cases, Collection $firstActionsMap, array $buckets, string $granularity): array
    {
        $positions = array_flip(array_column($buckets, 'key'));

        $receivedSums = array_fill(0, count($buckets), 0.0);
        $receivedCounts = array_fill(0, count($buckets), 0);

        $closedSums = array_fill(0, count($buckets), 0.0);
        $closedCounts = array_fill(0, count($buckets), 0);

        $totalReceivedSum = 0.0;
        $totalReceivedCount = 0;

        $totalClosedSum = 0.0;
        $totalClosedCount = 0;

        foreach ($cases as $case) {
            if (!$case->created_at) {
                continue;
            }
            $createdAt = $case->created_at instanceof Carbon ? $case->created_at : Carbon::parse($case->created_at);
            $key = $this->bucketKey($createdAt, $granularity);
            if (!isset($positions[$key])) {
                continue;
            }
            $index = $positions[$key];

            $firstActionAt = $firstActionsMap[$case->id] ?? null;
            if ($firstActionAt) {
                $firstAction = $firstActionAt instanceof Carbon ? $firstActionAt : Carbon::parse($firstActionAt);
                if ($firstAction->greaterThan($createdAt)) {
                    $diffDays = $createdAt->diffInMinutes($firstAction) / 1440;
                    $receivedSums[$index] += $diffDays;
                    $receivedCounts[$index]++;
                    $totalReceivedSum += $diffDays;
                    $totalReceivedCount++;
                }
            }

            if ($case->status === 'closed' && $case->updated_at) {
                $updatedAt = $case->updated_at instanceof Carbon ? $case->updated_at : Carbon::parse($case->updated_at);
                if ($updatedAt->greaterThan($createdAt)) {
                    $diffDays = $createdAt->diffInMinutes($updatedAt) / 1440;
                    $closedSums[$index] += $diffDays;
                    $closedCounts[$index]++;
                    $totalClosedSum += $diffDays;
                    $totalClosedCount++;
                }
            }
        }

        $receivedSeries = [];
        foreach ($receivedSums as $idx => $sum) {
            $receivedSeries[$idx] = $receivedCounts[$idx] > 0 ? round($sum / $receivedCounts[$idx], 2) : 0;
        }

        $closedSeries = [];
        foreach ($closedSums as $idx => $sum) {
            $closedSeries[$idx] = $closedCounts[$idx] > 0 ? round($sum / $closedCounts[$idx], 2) : 0;
        }

        return [
            'avg_received' => $totalReceivedCount > 0 ? $totalReceivedSum / $totalReceivedCount : null,
            'avg_closed' => $totalClosedCount > 0 ? $totalClosedSum / $totalClosedCount : null,
            'received_series' => $receivedSeries,
            'closed_series' => $closedSeries,
        ];
    }

    private function loadPreviousCases(Carbon $previousStart, Carbon $previousEnd, ?string $companyId): array
    {
        $previousCases = CaseModel::query()
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->whereBetween('created_at', [$previousStart, $previousEnd])
            ->get(['id', 'created_at', 'updated_at', 'status']);

        if ($previousCases->isEmpty()) {
            return [
                'count' => 0,
                'avg_received' => null,
                'avg_closed' => null,
            ];
        }

        $firstActionsMap = CaseLog::query()
            ->whereIn('case_id', $previousCases->pluck('id'))
            ->whereNotIn('action_type', ['case created', 'Case created'])
            ->whereNull('deleted_at')
            ->selectRaw('case_id, MIN(created_at) as first_action_at')
            ->groupBy('case_id')
            ->pluck('first_action_at', 'case_id');

        $receivedSum = 0.0;
        $receivedCount = 0;
        $closedSum = 0.0;
        $closedCount = 0;

        foreach ($previousCases as $case) {
            if (!$case->created_at) {
                continue;
            }
            $createdAt = $case->created_at instanceof Carbon ? $case->created_at : Carbon::parse($case->created_at);

            $firstActionAt = $firstActionsMap[$case->id] ?? null;
            if ($firstActionAt) {
                $firstAction = $firstActionAt instanceof Carbon ? $firstActionAt : Carbon::parse($firstActionAt);
                if ($firstAction->greaterThan($createdAt)) {
                    $receivedSum += $createdAt->diffInMinutes($firstAction) / 1440;
                    $receivedCount++;
                }
            }

            if ($case->status === 'closed' && $case->updated_at) {
                $updatedAt = $case->updated_at instanceof Carbon ? $case->updated_at : Carbon::parse($case->updated_at);
                if ($updatedAt->greaterThan($createdAt)) {
                    $closedSum += $createdAt->diffInMinutes($updatedAt) / 1440;
                    $closedCount++;
                }
            }
        }

        return [
            'count' => $previousCases->count(),
            'avg_received' => $receivedCount > 0 ? $receivedSum / $receivedCount : null,
            'avg_closed' => $closedCount > 0 ? $closedSum / $closedCount : null,
        ];
    }

    private function categoryBreakdown(Carbon $start, Carbon $end, ?string $companyId): array
    {
        $categories = Category::query()
            ->whereNull('deleted_at')
            ->get(['id', 'name']);

        if ($categories->isEmpty()) {
            return [];
        }

        $caseCounts = CaseModel::query()
            ->selectRaw('case_category_id, COUNT(*) as total')
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('case_category_id')
            ->pluck('total', 'case_category_id');

        return $categories->map(fn ($category) => [
            'label' => $category->name,
            'value' => (int) ($caseCounts[$category->id] ?? 0),
        ])->toArray();
    }

    private function percentChange($current, $previous): float
    {
        $currentValue = $current ?? 0;
        $previousValue = $previous ?? 0;

        if ((float) $previousValue === 0.0) {
            return $currentValue > 0 ? 100.0 : 0.0;
        }

        return round((($currentValue - $previousValue) / $previousValue) * 100, 2);
    }

    private function countDeadlineSeries(Collection $cases, array $buckets, string $granularity, string $type, ?string $deadlinePeriodFilter = null): array
    {
        $series = array_fill(0, count($buckets), 0);
        $positions = array_flip(array_column($buckets, 'key'));

        foreach ($cases as $case) {
            if (!$case->created_at) {
                continue;
            }

            // Check if case has deadline set based on type and period filter
            $hasDeadline = false;
            if ($type === 'open') {
                if ($case->open_deadline_number === null || $case->open_deadline_period === null) {
                    continue;
                }
                // If filter is set, only count matching periods
                // Convert to string and compare (handles enum types)
                if ($deadlinePeriodFilter !== null) {
                    $casePeriod = (string) $case->open_deadline_period;
                    $filterPeriod = (string) $deadlinePeriodFilter;
                    $hasDeadline = strtolower(trim($casePeriod)) === strtolower(trim($filterPeriod));
                } else {
                    // For 'all-time', count all cases with deadline set
                    $hasDeadline = true;
                }
            } else {
                if ($case->close_deadline_number === null || $case->close_deadline_period === null) {
                    continue;
                }
                // If filter is set, only count matching periods
                // Convert to string and compare (handles enum types)
                if ($deadlinePeriodFilter !== null) {
                    $casePeriod = (string) $case->close_deadline_period;
                    $filterPeriod = (string) $deadlinePeriodFilter;
                    $hasDeadline = strtolower(trim($casePeriod)) === strtolower(trim($filterPeriod));
                } else {
                    // For 'all-time', count all cases with deadline set
                    $hasDeadline = true;
                }
            }

            if (!$hasDeadline) {
                continue;
            }

            $created = $case->created_at instanceof Carbon ? $case->created_at : Carbon::parse($case->created_at);
            $key = $this->bucketKey($created, $granularity);
            if (isset($positions[$key])) {
                $series[$positions[$key]]++;
            }
        }

        return array_map('intval', $series);
    }

    private function loadPreviousDeadlineCount(Carbon $previousStart, Carbon $previousEnd, ?string $companyId, string $type, ?string $deadlinePeriodFilter = null): int
    {
        $query = CaseModel::query()
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->whereBetween('created_at', [$previousStart, $previousEnd]);

        if ($type === 'open') {
            $query->whereNotNull('open_deadline_number')
                  ->whereNotNull('open_deadline_period');
            // If filter is set, only count matching periods (case-insensitive)
            if ($deadlinePeriodFilter !== null) {
                $query->whereRaw('LOWER(TRIM(open_deadline_period)) = ?', [strtolower(trim($deadlinePeriodFilter))]);
            }
        } else {
            $query->whereNotNull('close_deadline_number')
                  ->whereNotNull('close_deadline_period');
            // If filter is set, only count matching periods (case-insensitive)
            if ($deadlinePeriodFilter !== null) {
                $query->whereRaw('LOWER(TRIM(close_deadline_period)) = ?', [strtolower(trim($deadlinePeriodFilter))]);
            }
        }

        return $query->count();
    }
}

