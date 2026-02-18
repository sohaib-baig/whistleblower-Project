<?php

namespace App\Http\Requests\ManualEntry;

use Illuminate\Foundation\Http\FormRequest;

class StoreManualEntryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\ManualEntry::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'report_date' => 'required|date',
            'total_spend' => 'sometimes|numeric|min:0|max:999999999999.99', // Will be calculated
            'total_revenue' => 'sometimes|numeric|min:0|max:999999999999.99', // Will be calculated
            'campaign_breakdown' => 'required|array|min:1',
            'campaign_breakdown.*.ad_account_id' => 'required|string|max:255',
            'campaign_breakdown.*.vertical_campaign_name' => 'required|string|max:255',
            'campaign_breakdown.*.spend' => 'required|numeric|min:0|max:999999999999.99',
            'campaign_breakdown.*.revenue' => 'required|numeric|min:0|max:999999999999.99',
        ];

        // media_buyer_id validation based on permissions
        $user = $this->user();
        if ($user && ($user->hasRole('admin') || $user->hasPermissionTo('manual_entries.manage'))) {
            // Users with manage permission can select media buyers
            $rules['media_buyer_id'] = 'required|uuid|exists:users,id';
        } else {
            // Users with only create permission cannot select media buyers (will be auto-set)
            $rules['media_buyer_id'] = 'sometimes|uuid|exists:users,id';
        }

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
