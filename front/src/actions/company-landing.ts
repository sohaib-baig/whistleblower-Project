import type { CaseHiddenField } from 'src/types/case-details';
import type { CompanyLanding, CompanyContent, LoginCredentials } from 'src/types/company-landing';

import axiosInstance from 'src/lib/axios';
import { CONFIG } from 'src/global-config';
import { _companyLanding } from 'src/_mock/_company-landing';

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getCompanyBySlug(slug: string): Promise<CompanyLanding> {
  // First try real backend by assuming slug may actually be an ID
  try {
    // Public minimal company endpoint (works with id via route model binding)
    const res = await axiosInstance.get(`/api/v1/public/companies/${slug}`);
    const data: any = (res as any)?.data?.data ?? (res as any)?.data ?? null;
    
    if (data) {
      // Construct full logo URL from avatar_path
      let logoUrl = data.logo_url || data.logo || _companyLanding.logo;
      if (logoUrl && !logoUrl.startsWith('http')) {
        // If it starts with /storage, use it as-is, otherwise prepend /storage/
        if (!logoUrl.startsWith('/')) {
          logoUrl = `/storage/${logoUrl}`;
        }
        // Use CONFIG.serverUrl for full URL construction
        const baseUrl = CONFIG.serverUrl.replace(/\/$/, '');
        logoUrl = `${baseUrl}${logoUrl}`;
      }

      const companyData = {
        id: data.id || slug,
        slug: data.slug || data.company_slug || slug, // Prioritize slug fields, never use ID for slug
        name: data.name || data.company_name || 'Company',
        logo: logoUrl,
        primaryColor: _companyLanding.primaryColor,
        secondaryColor: _companyLanding.secondaryColor,
        aboutUs: _companyLanding.aboutUs,
        privacyPolicy: _companyLanding.privacyPolicy,
        termsConditions: _companyLanding.termsConditions,
        support: _companyLanding.support,
        contactInfo: {
          email: data.email || data.contact_email || _companyLanding.contactInfo.email,
          phone: data.phone || data.contact_phone || _companyLanding.contactInfo.phone,
          phoneHoursFrom: data.phone_hours_from || _companyLanding.contactInfo.phoneHoursFrom,
          phoneHoursTo: data.phone_hours_to || _companyLanding.contactInfo.phoneHoursTo,
          phoneHoursFormat: (data.phone_hours_format as '12h' | '24h') || _companyLanding.contactInfo.phoneHoursFormat || '24h',
          address: data.address || _companyLanding.contactInfo.address,
          physicalAddress: data.physical_address || _companyLanding.contactInfo.physicalAddress,
          website: data.website || _companyLanding.contactInfo.website,
          socialMedia: _companyLanding.contactInfo.socialMedia,
        },
        isActive: true,
        createdAt: data.created_at || '',
        updatedAt: data.updated_at || '',
      } as CompanyLanding;
      
      return companyData;
    }
    
    console.warn(`[getCompanyBySlug] No data returned from API for ${slug}`);
  } catch (error: any) {
    // Log error details for debugging - check both error.response and error.status
    const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
    const errorStatus = error?.response?.status || error?.status;
    const errorUrl = error?.config?.url || error?.response?.config?.url;
    const fullError = error?.response || error;
    
    console.error(`[getCompanyBySlug] API error for ${slug}:`, {
      status: errorStatus,
      message: errorMessage,
      url: errorUrl,
      fullError,
      responseData: error?.response?.data,
    });
    
    // If it's a 404, the company doesn't exist - don't fall back to mock
    if (errorStatus === 404) {
      throw new Error(`Company with slug or id "${slug}" not found (404)`);
    }
    
    // For other errors, fall back to mock (network issues, etc.)
    console.warn(`[getCompanyBySlug] Falling back to mock data for ${slug}`);
  }

  // Fallback to mock data when backend not available or no match
  await delay(200);
  if (slug === _companyLanding.slug) {
    return _companyLanding;
  }
  
  throw new Error(`Company with slug or id "${slug}" not found`);
}

