import type { IInvoice } from 'src/types/invoice';

import sanctum from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

export type InvoiceApiResponse = {
  status: boolean;
  message: string;
  data: {
    data: IInvoice[];
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
    };
  };
};

export type InvoiceFilters = {
  search?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
};

/**
 * Transform API invoice data to match frontend IInvoice format
 */
function transformInvoice(apiInvoice: any): IInvoice {
  // Handle both camelCase and snake_case field names
  const paymentAttachment = apiInvoice.paymentAttachment ?? apiInvoice.payment_attachment ?? null;
  const bankDetails = apiInvoice.bankDetails ?? apiInvoice.bank_details ?? null;

  return {
    id: apiInvoice.id,
    companyId: apiInvoice.companyId,
    invoiceNumber: apiInvoice.invoiceNumber,
    status: apiInvoice.status,
    createDate: apiInvoice.createDate,
    dueDate: apiInvoice.dueDate,
    totalAmount: apiInvoice.totalAmount,
    subtotal: apiInvoice.subtotal,
    taxes: apiInvoice.taxes,
    discount: apiInvoice.discount ?? 0,
    shipping: apiInvoice.shipping ?? 0,
    sent: apiInvoice.sent ?? 0,
    items: apiInvoice.items ?? [],
    invoiceTo: apiInvoice.invoiceTo,
    invoiceFrom: apiInvoice.invoiceFrom,
    logo: apiInvoice.logo ?? null,
    invoiceNote: apiInvoice.invoiceNote ?? null,
    adminEmail: apiInvoice.adminEmail ?? null,
    paymentAttachment,
    bankDetails,
  };
}

/**
 * Fetch invoices list from API
 */
export async function fetchInvoices(filters?: InvoiceFilters): Promise<{
  data: IInvoice[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}> {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);
  if (filters?.sort_by) params.append('sort_by', filters.sort_by);
  if (filters?.sort_order) params.append('sort_order', filters.sort_order);
  if (filters?.per_page) params.append('per_page', filters.per_page.toString());
  if (filters?.page) params.append('page', filters.page.toString());

  const url = `/api/v1/invoices${params.toString() ? `?${params.toString()}` : ''}`;

  // sanctum interceptor unwraps { status, message, data } → data
  const response = await sanctum.get(url);

  // Response structure: { data: { data: IInvoice[], pagination: {...} } }
  const responseData: any = response.data || {};

  return {
    data: (responseData.data || []).map(transformInvoice),
    pagination: responseData.pagination || {
      current_page: 1,
      per_page: 15,
      total: 0,
      last_page: 1,
    },
  };
}

/**
 * Fetch a single invoice by ID from API
 */
export async function fetchInvoice(id: string): Promise<IInvoice | null> {
  try {
    const url = `/api/v1/invoices/${id}`;

    // sanctum interceptor unwraps { status, message, data } → data
    const response = await sanctum.get(url);

    // Response structure: { id, invoiceNumber, ... }
    const responseData: any = response.data || {};

    if (!responseData.id) {
      return null;
    }

    return transformInvoice(responseData);
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Upload payment attachment for an invoice
 */
export async function uploadInvoicePaymentAttachment(
  invoiceId: string,
  file: File
): Promise<void> {
  const formData = new FormData();
  formData.append('paymentAttachment', file);

  await sanctum.post(`/api/v1/invoices/${invoiceId}/upload-payment`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
