import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';
import i18next from 'i18next';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: CONFIG.serverUrl,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Add language header to all requests
 */
axiosInstance.interceptors.request.use((config) => {
  // If data is FormData, remove Content-Type header to let axios set it automatically with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  // Get current language from i18next - check multiple sources to ensure we get the latest
  let currentLanguage = i18next.language || i18next.resolvedLanguage;

  // Fallback: try to get from localStorage if i18next hasn't initialized yet
  if (!currentLanguage || currentLanguage === 'en') {
    const storedLang = localStorage.getItem('i18nextLng');
    if (storedLang) {
      currentLanguage = storedLang;
    }
  }

  // Final fallback
  if (!currentLanguage) {
    currentLanguage = 'en';
  }

  // Extract language code (e.g., 'sv-SE' -> 'sv', 'sv' -> 'sv')
  const langCode = currentLanguage.split('-')[0].toLowerCase();

  // Set Accept-Language header for translation service
  if (config.headers) {
    config.headers['Accept-Language'] = langCode;
    
    // Prevent caching for GET requests, especially for public company endpoints
    // This prevents browsers from caching 404 responses
    // Use timestamp query parameter instead of headers to avoid CORS issues
    if (config.method === 'get' && config.url?.includes('/public/companies/')) {
      // Add timestamp query parameter to force fresh requests (cache busting)
      // This bypasses browser cache without requiring additional CORS headers
      const separator = config.url.includes('?') ? '&' : '?';
      config.url = `${config.url}${separator}_t=${Date.now()}`;
    }
  }

  /**
   * Optional: Add token (if using auth)
   *
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  */

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error?.message || 'Something went wrong!';
    console.error('Axios error:', message);
    // Preserve the original error with response details for better error handling
    const enhancedError: any = new Error(message);
    enhancedError.response = error?.response;
    enhancedError.status = error?.response?.status;
    enhancedError.config = error?.config;
    return Promise.reject(enhancedError);
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async <T = unknown>(
  args: string | [string, AxiosRequestConfig]
): Promise<T> => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args, {}];

    const res = await axiosInstance.get<T>(url, config);

    return res.data;
  } catch (error) {
    console.error('Fetcher failed:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/v1/chat',
  kanban: '/api/v1/kanban',
  calendar: '/api/v1/calendar',
  auth: {
    csrf: '/sanctum/csrf-cookie',
    me: '/api/v1/auth/me',
    login: '/api/v1/auth/login',
    logout: '/api/v1/auth/logout',
    checkEmail: '/api/v1/auth/check-email',
    checkPhone: '/api/v1/auth/check-phone',
    checkCompanyName: '/api/v1/auth/check-company-name',
    signup: '/api/v1/auth/signup',
    resendVerificationEmail: '/api/v1/auth/resend-verification-email',
  },
  settings: '/api/v1/settings',
  orders: {
    verifyPayment: '/api/v1/orders/verify-payment',
  },
  password: {
    forgot: '/api/v1/password/forgot',
    reset: '/api/v1/password/reset',
    check: '/api/v1/password/check',
  },
  mail: {
    list: '/api/v1/mail/list',
    details: '/api/v1/mail/details',
    labels: '/api/v1/mail/labels',
  },
  post: {
    list: '/api/v1/post/list',
    details: '/api/v1/post/details',
    latest: '/api/v1/post/latest',
    search: '/api/v1/post/search',
  },
  product: {
    list: '/api/v1/product/list',
    details: '/api/v1/product/details',
    search: '/api/v1/product/search',
  },
  dashboard: {
    overview: '/api/v1/dashboard/overview',
  },
  companies: {
    list: '/api/v1/companies',
    details: (id: string) => `/api/v1/companies/${id}`,
    create: '/api/v1/companies',
    update: (id: string) => `/api/v1/companies/${id}`,
    delete: (id: string) => `/api/v1/companies/${id}`,
  },
  users: {
    list: '/api/v1/users',
    details: (id: string) => `/api/v1/users/${id}`,
    create: '/api/v1/users',
    update: (id: string) => `/api/v1/users/${id}`,
    delete: (id: string) => `/api/v1/users/${id}`,
  },
  categories: {
    list: '/api/v1/categories',
    details: (id: string) => `/api/v1/categories/${id}`,
    create: '/api/v1/categories',
    update: (id: string) => `/api/v1/categories/${id}`,
    delete: (id: string) => `/api/v1/categories/${id}`,
  },
  departments: {
    list: '/api/v1/departments',
    details: (id: string) => `/api/v1/departments/${id}`,
    create: '/api/v1/departments',
    update: (id: string) => `/api/v1/departments/${id}`,
    delete: (id: string) => `/api/v1/departments/${id}`,
  },
  states: {
    list: '/api/v1/states',
    details: (id: string) => `/api/v1/states/${id}`,
    create: '/api/v1/states',
    update: (id: string) => `/api/v1/states/${id}`,
    delete: (id: string) => `/api/v1/states/${id}`,
  },
  severities: {
    list: '/api/v1/severities',
    details: (id: string) => `/api/v1/severities/${id}`,
    create: '/api/v1/severities',
    update: (id: string) => `/api/v1/severities/${id}`,
    delete: (id: string) => `/api/v1/severities/${id}`,
  },
  pages: {
    privacyPolicy: {
      get: '/api/v1/pages/privacy-policy',
      update: '/api/v1/pages/privacy-policy',
    },
    aboutUs: {
      get: '/api/v1/pages/about-us',
      update: '/api/v1/pages/about-us',
    },
    loginPage: {
      get: '/api/v1/pages/login',
      update: '/api/v1/pages/login',
      public: '/api/v1/public/pages/login',
    },
    policyPage: {
      get: '/api/v1/pages/policy',
      update: '/api/v1/pages/policy',
    },
    paymentPage: {
      get: '/api/v1/pages/payment',
      update: '/api/v1/pages/payment',
      public: '/api/v1/public/pages/payment',
    },
    termsConditions: {
      get: '/api/v1/pages/terms-conditions',
      update: '/api/v1/pages/terms-conditions',
    },
    support: {
      get: '/api/v1/pages/support',
      update: '/api/v1/pages/support',
    },
    reportingPage: {
      get: '/api/v1/pages/reporting-page',
      update: '/api/v1/pages/reporting-page',
    },
  },
  public: {
    companies: {
      details: (id: string) => `/api/v1/public/companies/${id}`,
    },
    pages: {
      reportingPage: (userId: string) => `/api/v1/public/pages/reporting-page/${userId}`,
    },
    siteLogo: {
      get: '/api/v1/public/site-logo',
    },
    smallLogo: {
      get: '/api/v1/public/small-logo',
    },
    questions: {
      byCompany: (companyId: string) => `/api/v1/public/questions/company/${companyId}`,
    },
  },
  emailTemplates: {
    list: '/api/v1/email-templates',
    details: (id: string) => `/api/v1/email-templates/${id}`,
    create: '/api/v1/email-templates',
    update: (id: string) => `/api/v1/email-templates/${id}`,
    getByNameAndLanguage: '/api/v1/email-templates/by-name-language',
    delete: (id: string) => `/api/v1/email-templates/${id}`,
    convert: (id: string) => `/api/v1/email-templates/${id}/convert`,
  },
  themeConfiguration: {
    get: '/api/v1/theme-configuration',
    update: '/api/v1/theme-configuration',
  },
  basicConfiguration: {
    get: '/api/v1/basic-configuration',
    update: '/api/v1/basic-configuration',
  },
  stripeConfiguration: {
    get: '/api/v1/stripe-configuration',
    update: '/api/v1/stripe-configuration',
  },
  bankDetails: {
    get: '/api/v1/bank-details',
    update: '/api/v1/bank-details',
  },
  caseManagers: {
    list: '/api/v1/case-managers',
    details: (id: string) => `/api/v1/case-managers/${id}`,
    create: '/api/v1/case-managers',
    update: (id: string) => `/api/v1/case-managers/${id}`,
    delete: (id: string) => `/api/v1/case-managers/${id}`,
  },
  impersonation: {
    start: (userId: string) => `/api/v1/impersonate/${userId}`,
    stop: '/api/v1/impersonate/stop',
    status: '/api/v1/impersonate/status',
  },
  questions: {
    list: '/api/v1/questions',
    details: (id: string) => `/api/v1/questions/${id}`,
    create: '/api/v1/questions',
    update: (id: string) => `/api/v1/questions/${id}`,
    delete: (id: string) => `/api/v1/questions/${id}`,
    reorder: '/api/v1/questions/reorder',
  },
  news: {
    list: '/api/v1/news',
    details: (id: string) => `/api/v1/news/${id}`,
    create: '/api/v1/news',
    update: (id: string) => `/api/v1/news/${id}`,
    delete: (id: string) => `/api/v1/news/${id}`,
    uploadCover: (id: string) => `/api/v1/news/${id}/upload-cover`,
  },
} as const;
