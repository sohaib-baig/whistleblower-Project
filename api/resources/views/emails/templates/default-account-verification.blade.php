<h2>Verify your email</h2>
<p>Hi {{ $user->name ?? $user->email }},</p>
<p>Thanks for joining {{ $appName ?? config('app.name') }}. Please confirm your email address using the link below:</p>
<p><a href="{{ $verificationUrl }}">Verify my email</a></p>
<p>If you didn't create an account, you can safely ignore this email.</p>

