import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';

import axiosInstance, { endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

/**
 * Fetch public login page from API (no auth required)
 */
export async function fetchPublicLoginPage(): Promise<any> {
  const response = await axiosInstance.get(endpoints.pages.loginPage.public);
  // API returns { status: true, message: '', data: {...} }
  return response.data?.data || response.data;
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch public login page with loading state
 * Automatically refetches when language changes
 */
export function useGetPublicLoginPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use i18n to reactively detect language changes
  const { i18n } = useTranslation();

  const loadLoginPage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchPublicLoginPage();
      setData(response);
    } catch (err) {
      console.error('Failed to fetch public login page:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch login page');
      // Set default values on error
      setData({
        page_title: 'Hi, Welcome back',
        page_content: '<p>More effectively with optimized workflows.</p>',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLoginPage();
  }, [loadLoginPage, i18n.language]); // Refetch when language changes

  return {
    data,
    isLoading,
    error,
    refetch: loadLoginPage,
  };
}
