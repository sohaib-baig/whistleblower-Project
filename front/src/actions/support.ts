import type { ISupport, ISupportFormData } from 'src/types/support';

import { useState, useEffect, useCallback } from 'react';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

/**
 * Fetch support page from API
 */
export async function fetchSupport(language: string = 'en'): Promise<any> {
  const response = await sanctum.get(endpoints.pages.support.get, {
    params: { language },
  });
  return response.data;
}

/**
 * Update support page
 */
export async function updateSupport(data: ISupportFormData): Promise<any> {
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

  const response = await sanctum.put(endpoints.pages.support.update, payload);
  return response.data;
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch support page with loading state
 */
export function useGetSupport(language: string = 'en') {
  const [data, setData] = useState<ISupport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSupport = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchSupport(language);

      const transformedData: ISupport = {
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
      console.error('Failed to fetch support page:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch support page');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadSupport();
  }, [loadSupport]);

  return {
    data,
    isLoading,
    error,
    refetch: loadSupport,
  };
}

/**
 * Hook to update support page
 */
export function useUpdateSupport() {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: ISupportFormData): Promise<ISupport> => {
    setIsPending(true);
    setIsError(false);
    setError(null);

    try {
      const response = await updateSupport(data);

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
      setError(err instanceof Error ? err.message : 'Failed to update support page');
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
