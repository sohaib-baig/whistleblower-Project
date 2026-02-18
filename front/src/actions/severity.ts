import type { ISeverityItem } from 'src/types/severity';

import { useState, useEffect, useCallback } from 'react';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

export type SeverityApiResponse = {
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

export type SeverityFilters = {
  search?: string;
  status?: string;
  per_page?: number;
  page?: number;
  sort?: string;
  order?: string;
  company_id?: string;
};

// ----------------------------------------------------------------------

/**
| * Fetch severities from API
| */
export async function fetchSeverities(filters?: SeverityFilters): Promise<any> {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.per_page) params.append('per_page', filters.per_page.toString());
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.sort) params.append('sort', filters.sort);
  if (filters?.order) params.append('order', filters.order);
  if (filters?.company_id) params.append('company_id', filters.company_id);

  const url = `${endpoints.severities.list}?${params.toString()}`;
  const response = await sanctum.get(url);

  return { data: response.data };
}

/**
| * Fetch single severity by ID
| */
export async function fetchSeverity(id: string): Promise<any> {
  const url =
    typeof endpoints.severities.details === 'function'
      ? endpoints.severities.details(id)
      : endpoints.severities.details;

  const response = await sanctum.get(url);
  return response.data;
}

/**
| * Create new severity
| */
export async function createSeverity(data: Partial<ISeverityItem>): Promise<any> {
  await initSanctumCsrf();
  const response = await sanctum.post(endpoints.severities.create, data);
  return response.data;
}

/**
| * Update severity
| */
export async function updateSeverity(id: string, data: Partial<ISeverityItem>): Promise<any> {
  const url =
    typeof endpoints.severities.update === 'function'
      ? endpoints.severities.update(id)
      : endpoints.severities.update;

  await initSanctumCsrf();
  const response = await sanctum.put(url, data);
  return response.data;
}

/**
| * Delete severity
| */
export async function deleteSeverity(id: string): Promise<void> {
  const url =
    typeof endpoints.severities.delete === 'function'
      ? endpoints.severities.delete(id)
      : endpoints.severities.delete;

  await initSanctumCsrf();
  await sanctum.delete(url);
}

// ----------------------------------------------------------------------

/**
| * Hook to fetch severities with loading state
| */
export function useGetSeverities(filters?: SeverityFilters) {
  const [severities, setSeverities] = useState<ISeverityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 15,
    total: 0,
    lastPage: 1,
  });

  const filtersString = JSON.stringify(filters);

  const loadSeverities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const parsedFilters = filtersString ? JSON.parse(filtersString) : undefined;
      const response = await fetchSeverities(parsedFilters);

      const transformedData: ISeverityItem[] = response.data.data.map((severity: any) => ({
        id: severity.id,
        name: severity.name,
        status: severity.status || 'active',
        createdAt: severity.created_at,
        isActive: severity.status === 'active',
      }));

      setSeverities(transformedData);
      setPagination({
        currentPage: response.data.current_page,
        perPage: response.data.per_page,
        total: response.data.total,
        lastPage: response.data.last_page,
      });
    } catch (err) {
      console.error('Failed to fetch severities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch severities');
      setSeverities([]);
    } finally {
      setLoading(false);
    }
  }, [filtersString]);

  useEffect(() => {
    loadSeverities();
  }, [loadSeverities]);

  return {
    severities,
    loading,
    error,
    pagination,
    refetch: loadSeverities,
  };
}

/**
| * Hook to fetch single severity
| */
export function useGetSeverity(id: string) {
  const [severity, setSeverity] = useState<ISeverityItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSeverity() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchSeverity(id);

        const transformedData: ISeverityItem = {
          id: data.id,
          name: data.name,
          status: data.status || 'active',
          createdAt: data.created_at,
          isActive: data.status === 'active',
        };

        setSeverity(transformedData);
      } catch (err) {
        console.error('Failed to fetch severity:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch severity');
        setSeverity(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadSeverity();
    }
  }, [id]);

  return {
    severity,
    loading,
    error,
  };
}
