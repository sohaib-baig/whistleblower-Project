import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export const sanctum = axios.create({
  baseURL: CONFIG.serverUrl,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: { 'Content-Type': 'application/json' },
});

export async function initSanctumCsrf(): Promise<void> {
  await sanctum.get('/sanctum/csrf-cookie');
}

// Ensure XSRF header is set from cookie even if axios doesn't pick it up automatically
sanctum.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // If data is FormData, remove Content-Type header to let axios set it automatically with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const cookies = typeof document !== 'undefined' ? document.cookie : '';
    const match = cookies.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
    const xsrf = match ? decodeURIComponent(match[1]) : null;
    if (xsrf) {
      const headers: any = config.headers;
      if (headers && typeof headers.set === 'function') {
        headers.set('X-XSRF-TOKEN', xsrf);
      } else {
        config.headers = { ...(headers || {}), 'X-XSRF-TOKEN': xsrf } as any;
      }
    }
  } catch {
    // no-op
  }
  return config;
});

// Envelope-aware interceptor: { status, message, data }
let isRefreshing = false;

sanctum.interceptors.response.use(
  (response) => {
    const payload = (response as any)?.data;
    if (payload && typeof payload === 'object' && 'status' in payload && 'data' in payload) {
      (response as any).message = (payload as any).message ?? '';
      return { ...response, data: (payload as any).data } as any;
    }
    return response;
  },
  async (error: AxiosError<any>) => {
    const res = error.response;

    // Handle 400 Bad Request - Cookie Too Large error
    if (res?.status === 400) {
      const errorMessage = (res?.data as any)?.message || '';
      const errorText = typeof errorMessage === 'string' ? errorMessage.toLowerCase() : '';
      
      if (errorText.includes('cookie') && errorText.includes('large')) {
        // Clear all cookies and sessionStorage, then redirect to sign-in
        try {
          // Clear sessionStorage
          sessionStorage.clear();
          
          // Clear all cookies by setting them to expire (we can't directly delete cookies, but we can set them to expire)
          document.cookie.split(';').forEach((cookie) => {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            // Clear session and XSRF cookies
            if (name.includes('session') || name.includes('XSRF') || name.includes('xsrf')) {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
              if (window.location.hostname.includes('.')) {
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
              }
            }
          });
          
          // Redirect to sign-in with error message
          const url = new URL('/auth/sign-in', window.location.origin);
          url.searchParams.set('message', 'Session expired due to cookie size limit. Please sign in again.');
          window.location.href = url.toString();
          return Promise.reject(error);
        } catch {
          // If clearing fails, still redirect
          window.location.href = '/auth/sign-in';
          return Promise.reject(error);
        }
      }
    }

    // Handle 419 CSRF mismatch: refresh CSRF cookie and retry once
    if (res?.status === 419) {
      try {
        if (!isRefreshing) {
          isRefreshing = true;
          await sanctum.get('/sanctum/csrf-cookie');
          isRefreshing = false;
        }
        const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
        if (original && !original._retried) {
          original._retried = true;
          return sanctum.request(original);
        }
      } catch {
        // fallthrough
      }
      try {
        const url = new URL('/auth/sign-in', window.location.origin);
        url.searchParams.set('message', 'Your session expired. Please sign in again.');
        window.location.href = url.toString();
      } catch {
        // no-op
      }
    }

    const payload = res?.data as any;
    
    // Extract error message from Laravel response format
    let errorMessage = 'Request failed';
    if (payload) {
      // Laravel envelope format: { status: false, message: "...", data: null }
      if (payload.message) {
        errorMessage = payload.message;
      } else if (payload.error) {
        errorMessage = payload.error;
      } else if (typeof payload === 'string') {
        errorMessage = payload;
      }
    } else if ((error as any).message) {
      errorMessage = (error as any).message;
    }
    
    const normalized = new Error(errorMessage);
    (normalized as any).httpStatus = res?.status ?? 0;
    (normalized as any).errors = payload?.data?.errors || payload?.errors || undefined;
    (normalized as any).responseData = payload; // Include full response for debugging
    
    console.error('❌ API Error:', {
      status: res?.status,
      message: errorMessage,
      errors: (normalized as any).errors,
      payload,
    });
    
    return Promise.reject(normalized);
  }
);

export default sanctum;
