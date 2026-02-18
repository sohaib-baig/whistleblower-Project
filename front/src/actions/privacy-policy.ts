import type { IPrivacyPolicy, IPrivacyPolicyFormData } from 'src/types/privacy-policy';

import { useState, useEffect, useCallback } from 'react';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

/**
 * Fetch privacy policy from API
 */
export async function fetchPrivacyPolicy(language: string = 'en'): Promise<any> {
  const response = await sanctum.get(endpoints.pages.privacyPolicy.get, {
    params: { language },
  });
  return response.data;
}

/**
 * Update privacy policy
 */
export async function updatePrivacyPolicy(data: IPrivacyPolicyFormData): Promise<any> {
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

  const response = await sanctum.put(endpoints.pages.privacyPolicy.update, payload);
  return response.data;
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch privacy policy with loading state
 */
export function useGetPrivacyPolicy(language: string = 'en') {
  const [data, setData] = useState<IPrivacyPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrivacyPolicy = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchPrivacyPolicy(language);

      const transformedData: IPrivacyPolicy = {
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
      console.error('Failed to fetch privacy policy:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch privacy policy');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadPrivacyPolicy();
  }, [loadPrivacyPolicy]);

  return {
    data,
    isLoading,
    error,
    refetch: loadPrivacyPolicy,
  };
}

/**
 * Hook to update privacy policy
 */
export function useUpdatePrivacyPolicy() {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: IPrivacyPolicyFormData): Promise<IPrivacyPolicy> => {
    setIsPending(true);
    setIsError(false);
    setError(null);

    try {
      const response = await updatePrivacyPolicy(data);

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
      setError(err instanceof Error ? err.message : 'Failed to update privacy policy');
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
