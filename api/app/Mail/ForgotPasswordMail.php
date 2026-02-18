<?php

namespace App\Mail;

use App\Models\User;
use App\Services\EmailTemplateService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ForgotPasswordMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public string $resetUrl)
    {
    }

    public function build(): self
    {
        /** @var EmailTemplateService $service */
        $service = app(EmailTemplateService::class);

        $rendered = $service->renderByName('Password Reset', [
            'user' => $this->user,
            'name' => $this->user->name ?? $this->user->email,
            'first_name' => $this->user->first_name ?? '',
            'email' => $this->user->email,
            'reset_link' => $this->resetUrl,
            'reset_url' => $this->resetUrl,
        ], [
            'language' => $this->user->user_language ?? 'en',
            'fallback_subject' => 'Reset your ' . (config('app.name') ?? 'account') . ' password',
            'fallback_content' => view('emails.templates.default-reset-password', [
                'user' => $this->user,
                'appName' => config('app.name'),
            ])->render(),
            'subcopy' => view('emails.templates.default-reset-password-subcopy', [
                'resetUrl' => $this->resetUrl,
            ])->render(),
            'button' => [
                'label' => 'Reset password',
                'url' => $this->resetUrl,
            ],
            'force_button' => true,
            'force_subcopy' => true,
        ]);

        return $this
            ->subject($rendered['subject'])
            ->html($rendered['html']);
    }
}
