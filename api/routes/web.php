<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\ManualEntryController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PasswordController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AdviseChatController;
use App\Http\Controllers\CommonController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DashboardOverviewController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\StateController;
use App\Http\Controllers\SeverityController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\CaseManagerController;
use App\Http\Controllers\ImpersonationController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\NewsController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\EmailTemplateController;
use App\Http\Controllers\ThemeConfigurationController;
use App\Http\Controllers\TwoFactorController;
use App\Http\Controllers\AdminSettingsController;
use App\Http\Controllers\CaseController;
use App\Http\Controllers\SupportTicketController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\StripeWebhookController;

Route::get('/', function () {
    return view('welcome');
});

// Root-level favicon.ico (browsers request this automatically)
Route::get('/favicon.ico', [AdminSettingsController::class, 'getFavicon']);

// SPA session-based auth routes (web middleware provides session & CSRF)
Route::middleware('web')->prefix('api/v1/auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware(['throttle:login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware(['auth:sanctum','reject.banned']);
    Route::get('/me', [AuthController::class, 'me'])->middleware(['auth:sanctum','reject.banned','require.password']);
    Route::get('/capabilities', [AuthController::class, 'capabilities'])->middleware(['auth:sanctum','reject.banned']);
    Route::get('/check-permission/{permission}', [AuthController::class, 'checkPermission'])->middleware(['auth:sanctum','reject.banned']);
    Route::get('/check-role/{role}', [AuthController::class, 'checkRole'])->middleware(['auth:sanctum','reject.banned']);
    Route::get('/verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->middleware(['signed','throttle:6,1'])
        ->name('verification.verify');
    Route::post('/2fa/verify', [TwoFactorController::class, 'verify'])->middleware(['throttle:login']);
});

// Password reset (SPA) under web middleware
Route::middleware('web')->prefix('api/v1/password')->group(function () {
    Route::post('/forgot', [PasswordController::class, 'sendResetLink'])->middleware(['throttle:api']);
    Route::post('/reset', [PasswordController::class, 'reset'])->middleware(['throttle:api']);
    Route::post('/set', [PasswordController::class, 'setPassword'])->middleware(['throttle:api']);
    Route::get('/check', [PasswordController::class, 'check'])->middleware(['throttle:api']);
});

// SPA session-based data routes (web middleware provides session & CSRF)
// Public endpoints (no auth)
Route::middleware('web')->prefix('api/v1')->group(function () {
    // Public company details (supports both slug and ID)
    Route::get('/public/companies/{identifier}', [CompanyController::class, 'publicShow']);
    // Public reporting page by company slug or id
    Route::get('/public/pages/reporting-page/{identifier?}', [PageController::class, 'public_reporting_page']);
    Route::get('/public/pages/login', [PageController::class, 'public_login_page']);
    Route::get('/public/pages/payment', [PageController::class, 'public_payment_page']);
    // Public pages for company pages (translated)
    Route::get('/public/pages/about-us', [PageController::class, 'public_about_us']);
    Route::get('/public/pages/privacy-policy', [PageController::class, 'public_privacy_policy']);
    Route::get('/public/pages/terms-conditions', [PageController::class, 'public_terms_conditions']);
    Route::get('/public/pages/support', [PageController::class, 'public_support']);
    Route::get('/public/pages/create-case', [PageController::class, 'public_create_case']);
    // Public navigation pages (for menu)
    Route::get('/public/pages/navigation', [PageController::class, 'public_navigation_pages']);
    // Public page by slug (for dynamic page routes)
    Route::get('/public/companies/{companySlug}/pages/{pageSlug}', [PageController::class, 'public_page_by_slug']);
    // Public admin settings (VAT, pricing) used on signup flow
    Route::get('/settings', [AdminSettingsController::class, 'getSettings']);
    // Public site logo
    Route::get('/public/site-logo', [AdminSettingsController::class, 'getSiteLogo']);
    // Public small logo for favicon
    Route::get('/public/small-logo', [AdminSettingsController::class, 'getSmallLogo']);
    // Public questions by company slug or ID
    Route::get('/public/questions/company/{identifier}', [QuestionController::class, 'getByCompany']);
    // Public case managers by company slug or ID
    Route::get('/public/case-managers/company/{identifier}', [CaseManagerController::class, 'getByCompany']);
    // Public active categories
    Route::get('/public/categories/active', [CategoryController::class, 'getActive']);
    // Public case details by case ID
    Route::get('/public/cases/{caseId}', [CaseController::class, 'getCaseDetails']);
    // Public case attachments
    Route::get('/public/cases/{caseId}/attachments', [CaseController::class, 'getCaseAttachments']);
    // Public case notes
    Route::get('/public/cases/{caseId}/notes', [CaseController::class, 'getCaseNotes']);
    // Public case chats
    Route::get('/public/cases/{caseId}/chats', [CaseController::class, 'getCaseChats']);
    Route::get('/public/cases/{caseId}/chats/unread-count', [CaseController::class, 'getUnreadChatCount']);
    // Public case logs
    Route::get('/public/cases/{caseId}/logs', [CaseController::class, 'getCaseLogs']);
});

