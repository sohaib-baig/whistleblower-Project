<?php

namespace App\Mail;

use App\Models\User;
use App\Services\EmailTemplateService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AccountVerificationMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public User $user,
        public string $verificationUrl,
    ) {
    }

    public function build(): self
    {
        /** @var EmailTemplateService $service */
        $service = app(EmailTemplateService::class);

        $rendered = $service->renderByName('Account Verification', [
            'user' => $this->user,
            'name' => $this->user->name ?? $this->user->email,
            'first_name' => $this->user->first_name ?? '',
            'email' => $this->user->email,
            'verification_link' => $this->verificationUrl,
            'verification_url' => $this->verificationUrl,
        ], [
            'language' => $this->user->user_language ?? 'en',
            'fallback_subject' => 'Verify your email address',
            'fallback_content' => view('emails.templates.default-account-verification', [
                'user' => $this->user,
                'verificationUrl' => $this->verificationUrl,
                'appName' => config('app.name'),
            ])->render(),
            'button' => [
                'label' => 'Verify email',
                'url' => $this->verificationUrl,
            ],
            'force_button' => true,
        ]);

        return $this
            ->subject($rendered['subject'])
            ->html($rendered['html']);
    }
}


