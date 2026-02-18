import type { IDepartmentItem } from 'src/types/department';

import { useState, useEffect, useCallback } from 'react';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

export type DepartmentApiResponse = {
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

export type DepartmentFilters = {
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
| * Fetch departments from API
| */
export async function fetchDepartments(filters?: DepartmentFilters): Promise<any> {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.per_page) params.append('per_page', filters.per_page.toString());
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.sort) params.append('sort', filters.sort);
  if (filters?.order) params.append('order', filters.order);
  if (filters?.company_id) params.append('company_id', filters.company_id);

  const url = `${endpoints.departments.list}?${params.toString()}`;
  // sanctum interceptor unwraps { status, message, data } → data
  const response = await sanctum.get(url);

  return { data: response.data }; // Wrap it back for compatibility
}

/**
| * Fetch single department by ID
| */
export async function fetchDepartment(id: string): Promise<any> {
  const url =
    typeof endpoints.departments.details === 'function'
      ? endpoints.departments.details(id)
      : endpoints.departments.details;

  // sanctum interceptor unwraps { status, message, data } → data
  const response = await sanctum.get(url);
  return response.data; // Already unwrapped by interceptor
}

/**
| * Create new department
| */
export async function createDepartment(data: Partial<IDepartmentItem>): Promise<any> {
  await initSanctumCsrf(); // Initialize CSRF token before POST
  // sanctum interceptor unwraps { status, message, data } → data
  const response = await sanctum.post(endpoints.departments.create, data);
  return response.data; // Already unwrapped by interceptor
}

/**
| * Update department
| */
export async function updateDepartment(id: string, data: Partial<IDepartmentItem>): Promise<any> {
  const url =
    typeof endpoints.departments.update === 'function'
      ? endpoints.departments.update(id)
      : endpoints.departments.update;

  await initSanctumCsrf(); // Initialize CSRF token before PUT
  // sanctum interceptor unwraps { status, message, data } → data
  const response = await sanctum.put(url, data);
  return response.data; // Already unwrapped by interceptor
}

/**
| * Delete department
| */
export async function deleteDepartment(id: string): Promise<void> {
  const url =
    typeof endpoints.departments.delete === 'function'
      ? endpoints.departments.delete(id)
      : endpoints.departments.delete;

  await initSanctumCsrf(); // Initialize CSRF token before DELETE
  await sanctum.delete(url);
}

// ----------------------------------------------------------------------

/**
| * Hook to fetch departments with loading state
| */
export function useGetDepartments(filters?: DepartmentFilters) {
  const [departments, setDepartments] = useState<IDepartmentItem[]>([]);
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

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const parsedFilters = filtersString ? JSON.parse(filtersString) : undefined;
      const response = await fetchDepartments(parsedFilters);

      // Transform backend data to match frontend IDepartmentItem type
      const transformedData: IDepartmentItem[] = response.data.data.map((department: any) => ({
        id: department.id,
        name: department.name,
        status: department.status || 'active',
        createdAt: department.created_at,
        isActive: department.status === 'active',
      }));

      setDepartments(transformedData);
      setPagination({
        currentPage: response.data.current_page,
        perPage: response.data.per_page,
        total: response.data.total,
        lastPage: response.data.last_page,
      });
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch departments');
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [filtersString]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  return {
    departments,
    loading,
    error,
    pagination,
    refetch: loadDepartments,
  };
}

/**
| * Hook to fetch single department
| */
export function useGetDepartment(id: string) {
  const [department, setDepartment] = useState<IDepartmentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDepartment() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchDepartment(id);

        // Transform backend data to match frontend IDepartmentItem type
        const transformedData: IDepartmentItem = {
          id: data.id,
          name: data.name,
          status: data.status || 'active',
          createdAt: data.created_at,
          isActive: data.status === 'active',
        };

        setDepartment(transformedData);
      } catch (err) {
        console.error('Failed to fetch department:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch department');
        setDepartment(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadDepartment();
    }
  }, [id]);

  return {
    department,
    loading,
    error,
  };
}
