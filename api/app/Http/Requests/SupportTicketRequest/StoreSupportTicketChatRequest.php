<?php

namespace App\Http\Requests\SupportTicketRequest;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupportTicketChatRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'support_ticket_id' => ['required', 'uuid', 'exists:support_tickets,id'],
            'content' => ['required', 'string'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf,doc,docx,txt', 'max:10240'],
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
            'support_ticket_id.required' => 'Support ticket ID is required.',
            'support_ticket_id.exists' => 'The selected support ticket does not exist.',
            'content.required' => 'Message content is required.',
            'attachment.file' => 'Attachment must be a valid file.',
            'attachment.mimes' => 'Attachment must be a file of type: jpg, jpeg, png, pdf, doc, docx, txt.',
            'attachment.max' => 'Attachment must not be larger than 10MB.',
        ];
    }
}