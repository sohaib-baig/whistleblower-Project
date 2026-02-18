<?php

namespace App\Mail;

use App\Models\User;
use App\Services\EmailTemplateService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;

class WelcomeSetPasswordMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public string $setPasswordUrl)
    {
    }

    public function build(): self
    {
        /** @var EmailTemplateService $service */
        $service = app(EmailTemplateService::class);

        $rendered = $service->renderByName('Welcome Set Password', [
            'user' => $this->user,
            'name' => $this->user->name ?? $this->user->email,
            'first_name' => $this->user->first_name ?? '',
            'email' => $this->user->email,
            'set_password_url' => $this->setPasswordUrl,
            'set_password_link' => $this->setPasswordUrl,
            'activation_link' => $this->setPasswordUrl,
        ], [
            'language' => $this->user->user_language ?? 'en',
            'fallback_subject' => 'Welcome to ' . (config('app.name') ?? 'our platform') . ' — Set your password',
            'fallback_content' => view('emails.templates.default-welcome-set-password', [
                'user' => $this->user,
                'appName' => config('app.name'),
            ])->render(),
            'subcopy' => view('emails.templates.default-welcome-set-password-subcopy', [
                'setPasswordUrl' => $this->setPasswordUrl,
            ])->render(),
            'button' => [
                'label' => 'Set password',
                'url' => $this->setPasswordUrl,
            ],
            'force_button' => true,
            'force_subcopy' => true,
        ]);

        return $this
            ->subject($rendered['subject'])
            ->html($rendered['html']);
    }
}

