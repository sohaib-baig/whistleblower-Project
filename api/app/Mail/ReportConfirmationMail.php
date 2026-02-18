<?php

namespace App\Mail;

use App\Services\EmailTemplateService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ReportConfirmationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $username,
        public string $password,
        public string $emailTemplateContent,
        public string $emailSubject
    ) {
    }

    public function build(): self
    {
        $content = str_replace(
            ['[Username]', '[username]', '{{username}}', '{{name}}'],
            $this->username,
            $this->emailTemplateContent
        );

        $content = str_replace(
            ['[password]', '[Password]', '{{password}}', '{{Password}}'],
            $this->password,
            $content
        );

        /** @var EmailTemplateService $service */
        $service = app(EmailTemplateService::class);

        $html = $service->wrapContent($content, [
            'fallback_content' => $content,
        ]);

        return $this
            ->subject($this->emailSubject)
            ->html($html);
    }
}
