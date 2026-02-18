import type { ILoginPage, ILoginPageFormData } from 'src/types/login-page';

import { useState, useEffect, useCallback } from 'react';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

/**
 * Fetch login page from API
 */
export async function fetchLoginPage(): Promise<any> {
  const response = await sanctum.get(endpoints.pages.loginPage.get);
  return response.data;
}

/**
 * Update login page
 */
export async function updateLoginPage(data: ILoginPageFormData): Promise<any> {
  await initSanctumCsrf();

  // Allow empty title - send empty string or null
  const title = data.title?.trim() || null;

  const payload = {
    page_title: title,
    page_content: data.content,
  };

  const response = await sanctum.put(endpoints.pages.loginPage.update, payload);
  return response.data;
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch login page with loading state
 */
export function useGetLoginPage() {
  const [data, setData] = useState<ILoginPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLoginPage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchLoginPage();

      // Handle both existing pages and default values when page doesn't exist
      const transformedData: ILoginPage = {
        id: response.id || null,
        title: response.page_title?.trim() || '',
        content: response.page_content || '<p>More effectively with optimized workflows.</p>',
        lastUpdated: response.updated_at || null,
        pageType: response.page_type || 'login',
      };

      setData(transformedData);
    } catch (err: any) {
      console.error('Failed to fetch login page:', err);
      
      // Provide more detailed error information for debugging
      const errorMessage = err?.message || err?.response?.data?.message || 'Failed to fetch login page';
      const httpStatus = err?.httpStatus || err?.response?.status;
      
      console.error('Login page fetch error details:', {
        message: errorMessage,
        status: httpStatus,
        url: endpoints.pages.loginPage.get,
        error: err,
      });
      
      setError(errorMessage);
      
      // Set default values on error so the page can still be displayed/edited
      setData({
        id: null,
        title: '',
        content: '<p>More effectively with optimized workflows.</p>',
        lastUpdated: null,
        pageType: 'login',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLoginPage();
  }, [loadLoginPage]);

  return {
    data,
    isLoading,
    error,
    refetch: loadLoginPage,
  };
}

/**
 * Hook to update login page
 */
export function useUpdateLoginPage() {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: ILoginPageFormData): Promise<ILoginPage> => {
    setIsPending(true);
    setIsError(false);
    setError(null);

    try {
      const response = await updateLoginPage(data);

      return {
        id: response.id,
        title: response.page_title,
        content: response.page_content,
        lastUpdated: response.updated_at,
        pageType: response.page_type,
      };
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Failed to update login page');
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
