<?php

namespace App\Http\Controllers;

use App\Models\ManualEntry;
use App\Models\User;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Requests\ManualEntry\StoreManualEntryRequest;
use App\Http\Requests\ManualEntry\UpdateManualEntryRequest;
use App\Http\Resources\ManualEntryResource;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Color;

class ManualEntryController extends Controller
{
    use AuthorizesRequests, ApiResponse;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ManualEntry::class);
        $perPage = $request->input('per_page', 5);
        $perPage = max(1, min(100, (int) $perPage)); // Cap between 1-100

        $query = ManualEntry::with('mediaBuyer:id,name,email');

        // Filter data based on user permissions
        $user = $request->user();
        if (!$user->hasPermissionTo('manual_entries.manage') && !$user->hasRole('admin')) {
            // If user doesn't have manage permission, only show their own entries
            $query->where('media_buyer_id', $user->id);
        }

        // Apply filters
        if ($request->filled('media_buyer_id')) {
            $query->where('media_buyer_id', $request->media_buyer_id);
        }

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('report_date', [
                $request->date_from . ' 00:00:00',
                $request->date_to . ' 23:59:59'
            ]);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('mediaBuyer', function ($subQuery) use ($search) {
                    $subQuery->where('name', 'like', "%{$search}%")
                             ->orWhere('email', 'like', "%{$search}%");
                })
                ->orWhere('total_spend', 'like', "%{$search}%")
                ->orWhere('total_revenue', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sort = $request->string('sort', 'created_at')->toString();
        $order = $request->string('order', 'desc')->toString();
        $allowedSorts = ['report_date', 'total_spend', 'total_revenue', 'total_profit', 'margins', 'created_at'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $order);
        } elseif ($sort === 'campaigns') {
            $query->orderByRaw('JSON_LENGTH(campaign_breakdown) ' . $order);
        } elseif ($sort === 'mediaBuyer') {
            $query->join('users', 'manual_entries.media_buyer_id', '=', 'users.id')
                  ->orderBy('users.name', $order)
                  ->select('manual_entries.*');
        }
        $manualEntries = $query->paginate($perPage);
        return $this->success([
            'data' => ManualEntryResource::collection($manualEntries),
            'meta' => [
                'current_page' => $manualEntries->currentPage(),
                'per_page' => $manualEntries->perPage(),
                'total' => $manualEntries->total(),
            ],
            'links' => [
                'first' => $manualEntries->url(1),
                'last' => $manualEntries->url($manualEntries->lastPage()),
                'prev' => $manualEntries->previousPageUrl(),
                'next' => $manualEntries->nextPageUrl(),
            ],
        ], 'Manual entries retrieved successfully');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreManualEntryRequest $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $validatedData = $request->validated();
            $user = $request->user();

            // Auto-set media_buyer_id for users without manage permission
            if (!$user->hasPermissionTo('manual_entries.manage') && !$user->hasRole('admin')) {
                $validatedData['media_buyer_id'] = $user->id;
            }

            $manualEntry = ManualEntry::create($validatedData);
            $manualEntry->load('mediaBuyer:id,name,email');

            DB::commit();
            return $this->success(
                new ManualEntryResource($manualEntry),
                'Manual entry created successfully',
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to create manual entry', 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(ManualEntry $manualEntry): JsonResponse
    {
        $this->authorize('view', $manualEntry);

        $manualEntry->load('mediaBuyer:id,name,email');

        return $this->success(
            new ManualEntryResource($manualEntry),
            'Manual entry retrieved successfully'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateManualEntryRequest $request, ManualEntry $manualEntry): JsonResponse
    {
        $this->authorize('update', $manualEntry);
        DB::beginTransaction();
        try {
            $manualEntry->update($request->validated());
            $manualEntry->load('mediaBuyer:id,name,email');

            DB::commit();
            return $this->success(
                new ManualEntryResource($manualEntry),
                'Manual entry updated successfully'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to update manual entry', 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ManualEntry $manualEntry): JsonResponse
    {
        $this->authorize('delete', $manualEntry);

        DB::beginTransaction();
        try {
            $manualEntry->delete();

            DB::commit();
            return $this->success(
                null,
                'Manual entry deleted successfully'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to delete manual entry', 500);
        }
    }

    /**
     * Get financial report from manual entries
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getFinancialReport(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ManualEntry::class);

        // Validate request
        $validated = $request->validate([
            'month' => 'nullable|date_format:Y-m', // Format: 2024-10
            'accounts' => 'nullable|array',
            'accounts.*' => 'string|exists:users,name',
        ]);

        // Default to current month if not provided
        $month = $validated['month'] ?? now()->format('Y-m');
        $startDate = $month . '-01 00:00:00';
        $endDate = date('Y-m-t 23:59:59', strtotime($startDate));

        // Get number of days in the month
        $daysInMonth = date('t', strtotime($startDate));

        // Build query
        $query = ManualEntry::with('mediaBuyer:id,name,email')
            ->whereBetween('report_date', [$startDate, $endDate]);

        // Filter by accounts (media buyers) if provided
        if (!empty($validated['accounts'])) {
            $query->whereHas('mediaBuyer', function ($q) use ($validated) {
                $q->whereIn('name', $validated['accounts']);
            });
        }

        $entries = $query->get();

        // Calculate totals for the entire month
        $monthlyTotals = [
            'cost' => $entries->sum('total_spend'),
            'revenue' => $entries->sum('total_revenue'),
            'net' => $entries->sum('total_profit'),
            'roi' => 0,
        ];

        // Calculate ROI for monthly totals
        if ($monthlyTotals['cost'] > 0) {
            $monthlyTotals['roi'] = ($monthlyTotals['net'] / $monthlyTotals['cost']) * 100;
        }

        // Calculate daily totals
        $dailyTotals = [];
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $date = $month . '-' . str_pad($day, 2, '0', STR_PAD_LEFT);
            $dayEntries = $entries->filter(function ($entry) use ($date) {
                return $entry->report_date->format('Y-m-d') === $date;
            });

            $cost = $dayEntries->sum('total_spend');
            $revenue = $dayEntries->sum('total_revenue');
            $net = $dayEntries->sum('total_profit');
            $roi = $cost > 0 ? ($net / $cost) * 100 : 0;

            $dailyTotals[] = [
                'date' => $day . '-' . date('M', strtotime($date)),
                'cost' => (float) $cost,
                'revenue' => (float) $revenue,
                'roi' => round($roi, 2),
                'net' => (float) $net,
            ];
        }

        // Group entries by media buyer (account)
        $accountsData = [];
        $mediaBuyers = $entries->groupBy('media_buyer_id');

        foreach ($mediaBuyers as $mediaBuyerId => $buyerEntries) {
            $mediaBuyer = $buyerEntries->first()->mediaBuyer;
            
            if (!$mediaBuyer) {
                continue;
            }

            // Calculate monthly totals for this account
            $accountMonthly = [
                'cost' => $buyerEntries->sum('total_spend'),
                'revenue' => $buyerEntries->sum('total_revenue'),
                'net' => $buyerEntries->sum('total_profit'),
                'roi' => 0,
            ];

            if ($accountMonthly['cost'] > 0) {
                $accountMonthly['roi'] = ($accountMonthly['net'] / $accountMonthly['cost']) * 100;
            }

            // Calculate daily data for this account
            $accountDaily = [];
            for ($day = 1; $day <= $daysInMonth; $day++) {
                $date = $month . '-' . str_pad($day, 2, '0', STR_PAD_LEFT);
                $dayEntry = $buyerEntries->first(function ($entry) use ($date) {
                    return $entry->report_date->format('Y-m-d') === $date;
                });

                $cost = $dayEntry ? (float) $dayEntry->total_spend : 0;
                $revenue = $dayEntry ? (float) $dayEntry->total_revenue : 0;
                $net = $dayEntry ? (float) $dayEntry->total_profit : 0;
                $roi = $cost > 0 ? ($net / $cost) * 100 : 0;

                $accountDaily[] = [
                    'date' => $day . '-' . date('M', strtotime($date)),
                    'cost' => $cost,
                    'revenue' => $revenue,
                    'roi' => round($roi, 2),
                    'net' => $net,
                ];
            }

            // Build campaigns structure (Cost, Revenue, ROI, Net)
            $campaigns = [
                [
                    'campaign' => 'Cost',
                    'monthly' => [
                        'type' => 'MTD Actual',
                        'cost' => round($accountMonthly['cost'], 2),
                    ],
                    'daily' => array_map(function ($day) {
                        return [
                            'date' => $day['date'],
                            'cost' => $day['cost'],
                        ];
                    }, $accountDaily),
                ],
                [
                    'campaign' => 'Revenue',
                    'monthly' => [
                        'type' => 'MTD Actual',
                        'revenue' => round($accountMonthly['revenue'], 2),
                    ],
                    'daily' => array_map(function ($day) {
                        return [
                            'date' => $day['date'],
                            'revenue' => $day['revenue'],
                        ];
                    }, $accountDaily),
                ],
                [
                    'campaign' => 'ROI',
                    'monthly' => [
                        'type' => 'MTD Actual',
                        'roi' => round($accountMonthly['roi'], 2),
                    ],
                    'daily' => array_map(function ($day) {
                        return [
                            'date' => $day['date'],
                            'roi' => $day['roi'],
                        ];
                    }, $accountDaily),
                ],
                [
                    'campaign' => 'Net',
                    'monthly' => [
                        'type' => 'MTD Actual',
                        'net' => round($accountMonthly['net'], 2),
                    ],
                    'daily' => array_map(function ($day) {
                        return [
                            'date' => $day['date'],
                            'net' => $day['net'],
                        ];
                    }, $accountDaily),
                ],
            ];

            $accountsData[] = [
                'account' => $mediaBuyer->name,
                'campaigns' => $campaigns,
            ];
        }

        // Build totals structure
        $totalsCampaigns = [
            [
                'campaign' => 'Cost',
                'monthly' => [
                    'type' => 'MTD Actual',
                    'cost' => round($monthlyTotals['cost'], 2),
                ],
                'daily' => array_map(function ($day) {
                    return [
                        'date' => $day['date'],
                        'cost' => $day['cost'],
                    ];
                }, $dailyTotals),
            ],
            [
                'campaign' => 'Revenue',
                'monthly' => [
                    'type' => 'MTD Actual',
                    'revenue' => round($monthlyTotals['revenue'], 2),
                ],
                'daily' => array_map(function ($day) {
                    return [
                        'date' => $day['date'],
                        'revenue' => $day['revenue'],
                    ];
                }, $dailyTotals),
            ],
            [
                'campaign' => 'ROI',
                'monthly' => [
                    'type' => 'MTD Actual',
                    'roi' => round($monthlyTotals['roi'], 2),
                ],
                'daily' => array_map(function ($day) {
                    return [
                        'date' => $day['date'],
                        'roi' => $day['roi'],
                    ];
                }, $dailyTotals),
            ],
            [
                'campaign' => 'Net',
                'monthly' => [
                    'type' => 'MTD Actual',
                    'net' => round($monthlyTotals['net'], 2),
                ],
                'daily' => array_map(function ($day) {
                    return [
                        'date' => $day['date'],
                        'net' => $day['net'],
                    ];
                }, $dailyTotals),
            ],
        ];

        $response = [
            'accounts' => $accountsData,
            'totals' => [
                'account' => 'Totals',
                'campaigns' => $totalsCampaigns,
            ],
        ];

        return $this->success($response, 'Financial report retrieved successfully');
    }

    /**
     * Get analytics data for dashboard with date range filtering
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getAnalytics(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ManualEntry::class);

        // Validate request
        $validated = $request->validate([
            'start_date' => 'nullable|date_format:Y-m-d',
            'end_date' => 'nullable|date_format:Y-m-d',
        ]);

        // Set default date range if not provided (last 30 days)
        $endDate = $validated['end_date'] ? 
            \Carbon\Carbon::parse($validated['end_date'])->endOfDay() : 
            now()->endOfDay();
        
        $startDate = $validated['start_date'] ? 
            \Carbon\Carbon::parse($validated['start_date'])->startOfDay() : 
            now()->subDays(30)->startOfDay();

        // Get current period data
        $currentData = ManualEntry::whereBetween('report_date', [$startDate, $endDate])
            ->selectRaw('
                SUM(total_spend) as total_spend,
                SUM(total_revenue) as total_revenue,
                SUM(total_profit) as total_profit,
                COUNT(DISTINCT media_buyer_id) as total_media_buyers
            ')
            ->first();

        // Calculate previous period for comparison (same duration)
        $periodDuration = $startDate->diffInDays($endDate);
        $previousStartDate = $startDate->copy()->subDays($periodDuration + 1);
        $previousEndDate = $startDate->copy()->subDay();

        $previousData = ManualEntry::whereBetween('report_date', [$previousStartDate, $previousEndDate])
            ->selectRaw('
                SUM(total_spend) as total_spend,
                SUM(total_revenue) as total_revenue,
                SUM(total_profit) as total_profit,
                COUNT(DISTINCT media_buyer_id) as total_media_buyers
            ')
            ->first();

        // Calculate daily data for charts (last 30 days or selected range)
        $dailyData = ManualEntry::whereBetween('report_date', [$startDate, $endDate])
            ->selectRaw('
                DATE(report_date) as date,
                SUM(total_spend) as daily_spend,
                SUM(total_revenue) as daily_revenue,
                SUM(total_profit) as daily_profit
            ')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Fill missing dates with zeros
        $chartData = [];
        $currentDate = $startDate->copy();
        while ($currentDate <= $endDate) {
            $dateStr = $currentDate->format('Y-m-d');
            $dayData = $dailyData->where('date', $dateStr)->first();
            
            $chartData[] = [
                'date' => $currentDate->format('M j'),
                'spend' => $dayData ? (float) $dayData->daily_spend : 0,
                'revenue' => $dayData ? (float) $dayData->daily_revenue : 0,
                'profit' => $dayData ? (float) $dayData->daily_profit : 0,
            ];
            
            $currentDate->addDay();
        }

        // Calculate percentage changes
        $spendChange = $this->calculatePercentageChange(
            $previousData->total_spend ?? 0, 
            $currentData->total_spend ?? 0
        );
        
        $revenueChange = $this->calculatePercentageChange(
            $previousData->total_revenue ?? 0, 
            $currentData->total_revenue ?? 0
        );
        
        $profitChange = $this->calculatePercentageChange(
            $previousData->total_profit ?? 0, 
            $currentData->total_profit ?? 0
        );

        // Get media buyer profit distribution for pie chart
        $mediaBuyerData = ManualEntry::whereBetween('report_date', [$startDate, $endDate])
            ->join('users', 'manual_entries.media_buyer_id', '=', 'users.id')
            ->selectRaw('
                users.name as media_buyer_name,
                SUM(total_profit) as total_profit
            ')
            ->groupBy('users.id', 'users.name')
            ->orderBy('total_profit', 'desc')
            ->get();

        $totalProfit = $mediaBuyerData->sum('total_profit');
        $pieChartData = $mediaBuyerData->map(function ($item) use ($totalProfit) {
            return [
                'label' => $item->media_buyer_name,
                'value' => $totalProfit > 0 ? round(($item->total_profit / $totalProfit) * 100, 1) : 0,
                'amount' => (float) $item->total_profit,
            ];
        });

        // Website visits data (mock data for now - can be replaced with real data later)
        $websiteVisitsData = [
            'categories' => array_column($chartData, 'date'),
            'series' => [
                [
                    'name' => 'Team A',
                    'data' => array_map(function ($day) {
                        return round($day['revenue'] * 0.6); // Mock calculation
                    }, $chartData)
                ],
                [
                    'name' => 'Team B', 
                    'data' => array_map(function ($day) {
                        return round($day['revenue'] * 0.4); // Mock calculation
                    }, $chartData)
                ]
            ]
        ];

        $response = [
            'summary' => [
                'total_users' => [
                    'value' => (int) ($currentData->total_media_buyers ?? 0),
                    'change' => 0, // Users don't change frequently, so keeping at 0
                    'chart_data' => array_column($chartData, 'revenue') // Using revenue as proxy for user activity
                ],
                'spend' => [
                    'value' => (float) ($currentData->total_spend ?? 0),
                    'change' => $spendChange,
                    'chart_data' => array_column($chartData, 'spend')
                ],
                'revenue' => [
                    'value' => (float) ($currentData->total_revenue ?? 0),
                    'change' => $revenueChange,
                    'chart_data' => array_column($chartData, 'revenue')
                ],
                'profit' => [
                    'value' => (float) ($currentData->total_profit ?? 0),
                    'change' => $profitChange,
                    'chart_data' => array_column($chartData, 'profit')
                ]
            ],
            'charts' => [
                'profit_by_media_buyer' => $pieChartData,
                'website_visits' => $websiteVisitsData
            ],
            'date_range' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'period_days' => $periodDuration + 1
            ]
        ];

        return $this->success($response, 'Analytics data retrieved successfully');
    }

    /**
     * Calculate percentage change between two values
     * 
     * @param float $previousValue
     * @param float $currentValue
     * @return float
     */
    private function calculatePercentageChange(float $previousValue, float $currentValue): float
    {
        if ($previousValue == 0) {
            return $currentValue > 0 ? 100 : 0;
        }
        
        return round((($currentValue - $previousValue) / $previousValue) * 100, 1);
    }

    /**
     * Export financial report as XLSX for selected month with formatting
     * 
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function exportFinancialReport(Request $request)
    {
        $this->authorize('viewAny', ManualEntry::class);

        // Validate request
        $validated = $request->validate([
            'month' => 'nullable|date_format:Y-m', // Format: 2024-10
            'accounts' => 'nullable|array',
            'accounts.*' => 'string|exists:users,name',
        ]);

        // Default to current month if not provided
        $month = $validated['month'] ?? now()->format('Y-m');
        $startDate = $month . '-01 00:00:00';
        $endDate = date('Y-m-t 23:59:59', strtotime($startDate));

        // Get number of days in the month
        $daysInMonth = date('t', strtotime($startDate));

        // Build query
        $query = ManualEntry::with('mediaBuyer:id,name,email')
            ->whereBetween('report_date', [$startDate, $endDate]);

        // Filter by accounts (media buyers) if provided
        if (!empty($validated['accounts'])) {
            $query->whereHas('mediaBuyer', function ($q) use ($validated) {
                $q->whereIn('name', $validated['accounts']);
            });
        }

        $entries = $query->get();

        // Create new Spreadsheet object
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Financial Report');

        // Set up headers
        $headers = ['Account', 'Campaign', 'Monthly'];
        $dayHeaders = [];
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $date = $month . '-' . str_pad($day, 2, '0', STR_PAD_LEFT);
            $dayHeaders[] = $day . '-' . date('M', strtotime($date));
        }

        // Write headers
        $col = 1;
        $sheet->setCellValue('A1', 'Account');
        $sheet->setCellValue('B1', 'Campaign');
        $sheet->setCellValue('C1', 'Monthly');
        
        // Write day headers
        for ($i = 0; $i < count($dayHeaders); $i++) {
            $col = $this->getColumnLetter($i + 4); // D, E, F, G, etc.
            $sheet->setCellValue($col . '1', $dayHeaders[$i]);
        }

        // Write "MTD Actual" under Monthly
        $sheet->setCellValue('C2', 'MTD Actual');
        
        // Write dates under day headers
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $date = $month . '-' . str_pad($day, 2, '0', STR_PAD_LEFT);
            $col = $this->getColumnLetter($day + 3); // D, E, F, G, etc.
            $sheet->setCellValue($col . '2', $date);
        }

        // Apply header formatting
        $this->applyHeaderFormatting($sheet, $daysInMonth);

        $row = 3; // Start from row 3 (after headers)

        // Group entries by media buyer (account)
        $mediaBuyers = $entries->groupBy('media_buyer_id');

        foreach ($mediaBuyers as $mediaBuyerId => $buyerEntries) {
            $mediaBuyer = $buyerEntries->first()->mediaBuyer;
            
            if (!$mediaBuyer) {
                continue;
            }

            // Calculate monthly totals for this account
            $accountMonthly = [
                'cost' => $buyerEntries->sum('total_spend'),
                'revenue' => $buyerEntries->sum('total_revenue'),
                'net' => $buyerEntries->sum('total_profit'),
                'roi' => 0,
            ];

            if ($accountMonthly['cost'] > 0) {
                $accountMonthly['roi'] = ($accountMonthly['net'] / $accountMonthly['cost']) * 100;
            }

            // Calculate daily data for this account
            $accountDaily = [];
            for ($day = 1; $day <= $daysInMonth; $day++) {
                $date = $month . '-' . str_pad($day, 2, '0', STR_PAD_LEFT);
                $dayEntry = $buyerEntries->first(function ($entry) use ($date) {
                    return $entry->report_date->format('Y-m-d') === $date;
                });

                $cost = $dayEntry ? (float) $dayEntry->total_spend : 0;
                $revenue = $dayEntry ? (float) $dayEntry->total_revenue : 0;
                $net = $dayEntry ? (float) $dayEntry->total_profit : 0;
                $roi = $cost > 0 ? ($net / $cost) * 100 : 0;

                $accountDaily[] = [
                    'cost' => $cost,
                    'revenue' => $revenue,
                    'roi' => round($roi, 2),
                    'net' => $net,
                ];
            }

            // Add MTD Actual header for this account
            $sheet->setCellValue('A' . $row, $mediaBuyer->name);
            $sheet->setCellValue('B' . $row, 'MTD Actual');
            $sheet->setCellValue('C' . $row, '');
            $this->applyAccountHeaderFormatting($sheet, $row, $daysInMonth);
            $row++;

            // Add Cost row
            $sheet->setCellValue('A' . $row, $mediaBuyer->name);
            $sheet->setCellValue('B' . $row, 'Cost');
            $sheet->setCellValue('C' . $row, round($accountMonthly['cost'], 2));
            for ($i = 0; $i < count($accountDaily); $i++) {
                $col = $this->getColumnLetter($i + 4);
                $sheet->setCellValue($col . $row, $accountDaily[$i]['cost']);
            }
            $this->applyDataRowFormatting($sheet, $row, $daysInMonth);
            $row++;

            // Add Revenue row
            $sheet->setCellValue('A' . $row, $mediaBuyer->name);
            $sheet->setCellValue('B' . $row, 'Revenue');
            $sheet->setCellValue('C' . $row, round($accountMonthly['revenue'], 2));
            for ($i = 0; $i < count($accountDaily); $i++) {
                $col = $this->getColumnLetter($i + 4);
                $sheet->setCellValue($col . $row, $accountDaily[$i]['revenue']);
            }
            $this->applyDataRowFormatting($sheet, $row, $daysInMonth);
            $row++;

            // Add ROI row
            $sheet->setCellValue('A' . $row, $mediaBuyer->name);
            $sheet->setCellValue('B' . $row, 'ROI');
            $sheet->setCellValue('C' . $row, round($accountMonthly['roi'], 2) . '%');
            for ($i = 0; $i < count($accountDaily); $i++) {
                $col = $this->getColumnLetter($i + 4);
                $sheet->setCellValue($col . $row, $accountDaily[$i]['roi'] . '%');
            }
            $this->applyDataRowFormatting($sheet, $row, $daysInMonth);
            $row++;

            // Add Net row
            $sheet->setCellValue('A' . $row, $mediaBuyer->name);
            $sheet->setCellValue('B' . $row, 'Net');
            $sheet->setCellValue('C' . $row, round($accountMonthly['net'], 2));
            for ($i = 0; $i < count($accountDaily); $i++) {
                $col = $this->getColumnLetter($i + 4);
                $sheet->setCellValue($col . $row, $accountDaily[$i]['net']);
            }
            $this->applyNetRowFormatting($sheet, $row, $daysInMonth, $accountMonthly['net'], $accountDaily);
            $row++;

            // Add empty row for separation
            $row++;
        }

        // Calculate and add totals
        $monthlyTotals = [
            'cost' => $entries->sum('total_spend'),
            'revenue' => $entries->sum('total_revenue'),
            'net' => $entries->sum('total_profit'),
            'roi' => 0,
        ];

        if ($monthlyTotals['cost'] > 0) {
            $monthlyTotals['roi'] = ($monthlyTotals['net'] / $monthlyTotals['cost']) * 100;
        }

        // Calculate daily totals
        $dailyTotals = [];
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $date = $month . '-' . str_pad($day, 2, '0', STR_PAD_LEFT);
            $dayEntries = $entries->filter(function ($entry) use ($date) {
                return $entry->report_date->format('Y-m-d') === $date;
            });

            $cost = $dayEntries->sum('total_spend');
            $revenue = $dayEntries->sum('total_revenue');
            $net = $dayEntries->sum('total_profit');
            $roi = $cost > 0 ? ($net / $cost) * 100 : 0;

            $dailyTotals[] = [
                'cost' => (float) $cost,
                'revenue' => (float) $revenue,
                'roi' => round($roi, 2),
                'net' => (float) $net,
            ];
        }

        // Add Totals - MTD Actual header
        $sheet->setCellValue('A' . $row, 'Totals');
        $sheet->setCellValue('B' . $row, 'MTD Actual');
        $sheet->setCellValue('C' . $row, '');
        $this->applyTotalsHeaderFormatting($sheet, $row, $daysInMonth);
        $row++;

        // Add Totals - Cost row
        $sheet->setCellValue('A' . $row, 'Totals');
        $sheet->setCellValue('B' . $row, 'Cost');
        $sheet->setCellValue('C' . $row, round($monthlyTotals['cost'], 2));
        for ($i = 0; $i < count($dailyTotals); $i++) {
            $col = $this->getColumnLetter($i + 4);
            $sheet->setCellValue($col . $row, $dailyTotals[$i]['cost']);
        }
        $this->applyDataRowFormatting($sheet, $row, $daysInMonth);
        $row++;

        // Add Totals - Revenue row
        $sheet->setCellValue('A' . $row, 'Totals');
        $sheet->setCellValue('B' . $row, 'Revenue');
        $sheet->setCellValue('C' . $row, round($monthlyTotals['revenue'], 2));
        for ($i = 0; $i < count($dailyTotals); $i++) {
            $col = $this->getColumnLetter($i + 4);
            $sheet->setCellValue($col . $row, $dailyTotals[$i]['revenue']);
        }
        $this->applyDataRowFormatting($sheet, $row, $daysInMonth);
        $row++;

        // Add Totals - ROI row
        $sheet->setCellValue('A' . $row, 'Totals');
        $sheet->setCellValue('B' . $row, 'ROI');
        $sheet->setCellValue('C' . $row, round($monthlyTotals['roi'], 2) . '%');
        for ($i = 0; $i < count($dailyTotals); $i++) {
            $col = $this->getColumnLetter($i + 4);
            $sheet->setCellValue($col . $row, $dailyTotals[$i]['roi'] . '%');
        }
        $this->applyDataRowFormatting($sheet, $row, $daysInMonth);
        $row++;

        // Add Totals - Net row
        $sheet->setCellValue('A' . $row, 'Totals');
        $sheet->setCellValue('B' . $row, 'Net');
        $sheet->setCellValue('C' . $row, round($monthlyTotals['net'], 2));
        for ($i = 0; $i < count($dailyTotals); $i++) {
            $col = $this->getColumnLetter($i + 4);
            $sheet->setCellValue($col . $row, $dailyTotals[$i]['net']);
        }
        $this->applyNetRowFormatting($sheet, $row, $daysInMonth, $monthlyTotals['net'], $dailyTotals);

        // Auto-size columns - handle multi-character column names
        $totalColumns = $daysInMonth + 3; // A, B, C + days in month
        for ($col = 1; $col <= $totalColumns; $col++) {
            $column = $this->getColumnLetter($col);
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Generate XLSX file
        $writer = new Xlsx($spreadsheet);
        
        // Set filename
        $filename = 'financial_report_' . $month . '.xlsx';

        // Return XLSX response
        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Convert column number to Excel column letter (1 = A, 27 = AA, etc.)
     */
    private function getColumnLetter($columnNumber)
    {
        $letter = '';
        while ($columnNumber > 0) {
            $temp = ($columnNumber - 1) % 26;
            $letter = chr($temp + 65) . $letter;
            $columnNumber = ($columnNumber - $temp - 1) / 26;
        }
        return $letter;
    }

    /**
     * Apply header formatting
     */
    private function applyHeaderFormatting($sheet, $daysInMonth)
    {
        // Account and Campaign headers (blue background, white text)
        $sheet->getStyle('A1:B1')->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4472C4'], // Blue
            ],
            'font' => [
                'color' => ['rgb' => 'FFFFFF'],
                'bold' => true,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ]);

        // Monthly header (red background, white text)
        $sheet->getStyle('C1')->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'C5504B'], // Red
            ],
            'font' => [
                'color' => ['rgb' => 'FFFFFF'],
                'bold' => true,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ]);

        // Day headers (white background, black text)
        $lastCol = $this->getColumnLetter($daysInMonth + 3);
        $dayRange = 'D1:' . $lastCol . '1';
        $sheet->getStyle($dayRange)->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'FFFFFF'],
            ],
            'font' => [
                'color' => ['rgb' => '000000'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ]);

        // Date headers (green background, white text)
        $lastCol = $this->getColumnLetter($daysInMonth + 3);
        $dateRange = 'C2:' . $lastCol . '2';
        $sheet->getStyle($dateRange)->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '70AD47'], // Green
            ],
            'font' => [
                'color' => ['rgb' => 'FFFFFF'],
                'bold' => true,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ]);
    }

    /**
     * Apply account header formatting
     */
    private function applyAccountHeaderFormatting($sheet, $row, $daysInMonth)
    {
        $lastCol = $this->getColumnLetter($daysInMonth + 3);
        $range = 'A' . $row . ':' . $lastCol . $row;
        $sheet->getStyle($range)->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '70AD47'], // Green
            ],
            'font' => [
                'color' => ['rgb' => 'FFFFFF'],
                'bold' => true,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ]);
    }

    /**
     * Apply totals header formatting
     */
    private function applyTotalsHeaderFormatting($sheet, $row, $daysInMonth)
    {
        $lastCol = $this->getColumnLetter($daysInMonth + 3);
        $range = 'A' . $row . ':' . $lastCol . $row;
        $sheet->getStyle($range)->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4472C4'], // Blue
            ],
            'font' => [
                'color' => ['rgb' => 'FFFFFF'],
                'bold' => true,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ]);
    }

    /**
     * Apply data row formatting
     */
    private function applyDataRowFormatting($sheet, $row, $daysInMonth)
    {
        $lastCol = $this->getColumnLetter($daysInMonth + 3);
        $range = 'A' . $row . ':' . $lastCol . $row;
        $sheet->getStyle($range)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);
    }

    /**
     * Apply Net row formatting with conditional colors
     */
    private function applyNetRowFormatting($sheet, $row, $daysInMonth, $monthlyNet, $dailyData)
    {
        $lastCol = $this->getColumnLetter($daysInMonth + 3);
        $range = 'A' . $row . ':' . $lastCol . $row;
        $sheet->getStyle($range)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        // Apply conditional formatting for Net values
        // Monthly Net
        $monthlyCell = 'C' . $row;
        if ($monthlyNet >= 0) {
            $sheet->getStyle($monthlyCell)->applyFromArray([
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'C6EFCE'], // Light green
                ],
            ]);
        } else {
            $sheet->getStyle($monthlyCell)->applyFromArray([
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'FFC7CE'], // Light red
                ],
            ]);
        }

        // Daily Net values
        for ($i = 0; $i < count($dailyData); $i++) {
            $col = $this->getColumnLetter($i + 4);
            $cell = $col . $row;
            $netValue = $dailyData[$i]['net'];
            
            if ($netValue >= 0) {
                $sheet->getStyle($cell)->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'C6EFCE'], // Light green
                    ],
                ]);
            } else {
                $sheet->getStyle($cell)->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'FFC7CE'], // Light red
                    ],
                ]);
            }
        }
    }
}
