<?php

namespace App\Http\Requests\CaseRequest;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class StoreAttachmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Public endpoint, authorization can be added if needed
    }

    /**
     * Prepare the data for validation.
     * Check for PHP upload errors before validation.
     */
    protected function prepareForValidation(): void
    {
        // Check for PHP upload errors
        if (isset($_FILES['file']) && $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            $error = $_FILES['file']['error'];
            $errorMessages = [
                UPLOAD_ERR_INI_SIZE => 'The file exceeds the upload_max_filesize directive in php.ini. Current limit: ' . ini_get('upload_max_filesize'),
                UPLOAD_ERR_FORM_SIZE => 'The file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form.',
                UPLOAD_ERR_PARTIAL => 'The file was only partially uploaded.',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded.',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder.',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
                UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload.',
            ];
            
            $errorMessage = $errorMessages[$error] ?? 'Unknown upload error (code: ' . $error . ')';
            
            // Merge error into request so validation can catch it
            $this->merge(['_upload_error' => $errorMessage]);
        } elseif (empty($_FILES) && $this->isMethod('POST') && $this->has('file')) {
            // File field exists but no file received - likely PHP post_max_size exceeded
            $postMaxSize = ini_get('post_max_size');
            $uploadMaxSize = ini_get('upload_max_filesize');
            $this->merge([
                '_upload_error' => "No file received. The request may exceed PHP's post_max_size limit ({$postMaxSize}) or upload_max_filesize limit ({$uploadMaxSize}). Please update php.ini. See MAMP_PHP_CONFIG.md for instructions."
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'case_id' => ['required', 'string', 'uuid', 'exists:cases,id'],
            'file' => [
                'required',
                'file',
                'max:20480', // 20MB max file size
                File::types(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'webm', 'ogg', 'wav', 'mp3', 'mpeg', 'opus']),
            ],
            'attachment_name' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Check for upload errors we detected in prepareForValidation
            if ($this->has('_upload_error')) {
                $errorMessage = $this->input('_upload_error');
                $diagnosticUrl = url('/check-upload-limits.php');
                $validator->errors()->add('file', $errorMessage);
                $validator->errors()->add('file', "Check your PHP settings: {$diagnosticUrl}");
            }
            
            // Additional check: if file field exists but file is not valid
            if ($this->hasFile('file')) {
                $file = $this->file('file');
                if (!$file->isValid()) {
                    $error = $file->getError();
                    $uploadMaxSize = ini_get('upload_max_filesize');
                    $postMaxSize = ini_get('post_max_size');
                    $phpIniFile = php_ini_loaded_file();
                    
                    $errorMessages = [
                        UPLOAD_ERR_INI_SIZE => "The file exceeds the upload_max_filesize directive in php.ini. Current limit: {$uploadMaxSize}. Required: 20M. Update php.ini file: {$phpIniFile}",
                        UPLOAD_ERR_FORM_SIZE => 'The file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form.',
                        UPLOAD_ERR_PARTIAL => 'The file was only partially uploaded.',
                        UPLOAD_ERR_NO_FILE => 'No file was uploaded.',
                        UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder.',
                        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
                        UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload.',
                    ];
                    
                    $errorMessage = $errorMessages[$error] ?? 'Unknown upload error (code: ' . $error . ')';
                    $validator->errors()->add('file', $errorMessage);
                    
                    // Add helpful diagnostic link
                    $diagnosticUrl = url('/check-upload-limits.php');
                    $validator->errors()->add('file', "Diagnostic tool: {$diagnosticUrl}");
                }
            } elseif (isset($_FILES['file']['error']) && $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                // File was attempted but failed
                $error = $_FILES['file']['error'];
                $uploadMaxSize = ini_get('upload_max_filesize');
                $postMaxSize = ini_get('post_max_size');
                
                $errorMessages = [
                    UPLOAD_ERR_INI_SIZE => "File too large. Current upload_max_filesize: {$uploadMaxSize}. Required: 20M. Current post_max_size: {$postMaxSize}. Required: 24M.",
                    UPLOAD_ERR_FORM_SIZE => 'The file exceeds the form MAX_FILE_SIZE.',
                    UPLOAD_ERR_PARTIAL => 'The file was only partially uploaded.',
                    UPLOAD_ERR_NO_FILE => 'No file was uploaded.',
                    UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder.',
                    UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
                    UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload.',
                ];
                
                $errorMessage = $errorMessages[$error] ?? 'Upload error (code: ' . $error . ')';
                $validator->errors()->add('file', $errorMessage);
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'case_id.required' => 'Case ID is required.',
            'case_id.uuid' => 'Case ID must be a valid UUID.',
            'case_id.exists' => 'Case not found.',
            'file.required' => 'File is required.',
            'file.file' => 'The uploaded file is invalid. Please check PHP upload settings.',
            'file.max' => 'File size must not exceed 20MB.',
            'attachment_name.required' => 'Document name is required.',
            'attachment_name.max' => 'Document name must not exceed 255 characters.',
        ];
    }
}











