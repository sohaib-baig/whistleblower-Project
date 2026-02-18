<?php

namespace App\Http\Controllers;

use App\Models\EmailTemplate;
use App\Models\Translation;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Requests\EmailTemplate\StoreEmailTemplateRequest;
use App\Http\Requests\EmailTemplate\UpdateEmailTemplateRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Services\AuditLogger;
use App\Services\TranslationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class EmailTemplateController extends Controller
{
    use AuthorizesRequests, ApiResponse;

    /**
     * List all email templates
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $search = $request->string('search')->toString();
        $status = $request->string('status', 'all')->toString();
        $sort = $request->string('sort', 'created_at')->toString();
        $order = $request->string('order', 'desc')->toString();

        $query = EmailTemplate::query();

        // Search filter
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        // Sorting
        $allowedSorts = ['name', 'subject', 'status', 'language', 'created_at'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $order);
        }

        $templates = $query->paginate($perPage);

        return $this->success($templates);
    }

    /**
     * Show a specific email template
     */
    public function show(EmailTemplate $emailTemplate): JsonResponse
    {
        return $this->success($emailTemplate);
    }

    /**
     * Get email template by name and language
     */
    public function getByNameAndLanguage(Request $request): JsonResponse
    {
        $name = $request->string('name')->toString();
        $language = $request->string('language', 'en')->toString();

        if (empty($name)) {
            return $this->error('Template name is required', 400);
        }

        $template = EmailTemplate::where('name', $name)
            ->where('language', $language)
            ->first();

        if (!$template) {
            return $this->success(null, 'Template not found');
        }

        return $this->success($template);
    }

    /**
     * Create a new email template
     */
    public function store(StoreEmailTemplateRequest $request): JsonResponse
    {
        $data = $request->validated();

        $template = EmailTemplate::create($data);

        app(AuditLogger::class)->log($request, 'email_template.created', 'EmailTemplate', $template->id, [
            'name' => $template->name,
            'subject' => $template->subject,
            'status' => $template->status,
        ]);

        return $this->success($template, 'Email template created successfully', 201);
    }

    /**
     * Update an existing email template
     * If template with same name+language exists, update it; otherwise update current template
     */
    public function update(UpdateEmailTemplateRequest $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $data = $request->validated();
        
        $templateName = $data['name'] ?? $emailTemplate->name;
        $templateLanguage = $data['language'] ?? $emailTemplate->language;
        
        // Check if template with same name and language exists (excluding current template)
        $existingTemplate = EmailTemplate::where('name', $templateName)
            ->where('language', $templateLanguage)
            ->where('id', '!=', $emailTemplate->id)
            ->first();

        if ($existingTemplate) {
            // Update the existing template instead
            $oldData = $existingTemplate->only(['name', 'subject', 'status', 'content', 'placeholder', 'language']);
            $existingTemplate->update($data);
            
            // Soft delete the current template if it's different
            if ($emailTemplate->id !== $existingTemplate->id) {
                $emailTemplate->delete();
            }

            app(AuditLogger::class)->log($request, 'email_template.updated', 'EmailTemplate', $existingTemplate->id, [
                'changes' => array_diff_assoc($data, $oldData),
                'note' => 'Updated existing template with same name+language',
            ]);

            return $this->success($existingTemplate, 'Email template updated successfully');
        }

        // Check if current template already has the same name+language combination
        // If name or language changed, check if we need to create a new entry
        $currentName = $emailTemplate->name;
        $currentLanguage = $emailTemplate->language;
        
        if (($templateName !== $currentName || $templateLanguage !== $currentLanguage) && 
            !EmailTemplate::where('name', $templateName)
                ->where('language', $templateLanguage)
                ->where('id', '!=', $emailTemplate->id)
                ->exists()) {
            // Name or language changed, and no template exists with new combination
            // Update current template with new values
            $oldData = $emailTemplate->only(['name', 'subject', 'status', 'content', 'placeholder', 'language']);
            $emailTemplate->update($data);
            
            app(AuditLogger::class)->log($request, 'email_template.updated', 'EmailTemplate', $emailTemplate->id, [
                'changes' => array_diff_assoc($data, $oldData),
            ]);

            return $this->success($emailTemplate, 'Email template updated successfully');
        }

        // No conflict, update the current template
        $oldData = $emailTemplate->only(['name', 'subject', 'status', 'content', 'placeholder', 'language']);
        $emailTemplate->update($data);

        app(AuditLogger::class)->log($request, 'email_template.updated', 'EmailTemplate', $emailTemplate->id, [
            'changes' => array_diff_assoc($data, $oldData),
        ]);

        return $this->success($emailTemplate, 'Email template updated successfully');
    }

    /**
     * Delete an email template (soft delete)
     */
    public function destroy(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $templateData = $emailTemplate->only(['name', 'subject', 'status']);
        $emailTemplate->delete();

        app(AuditLogger::class)->log($request, 'email_template.deleted', 'EmailTemplate', $emailTemplate->id, $templateData);

        return $this->success(null, 'Email template deleted successfully', 204);
    }

    /**
     * Convert email template to another language
     * Only English templates can be converted
     */
    public function convert(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        // Validate that source template is English
        if ($emailTemplate->language !== 'en') {
            return $this->error('Only English templates can be converted to other languages', 400);
        }

        // Validate target language
        $targetLanguage = $request->string('target_language')->toString();
        if (empty($targetLanguage)) {
            return $this->error('Target language is required', 400);
        }

        // Validate target language is supported and not English
        if (!in_array($targetLanguage, Translation::supportedLanguages())) {
            return $this->error('Unsupported target language', 400);
        }

        if ($targetLanguage === 'en') {
            return $this->error('Cannot convert to English (source language)', 400);
        }

        try {
            $translationService = app(TranslationService::class);

            // Translate subject with placeholder protection
            $translatedSubject = $translationService->translateWithPlaceholderProtection(
                $emailTemplate->subject,
                $targetLanguage,
                'en'
            );

            if ($translatedSubject === null) {
                return $this->error('Failed to translate email template subject', 500);
            }

            // Translate content with placeholder protection
            $translatedContent = $translationService->translateWithPlaceholderProtection(
                $emailTemplate->content,
                $targetLanguage,
                'en'
            );

            if ($translatedContent === null) {
                return $this->error('Failed to translate email template content', 500);
            }

            // Check if template with same name and target language already exists
            $existingTemplate = EmailTemplate::where('name', $emailTemplate->name)
                ->where('language', $targetLanguage)
                ->first();

            if ($existingTemplate) {
                // Update existing template
                $oldData = $existingTemplate->only(['name', 'subject', 'status', 'content', 'placeholder', 'language']);
                $existingTemplate->update([
                    'subject' => $translatedSubject,
                    'content' => $translatedContent,
                    'status' => $emailTemplate->status, // Preserve status from source
                    'placeholder' => $emailTemplate->placeholder, // Preserve placeholder field
                ]);

                app(AuditLogger::class)->log($request, 'email_template.converted', 'EmailTemplate', $existingTemplate->id, [
                    'source_template_id' => $emailTemplate->id,
                    'source_language' => 'en',
                    'target_language' => $targetLanguage,
                    'action' => 'updated_existing',
                    'changes' => array_diff_assoc($existingTemplate->only(['subject', 'content']), $oldData),
                ]);

                return $this->success($existingTemplate, 'Email template converted and updated successfully');
            } else {
                // Create new template
                $newTemplate = EmailTemplate::create([
                    'name' => $emailTemplate->name, // Keep same name
                    'subject' => $translatedSubject,
                    'content' => $translatedContent,
                    'status' => $emailTemplate->status, // Preserve status from source
                    'placeholder' => $emailTemplate->placeholder, // Preserve placeholder field
                    'language' => $targetLanguage,
                ]);

                app(AuditLogger::class)->log($request, 'email_template.converted', 'EmailTemplate', $newTemplate->id, [
                    'source_template_id' => $emailTemplate->id,
                    'source_language' => 'en',
                    'target_language' => $targetLanguage,
                    'action' => 'created_new',
                ]);

                return $this->success($newTemplate, 'Email template converted successfully', 201);
            }
        } catch (\Exception $e) {
            Log::error('Failed to convert email template', [
                'template_id' => $emailTemplate->id,
                'target_language' => $targetLanguage,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->error('Failed to convert email template: ' . $e->getMessage(), 500);
        }
    }
}

