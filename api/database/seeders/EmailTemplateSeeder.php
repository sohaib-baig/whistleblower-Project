<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmailTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            [
                'id' => '019a357e-0e67-7195-8352-034361dff496',
                'name' => 'Welcome Email',
                'subject' => 'Welcome to Our Platform!',
                'status' => 'active',
                'content' => <<<'HTML'
<p style="text-align: left;"><strong>Dear [Username],</strong></p>
<p style="text-align: left;">Welcome to the Whistleblower Management System. Your account has been successfully created, and you can now securely submit concerns or reports regarding misconduct, fraud, or policy violations.</p>
<h1 class="minimal__editor__content__heading" style="text-align: left;"><strong>Your login details:</strong></h1>
<ul class="minimal__editor__content__bullet__list">
    <li class="minimal__editor__content__listItem">
        <p><strong>Username/Email:</strong> [Email]</p>
    </li>
    <li class="minimal__editor__content__listItem">
        <p><strong>Temporary Password:</strong> [Password] <em>(Please change it upon first login.)</em></p>
    </li>
    <li class="minimal__editor__content__listItem">
        <p><strong>Login Link:</strong> <a target="_blank" rel="noopener noreferrer nofollow" class="minimal__editor__content__link" href="https://portal.wisling.com/login.php">https://portal.wisling.com/login.php</a></p>
    </li>
</ul>
<h1 class="minimal__editor__content__heading" style="text-align: left;"><strong>Key Features of the Platform:</strong></h1>
<ul class="minimal__editor__content__bullet__list">
    <li class="minimal__editor__content__listItem">
        <p><strong>Anonymous Reporting</strong> - Remain anonymous if policy allows.</p>
    </li>
    <li class="minimal__editor__content__listItem">
        <p><strong>Secure &amp; Encrypted</strong> - All submissions are confidential and protected.</p>
    </li>
    <li class="minimal__editor__content__listItem">
        <p><strong>Case Tracking</strong> - Monitor the status of your report with a reference number.</p>
    </li>
</ul>
<h1 class="minimal__editor__content__heading" style="text-align: left;"><strong>Next Steps:</strong></h1>
<ol class="minimal__editor__content__ordered__list">
    <li class="minimal__editor__content__listItem">
        <p>Log in and change your password immediately.</p>
    </li>
    <li class="minimal__editor__content__listItem">
        <p>Review the policies for guidelines on submitting a report.</p>
    </li>
    <li class="minimal__editor__content__listItem">
        <p>Contact <a target="_blank" rel="noopener noreferrer nofollow" class="minimal__editor__content__link" href="mailto:info@lwilsing.com">info@lwilsing.com</a> if you have any questions.</p>
    </li>
</ol>
<p style="text-align: left;"><strong>Confidentiality Notice:</strong><br>This platform is designed to protect your identity (where permitted by law). Please do not share your login credentials with anyone.</p>
<p style="text-align: left;">Thank you for your collaboration throughout this process.</p>
<p style="text-align: left;"><strong>Best regards,</strong><br>Wisling<br><a target="_blank" rel="noopener noreferrer nofollow" class="minimal__editor__content__link" href="mailto:info@wisling.com">info@wisling.com</a><br><a target="_blank" rel="noopener noreferrer nofollow" class="minimal__editor__content__link" href="http://wisling.com">wisling.com</a><br>+46 (0)10 330 00 40</p>
<p>&copy; Wisling | Confidential &amp; Secure Reporting System</p>
HTML,
                'placeholder' => '[Username], [Email] [Password]',
                'language' => 'en',
                'created_at' => '2025-10-30 14:20:45',
                'updated_at' => '2025-11-12 12:47:08',
                'deleted_at' => null,
            ],
            [
                'id' => '019a357e-0e68-7154-9d62-4b76a08da53c',
                'name' => 'Password Reset',
                'subject' => 'Reset Your Password',
                'status' => 'active',
                'content' => <<<'HTML'
<h2>Password Reset Request</h2>
<p>Hi {{name}},</p>
<p>Click the link below to reset your password:</p>
<p><a href="{{reset_link}}">Reset Password</a></p>
HTML,
                'placeholder' => '{{name}}, {{email}}, {{reset_link}}',
                'language' => 'en',
                'created_at' => '2025-10-30 14:20:45',
                'updated_at' => '2025-10-30 14:20:45',
                'deleted_at' => null,
            ],
            [
                'id' => '019a357e-0e68-7154-9d62-4b76a1696999',
                'name' => 'Order Confirmation',
                'subject' => 'Your Order #{{order_number}} is Confirmed',
                'status' => 'active',
                'content' => <<<'HTML'
<h2>Order Confirmation</h2>
<p>Hi {{name}},</p>
<p>Your order #{{order_number}} has been confirmed and will be processed shortly.</p>
HTML,
                'placeholder' => '{{name}}, {{email}}, {{order_number}}, {{total}}',
                'language' => 'en',
                'created_at' => '2025-10-30 14:20:45',
                'updated_at' => '2025-10-30 14:20:45',
                'deleted_at' => null,
            ],
            [
                'id' => '019a357e-0e69-713b-95bf-a60708d64f74',
                'name' => 'Account Verification',
                'subject' => 'Verify Your Email Address',
                'status' => 'active',
                'content' => <<<'HTML'
<h2>Verify Your Account</h2>
<p>Hi {{name}},</p>
<p>Please verify your email by clicking the link: <a href="{{verification_link}}">Verify Email</a></p>
HTML,
                'placeholder' => '{{name}}, {{email}}, {{verification_link}}',
                'language' => 'en',
                'created_at' => '2025-10-30 14:20:45',
                'updated_at' => '2025-10-30 14:20:45',
                'deleted_at' => null,
            ],
            [
                'id' => '019a357e-0e69-713b-95bf-a60708e3cfc1',
                'name' => 'Notification Alert',
                'subject' => 'New Notification',
                'status' => 'active',
                'content' => <<<'HTML'
<h2>You have a new notification</h2>
<p>{{notification_message}}</p>
HTML,
                'placeholder' => '{{notification_message}}, {{date}}',
                'language' => 'en',
                'created_at' => '2025-10-30 14:20:45',
                'updated_at' => '2025-10-30 14:20:45',
                'deleted_at' => null,
            ],
            [
                'id' => '019a357e-0e69-713b-95bf-a60709ab37f4',
                'name' => 'Invoice Email',
                'subject' => 'Invoice #{{invoice_number}}',
                'status' => 'active',
                'content' => <<<'HTML'
<h2>Invoice</h2>
<p>Dear {{name}},</p>
<p>Please find your invoice #{{invoice_number}} attached.</p>
HTML,
                'placeholder' => '{{name}}, {{invoice_number}}, {{amount}}, {{due_date}}',
                'language' => 'en',
                'created_at' => '2025-10-30 14:20:45',
                'updated_at' => '2025-10-30 14:20:45',
                'deleted_at' => null,
            ],
            [
                'id' => '019a357e-0e6a-70b9-9076-50dc655c0bd0',
                'name' => 'Subscription Renewal',
                'subject' => 'Your Subscription Renewal',
                'status' => 'inactive',
                'content' => <<<'HTML'
<h2>Subscription Renewal</h2>
<p>Hi {{name}},</p>
<p>Your subscription will renew on {{renewal_date}}.</p>
HTML,
                'placeholder' => '{{name}}, {{renewal_date}}, {{amount}}',
                'language' => 'en',
                'created_at' => '2025-10-30 14:20:45',
                'updated_at' => '2025-10-30 14:20:45',
                'deleted_at' => null,
            ],
            [
                'id' => '019a39ea-73eb-72d3-9253-a34da268aa2b',
                'name' => 'Report Confirmation',
                'subject' => 'Report Confirmation',
                'status' => 'active',
                'content' => <<<'HTML'
<p>Dear [Username],</p>
<p style="text-align: left;">Thanks for submitting report.</p>
<p style="text-align: left;">Your password is [password]</p>
HTML,
                'placeholder' => "[Username],\n\n[password]",
                'language' => 'en',
                'created_at' => '2025-10-31 10:57:37',
                'updated_at' => '2025-10-31 10:57:37',
                'deleted_at' => null,
            ],
            [
                'id' => '019a77d1-33f3-7187-ac4d-6f6a37a0f6c0',
                'name' => 'Payment Email Admin',
                'subject' => 'Payment Notification on Wisling',
                'status' => 'active',
                'content' => <<<'HTML'
<p><strong>Dear Admin,</strong></p>
<p>We are pleased to inform you that new company (<strong>[Username]</strong>) is registered and made payment through [Payment Type]. </p>
<p style="text-align: left;">&nbsp;<strong>Download Payment Slip:</strong>&nbsp;[Download Payment SLIP]&nbsp;<em>(for your records)</em></p>
<p style="text-align: left;">Thank you for supporting transparency and accountability.</p>
<p style="text-align: left;">Best regards,<br>Whistleblowing Billing Team<br><a target="_blank" rel="noopener noreferrer nofollow" class="minimal__editor__content__link" href="mailto:christoffer@arbetsgivarjuristen.se">christoffer@arbetsgivarjuristen.se</a> | <a target="_blank" rel="noopener noreferrer nofollow" class="minimal__editor__content__link" href="http://www.portal.wisling.com">www.portal.wisling.com</a>&nbsp;| 0763095915</p>
HTML,
                'placeholder' => '[Username], [Download Payment SLIP],[Payment Type]',
                'language' => 'en',
                'created_at' => '2025-11-12 11:26:30',
                'updated_at' => '2025-11-13 06:40:52',
                'deleted_at' => null,
            ],
            [
                'id' => '019a77d2-2aa4-728a-b89a-2d401d0ab146',
                'name' => 'Bank Transfer Email Admin',
                'subject' => 'Bank Transfer',
                'status' => 'active',
                'content' => <<<'HTML'
<p><strong>Dear [Username],</strong></p>
<p>We are pleased to inform you that your bill is now ready for review. Please access your payment slip through the link provided below:</p>
<p style="text-align: left;">&nbsp;<strong>Download Payment Slip:</strong>&nbsp;[Download Payment SLIP]&nbsp;<em>(for your records)</em></p>
<p style="text-align: left;">Thank you for supporting transparency and accountability.</p>
<p style="text-align: left;">Best regards,<br>Whistleblowing Billing Team<br><a target="_blank" rel="noopener noreferrer nofollow" class="minimal__editor__content__link" href="mailto:christoffer@arbetsgivarjuristen.se">christoffer@arbetsgivarjuristen.se</a> | <a target="_blank" rel="noopener noreferrer nofollow" class="minimal__editor__content__link" href="http://www.portal.wisling.com">www.portal.wisling.com</a>&nbsp;| 0763095915</p>
HTML,
                'placeholder' => '[Username], [Download Payment SLIP],',
                'language' => 'en',
                'created_at' => '2025-11-12 11:27:33',
                'updated_at' => '2025-11-12 11:27:33',
                'deleted_at' => null,
            ],
            [
                'id' => '019a77d3-3bb5-839b-c9cb-3e512e1bc257',
                'name' => 'Bank Transfer Status Company Email',
                'subject' => 'Invoice Status Updated - {{invoice_number}}',
                'status' => 'active',
                'content' => <<<'HTML'
<p><strong>Dear [Username],</strong></p>
<p>We are pleased to inform you that the status of your invoice <strong>[Invoice Number]</strong> has been updated to <strong>[Payment Type]</strong>.</p>
<p style="text-align: left;">Invoice Details:</p>
<ul style="text-align: left;">
    <li><strong>Invoice Number:</strong> [Invoice Number]</li>
    <li><strong>Status:</strong> [Payment Type]</li>
    <li><strong>Amount:</strong> [Amount]</li>
    <li><strong>Invoice Date:</strong> [Invoice Date]</li>
</ul>
<p style="text-align: left;">If you have any questions or concerns, please feel free to contact us.</p>
<p style="text-align: left;">Thank you for your business.</p>
<p style="text-align: left;">Best regards,<br>Whistleblowing Billing Team<br><a target="_blank" rel="noopener noreferrer nofollow" class="minimal__editor__content__link" href="mailto:christoffer@arbetsgivarjuristen.se">christoffer@arbetsgivarjuristen.se</a> | <a target="_blank" rel="noopener noreferrer nofollow" class="minimal__editor__content__link" href="http://www.portal.wisling.com">www.portal.wisling.com</a>&nbsp;| 0763095915</p>
HTML,
                'placeholder' => '[Username], [Invoice Number], [Payment Type], [Amount], [Invoice Date]',
                'language' => 'en',
                'created_at' => '2025-11-13 12:00:00',
                'updated_at' => '2025-11-13 12:00:00',
                'deleted_at' => null,
            ],
            [
                'id' => '019a77d9-0ea3-7160-aa5c-fef0d09cedc6',
                'name' => 'Report Submission Email',
                'subject' => 'New Report Created',
                'status' => 'active',
                'content' => <<<'HTML'
<p>Dear [RECIPIENT]</p>
<p style="text-align: left;">I am pleased to inform you that the <strong>[TYPE]</strong> under <strong>[CATEGORY]</strong> has been successfully resolved and closed. The case, managed by <strong>[CASE HANDLER]</strong>, was completed on <strong>[CREATED DATE &amp; TIME]</strong>.</p>
<p style="text-align: left;">If you require further information or have any questions, feel free to contact me.</p>
<p style="text-align: left;">Thank you for your collaboration throughout this process.</p>
<p style="text-align: left;">Best regards,<br>Whistleblowing Billing Team<br><a target="_blank" rel="noopener noreferrer nofollow" class="minimal__editor__content__link" href="mailto:christoffer@arbetsgivarjuristen.se">christoffer@arbetsgivarjuristen.se</a> | <a target="_blank" rel="noopener noreferrer nofollow" class="minimal__editor__content__link" href="http://www.portal.wisling.com">www.portal.wisling.com</a>&nbsp;| 0763095915</p>
HTML,
                'placeholder' => '[UserName], [RECIPIENT], [TYPE], [CATEGORY], [CASE HANDLER], [CREATED DATE & TIME], [DESCRIPTION], [PASSWORD], [ID], [MEDIUM], [SUBJECT], [OPEN STATE DEADLINEL]',
                'language' => 'en',
                'created_at' => '2025-11-12 11:35:05',
                'updated_at' => '2025-11-12 11:35:05',
                'deleted_at' => null,
            ],
            [
                'id' => '019a7c09-7845-7016-a8c7-39fdbfe3555a',
                'name' => 'Report Update Email',
                'subject' => 'Case closed on wisling',
                'status' => 'active',
                'content' => <<<'HTML'
<p>Dear [RECIPIENT]</p>
<p style="text-align: left;">I am pleased to inform you that the <strong>[TYPE]</strong> under <strong>[CATEGORY]</strong> has been successfully resolved and closed. The case, managed by <strong>[CASE HANDLER]</strong>, was completed on <strong>[CREATED DATE &amp; TIME]</strong>.</p>
<p style="text-align: left;">If you require further information or have any questions, feel free to contact me.</p>
<p style="text-align: left;">Thank you for your collaboration throughout this process.</p>
<p style="text-align: left;">Best regards,<br>Whistleblowing Billing Team<br><a target="_blank" rel="noopener noreferrer nofollow" class="minimal__editor__content__link" href="mailto:christoffer@arbetsgivarjuristen.se">christoffer@arbetsgivarjuristen.se</a> | <a target="_blank" rel="noopener noreferrer nofollow" class="minimal__editor__content__link" href="http://www.portal.wisling.com">www.portal.wisling.com</a>&nbsp;| 0763095915</p>
HTML,
                'placeholder' => '[UserName], [RECIPIENT], [TYPE], [CATEGORY], [CASE HANDLER], [CREATED DATE & TIME], [DESCRIPTION], [PASSWORD], [ID], [MEDIUM], [SUBJECT], [OPEN STATE DEADLINEL]',
                'language' => 'en',
                'created_at' => '2025-11-13 07:06:26',
                'updated_at' => '2025-11-13 07:06:26',
                'deleted_at' => null,
            ],
            [
                'id' => '019a7ca7-b28a-70c9-aa24-093e5f8ef9d0',
                'name' => 'New Case Created',
                'subject' => 'New Case Created',
                'status' => 'active',
                'content' => <<<'HTML'
<p>Dear Admin</p>
<p style="text-align: left;">New case <strong>[TYPE]</strong> under <strong>[CATEGORY]</strong> has been registered on wisling for company <strong>[COMPANY]</strong>. The case will be managed by <strong>[CASE HANDLER]</strong>.</p>
<p style="text-align: left;">If you require further information or have any questions, feel free to contact me.</p>
<p style="text-align: left;">Thank you for your collaboration throughout this process.</p>
<p style="text-align: left;">Best regards,<br>Whistleblowing Billing Team<br><a target="_blank" rel="noopener noreferrer nofollow" class="minimal__editor__content__link" href="mailto:christoffer@arbetsgivarjuristen.se">christoffer@arbetsgivarjuristen.se</a> | <a target="_blank" rel="noopener noreferrer nofollow" class="minimal__editor__content__link" href="http://www.portal.wisling.com">www.portal.wisling.com</a>&nbsp;| 0763095915</p>
HTML,
                'placeholder' => '[TYPE],[CATEGORY],[COMPANY],[CASE HANDLER]',
                'language' => 'en',
                'created_at' => '2025-11-13 09:59:16',
                'updated_at' => '2025-11-13 09:59:16',
                'deleted_at' => null,
            ],
            [
                'id' => '019a7cdb-dd18-737d-9050-8ca2c21aacb6',
                'name' => 'Chat',
                'subject' => "You've received message on Wisling",
                'status' => 'active',
                'content' => <<<'HTML'
<p>Hi [Username1],<br></p>
<p>[Username2] left you messages:</p>
<p>[Message]</p>
<p><a target="_blank" rel="noopener noreferrer nofollow" class="minimal__editor__content__link" href="[ChatLink]">Click here to view and reply</a></p>
HTML,
                'placeholder' => '[Username1],[Username2],[ChatLink],[Message]',
                'language' => 'en',
                'created_at' => '2025-11-13 10:56:15',
                'updated_at' => '2025-11-13 11:32:59',
                'deleted_at' => null,
            ],
        ];

        DB::table('email_templates')->upsert(
            $templates,
            ['id'],
            ['name', 'subject', 'status', 'content', 'placeholder', 'language', 'created_at', 'updated_at', 'deleted_at']
        );

        if ($this->command) {
            $this->command->info('Email templates seeded from database snapshot.');
        }
    }
}
