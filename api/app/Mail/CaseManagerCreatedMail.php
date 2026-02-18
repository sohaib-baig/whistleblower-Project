<?php

namespace App\Mail;

use App\Models\User;
use App\Services\EmailTemplateService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;

class CaseManagerCreatedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $password,
        public string $companyName
    ) {
    }

    public function build(): self
    {
        // Use the company name passed to the constructor
        $companyName = !empty(trim($this->companyName)) ? trim($this->companyName) : 'Company';
        
        // Get the template directly
        /** @var \App\Models\EmailTemplate $template */
        $template = \App\Models\EmailTemplate::getByNameAndLanguage('Case Manager Created', 'en', true);
        
        if ($template) {
            // Get raw template content and subject
            $templateContent = $template->content;
            $templateSubject = $template->subject;
            
            // Build replacements array EXACTLY like CaseController does
            // This ensures [Company] is replaced the same way as [Username], [Email], [Password]
            $replacements = [
                // Username variations
                '[Username]' => $this->user->name ?? $this->user->email,
                '[username]' => $this->user->name ?? $this->user->email,
                '{{username}}' => $this->user->name ?? $this->user->email,
                '{{name}}' => $this->user->name ?? $this->user->email,
                '{{Name}}' => $this->user->name ?? $this->user->email,
                // Email variations
                '[Email]' => $this->user->email,
                '[email]' => $this->user->email,
                '{{email}}' => $this->user->email,
                '{{Email}}' => $this->user->email,
                // Password variations
                '[Password]' => $this->password,
                '[password]' => $this->password,
                '{{password}}' => $this->password,
                '{{Password}}' => $this->password,
                // Company variations - CRITICAL: Add ALL variations
                '[Company]' => $companyName,
                '[company]' => $companyName,
                '[COMPANY]' => $companyName,
                '{{Company}}' => $companyName,
                '{{company}}' => $companyName,
                '{{COMPANY}}' => $companyName,
                '{{ Company }}' => $companyName,
                '{{ company }}' => $companyName,
                '{{ COMPANY }}' => $companyName,
                '[Company Name]' => $companyName,
                '[company_name]' => $companyName,
                '[companyName]' => $companyName,
                '[ Company ]' => $companyName,
                '[ company ]' => $companyName,
                '[ COMPANY ]' => $companyName,
            ];
            
            // Replace placeholders directly in template content (like CaseController does)
            $content = str_replace(array_keys($replacements), array_values($replacements), $templateContent);
            $subject = str_replace(array_keys($replacements), array_values($replacements), $templateSubject);
            
            // Use EmailTemplateService to wrap the content
            /** @var EmailTemplateService $service */
            $service = app(EmailTemplateService::class);
            $html = $service->wrapContent($content, [
                'fallback_content' => view('emails.templates.default-case-manager-created', [
                    'user' => $this->user,
                    'password' => $this->password,
                    'companyName' => $companyName,
                    'appName' => config('app.name'),
                ])->render(),
            ]);
            
            // Final safety check - replace [Company] one more time after wrapping
            $html = str_replace('[Company]', $companyName, $html);
            $html = str_replace('[company]', $companyName, $html);
            $html = str_replace('[COMPANY]', $companyName, $html);
            $html = preg_replace('/\[Company\]/i', $companyName, $html);
            $subject = str_replace('[Company]', $companyName, $subject);
            $subject = preg_replace('/\[Company\]/i', $companyName, $subject);
        } else {
            // Fallback if template not found
            $html = view('emails.templates.default-case-manager-created', [
                'user' => $this->user,
                'password' => $this->password,
                'companyName' => $companyName,
                'appName' => config('app.name'),
            ])->render();
            
            /** @var EmailTemplateService $service */
            $service = app(EmailTemplateService::class);
            $html = $service->wrapContent($html);
            $subject = 'Case Manager Account Created';
        }

        return $this
            ->subject($subject)
            ->html($html);
    }
    
}


