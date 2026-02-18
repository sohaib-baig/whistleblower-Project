import type { IPolicyPage, IPolicyPageFormData } from 'src/types/policy-page';

import { useState, useEffect, useCallback } from 'react';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

/**
 * Fetch policy page from API
 */
export async function fetchPolicyPage(): Promise<any> {
  const response = await sanctum.get(endpoints.pages.policyPage.get);
  return response.data;
}

/**
 * Update policy page
 */
export async function updatePolicyPage(data: IPolicyPageFormData): Promise<any> {
  await initSanctumCsrf();

  // Allow empty title - send empty string or null
  const title = data.title?.trim() || null;

  const payload = {
    page_title: title,
    page_content: data.content,
  };

  const response = await sanctum.put(endpoints.pages.policyPage.update, payload);
  return response.data;
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch policy page with loading state
 */
export function useGetPolicyPage() {
  const [data, setData] = useState<IPolicyPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPolicyPage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchPolicyPage();

      // Handle both existing pages and default values when page doesn't exist
      const transformedData: IPolicyPage = {
        id: response.id || null,
        title: response.page_title?.trim() || '',
        content: response.page_content || '<p>Company policy content goes here.</p>',
        lastUpdated: response.updated_at || null,
        pageType: response.page_type || 'company_policy',
      };

      setData(transformedData);
    } catch (err: any) {
      console.error('Failed to fetch policy page:', err);
      
      // Provide more detailed error information for debugging
      const errorMessage = err?.message || err?.response?.data?.message || 'Failed to fetch policy page';
      const httpStatus = err?.httpStatus || err?.response?.status;
      
      console.error('Policy page fetch error details:', {
        message: errorMessage,
        status: httpStatus,
        url: endpoints.pages.policyPage.get,
        error: err,
      });
      
      setError(errorMessage);
      
      // Set default values on error so the page can still be displayed/edited
      setData({
        id: null,
        title: '',
        content: '<p>Company policy content goes here.</p>',
        lastUpdated: null,
        pageType: 'company_policy',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPolicyPage();
  }, [loadPolicyPage]);

  return {
    data,
    isLoading,
    error,
    refetch: loadPolicyPage,
  };
}

/**
 * Hook to update policy page
 */
export function useUpdatePolicyPage() {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: IPolicyPageFormData): Promise<IPolicyPage> => {
    setIsPending(true);
    setIsError(false);
    setError(null);

    try {
      const response = await updatePolicyPage(data);

      return {
        id: response.id,
        title: response.page_title,
        content: response.page_content,
        lastUpdated: response.updated_at,
        pageType: response.page_type || 'company_policy',
      };
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Failed to update policy page');
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

