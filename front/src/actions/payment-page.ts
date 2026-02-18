import type { IPaymentPage, IPaymentPageFormData } from 'src/types/payment-page';

import { useState, useEffect, useCallback } from 'react';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

/**
 * Fetch payment page from API
 */
export async function fetchPaymentPage(): Promise<any> {
  const response = await sanctum.get(endpoints.pages.paymentPage.get);
  return response.data;
}

/**
 * Update payment page
 */
export async function updatePaymentPage(data: IPaymentPageFormData): Promise<any> {
  await initSanctumCsrf();

  const payload = {
    page_title: data.title,
    page_content: data.content,
  };

  const response = await sanctum.put(endpoints.pages.paymentPage.update, payload);
  return response.data;
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch payment page with loading state
 */
export function useGetPaymentPage() {
  const [data, setData] = useState<IPaymentPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPaymentPage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchPaymentPage();

      // Handle both existing pages and default values when page doesn't exist
      const transformedData: IPaymentPage = {
        id: response.id || null,
        title: response.page_title || 'Payment Information',
        content: response.page_content || '<p>Manage your payment information and billing details.</p>',
        lastUpdated: response.updated_at || null,
        pageType: response.page_type || 'payment',
      };

      setData(transformedData);
    } catch (err: any) {
      console.error('Failed to fetch payment page:', err);
      
      // Provide more detailed error information for debugging
      const errorMessage = err?.message || err?.response?.data?.message || 'Failed to fetch payment page';
      const httpStatus = err?.httpStatus || err?.response?.status;
      
      console.error('Payment page fetch error details:', {
        message: errorMessage,
        status: httpStatus,
        url: endpoints.pages.paymentPage.get,
        error: err,
      });
      
      setError(errorMessage);
      
      // Set default values on error so the page can still be displayed/edited
      setData({
        id: null,
        title: 'Payment Information',
        content: '<p>Manage your payment information and billing details.</p>',
        lastUpdated: null,
        pageType: 'payment',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentPage();
  }, [loadPaymentPage]);

  return {
    data,
    isLoading,
    error,
    refetch: loadPaymentPage,
  };
}

/**
 * Hook to update payment page
 */
export function useUpdatePaymentPage() {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: IPaymentPageFormData): Promise<IPaymentPage> => {
    setIsPending(true);
    setIsError(false);
    setError(null);

    try {
      const response = await updatePaymentPage(data);

      return {
        id: response.id,
        title: response.page_title,
        content: response.page_content,
        lastUpdated: response.updated_at,
        pageType: response.page_type,
      };
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Failed to update payment page');
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    mutate,
    mutateAsync: mutate,
    isPending,
    isError,
    error,
  };
}


