import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

/**
 * Fetch public payment page from API (no auth required)
 */
export async function fetchPublicPaymentPage(): Promise<any> {
  const response = await axiosInstance.get(endpoints.pages.paymentPage.public);
  // API returns { status: true, message: '', data: {...} }
  return response.data?.data || response.data;
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch public payment page with loading state
 * Automatically refetches when language changes
 */
export function useGetPublicPaymentPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use i18n to reactively detect language changes
  const { i18n } = useTranslation();

  const loadPaymentPage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchPublicPaymentPage();
      setData(response);
    } catch (err) {
      console.error('Failed to fetch public payment page:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payment page');
      // Set default values on error
      setData({
        page_title: 'Payment Information',
        page_content: '<p>Manage your payment information and billing details.</p>',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentPage();
  }, [loadPaymentPage, i18n.language]); // Refetch when language changes

  return {
    data,
    isLoading,
    error,
    refetch: loadPaymentPage,
  };
}


