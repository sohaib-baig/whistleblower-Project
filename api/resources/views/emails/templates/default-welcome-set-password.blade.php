<h1 style="font-size:24px;line-height:32px;font-weight:700;color:#111827;margin:0 0 16px;">
    Welcome to {{ $appName ?? config('app.name') }}
</h1>
<p>
    Hello {{ $user->name ?? $user->email }},
</p>
<p>
    Your account has been created successfully. Please set your password to activate your access.
</p>
<p style="margin:0;font-size:13px;line-height:20px;color:#6b7280;">
    This link is valid for 24 hours and can be used only once. If it expires, please contact support or request a new invitation.
</p>

