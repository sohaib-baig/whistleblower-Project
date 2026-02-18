<?php

namespace App\Http\Controllers;

use App\Http\Requests\CaseRequest\StoreCaseRequest;
use App\Http\Requests\CaseRequest\SendConfirmationEmailRequest;
use App\Http\Requests\CaseRequest\AuthenticateCaseRequest;
use App\Http\Requests\CaseRequest\StoreAttachmentRequest;
use App\Http\Requests\CaseRequest\StoreNoteRequest;
use App\Http\Requests\CaseRequest\UpdateNoteRequest;
use App\Http\Requests\CaseRequest\StoreChatMessageRequest;
use App\Http\Requests\CaseRequest\StoreChatAudioRequest;
use App\Http\Requests\CaseRequest\StoreChatImageRequest;
use App\Http\Requests\CaseRequest\StoreCaseLogRequest;
use App\Models\CaseModel;
use App\Models\CaseAnswer;
use App\Models\CaseLog;
use App\Models\CaseAttachment;
use App\Models\CaseNote;
use App\Models\CaseChat;
use App\Models\EmailTemplate;
use App\Models\Department;
use App\Models\Severity;
use App\Models\State;
use App\Mail\ReportConfirmationMail;
use App\Mail\ReportUpdateMail;
use App\Mail\NewCaseCreatedAdminMail;
use App\Services\ChatEmailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use Illuminate\Validation\Rule;

