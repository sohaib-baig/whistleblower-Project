<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\User;
use App\Services\EmailTemplateService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AdminPaymentNotificationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $company,
        public Order $order,
        public string $emailSubject,
        public string $emailTemplateContent
    ) {
    }

    public function build(): self
    {
        /** @var EmailTemplateService $service */
        $service = app(EmailTemplateService::class);

        $html = $service->wrapContent($this->emailTemplateContent, [
            'fallback_content' => $this->emailTemplateContent,
        ]);

        return $this
            ->subject($this->emailSubject)
            ->html($html);
    }
}


