<?php

namespace App\Services;

use App\Mail\ChatNotificationMail;
use App\Models\EmailTemplate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ChatEmailService
{
    private ?EmailTemplate $templateCache = null;

    /**
     * Send chat notification email using the "Chat" email template.
     */
    public function send(string $senderName, string $recipientName, string $recipientEmail, string $chatLink, string $message): void
    {
        $recipientEmail = trim($recipientEmail);

        if ($recipientEmail === '') {
            return;
        }

        $template = $this->getTemplate();

        $replacements = $this->buildReplacements($senderName, $recipientName, $chatLink, $message);

        $subject = $template
            ? strtr($template->subject, $replacements)
            : "New chat message from {$senderName}";

        $content = $template
            ? strtr($template->content, $replacements)
            : $this->buildFallbackContent($senderName, $recipientName, $chatLink, $message);

        try {
            Mail::to($recipientEmail)->queue(new ChatNotificationMail($subject, $content));
        } catch (\Throwable $exception) {
            Log::error('Failed to send chat notification email.', [
                'recipient' => $recipientEmail,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    /**
     * Retrieve the Chat email template (cached per request).
     */
    private function getTemplate(): ?EmailTemplate
    {
        if ($this->templateCache !== null) {
            return $this->templateCache;
        }

        $template = EmailTemplate::query()
            ->where('name', 'Chat')
            ->where('status', 'active')
            ->first();

        if (!$template) {
            Log::warning('Chat email template not found or inactive.');
        }

        return $this->templateCache = $template;
    }

    /**
     * Build placeholder replacements for the Chat template.
     *
     * @return array<string, string>
     */
    private function buildReplacements(string $senderName, string $recipientName, string $chatLink, string $message): array
    {
        $senderName = trim($senderName) !== '' ? $senderName : 'User';
        $recipientName = trim($recipientName) !== '' ? $recipientName : 'User';
        $safeLink = e($chatLink);
        $linkHtml = '<a href="' . $safeLink . '">Open Chat</a>';
        $rawMessage = trim($message) !== '' ? $message : 'You have received a new chat message.';
        $safeMessage = e($rawMessage);
        $htmlMessage = nl2br($safeMessage);

        return [
            '[Username1]' => $senderName,
            '[username1]' => $senderName,
            '[USERNAME1]' => $senderName,
            '{{Username1}}' => $senderName,
            '{{username1}}' => $senderName,
            '{{USERNAME1}}' => $senderName,
            '%username1%' => $senderName,

            '[Username2]' => $recipientName,
            '[username2]' => $recipientName,
            '[USERNAME2]' => $recipientName,
            '{{Username2}}' => $recipientName,
            '{{username2}}' => $recipientName,
            '{{USERNAME2}}' => $recipientName,
            '%username2%' => $recipientName,

            '[ChatLink]' => $chatLink,
            '[chatlink]' => $chatLink,
            '[chat_link]' => $chatLink,
            '{{ChatLink}}' => $chatLink,
            '{{chatlink}}' => $chatLink,
            '{{chat_link}}' => $chatLink,
            '%chatlink%' => $chatLink,
            '%chat_link%' => $chatLink,
            '[ChatLinkHtml]' => $linkHtml,
            '{{ChatLinkHtml}}' => $linkHtml,
            '{{chatLinkHtml}}' => $linkHtml,
            '%chatLinkHtml%' => $linkHtml,
            '[Message]' => $safeMessage,
            '[message]' => $safeMessage,
            '{{Message}}' => $safeMessage,
            '{{message}}' => $safeMessage,
            '%message%' => $safeMessage,
            '[MessageHtml]' => $htmlMessage,
            '{{MessageHtml}}' => $htmlMessage,
            '{{message_html}}' => $htmlMessage,
            '%message_html%' => $htmlMessage,

            // Raw link variants
            '[Chat URL]' => $chatLink,
            '[ChatUrl]' => $chatLink,
            '{{ChatUrl}}' => $chatLink,
            '{{chat_url}}' => $chatLink,
            '%chat_url%' => $chatLink,
        ];
    }

    private function buildFallbackContent(string $senderName, string $recipientName, string $chatLink, string $message): string
    {
        $safeRecipient = e($recipientName);
        $safeSender = e($senderName);
        $safeMessage = nl2br(e(trim($message) !== '' ? $message : 'You have received a new chat message.'));
        $safeLink = e($chatLink);

        return <<<HTML
<p>Hi {$safeRecipient},</p>
<p>{$safeSender} sent you a new chat message:</p>
<p>{$safeMessage}</p>
<p><a href="{$safeLink}">Open Chat</a></p>
HTML;
    }
}