export async function getCompanyContent(slug: string, page: string): Promise<CompanyContent> {
  // Map frontend page names to API endpoints
  const pageEndpointMap: Record<string, string> = {
    'about-us': '/api/v1/public/pages/reporting-page',
    'privacy-policy': '/api/v1/public/pages/privacy-policy',
    'terms-and-condition': '/api/v1/public/pages/terms-conditions',
    support: '/api/v1/public/pages/support',
    'create-case': '/api/v1/public/pages/create-case',
  };

  const endpoint = pageEndpointMap[page];

  if (!endpoint) {
    // Fallback to mock data for unknown pages
    const company = await getCompanyBySlug(slug);
    return company.aboutUs;
  }

  try {
    // Fetch from API with language header (automatically added by axios interceptor)
    // Add company slug as query parameter to filter by company
    const url = `${endpoint}?company=${slug}`;


    const response = await axiosInstance.get(url);
    const pageData = response.data?.data || response.data;


    // Return as CompanyContent format
    return {
      title: pageData.page_title || '',
      content: pageData.page_content || '',
      sections: [], // Empty sections array for now
      lastUpdated: pageData.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[Company Content] Failed to fetch ${page} page:`, error);
    // Fallback to mock data on error
    const company = await getCompanyBySlug(slug);
    switch (page) {
      case 'about-us':
        return company.aboutUs;
      case 'privacy-policy':
        return company.privacyPolicy;
      case 'terms-and-condition':
        return company.termsConditions;
      case 'support':
        return company.support;
      default:
        return company.aboutUs;
    }
  }
}

export async function submitCase(caseData: any): Promise<{ case_id: string; password: string }> {
  try {
    // Always send JSON for case creation - audio files are uploaded separately as attachments
    const res = await axiosInstance.post('/api/v1/public/cases', caseData);
    
    const responseData: any = res?.data?.data ?? res?.data ?? {};

    return {
      case_id: responseData.case_id || '',
      password: responseData.password || caseData.password || '',
    };
  } catch (error: any) {
    console.error('Error submitting case:', error);
    const errorMessage =
      error?.response?.data?.message || error?.message || 'Failed to submit case';
    throw new Error(errorMessage);
  }
}

export async function sendCaseConfirmationEmail(caseId: string, email: string): Promise<void> {
  try {
    await axiosInstance.post('/api/v1/public/cases/send-confirmation-email', {
      case_id: caseId,
      email,
    });
  } catch (error: any) {
    console.error('Error sending confirmation email:', error);
    const errorMessage =
      error?.response?.data?.message || error?.message || 'Failed to send confirmation email';
    throw new Error(errorMessage);
  }
}

export interface CaseAuthenticationResponse {
  status: boolean;
  message: string;
  data?: {
    case_id: string;
    company_id: string;
  };
}

export interface CaseDetailsResponse {
  status: boolean;
  message: string;
  data?: {
    id: string;
    case_id: string;
    company_id: string;
    title: string;
    subject: string;
    description: string;
    reporting_medium: string;
    report_type: string;
    status: string;
    category: string | null;
    category_id: string;
    case_manager_id: string | null;
    case_manager_name: string | null;
    department_id: string | null;
    department_name: string | null;
    department?: {
      id: string;
      name: string;
    } | null;
    severity_id: string | null;
    severity_name: string | null;
    severity?: {
      id: string;
      name: string;
    } | null;
    state_id: string | null;
    state_name: string | null;
    state?: {
      id: string;
      name: string;
    } | null;
    personal_details: any;
    email: string | null;
    created_at: string;
    date_time: string;
    updated_at: string;
    open_deadline_time: string | null;
    open_deadline_number?: number | null;
    open_deadline_period?: string | null;
    close_deadline_time: string | null;
    close_deadline_number?: number | null;
    close_deadline_period?: string | null;
    other_report_link: string | null;
    automatic_delete: string | null;
    answers: Array<{
      question_id: string;
      question_name: string | null;
      answer: string | null;
    }>;
    hidden_fields?: CaseHiddenField[];
  };
}

export async function getCaseDetails(caseId: string): Promise<CaseDetailsResponse['data']> {
  try {
    const res = await axiosInstance.get(`/api/v1/public/cases/${caseId}`);
    const data: any = (res as any)?.data ?? null;
    if (data?.status && data?.data) {
      return data.data;
    }
    throw new Error(data?.message || 'Failed to fetch case details');
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Failed to fetch case details');
  }
}

export interface CaseAttachment {
  id: string;
  attachment_name: string;
  attachment_type: string;
  attachment_path: string;
  created_at: string;
}

export interface CaseAttachmentsResponse {
  status: boolean;
  message: string;
  data?: CaseAttachment[];
}

export async function getCaseAttachments(caseId: string): Promise<CaseAttachment[]> {
  try {
    const res = await axiosInstance.get(`/api/v1/public/cases/${caseId}/attachments`);
    const data: any = (res as any)?.data ?? null;
    if (data?.status && data?.data) {
      return data.data;
    }
    throw new Error(data?.message || 'Failed to fetch attachments');
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Failed to fetch attachments');
  }
}

export async function uploadCaseAttachment(
  caseId: string,
  file: File,
  attachmentName: string
): Promise<CaseAttachment> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('case_id', caseId);
    formData.append('attachment_name', attachmentName);

    // Don't set Content-Type manually - axios will set it automatically with the correct boundary
    const res = await axiosInstance.post('/api/v1/public/cases/attachments', formData);

    const data: any = (res as any)?.data ?? null;
    if (data?.status && data?.data) {
      return data.data;
    }
    throw new Error(data?.message || 'Failed to upload attachment');
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Failed to upload attachment');
  }
}

export async function deleteCaseAttachment(attachmentId: string): Promise<void> {
  try {
    const res = await axiosInstance.delete(`/api/v1/public/cases/attachments/${attachmentId}`);
    const data: any = (res as any)?.data ?? null;
    if (!data?.status) {
      throw new Error(data?.message || 'Failed to delete attachment');
    }
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Failed to delete attachment');
  }
}

export async function loginUser(
  companyId: string,
  credentials: LoginCredentials,
  turnstileToken?: string
): Promise<CaseAuthenticationResponse> {
  try {
    const payload: any = {
      company_id: companyId,
      password: credentials.password,
    };
    if (turnstileToken) {
      payload.turnstile_token = turnstileToken;
    }
    const res = await axiosInstance.post('/api/v1/public/cases/authenticate', payload);

    const data: any = (res as any)?.data ?? null;
    if (data?.status && data?.data) {
      return data;
    }

    throw new Error(data?.message || 'Authentication failed');
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Invalid credentials');
  }
}

export async function getCompanyLogo(slug: string): Promise<string> {
  await delay(200); // Simulate API call

  const company = await getCompanyBySlug(slug);
  return company.logo;
}

export async function updateCompanyContent(
  slug: string,
  page: string,
  content: CompanyContent
): Promise<void> {
  await delay(1000); // Simulate API call

  // In a real application, this would update the content on the backend

  return Promise.resolve();
}

export type CaseQuestion = {
  id: string;
  name: string;
  is_required: boolean;
  input_type: string;
  options: string[];
  order: number;
};

export async function getCaseQuestions(companyId: string): Promise<CaseQuestion[]> {
  try {
    const res = await axiosInstance.get(`/api/v1/public/questions/company/${companyId}`);
    const data: any = (res as any)?.data?.data ?? (res as any)?.data ?? null;
    return data || [];
  } catch (error) {
    console.error('Error fetching case questions:', error);
    return [];
  }
}

export type CaseManager = {
  id: string;
  name: string;
  email: string;
};

export async function getCaseManagers(companyId: string): Promise<CaseManager[]> {
  try {
    const url = `/api/v1/public/case-managers/company/${companyId}`;
    const res = await axiosInstance.get(url);
    // Handle both response.data.data and response.data structures
    const responseData = (res as any)?.data;
    const data = responseData?.data ?? (Array.isArray(responseData) ? responseData : null);
    if (data && Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching case managers:', error);
    if ((error as any)?.response) {
      console.error('API Error Response:', (error as any).response.data);
      console.error('API Error Status:', (error as any).response.status);
    }
    return [];
  }
}

export type NavigationPage = {
  page_type: string;
  page_title: string;
  page_slug?: string;
  route: string; // Keep for backward compatibility
};

export async function getNavigationPages(slug: string): Promise<NavigationPage[]> {
  try {
    const url = `/api/v1/public/pages/navigation?company=${slug}`;
    const res = await axiosInstance.get(url);

    // Handle API response structure: { status, message, data }
    const responseData: any = res?.data;

    // Check if data is directly in responseData or in responseData.data
    let pagesData = null;
    if (responseData?.data) {
      pagesData = responseData.data;
    } else if (Array.isArray(responseData)) {
      pagesData = responseData;
    }


    if (pagesData && Array.isArray(pagesData)) {
      return pagesData;
    }
    return [];
  } catch (error) {
    console.error('Error fetching navigation pages:', error);
    if ((error as any)?.response) {
      console.error('API Error Response:', (error as any).response.data);
      console.error('API Error Status:', (error as any).response.status);
    }
    return [];
  }
}

export type Category = {
  id: string;
  name: string;
  status: string;
};

export async function getCategories(): Promise<Category[]> {
  try {
    const url = '/api/v1/public/categories/active';
    const res = await axiosInstance.get(url);

    // Handle API response structure: { status, message, data }
    const responseData: any = res?.data;

    // Check if data is directly in responseData or in responseData.data
    let categoriesData = null;
    if (responseData?.data) {
      categoriesData = responseData.data;
    } else if (Array.isArray(responseData)) {
      categoriesData = responseData;
    }


    if (categoriesData && Array.isArray(categoriesData)) {
      return categoriesData;
    }
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    if ((error as any)?.response) {
      console.error('API Error Response:', (error as any).response.data);
      console.error('API Error Status:', (error as any).response.status);
    }
    return [];
  }
}
