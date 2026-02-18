<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - {{ $invoice['invoiceNumber'] }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        @page {
            margin: 10mm;
            size: A4;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            color: #212B36;
            line-height: 1.5;
            background-color: #FFFFFF;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 95%;
            max-width: 95%;
            padding: 15px;
            box-sizing: border-box;
        }
        /* Header Section - Logo and Status */
        .header-grid {
            display: table;
            width: 100%;
            margin-bottom: 24px;
        }
        .header-grid > div {
            display: table-cell;
            width: 50%;
            vertical-align: middle;
        }
        .header-grid > div:last-child {
            text-align: right;
            padding-left: 20px;
            width: 50%;
        }
        .logo-section {
            display: block;
        }
        .logo {
            width: 100px;
            height: auto;
        }
        .status-section {
            display: block;
            width: 100%;
        }
        .status-section > * {
            display: block;
            margin-bottom: 6px;
            width: 100%;
            text-align: right;
        }
        .status-section > *:last-child {
            margin-bottom: 0;
        }
        /* .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            text-transform: capitalize;
        } */
        .status-badge.paid {
            /* background-color: #D1FAE5; */
            text-transform: capitalize;
            color: #065F46;
        }
        .status-badge.pending {
            background-color: #FEF3C7;
            color: #92400E;
        }
        .status-badge.overdue {
            background-color: #FEE2E2;
            color: #991B1B;
        }
        .status-badge.default {
            background-color: #F3F4F6;
            color: #374151;
        }
        .invoice-number {
            font-size: 14px;
            font-weight: 600;
            color: #212B36;
        }
        /* Billing Info Grid */
        .billing-grid {
            display: table;
            width: 100%;
            margin-bottom: 24px;
        }
        .billing-grid > div {
            display: table-cell;
            width: 50%;
            padding-right: 20px;
            vertical-align: top;
        }
        .billing-grid > div:last-child {
            padding-right: 0;
        }
        .billing-box {
            display: block;
        }
        .billing-title {
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 6px;
            color: #212B36;
        }
        .billing-text {
            font-size: 12px;
            color: #637381;
            line-height: 1.6;
        }
        /* Dates Grid */
        .dates-grid {
            display: table;
            width: 100%;
            margin-bottom: 24px;
        }
        .dates-grid > div {
            display: table-cell;
            width: 50%;
            padding-right: 20px;
            vertical-align: top;
        }
        .dates-grid > div:last-child {
            padding-right: 0;
        }
        .date-box {
            display: block;
        }
        .date-title {
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 6px;
            color: #212B36;
        }
        .date-value {
            font-size: 12px;
            color: #637381;
        }
        /* Table */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            table-layout: fixed;
        }
        thead {
            background-color: #F4F6F8;
        }
        th {
            padding: 8px 6px;
            text-align: left;
            font-size: 11px;
            font-weight: 600;
            color: #637381;
            border-bottom: 1px solid #DFE3E8;
            word-wrap: break-word;
            overflow: hidden;
        }
        th:first-child {
            width: 30px;
        }
        th:nth-child(2) {
            width: auto;
        }
        th:nth-child(3) {
            width: 40px;
        }
        th:nth-child(4) {
            width: 90px;
            text-align: right;
        }
        th:nth-child(5) {
            width: 90px;
            text-align: right;
        }
        td {
            padding: 10px 6px;
            border-bottom: 1px solid #DFE3E8;
            font-size: 12px;
            word-wrap: break-word;
            overflow-wrap: break-word;
            overflow: hidden;
        }
        td:first-child {
            color: #637381;
            width: 30px;
        }
        td:nth-child(2) {
            width: auto;
        }
        td:nth-child(3) {
            width: 40px;
        }
        td:nth-child(4),
        td:nth-child(5) {
            text-align: right;
            width: 90px;
            white-space: nowrap;
        }
        .item-title {
            font-size: 12px;
            font-weight: 500;
            color: #212B36;
            margin-bottom: 3px;
        }
        .item-description {
            font-size: 12px;
            color: #637381;
        }
        /* Divider */
        .divider {
            border-top: 1px dashed #DFE3E8;
            margin: 16px 0;
        }
        /* Summary Section */
        .summary-section {
            display: block;
            width: 100%;
            text-align: right;
            margin-top: 16px;
            margin-bottom: 24px;
        }
        .summary-row {
            display: table;
            width: 100%;
            margin-bottom: 6px;
        }
        .summary-label {
            display: table-cell;
            text-align: right;
            padding-right: 10px;
            font-size: 12px;
            color: #637381;
            width: auto;
        }
        .summary-value {
            display: table-cell;
            width: 120px;
            min-width: 120px;
            text-align: right;
            font-size: 12px;
            color: #212B36;
            white-space: nowrap;
        }
        .summary-value.error {
            color: #B91C1C;
        }
        .summary-total {
            font-size: 13px;
            font-weight: 600;
            color: #212B36;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #DFE3E8;
        }
        .summary-total .summary-label {
            font-size: 13px;
            font-weight: 600;
            color: #212B36;
        }
        .summary-total .summary-value {
            font-size: 13px;
            font-weight: 600;
            color: #212B36;
        }
        /* Footer */
        .footer {
            display: table;
            width: 100%;
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px dashed #DFE3E8;
            table-layout: fixed;
        }
        .footer-box {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 20px;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        .footer-box.right {
            text-align: right;
            padding-left: 20px;
            padding-right: 0;
        }
        .footer-title {
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 4px;
            color: #212B36;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        .footer-text {
            font-size: 12px;
            color: #637381;
            line-height: 1.6;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header: Logo and Status -->
        <div class="header-grid">
            <div class="logo-section">
                @if($invoice['logo'])
                    <img src="{{ $invoice['logo'] }}" alt="Logo" class="logo">
                @endif
            </div>
            <div class="status-section">
                <span class="status-badge {{ $invoice['status'] }}">{{ __('invoice.status_' . $invoice['status']) }}</span>
                <div class="invoice-number">{{ $invoice['invoiceNumber'] }}</div>
            </div>
        </div>

        <!-- Billing Info: Invoice From and Invoice To -->
        <div class="billing-grid">
            <div class="billing-box">
                <div class="billing-title">{{ __('invoice.invoice_from') }}</div>
                <div class="billing-text">
                    {{ $invoice['invoiceFrom']['name'] }}<br>
                    @if(!empty($invoice['invoiceFrom']['company']))
                        {{ $invoice['invoiceFrom']['company'] }}<br>
                    @endif
                    {{ $invoice['invoiceFrom']['fullAddress'] }}
                    @if(!empty($invoice['invoiceFrom']['city']))
                        <br>{{ $invoice['invoiceFrom']['city'] }}@if(!empty($invoice['invoiceFrom']['zip_code'])), {{ $invoice['invoiceFrom']['zip_code'] }}@endif
                    @endif
                    @if(!empty($invoice['invoiceFrom']['country']))
                        <br>{{ $invoice['invoiceFrom']['country'] }}
                    @endif
                    @if(!empty($invoice['invoiceFrom']['phoneNumber']))
                        <br>{{ __('invoice.phone') }}: {{ $invoice['invoiceFrom']['phoneNumber'] }}
                    @endif
                    @if(!empty($invoice['invoiceFrom']['email']))
                        <br>{{ $invoice['invoiceFrom']['email'] }}
                    @endif
                </div>
            </div>
            <div class="billing-box">
                <div class="billing-title">{{ __('invoice.invoice_to') }}</div>
                <div class="billing-text">
                    {{ $invoice['invoiceTo']['name'] }}<br>
                    @if(!empty($invoice['invoiceTo']['company']))
                        {{ $invoice['invoiceTo']['company'] }}<br>
                    @endif
                    @if(!empty($invoice['invoiceTo']['companyNumber']))
                        {{ __('invoice.company_number') }}: {{ $invoice['invoiceTo']['companyNumber'] }}<br>
                    @endif
                    {{ $invoice['invoiceTo']['fullAddress'] }}
                    @if(!empty($invoice['invoiceTo']['city']))
                        <br>{{ $invoice['invoiceTo']['city'] }}@if(!empty($invoice['invoiceTo']['zip_code'])), {{ $invoice['invoiceTo']['zip_code'] }}@endif
                    @endif
                    @if(!empty($invoice['invoiceTo']['country']))
                        <br>{{ $invoice['invoiceTo']['country'] }}
                    @endif
                    @if(!empty($invoice['invoiceTo']['phoneNumber']))
                        <br>{{ __('invoice.phone') }}: {{ $invoice['invoiceTo']['phoneNumber'] }}
                    @endif
                    @if(!empty($invoice['invoiceTo']['email']))
                        <br>{{ $invoice['invoiceTo']['email'] }}
                    @endif
                </div>
            </div>
        </div>

        <!-- Dates: Date Create and Due Date -->
        <div class="dates-grid">
            <div class="date-box">
                <div class="date-title">{{ __('invoice.date_create') }}</div>
                <div class="date-value">{{ \Carbon\Carbon::parse($invoice['createDate'])->format('d M Y') }}</div>
            </div>
            @if($invoice['status'] !== 'paid' && $invoice['dueDate'])
            <div class="date-box">
                <div class="date-title">{{ __('invoice.due_date') }}</div>
                <div class="date-value">{{ \Carbon\Carbon::parse($invoice['dueDate'])->format('d M Y') }}</div>
            </div>
            @endif
        </div>

        <!-- Items Table -->
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>{{ __('invoice.description') }}</th>
                    <th>{{ __('invoice.qty') }}</th>
                    <th>{{ __('invoice.unit_price') }}</th>
                    <th>{{ __('invoice.total') }}</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice['items'] as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>
                        <div class="item-title">{{ $item['title'] }}</div>
                        <div class="item-description">{{ $item['description'] }}</div>
                    </td>
                    <td>{{ $item['quantity'] }}</td>
                    <td>${{ number_format($item['price'], 2) }}</td>
                    <td>${{ number_format($item['price'] * $item['quantity'], 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Divider -->
        <div class="divider"></div>

        <!-- Summary -->
        <div class="summary-section">
            <div class="summary-row">
                <div class="summary-label">{{ __('invoice.subtotal') }}</div>
                <div class="summary-value">${{ number_format($invoice['subtotal'], 2) }}</div>
            </div>
            <div class="summary-row">
                <div class="summary-label">{{ __('invoice.vat') }}</div>
                <div class="summary-value">
                    @php
                        // Calculate percentage from dollar amount, matching frontend fPercent behavior
                        $taxPercent = $invoice['subtotal'] > 0 ? ($invoice['taxes'] / $invoice['subtotal']) * 100 : 0;
                        // Format as percentage (e.g., 10.5%)
                        $formattedPercent = number_format($taxPercent, 1);
                    @endphp
                    {{ $invoice['taxes'] > 0 ? $formattedPercent . '%' : '-' }}
                </div>
            </div>
            <div class="summary-row summary-total">
                <div class="summary-label">{{ __('invoice.total') }}</div>
                <div class="summary-value">${{ number_format($invoice['totalAmount'], 2) }}</div>
            </div>
        </div>

        <!-- Divider -->
        <div class="divider"></div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-box">
                @if(!empty($invoice['invoiceNote']))
                    <div class="footer-title">{{ __('invoice.notes') }}</div>
                    <div class="footer-text">{!! nl2br(e($invoice['invoiceNote'])) !!}</div>
                @endif
                @if(isset($invoice['bankDetails']) && $invoice['bankDetails'])
                    <div style="margin-top: 16px;">
                        <div class="footer-title">{{ __('invoice.bank_details') }}</div>
                        <div class="footer-text" style="margin-top: 4px;">
                            @if(!empty($invoice['bankDetails']['iban']))
                                <strong>{{ __('invoice.iban') }}:</strong> {{ $invoice['bankDetails']['iban'] }}<br>
                            @endif
                            @if(!empty($invoice['bankDetails']['bic_code']))
                                <strong>{{ __('invoice.bic_swift') }}:</strong> {{ $invoice['bankDetails']['bic_code'] }}<br>
                            @endif
                            @if(!empty($invoice['bankDetails']['bank_account']))
                                <strong>{{ __('invoice.bankgiro') }}:</strong> {{ $invoice['bankDetails']['bank_account'] }}
                            @endif
                        </div>
                    </div>
                @endif
            </div>
            <div class="footer-box right">
                <div class="footer-title">{{ __('invoice.have_question') }}</div>
                <div class="footer-text">{{ $invoice['adminEmail'] ?? 'support@minimals.cc' }}</div>
            </div>
        </div>
    </div>
</body>
</html>
