<h1 style="font-size:24px;line-height:32px;font-weight:700;color:#111827;margin:0 0 16px;">
    Reset your password
</h1>
<p>
    Hello {{ $user->name ?? $user->email }},
</p>
<p>
    We received a request to reset the password for your {{ $appName ?? config('app.name') }} account. Click the button below to set a new password.
</p>
<p style="margin:0 0 16px;font-size:13px;line-height:20px;color:#6b7280;">
    This link expires in 60 minutes. If it stops working, you can request another password reset from the login page.
</p>
<p style="margin:0;font-size:13px;line-height:20px;color:#6b7280;">
    If you did not request a password reset, you can ignore this email.
</p>

