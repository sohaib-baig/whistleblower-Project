import type { INewsItem } from 'src/types/news';

import { useState, useEffect, useCallback } from 'react';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

export type NewsFormData = {
  title: string;
  content: string;
  cover_image?: string | null;
  status: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
};

/**
 * Fetch news list from API
 */
export async function fetchNewsList(params?: {
  status?: string;
  search?: string;
  per_page?: number;
  page?: number;
}): Promise<any> {
  const response = await sanctum.get(endpoints.news.list, { params });
  return response.data;
}

/**
 * Fetch single news by ID
 */
export async function fetchNews(id: string): Promise<any> {
  try {
    const url = endpoints.news.details(id);
    const response = await sanctum.get(url);
    return response.data;
  } catch (error: any) {
    console.error('Error in fetchNews:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
}

/**
 * Create new news
 */
export async function createNews(data: NewsFormData): Promise<any> {
  await initSanctumCsrf();

  // Transform camelCase to snake_case for backend
  const payload = {
    title: data.title,
    content: data.content,
    cover_image: data.cover_image,
    status: data.status,
    meta_title: data.meta_title,
    meta_description: data.meta_description,
    meta_keywords: data.meta_keywords,
  };

  const response = await sanctum.post(endpoints.news.create, payload);
  return response.data;
}

/**
 * Update news
 */
export async function updateNews(id: string, data: Partial<NewsFormData>): Promise<any> {
  const url =
    typeof endpoints.news.update === 'function' ? endpoints.news.update(id) : endpoints.news.update;

  await initSanctumCsrf();

  // Transform camelCase to snake_case for backend
  const payload: any = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.content !== undefined) payload.content = data.content;
  if (data.cover_image !== undefined) payload.cover_image = data.cover_image;
  if (data.status !== undefined) payload.status = data.status;
  if (data.meta_title !== undefined) payload.meta_title = data.meta_title;
  if (data.meta_description !== undefined) payload.meta_description = data.meta_description;
  if (data.meta_keywords !== undefined) payload.meta_keywords = data.meta_keywords;

  const response = await sanctum.put(url, payload);
  return response.data;
}

/**
 * Delete news
 */
export async function deleteNews(id: string): Promise<void> {
  const url =
    typeof endpoints.news.delete === 'function' ? endpoints.news.delete(id) : endpoints.news.delete;

  await initSanctumCsrf();
  await sanctum.delete(url);
}

/**
 * Upload cover image for news
 */
export async function uploadNewsCover(id: string, file: File): Promise<any> {
  await initSanctumCsrf();

  const formData = new FormData();
  formData.append('cover', file);

  const url = endpoints.news.uploadCover(id);
  const response = await sanctum.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch news list with loading state
 */
export function useGetNews(filters?: { status?: string; search?: string }) {
  const [news, setNews] = useState<INewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchNewsList(filters);

      // Handle paginated response
      const newsData = response.data || response;
      const newsList = Array.isArray(newsData) ? newsData : newsData.data || [];


      // Transform backend data to match frontend INewsItem type
      const transformedData: INewsItem[] = newsList.map((newsItem: any) => {
        const metaKeywordsArray = newsItem.meta_keywords
          ? newsItem.meta_keywords.split(',').map((k: string) => k.trim())
          : [];
        const coverImageUrl =
          newsItem.cover_url ||
          (newsItem.cover_image ? `http://127.0.0.1:8082/storage/${newsItem.cover_image}` : '');

        // Strip HTML tags from content to create plain text description
        const plainTextContent = newsItem.content?.replace(/<[^>]*>/g, '').trim() || '';
        const description = plainTextContent.substring(0, 200);

        return {
          id: newsItem.id.toString(),
          title: newsItem.title,
          content: newsItem.content,
          description,
          coverUrl: coverImageUrl,
          publish: newsItem.status,
          metaTitle: newsItem.meta_title || '',
          metaDescription: newsItem.meta_description || '',
          metaKeywords: metaKeywordsArray,
          tags: metaKeywordsArray, // Use same as metaKeywords for now
          totalViews: newsItem.total_views || 0,
          totalShares: 0,
          totalComments: 0,
          totalFavorites: 0,
          favoritePerson: [],
          comments: [],
          author: {
            id: newsItem.user?.id ? newsItem.user.id.toString() : undefined,
            name: newsItem.user?.name || 'Unknown',
            avatarUrl: newsItem.user?.avatar_url || '',
          },
          createdAt: newsItem.created_at,
        };
      });

      setNews(transformedData);
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  return {
    news,
    loading,
    error,
    refetch: loadNews,
  };
}

/**
 * Hook to fetch single news
 */
export function useGetNewsItem(id: string) {
  const [news, setNews] = useState<INewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNews() {
      // Don't fetch if no ID
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await fetchNews(id);

        // Check if data is valid
        if (!data) {
          console.error('❌ Data is null or undefined');
          throw new Error('No data returned from API');
        }

        if (!data.id) {
          console.error('❌ Data has no ID:', data);
          throw new Error('Invalid news data - missing ID');
        }


        // Transform backend data to match frontend INewsItem type
        const metaKeywordsArray = data.meta_keywords
          ? data.meta_keywords.split(',').map((k: string) => k.trim())
          : [];
        const coverImageUrl =
          data.cover_url ||
          (data.cover_image ? `http://127.0.0.1:8082/storage/${data.cover_image}` : '');

        // Strip HTML tags from content to create plain text description
        const plainTextContent = data.content?.replace(/<[^>]*>/g, '').trim() || '';
        const description = plainTextContent.substring(0, 200);


        const transformedData: INewsItem = {
          id: data.id.toString(),
          title: data.title,
          content: data.content,
          description,
          coverUrl: coverImageUrl,
          publish: data.status,
          metaTitle: data.meta_title || '',
          metaDescription: data.meta_description || '',
          metaKeywords: metaKeywordsArray,
          tags: metaKeywordsArray, // Use same as metaKeywords for now
          totalViews: data.total_views || 0,
          totalShares: 0,
          totalComments: 0,
          totalFavorites: 0,
          favoritePerson: [],
          comments: [],
          author: {
            id: data.user?.id ? data.user.id.toString() : undefined,
            name: data.user?.name || 'Unknown',
            avatarUrl: data.user?.avatar_url || '',
          },
          createdAt: data.created_at,
        };

        setNews(transformedData);
      } catch (err: any) {
        console.error('Failed to fetch news:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response,
          status: err.response?.status,
          data: err.response?.data,
        });
        const errorMessage = err.message || 'Failed to fetch news';
        console.error('Final error message:', errorMessage);
        setError(errorMessage);
        setNews(null);
      } finally {
        setLoading(false);
      }
    }

    loadNews();
  }, [id]);

  return {
    news,
    loading,
    error,
  };
}
