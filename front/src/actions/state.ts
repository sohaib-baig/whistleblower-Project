import type { IStateItem } from 'src/types/state';

import { useState, useEffect, useCallback } from 'react';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

export type StateApiResponse = {
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

export type StateFilters = {
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
| * Fetch states from API
| */
export async function fetchStates(filters?: StateFilters): Promise<any> {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.per_page) params.append('per_page', filters.per_page.toString());
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.sort) params.append('sort', filters.sort);
  if (filters?.order) params.append('order', filters.order);
  if (filters?.company_id) params.append('company_id', filters.company_id);

  const url = `${endpoints.states.list}?${params.toString()}`;
  const response = await sanctum.get(url);

  return { data: response.data };
}

/**
| * Fetch single state by ID
| */
export async function fetchState(id: string): Promise<any> {
  const url =
    typeof endpoints.states.details === 'function'
      ? endpoints.states.details(id)
      : endpoints.states.details;

  const response = await sanctum.get(url);
  return response.data;
}

/**
| * Create new state
| */
export async function createState(data: Partial<IStateItem>): Promise<any> {
  await initSanctumCsrf();
  const response = await sanctum.post(endpoints.states.create, data);
  return response.data;
}

/**
| * Update state
| */
export async function updateState(id: string, data: Partial<IStateItem>): Promise<any> {
  const url =
    typeof endpoints.states.update === 'function'
      ? endpoints.states.update(id)
      : endpoints.states.update;

  await initSanctumCsrf();
  const response = await sanctum.put(url, data);
  return response.data;
}

/**
| * Delete state
| */
export async function deleteState(id: string): Promise<void> {
  const url =
    typeof endpoints.states.delete === 'function'
      ? endpoints.states.delete(id)
      : endpoints.states.delete;

  await initSanctumCsrf();
  await sanctum.delete(url);
}

// ----------------------------------------------------------------------

/**
| * Hook to fetch states with loading state
| */
export function useGetStates(filters?: StateFilters) {
  const [states, setStates] = useState<IStateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 15,
    total: 0,
    lastPage: 1,
  });

  const filtersString = JSON.stringify(filters);

  const loadStates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const parsedFilters = filtersString ? JSON.parse(filtersString) : undefined;
      const response = await fetchStates(parsedFilters);

      const transformedData: IStateItem[] = response.data.data.map((state: any) => ({
        id: state.id,
        name: state.name,
        status: state.status || 'active',
        createdAt: state.created_at,
        isActive: state.status === 'active',
      }));

      setStates(transformedData);
      setPagination({
        currentPage: response.data.current_page,
        perPage: response.data.per_page,
        total: response.data.total,
        lastPage: response.data.last_page,
      });
    } catch (err) {
      console.error('Failed to fetch states:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch states');
      setStates([]);
    } finally {
      setLoading(false);
    }
  }, [filtersString]);

  useEffect(() => {
    loadStates();
  }, [loadStates]);

  return {
    states,
    loading,
    error,
    pagination,
    refetch: loadStates,
  };
}

/**
| * Hook to fetch single state
| */
export function useGetState(id: string) {
  const [state, setState] = useState<IStateItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadState() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchState(id);

        const transformedData: IStateItem = {
          id: data.id,
          name: data.name,
          status: data.status || 'active',
          createdAt: data.created_at,
          isActive: data.status === 'active',
        };

        setState(transformedData);
      } catch (err) {
        console.error('Failed to fetch state:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch state');
        setState(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadState();
    }
  }, [id]);

  return {
    state,
    loading,
    error,
  };
}
