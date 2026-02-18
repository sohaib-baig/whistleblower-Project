<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use App\Models\AdminSettings;
use App\Models\EmailTemplate;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ApiResponse;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Mail\WelcomeEmailWithInvoice;
use App\Mail\InvoiceEmail;
use App\Mail\AdminPaymentNotificationMail;
use App\Services\AccountVerificationEmailService;

class OrderController extends Controller
{
    use ApiResponse;

    /**
     * List invoices (orders) for the authenticated user
     * Admin can see all invoices, company users see only their own invoices
     */
    public function index(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->error('Unauthenticated', 401);
        }

        // Ensure roles are loaded
        $user->load('roles');

        // Build query
        $query = Order::with(['company', 'creator']);

        // Check user roles using multiple methods for reliability
        $userRoles = $user->getRoleNames()->map(fn($role) => strtolower($role))->toArray();
        // Fallback: also check using hasRole() method in case getRoleNames() has issues
        $isCompany = in_array('company', $userRoles) || $user->hasRole('company');
        $isAdmin = in_array('admin', $userRoles) || $user->hasRole('admin');
        $isImpersonating = $request->session()->has('impersonator_id');

        // Debug logging (remove in production if not needed)
        Log::debug('Invoice access check', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'user_roles' => $userRoles,
            'hasRole_company' => $user->hasRole('company'),
            'hasRole_admin' => $user->hasRole('admin'),
            'is_company' => $isCompany,
            'is_admin' => $isAdmin,
            'is_impersonating' => $isImpersonating,
        ]);

        // Handle impersonation: verify admin permissions and filter by impersonated company
        if ($isImpersonating) {
            $impersonatorId = $request->session()->get('impersonator_id');
            $admin = User::find($impersonatorId);
            if (!$admin || !$admin->hasRole('admin')) {
                Log::warning('Unauthorized invoice access attempt: impersonator is not admin', [
                    'impersonator_id' => $impersonatorId,
                    'user_id' => $user->id,
                ]);
                return $this->error('Unauthorized', 403);
            }
            // When impersonating, filter by the impersonated company user's ID
            // $user is the company being impersonated
            $query->where('company_id', $user->id);
        } elseif ($isCompany) {
            // Regular company users see only their own invoices
            $query->where('company_id', $user->id);
        } elseif ($isAdmin) {
            // Admin can see all invoices (no filter)
        } else {
            // Other roles don't have access
            Log::warning('Unauthorized invoice access attempt', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'user_roles' => $userRoles,
                'hasRole_company' => $user->hasRole('company'),
                'hasRole_admin' => $user->hasRole('admin'),
            ]);
            return $this->error('Unauthorized', 403);
        }

        // Search filter
        if ($request->has('search') && $request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhereHas('company', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Status filter
        if ($request->has('status') && $request->filled('status') && $request->string('status')->toString() !== 'all') {
            $status = $request->string('status')->toString();
            $query->where('status', $status);
        }

        // Date range filters
        if ($request->has('start_date') && $request->filled('start_date')) {
            $query->whereDate('invoice_date', '>=', $request->string('start_date')->toString());
        }
        if ($request->has('end_date') && $request->filled('end_date')) {
            $query->whereDate('invoice_date', '<=', $request->string('end_date')->toString());
        }

        // Sorting
        $sortBy = $request->string('sort_by', 'created_at')->toString();
        $sortOrder = $request->string('sort_order', 'desc')->toString();
        $allowedSorts = ['invoice_date', 'created_at', 'price', 'status', 'invoice_number'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // Pagination
        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $orders = $query->paginate($perPage);

        // Get admin settings and admin user (once, outside the loop for performance)
        $adminSettings = AdminSettings::first();
        $adminUser = User::role('admin')->first();
        $logoUrl = $adminSettings && $adminSettings->logo ? Storage::url($adminSettings->logo) : null;
        
        // EU countries list for invoice note
        $euCountries = [
            'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
            'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
            'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
            'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'
        ];

        // Transform orders to invoice format for frontend
        $invoices = $orders->getCollection()->map(function ($order) use ($logoUrl, $adminUser, $adminSettings, $euCountries) {
            // Calculate total amount (price + VAT)
            $totalAmount = (float) $order->price + (float) $order->vat;
            
            // Map order status to invoice status
            $statusMap = [
                'paid' => 'paid',
                'pending' => 'pending',
            ];
            $invoiceStatus = $statusMap[$order->status] ?? 'pending';

            // Get company info for invoiceTo
            $company = $order->company;
            $invoiceTo = [
                'id' => $company->id ?? '',
                'name' => $company->name ?? 'N/A',
                'email' => $company->email ?? '',
                'address' => $company->address ?? '',
                'phone' => $company->phone ?? '',
                'company' => $company->company_name ?? '',
                'companyNumber' => $company->company_number ?? '',
                'city' => $company->city ?? '',
                'zip_code' => $company->zip_code ?? '',
                'country' => $company->country ?? '',
            ];

            // Get admin user info for invoiceFrom
            $invoiceFrom = [
                'id' => $adminUser->id ?? '',
                'name' => $adminUser->name ?? 'System',
                'email' => $adminUser->email ?? '',
                'address' => $adminUser->address ?? '',
                'phone' => $adminUser->phone ?? '',
                'company' => $adminUser->company_name ?? 'Wisling',
                'companyNumber' => $adminUser->company_number ?? '',
                'city' => $adminUser->city ?? '',
                'zip_code' => $adminUser->zip_code ?? '',
                'country' => $adminUser->country ?? '',
            ];

            // Create invoice items from order title
            $items = [[
                'id' => $order->id,
                'title' => $order->title ?? 'Subscription',
                'description' => $order->title ?? 'Wisling Subscription',
                'price' => (float) $order->price,
                'quantity' => 1,
                'service' => $order->title ?? 'Subscription',
                'total' => (float) $order->price,
            ]];

            // Calculate due date (30 days from invoice date or created_at)
            $invoiceDate = $order->invoice_date ?? $order->created_at;
            $dueDate = $invoiceDate ? \Carbon\Carbon::parse($invoiceDate)->addDays(30)->format('Y-m-d') : null;

            // Determine invoice note - combine admin note and reverse VAT charge if applicable
            $companyCountry = $company ? trim((string) ($company->country ?? '')) : '';
            $isEUCountry = !empty($companyCountry) && in_array($companyCountry, $euCountries, true);
            $isSweden = $companyCountry === 'Sweden';
            $hasVatNumber = $company && !empty($company->vat_number) && trim((string) $company->vat_number) !== '';
            
            // Get user's language for translation
            $userLanguage = $company && $company->user_language ? $company->user_language : 'en';
            $supportedLanguages = ['en', 'sv', 'no', 'da', 'fi', 'de', 'fr'];
            if (!in_array($userLanguage, $supportedLanguages)) {
                $userLanguage = 'en';
            }
            App::setLocale($userLanguage);
            
            // Build invoice note: admin note + reverse VAT charge (if applicable)
            $invoiceNoteParts = [];
            
            // Add admin's invoice note if set
            if ($adminSettings && !empty(trim($adminSettings->invoice_note ?? ''))) {
                $invoiceNoteParts[] = trim($adminSettings->invoice_note);
            }
            
            // Add reverse VAT charge if applicable
            if ($isEUCountry && !$isSweden && !$hasVatNumber && $adminSettings && $adminSettings->vat) {
                $vatPercentage = (float) $adminSettings->vat;
                $invoiceNoteParts[] = __('invoice.reverse_vat_charge', ['vat' => $vatPercentage]);
            }
            
            $invoiceNote = !empty($invoiceNoteParts) ? implode("\n", $invoiceNoteParts) : null;

            $paymentAttachmentUrl = null;
            if ($order->payment_attachment) {
                $url = Storage::url($order->payment_attachment);
                $paymentAttachmentUrl = !empty(trim($url)) ? $url : null;
            }

            // Add bank details - always include IBAN and BIC, add Bankgiro for Swedish customers
            $bankDetails = null;
            if ($adminSettings) {
                $company = $order->company;
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

            return [
                'id' => $order->id,
                'companyId' => $order->company_id,
                'invoiceNumber' => $order->invoice_number,
                'status' => $invoiceStatus,
                'createDate' => $order->invoice_date?->format('Y-m-d') ?? $order->created_at->format('Y-m-d'),
                'dueDate' => $dueDate,
                'totalAmount' => $totalAmount,
                'subtotal' => (float) $order->price,
                'taxes' => (float) $order->vat,
                'discount' => 0,
                'shipping' => 0,
                'sent' => 0, // Can be updated if tracking is needed
                'items' => $items,
                'invoiceTo' => $invoiceTo,
                'invoiceFrom' => $invoiceFrom,
                'logo' => $logoUrl,
                'invoiceNote' => $invoiceNote,
                'adminEmail' => $adminUser->email ?? null,
                'paymentAttachment' => $paymentAttachmentUrl,
                'bankDetails' => $bankDetails,
            ];
        });

        return $this->success([
            'data' => $invoices,
            'pagination' => [
                'current_page' => $orders->currentPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
                'last_page' => $orders->lastPage(),
            ],
        ]);
    }

    /**
     * Get a single invoice (order) by ID
     */
    public function show(Request $request, string $id): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->error('Unauthenticated', 401);
        }

        $order = Order::with(['company', 'creator'])->find($id);

        if (!$order) {
            return $this->error('Invoice not found', 404);
        }

        // Check authorization - company users can only see their own invoices
        $userRoles = $user->getRoleNames()->map(fn($role) => strtolower($role))->toArray();
        $isCompany = in_array('company', $userRoles) || $user->hasRole('company');
        $isAdmin = in_array('admin', $userRoles) || $user->hasRole('admin');
        $isImpersonating = $request->session()->has('impersonator_id');

        // Handle impersonation: verify admin permissions and allow access to impersonated company's invoices
        if ($isImpersonating) {
            $impersonatorId = $request->session()->get('impersonator_id');
            $admin = User::find($impersonatorId);
            if (!$admin || !$admin->hasRole('admin')) {
                return $this->error('Unauthorized', 403);
            }
            // When impersonating, allow access if the invoice belongs to the impersonated company
            if ($order->company_id !== $user->id) {
                return $this->error('Unauthorized', 403);
            }
        } elseif ($isCompany) {
            // Regular company users can only see their own invoices
            if ($order->company_id !== $user->id) {
                return $this->error('Unauthorized', 403);
            }
        } elseif (!$isAdmin) {
            // Other roles don't have access
            return $this->error('Unauthorized', 403);
        }

        // Get admin settings and admin user
        $adminSettings = AdminSettings::first();
        $adminUser = User::role('admin')->first();
        $logoUrl = $adminSettings && $adminSettings->logo ? Storage::url($adminSettings->logo) : null;
        
        // Determine invoice note - combine admin note and reverse VAT charge if applicable
        $company = $order->company;
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
        
        // Get user's language for translation
        $userLanguage = $company && $company->user_language ? $company->user_language : 'en';
        $supportedLanguages = ['en', 'sv', 'no', 'da', 'fi', 'de', 'fr'];
        if (!in_array($userLanguage, $supportedLanguages)) {
            $userLanguage = 'en';
        }
        App::setLocale($userLanguage);
        
        // Build invoice note: admin note + reverse VAT charge (if applicable)
        $invoiceNoteParts = [];
        
        // Add admin's invoice note if set
        if ($adminSettings && !empty(trim($adminSettings->invoice_note ?? ''))) {
            $invoiceNoteParts[] = trim($adminSettings->invoice_note);
        }
        
        // Add reverse VAT charge if applicable
        if ($isEUCountry && !$isSweden && !$hasVatNumber && $adminSettings && $adminSettings->vat) {
            $vatPercentage = (float) $adminSettings->vat;
            $invoiceNoteParts[] = __('invoice.reverse_vat_charge', ['vat' => $vatPercentage]);
        }
        
        $invoiceNote = !empty($invoiceNoteParts) ? implode("\n", $invoiceNoteParts) : null;

        // Add bank details - always include IBAN and BIC, add Bankgiro for Swedish customers
        $bankDetails = null;
        if ($adminSettings) {
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

        // Transform order to invoice format (same as in index method)
        $totalAmount = (float) $order->price + (float) $order->vat;
        
        $statusMap = [
            'paid' => 'paid',
            'pending' => 'pending',
        ];
        $invoiceStatus = $statusMap[$order->status] ?? 'pending';

        $company = $order->company;
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

        // Get admin user info for invoiceFrom
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
            'id' => $order->id,
            'title' => $order->title ?? 'Subscription',
            'description' => $order->title ?? 'Wisling Subscription',
            'price' => (float) $order->price,
            'quantity' => 1,
            'service' => $order->title ?? 'Subscription',
            'total' => (float) $order->price,
        ]];

        $invoiceDate = $order->invoice_date ?? $order->created_at;
        $dueDate = $invoiceDate ? \Carbon\Carbon::parse($invoiceDate)->addDays(30)->format('Y-m-d') : null;

        $paymentAttachmentUrl = $order->payment_attachment ? Storage::url($order->payment_attachment) : null;

        $invoice = [
            'id' => $order->id,
            'companyId' => $order->company_id,
            'invoiceNumber' => $order->invoice_number,
            'status' => $invoiceStatus,
            'createDate' => $order->invoice_date?->format('Y-m-d') ?? $order->created_at->format('Y-m-d'),
            'dueDate' => $dueDate,
            'totalAmount' => $totalAmount,
            'subtotal' => (float) $order->price,
            'taxes' => (float) $order->vat,
            'discount' => 0,
            'shipping' => 0,
            'sent' => 0,
            'items' => $items,
            'invoiceTo' => $invoiceTo,
            'invoiceFrom' => $invoiceFrom,
            'logo' => $logoUrl,
            'invoiceNote' => $invoiceNote,
            'adminEmail' => $adminUser->email ?? null,
            'paymentAttachment' => $paymentAttachmentUrl,
            'bankDetails' => $bankDetails,
        ];

        return $this->success($invoice);
    }

    /**
     * Generate and download PDF invoice
     */
    public function downloadPdf(Request $request, string $id): \Illuminate\Http\Response
    {
        $user = $request->user();
        
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $order = Order::with(['company', 'creator'])->find($id);

        if (!$order) {
            abort(404, 'Invoice not found');
        }

        // Check authorization - company users can only see their own invoices
        $userRoles = $user->getRoleNames()->map(fn($role) => strtolower($role))->toArray();
        $isCompany = in_array('company', $userRoles) || $user->hasRole('company');
        $isAdmin = in_array('admin', $userRoles) || $user->hasRole('admin');
        $isImpersonating = $request->session()->has('impersonator_id');

        // Handle impersonation: verify admin permissions and allow access to impersonated company's invoices
        if ($isImpersonating) {
            $impersonatorId = $request->session()->get('impersonator_id');
            $admin = User::find($impersonatorId);
            if (!$admin || !$admin->hasRole('admin')) {
                abort(403, 'Unauthorized');
            }
            // When impersonating, allow access if the invoice belongs to the impersonated company
            if ($order->company_id !== $user->id) {
                abort(403, 'Unauthorized');
            }
        } elseif ($isCompany) {
            // Regular company users can only see their own invoices
            if ($order->company_id !== $user->id) {
                abort(403, 'Unauthorized');
            }
        } elseif (!$isAdmin) {
            // Other roles don't have access
            abort(403, 'Unauthorized');
        }

        // Get admin settings and admin user
        $adminSettings = AdminSettings::first();
        $adminUser = User::role('admin')->first();
        
        // Get logo as absolute file path for PDF generation (DomPDF needs file paths, not URLs)
        $logoPath = null;
        if ($adminSettings && $adminSettings->logo) {
            // Try to get the file path from storage
            $logoPath = Storage::disk('public')->path($adminSettings->logo);
            // Check if file exists
            if (!file_exists($logoPath)) {
                // Try alternative path
                $altPath = storage_path('app/public/' . $adminSettings->logo);
                if (file_exists($altPath)) {
                    $logoPath = $altPath;
                } else {
                    $logoPath = null;
                }
            }
            // Format path for DomPDF (use file:// protocol for absolute paths)
            if ($logoPath && file_exists($logoPath)) {
                $logoPath = 'file://' . $logoPath;
            } else {
                $logoPath = null;
            }
        }
        
        // Determine invoice note - combine admin note and reverse VAT charge if applicable
        $company = $order->company;
        
        // Set locale based on company user's language preference for PDF generation
        $userLanguage = $company && $company->user_language ? $company->user_language : 'en';
        // Validate supported languages
        $supportedLanguages = ['en', 'sv', 'no', 'da', 'fi', 'de', 'fr'];
        if (!in_array($userLanguage, $supportedLanguages)) {
            $userLanguage = 'en';
        }
        App::setLocale($userLanguage);
        
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
            $invoiceNoteParts[] = __('invoice.reverse_vat_charge', ['vat' => $vatPercentage]);
        }
        
        $invoiceNote = !empty($invoiceNoteParts) ? implode("\n", $invoiceNoteParts) : null;

        // Add bank details - always include IBAN and BIC, add Bankgiro for Swedish customers
        $bankDetails = null;
        if ($adminSettings) {
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

        // Transform order to invoice format (same as in show method)
        $totalAmount = (float) $order->price + (float) $order->vat;
        
        $statusMap = [
            'paid' => 'paid',
            'pending' => 'pending',
        ];
        $invoiceStatus = $statusMap[$order->status] ?? 'pending';

        $company = $order->company;
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
            'id' => $order->id,
            'title' => $order->title ?? 'Subscription',
            'description' => $order->title ?? 'Wisling Subscription',
            'price' => (float) $order->price,
            'quantity' => 1,
            'service' => $order->title ?? 'Subscription',
            'total' => (float) $order->price,
        ]];

        $invoiceDate = $order->invoice_date ?? $order->created_at;
        $dueDate = $invoiceDate ? \Carbon\Carbon::parse($invoiceDate)->addDays(30)->format('Y-m-d') : null;

        // Prepare data for PDF
        $data = [
            'invoice' => [
                'id' => $order->id,
                'invoiceNumber' => $order->invoice_number,
                'status' => $invoiceStatus,
                'createDate' => $order->invoice_date?->format('Y-m-d') ?? $order->created_at->format('Y-m-d'),
                'dueDate' => $dueDate,
                'totalAmount' => $totalAmount,
                'subtotal' => (float) $order->price,
                'taxes' => (float) $order->vat,
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

        // Generate PDF with optimized settings for single page
        $pdf = Pdf::loadView('invoice.pdf', $data);
        $pdf->setPaper('A4', 'portrait');
        $pdf->setOption('margin-top', 10);
        $pdf->setOption('margin-bottom', 10);
        $pdf->setOption('margin-left', 10);
        $pdf->setOption('margin-right', 10);
        $pdf->setOption('enable-smart-shrinking', true);
        $pdf->setOption('dpi', 96);
        $pdf->setOption('isHtml5ParserEnabled', true);
        
        return $pdf->download($order->invoice_number . '.pdf');
    }

    /**
     * Verify and update order status after Stripe checkout
     * This is called from the frontend success page as a backup to webhooks
     */
    public function verifyStripePayment(Request $request)
    {
        $request->validate([
            'session_id' => ['required', 'string'],
            'order_id' => ['required', 'uuid'],
        ]);

        try {
            $order = Order::find($request->input('order_id'));

            if (!$order) {
                return $this->error('Order not found', 404);
            }

            // Only update if still pending
            if ($order->status !== 'pending') {
                return $this->success([
                    'order_id' => $order->id,
                    'status' => $order->status,
                    'already_processed' => true,
                ], 'Order already processed');
            }

            // Verify session with Stripe
            $stripeSecretKey = config('services.stripe.secret');
            if (!$stripeSecretKey) {
                Log::error('Stripe secret key not configured');
                return $this->error('Stripe not configured', 500);
            }

            \Stripe\Stripe::setApiKey($stripeSecretKey);
            
            try {
                $session = \Stripe\Checkout\Session::retrieve($request->input('session_id'));
                
                // Check if payment was successful
                if ($session->payment_status === 'paid') {
                    // Update order status
                    $order->update([
                        'status' => 'paid',
                        'payment_response' => json_encode([
                            'event_type' => 'session_verification',
                            'session_id' => $session->id,
                            'payment_status' => $session->payment_status,
                            'payment_intent' => $session->payment_intent,
                            'amount_total' => $session->amount_total,
                            'currency' => $session->currency,
                            'customer_email' => $session->customer_email,
                            'verified_at' => now()->toDateTimeString(),
                        ]),
                    ]);

                    Log::info('Order verified and updated via frontend callback', [
                        'order_id' => $order->id,
                        'session_id' => $session->id,
                    ]);

                    // Load order with company relationship
                    $order->load('company');
                    $user = $order->company;

                    // Send welcome email with invoice PDF attachment (only after payment verification)
                    if ($user) {
                        $this->sendWelcomeEmailWithInvoice($user, $order);
                        // Send invoice email separately to company - DISABLED
                        // $this->sendInvoiceEmail($user, $order);
                        // Send verification email - DISABLED (verification link now included in Welcome Email)
                        // $this->sendAccountVerificationEmail($user);
                    }

                    // Notify admin about payment
                    try {
                        app(\App\Services\NotificationService::class)->notifyPaymentReceived($order);
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::warning('Failed to send payment notification', [
                            'order_id' => $order->id,
                            'error' => $e->getMessage(),
                        ]);
                    }

                    return $this->success([
                        'order_id' => $order->id,
                        'status' => 'paid',
                        'payment_verified' => true,
                    ], 'Payment verified successfully');
                }

                // Payment not completed
                return $this->success([
                    'order_id' => $order->id,
                    'status' => $order->status,
                    'payment_verified' => false,
                    'payment_status' => $session->payment_status,
                ], 'Payment not completed');

            } catch (\Stripe\Exception\ApiErrorException $e) {
                Log::error('Stripe API error during verification: ' . $e->getMessage());
                return $this->error('Failed to verify payment with Stripe: ' . $e->getMessage(), 500);
            }

        } catch (\Exception $e) {
            Log::error('Order verification failed: ' . $e->getMessage());
            return $this->error('Failed to verify order: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update invoice (order) status
     */
    public function updateStatus(Request $request, string $id): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->error('Unauthenticated', 401);
        }

        $request->validate([
            'status' => ['required', 'string', 'in:paid,pending'],
        ]);

        try {
            $order = Order::find($id);

            if (!$order) {
                return $this->error('Invoice not found', 404);
            }

            // Check authorization - company users can only update their own invoices
            $userRoles = $user->roles->pluck('name')->map(fn($role) => strtolower($role))->toArray();
            $isCompany = in_array('company', $userRoles) || $user->hasRole('company');
            $isAdmin = in_array('admin', $userRoles) || $user->hasRole('admin');
            $isImpersonating = $request->session()->has('impersonator_id');

            // Handle impersonation: verify admin permissions and allow access to impersonated company's invoices
            if ($isImpersonating) {
                $impersonatorId = $request->session()->get('impersonator_id');
                $admin = User::find($impersonatorId);
                if (!$admin || !$admin->hasRole('admin')) {
                    return $this->error('Unauthorized', 403);
                }
                // When impersonating, allow access if the invoice belongs to the impersonated company
                if ($order->company_id !== $user->id) {
                    return $this->error('Unauthorized', 403);
                }
            } elseif ($isCompany) {
                // Regular company users can only update their own invoices
                if ($order->company_id !== $user->id) {
                    return $this->error('Unauthorized', 403);
                }
            } elseif (!$isAdmin) {
                // Other roles don't have access
                return $this->error('Unauthorized', 403);
            }

            // Map invoice status to order status
            $statusMap = [
                'paid' => 'paid',
                'pending' => 'pending',
            ];

            $orderStatus = $statusMap[$request->input('status')] ?? 'pending';

            $oldStatus = $order->status;
            
            // Update order status
            $order->update([
                'status' => $orderStatus,
            ]);

            Log::info('Invoice status updated', [
                'order_id' => $order->id,
                'invoice_status' => $request->input('status'),
                'order_status' => $orderStatus,
                'updated_by' => $user->id,
            ]);

            // Load company relationship
            $order->load('company');
            $company = $order->company;

            // Notify admin if status changed to paid (for bank transfers)
            if ($orderStatus === 'paid' && $oldStatus !== 'paid') {
                try {
                    app(\App\Services\NotificationService::class)->notifyPaymentReceived($order);
                } catch (\Exception $e) {
                    Log::warning('Failed to send payment notification', [
                        'order_id' => $order->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Notify company user when admin updates status (including when impersonating)
            $isAdminUpdating = $isAdmin || $isImpersonating;
            if ($isAdminUpdating && $company && $oldStatus !== $orderStatus) {
                try {
                    $this->notifyCompanyStatusUpdated($order, $company, $request->input('status'));
                } catch (\Exception $e) {
                    Log::warning('Failed to notify company about status update', [
                        'order_id' => $order->id,
                        'company_id' => $company->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            return $this->success([
                'id' => $order->id,
                'status' => $request->input('status'),
            ], 'Invoice status updated successfully');
        } catch (\Exception $e) {
            Log::error('Failed to update invoice status: ' . $e->getMessage());
            return $this->error('Failed to update invoice status: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Upload payment attachment for an invoice (order)
     */
    public function uploadPaymentAttachment(Request $request, string $id): \Illuminate\Http\JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return $this->error('Unauthenticated', 401);
            }

            $order = Order::with(['company'])->find($id);

            if (!$order) {
                return $this->error('Invoice not found', 404);
            }

            // Check authorization - company users can only upload for their own invoices
            $userRoles = $user->getRoleNames()->map(fn($role) => strtolower($role))->toArray();
            $isCompany = in_array('company', $userRoles) || $user->hasRole('company');
            $isAdmin = in_array('admin', $userRoles) || $user->hasRole('admin');
            $isImpersonating = $request->session()->has('impersonator_id');

            // Handle impersonation: verify admin permissions and allow access to impersonated company's invoices
            if ($isImpersonating) {
                $impersonatorId = $request->session()->get('impersonator_id');
                $admin = User::find($impersonatorId);
                if (!$admin || !$admin->hasRole('admin')) {
                    return $this->error('Unauthorized', 403);
                }
                // When impersonating, allow access if the invoice belongs to the impersonated company
                if ($order->company_id !== $user->id) {
                    return $this->error('Unauthorized', 403);
                }
            } elseif ($isCompany) {
                // Regular company users can only upload for their own invoices
                if ($order->company_id !== $user->id) {
                    return $this->error('Unauthorized', 403);
                }
            } elseif (!$isAdmin) {
                // Other roles don't have access
                return $this->error('Unauthorized', 403);
            }

            // Validate file upload
            $request->validate([
                'paymentAttachment' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'], // 5MB max
            ]);

            // Delete old payment attachment if exists
            if ($order->payment_attachment) {
                try {
                    Storage::disk('public')->delete($order->payment_attachment);
                } catch (\Exception $e) {
                    Log::warning('Failed to delete old payment attachment', [
                        'order_id' => $order->id,
                        'attachment_path' => $order->payment_attachment,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Store new payment attachment
            $paymentAttachmentPath = $request->file('paymentAttachment')->store('payment_attachments', 'public');

            // Update order with new payment attachment
            $order->update([
                'payment_attachment' => $paymentAttachmentPath,
            ]);

            // Reload order to get updated payment_attachment
            $order->refresh();

            Log::info('Payment attachment uploaded', [
                'order_id' => $order->id,
                'invoice_number' => $order->invoice_number,
                'uploaded_by' => $user->id,
                'attachment_path' => $paymentAttachmentPath,
            ]);

            // Send notification and email to admins
            $this->notifyAdminsPaymentAttachmentUploaded($order);

            return $this->success([
                'id' => $order->id,
                'invoice_number' => $order->invoice_number,
                'payment_attachment' => Storage::url($paymentAttachmentPath),
            ], 'Payment receipt uploaded successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error('Validation failed', 422, ['errors' => $e->errors()]);
        } catch (\Exception $e) {
            Log::error('Failed to upload payment attachment: ' . $e->getMessage());
            return $this->error('Failed to upload payment receipt: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Notify company user when invoice status is updated by admin
     */
    private function notifyCompanyStatusUpdated(Order $order, User $company, string $invoiceStatus): void
    {
        try {
            // Get user's language preference
            $userLanguage = $company->user_language ?? 'en';
            // Validate supported languages
            $supportedLanguages = ['en', 'sv', 'no', 'da', 'fi', 'de', 'fr'];
            if (!in_array($userLanguage, $supportedLanguages)) {
                $userLanguage = 'en';
            }
            
            // Set locale based on user's language preference
            App::setLocale($userLanguage);
            
            // Get "Bank Transfer Status Company Email" template in user's language
            $template = EmailTemplate::getByNameAndLanguage('Bank Transfer Status Company Email', $userLanguage, true);

            if (!$template) {
                Log::warning('Bank Transfer Status Company Email template not found or inactive', [
                    'order_id' => $order->id,
                    'company_id' => $company->id,
                    'language' => $userLanguage,
                ]);
                return;
            }

            // Map invoice status to readable format for email
            $statusMap = [
                'paid' => 'Paid',
                'pending' => 'Pending',
                'overdue' => 'Overdue',
                'draft' => 'Draft',
            ];
            $statusLabel = $statusMap[$invoiceStatus] ?? $invoiceStatus;

            // Use AuthController's replaceEmailPlaceholders method
            $authController = new \App\Http\Controllers\AuthController();
            
            // Replace status-related placeholders with status label in the content and subject
            // This is done before replaceEmailPlaceholders because these placeholders in the template
            // refer to invoice status, not payment method
            $templateContent = $template->content;
            $templateSubject = $template->subject;
            
            // Replace [Status] placeholder
            $templateContent = str_replace('[Status]', $statusLabel, $templateContent);
            $templateSubject = str_replace('[Status]', $statusLabel, $templateSubject);
            $templateContent = str_replace('[status]', $statusLabel, $templateContent);
            $templateSubject = str_replace('[status]', $statusLabel, $templateSubject);
            $templateContent = str_replace('{{status}}', $statusLabel, $templateContent);
            $templateSubject = str_replace('{{status}}', $statusLabel, $templateSubject);
            
            // Replace [Payment Type] with status label (for backward compatibility)
            $templateContent = str_replace('[Payment Type]', $statusLabel, $templateContent);
            $templateSubject = str_replace('[Payment Type]', $statusLabel, $templateSubject);
            $templateContent = str_replace('[payment_type]', $statusLabel, $templateContent);
            $templateSubject = str_replace('[payment_type]', $statusLabel, $templateSubject);
            $templateContent = str_replace('{{payment_type}}', $statusLabel, $templateContent);
            $templateSubject = str_replace('{{payment_type}}', $statusLabel, $templateSubject);
            
            $emailContent = $authController->replaceEmailPlaceholders($templateContent, $company, $order);
            $emailSubject = $authController->replaceEmailPlaceholders($templateSubject, $company, $order);

            // Send email to company
            if ($company->email) {
                try {
                    Mail::to($company->email)->queue(
                        new InvoiceEmail($company, $order, $emailContent, $emailSubject)
                    );
                } catch (\Throwable $mailException) {
                    Log::error('Failed to send status update email to company', [
                        'company_id' => $company->id,
                        'company_email' => $company->email,
                        'order_id' => $order->id,
                        'error' => $mailException->getMessage(),
                    ]);
                }
            }

            // Send in-app notification to company
            try {
                $message = "Invoice {$order->invoice_number} status updated to {$statusLabel}";
                $redirectUrl = "/dashboard/invoice/{$order->id}";
                $metadata = [
                    'order_id' => $order->id,
                    'invoice_number' => $order->invoice_number,
                    'old_status' => $order->status,
                    'new_status' => $invoiceStatus,
                ];
                
                app(\App\Services\NotificationService::class)->notifyUser(
                    $company,
                    'invoice_status_updated',
                    $message,
                    $redirectUrl,
                    $metadata
                );
            } catch (\Exception $e) {
                Log::warning('Failed to send status update notification to company', [
                    'order_id' => $order->id,
                    'company_id' => $company->id,
                    'error' => $e->getMessage(),
                ]);
            }

            Log::info('Invoice status update notification sent to company', [
                'order_id' => $order->id,
                'invoice_number' => $order->invoice_number,
                'company_id' => $company->id,
                'company_email' => $company->email,
                'status' => $invoiceStatus,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to notify company about invoice status update', [
                'order_id' => $order->id,
                'company_id' => $company->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Notify admins when payment attachment is uploaded
     */
    private function notifyAdminsPaymentAttachmentUploaded(Order $order): void
    {
        try {
            // Load company relationship
            $order->load('company');
            $company = $order->company;

            if (!$company) {
                Log::warning('Company not found for order when sending payment attachment notification', [
                    'order_id' => $order->id,
                ]);
                return;
            }

            // Get "Bank Transfer Email Admin" template
            $template = EmailTemplate::query()
                ->where('name', 'Bank Transfer Email Admin')
                ->where('status', 'active')
                ->first();

            if (!$template) {
                Log::warning('Bank Transfer Email Admin template not found or inactive', [
                    'order_id' => $order->id,
                ]);
                return;
            }

            // Get all admin users
            $adminRecipients = User::role('admin')
                ->whereNotNull('email')
                ->get();

            if ($adminRecipients->isEmpty()) {
                Log::warning('No admin recipients found for payment attachment notification', [
                    'order_id' => $order->id,
                ]);
                return;
            }

            // Use AuthController's replaceEmailPlaceholders method
            $authController = new \App\Http\Controllers\AuthController();
            $emailContent = $authController->replaceEmailPlaceholders($template->content, $company, $order);
            $emailSubject = $authController->replaceEmailPlaceholders($template->subject, $company, $order);

            // Send email to all admins
            foreach ($adminRecipients as $admin) {
                try {
                    Mail::to($admin->email)->queue(
                        new AdminPaymentNotificationMail($company, $order, $emailSubject, $emailContent)
                    );
                } catch (\Throwable $mailException) {
                    Log::error('Failed to send payment attachment email to admin', [
                        'admin_id' => $admin->id,
                        'admin_email' => $admin->email,
                        'order_id' => $order->id,
                        'error' => $mailException->getMessage(),
                    ]);
                }
            }

            // Send in-app notification to admins
            try {
                app(\App\Services\NotificationService::class)->notifyPaymentReceived($order);
            } catch (\Exception $e) {
                Log::warning('Failed to send payment attachment notification', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage(),
                ]);
            }

            Log::info('Payment attachment notification sent to admins', [
                'order_id' => $order->id,
                'invoice_number' => $order->invoice_number,
                'admin_count' => $adminRecipients->count(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to notify admins about payment attachment upload', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Send welcome email with invoice PDF attachment
     */
    private function sendWelcomeEmailWithInvoice(User $user, Order $order): void
    {
        try {
            // Generate verification link for Welcome Email
            $verificationUrl = null;
            if (!$user->hasVerifiedEmail()) {
                try {
                    $expirationMinutes = (int) (config('auth.verification.expire', 60));
                    $parameters = [
                        'id' => $user->getKey(),
                        'hash' => sha1($user->getEmailForVerification()),
                    ];

                    $frontendBase = config('app.frontend_url') ?? env('FRONTEND_URL') ?? config('app.url');
                    if ($frontendBase) {
                        $parameters['redirect'] = rtrim((string) $frontendBase, '/') . '/auth/sign-in';
                    }

                    $verificationUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
                        'verification.verify',
                        now()->addMinutes($expirationMinutes > 0 ? $expirationMinutes : 60),
                        $parameters
                    );
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Failed to generate verification URL for welcome email', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Get welcome email template by name (fallback to default if missing)
            $welcomeTemplate = EmailTemplate::query()
                ->where('name', 'Welcome Email')
                ->where('status', 'active')
                ->first();
            if ($welcomeTemplate && $welcomeTemplate->status === 'active') {
                $authController = new \App\Http\Controllers\AuthController();
                $welcomeContent = $authController->replaceEmailPlaceholders($welcomeTemplate->content, $user, $order, $verificationUrl);
                $welcomeSubject = $authController->replaceEmailPlaceholders($welcomeTemplate->subject, $user, $order, $verificationUrl);
                
                Log::info('Sending welcome email with invoice after Stripe payment', [
                    'user_email' => $user->email,
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                ]);
                
                Log::debug('Dispatching WelcomeEmailWithInvoice (Stripe verification) with template', [
                    'user_email' => $user->email,
                    'subject' => $welcomeSubject,
                ]);

                // Queue email for asynchronous delivery
                Mail::to($user->email)->queue(
                    new WelcomeEmailWithInvoice($user, $order, $welcomeContent, $welcomeSubject)
                );
                
                Log::info('Welcome email sent successfully after Stripe payment', [
                    'user_email' => $user->email,
                    'user_id' => $user->id,
                ]);
            } else {
                Log::warning('Welcome email template not found or inactive', [
                    'template_name' => 'Welcome Email',
                    'template_exists' => (bool) $welcomeTemplate,
                    'template_status' => $welcomeTemplate?->status ?? 'not_found',
                    'user_id' => $user->id,
                ]);

                $authController = new \App\Http\Controllers\AuthController();
                $fallbackSubject = 'Welcome to ' . (config('app.name') ?? 'wisling');
                $fallbackContent = $authController->replaceEmailPlaceholders(
                    '<p>Hi {{name}},</p><p>Thank you for subscribing to our platform. Your invoice number is {{invoice_number}}.</p>',
                    $user,
                    $order,
                    $verificationUrl
                );

                Mail::to($user->email)->queue(
                    new WelcomeEmailWithInvoice($user, $order, $fallbackContent, $fallbackSubject)
                );
            }
        } catch (\Exception $e) {
            Log::error('Failed to send welcome email with invoice: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'order_id' => $order->id,
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Send invoice email separately to company
     */
    private function sendInvoiceEmail(User $user, Order $order): void
    {
        try {
            // Get invoice email template by name and user language (fallback to English)
            $userLanguage = $user->user_language ?? 'en';
            $invoiceTemplate = EmailTemplate::getByNameAndLanguage('Invoice Email', $userLanguage, true);
            if ($invoiceTemplate && $invoiceTemplate->status === 'active') {
                $authController = new \App\Http\Controllers\AuthController();
                $invoiceContent = $authController->replaceEmailPlaceholders($invoiceTemplate->content, $user, $order);
                $invoiceSubject = $authController->replaceEmailPlaceholders($invoiceTemplate->subject, $user, $order);
                
                Log::info('Sending invoice email after Stripe payment', [
                    'user_email' => $user->email,
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                ]);
                
                Log::debug('Dispatching InvoiceEmail (Stripe verification) with template', [
                    'user_email' => $user->email,
                    'subject' => $invoiceSubject,
                ]);

                // Queue email for asynchronous delivery
                Mail::to($user->email)->queue(
                    new InvoiceEmail($user, $order, $invoiceContent, $invoiceSubject)
                );
                
                Log::info('Invoice email sent successfully after Stripe payment', [
                    'user_email' => $user->email,
                    'user_id' => $user->id,
                ]);
            } else {
                Log::warning('Invoice email template not found or inactive', [
                    'template_name' => 'Invoice Email',
                    'template_exists' => (bool) $invoiceTemplate,
                    'template_status' => $invoiceTemplate?->status ?? 'not_found',
                    'user_id' => $user->id,
                ]);

                $authController = new \App\Http\Controllers\AuthController();
                $fallbackSubject = 'Your invoice ' . ($order->invoice_number ?? '');
                $fallbackContent = $authController->replaceEmailPlaceholders(
                    '<p>Hi {{name}},</p><p>Please find your invoice #{{invoice_number}} attached.</p>',
                    $user,
                    $order
                );

                Mail::to($user->email)->queue(
                    new InvoiceEmail($user, $order, $fallbackContent, $fallbackSubject)
                );
            }
        } catch (\Exception $e) {
            Log::error('Failed to send invoice email: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'order_id' => $order->id,
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    private function sendAccountVerificationEmail(User $user): void
    {
        try {
            app(AccountVerificationEmailService::class)->send($user);
        } catch (\Throwable $e) {
            Log::error('Failed to send account verification email after Stripe payment', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

