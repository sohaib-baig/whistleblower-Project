<?php

namespace App\Http\Requests\News;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNewsRequest extends FormRequest
{
    public function authorize(): bool
    {
        // If impersonating, check the original admin's permissions
        if ($this->session()->has('impersonator_id')) {
            $impersonatorId = $this->session()->get('impersonator_id');
            $admin = \App\Models\User::find($impersonatorId);
            return $admin?->can('users.create') ?? false;
        }
        
        $user = $this->user();

        // Only admin users can create news
        if ($user && $user->hasRole('company')) {
            return false;
        }

        return $user?->can('news.create') ?? $user?->can('users.create') ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string', 'min:20'],
            'cover_image' => ['nullable', 'string', 'max:500'],
            'status' => ['required', 'string', Rule::in(['draft', 'published', 'archived'])],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'meta_keywords' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Title is required',
            'title.max' => 'Title cannot exceed 255 characters',
            'content.required' => 'Content is required',
            'content.min' => 'Content must be at least 20 characters',
            'status.required' => 'Status is required',
            'status.in' => 'Status must be draft, published, or archived',
            'cover_image.max' => 'Cover image path is too long',
            'meta_title.max' => 'Meta title cannot exceed 255 characters',
            'meta_description.max' => 'Meta description cannot exceed 500 characters',
            'meta_keywords.max' => 'Meta keywords cannot exceed 500 characters',
        ];
    }
}