// Public POST/PUT endpoints without CSRF (case creation, authentication, and chat operations)
Route::withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class])
    ->middleware('web')
    ->prefix('api/v1')
    ->group(function () {
        // Auth endpoints for signup validation (public, no CSRF required)
        Route::post('/auth/check-email', [AuthController::class, 'checkEmailExists'])->middleware(['throttle:api']);
        Route::post('/auth/check-phone', [AuthController::class, 'checkPhoneExists'])->middleware(['throttle:api']);
        Route::post('/auth/check-company-name', [AuthController::class, 'checkCompanyNameExists'])->middleware(['throttle:api']);
        Route::post('/auth/signup', [AuthController::class, 'signup'])->middleware(['throttle:api']);
        Route::post('/auth/resend-verification-email', [AuthController::class, 'resendVerificationEmail'])->middleware(['throttle:api']);
        Route::post('/auth/request-password-set-token', [AuthController::class, 'requestPasswordSetToken'])->middleware(['throttle:api']);
        // Order payment verification (public, no CSRF required for redirect callback)
        Route::post('/orders/verify-payment', [OrderController::class, 'verifyStripePayment'])->middleware(['throttle:api']);
        // Stripe webhook endpoint (public, no CSRF required)
        Route::post('/stripe/webhook', [StripeWebhookController::class, 'handleWebhook'])->middleware(['throttle:api']);
        // Public case endpoints
        Route::post('/public/cases', [CaseController::class, 'store']);
        Route::post('/public/cases/send-confirmation-email', [CaseController::class, 'sendConfirmationEmail']);
        Route::put('/public/cases/{caseId}/chats/mark-read', [CaseController::class, 'markChatMessagesAsRead']);
        Route::post('/public/cases/authenticate', [CaseController::class, 'authenticateByPassword']);
        Route::post('/public/cases/attachments', [CaseController::class, 'storeAttachment']);
        Route::delete('/public/cases/attachments/{attachmentId}', [CaseController::class, 'deleteAttachment']);
        Route::post('/public/cases/notes', [CaseController::class, 'storeNote']);
        Route::put('/public/cases/notes/{noteId}', [CaseController::class, 'updateNote']);
        Route::delete('/public/cases/notes/{noteId}', [CaseController::class, 'deleteNote']);
        Route::post('/public/cases/chats', [CaseController::class, 'storeChatMessage']);
        Route::post('/public/cases/chats/audio', [CaseController::class, 'storeChatAudio']);
        Route::post('/public/cases/chats/image', [CaseController::class, 'storeChatImage']);
        Route::post('/public/cases/logs', [CaseController::class, 'storeCaseLog']);
    });

