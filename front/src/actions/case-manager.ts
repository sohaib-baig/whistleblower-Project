import type { ICaseManagerItem } from 'src/types/case-manager';

import { useState, useEffect, useCallback } from 'react';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

export type CaseManagerApiResponse = {
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

export type CaseManagerFilters = {
  search?: string;
  status?: string;
  per_page?: number;
  page?: number;
  sort?: string;
  order?: string;
};

// ----------------------------------------------------------------------

/**
 * Fetch case managers from API
 */
export async function fetchCaseManagers(filters?: CaseManagerFilters): Promise<any> {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.per_page) params.append('per_page', filters.per_page.toString());
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.sort) params.append('sort', filters.sort);
  if (filters?.order) params.append('order', filters.order);

  const url = `${endpoints.caseManagers.list}?${params.toString()}`;
  // sanctum interceptor unwraps { status, message, data } → data
  const response = await sanctum.get(url);

  return { data: response.data }; // Wrap it back for compatibility
}

/**
 * Fetch single case manager by ID
 */
export async function fetchCaseManager(id: string): Promise<any> {
  const url =
    typeof endpoints.caseManagers.details === 'function'
      ? endpoints.caseManagers.details(id)
      : endpoints.caseManagers.details;

  // sanctum interceptor unwraps { status, message, data } → data
  const response = await sanctum.get(url);
  return response.data; // Already unwrapped by interceptor
}

/**
 * Create new case manager
 */
export async function createCaseManager(data: Partial<ICaseManagerItem>): Promise<any> {
  await initSanctumCsrf(); // Initialize CSRF token before POST
  // sanctum interceptor unwraps { status, message, data } → data
  const response = await sanctum.post(endpoints.caseManagers.create, data);
  return response.data; // Already unwrapped by interceptor
}

/**
 * Update case manager
 */
export async function updateCaseManager(id: string, data: Partial<ICaseManagerItem>): Promise<any> {
  const url =
    typeof endpoints.caseManagers.update === 'function'
      ? endpoints.caseManagers.update(id)
      : endpoints.caseManagers.update;

  await initSanctumCsrf(); // Initialize CSRF token before PUT
  // sanctum interceptor unwraps { status, message, data } → data
  const response = await sanctum.put(url, data);
  return response.data; // Already unwrapped by interceptor
}

/**
 * Delete case manager
 */
export async function deleteCaseManager(id: string): Promise<void> {
  const url =
    typeof endpoints.caseManagers.delete === 'function'
      ? endpoints.caseManagers.delete(id)
      : endpoints.caseManagers.delete;

  await initSanctumCsrf(); // Initialize CSRF token before DELETE
  await sanctum.delete(url);
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch case managers with loading state
 */
export function useGetCaseManagers(filters?: CaseManagerFilters) {
  const [caseManagers, setCaseManagers] = useState<ICaseManagerItem[]>([]);
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

  const loadCaseManagers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const parsedFilters = filtersString ? JSON.parse(filtersString) : undefined;
      const response = await fetchCaseManagers(parsedFilters);

      // Transform backend data to match frontend ICaseManagerItem type
      const transformedData: ICaseManagerItem[] = response.data.data.map((manager: any) => ({
        id: manager.id,
        name: manager.name,
        email: manager.email,
        phone: manager.phone || '',
        status:
          manager.is_active === 1
            ? 'active'
            : manager.is_active === 2
              ? 'pending'
              : manager.is_active === 0
                ? 'banned'
                : 'banned',
        isVerified: !!manager.email_verified_at,
        isActive: manager.is_active === 1,
        createdAt: manager.created_at,
        updatedAt: manager.updated_at,
      }));

      setCaseManagers(transformedData);
      setPagination({
        currentPage: response.data.current_page,
        perPage: response.data.per_page,
        total: response.data.total,
        lastPage: response.data.last_page,
      });
    } catch (err) {
      console.error('Failed to fetch case managers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch case managers');
      setCaseManagers([]);
    } finally {
      setLoading(false);
    }
  }, [filtersString]);

  useEffect(() => {
    loadCaseManagers();
  }, [loadCaseManagers]);

  return {
    caseManagers,
    loading,
    error,
    pagination,
    refetch: loadCaseManagers,
  };
}

/**
 * Hook to fetch single case manager
 */
export function useGetCaseManager(id: string) {
  const [caseManager, setCaseManager] = useState<ICaseManagerItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCaseManager() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchCaseManager(id);

        // Transform backend data to match frontend ICaseManagerItem type
        const transformedData: ICaseManagerItem = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          status:
            data.is_active === 1
              ? 'active'
              : data.is_active === 2
                ? 'pending'
                : data.is_active === 0
                  ? 'banned'
                  : 'banned',
          isVerified: !!data.email_verified_at,
          isActive: data.is_active === 1,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        setCaseManager(transformedData);
      } catch (err) {
        console.error('Failed to fetch case manager:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch case manager');
        setCaseManager(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadCaseManager();
    }
  }, [id]);

  return {
    caseManager,
    loading,
    error,
  };
}
