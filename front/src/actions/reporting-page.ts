import type { IReportingPage, IReportingPageFormData } from 'src/types/reporting-page';

import { useState, useEffect, useCallback } from 'react';

import { endpoints } from 'src/lib/axios';
import { CONFIG } from 'src/global-config';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

/**
 * Transform relative image URLs in HTML content to absolute URLs
 * (for display in the editor)
 */
function transformImageUrls(html: string): string {
  if (!html || !CONFIG.serverUrl) {
    return html;
  }
  
  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img[src]');
  
  images.forEach((img) => {
    const src = img.getAttribute('src');
    
    if (src) {
      // If src is a base64 data URI, keep it as is (no transformation needed)
      if (src.startsWith('data:')) {
        // Keep as is
      }
      // If src is a relative URL (starts with /) and not already absolute, make it absolute
      else if (src.startsWith('/') && !src.startsWith('//') && !src.startsWith('http')) {
        const absoluteUrl = `${CONFIG.serverUrl}${src}`;
        img.setAttribute('src', absoluteUrl);
      }
      // Already absolute or unknown format - keep as is
    }
  });
  
  const transformedHtml = doc.body.innerHTML;
  
  return transformedHtml;
}

/**
 * Transform absolute image URLs back to relative URLs
 * (for saving to backend - keeps storage paths relative)
 */
function transformImageUrlsToRelative(html: string): string {
  if (!html || !CONFIG.serverUrl) return html;
  
  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img[src]');
  
  images.forEach((img) => {
    const src = img.getAttribute('src');
    if (src && src.startsWith(CONFIG.serverUrl)) {
      // Convert absolute URL back to relative path
      const relativePath = src.replace(CONFIG.serverUrl, '');
      img.setAttribute('src', relativePath);
    }
  });
  
  return doc.body.innerHTML;
}

/**
 * Fetch reporting page from API
 */
export async function fetchReportingPage(language: string = 'en'): Promise<any> {
  const response = await sanctum.get(endpoints.pages.reportingPage.get, {
    params: { language },
  });
  return response.data;
}

/**
 * Update reporting page
 */
export async function updateReportingPage(data: IReportingPageFormData): Promise<any> {
  await initSanctumCsrf();

  // Transform absolute image URLs back to relative URLs before saving
  const transformedContent = transformImageUrlsToRelative(data.content);

  const payload: any = {
    page_title: data.title,
    page_content: transformedContent,
  };

  if (data.language) {
    payload.language = data.language;
  }

  const response = await sanctum.put(endpoints.pages.reportingPage.update, payload);
  return response.data;
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch reporting page with loading state
 */
export function useGetReportingPage(language: string = 'en') {
  const [data, setData] = useState<IReportingPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReportingPage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchReportingPage(language);

      // Transform image URLs in content from relative to absolute
      const transformedContent = transformImageUrls(response.page_content || '');

      const transformedData: IReportingPage = {
        id: response.id || '',
        title: response.page_title || '',
        content: transformedContent,
        lastUpdated: response.updated_at || '',
        pageType: response.page_type || 'reporting_page',
        language: response.language || language,
      };

      setData(transformedData);
    } catch (err) {
      console.error('Failed to fetch reporting page:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reporting page');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    loadReportingPage();
  }, [loadReportingPage]);

  return {
    data,
    isLoading,
    error,
    refetch: loadReportingPage,
  };
}

/**
 * Hook to update reporting page
 */
export function useUpdateReportingPage() {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: IReportingPageFormData): Promise<IReportingPage> => {
    setIsPending(true);
    setIsError(false);
    setError(null);

    try {
      const response = await updateReportingPage(data);

      return {
        id: response.id,
        title: response.page_title,
        content: response.page_content,
        lastUpdated: response.updated_at,
        pageType: response.page_type,
        language: response.language || data.language || 'en',
      };
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Failed to update reporting page');
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
