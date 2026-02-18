<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $appName ?? config('app.name') }}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1f2937;
        }

        a {
            color: #1e293b;
        }

        .preheader {
            display: none !important;
            visibility: hidden;
            opacity: 0;
            color: transparent;
            height: 0;
            width: 0;
            overflow: hidden;
            mso-hide: all;
        }

        .content a.button,
        .content a.btn,
        .content a[data-cta="primary"],
        .primary-button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #1e293b;
            color: #ffffff !important;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 6px;
        }

        .content p {
            margin: 0 0 16px;
            font-size: 15px;
            line-height: 22px;
        }

        .content h1,
        .content h2,
        .content h3 {
            color: #111827;
            margin-top: 0;
        }

        .card {
            max-width: 560px;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
            overflow: hidden;
        }

        .subcopy {
            font-size: 12px;
            line-height: 18px;
            color: #9ca3af;
        }
    </style>
</head>
<body>
    @if(!empty($preheader))
        <div class="preheader">{{ $preheader }}</div>
    @endif
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="card">
                    <tr>
                        <td align="center" style="padding:32px 24px;background-color:#f9fafb;">
                            @if(!empty($logoUrl))
                                <img src="{{ $logoUrl }}" alt="{{ $appName ?? config('app.name') }}" style="max-height:56px;max-width:180px;display:block;">
                            @else
                                <span style="display:inline-block;font-size:20px;font-weight:700;color:#111827;">{{ $appName ?? config('app.name') }}</span>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 24px;" class="content">
                            {!! $content !!}
                            @if(!empty($button))
                                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                                    <tr>
                                        <td align="center">
                                            <a href="{{ $button['url'] }}" class="primary-button" data-cta="primary">{{ $button['label'] }}</a>
                                        </td>
                                    </tr>
                                </table>
                            @endif
                        </td>
                    </tr>
                    @if(!empty($subcopy))
                        <tr>
                            <td style="padding:24px;background-color:#f9fafb;text-align:center;">
                                <div class="subcopy">{!! $subcopy !!}</div>
                            </td>
                        </tr>
                    @endif
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

