<?php

namespace App\Http\Controllers;

use App\Models\Page;
use App\Models\User;
use Illuminate\Http\Request;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\Page\UpdatePageRequest;
use App\Http\Controllers\Concerns\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class PageController extends Controller
{
    use AuthorizesRequests, ApiResponse;

    /**
     * Get privacy policy page
     */
    public function privacy_policy(Request $request): JsonResponse
    {
        $language = $request->query('language', $this->getLanguageFromRequest($request));
        $page = $this->resolvePageForUser($request, 'privacy_policy', $language);

        if (!$page) {
            $payload = $this->getDefaultPagePayload('privacy_policy');
            $payload['language'] = $language;
            return $this->success($payload, 'Privacy policy not found');
        }

        return $this->success($page);
    }

    /**
     * Update privacy policy page
     */
    public function update_privacy_policy(UpdatePageRequest $request): JsonResponse
    {
        $data = $request->validated();
        $language = $data['language'] ?? 'en';
        
        $page = $this->resolveEditablePage($request, 'privacy_policy', $language);

        $oldData = $page->only(['page_title', 'page_content', 'status', 'language']);

        // Process content to extract and save base64 images
        $processedContent = $this->processContentImages($data['page_content'], $page->id ?? 'temp');

        $page->page_title = $data['page_title'];
        $page->page_content = $processedContent;
        $page->language = $language;
        if (isset($data['status'])) {
            $page->status = $data['status'];
        }
        $page->user_id = $this->resolveOwnerId($request, $page);
        $page->save();

        // Clean up old images that are no longer in content
        if ($page->id) {
            $this->cleanupUnusedImages($processedContent, $page->id);
        }

        app(AuditLogger::class)->log($request, 'privacy_policy.updated', 'Page', $page->id, [
            'changes' => array_diff_assoc($data, $oldData),
        ]);

        return $this->success($page, 'Privacy policy updated successfully');
    }

    /**
     * Get about us page
     */
    public function about_us(Request $request): JsonResponse
    {
        $page = Page::where('page_type', 'about_us')->first();

        if (!$page) {
            return $this->error('About us not found', 404);
        }

        return $this->success($this->getTranslatedPage($page, $request));
    }

    /**
     * Update about us page
     */
    public function update_about_us(UpdatePageRequest $request): JsonResponse
    {
        $data = $request->validated();
        
        $page = Page::where('page_type', 'about_us')->first();

        if (!$page) {
            // Create new about us if it doesn't exist
            $page = new Page();
            $page->page_type = 'about_us';
            $page->user_id = $request->user()->id;
        }

        $oldData = $page->only(['page_title', 'page_content']);

        // Process content to extract and save base64 images
        $processedContent = $this->processContentImages($data['page_content'], $page->id ?? 'temp');

        $page->page_title = $data['page_title'];
        $page->page_content = $processedContent;
        $page->user_id = $request->user()->id;
        $page->save();

        // Clean up old images that are no longer in content
        if ($page->id) {
            $this->cleanupUnusedImages($processedContent, $page->id);
        }

        app(AuditLogger::class)->log($request, 'about_us.updated', 'Page', $page->id, [
            'changes' => array_diff_assoc($data, $oldData),
        ]);

        return $this->success($page, 'About us updated successfully');
    }

    /**
     * Get login page
     */
    public function login(Request $request): JsonResponse
    {
        $page = Page::where('page_type', 'login')->first();

        if (!$page) {
            // Return default values instead of error, matching public endpoint behavior
            $language = $this->getLanguageFromRequest($request);
            $defaultTitle = 'Hi, Welcome back';
            $defaultContent = '<p>More effectively with optimized workflows.</p>';
            
            // Translate defaults if not English
            if ($language !== 'en') {
                try {
                    $translationService = app(\App\Services\TranslationService::class);
                    $translatedTitle = $translationService->translate(
                        \App\Models\Page::class,
                        'default',
                        'page_title',
                        $defaultTitle,
                        $language,
                        'en'
                    ) ?? $defaultTitle;
                    
                    $translatedContent = $translationService->translate(
                        \App\Models\Page::class,
                        'default',
                        'page_content',
                        $defaultContent,
                        $language,
                        'en'
                    ) ?? $defaultContent;
                    
                    return $this->success([
                        'id' => null,
                        'page_type' => 'login',
                        'page_title' => $translatedTitle,
                        'page_content' => $translatedContent,
                        'language' => $language,
                    ], 'No login page found, using defaults');
                } catch (\Exception $e) {
                    // If translation fails (e.g., API key not configured), return English defaults
                    Log::warning('Translation failed in login page, using defaults', [
                        'error' => $e->getMessage(),
                        'language' => $language,
                    ]);
                }
            }
            
            return $this->success([
                'id' => null,
                'page_type' => 'login',
                'page_title' => $defaultTitle,
                'page_content' => $defaultContent,
            ], 'No login page found, using defaults');
        }

        return $this->success($this->getTranslatedPage($page, $request));
    }

    /**
     * Update login page
     */
    public function update_login(UpdatePageRequest $request): JsonResponse
    {
        $data = $request->validated();
        
        $page = Page::where('page_type', 'login')->first();

        if (!$page) {
            // Create new login page if it doesn't exist
            $page = new Page();
            $page->page_type = 'login';
            $page->user_id = $request->user()->id;
        }

        $oldData = $page->only(['page_title', 'page_content']);

        // Process content to extract and save base64 images
        $processedContent = $this->processContentImages($data['page_content'], $page->id ?? 'temp');

        // Allow empty/null title - set to null if empty string or null
        $page->page_title = !empty($data['page_title']) ? $data['page_title'] : null;
        $page->page_content = $processedContent;
        $page->user_id = $request->user()->id;
        $page->save();

        // Clean up old images that are no longer in content
        if ($page->id) {
            $this->cleanupUnusedImages($processedContent, $page->id);
        }

        app(AuditLogger::class)->log($request, 'login.updated', 'Page', $page->id, [
            'changes' => array_diff_assoc($data, $oldData),
        ]);

        return $this->success($page, 'Login page updated successfully');
    }

    /**
     * Get payment page
     */
    public function payment(Request $request): JsonResponse
    {
        $page = Page::where('page_type', 'payment')->first();

        if (!$page) {
            // Return default values instead of error, matching login page behavior
            $language = $this->getLanguageFromRequest($request);
            $defaultTitle = 'Payment Information';
            $defaultContent = '<p>Manage your payment information and billing details.</p>';
            
            // Translate defaults if not English
            if ($language !== 'en') {
                try {
                    $translationService = app(\App\Services\TranslationService::class);
                    $translatedTitle = $translationService->translate(
                        \App\Models\Page::class,
                        'default',
                        'page_title',
                        $defaultTitle,
                        $language,
                        'en'
                    ) ?? $defaultTitle;
                    
                    $translatedContent = $translationService->translate(
                        \App\Models\Page::class,
                        'default',
                        'page_content',
                        $defaultContent,
                        $language,
                        'en'
                    ) ?? $defaultContent;
                    
                    return $this->success([
                        'id' => null,
                        'page_type' => 'payment',
                        'page_title' => $translatedTitle,
                        'page_content' => $translatedContent,
                        'language' => $language,
                    ], 'No payment page found, using defaults');
                } catch (\Exception $e) {
                    // If translation fails (e.g., API key not configured), return English defaults
                    Log::warning('Translation failed in payment page, using defaults', [
                        'error' => $e->getMessage(),
                        'language' => $language,
                    ]);
                }
            }
            
            return $this->success([
                'id' => null,
                'page_type' => 'payment',
                'page_title' => $defaultTitle,
                'page_content' => $defaultContent,
            ], 'No payment page found, using defaults');
        }

        return $this->success($this->getTranslatedPage($page, $request));
    }

    /**
     * Update payment page
     */
    public function update_payment(UpdatePageRequest $request): JsonResponse
    {
        $data = $request->validated();
        
        $page = Page::where('page_type', 'payment')->first();

        if (!$page) {
            // Create new payment page if it doesn't exist
            $page = new Page();
            $page->page_type = 'payment';
            $page->user_id = $request->user()->id;
        }

        $oldData = $page->only(['page_title', 'page_content']);

        // Process content to extract and save base64 images
        $processedContent = $this->processContentImages($data['page_content'], $page->id ?? 'temp');

        $page->page_title = $data['page_title'];
        $page->page_content = $processedContent;
        $page->user_id = $request->user()->id;
        $page->save();

        // Clean up old images that are no longer in content
        if ($page->id) {
            $this->cleanupUnusedImages($processedContent, $page->id);
        }

        app(AuditLogger::class)->log($request, 'payment.updated', 'Page', $page->id, [
            'changes' => array_diff_assoc($data, $oldData),
        ]);

        return $this->success($page, 'Payment page updated successfully');
    }

    /**
     * Get policy page (company-specific)
     */
    public function policy(Request $request): JsonResponse
    {
        $user = $request->user();
        $companyId = null;

        // If user is a company, use their own ID
        if ($user->hasRole('company')) {
            $companyId = $user->id;
        } 
        // If user is a case manager, use their company_id
        elseif ($user->hasRole('case_manager') && $user->company_id) {
            $companyId = $user->company_id;
        } else {
            return $this->error('Unauthorized: Only company and case manager users can access policy page', 403);
        }

        $page = Page::where('page_type', 'company_policy')
            ->where('user_id', $companyId)
            ->first();

        if (!$page) {
            // Return default values
            $language = $this->getLanguageFromRequest($request);
            $defaultTitle = 'Company Policy';
            $defaultContent = '<p>Company policy content goes here.</p>';
            
            // Translate defaults if not English
            if ($language !== 'en') {
                try {
                    $translationService = app(\App\Services\TranslationService::class);
                    $translatedTitle = $translationService->translate(
                        \App\Models\Page::class,
                        'default',
                        'page_title',
                        $defaultTitle,
                        $language,
                        'en'
                    ) ?? $defaultTitle;
                    
                    $translatedContent = $translationService->translate(
                        \App\Models\Page::class,
                        'default',
                        'page_content',
                        $defaultContent,
                        $language,
                        'en'
                    ) ?? $defaultContent;
                    
                    return $this->success([
                        'id' => null,
                        'page_type' => 'company_policy',
                        'page_title' => $translatedTitle,
                        'page_content' => $translatedContent,
                        'language' => $language,
                    ], 'No policy page found, using defaults');
                } catch (\Exception $e) {
                    Log::warning('Translation failed in policy page, using defaults', [
                        'error' => $e->getMessage(),
                        'language' => $language,
                    ]);
                }
            }
            
            return $this->success([
                'id' => null,
                'page_type' => 'company_policy',
                'page_title' => $defaultTitle,
                'page_content' => $defaultContent,
            ], 'No policy page found, using defaults');
        }

        return $this->success($this->getTranslatedPage($page, $request));
    }

    /**
     * Update policy page (only company users can update)
     */
    public function update_policy(UpdatePageRequest $request): JsonResponse
    {
        $user = $request->user();
        
        // Only company users can update policy page
        if (!$user->hasRole('company')) {
            return $this->error('Unauthorized: Only company users can update policy page', 403);
        }

        $data = $request->validated();
        
        $page = Page::where('page_type', 'company_policy')
            ->where('user_id', $user->id)
            ->first();

        if (!$page) {
            // Create new policy page if it doesn't exist
            $page = new Page();
            $page->page_type = 'company_policy';
            $page->user_id = $user->id;
        }

        $oldData = $page->only(['page_title', 'page_content']);

        // Process content to extract and save base64 images
        $processedContent = $this->processContentImages($data['page_content'], $page->id ?? 'temp');

        // Allow empty/null title - set to null if empty string or null
        $page->page_title = !empty($data['page_title']) ? $data['page_title'] : null;
        $page->page_content = $processedContent;
        $page->user_id = $user->id;
        $page->save();

        // Clean up old images that are no longer in content
        if ($page->id) {
            $this->cleanupUnusedImages($processedContent, $page->id);
        }

        app(AuditLogger::class)->log($request, 'policy.updated', 'Page', $page->id, [
            'changes' => array_diff_assoc($data, $oldData),
        ]);

        return $this->success($page, 'Policy page updated successfully');
    }

    /**
     * Get terms & conditions page
     */
    public function terms_condition(Request $request): JsonResponse
    {
        $language = $request->query('language', $this->getLanguageFromRequest($request));
        $page = $this->resolvePageForUser($request, 'terms_conditions', $language);

        if (!$page) {
            $payload = $this->getDefaultPagePayload('terms_conditions');
            $payload['language'] = $language;
            return $this->success($payload, 'Terms & conditions not found');
        }

        return $this->success($page);
    }

    /**
     * Update terms & conditions page
     */
    public function update_terms_condition(UpdatePageRequest $request): JsonResponse
    {
        $data = $request->validated();
        $language = $data['language'] ?? 'en';
        
        $page = $this->resolveEditablePage($request, 'terms_conditions', $language);

        $oldData = $page->only(['page_title', 'page_content', 'status', 'language']);

        // Process content to extract and save base64 images
        $processedContent = $this->processContentImages($data['page_content'], $page->id ?? 'temp');

        $page->page_title = $data['page_title'];
        $page->page_content = $processedContent;
        $page->language = $language;
        if (isset($data['status'])) {
            $page->status = $data['status'];
        }
        $page->user_id = $this->resolveOwnerId($request, $page);
        $page->save();

        // Clean up old images that are no longer in content
        if ($page->id) {
            $this->cleanupUnusedImages($processedContent, $page->id);
        }

        app(AuditLogger::class)->log($request, 'terms_conditions.updated', 'Page', $page->id, [
            'changes' => array_diff_assoc($data, $oldData),
        ]);

        return $this->success($page, 'Terms & conditions updated successfully');
    }

    /**
     * Get support page
     */
    public function support(Request $request): JsonResponse
    {
        $language = $request->query('language', $this->getLanguageFromRequest($request));
        $page = $this->resolvePageForUser($request, 'support', $language);

        if (!$page) {
            $payload = $this->getDefaultPagePayload('support');
            $payload['language'] = $language;
            return $this->success($payload, 'Support page not found');
        }

        return $this->success($page);
    }

    /**
     * Update support page
     */
    public function update_support(UpdatePageRequest $request): JsonResponse
    {
        $data = $request->validated();
        $language = $data['language'] ?? 'en';
        
        $page = $this->resolveEditablePage($request, 'support', $language);

        $oldData = $page->only(['page_title', 'page_content', 'status', 'language']);

        // Process content to extract and save base64 images
        $processedContent = $this->processContentImages($data['page_content'], $page->id ?? 'temp');

        $page->page_title = $data['page_title'];
        $page->page_content = $processedContent;
        $page->language = $language;
        if (isset($data['status'])) {
            $page->status = $data['status'];
        }
        $page->user_id = $this->resolveOwnerId($request, $page);
        $page->save();

        // Clean up old images that are no longer in content
        if ($page->id) {
            $this->cleanupUnusedImages($processedContent, $page->id);
        }

        app(AuditLogger::class)->log($request, 'support.updated', 'Page', $page->id, [
            'changes' => array_diff_assoc($data, $oldData),
        ]);

        return $this->success($page, 'Support page updated successfully');
    }

    /**
     * Get create case page
     */
    public function create_case(Request $request): JsonResponse
    {
        $page = Page::where('page_type', 'create_case')->first();

        if (!$page) {
            return $this->error('Create case page not found', 404);
        }

        return $this->success($this->getTranslatedPage($page, $request));
    }

    /**
     * Update create case page
     */
    public function update_create_case(UpdatePageRequest $request): JsonResponse
    {
        $data = $request->validated();
        
        $page = Page::where('page_type', 'create_case')->first();

        if (!$page) {
            // Create new create case page if it doesn't exist
            $page = new Page();
            $page->page_type = 'create_case';
            $page->user_id = $request->user()->id;
        }

        $oldData = $page->only(['page_title', 'page_content']);

        // Process content to extract and save base64 images
        $processedContent = $this->processContentImages($data['page_content'], $page->id ?? 'temp');

        $page->page_title = $data['page_title'];
        $page->page_content = $processedContent;
        $page->user_id = $request->user()->id;
        $page->save();

        // Clean up old images that are no longer in content
        if ($page->id) {
            $this->cleanupUnusedImages($processedContent, $page->id);
        }

        app(AuditLogger::class)->log($request, 'create_case.updated', 'Page', $page->id, [
            'changes' => array_diff_assoc($data, $oldData),
        ]);

        return $this->success($page, 'Create case page updated successfully');
    }

    /**
     * Get reporting page
     */
    public function reporting_page(Request $request): JsonResponse
    {
        $language = $request->query('language', 'en');
        $page = Page::where('page_type', 'reporting_page')
            ->where('user_id', $request->user()->id)
            ->where('language', $language)
            ->first();

        if (!$page) {
            return $this->success([
                'page_title' => '',
                'page_content' => '',
                'language' => $language,
            ], 'No reporting page found');
        }

        return $this->success($page);
    }

    /**
     * Update reporting page
     */
    public function update_reporting_page(UpdatePageRequest $request): JsonResponse
    {
        $data = $request->validated();
        $language = $data['language'] ?? 'en';
        
        $page = Page::where('page_type', 'reporting_page')
            ->where('user_id', $request->user()->id)
            ->where('language', $language)
            ->first();

        if (!$page) {
            // Create new reporting page if it doesn't exist
            $page = new Page();
            $page->page_type = 'reporting_page';
            $page->language = $language;
            $page->user_id = $request->user()->id;
        }

        $oldData = $page->only(['page_title', 'page_content', 'language']);

        // Process content to extract and save base64 images
        $processedContent = $this->processContentImages($data['page_content'], $page->id ?? 'temp');

        $page->page_title = $data['page_title'];
        $page->page_content = $processedContent;
        $page->language = $language;
        $page->user_id = $request->user()->id;
        $page->save();

        // Clean up old images that are no longer in content
        if ($page->id) {
            $this->cleanupUnusedImages($processedContent, $page->id);
        }

        app(AuditLogger::class)->log($request, 'reporting_page.updated', 'Page', $page->id, [
            'changes' => array_diff_assoc($data, $oldData),
        ]);

        return $this->success($page, 'Reporting page updated successfully');
    }

    /**
     * Public: Get reporting page content for a given company slug or id (no auth)
     * Supports both slug and ID for backward compatibility
     */
    public function public_reporting_page(Request $request, ?string $identifier = null): JsonResponse
    {
        // Get company identifier from route parameter or query parameter (for backward compatibility)
        $companyIdentifier = $identifier ?? $request->query('company');
        
        $query = Page::where('page_type', 'reporting_page');
        
        // If company identifier is provided, find the company and filter by user_id
        if ($companyIdentifier) {
            // Try to find company by slug first, then by ID
            $company = User::where('company_slug', $companyIdentifier)
                ->orWhere('id', $companyIdentifier)
                ->first();
            
            if ($company) {
                $query->where('user_id', $company->id);
            } else {
                // If company not found, return empty page
                return $this->success([
                    'page_title' => '',
                    'page_content' => '',
                    'page_type' => 'reporting_page',
                ], 'No reporting page found');
            }
        }
        
        $page = $query->first();

        if (!$page) {
            return $this->success([
                'page_title' => '',
                'page_content' => '',
                'page_type' => 'reporting_page',
            ], 'No reporting page found');
        }

        return $this->success($this->getTranslatedPage($page, $request));
    }

    /**
     * Public: Get login page content (no auth required)
     */
    public function public_login_page(Request $request): JsonResponse
    {
        $page = Page::where('page_type', 'login')->first();

        if (!$page) {
            return $this->success([
                'page_title' => 'Hi, Welcome back',
                'page_content' => '<p>More effectively with optimized workflows.</p>',
                'page_type' => 'login',
            ], 'No login page found, using defaults');
        }

        return $this->success($this->getTranslatedPage($page, $request));
    }

    /**
     * Public: Get payment page content (no auth required)
     */
    public function public_payment_page(Request $request): JsonResponse
    {
        $page = Page::where('page_type', 'payment')->first();

        if (!$page) {
            return $this->success([
                'page_title' => 'Payment Information',
                'page_content' => '<p>Manage your payment information and billing details.</p>',
                'page_type' => 'payment',
            ], 'No payment page found, using defaults');
        }

        return $this->success($this->getTranslatedPage($page, $request));
    }

    /**
     * Public: Get about us page content (no auth required)
     */
    public function public_about_us(Request $request): JsonResponse
    {
        // Get company slug from query parameter
        $companySlug = $request->query('company');
        
        $query = Page::where('page_type', 'about_us');
        
        // If company slug is provided, filter by user_id (which represents the company)
        if ($companySlug) {
            $query->where('user_id', $companySlug);
        }
        
        $page = $query->first();

        if (!$page) {
            return $this->success([
                'page_title' => 'About Us',
                'page_content' => '<p>Content not available.</p>',
                'page_type' => 'about_us',
            ], 'No about us page found, using defaults');
        }

        return $this->success($this->getTranslatedPage($page, $request));
    }

    /**
     * Public: Get privacy policy page content (no auth required)
     */
    public function public_privacy_policy(Request $request): JsonResponse
    {
        // Get company slug from query parameter
        $companySlug = $request->query('company');
        
        $page = $this->resolvePublicPage('privacy_policy', $companySlug, $request);

        if (!$page) {
            return $this->success([
                'page_title' => 'Privacy Policy',
                'page_content' => '<p>Content not available.</p>',
                'page_type' => 'privacy_policy',
            ], 'No privacy policy page found, using defaults');
        }

        return $this->success($this->getTranslatedPage($page, $request));
    }

    /**
     * Public: Get terms & conditions page content (no auth required)
     */
    public function public_terms_conditions(Request $request): JsonResponse
    {
        // Get company slug from query parameter
        $companySlug = $request->query('company');
        
        $page = $this->resolvePublicPage('terms_conditions', $companySlug, $request);

        if (!$page) {
            return $this->success([
                'page_title' => 'Terms & Conditions',
                'page_content' => '<p>Content not available.</p>',
                'page_type' => 'terms_conditions',
            ], 'No terms & conditions page found, using defaults');
        }

        return $this->success($this->getTranslatedPage($page, $request));
    }

    /**
     * Public: Get support page content (no auth required)
     * Always shows admin/global support page instead of company-specific support page
     */
    public function public_support(Request $request): JsonResponse
    {
        // Always use admin/global support page, not company-specific support page
        $page = $this->getGlobalPage('support');

        if (!$page) {
            return $this->success([
                'page_title' => 'Support',
                'page_content' => '<p>Content not available.</p>',
                'page_type' => 'support',
            ], 'No support page found, using defaults');
        }

        return $this->success($this->getTranslatedPage($page, $request));
    }

    /**
     * Public: Get create case page content (no auth required)
     */
    public function public_create_case(Request $request): JsonResponse
    {
        // Get company slug from query parameter
        $companySlug = $request->query('company');
        
        $query = Page::where('page_type', 'create_case');
        
        // If company slug is provided, filter by user_id (which represents the company)
        if ($companySlug) {
            $query->where('user_id', $companySlug);
        }
        
        $page = $query->first();

        if (!$page) {
            // Return translated defaults
            $language = $this->getLanguageFromRequest($request);
            $defaultTitle = 'Create a New Report';
            $defaultContent = '<p>Please fill out the form below to submit your report.</p>';
            
            // Translate defaults if not English
            if ($language !== 'en') {
                $translationService = app(\App\Services\TranslationService::class);
                $translatedTitle = $translationService->translate(
                    \App\Models\Page::class,
                    'default',
                    'page_title',
                    $defaultTitle,
                    $language,
                    'en'
                ) ?? $defaultTitle;
                
                $translatedContent = $translationService->translate(
                    \App\Models\Page::class,
                    'default',
                    'page_content',
                    $defaultContent,
                    $language,
                    'en'
                ) ?? $defaultContent;
                
                return $this->success([
                    'page_title' => $translatedTitle,
                    'page_content' => $translatedContent,
                    'page_type' => 'create_case',
                ], 'No create case page found, using defaults');
            }
            
            return $this->success([
                'page_title' => $defaultTitle,
                'page_content' => $defaultContent,
                'page_type' => 'create_case',
            ], 'No create case page found, using defaults');
        }

        return $this->success($this->getTranslatedPage($page, $request));
    }

    /**
     * Public: Get page by slug (no auth required)
     */
    public function public_page_by_slug(Request $request, string $companySlug, string $pageSlug): JsonResponse
    {
        // Find company by slug or ID
        $company = User::where('company_slug', $companySlug)
            ->orWhere('id', $companySlug)
            ->first();

        if (!$company || !$company->hasRole('company')) {
            return $this->error('Company not found', 404);
        }

        // Find page by slug and company
        $page = Page::where('page_slug', $pageSlug)
            ->where('user_id', $company->id)
            ->where('status', 'active')
            ->first();

        if (!$page) {
            return $this->error('Page not found', 404);
        }

        return $this->success($this->getTranslatedPage($page, $request));
    }

    /**
     * Public: Get active navigation pages for a company (no auth required)
     */
    public function public_navigation_pages(Request $request): JsonResponse
    {
        // Get company slug from query parameter
        $companySlug = $request->query('company');
        
        // Page types that should appear in navigation
        $navigationPageTypes = ['privacy_policy', 'terms_conditions', 'support'];
        
        $pages = [];
        
        foreach ($navigationPageTypes as $pageType) {
            // For support pages, always use admin/global page instead of company-specific page
            if ($pageType === 'support') {
                $page = $this->getGlobalPage($pageType);
            } else {
                $page = $this->resolvePublicPage($pageType, $companySlug, $request);
            }
            
            // Only include pages that exist and are active
            if ($page && ($page->status ?? 'active') === 'active') {
                $translatedPage = $this->getTranslatedPage($page, $request);
                $pages[] = [
                    'page_type' => $pageType,
                    'page_title' => $translatedPage['page_title'] ?? '',
                    'page_slug' => $page->page_slug ?? $this->getPageRoute($pageType), // Use page_slug if available, fallback to route
                    'route' => $this->getPageRoute($pageType), // Keep route for backward compatibility
                ];
            }
        }
        
        return $this->success($pages, 'Navigation pages retrieved successfully');
    }

    /**
     * Get route path for a page type
     */
    private function getPageRoute(string $pageType): string
    {
        $routeMap = [
            'privacy_policy' => 'privacy-policy',
            'terms_conditions' => 'terms-and-condition',
            'support' => 'support',
        ];
        
        return $routeMap[$pageType] ?? '';
    }

    /**
     * Get translated page data based on request language
     */
    private function getTranslatedPage(Page $page, Request $request): array
    {
        $language = $this->getLanguageFromRequest($request);
        
        // Log for debugging
        Log::info('Getting translated page', [
            'page_type' => $page->page_type,
            'requested_language' => $language,
            'accept_language_header' => $request->header('Accept-Language'),
        ]);
        
        // If language is English, return original
        if ($language === 'en') {
            return $page->toArray();
        }

        // Get translated fields
        $translatedTitle = $page->getTranslated('page_title', $language);
        $translatedContent = $page->getTranslated('page_content', $language);

        $pageData = $page->toArray();
        $pageData['page_title'] = $translatedTitle ?? $pageData['page_title'];
        $pageData['page_content'] = $translatedContent ?? $pageData['page_content'];
        $pageData['language'] = $language;
        
        // Log translation results
        Log::info('Translation result', [
            'title_translated' => $translatedTitle !== null,
            'content_translated' => $translatedContent !== null,
            'title_length' => mb_strlen($translatedTitle ?? $pageData['page_title']),
            'content_length' => mb_strlen($translatedContent ?? $pageData['page_content']),
        ]);

        return $pageData;
    }

    private function resolvePageForUser(Request $request, string $pageType, string $language = 'en'): ?Page
    {
        $companyId = $this->getCompanyIdFromRequest($request);

        if ($companyId) {
            $page = $this->getCompanyPage($pageType, $companyId, $language);
            if ($page) {
                return $page;
            }
        }

        return $this->getGlobalPage($pageType, $language);
    }

    private function resolveEditablePage(Request $request, string $pageType, string $language = 'en'): Page
    {
        $companyId = $this->getCompanyIdFromRequest($request);

        if ($companyId) {
            $page = $this->getCompanyPage($pageType, $companyId, $language);
            if ($page) {
                return $page;
            }
        } else {
            $page = $this->getGlobalPage($pageType, $language);
            if ($page) {
                return $page;
            }
        }

        $page = new Page();
        $page->page_type = $pageType;
        $page->language = $language;
        $page->user_id = $companyId ?: $request->user()->id;

        return $page;
    }

    private function getCompanyIdFromRequest(Request $request): ?string
    {
        $user = $request->user();
        if ($user && $user->hasRole('company')) {
            return $user->id;
        }
        return null;
    }

    private function getCompanyPage(string $pageType, string $companyId, string $language = 'en'): ?Page
    {
        return Page::where('page_type', $pageType)
            ->where('user_id', $companyId)
            ->where('language', $language)
            ->first();
    }

    private function getGlobalPage(string $pageType, string $language = 'en'): ?Page
    {
        return Page::where('page_type', $pageType)
            ->where('language', $language)
            ->whereHas('user.roles', function($query) {
                $query->where('name', 'admin');
            })
            ->orderByDesc('updated_at')
            ->first();
    }

    private function resolveOwnerId(Request $request, Page $page): string
    {
        $companyId = $this->getCompanyIdFromRequest($request);

        if ($companyId) {
            return $companyId;
        }

        return $request->user()->id;
    }

    private function getDefaultPagePayload(string $pageType): array
    {
        return [
            'id' => null,
            'page_type' => $pageType,
            'page_title' => '',
            'page_content' => '',
        ];
    }

    private function resolvePublicPage(string $pageType, ?string $companySlugOrId, Request $request = null): ?Page
    {
        if ($companySlugOrId) {
            // First try to find company by slug or ID
            $company = User::where('company_slug', $companySlugOrId)
                ->orWhere('id', $companySlugOrId)
                ->first();
            
            if ($company && $company->hasRole('company')) {
                $companyId = $company->id;
                $language = $request ? $this->getLanguageFromRequest($request) : 'en';
                $page = $this->getCompanyPage($pageType, $companyId, $language);
                if ($page) {
                    return $page;
                }
            }
        }

        $language = $request ? $this->getLanguageFromRequest($request) : 'en';
        return $this->getGlobalPage($pageType, $language);
    }

    /**
     * Extract language from request
     */
    private function getLanguageFromRequest(Request $request): string
    {
        $language = $request->header('Accept-Language') 
            ?? $request->query('lang') 
            ?? $request->input('language')
            ?? 'en';

        // Extract language code (e.g., 'sv-SE' -> 'sv')
        $language = strtolower(explode('-', $language)[0]);
        
        // Validate against supported languages
        $supported = ['en', 'sv', 'no', 'da', 'fi', 'de', 'fr'];
        return in_array($language, $supported) ? $language : 'en';
    }

    /**
     * Process content to extract base64 images and save them as files
     * 
     * @param string $content HTML content that may contain base64 images
     * @param string $pageId Page ID for organizing images
     * @return string Processed content with base64 images replaced with file URLs
     */
    private function processContentImages(string $content, string $pageId): string
    {
        // Pattern to match base64 data URLs in img src attributes
        $pattern = '/<img[^>]+src=["\'](data:image\/([^;]+);base64,([^"\']+))["\'][^>]*>/i';
        
        return preg_replace_callback($pattern, function ($matches) use ($pageId) {
            $fullDataUrl = $matches[1];
            $imageType = $matches[2]; // e.g., 'png', 'jpeg', 'gif'
            $base64Data = $matches[3];
            $fullMatch = $matches[0];

            try {
                // Decode base64 data
                $imageData = base64_decode($base64Data, true);
                
                if ($imageData === false) {
                    Log::warning('Failed to decode base64 image', ['page_id' => $pageId]);
                    return $fullMatch; // Return original if decoding fails
                }

                // Validate image size (max 10MB after decoding)
                if (strlen($imageData) > 10 * 1024 * 1024) {
                    Log::warning('Image too large after decoding', [
                        'page_id' => $pageId,
                        'size' => strlen($imageData)
                    ]);
                    return $fullMatch; // Return original if too large
                }

                // Determine file extension
                $extension = $imageType === 'jpeg' ? 'jpg' : $imageType;
                if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                    $extension = 'png'; // Default to png
                }

                // Generate unique filename
                $filename = uniqid('img_', true) . '.' . $extension;
                $directory = 'pages/' . $pageId;
                $path = $directory . '/' . $filename;

                // Ensure directory exists
                Storage::disk('public')->makeDirectory($directory);

                // Save image file
                Storage::disk('public')->put($path, $imageData);

                // Get public URL
                $url = Storage::disk('public')->url($path);

                // Replace base64 data URL with file URL in the img tag
                return str_replace($fullDataUrl, $url, $fullMatch);
            } catch (\Exception $e) {
                Log::error('Error processing base64 image', [
                    'page_id' => $pageId,
                    'error' => $e->getMessage()
                ]);
                return $fullMatch; // Return original on error
            }
        }, $content);
    }

    /**
     * Clean up unused images from storage
     * 
     * @param string $content Current page content
     * @param string $pageId Page ID
     */
    private function cleanupUnusedImages(string $content, string $pageId): void
    {
        try {
            $directory = 'pages/' . $pageId;
            
            if (!Storage::disk('public')->exists($directory)) {
                return;
            }

            // Get all files in the page directory
            $files = Storage::disk('public')->files($directory);
            
            // Extract all image URLs from content
            preg_match_all('/<img[^>]+src=["\']([^"\']+)["\'][^>]*>/i', $content, $matches);
            $usedUrls = $matches[1] ?? [];
            
            // Convert URLs to relative paths
            $usedPaths = [];
            foreach ($usedUrls as $url) {
                // Extract path from full URL
                if (strpos($url, '/storage/') !== false) {
                    $path = str_replace('/storage/', '', parse_url($url, PHP_URL_PATH));
                    $usedPaths[] = $path;
                } elseif (strpos($url, 'pages/') !== false) {
                    // Already a relative path
                    $usedPaths[] = $url;
                }
            }

            // Delete files that are not in the content
            foreach ($files as $file) {
                if (!in_array($file, $usedPaths)) {
                    Storage::disk('public')->delete($file);
                }
            }
        } catch (\Exception $e) {
            Log::error('Error cleaning up unused images', [
                'page_id' => $pageId,
                'error' => $e->getMessage()
            ]);
        }
    }
}

