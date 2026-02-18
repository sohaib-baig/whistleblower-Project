<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    use AuthorizesRequests, ApiResponse;

    /**
     * List all categories
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $search = $request->string('search')->toString();
        $status = $request->string('status', 'all')->toString();
        $sort = $request->string('sort', 'created_at')->toString();
        $order = $request->string('order', 'desc')->toString();

        $query = Category::query();

        // Search filter
        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        // Status filter
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        // Sorting
        $allowedSorts = ['name', 'status', 'created_at'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $order);
        }

        $categories = $query->paginate($perPage);

        return $this->success($categories);
    }

    /**
     * Get active categories for public use (e.g., case creation form)
     */
    public function getActive(): JsonResponse
    {
        // Get language from request
        $language = $this->getLanguageFromRequest(request());
        
        $categories = Category::where('status', 'active')
            ->orderBy('name', 'asc')
            ->get();

        // Map to final format with translations
        $translatedCategories = $categories->map(function ($category) use ($language) {
            // Get translated category name
            $translatedName = $category->getTranslated('name', $language);
            
            return [
                'id' => $category->id,
                'name' => $translatedName ?? $category->name,
                'status' => $category->status,
            ];
        })->values();

        return $this->success($translatedCategories);
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
                $primaryLang = trim(explode(';', $languages[0])[0]);
                $langCode = strtolower(explode('-', $primaryLang)[0]);
                
                // Validate against supported languages
                $supported = ['en', 'sv', 'no', 'da', 'fi', 'de', 'fr'];
                if (in_array($langCode, $supported)) {
                    return $langCode;
                }
            }
        }
        
        // Default to English
        return 'en';
    }

    /**
     * Show a specific category
     */
    public function show(Category $category): JsonResponse
    {
        return $this->success($category);
    }

    /**
     * Create a new category
     */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();

        $category = new Category();
        $category->name = $data['name'];
        $category->status = $data['status'] ?? 'active';
        $category->save();

        app(AuditLogger::class)->log($request, 'category.created', 'Category', $category->id, [
            'name' => $category->name,
            'status' => $category->status,
        ]);

        return $this->success($category, 'Category created successfully', 201);
    }

    /**
     * Update an existing category
     */
    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $data = $request->validated();
        $oldData = $category->only(['name', 'status']);

        foreach (['name', 'status'] as $field) {
            if (array_key_exists($field, $data)) {
                $category->{$field} = $data[$field];
            }
        }

        $category->save();

        app(AuditLogger::class)->log($request, 'category.updated', 'Category', $category->id, [
            'changes' => array_diff_assoc($data, $oldData),
        ]);

        return $this->success($category, 'Category updated successfully');
    }

    /**
     * Delete a category (soft delete)
     */
    public function destroy(Request $request, Category $category): JsonResponse
    {
        $categoryData = $category->only(['name', 'status']);
        $category->delete();

        app(AuditLogger::class)->log($request, 'category.deleted', 'Category', $category->id, $categoryData);

        return $this->success(null, 'Category deleted successfully', 204);
    }
}
