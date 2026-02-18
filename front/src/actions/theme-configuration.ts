import { useState, useEffect, useCallback } from 'react';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

export interface ThemeConfigData {
  id: string;
  user_id: string;
  mode: boolean;
  contrast: boolean;
  right_left: boolean;
  compact: boolean;
  color_setting: string;
  navigation_type: number;
  navigation_color: boolean;
  typography: string;
  font_size: string;
  created_at: string;
  updated_at: string;
}

export interface ThemeConfigUpdateData {
  mode?: boolean;
  contrast?: boolean;
  right_left?: boolean;
  compact?: boolean;
  color_setting?: string;
  navigation_type?: number;
  navigation_color?: boolean;
  typography?: string;
  font_size?: string;
}

// ----------------------------------------------------------------------

/**
 * Fetch theme configuration from API
 */
export async function fetchThemeConfiguration(): Promise<ThemeConfigData> {
  const response = await sanctum.get(endpoints.themeConfiguration.get);
  return response.data;
}

/**
 * Update theme configuration
 */
export async function updateThemeConfiguration(
  data: ThemeConfigUpdateData
): Promise<ThemeConfigData> {
  await initSanctumCsrf();
  const response = await sanctum.put(endpoints.themeConfiguration.update, data);
  return response.data;
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch theme configuration with loading state
 */
export function useGetThemeConfiguration() {
  const [config, setConfig] = useState<ThemeConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchThemeConfiguration();
      setConfig(data);
    } catch (err) {
      console.error('Failed to fetch theme configuration:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch theme configuration');
      setConfig(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    config,
    isLoading,
    error,
    refetch: loadConfig,
  };
}

/**
 * Hook to update theme configuration
 */
export function useUpdateThemeConfiguration() {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: ThemeConfigUpdateData): Promise<ThemeConfigData> => {
    setIsPending(true);
    setIsError(false);
    setError(null);

    try {
      const response = await updateThemeConfiguration(data);
      return response;
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Failed to update theme configuration');
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
