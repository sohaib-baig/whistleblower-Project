<?php

namespace App\Mail;

use App\Services\EmailTemplateService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AdminNotificationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $emailSubject,
        public string $emailContent
    ) {
    }

    public function build(): self
    {
        /** @var EmailTemplateService $service */
        $service = app(EmailTemplateService::class);

        $html = $service->wrapContent($this->emailContent, [
            'fallback_content' => $this->emailContent,
        ]);

        return $this
            ->subject($this->emailSubject)
            ->html($html);
    }
}
