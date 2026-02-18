<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Requests\Question\StoreQuestionRequest;
use App\Http\Requests\Question\UpdateQuestionRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class QuestionController extends Controller
{
    use AuthorizesRequests, ApiResponse;

    /**
     * List all questions ordered by order field
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $questions = Question::where('user_id', $userId)
            ->orderBy('order', 'asc')
            ->get();

        return $this->success($questions);
    }

    /**
     * Show a specific question
     */
    public function show(Question $question): JsonResponse
    {
        // Verify ownership
        if ($question->user_id !== request()->user()->id) {
            return $this->error('Unauthorized', 403);
        }

        return $this->success($question);
    }

    /**
     * Create a new question
     */
    public function store(StoreQuestionRequest $request): JsonResponse
    {
        $data = $request->validated();
        $userId = $request->user()->id;

        // Calculate next order (total questions + 1)
        $maxOrder = Question::where('user_id', $userId)->max('order') ?? 0;

        DB::beginTransaction();
        try {
            $question = new Question();
            $question->user_id = $userId;
            $question->created_by = $userId; // Track who created the question
            $question->name = $data['name'];
            $question->is_required = $data['is_required'];
            $question->input_type = $data['input_type'];
            $question->options = $data['options'] ?? null;
            $question->order = $maxOrder + 1;
            $question->deletion_status = 'none';
            $question->save();
            
            // Refresh to ensure all attributes are loaded
            $question->refresh();

            // If admin, create or update copies for every company user
            if ($request->user()->hasRole('admin')) {
                $this->syncAdminQuestionCopies($question);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Failed to create question', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $userId,
                'data' => $data,
            ]);
            return $this->error('Failed to create question: ' . $e->getMessage(), 500);
        }

        app(AuditLogger::class)->log($request, 'question.created', 'Question', $question->id, [
            'name' => $question->name,
            'input_type' => $question->input_type,
            'order' => $question->order,
        ]);

        return $this->success($question, 'Question created successfully', 201);
    }

    /**
     * Update an existing question
     */
    public function update(UpdateQuestionRequest $request, Question $question): JsonResponse
    {
        // Verify ownership
        if ($question->user_id !== $request->user()->id) {
            return $this->error('Unauthorized', 403);
        }

        $data = $request->validated();
        $oldData = $question->only(['name', 'is_required', 'input_type', 'order']);

        DB::beginTransaction();
        try {
            foreach (['name', 'is_required', 'input_type', 'options', 'order'] as $field) {
                if (array_key_exists($field, $data)) {
                    $question->{$field} = $data[$field];
                }
            }

            $question->save();

            // If admin, push updates to all company copies
            if ($request->user()->hasRole('admin')) {
                $this->syncAdminQuestionCopies($question);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return $this->error('Failed to update question', 500);
        }

        app(AuditLogger::class)->log($request, 'question.updated', 'Question', $question->id, [
            'changes' => array_diff_assoc($data, $oldData),
        ]);

        return $this->success($question, 'Question updated successfully');
    }

    /**
     * Delete a question (soft delete)
     */
    public function destroy(Request $request, Question $question): JsonResponse
    {
        // Verify ownership
        if ($question->user_id !== $request->user()->id) {
            return $this->error('Unauthorized', 403);
        }

        $user = $request->user();

        // Admin removing their own question: delete and cascade to copies
        if ($user->hasRole('admin')) {
            $questionData = $question->only(['name', 'input_type', 'order']);
            $deletedOrder = $question->order;
            $userId = $question->user_id;

            DB::beginTransaction();
            try {
                $question->delete();

                // Reorder remaining admin questions
                Question::where('user_id', $userId)
                    ->where('order', '>', $deletedOrder)
                    ->decrement('order');

                // Soft delete company copies that originated from this admin question
                $copies = Question::where('source_question_id', $question->id)->get();
                foreach ($copies as $copy) {
                    $copyDeletedOrder = $copy->order;
                    $companyId = $copy->user_id;
                    $copy->deletion_status = 'approved';
                    $copy->deletion_reviewed_at = now();
                    $copy->deletion_reviewed_by = $user->id;
                    $copy->delete();

                    Question::where('user_id', $companyId)
                        ->where('order', '>', $copyDeletedOrder)
                        ->decrement('order');
                }

                DB::commit();
            } catch (\Throwable $e) {
                DB::rollBack();
                return $this->error('Failed to delete question', 500);
            }

            app(AuditLogger::class)->log($request, 'question.deleted', 'Question', $question->id, $questionData);

            return $this->success(null, 'Question deleted successfully', 204);
        }

        // Company user: soft delete directly
        $questionData = $question->only(['name', 'input_type', 'order']);
        $deletedOrder = $question->order;
        $userId = $question->user_id;

        DB::beginTransaction();
        try {
            $question->delete();

            // Reorder remaining questions for the company user
            Question::where('user_id', $userId)
                ->where('order', '>', $deletedOrder)
                ->decrement('order');

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return $this->error('Failed to delete question', 500);
        }

        app(AuditLogger::class)->log($request, 'question.deleted', 'Question', $question->id, $questionData);

        return $this->success(null, 'Question deleted successfully', 204);
    }

    /**
     * Reorder questions (for drag-and-drop)
     */
    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'questions' => ['required', 'array'],
            'questions.*.id' => ['required', 'exists:case_questions,id'],
            'questions.*.order' => ['required', 'integer', 'min:1'],
        ]);

        $userId = $request->user()->id;
        $questions = $request->input('questions');

        DB::beginTransaction();
        try {
            foreach ($questions as $questionData) {
                Question::where('id', $questionData['id'])
                    ->where('user_id', $userId) // Ensure user owns the question
                    ->update(['order' => $questionData['order']]);
            }

            DB::commit();

            app(AuditLogger::class)->log($request, 'questions.reordered', 'Question', null, [
                'question_count' => count($questions),
            ]);

            return $this->success(null, 'Questions reordered successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to reorder questions', 500);
        }
    }

    /**
     * List pending deletion requests (admin only)
     */
    public function deletionRequests(Request $request): JsonResponse
    {
        if (!$request->user()->hasRole('admin')) {
            return $this->error('Unauthorized', 403);
        }

        $requests = Question::with('user')
            ->where('deletion_status', 'pending')
            ->orderBy('deletion_requested_at', 'asc')
            ->get()
            ->map(function ($question) {
                return [
                    'id' => $question->id,
                    'name' => $question->name,
                    'input_type' => $question->input_type,
                    'order' => $question->order,
                    'company_id' => $question->user_id,
                    'company_name' => $question->user?->company_name,
                    'requested_at' => $question->deletion_requested_at,
                    'requested_by' => $question->deletion_requested_by,
                ];
            });

        return $this->success($requests);
    }

    /**
     * Approve a company user's deletion request (admin only)
     */
    public function approveDeletion(Request $request, Question $question): JsonResponse
    {
        if (!$request->user()->hasRole('admin')) {
            return $this->error('Unauthorized', 403);
        }

        if ($question->deletion_status !== 'pending') {
            return $this->error('Question is not pending deletion', 400);
        }

        $deletedOrder = $question->order;
        $userId = $question->user_id;

        DB::beginTransaction();
        try {
            $question->deletion_status = 'approved';
            $question->deletion_reviewed_at = now();
            $question->deletion_reviewed_by = $request->user()->id;
            $question->save();
            $question->delete();

            // Reorder remaining company questions
            Question::where('user_id', $userId)
                ->where('order', '>', $deletedOrder)
                ->decrement('order');

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return $this->error('Failed to approve deletion', 500);
        }

        app(AuditLogger::class)->log($request, 'question.deletion_approved', 'Question', $question->id, [
            'name' => $question->name,
            'input_type' => $question->input_type,
            'order' => $question->order,
        ]);

        return $this->success(null, 'Question deletion approved');
    }

    /**
     * Get questions for a company (public endpoint for create case page)
     * For company role users: Get questions created by admin users + questions created by the company user
     * Priority: admin questions first, then company user questions, both ordered by order column
     * Supports both slug and ID for backward compatibility
     */
    public function getByCompany(string $identifier): JsonResponse
    {
        // Get language from request
        $language = $this->getLanguageFromRequest(request());
        
        // Find company by slug or ID
        $company = User::where(function($query) use ($identifier) {
            $query->where('company_slug', $identifier)
                  ->orWhere('id', $identifier);
        })->first();
        
        if (!$company) {
            return $this->error('Company not found', 404);
        }
        
        $companyId = $company->id;
        
        // Get all user IDs that have the 'admin' role
        $adminUserIds = $this->getAdminUserIds();

        // Get questions from the company user, ordered by order column
        $companyQuestions = Question::where('user_id', $companyId)
            ->orderBy('order', 'asc')
            ->get();

        // Avoid duplicates: skip admin questions when a company-specific copy exists
        $companySourceIds = $companyQuestions->pluck('source_question_id')->filter()->toArray();

        // Get questions from admin users, excluding those already copied to the company
        $adminQuestions = Question::whereIn('user_id', $adminUserIds)
            ->whereNotIn('id', $companySourceIds)
            ->orderBy('order', 'asc')
            ->get();

        // Combine: admin-only questions first, then company questions (including admin copies)
        $allQuestions = $adminQuestions->concat($companyQuestions);

        // Map to final format with translations (already sorted: admin first, then company)
        $translationService = app(\App\Services\TranslationService::class);
        
        $questions = $allQuestions->map(function ($question) use ($language, $translationService) {
            // Get translated question name
            $translatedName = $question->getTranslated('name', $language);
            
            // Get translated options if they exist
            $translatedOptions = [];
            if ($question->options && is_array($question->options)) {
                // For options, translate each option string
                foreach ($question->options as $index => $option) {
                    if (is_string($option) && !empty($option)) {
                        // Translate each option using the translation service
                        // Use a unique field identifier for each option
                        $optionField = 'options[' . $index . ']';
                        $translatedOption = $translationService->translate(
                            Question::class,
                            $question->id,
                            $optionField,
                            $option,
                            $language,
                            'en'
                        ) ?? $option;
                        $translatedOptions[] = $translatedOption;
                    } else {
                        $translatedOptions[] = $option;
                    }
                }
            } else {
                $translatedOptions = $question->options ?? [];
            }
            
            return [
                'id' => $question->id,
                'name' => $translatedName ?? $question->name,
                'is_required' => $question->is_required === 'yes',
                'input_type' => $question->input_type,
                'options' => $translatedOptions,
                'order' => $question->order,
            ];
        })->values();

        return $this->success($questions);
    }

    /**
     * Create or update company copies for an admin-owned question
     */
    private function syncAdminQuestionCopies(Question $adminQuestion): void
    {
        $companyUserIds = $this->getCompanyUserIds();

        foreach ($companyUserIds as $companyUserId) {
            // Safeguard: skip if user record is missing (avoid FK violation)
            $companyUser = User::find($companyUserId);
            if (!$companyUser) {
                continue;
            }

            $copy = Question::withTrashed()
                ->where('source_question_id', $adminQuestion->id)
                ->where('user_id', $companyUserId)
                ->first();

            // If the company already removed this question (approved), do not recreate
            if ($copy && ($copy->trashed() || $copy->deletion_status === 'approved')) {
                continue;
            }

            if (!$copy) {
                $copy = new Question();
                $copy->source_question_id = $adminQuestion->id;
                $copy->user_id = $companyUserId;
                $copy->order = $adminQuestion->order ?? (Question::where('user_id', $companyUserId)->max('order') ?? 0) + 1;
            }

            $copy->name = $adminQuestion->name;
            // The setter will handle boolean to 'yes'/'no' conversion
            $copy->is_required = $adminQuestion->is_required;
            $copy->input_type = $adminQuestion->input_type;
            $copy->options = $adminQuestion->options;
            $copy->created_by = $adminQuestion->created_by; // Preserve the original creator (admin)
            $copy->deletion_status = 'none';
            $copy->deletion_requested_at = null;
            $copy->deletion_requested_by = null;
            $copy->deletion_reviewed_at = null;
            $copy->deletion_reviewed_by = null;

            $copy->save();
        }
    }

    /**
     * Get all admin user IDs
     */
    private function getAdminUserIds(): array
    {
        return DB::table('model_has_roles')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('roles.name', 'admin')
            ->pluck('model_has_roles.model_id')
            ->toArray();
    }

    /**
     * Get all company user IDs
     */
    private function getCompanyUserIds(): array
    {
        return DB::table('model_has_roles')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->join('users', 'users.id', '=', 'model_has_roles.model_id')
            ->where('roles.name', 'company')
            ->whereNull('users.deleted_at')
            ->pluck('users.id')
            ->toArray();
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
}
