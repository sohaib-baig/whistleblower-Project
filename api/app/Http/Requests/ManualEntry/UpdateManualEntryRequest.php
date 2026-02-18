<?php

namespace App\Http\Requests\ManualEntry;

use Illuminate\Foundation\Http\FormRequest;

class UpdateManualEntryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('manual_entry'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'report_date' => 'sometimes|required|date',
            'total_spend' => 'sometimes|numeric|min:0|max:999999999999.99', // Will be calculated
            'total_revenue' => 'sometimes|numeric|min:0|max:999999999999.99', // Will be calculated
            'campaign_breakdown' => 'sometimes|required|array|min:1',
            'campaign_breakdown.*.ad_account_id' => 'required|string|max:255',
            'campaign_breakdown.*.vertical_campaign_name' => 'required|string|max:255',
            'campaign_breakdown.*.spend' => 'required|numeric|min:0|max:999999999999.99',
            'campaign_breakdown.*.revenue' => 'required|numeric|min:0|max:999999999999.99',
        ];

        // media_buyer_id can only be updated by users with manage permission
        $user = $this->user();
        if ($user && ($user->hasRole('admin') || $user->hasPermissionTo('manual_entries.manage'))) {
            $rules['media_buyer_id'] = 'sometimes|required|uuid|exists:users,id';
        }
        // If user doesn't have manage permission, media_buyer_id cannot be changed

        return $rules;
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'media_buyer_id' => 'media buyer',
            'report_date' => 'report date',
            'total_spend' => 'total spend',
            'total_revenue' => 'total revenue',
            'campaign_breakdown' => 'campaign breakdown',
        ];
    }
}
