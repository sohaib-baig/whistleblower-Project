import type { ICompanyItem } from 'src/types/company';

import { useState, useEffect, useCallback } from 'react';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

export type CompanyApiResponse = {
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

export type CompanyFilters = {
  search?: string;
  status?: string;
  per_page?: number;
  page?: number;
  sort?: string;
  order?: string;
};

// ----------------------------------------------------------------------

/**
 * Fetch companies from API
 */
export async function fetchCompanies(filters?: CompanyFilters): Promise<any> {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.per_page) params.append('per_page', filters.per_page.toString());
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.sort) params.append('sort', filters.sort);
  if (filters?.order) params.append('order', filters.order);

  const url = `${endpoints.companies.list}?${params.toString()}`;
  // sanctum interceptor unwraps { status, message, data } → data
  const response = await sanctum.get(url);

  return { data: response.data }; // Wrap it back for compatibility
}

/**
 * Fetch single company by ID
 */
export async function fetchCompany(id: string): Promise<any> {
  const url =
    typeof endpoints.companies.details === 'function'
      ? endpoints.companies.details(id)
      : endpoints.companies.details;

  // sanctum interceptor unwraps { status, message, data } → data
  const response = await sanctum.get(url);
  return response.data; // Already unwrapped by interceptor
}

/**
 * Create new company
 */
export async function createCompany(data: Partial<ICompanyItem>): Promise<any> {
  await initSanctumCsrf(); // Initialize CSRF token before POST
  // sanctum interceptor unwraps { status, message, data } → data
  const response = await sanctum.post(endpoints.companies.create, data);
  return response.data; // Already unwrapped by interceptor
}

/**
 * Update company
 */
export async function updateCompany(id: string, data: Partial<ICompanyItem>): Promise<any> {
  const url =
    typeof endpoints.companies.update === 'function'
      ? endpoints.companies.update(id)
      : endpoints.companies.update;

  await initSanctumCsrf(); // Initialize CSRF token before PUT
  // sanctum interceptor unwraps { status, message, data } → data
  const response = await sanctum.put(url, data);
  return response.data; // Already unwrapped by interceptor
}

/**
 * Delete company
 */
export async function deleteCompany(id: string): Promise<void> {
  const url =
    typeof endpoints.companies.delete === 'function'
      ? endpoints.companies.delete(id)
      : endpoints.companies.delete;

  await initSanctumCsrf(); // Initialize CSRF token before DELETE
  await sanctum.delete(url);
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch companies with loading state
 */
export function useGetCompanies(filters?: CompanyFilters) {
  const [companies, setCompanies] = useState<ICompanyItem[]>([]);
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

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const parsedFilters = filtersString ? JSON.parse(filtersString) : undefined;
      const response = await fetchCompanies(parsedFilters);

      // Transform backend data to match frontend ICompanyItem type
      const transformedData: ICompanyItem[] = response.data.data.map((company: any) => ({
        id: company.id,
        name: company.name,
        email: company.email,
        phoneNumber: company.phone || '',
        address:
          `${company.address || ''}, ${company.city || ''}, ${company.state || ''}, ${company.zip_code || ''}`.replace(
            /(^[,\s]+)|([,\s]+$)/g,
            ''
          ),
        status:
          company.is_active === 1
            ? 'active'
            : company.is_active === 2
              ? 'pending'
              : company.is_active === 0
                ? 'banned'
                : 'banned',
        createdAt: company.created_at,
        isVerified: !!company.email_verified_at,
      }));

      setCompanies(transformedData);
      setPagination({
        currentPage: response.data.current_page,
        perPage: response.data.per_page,
        total: response.data.total,
        lastPage: response.data.last_page,
      });
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch companies');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [filtersString]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  return {
    companies,
    loading,
    error,
    pagination,
    refetch: loadCompanies,
  };
}

/**
 * Hook to fetch single company
 */
export function useGetCompany(id: string) {
  const [company, setCompany] = useState<ICompanyItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCompany() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchCompany(id);

        // Transform backend data to match frontend ICompanyItem type
        const transformedData: ICompanyItem = {
          id: data.id,
          name: data.name,
          email: data.email,
          phoneNumber: data.phone || '',
          address:
            `${data.address || ''}, ${data.city || ''}, ${data.state || ''}, ${data.zip_code || ''}`.replace(
              /(^[,\s]+)|([,\s]+$)/g,
              ''
            ),
          status: data.is_active === 1 ? 'active' : data.is_active === 2 ? 'pending' : 'banned',
          createdAt: data.created_at,
          isVerified: !!data.email_verified_at,
        };

        setCompany(transformedData);
      } catch (err) {
        console.error('Failed to fetch company:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch company');
        setCompany(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadCompany();
    }
  }, [id]);

  return {
    company,
    loading,
    error,
  };
}