class CaseController extends Controller
{
    /**
     * Store a newly created case.
     */
    public function store(StoreCaseRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            // Prepare case data
            // Normalize 'oral' to 'written' since they are now combined (oral is kept for backward compatibility)
            $reportingMedium = $validated['reporting_medium'] === 'oral' ? 'written' : $validated['reporting_medium'];
            
            $caseData = [
                'id' => (string) Str::uuid(),
                'company_id' => $validated['company_id'],
                'reporting_medium' => $reportingMedium,
                'title' => $validated['title'] ?? null,
                'description' => $validated['description'] ?? null,
                'report_type' => $validated['report_type'],
                'personal_details' => $validated['personal_details'] ?? null,
                'case_category_id' => $validated['case_category_id'],
                'case_manager_id' => $validated['case_manager_id'] ?? null,
                'email' => $validated['email'] ?? null,
                'password' => $validated['password'] ?? null,
                'status' => 'new',
            ];

            // If reporting medium is physical_meeting, store meeting address in description or personal_details
            if ($reportingMedium === 'physical_meeting' && isset($validated['meeting_address'])) {
                $caseData['description'] = $validated['meeting_address'];
            }

            // Create the case
            $case = CaseModel::create($caseData);

            // Store answers
            if (isset($validated['answers']) && is_array($validated['answers'])) {
                foreach ($validated['answers'] as $answerData) {
                    CaseAnswer::create([
                        'id' => (string) Str::uuid(),
                        'case_id' => $case->id,
                        'question_id' => $answerData['question_id'],
                        'answer' => $answerData['answer'] ?? null,
                    ]);
                }
            }

            // Create log entry for case creation
            CaseLog::create([
                'id' => (string) Str::uuid(),
                'case_id' => $case->id,
                'created_by' => $validated['company_id'], // Using company_id as created_by for public case creation
                'action_type' => 'case created',
                'action_value' => 'Case has been created',
            ]);

            // Load relationships for notifications
            $case->load(['company', 'caseManager']);

            // Send notifications
            try {
                $notificationService = app(\App\Services\NotificationService::class);
                
                // Notify admin about anonymous case creation
                $notificationService->notifyAnonymousCaseCreated($case);
                
                // Notify company if case manager is assigned
                if ($case->case_manager_id) {
                    $notificationService->notifyCompanyCaseCreated($case);
                }
                
                // Notify case manager if assigned
                if ($case->case_manager_id) {
                    $notificationService->notifyCaseManagerCaseCreated($case);
                }

                $this->sendNewCaseCreatedAdminEmail($case);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Failed to send case creation notifications', [
                    'case_id' => $case->id,
                    'error' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'status' => true,
                'message' => 'Case created successfully.',
                'data' => [
                    'case_id' => $case->id,
                    'email' => $case->email,
                    'password' => $case->password,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to create case.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function sendNewCaseCreatedAdminEmail(CaseModel $case): void
    {
        try {
            $template = EmailTemplate::query()
                ->where('name', 'New Case Created')
                ->where('status', 'active')
                ->first();

            if (!$template) {
                Log::warning('New Case Created template not found or inactive', [
                    'case_id' => $case->id,
                ]);
                return;
            }

            $case->loadMissing('company', 'caseManager', 'category');

            $companyName = $case->company?->company_name ?? $case->company?->name ?? '';
            $caseHandler = $case->caseManager?->name ?? 'Not Assigned';
            $caseType = $case->report_type ? $this->formatCaseStatus($case->report_type) : '';
            $caseCategory = $case->category?->name ?? '';

            $replacements = [
                '[TYPE]' => $caseType,
                '[type]' => $caseType,
                '{{type}}' => $caseType,
                '[CATEGORY]' => $caseCategory,
                '[category]' => $caseCategory,
                '{{category}}' => $caseCategory,
                '[COMPANY]' => $companyName,
                '[company]' => $companyName,
                '{{company}}' => $companyName,
                '[CASE HANDLER]' => $caseHandler,
                '[case_handler]' => $caseHandler,
                '{{case_handler}}' => $caseHandler,
            ];

            $subject = strtr($template->subject, $replacements);
            $content = strtr($template->content, $replacements);

            $admins = User::role('admin')->whereNotNull('email')->get();

            if ($admins->isEmpty()) {
                Log::warning('No admin recipients for new case created email', [
                    'case_id' => $case->id,
                ]);
                return;
            }

            foreach ($admins as $admin) {
                try {
                    Mail::to($admin->email)->queue(
                        new NewCaseCreatedAdminMail($subject, $content)
                    );
                } catch (\Throwable $mailException) {
                    Log::error('Failed to send new case created email to admin', [
                        'case_id' => $case->id,
                        'admin_id' => $admin->id,
                        'admin_email' => $admin->email,
                        'error' => $mailException->getMessage(),
                    ]);
                }
            }
        } catch (\Throwable $e) {
            Log::error('Failed to send New Case Created admin emails', [
                'case_id' => $case->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send report update emails when a case is closed.
     */
    private function sendReportUpdateEmails(CaseModel $case, string $oldStatus): void
    {
        try {
            $template = EmailTemplate::query()
                ->where('name', 'Report Update Email')
                ->where('status', 'active')
                ->first();

            if (!$template) {
                Log::warning('Report Update Email template not found or inactive', [
                    'case_id' => $case->id,
                ]);
                return;
            }

            $case->loadMissing('company', 'caseManager');

            $oldStatusFormatted = $this->formatCaseStatus($oldStatus);

            // Send to anonymous reporter (if email exists)
            if (!empty($case->email)) {
                $recipientName = $this->resolveCaseReporterName($case);
                $content = $this->replaceReportUpdatePlaceholders(
                    $template->content,
                    $case,
                    $recipientName,
                    $case->email,
                    $oldStatusFormatted,
                    'anonymous'
                );
                $subject = $this->replaceReportUpdatePlaceholders(
                    $template->subject,
                    $case,
                    $recipientName,
                    $case->email,
                    $oldStatusFormatted,
                    'anonymous'
                );

                try {
                    Mail::to($case->email)->queue(new ReportUpdateMail($subject, $content));
                } catch (\Throwable $mailException) {
                    Log::error('Failed to send report update email to reporter', [
                        'case_id' => $case->id,
                        'recipient_email' => $case->email,
                        'error' => $mailException->getMessage(),
                    ]);
                }
            } else {
                Log::info('Case reporter email missing, skipping report update email', [
                    'case_id' => $case->id,
                ]);
            }

            // Send to all admins
            $adminRecipients = User::role('admin')
                ->whereNotNull('email')
                ->get();

            if ($adminRecipients->isEmpty()) {
                Log::warning('No admin recipients found for report update email', [
                    'case_id' => $case->id,
                ]);
                return;
            }

            foreach ($adminRecipients as $admin) {
                $recipientName = $admin->name ?: 'Admin';
                $adminContent = $this->replaceReportUpdatePlaceholders(
                    $template->content,
                    $case,
                    $recipientName,
                    $admin->email,
                    $oldStatusFormatted,
                    'admin'
                );
                $adminSubject = $this->replaceReportUpdatePlaceholders(
                    $template->subject,
                    $case,
                    $recipientName,
                    $admin->email,
                    $oldStatusFormatted,
                    'admin'
                );

                try {
                    Mail::to($admin->email)->queue(new ReportUpdateMail($adminSubject, $adminContent));
                } catch (\Throwable $mailException) {
                    Log::error('Failed to send report update email to admin', [
                        'case_id' => $case->id,
                        'admin_id' => $admin->id,
                        'admin_email' => $admin->email,
                        'error' => $mailException->getMessage(),
                    ]);
                }
            }
        } catch (\Throwable $e) {
            Log::error('Failed to process report update emails', [
                'case_id' => $case->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Replace placeholders for report update emails.
     */
    private function replaceReportUpdatePlaceholders(
        string $content,
        CaseModel $case,
        string $recipientName,
        ?string $recipientEmail,
        string $oldStatusFormatted,
        string $recipientType = 'anonymous'
    ): string {
        $caseTitle = $this->resolveCaseTitle($case);
        $caseDescription = $this->resolveCaseDescription($case);
        $companyName = $case->company?->company_name ?? $case->company?->name ?? '';
        $caseManagerName = $case->caseManager?->name ?? '';
        $newStatusFormatted = $this->formatCaseStatus($case->status);
        $caseId = $case->id;
        $caseType = $case->report_type ? $this->formatCaseStatus($case->report_type) : '';
        $caseCategoryName = $case->category?->name ?? '';
        $createdDateTime = $case->updated_at
            ? $case->updated_at->format('Y-m-d H:i:s')
            : ($case->created_at ? $case->created_at->format('Y-m-d H:i:s') : '');
        $casePassword = $case->password ?? '';
        $reportingMedium = $case->reporting_medium ? $this->formatCaseStatus($case->reporting_medium) : '';
        $caseSubject = $case->subject ?? $caseTitle;
        $openStateDeadline = $case->open_deadline_time ? $case->open_deadline_time->format('Y-m-d H:i:s') : '';

        $frontendBase = config('app.frontend_url') ?? env('FRONTEND_URL') ?? null;
        if (is_string($frontendBase) && trim($frontendBase) !== '') {
            $frontendBase = rtrim($frontendBase, '/');
        } else {
            $frontendBase = rtrim((string) config('app.url', url('/')), '/');
        }

        $adminPath = $frontendBase . '/dashboard/case/' . $caseId . '/details-tabs/report-setting';
        $publicPath = $frontendBase . '/public/cases/' . $caseId;
        $caseLink = $recipientType === 'admin' ? $adminPath : $publicPath;

        $replacements = [
            '[Username]' => $recipientName,
            '[username]' => $recipientName,
            '{{username}}' => $recipientName,
            '{{name}}' => $recipientName,
            '{{Name}}' => $recipientName,
            '[Email]' => $recipientEmail ?? '',
            '[email]' => $recipientEmail ?? '',
            '{{email}}' => $recipientEmail ?? '',
            '[Case Title]' => $caseTitle,
            '[case_title]' => $caseTitle,
            '{{case_title}}' => $caseTitle,
            '{{Case Title}}' => $caseTitle,
            '[Case Status]' => $newStatusFormatted,
            '[case_status]' => $newStatusFormatted,
            '{{case_status}}' => $newStatusFormatted,
            '{{Case Status}}' => $newStatusFormatted,
            '[Status]' => $newStatusFormatted,
            '[status]' => $newStatusFormatted,
            '{{status}}' => $newStatusFormatted,
            '[Previous Status]' => $oldStatusFormatted,
            '[previous_status]' => $oldStatusFormatted,
            '{{previous_status}}' => $oldStatusFormatted,
            '[RECIPIENT]' => $recipientName,
            '[recipient]' => $recipientName,
            '{{recipient}}' => $recipientName,
            '{{Recipient}}' => $recipientName,
            '[UserName]' => $recipientName,
            '[Case ID]' => $caseId,
            '[case_id]' => $caseId,
            '{{case_id}}' => $caseId,
            '[Company Name]' => $companyName,
            '[company_name]' => $companyName,
            '{{company_name}}' => $companyName,
            '{{Company Name}}' => $companyName,
            '[Case Manager Name]' => $caseManagerName,
            '[case_manager_name]' => $caseManagerName,
            '{{case_manager_name}}' => $caseManagerName,
            '{{Case Manager Name}}' => $caseManagerName,
            '[Case Link]' => $caseLink,
            '[case_link]' => $caseLink,
            '{{case_link}}' => $caseLink,
            '{{Case Link}}' => $caseLink,
            '[TYPE]' => $caseType,
            '[type]' => $caseType,
            '{{type}}' => $caseType,
            '[CATEGORY]' => $caseCategoryName,
            '[category]' => $caseCategoryName,
            '{{category}}' => $caseCategoryName,
            '[CASE HANDLER]' => $caseManagerName,
            '[case_handler]' => $caseManagerName,
            '{{case_handler}}' => $caseManagerName,
            '[CREATED DATE & TIME]' => $createdDateTime,
            '[CREATED DATE &amp; TIME]' => $createdDateTime,
            '[Created Date & Time]' => $createdDateTime,
            '[Created Date &amp; Time]' => $createdDateTime,
            '[created_date_time]' => $createdDateTime,
            '[created date & time]' => $createdDateTime,
            '[created date &amp; time]' => $createdDateTime,
            '{{created_date_time}}' => $createdDateTime,
            '{{Created Date & Time}}' => $createdDateTime,
            '{{Created Date &amp; Time}}' => $createdDateTime,
            '{{CREATED DATE & TIME}}' => $createdDateTime,
            '{{CREATED DATE &amp; TIME}}' => $createdDateTime,
            '{{created date & time}}' => $createdDateTime,
            '{{created date &amp; time}}' => $createdDateTime,
            '%created_date_time%' => $createdDateTime,
            '%created date & time%' => $createdDateTime,
            '%created date &amp; time%' => $createdDateTime,
            '[DESCRIPTION]' => $caseDescription,
            '[description]' => $caseDescription,
            '{{description}}' => $caseDescription,
            '[PASSWORD]' => $casePassword,
            '[password]' => $casePassword,
            '{{password}}' => $casePassword,
            '[ID]' => $caseId,
            '[id]' => $caseId,
            '{{id}}' => $caseId,
            '[MEDIUM]' => $reportingMedium,
            '[medium]' => $reportingMedium,
            '{{medium}}' => $reportingMedium,
            '[SUBJECT]' => $caseSubject,
            '[subject]' => $caseSubject,
            '{{subject}}' => $caseSubject,
            '[OPEN STATE DEADLINEL]' => $openStateDeadline,
            '[Open State Deadlinel]' => $openStateDeadline,
            '[open_state_deadlinel]' => $openStateDeadline,
            '[open state deadlinel]' => $openStateDeadline,
            '{{open_state_deadlinel}}' => $openStateDeadline,
            '{{Open State Deadlinel}}' => $openStateDeadline,
            '{{OPEN STATE DEADLINEL}}' => $openStateDeadline,
            '{{open state deadlinel}}' => $openStateDeadline,
        ];

        $result = str_replace(array_keys($replacements), array_values($replacements), $content);

        $regexReplacements = [
            '/\[\s*created\s+date\s*&(?:amp;)?\s*time\s*\]/i' => $createdDateTime,
            '/\{\{\s*created\s+date\s*&(?:amp;)?\s*time\s*\}\}/i' => $createdDateTime,
            '/%\s*created\s+date\s*&(?:amp;)?\s*time\s*%/i' => $createdDateTime,
            '/\[\s*open\s+state\s+deadlinel\s*\]/i' => $openStateDeadline,
            '/\{\{\s*open\s+state\s+deadlinel\s*\}\}/i' => $openStateDeadline,
        ];

        foreach ($regexReplacements as $pattern => $replacement) {
            $result = preg_replace($pattern, $replacement, $result);
        }

        return $result;
    }

    private function sendCaseChatNotificationEmails(CaseModel $case, CaseChat $chat, ?User $sender = null): void
    {
        $chatEmailService = app(ChatEmailService::class);

        $case->loadMissing('caseManager');

        $caseManager = $case->caseManager;
        $caseManagerName = $caseManager?->name ?? 'Case Manager';
        $caseManagerEmail = $caseManager?->email;

        $reporterName = $this->resolveCaseReporterName($case);
        $reporterEmail = $case->email;

        if ($sender === null && $chat->created_by) {
            $sender = User::find($chat->created_by);
        }

        $senderName = $sender?->name ?? ($chat->created_by === null ? $reporterName : 'User');
        if (trim((string) $senderName) === '') {
            $senderName = 'User';
        }

        $chatLink = $this->buildDashboardChatLink($case->id, 'chat');
        $messageContent = $this->resolveChatMessageContent($chat);

        $deliveries = [];

        if ($caseManagerEmail) {
            $deliveries[] = [
                'recipient_name' => $caseManagerName,
                'recipient_email' => $caseManagerEmail,
                'is_sender' => $sender && $caseManager && $sender->id === $caseManager->id,
                'other_name' => $reporterName,
            ];
        }

        if ($reporterEmail) {
            $deliveries[] = [
                'recipient_name' => $reporterName,
                'recipient_email' => $reporterEmail,
                'is_sender' => $chat->created_by === null,
                'other_name' => $caseManagerName,
            ];
        }

        $sentEmails = [];

        foreach ($deliveries as $delivery) {
            $email = strtolower(trim($delivery['recipient_email'] ?? ''));

            if ($email === '' || array_key_exists($email, $sentEmails)) {
                continue;
            }

            $sentEmails[$email] = true;

            $recipientName = $delivery['recipient_name'] ?? 'User';
            $otherName = $delivery['other_name'] ?? 'User';

            $username1 = $senderName;
            $username2 = $delivery['is_sender'] ? $otherName : $recipientName;

            $chatEmailService->send($username1, $username2, $delivery['recipient_email'], $chatLink, $messageContent);
        }
    }

    /**
     * Convert PHP ini size string (e.g., "10M", "2G") to bytes
     */
    private function convertToBytes(string $size): int
    {
        $size = trim($size);
        $last = strtolower($size[strlen($size) - 1]);
        $value = (int) $size;
        
        switch ($last) {
            case 'g':
                $value *= 1024;
                // no break
            case 'm':
                $value *= 1024;
                // no break
            case 'k':
                $value *= 1024;
        }
        
        return $value;
    }

    private function buildDashboardChatLink(string $caseId, string $tab): string
    {
        $base = config('app.frontend_url') ?? env('FRONTEND_URL') ?? config('app.url');
        $base = rtrim((string) $base, '/');

        return $base . '/dashboard/case/' . $caseId . '/details-tabs/' . $tab;
    }

    private function resolveChatMessageContent(CaseChat $chat): string
    {
        return match ($chat->type) {
            'text' => (string) $chat->message,
            'audio' => 'Audio message: ' . Storage::url($chat->message),
            'image' => 'Image message: ' . Storage::url($chat->message),
            default => 'New chat message received.',
        };
    }

    private function resolveCaseReporterName(CaseModel $case): string
    {
        $details = $case->personal_details;
        if (is_array($details)) {
            foreach (['name', 'full_name', 'fullName', 'first_name', 'firstName'] as $key) {
                if (!empty($details[$key])) {
                    return (string) $details[$key];
                }
            }
        }

        if (is_string($details) && trim($details) !== '') {
            return $details;
        }

        return 'User';
    }

    private function resolveCaseTitle(CaseModel $case): string
    {
        $title = $case->title;

        if (is_array($title)) {
            foreach (['en', 'default'] as $preferred) {
                if (!empty($title[$preferred])) {
                    return (string) $title[$preferred];
                }
            }

            $first = reset($title);
            if ($first) {
                return (string) $first;
            }
        }

        if (is_string($title)) {
            return $title;
        }

        return 'Case';
    }

    private function resolveCaseDescription(CaseModel $case): string
    {
        $description = $case->description;

        if (is_array($description)) {
            foreach (['en', 'default'] as $preferred) {
                if (!empty($description[$preferred])) {
                    return (string) $description[$preferred];
                }
            }

            $first = reset($description);
            if ($first) {
                return (string) $first;
            }
        }

        if (is_string($description)) {
            return $description;
        }

        return '';
    }

    private function formatCaseStatus(?string $status): string
    {
        if (!$status) {
            return '';
        }

        $normalized = str_replace(['_', '-'], ' ', (string) $status);
        return Str::title($normalized);
    }

    /**
     * Authenticate case by password (public endpoint).
     */
    public function authenticateByPassword(AuthenticateCaseRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            
            $companyId = $validated['company_id'];
            $password = $validated['password'];
            
            // Find case with matching company_id and password
            $case = CaseModel::where('company_id', $companyId)
                ->where('password', $password)
                ->first();
            
            if (!$case) {
                return response()->json([
                    'status' => false,
                    'message' => 'Invalid password or case not found.',
                ], 401);
            }
            
            return response()->json([
                'status' => true,
                'message' => 'Authentication successful.',
                'data' => [
                    'case_id' => $case->id,
                    'company_id' => $case->company_id,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Authentication failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a case attachment (supports both public and authenticated endpoints).
     */
    public function storeAttachment(StoreAttachmentRequest $request): JsonResponse
    {
        try {
            // Check PHP upload limits and provide helpful error if too low
            $postMaxSize = ini_get('post_max_size');
            $uploadMaxSize = ini_get('upload_max_filesize');
            
            // Convert to bytes for comparison
            $postMaxBytes = $this->convertToBytes($postMaxSize);
            $uploadMaxBytes = $this->convertToBytes($uploadMaxSize);
            
            if ($postMaxBytes < 12 * 1024 * 1024 || $uploadMaxBytes < 10 * 1024 * 1024) {
                Log::warning('PHP upload limits are too low', [
                    'post_max_size' => $postMaxSize,
                    'upload_max_filesize' => $uploadMaxSize,
                ]);
            }
            
            $user = auth()->user(); // Will be null for public endpoints, user object for authenticated
            
            // Log request details for debugging
            Log::info('File upload request received', [
                'has_file' => $request->hasFile('file'),
                'files_received' => !empty($_FILES),
                'post_max_size' => $postMaxSize,
                'upload_max_filesize' => $uploadMaxSize,
                'content_length' => $_SERVER['CONTENT_LENGTH'] ?? 'not set',
                'file_upload_errors' => $_FILES['file']['error'] ?? 'no file in $_FILES',
            ]);
            
            // Validate request - this will catch file upload errors
            try {
                $validated = $request->validated();
            } catch (\Illuminate\Validation\ValidationException $e) {
                // Check if it's a file upload error
                $errors = $e->errors();
                if (isset($errors['file'])) {
                    // Add helpful diagnostic information
                    $fileErrors = $errors['file'];
                    $diagnosticUrl = url('/check-upload-limits.php');
                    
                    return response()->json([
                        'status' => false,
                        'message' => 'File upload failed. Please check PHP upload limits.',
                        'data' => [
                            'errors' => [
                                'file' => array_merge($fileErrors, [
                                    "Check your PHP settings at: {$diagnosticUrl}",
                                    "Current upload_max_filesize: {$uploadMaxSize}",
                                    "Current post_max_size: {$postMaxSize}",
                                ]),
                            ],
                            'diagnostic_url' => $diagnosticUrl,
                            'php_ini_location' => php_ini_loaded_file(),
                        ],
                    ], 422);
                }
                throw $e;
            }
            
            $file = $request->file('file');
            
            if (!$file) {
                // Check if the issue is PHP upload limits (post_max_size exceeded)
                // When post_max_size is exceeded, $_FILES and $_POST are empty
                $contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int)$_SERVER['CONTENT_LENGTH'] : 0;
                $postMaxBytes = $this->returnBytes($postMaxSize);
                
                if (empty($_FILES) && empty($_POST) && isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST') {
                    $phpIniFile = php_ini_loaded_file();
                    $diagnosticUrl = url('/check-upload-limits.php');
                    
                    return response()->json([
                        'status' => false,
                        'message' => 'The uploaded file exceeds PHP\'s post_max_size limit. The request size (' . $this->formatBytes($contentLength) . ') exceeds the current limit (' . $postMaxSize . ').',
                        'data' => [
                            'error_type' => 'post_max_size_exceeded',
                            'current_post_max_size' => $postMaxSize,
                            'current_post_max_bytes' => $postMaxBytes,
                            'current_upload_max_filesize' => $uploadMaxSize,
                            'request_content_length' => $contentLength,
                            'request_content_length_formatted' => $this->formatBytes($contentLength),
                            'php_ini_file' => $phpIniFile,
                            'diagnostic_url' => $diagnosticUrl,
                            'fix_instructions' => [
                                'For MAMP users:' => [
                                    '1. Open MAMP application',
                                    '2. Click "File" > "Edit Template" > "PHP" > "php' . PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION . '.ini"',
                                    '3. Find the line: post_max_size = 8M',
                                    '4. Change it to: post_max_size = 24M',
                                    '5. Also update: upload_max_filesize = 20M',
                                    '6. Save the file and restart MAMP servers',
                                    '',
                                    'Or edit directly: ' . ($phpIniFile ?: '/Applications/MAMP/bin/php/php' . PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION . '/conf/php.ini'),
                                ],
                                'Required settings:' => [
                                    'post_max_size = 24M (currently: ' . $postMaxSize . ')',
                                    'upload_max_filesize = 20M (currently: ' . $uploadMaxSize . ')',
                                    'memory_limit = 256M',
                                ],
                            ],
                        ],
                    ], 413);
                }
                
                // Check for PHP upload errors
                if (isset($_FILES['file']['error']) && $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                    $error = $_FILES['file']['error'];
                    $errorMessages = [
                        UPLOAD_ERR_INI_SIZE => 'The file exceeds the upload_max_filesize directive in php.ini.',
                        UPLOAD_ERR_FORM_SIZE => 'The file exceeds the MAX_FILE_SIZE directive.',
                        UPLOAD_ERR_PARTIAL => 'The file was only partially uploaded.',
                        UPLOAD_ERR_NO_FILE => 'No file was uploaded.',
                        UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder.',
                        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
                        UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload.',
                    ];
                    
                    return response()->json([
                        'status' => false,
                        'message' => $errorMessages[$error] ?? 'File upload failed (error code: ' . $error . ')',
                        'data' => [
                            'upload_error_code' => $error,
                            'current_post_max_size' => $postMaxSize,
                            'current_upload_max_filesize' => $uploadMaxSize,
                        ],
                    ], 400);
                }
                
                return response()->json([
                    'status' => false,
                    'message' => 'File is required.',
                ], 400);
            }

            // Get file extension for attachment_type
            $extension = strtolower($file->getClientOriginalExtension());
            
            // Generate unique filename
            $filename = time() . '_' . Str::random(10) . '.' . $extension;
            
            // Store file in storage/app/public/case-attachments
            $path = $file->storeAs('case-attachments', $filename, 'public');
            
            // Create attachment record
            $attachment = CaseAttachment::create([
                'id' => (string) Str::uuid(),
                'case_id' => $validated['case_id'],
                'created_by' => $user ? $user->id : null, // Set user ID if authenticated, null for public
                'attachment_type' => $extension,
                'attachment_name' => $validated['attachment_name'],
                'attachment_path' => $path,
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Document uploaded successfully.',
                'data' => [
                    'id' => $attachment->id,
                    'attachment_name' => $attachment->attachment_name,
                    'attachment_type' => $attachment->attachment_type,
                    'attachment_path' => Storage::url($attachment->attachment_path),
                    'created_at' => $attachment->created_at ? $attachment->created_at->format('d-m-Y h:i A') : null,
                ],
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed.',
                'data' => [
                    'errors' => $e->errors(),
                ],
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to upload document.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get case attachments by case ID (supports both public and authenticated endpoints).
     * Visibility rules:
     * - Public/Anonymous users: Only see documents where created_by is null (anonymous documents)
     * - Case Managers: See anonymous documents (created_by = null) + their own documents (created_by = their user ID)
     * - Admin: See all documents (no filtering)
     * - Company users: See all documents (no filtering)
     */
    public function getCaseAttachments(Request $request, string $caseId): JsonResponse
    {
        try {
            $user = auth()->user();
            
            // Check if this is a public route by checking the request path
            $isPublicRoute = str_contains($request->path(), '/public/cases/');
            
            // Build query based on user role
            $query = CaseAttachment::where('case_id', $caseId);
            
            // If it's a public route OR user is not authenticated, show only anonymous documents
            if ($isPublicRoute || !$user) {
                // Public/Anonymous users (via /public/cases/{caseId}/attachments): 
                // Only see anonymous documents (created_by = null)
                // Case manager documents (created_by != null) are NOT visible
                $query->whereNull('created_by');
            } elseif ($user->role === 'case_manager') {
                // Case managers see: anonymous documents OR their own documents
                // They do NOT see documents created by other case managers
                $query->where(function ($q) use ($user) {
                    $q->whereNull('created_by')  // Anonymous documents
                      ->orWhere('created_by', $user->id);  // Their own documents
                });
            }
            // Admin and company users see all documents (no additional filter)
            
            $attachments = $query->orderBy('created_at', 'desc')->get();

            $attachmentsData = $attachments->map(function ($attachment) {
                return [
                    'id' => $attachment->id,
                    'attachment_name' => $attachment->attachment_name,
                    'attachment_type' => $attachment->attachment_type,
                    'attachment_path' => Storage::url($attachment->attachment_path),
                    'created_at' => $attachment->created_at ? $attachment->created_at->format('d-m-Y h:i A') : null,
                    'created_by' => $attachment->created_by, // Include for reference
                ];
            });

            return response()->json([
                'status' => true,
                'message' => 'Attachments retrieved successfully.',
                'data' => $attachmentsData,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to retrieve attachments.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a case attachment (supports both public and authenticated endpoints).
     * Delete rules:
     * - Public/Anonymous users: Can only delete anonymous documents (created_by = null)
     * - Case Managers: Can delete anonymous documents OR their own documents
     * - Admin: Can delete all documents
     */
    public function deleteAttachment(string $attachmentId): JsonResponse
    {
        try {
            $user = auth()->user();
            $attachment = CaseAttachment::find($attachmentId);
            
            if (!$attachment) {
                return response()->json([
                    'status' => false,
                    'message' => 'Attachment not found.',
                ], 404);
            }

            // Check if user has permission to delete this attachment
            if (!$user) {
                // Public users can only delete anonymous documents
                if ($attachment->created_by !== null) {
                    return response()->json([
                        'status' => false,
                        'message' => 'You do not have permission to delete this document.',
                    ], 403);
                }
            } elseif ($user->role === 'case_manager') {
                // Case managers can delete anonymous documents OR their own documents
                if ($attachment->created_by !== null && $attachment->created_by !== $user->id) {
                    return response()->json([
                        'status' => false,
                        'message' => 'You can only delete documents you created or anonymous documents.',
                    ], 403);
                }
            }
            // Admin and company users can delete any document (no restriction)

            // Delete file from storage
            if ($attachment->attachment_path && Storage::disk('public')->exists($attachment->attachment_path)) {
                Storage::disk('public')->delete($attachment->attachment_path);
            }

            // Delete attachment record
            $attachment->delete();

            return response()->json([
                'status' => true,
                'message' => 'Document deleted successfully.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to delete document.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get case details by case ID (public endpoint).
     */
    public function getCaseDetails(string $caseId): JsonResponse
    {
        try {
            $case = CaseModel::with([
                    'company',
                    'category',
                    'caseManager',
                    'department',
                    'severity',
                    'state',
                    'answers.question'
                ])
                ->find($caseId);
            
            if (!$case) {
                return response()->json([
                    'status' => false,
                    'message' => 'Case not found.',
                ], 404);
            }
            
            // Prepare contextual data
            $language = $this->getLanguageFromRequest(request());
            $hiddenFields = is_array($case->hidden_fields) ? array_values(array_unique($case->hidden_fields)) : [];
            $isAuthenticated = auth()->check();
            
            // Get translated case fields
            $translatedTitle = $case->getTranslated('title', $language);
            $translatedDescription = $case->getTranslated('description', $language);
            
            // Format the response
            $response = [
                'id' => $case->id,
                'case_id' => $case->id,
                'company_id' => $case->company_id,
                'title' => $translatedTitle ?? $case->title,
                'subject' => $translatedTitle ?? $case->title,
                'description' => $translatedDescription ?? $case->description,
                'reporting_medium' => $case->reporting_medium,
                'report_type' => $case->report_type,
                'status' => $case->status,
                'category' => $case->category ? $case->category->name : null,
                'category_id' => $case->case_category_id,
                'department_id' => $case->department?->id,
                'department_name' => $case->department?->name,
                'severity_id' => $case->severity?->id,
                'severity_name' => $case->severity?->name,
                'state_id' => $case->state?->id,
                'state_name' => $case->state?->name,
                'case_manager_id' => $case->case_manager_id,
                'case_manager_name' => $case->caseManager ? $case->caseManager->name : null,
                'personal_details' => $case->personal_details,
                'email' => $case->email,
                'created_at' => $case->created_at ? $case->created_at->format('Y-m-d H:i A') : null,
                'date_time' => $case->created_at ? $case->created_at->format('d-m-Y h:i A') : null,
                'updated_at' => $case->updated_at ? $case->updated_at->format('Y-m-d H:i:s') : null,
                'open_deadline_time' => $case->open_deadline_time ? $case->open_deadline_time->format('d-m-Y h:i A') : null,
                'close_deadline_time' => $case->close_deadline_time ? $case->close_deadline_time->format('d-m-Y h:i A') : null,
                'open_deadline_number' => $case->open_deadline_number ?? null,
                'open_deadline_period' => $case->open_deadline_period ?? null,
                'close_deadline_number' => $case->close_deadline_number ?? null,
                'close_deadline_period' => $case->close_deadline_period ?? null,
                'other_report_link' => $case->other_report_link ?? null,
                'automatic_delete' => $case->automatic_delete ?? null,
                'answers' => $case->answers->map(function ($answer) use ($language) {
                    // Translate question name if question exists
                    $questionName = null;
                    if ($answer->question) {
                        $questionName = $answer->question->getTranslated('name', $language);
                    }
                    
                    return [
                        'question_id' => $answer->question_id,
                        'question_name' => $questionName ?? ($answer->question ? $answer->question->name : null),
                        'answer' => $answer->answer,
                    ];
                }),
                'hidden_fields' => $hiddenFields,
            ];

            $response = $this->applyHiddenFieldsToResponse($response, $hiddenFields, $isAuthenticated);
            
            return response()->json([
                'status' => true,
                'message' => 'Case details retrieved successfully.',
                'data' => $response,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to retrieve case details.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get language from request
     */
    private function getLanguageFromRequest(Request $request): string
    {
        // Check Accept-Language header
        $acceptLanguage = $request->header('Accept-Language');
        if ($acceptLanguage) {
            // Parse Accept-Language header (e.g., "sv-SE,sv;q=0.9,en;q=0.8" -> "sv")
            $languages = explode(',', $acceptLanguage);
            if (!empty($languages[0])) {
                $langCode = trim(explode(';', $languages[0])[0]);
                $langCode = strtolower(explode('-', $langCode)[0]); // Extract base language code
                
                // Supported languages
                $supportedLanguages = ['sv', 'en', 'no', 'da', 'fi', 'de', 'fr'];
                if (in_array($langCode, $supportedLanguages)) {
                    return $langCode;
                }
            }
        }
        
        return 'en'; // Default to English
    }

    /**
     * Hideable fields definition for case details
     */
    private function getHideableCaseFields(): array
    {
        return [
            'dateTime',
            'subject',
            'description',
            'files',
            'reportingChannel',
            'category',
            'assignedTo',
            'reportingMedium',
            'department',
            'severity',
            'state',
        ];
    }

    /**
     * Apply hidden field rules to response for unauthenticated users
     */
    private function applyHiddenFieldsToResponse(array $response, array $hiddenFields, bool $isAuthenticated): array
    {
        if ($isAuthenticated || empty($hiddenFields)) {
            return $response;
        }

        foreach ($hiddenFields as $field) {
            switch ($field) {
                case 'dateTime':
                    $response['date_time'] = null;
                    $response['created_at'] = null;
                    break;
                case 'subject':
                    $response['subject'] = null;
                    $response['title'] = null;
                    break;
                case 'description':
                    $response['description'] = null;
                    break;
                case 'category':
                    $response['category'] = null;
                    $response['category_id'] = null;
                    break;
                case 'reportingMedium':
                    $response['reporting_medium'] = null;
                    break;
                case 'reportingChannel':
                    $response['reporting_channel'] = null;
                    break;
                case 'assignedTo':
                    $response['case_manager_id'] = null;
                    $response['case_manager_name'] = null;
                    break;
                case 'department':
                    $response['department_id'] = null;
                    $response['department_name'] = null;
                    break;
                case 'severity':
                    $response['severity_id'] = null;
                    $response['severity_name'] = null;
                    break;
                case 'state':
                    $response['state_id'] = null;
                    $response['state_name'] = null;
                    break;
                case 'files':
                    $response['attachments'] = [];
                    break;
            }
        }

        return $response;
    }

    /**
     * Send report confirmation email.
     */
    public function sendConfirmationEmail(SendConfirmationEmailRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            
            $caseId = $validated['case_id'];
            $email = $validated['email'];
            
            // Get the case with company relationship
            $case = CaseModel::with('company')->findOrFail($caseId);
            
            // Get the email template by user language (fallback to English)
            // Try to get user language from case or company
            $userLanguage = 'en';
            if ($case->company && $case->company->user) {
                $userLanguage = $case->company->user->user_language ?? 'en';
            }
            
            $template = EmailTemplate::getByNameAndLanguage('Report Confirmation', $userLanguage, true);
            
            if (!$template) {
                return response()->json([
                    'status' => false,
                    'message' => 'Email template not found.',
                ], 404);
            }
            
            // Get username from personal details or use a default
            $username = 'User';
            if ($case->personal_details && isset($case->personal_details['name'])) {
                $username = $case->personal_details['name'];
            } elseif ($case->company) {
                $username = $case->company->name;
            }
            
            // Send the email
            Mail::to($email)->queue(new ReportConfirmationMail(
                $username,
                $case->password ?? '',
                $template->content,
                $template->subject
            ));
            
            // Update case email if it wasn't set before
            if (!$case->email) {
                $case->email = $email;
                $case->save();
            }
            
            return response()->json([
                'status' => true,
                'message' => 'Confirmation email sent successfully.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to send confirmation email.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get case notes by case ID (supports both public and authenticated endpoints).
     * Visibility rules:
     * - Public/Anonymous users: Only see notes where created_by is null (anonymous notes)
     * - Case Managers: See anonymous notes (created_by = null) + their own notes (created_by = their user ID)
     * - Admin: See all notes (no filtering)
     * - Company users: See all notes (no filtering)
     */
    public function getCaseNotes(Request $request, string $caseId): JsonResponse
    {
        try {
            $user = auth()->user();
            
            // Check if this is a public route by checking the request path
            $isPublicRoute = str_contains($request->path(), '/public/cases/');
            
            // Build query based on user role
            $query = CaseNote::where('case_id', $caseId);
            
            // If it's a public route OR user is not authenticated, show only anonymous notes
            if ($isPublicRoute || !$user) {
                // Public/Anonymous users (via /public/cases/{caseId}/notes): 
                // Only see anonymous notes (created_by = null)
                // Case manager notes (created_by != null) are NOT visible
                $query->whereNull('created_by');
            } elseif ($user->role === 'case_manager') {
                // Case managers see: anonymous notes OR their own notes
                // They do NOT see notes created by other case managers
                $query->where(function ($q) use ($user) {
                    $q->whereNull('created_by')  // Anonymous notes
                      ->orWhere('created_by', $user->id);  // Their own notes
                });
            }
            // Admin and company users see all notes (no additional filter)
            
            // Pagination: Limit to 50 notes per request to improve performance
            $perPage = min((int) $request->query('per_page', 50), 100); // Max 100 per page
            $page = (int) $request->query('page', 1);
            
            $notes = $query->with(['creator:id,name,email'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            // Get language from request
            $language = $this->getLanguageFromRequest($request);

            // Optimize: Batch load all translations at once if not English
            $translationsMap = [];
            if ($language !== 'en') {
                $noteIds = $notes->pluck('id')->toArray();
                $modelClass = CaseNote::class;
                
                // Load all existing translations in one query
                $existingTranslations = \App\Models\Translation::where('translatable_type', $modelClass)
                    ->whereIn('translatable_id', $noteIds)
                    ->where('language', $language)
                    ->whereIn('translatable_field', ['title', 'description'])
                    ->get()
                    ->groupBy('translatable_id');
                
                // Build a map: note_id => [field => translated_text]
                foreach ($existingTranslations as $noteId => $translations) {
                    foreach ($translations as $translation) {
                        $translationsMap[$noteId][$translation->translatable_field] = $translation->translated_text;
                    }
                }
            }
            
            $translationService = $language !== 'en' ? app(\App\Services\TranslationService::class) : null;
            
            $notesData = $notes->map(function ($note) use ($language, $translationService, $translationsMap) {
                // Use pre-loaded translations if available
                $translatedTitle = $translationsMap[$note->id]['title'] ?? null;
                $translatedDescription = $translationsMap[$note->id]['description'] ?? null;
                
                // Only translate if not in cache and translation service is available
                if ($translationService && $language !== 'en') {
                    if (!$translatedTitle && $note->title) {
                        try {
                            $translatedTitle = $note->getTranslated('title', $language);
                        } catch (\Exception $e) {
                            \Log::warning('Translation failed for note title', [
                                'note_id' => $note->id,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    }
                    
                    if (!$translatedDescription && $note->description) {
                        try {
                            $translatedDescription = $note->getTranslated('description', $language);
                        } catch (\Exception $e) {
                            \Log::warning('Translation failed for note description', [
                                'note_id' => $note->id,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    }
                }
                
                return [
                    'id' => $note->id,
                    'title' => $translatedTitle ?? $note->title,
                    'description' => $translatedDescription ?? $note->description,
                    'created_at' => $note->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $note->updated_at->format('Y-m-d H:i:s'),
                    'created_by' => $note->created_by,
                    'creator' => $note->creator ? [
                        'id' => $note->creator->id,
                        'name' => $note->creator->name,
                        'email' => $note->creator->email,
                    ] : null,
                ];
            });

            return response()->json([
                'status' => true,
                'message' => 'Notes retrieved successfully.',
                'data' => $notesData,
                'pagination' => [
                    'current_page' => $notes->currentPage(),
                    'per_page' => $notes->perPage(),
                    'total' => $notes->total(),
                    'last_page' => $notes->lastPage(),
                ],
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error in getCaseNotes', [
                'case_id' => $caseId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'status' => false,
                'message' => 'Failed to retrieve notes.',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while retrieving notes.',
            ], 500)->header('Access-Control-Allow-Origin', request()->header('Origin') ?? '*');
        }
    }

    /**
     * Store a case note (supports both public and authenticated endpoints).
     */
    public function storeNote(StoreNoteRequest $request): JsonResponse
    {
        try {
            $user = auth()->user(); // null for public endpoints, user object for authenticated endpoints
            $validated = $request->validated();

            $note = CaseNote::create([
                'id' => (string) Str::uuid(),
                'case_id' => $validated['case_id'],
                'created_by' => $user ? $user->id : null, // Set user ID if authenticated, null for public
                'title' => $validated['title'],
                'description' => $validated['description'],
            ]);

            // Load the creator relationship for the response
            $note->load('creator');

            return response()->json([
                'status' => true,
                'message' => 'Note created successfully.',
                'data' => [
                    'id' => $note->id,
                    'title' => $note->title,
                    'description' => $note->description,
                    'created_at' => $note->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $note->updated_at->format('Y-m-d H:i:s'),
                    'created_by' => $note->created_by,
                    'creator' => $note->creator ? [
                        'id' => $note->creator->id,
                        'name' => $note->creator->name,
                        'email' => $note->creator->email,
                    ] : null,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to create note.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a case note (supports both public and authenticated endpoints).
     */
    public function updateNote(UpdateNoteRequest $request, string $noteId): JsonResponse
    {
        try {
            $note = CaseNote::findOrFail($noteId);
            $user = auth()->user();

            // For authenticated endpoints, users can only edit their own notes
            // For public endpoints, allow anyone to edit (for backward compatibility)
            if ($user && $note->created_by && $note->created_by !== $user->id) {
                return response()->json([
                    'status' => false,
                    'message' => 'You can only edit notes you created.',
                ], 403);
            }

            $note->update($request->validated());
            
            // Reload the creator relationship
            $note->load('creator');

            return response()->json([
                'status' => true,
                'message' => 'Note updated successfully.',
                'data' => [
                    'id' => $note->id,
                    'title' => $note->title,
                    'description' => $note->description,
                    'created_at' => $note->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $note->updated_at->format('Y-m-d H:i:s'),
                    'created_by' => $note->created_by,
                    'creator' => $note->creator ? [
                        'id' => $note->creator->id,
                        'name' => $note->creator->name,
                        'email' => $note->creator->email,
                    ] : null,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to update note.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a case note (supports both public and authenticated endpoints).
     */
    public function deleteNote(string $noteId): JsonResponse
    {
        try {
            $note = CaseNote::findOrFail($noteId);
            $user = auth()->user();

            // For authenticated endpoints, users can only delete their own notes
            // For public endpoints, allow anyone to delete (for backward compatibility)
            if ($user && $note->created_by && $note->created_by !== $user->id) {
                return response()->json([
                    'status' => false,
                    'message' => 'You can only delete notes you created.',
                ], 403);
            }

            $note->delete();

            return response()->json([
                'status' => true,
                'message' => 'Note deleted successfully.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to delete note.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get case chat messages by case ID (public endpoint).
     */
    public function getCaseChats(Request $request, string $caseId): JsonResponse
    {
        try {
            // Get language from request
            $language = $this->getLanguageFromRequest($request);
            
            // Pagination: Limit to 50 chats per request to improve performance
            $perPage = min((int) $request->query('per_page', 50), 100); // Max 100 per page
            $page = (int) $request->query('page', 1);
            
            $chats = CaseChat::where('case_id', $caseId)
                ->with(['creator:id,name,email'])
                ->orderBy('created_at', 'asc')
                ->paginate($perPage, ['*'], 'page', $page);

            // Optimize: Batch load all translations at once if not English
            $translationsMap = [];
            if ($language !== 'en') {
                $chatIds = $chats->pluck('id')->toArray();
                $modelClass = CaseChat::class;
                
                // Load all existing translations in one query (only for text messages)
                $textChatIds = $chats->where('type', 'text')->pluck('id')->toArray();
                if (!empty($textChatIds)) {
                    $existingTranslations = \App\Models\Translation::where('translatable_type', $modelClass)
                        ->whereIn('translatable_id', $textChatIds)
                        ->where('language', $language)
                        ->where('translatable_field', 'message')
                        ->get()
                        ->keyBy('translatable_id');
                    
                    foreach ($existingTranslations as $translation) {
                        $translationsMap[$translation->translatable_id] = $translation->translated_text;
                    }
                }
            }
            
            $translationService = $language !== 'en' ? app(\App\Services\TranslationService::class) : null;
            
            $chatsData = $chats->map(function ($chat) use ($language, $translationService, $translationsMap) {
                // For audio and image types, use Storage::url() to get full URL
                $message = $chat->message;
                if (in_array($chat->type, ['audio', 'image']) && !str_starts_with($chat->message, 'http')) {
                    $message = Storage::url($chat->message);
                } elseif ($chat->type === 'text') {
                    // Use pre-loaded translation if available
                    if ($language !== 'en' && isset($translationsMap[$chat->id])) {
                        $message = $translationsMap[$chat->id];
                    } elseif ($translationService && $language !== 'en') {
                        // Only translate if not cached
                        try {
                            $translatedMessage = $chat->getTranslated('message', $language);
                            $message = $translatedMessage ?? $chat->message;
                        } catch (\Exception $e) {
                            \Log::warning('Translation failed for chat', [
                                'chat_id' => $chat->id,
                                'error' => $e->getMessage(),
                            ]);
                            $message = $chat->message;
                        }
                    }
                }
                
                return [
                    'id' => $chat->id,
                    'message' => $message,
                    'type' => $chat->type,
                    'sender' => $chat->creator ? $chat->creator->name : 'Anonymous User',
                    'timestamp' => $chat->created_at->format('Y-m-d H:i:s'),
                    'read_status' => $chat->read_status,
                    'created_by' => $chat->created_by,
                    'creator' => $chat->creator ? [
                        'id' => $chat->creator->id,
                        'name' => $chat->creator->name,
                        'email' => $chat->creator->email,
                    ] : null,
                ];
            });

            return response()->json([
                'status' => true,
                'message' => 'Chat messages retrieved successfully.',
                'data' => $chatsData,
                'pagination' => [
                    'current_page' => $chats->currentPage(),
                    'per_page' => $chats->perPage(),
                    'total' => $chats->total(),
                    'last_page' => $chats->lastPage(),
                ],
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error in getCaseChats', [
                'case_id' => $caseId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'status' => false,
                'message' => 'Failed to retrieve chat messages.',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while retrieving chat messages.',
            ], 500)->header('Access-Control-Allow-Origin', request()->header('Origin') ?? '*');
        }
    }

    /**
     * Get unread chat count for a case (public and authenticated endpoints).
     */
    public function getUnreadChatCount(Request $request, string $caseId): JsonResponse
    {
        try {
            // Check if this is a public route
            $isPublicRoute = str_contains($request->path(), '/public/cases/');
            $user = auth()->user();
            
            // Build query to count unread messages
            // For anonymous users: count messages where created_by IS NOT NULL (from case managers) AND read_status = 0
            // For authenticated users: count messages where created_by IS NULL (from anonymous users) AND read_status = 0
            $query = CaseChat::where('case_id', $caseId)->where('read_status', 0);
            
            if ($isPublicRoute || !$user) {
                // Anonymous users count messages from case managers (created_by IS NOT NULL)
                $query->whereNotNull('created_by');
            } else {
                // Authenticated users (case managers) count messages from anonymous users (created_by IS NULL)
                $query->whereNull('created_by');
            }
            
            $unreadCount = $query->count();
            
            return response()->json([
                'status' => true,
                'message' => 'Unread chat count retrieved successfully.',
                'data' => [
                    'unread_count' => $unreadCount,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to retrieve unread chat count.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark chat messages as read for a case (public and authenticated endpoints).
     */
    public function markChatMessagesAsRead(Request $request, string $caseId): JsonResponse
    {
        try {
            // Check if this is a public route
            $isPublicRoute = str_contains($request->path(), '/public/cases/');
            $user = auth()->user();
            
            // Build query to find messages to mark as read
            // For anonymous users: mark messages where created_by IS NOT NULL (from case managers) AND read_status = 0
            // For authenticated users: mark messages where created_by IS NULL (from anonymous users) AND read_status = 0
            $query = CaseChat::where('case_id', $caseId)->where('read_status', 0);
            
            if ($isPublicRoute || !$user) {
                // Anonymous users mark messages from case managers as read
                $query->whereNotNull('created_by');
            } else {
                // Authenticated users mark messages from anonymous users as read
                $query->whereNull('created_by');
            }
            
            $updatedCount = $query->update(['read_status' => 1]);
            
            return response()->json([
                'status' => true,
                'message' => 'Chat messages marked as read successfully.',
                'data' => [
                    'marked_count' => $updatedCount,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to mark chat messages as read.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a text chat message (public endpoint).
     */
    public function storeChatMessage(StoreChatMessageRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            $case = CaseModel::with(['caseManager'])->find($validated['case_id']);

            // Check if this is a public route by checking the request path
            $isPublicRoute = str_contains($request->path(), '/public/cases/');
            
            // For public routes (frontend anonymous users), always set created_by to null
            // For authenticated routes, use the case manager's ID (not the logged-in user's ID)
            $user = auth()->user();
            if ($isPublicRoute || !$user) {
                $createdBy = null;
            } else {
                // Use case manager's ID if available, otherwise fall back to logged-in user's ID
                $createdBy = $case && $case->case_manager_id ? $case->case_manager_id : $user->id;
            }
            
            $chat = CaseChat::create([
                'id' => (string) Str::uuid(),
                'case_id' => $validated['case_id'],
                'created_by' => $createdBy, // null for public/frontend routes, user ID for authenticated routes
                'type' => 'text',
                'message' => $validated['message'],
                'read_status' => false,
            ]);
            
            // Load the creator relationship for the response
            $chat->load('creator');
            
            // Notify case manager if message is from anonymous user
            if ($createdBy === null && $case && $case->case_manager_id) {
                try {
                        app(\App\Services\NotificationService::class)->notifyCaseManagerChatMessage($case);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Failed to send chat message notification', [
                        'case_id' => $validated['case_id'],
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            if ($case) {
                try {
                    // Pass the case manager user for email notifications if message is from authenticated user
                    $emailSender = null;
                    if ($createdBy && $case->caseManager) {
                        $emailSender = $case->caseManager;
                    } elseif ($createdBy === null) {
                        $emailSender = null; // Anonymous user
                    }
                    $this->sendCaseChatNotificationEmails($case, $chat, $emailSender);
                } catch (\Throwable $exception) {
                    Log::warning('Failed to send case chat notification emails', [
                        'case_id' => $case->id,
                        'chat_id' => $chat->id,
                        'error' => $exception->getMessage(),
                    ]);
                }
            }

            return response()->json([
                'status' => true,
                'message' => 'Message sent successfully.',
                'data' => [
                    'id' => $chat->id,
                    'message' => $chat->message,
                    'type' => $chat->type,
                    'timestamp' => $chat->created_at->format('Y-m-d H:i:s'),
                    'read_status' => $chat->read_status,
                    'created_by' => $chat->created_by,
                    'sender' => $chat->creator ? $chat->creator->name : 'Anonymous User',
                    'creator' => $chat->creator ? [
                        'id' => $chat->creator->id,
                        'name' => $chat->creator->name,
                        'email' => $chat->creator->email,
                    ] : null,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to send message.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store an audio chat message (public endpoint).
     */
    public function storeChatAudio(StoreChatAudioRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $audioFile = $request->file('audio');
            
            if (!$audioFile) {
                return response()->json([
                    'status' => false,
                    'message' => 'Audio file is required.',
                ], 400);
            }

            // Get MIME type from the uploaded file
            $mimeType = $audioFile->getMimeType();
            
            // Determine extension based on MIME type if extension is missing or incorrect
            $extension = strtolower($audioFile->getClientOriginalExtension());
            
            // If no extension or invalid, determine from MIME type
            if (empty($extension) || !in_array($extension, ['wav', 'mp3', 'mpeg', 'webm', 'ogg', 'opus'])) {
                if (str_contains($mimeType, 'webm')) {
                    $extension = 'webm';
                } elseif (str_contains($mimeType, 'ogg') || str_contains($mimeType, 'opus')) {
                    $extension = 'ogg';
                } elseif (str_contains($mimeType, 'wav') || str_contains($mimeType, 'wave')) {
                    $extension = 'wav';
                } elseif (str_contains($mimeType, 'mpeg') || str_contains($mimeType, 'mp3')) {
                    $extension = 'mp3';
                } else {
                    $extension = 'webm'; // Default to webm for MediaRecorder
                }
            }
            
            $filename = time() . '_' . Str::random(10) . '.' . $extension;
            
            // Store file in storage/app/public/case-chats/audio
            $path = $audioFile->storeAs('case-chats/audio', $filename, 'public');
            
            $case = CaseModel::with(['caseManager'])->find($validated['case_id']);
            
            // Check if this is a public route by checking the request path
            $isPublicRoute = str_contains($request->path(), '/public/cases/');
            
            // For public routes (frontend anonymous users), always set created_by to null
            // For authenticated routes, use the case manager's ID (not the logged-in user's ID)
            $user = auth()->user();
            if ($isPublicRoute || !$user) {
                $createdBy = null;
            } else {
                // Use case manager's ID if available, otherwise fall back to logged-in user's ID
                $createdBy = $case && $case->case_manager_id ? $case->case_manager_id : $user->id;
            }
            
            $chat = CaseChat::create([
                'id' => (string) Str::uuid(),
                'case_id' => $validated['case_id'],
                'created_by' => $createdBy, // null for public/frontend routes, case manager ID for authenticated routes
                'type' => 'audio',
                'message' => $path, // Store file path
                'read_status' => false,
            ]);
            
            // Load the creator relationship for the response
            $chat->load('creator');
            
            // Notify case manager if message is from anonymous user
            if ($createdBy === null && $case && $case->case_manager_id) {
                try {
                        app(\App\Services\NotificationService::class)->notifyCaseManagerChatMessage($case);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Failed to send chat message notification', [
                        'case_id' => $validated['case_id'],
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            if ($case) {
                try {
                    // Pass the case manager user for email notifications if message is from authenticated user
                    $emailSender = null;
                    if ($createdBy && $case->caseManager) {
                        $emailSender = $case->caseManager;
                    } elseif ($createdBy === null) {
                        $emailSender = null; // Anonymous user
                    }
                    $this->sendCaseChatNotificationEmails($case, $chat, $emailSender);
                } catch (\Throwable $exception) {
                    Log::warning('Failed to send case chat notification emails', [
                        'case_id' => $case->id,
                        'chat_id' => $chat->id,
                        'error' => $exception->getMessage(),
                    ]);
                }
            }

            return response()->json([
                'status' => true,
                'message' => 'Audio message sent successfully.',
                'data' => [
                    'id' => $chat->id,
                    'message' => Storage::url($chat->message),
                    'type' => $chat->type,
                    'timestamp' => $chat->created_at->format('Y-m-d H:i:s'),
                    'read_status' => $chat->read_status,
                    'created_by' => $chat->created_by,
                    'sender' => $chat->creator ? $chat->creator->name : 'Anonymous User',
                    'creator' => $chat->creator ? [
                        'id' => $chat->creator->id,
                        'name' => $chat->creator->name,
                        'email' => $chat->creator->email,
                    ] : null,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to send audio message.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store an image chat message (public endpoint).
     */
    public function storeChatImage(StoreChatImageRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $imageFile = $request->file('image');
            
            if (!$imageFile) {
                return response()->json([
                    'status' => false,
                    'message' => 'Image file is required.',
                ], 400);
            }

            // Generate unique filename
            $extension = strtolower($imageFile->getClientOriginalExtension());
            $filename = time() . '_' . Str::random(10) . '.' . $extension;
            
            // Store file in storage/app/public/case-chats/images
            $path = $imageFile->storeAs('case-chats/images', $filename, 'public');
            
            $case = CaseModel::with(['caseManager'])->find($validated['case_id']);
            
            // Check if this is a public route by checking the request path
            $isPublicRoute = str_contains($request->path(), '/public/cases/');
            
            // For public routes (frontend anonymous users), always set created_by to null
            // For authenticated routes, use the case manager's ID (not the logged-in user's ID)
            $user = auth()->user();
            if ($isPublicRoute || !$user) {
                $createdBy = null;
            } else {
                // Use case manager's ID if available, otherwise fall back to logged-in user's ID
                $createdBy = $case && $case->case_manager_id ? $case->case_manager_id : $user->id;
            }
            
            $chat = CaseChat::create([
                'id' => (string) Str::uuid(),
                'case_id' => $validated['case_id'],
                'created_by' => $createdBy, // null for public/frontend routes, case manager ID for authenticated routes
                'type' => 'image',
                'message' => $path, // Store file path
                'read_status' => false,
            ]);
            
            // Load the creator relationship for the response
            $chat->load('creator');
            
            // Notify case manager if message is from anonymous user
            if ($createdBy === null && $case && $case->case_manager_id) {
                try {
                        app(\App\Services\NotificationService::class)->notifyCaseManagerChatMessage($case);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Failed to send chat message notification', [
                        'case_id' => $validated['case_id'],
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            if ($case) {
                try {
                    // Pass the case manager user for email notifications if message is from authenticated user
                    $emailSender = null;
                    if ($createdBy && $case->caseManager) {
                        $emailSender = $case->caseManager;
                    } elseif ($createdBy === null) {
                        $emailSender = null; // Anonymous user
                    }
                    $this->sendCaseChatNotificationEmails($case, $chat, $emailSender);
                } catch (\Throwable $exception) {
                    Log::warning('Failed to send case chat notification emails', [
                        'case_id' => $case->id,
                        'chat_id' => $chat->id,
                        'error' => $exception->getMessage(),
                    ]);
                }
            }

            return response()->json([
                'status' => true,
                'message' => 'Image message sent successfully.',
                'data' => [
                    'id' => $chat->id,
                    'message' => Storage::url($chat->message),
                    'type' => $chat->type,
                    'timestamp' => $chat->created_at->format('Y-m-d H:i:s'),
                    'read_status' => $chat->read_status,
                    'created_by' => $chat->created_by,
                    'sender' => $chat->creator ? $chat->creator->name : 'Anonymous User',
                    'creator' => $chat->creator ? [
                        'id' => $chat->creator->id,
                        'name' => $chat->creator->name,
                        'email' => $chat->creator->email,
                    ] : null,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to send image message.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get case logs by case ID (public endpoint).
     */
    public function getCaseLogs(Request $request, string $caseId): JsonResponse
    {
        try {
            // Get language from request
            $language = $this->getLanguageFromRequest($request);
            
            // Pagination: Reduce default to 50 logs per request for better performance
            $perPage = min((int) $request->query('per_page', 50), 100); // Max 100 per page, default 50
            $page = (int) $request->query('page', 1);
            
            // Use select to only get needed fields
            $logs = CaseLog::where('case_id', $caseId)
                ->select('id', 'case_id', 'created_by', 'action_type', 'action_value', 'created_at')
                ->with(['creator:id,name,email'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            // Optimize: Batch load all translations at once if not English
            $translationsMap = [];
            if ($language !== 'en' && $logs->count() > 0) {
                $logIds = $logs->pluck('id')->toArray();
                $modelClass = CaseLog::class;
                
                // Load all existing translations in one query with proper indexing
                $existingTranslations = \App\Models\Translation::where('translatable_type', $modelClass)
                    ->whereIn('translatable_id', $logIds)
                    ->where('language', $language)
                    ->whereIn('translatable_field', ['action_type', 'action_value'])
                    ->select('translatable_id', 'translatable_field', 'translated_text')
                    ->get()
                    ->groupBy('translatable_id');
                
                // Build a map: log_id => [field => translated_text]
                foreach ($existingTranslations as $logId => $translations) {
                    foreach ($translations as $translation) {
                        $translationsMap[$logId][$translation->translatable_field] = $translation->translated_text;
                    }
                }
            }
            
            // Only initialize translation service if we actually need to translate
            $needsTranslation = $language !== 'en' && $logs->count() > 0;
            $translationService = $needsTranslation ? app(\App\Services\TranslationService::class) : null;
            
            // Common action types that might not need translation (skip if they're very common)
            $commonActionTypes = ['Tab Viewed', 'Report Settings Updated', 'Chat Message Sent', 'Note Created', 'Document Uploaded', 'Note Updated', 'Note Deleted', 'Document Deleted'];
            
            $logsData = $logs->map(function ($log) use ($language, $translationService, $translationsMap, $commonActionTypes) {
                $translatedActionType = null;
                $translatedActionValue = null;
                
                // Use pre-loaded translations if available
                if ($language !== 'en' && isset($translationsMap[$log->id])) {
                    $translatedActionType = $translationsMap[$log->id]['action_type'] ?? null;
                    if ($log->action_value) {
                        $translatedActionValue = $translationsMap[$log->id]['action_value'] ?? null;
                    }
                }
                
            // Only translate if not in cache and translation service is available
            // Skip translation for very common/short action types to improve performance
            // Only translate if we don't have a cached translation
            if ($translationService && $language !== 'en' && !$translatedActionType && $log->action_type) {
                // Skip translation for common action types that are likely already translated
                // or don't need translation (they're system messages)
                if (!in_array($log->action_type, $commonActionTypes)) {
                    try {
                        $translatedActionType = $log->getTranslated('action_type', $language);
                    } catch (\Exception $e) {
                        \Log::warning('Translation failed for log action_type', [
                            'log_id' => $log->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }
            
            // Only translate action_value if it exists and is not too long (to avoid slow API calls)
            // Skip translation for very long values or if already cached
            if ($translationService && $language !== 'en' && !$translatedActionValue && $log->action_value) {
                // Skip translation for very long action values (likely not user-facing text)
                // Also skip if it looks like a file path or URL
                $actionValue = $log->action_value;
                $shouldTranslateValue = strlen($actionValue) < 200 && 
                                      !str_starts_with($actionValue, 'http') &&
                                      !str_contains($actionValue, '/') &&
                                      !str_contains($actionValue, '\\');
                
                if ($shouldTranslateValue) {
                    try {
                        $translatedActionValue = $log->getTranslated('action_value', $language);
                    } catch (\Exception $e) {
                        \Log::warning('Translation failed for log action_value', [
                            'log_id' => $log->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }
            
            return [
                'id' => $log->id,
                'action_type' => $translatedActionType ?? $log->action_type,
                'action_value' => $translatedActionValue ?? $log->action_value,
                'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                'created_by' => $log->created_by,
                'creator' => $log->creator ? [
                    'id' => $log->creator->id,
                    'name' => $log->creator->name,
                    'email' => $log->creator->email,
                ] : null,
            ];
        });

        return response()->json([
            'status' => true,
            'message' => 'Case logs retrieved successfully.',
            'data' => $logsData,
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ],
        ], 200);
        } catch (\Exception $e) {
            \Log::error('Error in getCaseLogs', [
                'case_id' => $caseId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'status' => false,
                'message' => 'Failed to retrieve case logs.',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while retrieving logs.',
            ], 500)->header('Access-Control-Allow-Origin', request()->header('Origin') ?? '*');
        }
    }

    /**
     * Store a case log (public endpoint).
     */
    public function storeCaseLog(StoreCaseLogRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            $log = CaseLog::create([
                'id' => (string) Str::uuid(),
                'case_id' => $validated['case_id'],
                'created_by' => null, // Public logs don't have specific users
                'action_type' => $validated['action_type'],
                'action_value' => $validated['action_value'] ?? null,
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Case log created successfully.',
                'data' => [
                    'id' => $log->id,
                    'action_type' => $log->action_type,
                    'action_value' => $log->action_value,
                    'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to create case log.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get cases list with role-based filtering (authenticated endpoint).
     */
    public function getCasesList(): JsonResponse
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Authentication required.',
                ], 401);
            }

            $user->loadMissing('roles');
            $roleColumn = $user->role ?? null;

            $query = CaseModel::with([
                'company:id,name',
                'caseManager:id,name,email',
                'category:id,name',
                'department:id,name',
                'severity:id,name',
                'state:id,name'
            ]);

            if ($user->hasRole('admin') || $roleColumn === 'admin') {
                // Admin sees all cases
            } elseif ($user->hasRole('company') || $roleColumn === 'company') {
                // Company user sees cases tied to their user ID
                $query->where('company_id', $user->id);
            } elseif ($user->hasRole('case_manager') || $roleColumn === 'case_manager') {
                // Case manager sees assigned cases
                $query->where('case_manager_id', $user->id);
            } else {
                return response()->json([
                    'status' => false,
                    'message' => 'Unauthorized access.',
                ], 403);
            }

            $cases = $query->orderBy('created_at', 'desc')->get();

            $casesData = $cases->map(function ($case) {
                return [
                    'id' => $case->id,
                    'case_id' => $case->case_id,
                    'title' => $case->title,
                    'subject' => $case->subject,
                    'description' => $case->description,
                    'status' => $case->status,
                    'priority' => $case->priority,
                    'created_at' => $case->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $case->updated_at->format('Y-m-d H:i:s'),
                    'open_deadline_number' => $case->open_deadline_number ?? null,
                    'open_deadline_period' => $case->open_deadline_period ?? null,
                    'close_deadline_number' => $case->close_deadline_number ?? null,
                    'close_deadline_period' => $case->close_deadline_period ?? null,
                    'company' => $case->company ? [
                        'id' => $case->company->id,
                        'name' => $case->company->name,
                    ] : null,
                    'case_manager' => $case->caseManager ? [
                        'id' => $case->caseManager->id,
                        'name' => $case->caseManager->name,
                        'email' => $case->caseManager->email,
                    ] : null,
                    'category' => $case->category ? [
                        'id' => $case->category->id,
                        'name' => $case->category->name,
                    ] : null,
                    'department' => $case->department ? [
                        'id' => $case->department->id,
                        'name' => $case->department->name,
                    ] : null,
                    'severity' => $case->severity ? [
                        'id' => $case->severity->id,
                        'name' => $case->severity->name,
                    ] : null,
                    'state' => $case->state ? [
                        'id' => $case->state->id,
                        'name' => $case->state->name,
                    ] : null,
                ];
            });

            return response()->json([
                'status' => true,
                'message' => 'Cases retrieved successfully.',
                'data' => $casesData,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to retrieve cases.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update case attributes such as department, severity, and state.
     */
    public function updateCaseAttributes(Request $request, string $caseId): JsonResponse
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Authentication required.',
                ], 401);
            }

            $case = CaseModel::find($caseId);

            if (!$case) {
                return response()->json([
                    'status' => false,
                    'message' => 'Case not found.',
                ], 404);
            }

            $user->loadMissing('roles');
            $roleColumn = $user->role ?? null;

            $isAdmin = $user->hasRole('admin') || $roleColumn === 'admin';
            $isCompany = $user->hasRole('company') || $roleColumn === 'company';
            $isCaseManager = $user->hasRole('case_manager') || $roleColumn === 'case_manager';

            $authorized = false;

            if ($isAdmin) {
                $authorized = true;
            } elseif ($isCompany) {
                $authorized = ($case->company_id === $user->id);
            } elseif ($isCaseManager) {
                $authorized = ($case->case_manager_id === $user->id);
            }

            if (!$authorized) {
                return response()->json([
                    'status' => false,
                    'message' => 'Unauthorized to update this case.',
                ], 403);
            }

            $validated = $request->validate([
                'department_id' => ['nullable', 'uuid', 'exists:departments,id'],
                'severity_id' => ['nullable', 'uuid', 'exists:severities,id'],
                'state_id' => ['nullable', 'uuid', 'exists:states,id'],
            ]);

            // Ensure provided attributes belong to the same company (if scoped)
            if (array_key_exists('department_id', $validated)) {
                $departmentId = $validated['department_id'];
                if ($departmentId) {
                    $department = Department::find($departmentId);
                    if (!$department) {
                        return response()->json([
                            'status' => false,
                            'message' => 'Department not found.',
                        ], 422);
                    }
                    if ($department->company_id && $department->company_id !== $case->company_id) {
                        return response()->json([
                            'status' => false,
                            'message' => 'Department does not belong to this company.',
                        ], 422);
                    }
                }
                $case->department_id = $departmentId;
            }

            if (array_key_exists('severity_id', $validated)) {
                $severityId = $validated['severity_id'];
                if ($severityId) {
                    $severity = Severity::find($severityId);
                    if (!$severity) {
                        return response()->json([
                            'status' => false,
                            'message' => 'Severity not found.',
                        ], 422);
                    }
                    if ($severity->company_id && $severity->company_id !== $case->company_id) {
                        return response()->json([
                            'status' => false,
                            'message' => 'Severity does not belong to this company.',
                        ], 422);
                    }
                }
                $case->severity_id = $severityId;
            }

            if (array_key_exists('state_id', $validated)) {
                $stateId = $validated['state_id'];
                if ($stateId) {
                    $state = State::find($stateId);
                    if (!$state) {
                        return response()->json([
                            'status' => false,
                            'message' => 'State not found.',
                        ], 422);
                    }
                    if ($state->company_id && $state->company_id !== $case->company_id) {
                        return response()->json([
                            'status' => false,
                            'message' => 'State does not belong to this company.',
                        ], 422);
                    }
                }
                $case->state_id = $stateId;
            }

            $case->save();
            $case->load(['department', 'severity', 'state']);

            return response()->json([
                'status' => true,
                'message' => 'Case attributes updated successfully.',
                'data' => [
                    'department_id' => $case->department?->id,
                    'department_name' => $case->department?->name,
                    'severity_id' => $case->severity?->id,
                    'severity_name' => $case->severity?->name,
                    'state_id' => $case->state?->id,
                    'state_name' => $case->state?->name,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed.',
                'data' => [
                    'errors' => $e->errors(),
                ],
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to update case attributes.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update hidden field visibility for a case.
     */
    public function updateCaseHiddenFields(Request $request, string $caseId): JsonResponse
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Authentication required.',
                ], 401);
            }

            $case = CaseModel::find($caseId);

            if (!$case) {
                return response()->json([
                    'status' => false,
                    'message' => 'Case not found.',
                ], 404);
            }

            $user->loadMissing('roles');
            $roleColumn = $user->role ?? null;

            $isAdmin = $user->hasRole('admin') || $roleColumn === 'admin';
            $isCompany = $user->hasRole('company') || $roleColumn === 'company';
            $isCaseManager = $user->hasRole('case_manager') || $roleColumn === 'case_manager';

            $authorized = false;

            if ($isAdmin) {
                $authorized = true;
            } elseif ($isCompany) {
                $authorized = ($case->company_id === $user->id);
            } elseif ($isCaseManager) {
                $authorized = ($case->case_manager_id === $user->id);
            }

            if (!$authorized) {
                return response()->json([
                    'status' => false,
                    'message' => 'Unauthorized to update this case.',
                ], 403);
            }

            // Get all request data - try both input() and json()
            $allData = $request->all();
            if (empty($allData) && $request->json()) {
                $allData = $request->json()->all();
                // Merge JSON data into request if it wasn't already merged
                if (!empty($allData)) {
                    $request->merge($allData);
                }
            }

            // Ensure hidden_fields is always present - default to empty array if not provided
            // This must happen BEFORE validation
            if (!$request->has('hidden_fields') || $request->input('hidden_fields') === null) {
                $request->merge(['hidden_fields' => []]);
            }

            // Debug: Log the incoming request
            \Log::info('Update hidden fields request', [
                'case_id' => $caseId,
                'request_method' => $request->method(),
                'content_type' => $request->header('Content-Type'),
                'request_data' => $request->all(),
                'json_data' => $request->json() ? $request->json()->all() : null,
                'input_data' => $request->input(),
                'hidden_fields_present' => $request->has('hidden_fields'),
                'hidden_fields_value' => $request->input('hidden_fields'),
                'hidden_fields_json' => $request->json() ? $request->json('hidden_fields') : null,
                'hidden_fields_type' => gettype($request->input('hidden_fields')),
                'raw_content' => $request->getContent(),
            ]);

            // Validate hidden_fields - allow empty array
            // For empty arrays, the 'hidden_fields.*' rule won't apply, which is correct
            // Use 'present' instead of 'required' to allow empty arrays
            $validated = $request->validate([
                'hidden_fields' => ['present', 'array'],
                'hidden_fields.*' => ['string', Rule::in($this->getHideableCaseFields())],
            ]);

            // Ensure we have an array (even if empty) and filter out any null/empty values
            $hiddenFields = is_array($validated['hidden_fields']) 
                ? array_values(array_unique(array_filter($validated['hidden_fields'], fn($value) => !empty($value)))) 
                : [];

            $case->hidden_fields = $hiddenFields;
            $case->save();

            return response()->json([
                'status' => true,
                'message' => 'Case hidden fields updated successfully.',
                'data' => [
                    'hidden_fields' => $case->hidden_fields ?? [],
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed.',
                'data' => [
                    'errors' => $e->errors(),
                ],
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to update case hidden fields.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update case report settings (authenticated endpoint).
     */
    public function updateCaseReportSettings(Request $request, string $caseId): JsonResponse
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Authentication required.',
                ], 401);
            }

            $case = CaseModel::find($caseId);

            if (!$case) {
                return response()->json([
                    'status' => false,
                    'message' => 'Case not found.',
                ], 404);
            }

            $user->loadMissing('roles');
            $roleColumn = $user->role ?? null;

            $isAdmin = $user->hasRole('admin') || $roleColumn === 'admin';
            $isCompany = $user->hasRole('company') || $roleColumn === 'company';
            $isCaseManager = $user->hasRole('case_manager') || $roleColumn === 'case_manager';

            $authorized = false;

            if ($isAdmin) {
                $authorized = true;
            } elseif ($isCompany) {
                $authorized = ($case->company_id === $user->id);
            } elseif ($isCaseManager) {
                $authorized = ($case->case_manager_id === $user->id);
            }

            if (!$authorized) {
                return response()->json([
                    'status' => false,
                    'message' => 'Unauthorized to update this case.',
                ], 403);
            }

            $validated = $request->validate([
                'case_manager_id' => ['nullable', 'string', 'uuid', 'exists:users,id'],
                'status' => ['required', 'string', 'in:new,open,in_progress,closed,pending,resolved,rejected,cancelled,spam,other'],
                'open_deadline_number' => ['nullable', 'integer', 'min:0'],
                'open_deadline_period' => ['nullable', 'string', 'in:daily,weekly,monthly,yearly'],
                'close_deadline_number' => ['nullable', 'integer', 'min:0'],
                'close_deadline_period' => ['nullable', 'string', 'in:daily,weekly,monthly,yearly'],
                'other_report_link' => ['nullable', 'string', 'max:500'],
                'automatic_delete' => ['nullable'],
                'case_category_id' => ['nullable', 'string', 'uuid', 'exists:categories,id'],
                'reporting_medium' => ['nullable', 'string', 'in:written,oral,phone_call,physical_meeting'],
                'department_id' => ['nullable', 'string', 'uuid', 'exists:departments,id'],
                'severity_id' => ['nullable', 'string', 'uuid', 'exists:severities,id'],
                'state_id' => ['nullable', 'string', 'uuid', 'exists:states,id'],
            ]);

            // Store old status for notification
            $oldStatus = $case->status;
            
            // Update case fields
            if (isset($validated['case_manager_id'])) {
                $case->case_manager_id = $validated['case_manager_id'];
            }
            if (isset($validated['status'])) {
                $case->status = $validated['status'];
            }
            if (array_key_exists('open_deadline_number', $validated)) {
                $case->open_deadline_number = $validated['open_deadline_number'];
            }
            if (array_key_exists('open_deadline_period', $validated)) {
                $case->open_deadline_period = $validated['open_deadline_period'];
            }
            if (array_key_exists('close_deadline_number', $validated)) {
                $case->close_deadline_number = $validated['close_deadline_number'];
            }
            if (array_key_exists('close_deadline_period', $validated)) {
                $case->close_deadline_period = $validated['close_deadline_period'];
            }
            if (isset($validated['other_report_link'])) {
                $case->other_report_link = $validated['other_report_link'];
            }
            if (array_key_exists('automatic_delete', $validated)) {
                // Convert boolean to 'yes'/'no' string for enum column
                $automaticDelete = $validated['automatic_delete'];
                if ($automaticDelete === null) {
                    $case->automatic_delete = null;
                } elseif (is_bool($automaticDelete)) {
                    $case->automatic_delete = $automaticDelete ? 'yes' : 'no';
                } elseif (in_array($automaticDelete, ['yes', 'no'], true)) {
                    $case->automatic_delete = $automaticDelete;
                } else {
                    // Handle other truthy/falsy values (0, 1, '0', '1', etc.)
                    $case->automatic_delete = $automaticDelete ? 'yes' : 'no';
                }
            }
            if (array_key_exists('case_category_id', $validated)) {
                $case->case_category_id = $validated['case_category_id'];
            }
            if (array_key_exists('reporting_medium', $validated)) {
                // Normalize 'oral' to 'written' since they are now combined (oral is kept for backward compatibility)
                $case->reporting_medium = $validated['reporting_medium'] === 'oral' ? 'written' : $validated['reporting_medium'];
            }
            if (array_key_exists('department_id', $validated)) {
                $case->department_id = $validated['department_id'];
            }
            if (array_key_exists('severity_id', $validated)) {
                $case->severity_id = $validated['severity_id'];
            }
            if (array_key_exists('state_id', $validated)) {
                $case->state_id = $validated['state_id'];
            }

            $case->save();
            
            // Notify if status changed
            if (isset($validated['status']) && $oldStatus !== $case->status) {
                try {
                    $case->loadMissing('company', 'caseManager');
                    app(\App\Services\NotificationService::class)->notifyCaseStatusUpdated($case, $oldStatus, $case->status);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Failed to send case status update notification', [
                        'case_id' => $case->id,
                        'error' => $e->getMessage(),
                    ]);
                }

                if ($case->status === 'closed') {
                    $this->sendReportUpdateEmails($case, $oldStatus);
                }
            }

            // Refresh relationships
            $case->refresh();
            $case->load(['caseManager:id,name,email']);

            return response()->json([
                'status' => true,
                'message' => 'Case report settings updated successfully.',
                'data' => [
                    'id' => $case->id,
                    'case_manager_id' => $case->case_manager_id,
                    'case_manager_name' => $case->caseManager ? $case->caseManager->name : null,
                    'status' => $case->status,
                    'open_deadline_time' => $case->open_deadline_time ? $case->open_deadline_time->format('Y-m-d H:i:s') : null,
                    'close_deadline_time' => $case->close_deadline_time ? $case->close_deadline_time->format('Y-m-d H:i:s') : null,
                    'open_deadline_number' => $case->open_deadline_number ?? null,
                    'open_deadline_period' => $case->open_deadline_period ?? null,
                    'close_deadline_number' => $case->close_deadline_number ?? null,
                    'close_deadline_period' => $case->close_deadline_period ?? null,
                    'other_report_link' => $case->other_report_link,
                    'automatic_delete' => $case->automatic_delete,
                    'case_category_id' => $case->case_category_id,
                    'reporting_medium' => $case->reporting_medium,
                    'department_id' => $case->department_id,
                    'severity_id' => $case->severity_id,
                    'state_id' => $case->state_id,
                ],
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed.',
                'data' => [
                    'errors' => $e->errors(),
                ],
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to update case report settings.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Convert PHP ini size format to bytes
     */
    private function returnBytes(string $val): int
    {
        $val = trim($val);
        $last = strtolower($val[strlen($val)-1]);
        $val = (int) $val;
        
        switch($last) {
            case 'g':
                $val *= 1024;
            case 'm':
                $val *= 1024;
            case 'k':
                $val *= 1024;
        }
        
        return $val;
    }

    /**
     * Format bytes to human-readable format
     */
    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
