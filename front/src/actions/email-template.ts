import type { EmailTemplate, EmailTemplateFormValues } from 'src/types/email-template';

import { useState, useEffect, useCallback } from 'react';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

export type EmailTemplateFilters = {
  search?: string;
  status?: string;
  per_page?: number;
  page?: number;
  sort?: string;
  order?: string;
};

// ----------------------------------------------------------------------

/**
 * Fetch email templates from API
 */
export async function fetchEmailTemplates(filters?: EmailTemplateFilters): Promise<any> {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.per_page) params.append('per_page', filters.per_page.toString());
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.sort) params.append('sort', filters.sort);
  if (filters?.order) params.append('order', filters.order);

  const url = `${endpoints.emailTemplates.list}?${params.toString()}`;
  const response = await sanctum.get(url);

  return { data: response.data };
}

/**
 * Fetch single email template by ID
 */
export async function fetchEmailTemplate(id: string): Promise<any> {
  const url =
    typeof endpoints.emailTemplates.details === 'function'
      ? endpoints.emailTemplates.details(id)
      : endpoints.emailTemplates.details;

  const response = await sanctum.get(url);
  return response.data;
}

/**
 * Fetch email template by name and language
 */
export async function fetchEmailTemplateByNameAndLanguage(
  name: string,
  language: string
): Promise<any> {
  const params = new URLSearchParams();
  params.append('name', name);
  params.append('language', language);

  const url = `${endpoints.emailTemplates.getByNameAndLanguage}?${params.toString()}`;
  const response = await sanctum.get(url);
  return response.data;
}

/**
 * Create new email template
 */
export async function createEmailTemplate(data: EmailTemplateFormValues): Promise<any> {
  await initSanctumCsrf();
  const response = await sanctum.post(endpoints.emailTemplates.create, data);
  return response.data;
}

/**
 * Update email template
 */
export async function updateEmailTemplate(id: string, data: EmailTemplateFormValues): Promise<any> {
  const url =
    typeof endpoints.emailTemplates.update === 'function'
      ? endpoints.emailTemplates.update(id)
      : endpoints.emailTemplates.update;

  await initSanctumCsrf();
  const response = await sanctum.put(url, data);
  return response.data;
}

/**
 * Delete email template
 */
export async function deleteEmailTemplate(id: string): Promise<void> {
  const url =
    typeof endpoints.emailTemplates.delete === 'function'
      ? endpoints.emailTemplates.delete(id)
      : endpoints.emailTemplates.delete;

  await initSanctumCsrf();
  await sanctum.delete(url);
}

/**
 * Convert email template to another language
 */
export async function convertEmailTemplate(
  id: string,
  targetLanguage: string
): Promise<any> {
  await initSanctumCsrf();
  const url =
    typeof endpoints.emailTemplates.convert === 'function'
      ? endpoints.emailTemplates.convert(id)
      : endpoints.emailTemplates.convert;

  const response = await sanctum.post(url, { target_language: targetLanguage });
  return response.data;
}

// ----------------------------------------------------------------------

/**
 * Hook to fetch email templates with loading state
 */
export function useGetEmailTemplates(filters?: EmailTemplateFilters) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 15,
    total: 0,
    lastPage: 1,
  });

  const filtersString = JSON.stringify(filters);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const parsedFilters = filtersString ? JSON.parse(filtersString) : undefined;
      const response = await fetchEmailTemplates(parsedFilters);

      const transformedData: EmailTemplate[] = response.data.data.map((template: any) => ({
        id: template.id,
        name: template.name,
        subject: template.subject,
        content: template.content,
        placeholder: template.placeholder || '',
        language: template.language || 'en',
        status: template.status || 'active',
        createdAt: template.created_at,
        updatedAt: template.updated_at,
      }));

      setTemplates(transformedData);
      setPagination({
        currentPage: response.data.current_page,
        perPage: response.data.per_page,
        total: response.data.total,
        lastPage: response.data.last_page,
      });
    } catch (err) {
      console.error('Failed to fetch email templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch email templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [filtersString]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    loading,
    error,
    pagination,
    refetch: loadTemplates,
  };
}

/**
 * Hook to fetch single email template
 */
export function useGetEmailTemplate(id: string) {
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchEmailTemplate(id);

        const transformedData: EmailTemplate = {
          id: data.id,
          name: data.name,
          subject: data.subject,
          content: data.content,
          placeholder: data.placeholder || '',
          language: data.language || 'en',
          status: data.status || 'active',
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        setTemplate(transformedData);
      } catch (err) {
        console.error('Failed to fetch email template:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch email template');
        setTemplate(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadTemplate();
    }
  }, [id]);

  return {
    template,
    loading,
    error,
  };
}
