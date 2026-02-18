<?php

namespace App\Mail;

use App\Models\User;
use App\Models\Order;
use App\Services\EmailTemplateService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public Order $order,
        public string $emailTemplateContent,
        public string $emailSubject
    ) {
    }

    public function build(): self
    {
        // Generate invoice PDF
        $pdfPath = $this->generateInvoicePdf();

        /** @var EmailTemplateService $service */
        $service = app(EmailTemplateService::class);

        $html = $service->wrapContent($this->emailTemplateContent, [
            'fallback_content' => $this->emailTemplateContent,
        ]);

        $mail = $this
            ->subject($this->emailSubject)
            ->html($html)
            ->attach($pdfPath, [
                'as' => $this->order->invoice_number . '.pdf',
                'mime' => 'application/pdf',
            ]);

        // Clean up temporary PDF file after sending
        if (file_exists($pdfPath)) {
            register_shutdown_function(function() use ($pdfPath) {
                @unlink($pdfPath);
            });
        }

        return $mail;
    }

    private function generateInvoicePdf(): string
    {
        // Get admin settings and admin user
        $adminSettings = \App\Models\AdminSettings::first();
        $adminUser = \App\Models\User::role('admin')->first();
        $logoPath = null;
        if ($adminSettings && $adminSettings->logo) {
            $logoPath = Storage::disk('public')->path($adminSettings->logo);
            if (!file_exists($logoPath)) {
                $altPath = storage_path('app/public/' . $adminSettings->logo);
                if (file_exists($altPath)) {
                    $logoPath = $altPath;
                } else {
                    $logoPath = null;
                }
            }
            if ($logoPath && file_exists($logoPath)) {
                $logoPath = 'file://' . $logoPath;
            } else {
                $logoPath = null;
            }
        }
        
        // Determine invoice note - only show "Reverse VAT charge X%" for EU countries (non-Swedish) without VAT number
        // Reload company relationship to ensure it's available (important for queued jobs)
        $this->order->load('company');
        $company = $this->order->company;
        
        // Set locale based on company user's language preference for PDF generation
        $userLanguage = $company && $company->user_language ? $company->user_language : 'en';
        // Validate supported languages
        $supportedLanguages = ['en', 'sv', 'no', 'da', 'fi', 'de', 'fr'];
        if (!in_array($userLanguage, $supportedLanguages)) {
            $userLanguage = 'en';
        }
        \Illuminate\Support\Facades\App::setLocale($userLanguage);
        
        $euCountries = [
            'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
            'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
            'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
            'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'
        ];
        $companyCountry = $company ? trim((string) ($company->country ?? '')) : '';
        $isEUCountry = !empty($companyCountry) && in_array($companyCountry, $euCountries, true);
        $isSweden = $companyCountry === 'Sweden';
        $hasVatNumber = $company && !empty($company->vat_number) && trim((string) $company->vat_number) !== '';
        
        // Build invoice note: admin note + reverse VAT charge (if applicable)
        $invoiceNoteParts = [];
        
        // Add admin's invoice note if set
        if ($adminSettings && !empty(trim($adminSettings->invoice_note ?? ''))) {
            $invoiceNoteParts[] = trim($adminSettings->invoice_note);
        }
        
        // Add reverse VAT charge if applicable
        if ($isEUCountry && !$isSweden && !$hasVatNumber && $adminSettings && $adminSettings->vat) {
            $vatPercentage = (float) $adminSettings->vat;
            // Locale is already set based on user's language preference (line 92)
            $invoiceNoteParts[] = __('invoice.reverse_vat_charge', ['vat' => $vatPercentage]);
        }
        
        $invoiceNote = !empty($invoiceNoteParts) ? implode("\n", $invoiceNoteParts) : null;

        // Transform order to invoice format
        $totalAmount = (float) $this->order->price + (float) $this->order->vat;
        
        $statusMap = [
            'paid' => 'paid',
            'pending' => 'pending',
        ];
        $invoiceStatus = $statusMap[$this->order->status] ?? 'pending';

        $company = $this->order->company;
        $invoiceTo = [
            'id' => $company->id ?? '',
            'name' => $company->name ?? 'N/A',
            'email' => $company->email ?? '',
            'address' => $company->address ?? '',
            'phone' => $company->phone ?? '',
            'company' => $company->company_name ?? '',
            'companyNumber' => $company->company_number ?? '',
            'fullAddress' => $company->address ?? '',
            'phoneNumber' => $company->phone ?? '',
            'city' => $company->city ?? '',
            'zip_code' => $company->zip_code ?? '',
            'country' => $company->country ?? '',
        ];

        $invoiceFrom = [
            'id' => $adminUser->id ?? '',
            'name' => $adminUser->name ?? 'System',
            'email' => $adminUser->email ?? '',
            'address' => $adminUser->address ?? '',
            'phone' => $adminUser->phone ?? '',
            'company' => $adminUser->company_name ?? 'Wisling',
            'companyNumber' => $adminUser->company_number ?? '',
            'fullAddress' => $adminUser->address ?? '',
            'phoneNumber' => $adminUser->phone ?? '',
            'city' => $adminUser->city ?? '',
            'zip_code' => $adminUser->zip_code ?? '',
            'country' => $adminUser->country ?? '',
        ];

        $items = [[
            'id' => $this->order->id,
            'title' => $this->order->title ?? 'Subscription',
            'description' => $this->order->title ?? 'Wisling Subscription',
            'price' => (float) $this->order->price,
            'quantity' => 1,
            'service' => $this->order->title ?? 'Subscription',
            'total' => (float) $this->order->price,
        ]];

        $invoiceDate = $this->order->invoice_date ?? $this->order->created_at;
        $dueDate = $invoiceDate ? \Carbon\Carbon::parse($invoiceDate)->addDays(30)->format('Y-m-d') : null;

        // Add bank details - always include IBAN and BIC, add Bankgiro for Swedish customers
        $bankDetails = null;
        if ($adminSettings) {
            $company = $this->order->company;
            $isSwedishCustomer = $company && $company->country === 'Sweden';
            
            $bankDetails = [
                'iban' => $adminSettings->iban ?? null,
                'bic_code' => $adminSettings->bic_code ?? null,
            ];
            
            // Add Bankgiro for Swedish customers
            if ($isSwedishCustomer && $adminSettings->bank_account) {
                $bankDetails['bank_account'] = $adminSettings->bank_account;
            }
        }

        $data = [
            'invoice' => [
                'id' => $this->order->id,
                'invoiceNumber' => $this->order->invoice_number,
                'status' => $invoiceStatus,
                'createDate' => $this->order->invoice_date?->format('Y-m-d') ?? $this->order->created_at->format('Y-m-d'),
                'dueDate' => $dueDate,
                'totalAmount' => $totalAmount,
                'subtotal' => (float) $this->order->price,
                'taxes' => (float) $this->order->vat,
                'discount' => 0,
                'shipping' => 0,
                'items' => $items,
                'invoiceTo' => $invoiceTo,
                'invoiceFrom' => $invoiceFrom,
                'logo' => $logoPath,
                'invoiceNote' => $invoiceNote,
                'adminEmail' => $adminUser->email ?? 'support@minimals.cc',
                'bankDetails' => $bankDetails,
            ],
        ];

        // Generate PDF
        $pdf = Pdf::loadView('invoice.pdf', $data);
        $pdf->setPaper('A4', 'portrait');
        $pdf->setOption('margin-top', 10);
        $pdf->setOption('margin-bottom', 10);
        $pdf->setOption('margin-left', 10);
        $pdf->setOption('margin-right', 10);
        $pdf->setOption('enable-smart-shrinking', true);
        $pdf->setOption('dpi', 96);
        $pdf->setOption('isHtml5ParserEnabled', true);

        // Save PDF to temporary file
        $tempDir = storage_path('app/temp');
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }
        $pdfPath = $tempDir . '/' . $this->order->invoice_number . '_' . uniqid() . '.pdf';
        file_put_contents($pdfPath, $pdf->output());

        return $pdfPath;
    }
}

