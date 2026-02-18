import type { IAboutUs, IAboutUsFormData } from 'src/types/about-us';

import { useState, useEffect, useCallback } from 'react';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

/**
 * Fetch about us from API
 */
export async function fetchAboutUs(): Promise<any> {
  const response = await sanctum.get(endpoints.pages.aboutUs.get);
  return response.data;
}

/**
 * Update about us
 */
export async function updateAboutUs(data: IAboutUsFormData): Promise<any> {
  await initSanctumCsrf();

  const payload = {
    page_title: data.title,
    page_content: data.content,
  };

  const response = await sanctum.put(endpoints.pages.aboutUs.update, payload);
  return response.data;
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch about us with loading state
 */
export function useGetAboutUs() {
  const [data, setData] = useState<IAboutUs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAboutUs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchAboutUs();

      const transformedData: IAboutUs = {
        id: response.id,
        title: response.page_title,
        content: response.page_content,
        lastUpdated: response.updated_at,
        pageType: response.page_type,
      };

      setData(transformedData);
    } catch (err) {
      console.error('Failed to fetch about us:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch about us');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAboutUs();
  }, [loadAboutUs]);

  return {
    data,
    isLoading,
    error,
    refetch: loadAboutUs,
  };
}

/**
 * Hook to update about us
 */
export function useUpdateAboutUs() {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: IAboutUsFormData): Promise<IAboutUs> => {
    setIsPending(true);
    setIsError(false);
    setError(null);

    try {
      const response = await updateAboutUs(data);

      return {
        id: response.id,
        title: response.page_title,
        content: response.page_content,
        lastUpdated: response.updated_at,
        pageType: response.page_type,
      };
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Failed to update about us');
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
