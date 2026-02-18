import type { ICategoryItem } from 'src/types/category';

import { useState, useEffect, useCallback } from 'react';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

export type CategoryApiResponse = {
  status: boolean;
  message: string;
  data: {
    data: any[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type CategoryFilters = {
  search?: string;
  status?: string;
  per_page?: number;
  page?: number;
  sort?: string;
  order?: string;
};

// ----------------------------------------------------------------------

/**
 * Fetch categories from API
 */
export async function fetchCategories(filters?: CategoryFilters): Promise<any> {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.per_page) params.append('per_page', filters.per_page.toString());
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.sort) params.append('sort', filters.sort);
  if (filters?.order) params.append('order', filters.order);

  const url = `${endpoints.categories.list}?${params.toString()}`;
  // sanctum interceptor unwraps { status, message, data } → data
  const response = await sanctum.get(url);

  return { data: response.data }; // Wrap it back for compatibility
}

/**
 * Fetch single category by ID
 */
export async function fetchCategory(id: string): Promise<any> {
  const url =
    typeof endpoints.categories.details === 'function'
      ? endpoints.categories.details(id)
      : endpoints.categories.details;

  // sanctum interceptor unwraps { status, message, data } → data
  const response = await sanctum.get(url);
  return response.data; // Already unwrapped by interceptor
}

/**
 * Create new category
 */
export async function createCategory(data: Partial<ICategoryItem>): Promise<any> {
  await initSanctumCsrf(); // Initialize CSRF token before POST
  // sanctum interceptor unwraps { status, message, data } → data
  const response = await sanctum.post(endpoints.categories.create, data);
  return response.data; // Already unwrapped by interceptor
}

/**
 * Update category
 */
export async function updateCategory(id: string, data: Partial<ICategoryItem>): Promise<any> {
  const url =
    typeof endpoints.categories.update === 'function'
      ? endpoints.categories.update(id)
      : endpoints.categories.update;

  await initSanctumCsrf(); // Initialize CSRF token before PUT
  // sanctum interceptor unwraps { status, message, data } → data
  const response = await sanctum.put(url, data);
  return response.data; // Already unwrapped by interceptor
}

/**
 * Delete category
 */
export async function deleteCategory(id: string): Promise<void> {
  const url =
    typeof endpoints.categories.delete === 'function'
      ? endpoints.categories.delete(id)
      : endpoints.categories.delete;

  await initSanctumCsrf(); // Initialize CSRF token before DELETE
  await sanctum.delete(url);
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch categories with loading state
 */
export function useGetCategories(filters?: CategoryFilters) {
  const [categories, setCategories] = useState<ICategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 15,
    total: 0,
    lastPage: 1,
  });

  // Serialize filters to avoid infinite loop
  const filtersString = JSON.stringify(filters);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const parsedFilters = filtersString ? JSON.parse(filtersString) : undefined;
      const response = await fetchCategories(parsedFilters);

      // Transform backend data to match frontend ICategoryItem type
      const transformedData: ICategoryItem[] = response.data.data.map((category: any) => ({
        id: category.id,
        name: category.name,
        status: category.status || 'active',
        createdAt: category.created_at,
        isActive: category.status === 'active',
      }));

      setCategories(transformedData);
      setPagination({
        currentPage: response.data.current_page,
        perPage: response.data.per_page,
        total: response.data.total,
        lastPage: response.data.last_page,
      });
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [filtersString]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    pagination,
    refetch: loadCategories,
  };
}

/**
 * Hook to fetch single category
 */
export function useGetCategory(id: string) {
  const [category, setCategory] = useState<ICategoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategory() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchCategory(id);

        // Transform backend data to match frontend ICategoryItem type
        const transformedData: ICategoryItem = {
          id: data.id,
          name: data.name,
          status: data.status || 'active',
          createdAt: data.created_at,
          isActive: data.status === 'active',
        };

        setCategory(transformedData);
      } catch (err) {
        console.error('Failed to fetch category:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch category');
        setCategory(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadCategory();
    }
  }, [id]);

  return {
    category,
    loading,
    error,
  };
}