// SPA session-based data routes (web middleware provides session & CSRF)
Route::middleware('web')->prefix('api/v1')->group(function () {
    // User management (SPA session auth) - require verified email
    Route::middleware(['auth:sanctum','verified','reject.banned','require.password','throttle:api'])->group(function () {
        // Dashboard analytics
        Route::get('dashboard/analytics', [DashboardController::class, 'analytics']);
        Route::get('dashboard/profit-revenue-by-media-buyer', [DashboardController::class, 'profitRevenueByMediaBuyer']);
        Route::get('dashboard/campaign-performance-breakdown', [DashboardController::class, 'campaignPerformanceBreakdown']);
        Route::get('dashboard/overall-pl-trend', [DashboardController::class, 'overallPLTrend']);
        Route::get('dashboard/month-wise-financial-data', [DashboardController::class, 'monthWiseFinancialData']);
        Route::get('dashboard/available-years', [DashboardController::class, 'getAvailableYears']);
        Route::get('dashboard/spend-by-vertical', [DashboardController::class, 'spendByVertical']);
        Route::get('dashboard/total-calls', [DashboardController::class, 'totalCalls']);
        Route::get('dashboard/total-leads', [DashboardController::class, 'totalLeads']);
        Route::get('dashboard/live-calls', [DashboardController::class, 'liveCalls']);
        Route::get('dashboard/media-buyer-table', [DashboardController::class, 'mediaBuyerTable']);
        Route::get('dashboard/overview', [DashboardOverviewController::class, 'overview']);
        // Users
        Route::apiResource('users', UserController::class);
        // Companies
        Route::apiResource('companies', CompanyController::class);
        // Case Managers
        Route::apiResource('case-managers', CaseManagerController::class);
        // Invoices (orders)
        Route::get('invoices', [OrderController::class, 'index']);
        Route::get('invoices/{id}', [OrderController::class, 'show']);
        Route::put('invoices/{id}/status', [OrderController::class, 'updateStatus']);
        Route::get('invoices/{id}/pdf', [OrderController::class, 'downloadPdf']);
        Route::post('invoices/{id}/upload-payment', [OrderController::class, 'uploadPaymentAttachment']);
        // Categories
        Route::apiResource('categories', CategoryController::class);
        // Departments
        Route::apiResource('departments', DepartmentController::class);
        // States
        Route::apiResource('states', StateController::class);
        // Severities
        Route::apiResource('severities', SeverityController::class);
        // Questions
        Route::apiResource('questions', QuestionController::class);
        Route::post('/questions/reorder', [QuestionController::class, 'reorder']);
        Route::get('/questions/deletion/requests', [QuestionController::class, 'deletionRequests']);
        Route::post('/questions/{question}/approve-deletion', [QuestionController::class, 'approveDeletion']);
        // News
        Route::apiResource('news', NewsController::class);
        Route::post('/news/{news}/upload-cover', [NewsController::class, 'uploadCover']);
        // Pages
        Route::get('/pages/privacy-policy', [PageController::class, 'privacy_policy']);
        Route::put('/pages/privacy-policy', [PageController::class, 'update_privacy_policy']);
        Route::get('/pages/about-us', [PageController::class, 'about_us']);
        Route::put('/pages/about-us', [PageController::class, 'update_about_us']);
        Route::get('/pages/login', [PageController::class, 'login']);
        Route::put('/pages/login', [PageController::class, 'update_login']);
        Route::get('/pages/payment', [PageController::class, 'payment']);
        Route::put('/pages/payment', [PageController::class, 'update_payment']);
        Route::get('/pages/policy', [PageController::class, 'policy']);
        Route::put('/pages/policy', [PageController::class, 'update_policy']);
        Route::get('/pages/terms-conditions', [PageController::class, 'terms_condition']);
        Route::put('/pages/terms-conditions', [PageController::class, 'update_terms_condition']);
        Route::get('/pages/support', [PageController::class, 'support']);
        Route::put('/pages/support', [PageController::class, 'update_support']);
        Route::get('/pages/create-case', [PageController::class, 'create_case']);
        Route::put('/pages/create-case', [PageController::class, 'update_create_case']);
        Route::get('/pages/reporting-page', [PageController::class, 'reporting_page']);
        Route::put('/pages/reporting-page', [PageController::class, 'update_reporting_page']);
        // Email Templates
        Route::apiResource('email-templates', EmailTemplateController::class);
        Route::get('email-templates/by-name-language', [EmailTemplateController::class, 'getByNameAndLanguage']);
        Route::post('email-templates/{emailTemplate}/convert', [EmailTemplateController::class, 'convert']);
        // Theme Configuration
        Route::get('/theme-configuration', [ThemeConfigurationController::class, 'show']);
        Route::put('/theme-configuration', [ThemeConfigurationController::class, 'update']);
        // Basic Configuration
        Route::get('/basic-configuration', [AdminSettingsController::class, 'getBasicConfiguration']);
        Route::put('/basic-configuration', [AdminSettingsController::class, 'updateBasicConfiguration']);
        // Stripe Configuration
        Route::get('/stripe-configuration', [AdminSettingsController::class, 'getStripeConfiguration']);
        Route::put('/stripe-configuration', [AdminSettingsController::class, 'updateStripeConfiguration']);
        // Bank Details
        Route::get('/bank-details', [AdminSettingsController::class, 'getBankDetails']);
        Route::put('/bank-details', [AdminSettingsController::class, 'updateBankDetails']);
        // Notification
        Route::get('/notifications/my', [NotificationController::class, 'myNotifications']);
        Route::post('/notifications/{notification}/mark-as-read', [NotificationController::class, 'markAsRead']);
        Route::post('/notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead']);
        Route::apiResource('notifications', NotificationController::class);
        // Support Tickets
        Route::get('/support-tickets', [SupportTicketController::class, 'index']);
        Route::post('/support-tickets', [SupportTicketController::class, 'store']);
        Route::get('/support-tickets/{id}', [SupportTicketController::class, 'show']);
        Route::put('/support-tickets/{id}/status', [SupportTicketController::class, 'updateStatus']);
        Route::post('/support-tickets/chats', [SupportTicketController::class, 'storeChat']);
        Route::get('/support-tickets/{id}/chats', [SupportTicketController::class, 'getChats']);
        Route::get('/support-tickets/{id}/chats/unread-count', [SupportTicketController::class, 'getUnreadChatCount']);
        Route::put('/support-tickets/{id}/chats/mark-read', [SupportTicketController::class, 'markChatsAsRead']);
        Route::get('/support-tickets-debug', [SupportTicketController::class, 'debugList']);
        // User profile
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
        Route::post('/profile/change-password', [ProfileController::class, 'changePassword']);
        // User 2FA management
        Route::get('/profile/2fa', [TwoFactorController::class, 'status']);
        Route::post('/profile/2fa/send-email-code', [TwoFactorController::class, 'sendEmailCode']);
        Route::post('/profile/2fa/setup-app', [TwoFactorController::class, 'setupApp']);
        Route::post('/profile/2fa/enable', [TwoFactorController::class, 'enable']);
        Route::post('/profile/2fa/disable', [TwoFactorController::class, 'disable']);
        // Impersonation (specific routes must come before parameterized routes)
        Route::get('/impersonate/status', [ImpersonationController::class, 'status']);
        Route::post('/impersonate/stop', [ImpersonationController::class, 'stop']);
        Route::post('/impersonate/{user}', [ImpersonationController::class, 'start']);
        // Activity logs (my)
        Route::get('/activity-logs/my', [ActivityLogController::class, 'indexMy']);
        // Cases list (role-based filtering)
        Route::get('/cases', [CaseController::class, 'getCasesList']);
        // Update case report settings
        Route::put('/cases/{caseId}/report-settings', [CaseController::class, 'updateCaseReportSettings']);
        Route::put('/cases/{caseId}/attributes', [CaseController::class, 'updateCaseAttributes']);
        Route::put('/cases/{caseId}/hidden-fields', [CaseController::class, 'updateCaseHiddenFields']);
        // Case attachments (authenticated)
        Route::get('/cases/{caseId}/attachments', [CaseController::class, 'getCaseAttachments']);
        Route::post('/cases/attachments', [CaseController::class, 'storeAttachment']);
        Route::delete('/cases/attachments/{attachmentId}', [CaseController::class, 'deleteAttachment']);
        // Case notes (authenticated)
        Route::get('/cases/{caseId}/notes', [CaseController::class, 'getCaseNotes']);
        Route::post('/cases/notes', [CaseController::class, 'storeNote']);
        Route::put('/cases/notes/{noteId}', [CaseController::class, 'updateNote']);
        Route::delete('/cases/notes/{noteId}', [CaseController::class, 'deleteNote']);
        // Case chats (authenticated)
        Route::get('/cases/{caseId}/chats', [CaseController::class, 'getCaseChats']);
        Route::get('/cases/{caseId}/chats/unread-count', [CaseController::class, 'getUnreadChatCount']);
        Route::put('/cases/{caseId}/chats/mark-read', [CaseController::class, 'markChatMessagesAsRead']);
        Route::post('/cases/chats', [CaseController::class, 'storeChatMessage']);
        Route::post('/cases/chats/audio', [CaseController::class, 'storeChatAudio']);
        Route::post('/cases/chats/image', [CaseController::class, 'storeChatImage']);
        // Advise chats (authenticated: admin & case manager)
        Route::get('/cases/{caseId}/legal-support', [AdviseChatController::class, 'index']);
        Route::get('/cases/{caseId}/legal-support/unread-count', [AdviseChatController::class, 'getUnreadCount']);
        Route::put('/cases/{caseId}/legal-support/mark-read', [AdviseChatController::class, 'markAsRead']);
        Route::post('/cases/legal-support', [AdviseChatController::class, 'storeMessage']);
        Route::post('/cases/legal-support/audio', [AdviseChatController::class, 'storeAudio']);
        Route::post('/cases/legal-support/image', [AdviseChatController::class, 'storeImage']);
        // Admin-only Role & Permission management (SPA session auth) - require verified email
        Route::middleware(['role:admin'])->group(function () {
            // Role and permission
            Route::apiResource('roles', RoleController::class);
            Route::get('roles/{role}/edit', [RoleController::class, 'edit']);
            Route::put('roles/{role}/permissions', [RoleController::class, 'updatePermissions']);
            Route::apiResource('permissions', PermissionController::class);
            // User role and permission assignment (custom routes)
            Route::prefix('users/{user}')->group(function () {
                Route::post('/assign-role', [UserController::class, 'assignRole']);
                Route::delete('/remove-role', [UserController::class, 'removeRole']);
                Route::post('/assign-permission', [UserController::class, 'assignPermission']);
                Route::delete('/remove-permission', [UserController::class, 'removePermission']);
                Route::get('/roles', [UserController::class, 'getUserRoles']);
                Route::get('/permissions', [UserController::class, 'getUserPermissions']);
                Route::post('/resend-welcome', [UserController::class, 'resendWelcome']);
            });
            // Admin: activity logs for all users
            Route::get('/activity-logs', [ActivityLogController::class, 'indexAll']);
        });
    });
});
