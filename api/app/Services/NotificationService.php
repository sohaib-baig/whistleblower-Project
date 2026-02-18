<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\Order;
use App\Models\CaseModel;
use App\Models\EmailTemplate;
use App\Mail\AdminNotificationMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    /**
     * Get all admin users
     */
    private function getAdminUsers(): \Illuminate\Database\Eloquent\Collection
    {
        return User::whereHas('roles', function($q) {
            $q->where('name', 'admin');
        })->get();
    }

    /**
     * Create notification for admin users
     */
    private function notifyAdmins(string $type, string $message, ?string $redirectUrl = null, ?array $metadata = null): void
    {
        try {
            $admins = $this->getAdminUsers();
            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'type' => $type,
                    'message' => $message,
                    'status' => 'unread',
                    'redirect_url' => $redirectUrl,
                    'metadata' => $metadata ? json_encode($metadata) : null,
                ]);
            }

            // Send email notifications to admins
            $this->sendAdminNotificationEmail($type, $message, $metadata);
        } catch (\Exception $e) {
            Log::error('Failed to create admin notifications', [
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send email notification to all admin users
     */
    private function sendAdminNotificationEmail(string $type, string $message, ?array $metadata = null): void
    {
        try {
            $admins = User::whereHas('roles', function($q) {
                $q->where('name', 'admin');
            })->whereNotNull('email')->get();
            
            if ($admins->isEmpty()) {
                Log::warning('No admin recipients found for notification email', [
                    'type' => $type,
                ]);
                return;
            }

            // Get email template name for this notification type
            $templateName = $this->getEmailTemplateName($type);

            // Send email to all admins (each with their preferred language)
            foreach ($admins as $admin) {
                try {
                    // Get template based on admin's language preference (with fallback to English)
                    $adminLanguage = $admin->user_language ?? 'en';
                    $template = EmailTemplate::getByNameAndLanguage($templateName, $adminLanguage, true);

                    $emailSubject = $message;
                    $emailContent = $message;

                    if ($template) {
                        // Use template with replacements
                        $emailSubject = $this->replaceEmailPlaceholders($template->subject, $metadata);
                        $emailContent = $this->replaceEmailPlaceholders($template->content, $metadata);
                    }

                    Mail::to($admin->email)->queue(
                        new AdminNotificationMail($emailSubject, $emailContent)
                    );
                } catch (\Throwable $mailException) {
                    Log::error('Failed to send admin notification email', [
                        'admin_id' => $admin->id,
                        'admin_email' => $admin->email,
                        'type' => $type,
                        'error' => $mailException->getMessage(),
                    ]);
                }
            }
        } catch (\Throwable $e) {
            Log::error('Failed to send admin notification emails', [
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get email template name based on notification type
     */
    private function getEmailTemplateName(string $type): string
    {
        $templateMap = [
            'company_registered' => 'Company Registered Admin',
            'payment_received' => 'Payment Email Admin',
            'anonymous_case_created' => 'New Case Created',
            'case_manager_created' => 'Case Manager Created Admin',
            'case_status_updated' => 'Case Status Updated Admin',
            'advise_chat_message' => 'Advise Chat Message Admin',
            'support_ticket_created' => 'Support Ticket Created Admin',
        ];

        return $templateMap[$type] ?? 'Admin Notification';
    }

    /**
     * Replace placeholders in email template content
     */
    private function replaceEmailPlaceholders(string $content, ?array $metadata = null): string
    {
        if (empty($metadata) || empty($content)) {
            return $content;
        }

        $replacements = [];
        foreach ($metadata as $key => $value) {
            if (is_scalar($value) || (is_object($value) && method_exists($value, '__toString'))) {
                $stringValue = (string) $value;
                // Support multiple placeholder formats
                $replacements["[{$key}]"] = $stringValue;
                $replacements["{{$key}}"] = $stringValue;
                $replacements["%{$key}%"] = $stringValue;
                $replacements["[" . strtoupper($key) . "]"] = $stringValue;
                $replacements["{{" . strtoupper($key) . "}}"] = $stringValue;
            }
        }

        return strtr($content, $replacements);
    }

    /**
     * Create notification for a specific user
     */
    public function notifyUser(User $user, string $type, string $message, ?string $redirectUrl = null, ?array $metadata = null): void
    {
        try {
            Notification::create([
                'user_id' => $user->id,
                'type' => $type,
                'message' => $message,
                'status' => 'unread',
                'redirect_url' => $redirectUrl,
                'metadata' => $metadata ? json_encode($metadata) : null,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create notification', [
                'user_id' => $user->id,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Create notification (generic method)
     */
    public function createNotification(string $userId, string $type, string $message, ?array $metadata = null, ?string $redirectUrl = null): void
    {
        try {
            Notification::create([
                'user_id' => $userId,
                'type' => $type,
                'message' => $message,
                'status' => 'unread',
                'redirect_url' => $redirectUrl,
                'metadata' => $metadata ? json_encode($metadata) : null,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create notification', [
                'user_id' => $userId,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify admin when new company is registered
     */
    public function notifyCompanyRegistered(User $company): void
    {
        $message = "New company registered: {$company->company_name} ({$company->email})";
        $redirectUrl = "/dashboard/company/{$company->id}";
        $metadata = [
            'company_id' => $company->id,
            'company_name' => $company->company_name,
            'company_email' => $company->email,
        ];
        $this->notifyAdmins('company_registered', $message, $redirectUrl, $metadata);
    }

    /**
     * Notify admin when company makes payment
     */
    public function notifyPaymentReceived(Order $order): void
    {
        $company = $order->company;
        $paymentMethod = $order->payment_type === 'stripe' ? 'Stripe' : 'Bank Transfer';
        $message = "Payment received from {$company->company_name} via {$paymentMethod}";
        $redirectUrl = "/dashboard/invoice/{$order->id}";
        $metadata = [
            'order_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'company_id' => $company->id,
            'company_name' => $company->company_name,
            'payment_type' => $order->payment_type,
            'amount' => $order->price + $order->vat,
        ];
        $this->notifyAdmins('payment_received', $message, $redirectUrl, $metadata);
    }

    /**
     * Notify admin when anonymous user creates case
     */
    public function notifyAnonymousCaseCreated(CaseModel $case): void
    {
        $company = $case->company;
        $message = "New case created by anonymous user for {$company->company_name}";
        $redirectUrl = "/dashboard/case/{$case->id}/details-tabs";
        $metadata = [
            'case_id' => $case->id,
            'company_id' => $company->id,
            'company_name' => $company->company_name,
        ];
        $this->notifyAdmins('anonymous_case_created', $message, $redirectUrl, $metadata);
    }

    /**
     * Notify admin when company creates case manager
     */
    public function notifyCaseManagerCreated(User $caseManager, User $company): void
    {
        $message = "New case manager created: {$caseManager->name} for {$company->company_name}";
        $redirectUrl = "/dashboard/case-manager/{$caseManager->id}";
        $metadata = [
            'case_manager_id' => $caseManager->id,
            'case_manager_name' => $caseManager->name,
            'company_id' => $company->id,
            'company_name' => $company->company_name,
        ];
        $this->notifyAdmins('case_manager_created', $message, $redirectUrl, $metadata);
    }

    /**
     * Notify admin and company when case status is updated
     */
    public function notifyCaseStatusUpdated(CaseModel $case, string $oldStatus, string $newStatus): void
    {
        $company = $case->company;
        
        // Notify admin
        $adminMessage = "Case status updated from {$oldStatus} to {$newStatus} for {$company->company_name}";
        $adminRedirectUrl = "/dashboard/case/{$case->id}/details-tabs";
        $adminMetadata = [
            'case_id' => $case->id,
            'company_id' => $company->id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
        ];
        $this->notifyAdmins('case_status_updated', $adminMessage, $adminRedirectUrl, $adminMetadata);

        // Notify company
        $companyMessage = "Case status updated from {$oldStatus} to {$newStatus}";
        $companyRedirectUrl = "/dashboard/case/{$case->id}/details-tabs";
        $companyMetadata = [
            'case_id' => $case->id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
        ];
        $this->notifyUser($company, 'case_status_updated', $companyMessage, $companyRedirectUrl, $companyMetadata);
    }

    /**
     * Notify company when anonymous user creates case with their case manager
     */
    public function notifyCompanyCaseCreated(CaseModel $case): void
    {
        if (!$case->case_manager_id) {
            return; // Only notify if case manager is assigned
        }

        $case->load('caseManager');
        $company = $case->company;
        $caseManager = $case->caseManager;
        
        if (!$caseManager) {
            return;
        }
        
        $message = "New case created by anonymous user and assigned to case manager: {$caseManager->name}";
        $redirectUrl = "/dashboard/case/{$case->id}/details-tabs";
        $metadata = [
            'case_id' => $case->id,
            'case_manager_id' => $caseManager->id,
            'case_manager_name' => $caseManager->name,
        ];
        $this->notifyUser($company, 'anonymous_case_created', $message, $redirectUrl, $metadata);
    }

    /**
     * Notify case manager when anonymous user creates case
     */
    public function notifyCaseManagerCaseCreated(CaseModel $case): void
    {
        if (!$case->case_manager_id) {
            return; // Only notify if case manager is assigned
        }

        $case->load('caseManager');
        $caseManager = $case->caseManager;
        
        if (!$caseManager) {
            return;
        }
        
        $message = "New case assigned to you by anonymous user";
        $redirectUrl = "/dashboard/case/{$case->id}/details-tabs";
        $metadata = [
            'case_id' => $case->id,
            'company_id' => $case->company_id,
        ];
        $this->notifyUser($caseManager, 'case_assigned', $message, $redirectUrl, $metadata);
    }

    /**
     * Notify case manager when anonymous user sends chat message
     */
    public function notifyCaseManagerChatMessage(CaseModel $case): void
    {
        if (!$case->case_manager_id) {
            return; // Only notify if case manager is assigned
        }

        $case->load('caseManager');
        $caseManager = $case->caseManager;
        
        if (!$caseManager) {
            return;
        }
        
        $message = "New message from anonymous user in case";
        $redirectUrl = "/dashboard/case/{$case->id}/details-tabs/chat";
        $metadata = [
            'case_id' => $case->id,
        ];
        $this->notifyUser($caseManager, 'chat_message_received', $message, $redirectUrl, $metadata);
    }

    /**
     * Notify admins when someone sends an advise chat message.
     */
    public function notifyAdminsAdviseChatMessage(CaseModel $case, User $sender, string $messagePreview, string $chatId, string $chatType): void
    {
        $case->loadMissing('company');

        $caseTitle = $case->title ?: $case->id;
        $senderName = $this->resolveUserDisplayName($sender);

        $message = "{$senderName} sent an advise chat ({$chatType}) for case {$caseTitle}";
        $redirectUrl = "/dashboard/case/{$case->id}/details-tabs/legal-support";
        $metadata = [
            'case_id' => $case->id,
            'chat_id' => $chatId,
            'chat_type' => $chatType,
            'sender_id' => $sender->id,
            'sender_name' => $senderName,
            'message_preview' => $messagePreview,
        ];

        $this->notifyAdmins('advise_chat_message', $message, $redirectUrl, $metadata);
    }

    /**
     * Notify the assigned case manager about an advise chat message.
     */
    public function notifyCaseManagerAdviseChatMessage(CaseModel $case, User $sender, string $messagePreview, string $chatId, string $chatType): void
    {
        if (!$case->case_manager_id) {
            return;
        }

        $case->loadMissing('caseManager');
        $caseManager = $case->caseManager;

        if (!$caseManager || $caseManager->id === $sender->id) {
            return;
        }

        $caseTitle = $case->title ?: $case->id;
        $senderName = $this->resolveUserDisplayName($sender);

        $message = "{$senderName} sent an advise chat ({$chatType}) for case {$caseTitle}";
        $redirectUrl = "/dashboard/case/{$case->id}/details-tabs/legal-support";
        $metadata = [
            'case_id' => $case->id,
            'chat_id' => $chatId,
            'chat_type' => $chatType,
            'sender_id' => $sender->id,
            'sender_name' => $senderName,
            'message_preview' => $messagePreview,
        ];

        $this->notifyUser($caseManager, 'advise_chat_message', $message, $redirectUrl, $metadata);
    }

    /**
     * Notify the owning company about an advise chat message.
     */
    public function notifyCompanyAdviseChatMessage(CaseModel $case, User $sender, string $messagePreview, string $chatId, string $chatType): void
    {
        if (!$case->company_id) {
            return;
        }

        $case->loadMissing('company');
        $company = $case->company;

        if (!$company || $company->id === $sender->id) {
            return;
        }

        $caseTitle = $case->title ?: $case->id;
        $senderName = $this->resolveUserDisplayName($sender);

        $message = "{$senderName} sent an advise chat ({$chatType}) for case {$caseTitle}";
        $redirectUrl = "/dashboard/case/{$case->id}/details-tabs/legal-support";
        $metadata = [
            'case_id' => $case->id,
            'chat_id' => $chatId,
            'chat_type' => $chatType,
            'sender_id' => $sender->id,
            'sender_name' => $senderName,
            'message_preview' => $messagePreview,
        ];

        $this->notifyUser($company, 'advise_chat_message', $message, $redirectUrl, $metadata);
    }

    /**
     * Notify admin when support ticket is created
     */
    public function notifySupportTicketCreated(\App\Models\SupportTicket $ticket): void
    {
        $creator = $ticket->creator;
        $creatorName = $this->resolveUserDisplayName($creator);

        $message = "New support ticket created by {$creatorName}: {$ticket->title}";
        $redirectUrl = "/dashboard/support-tickets/{$ticket->id}";
        $metadata = [
            'ticket_id' => $ticket->id,
            'ticket_title' => $ticket->title,
            'creator_id' => $creator->id,
            'creator_name' => $creatorName,
        ];
        $this->notifyAdmins('support_ticket_created', $message, $redirectUrl, $metadata);
    }

    /**
     * Notify user about support ticket reply
     */
    public function notifySupportTicketReply(\App\Models\SupportTicket $ticket, \App\Models\SupportTicketChat $chat): void
    {
        $sender = $chat->sender;
        $senderName = $this->resolveUserDisplayName($sender);

        // Determine who to notify (the other party)
        $notifyUser = null;
        if ($chat->reply_to) {
            $notifyUser = User::find($chat->reply_to);
        } elseif ($chat->created_from === 'admin') {
            // Admin replying to ticket creator
            $notifyUser = $ticket->creator;
        }

        if ($notifyUser) {
            $message = "New reply on support ticket '{$ticket->title}' from {$senderName}";
            $redirectUrl = "/dashboard/support-tickets/{$ticket->id}";
            $metadata = [
                'ticket_id' => $ticket->id,
                'ticket_title' => $ticket->title,
                'chat_id' => $chat->id,
                'sender_id' => $sender->id,
                'sender_name' => $senderName,
            ];
            $this->notifyUser($notifyUser, 'support_ticket_reply', $message, $redirectUrl, $metadata);
        }
    }

    /**
     * Notify user when support ticket status is updated
     */
    public function notifySupportTicketStatusUpdated(\App\Models\SupportTicket $ticket, string $oldStatus, string $newStatus): void
    {
        $message = "Support ticket status updated from {$oldStatus} to {$newStatus}: {$ticket->title}";
        $redirectUrl = "/dashboard/support-tickets/{$ticket->id}";
        $metadata = [
            'ticket_id' => $ticket->id,
            'ticket_title' => $ticket->title,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
        ];
        $this->notifyUser($ticket->creator, 'support_ticket_status_updated', $message, $redirectUrl, $metadata);
    }

    /**
     * Resolve a human readable name for the supplied user.
     */
    private function resolveUserDisplayName(User $user): string
    {
        if (!empty($user->name)) {
            return $user->name;
        }

        if (!empty($user->company_name)) {
            return $user->company_name;
        }

        $composed = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
        if ($composed !== '') {
            return $composed;
        }

        return $user->email ?? 'User';
    }
}

