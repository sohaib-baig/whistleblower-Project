<?php

namespace App\Http\Requests\CaseRequest;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class StoreCaseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    /**
     * Prepare the data for validation.
     * Handles JSON strings from FormData requests.
     * Converts company slug to UUID if needed.
     */
    protected function prepareForValidation(): void
    {
        // Parse JSON fields if they come as strings (from FormData)
        if ($this->has('personal_details') && is_string($this->input('personal_details'))) {
            $parsed = json_decode($this->input('personal_details'), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $this->merge(['personal_details' => $parsed]);
            }
        }

        if ($this->has('answers') && is_string($this->input('answers'))) {
            $parsed = json_decode($this->input('answers'), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $this->merge(['answers' => $parsed]);
            }
        }

        // Convert company slug to UUID if provided as slug
        if ($this->has('company_id')) {
            $companyIdentifier = $this->input('company_id');
            
            // Check if it's a valid UUID
            if (!Str::isUuid($companyIdentifier)) {
                // Not a UUID, try to find by slug
                $company = User::where('company_slug', $companyIdentifier)
                    ->orWhere('id', $companyIdentifier)
                    ->first();
                
                if ($company) {
                    $this->merge(['company_id' => $company->id]);
                }
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'company_id' => ['required', 'uuid', 'exists:users,id'],
            // Note: 'oral' is kept for backward compatibility but is now combined with 'written' functionality
            // Frontend will always send 'written' for combined written/oral cases
            'reporting_medium' => ['required', 'in:written,oral,phone_call,physical_meeting'],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'report_type' => ['required', 'in:report_annonymously,report_with_personal_details'],
            'personal_details' => ['nullable', 'array'],
            'personal_details.name' => ['nullable', 'string', 'max:255'],
            'personal_details.email' => ['nullable', 'email', 'max:255'],
            'personal_details.phone' => ['nullable', 'string', 'max:255'],
            'personal_details.address' => ['nullable', 'string'],
            'case_category_id' => ['required', 'uuid', 'exists:categories,id'],
            'case_manager_id' => ['nullable', 'uuid', 'exists:users,id'],
            'email' => ['nullable', 'email', 'max:255'],
            'password' => ['nullable', 'string', 'min:8', 'max:255'],
            'meeting_address' => ['nullable', 'string', 'max:500'],
            'answers' => ['required', 'array'],
            'answers.*.question_id' => ['required', 'uuid', 'exists:case_questions,id'],
            'answers.*.answer' => ['nullable', 'string'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'company_id.required' => 'Company ID is required.',
            'company_id.exists' => 'The selected company does not exist.',
            'reporting_medium.required' => 'Reporting medium is required.',
            'reporting_medium.in' => 'Invalid reporting medium selected.',
            'report_type.required' => 'Report type is required.',
            'report_type.in' => 'Invalid report type selected.',
            'case_category_id.required' => 'Category is required.',
            'case_category_id.exists' => 'The selected category does not exist.',
            'case_manager_id.exists' => 'The selected case manager does not exist.',
            'email.email' => 'Please provide a valid email address.',
            'password.min' => 'Password must be at least 8 characters.',
            'answers.required' => 'At least one answer is required.',
            'answers.*.question_id.required' => 'Question ID is required for each answer.',
            'answers.*.question_id.exists' => 'One or more question IDs are invalid.',
        ];
    }
}
