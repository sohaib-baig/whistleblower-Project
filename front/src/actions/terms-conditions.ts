import type { ITermsConditions, ITermsConditionsFormData } from 'src/types/terms-conditions';

import { useState, useEffect, useCallback } from 'react';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

/**
 * Fetch terms & conditions from API
 */
export async function fetchTermsConditions(language: string = 'en'): Promise<any> {
  const response = await sanctum.get(endpoints.pages.termsConditions.get, {
    params: { language },
  });
  return response.data;
}

/**
 * Update terms & conditions
 */
export async function updateTermsConditions(data: ITermsConditionsFormData): Promise<any> {
  await initSanctumCsrf();

  const payload: any = {
    page_title: data.title,
    page_content: data.content,
  };

  if (data.status) {
    payload.status = data.status;
  }

  if (data.language) {
    payload.language = data.language;
  }

  const response = await sanctum.put(endpoints.pages.termsConditions.update, payload);
  return response.data;
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch terms & conditions with loading state
 */
export function useGetTermsConditions(language: string = 'en') {
  const [data, setData] = useState<ITermsConditions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTermsConditions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchTermsConditions(language);

      const transformedData: ITermsConditions = {
        id: response.id,
        title: response.page_title,
        content: response.page_content,
        lastUpdated: response.updated_at,
        pageType: response.page_type,
        status: response.status || 'active',
        language: response.language || language,
      };

      setData(transformedData);
    } catch (err) {
      console.error('Failed to fetch terms & conditions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch terms & conditions');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadTermsConditions();
  }, [loadTermsConditions]);

  return {
    data,
    isLoading,
    error,
    refetch: loadTermsConditions,
  };
}

/**
 * Hook to update terms & conditions
 */
export function useUpdateTermsConditions() {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: ITermsConditionsFormData): Promise<ITermsConditions> => {
    setIsPending(true);
    setIsError(false);
    setError(null);

    try {
      const response = await updateTermsConditions(data);

      return {
        id: response.id,
        title: response.page_title,
        content: response.page_content,
        lastUpdated: response.updated_at,
        pageType: response.page_type,
        status: response.status || 'active',
        language: response.language || data.language || 'en',
      };
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Failed to update terms & conditions');
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
