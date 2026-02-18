<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Requests\News\StoreNewsRequest;
use App\Http\Requests\News\UpdateNewsRequest;
use App\Models\News;
use App\Services\AuditLogger;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class NewsController extends Controller
{
    use AuthorizesRequests, ApiResponse;

    /**
     * List all news items
     * Company users can only see news created by admin users
     */
    public function index(Request $request): JsonResponse
    {
        $query = News::with('user:id,name,email')->latest();

        $currentUser = $request->user();

        // Company users can only see news created by admin users
        if ($currentUser->hasRole('company')) {
            $query->whereHas('user.roles', function($q) {
                $q->where('name', 'admin');
            });
        } elseif ($currentUser->hasRole('case_manager') && $currentUser->company_id) {
            // Case managers see news from their company (admin-created)
            $query->whereHas('user.roles', function($q) {
                $q->where('name', 'admin');
            });
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%")
                  ->orWhere('meta_keywords', 'like', "%{$search}%");
            });
        }

        // Get all news (no pagination for now)
        $news = $query->get();
        
        // Add cover URLs
        $news->each(function ($item) {
            if ($item->cover_image) {
                $item->cover_url = Storage::disk('public')->url($item->cover_image);
            }
        });

        return $this->success($news);
    }

    /**
     * Show a specific news item
     */
    public function show(News $news): JsonResponse
    {
        $news->load('user:id,name,email,avatar_path');
        
        // Increment view count
        $news->increment('total_views');
        
        // Add cover URL if cover image exists
        if ($news->cover_image) {
            $news->cover_url = Storage::disk('public')->url($news->cover_image);
        }
        
        return $this->success($news);
    }

    /**
     * Create a new news item
     * Only admin users can create news
     */
    public function store(StoreNewsRequest $request): JsonResponse
    {
        // Only admin users can create news
        if ($request->user()->hasRole('company')) {
            return $this->error('This action is unauthorized. Only admin users can create news.', 403);
        }

        if (!$request->user()->can('news.create') && !$request->user()->can('users.create')) {
            return $this->error('This action is unauthorized.', 403);
        }

        $data = $request->validated();
        $userId = $request->user()->id;

        $news = new News();
        $news->user_id = $userId;
        $news->title = $data['title'];
        $news->content = $data['content'];
        $news->cover_image = $data['cover_image'] ?? null;
        $news->status = $data['status'] ?? 'draft';
        $news->meta_title = $data['meta_title'] ?? null;
        $news->meta_description = $data['meta_description'] ?? null;
        $news->meta_keywords = $data['meta_keywords'] ?? null;
        $news->save();

        app(AuditLogger::class)->log($request, 'news.created', 'News', $news->id, [
            'title' => $news->title,
            'status' => $news->status,
        ]);

        return $this->success($news->load('user:id,name,email'), 'News created successfully', 201);
    }

    /**
     * Update an existing news item
     * Only admin users can update news
     */
    public function update(UpdateNewsRequest $request, News $news): JsonResponse
    {
        $currentUser = $request->user();
        // Only admin users can update news
        if ($currentUser->hasRole('company')) {
            return $this->error('Unauthorized. Only admin users can update news.', 403);
        }

        $data = $request->validated();
        $oldData = $news->only(['title', 'status', 'content']);

        // Handle cover image deletion - delete file before updating
        if (array_key_exists('cover_image', $data) && $data['cover_image'] === null && $news->cover_image) {
            // Delete the old cover image file from storage
            Storage::disk('public')->delete($news->cover_image);
        }

        foreach (['title', 'content', 'cover_image', 'status', 'meta_title', 'meta_description', 'meta_keywords'] as $field) {
            if (array_key_exists($field, $data)) {
                $news->{$field} = $data[$field];
            }
        }

        $news->save();

        app(AuditLogger::class)->log($request, 'news.updated', 'News', $news->id, [
            'changes' => array_diff_assoc($data, $oldData),
        ]);

        return $this->success($news->load('user:id,name,email'), 'News updated successfully');
    }

    /**
     * Delete a news item (soft delete)
     * Only admin users can delete news
     */
    public function destroy(Request $request, News $news): JsonResponse
    {
        $currentUser = $request->user();
        // Only admin users can delete news
        if ($currentUser->hasRole('company')) {
            return $this->error('Unauthorized. Only admin users can delete news.', 403);
        }

        $newsData = $news->only(['title', 'status']);
        
        // Delete cover image if exists
        if ($news->cover_image) {
            Storage::disk('public')->delete($news->cover_image);
        }
        
        $news->delete();

        app(AuditLogger::class)->log($request, 'news.deleted', 'News', $news->id, $newsData);

        return $this->success(null, 'News deleted successfully', 204);
    }

    /**
     * Upload cover image for news
     */
    public function uploadCover(Request $request, News $news): JsonResponse
    {
        $request->validate([
            'cover' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'], // 5MB max
        ]);

        $file = $request->file('cover');

        // Delete old cover image if exists
        if ($news->cover_image) {
            Storage::disk('public')->delete($news->cover_image);
        }

        // Store new image
        $path = $file->store('news/covers', 'public');
        $news->cover_image = $path;
        $news->save();

        app(AuditLogger::class)->log($request, 'news.cover.upload', 'News', $news->id, [
            'cover_path' => $path,
        ]);

        return $this->success([
            'cover_image' => $path,
            'cover_url' => Storage::disk('public')->url($path),
        ], 'Cover image uploaded successfully');
    }
}
