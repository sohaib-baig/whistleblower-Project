import { useRef, useEffect } from 'react';

import { CONFIG } from 'src/global-config';

import { JWT_STORAGE_KEY } from '../context/jwt/constant';

/**
 * Hook to handle auto-logout when browser/tab is closed
 * Uses pagehide and beforeunload events with navigator.sendBeacon for reliable logout
 * 
 * This ensures the server-side session is invalidated when the browser/tab closes,
 * even if the page unload happens quickly.
 */
export function useAutoLogout() {
  const logoutAttemptedRef = useRef(false);

  useEffect(() => {
    // Only set up auto-logout if user is authenticated (has token in sessionStorage)
    const checkAuth = () => !!sessionStorage.getItem(JWT_STORAGE_KEY);

    if (!checkAuth()) {
      return undefined;
    }

    const sendLogoutBeacon = () => {
      // Prevent multiple logout attempts
      if (logoutAttemptedRef.current) {
        return;
      }

      logoutAttemptedRef.current = true;

      try {
        // Get CSRF token from cookies
        const cookies = document.cookie;
        const xsrfMatch = cookies.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
        const xsrfToken = xsrfMatch ? decodeURIComponent(xsrfMatch[1]) : null;

        const logoutUrl = `${CONFIG.serverUrl}/api/v1/auth/logout`;

        // Try fetch with keepalive first (allows setting headers)
        // keepalive ensures the request completes even during page unload
        if (xsrfToken) {
          // Try fetch with keepalive - this allows setting headers
          fetch(logoutUrl, {
            method: 'POST',
            headers: {
              'X-XSRF-TOKEN': xsrfToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
            keepalive: true,
            credentials: 'include', // Include cookies (session cookie)
          }).catch(() => {
            // If fetch fails, try sendBeacon as fallback
            if (navigator.sendBeacon) {
              const formData = new FormData();
              formData.append('_token', xsrfToken);
              navigator.sendBeacon(logoutUrl, formData);
            }
          });
        } else if (navigator.sendBeacon) {
          // Fallback: use sendBeacon if no CSRF token (shouldn't happen normally)
          navigator.sendBeacon(logoutUrl, new Blob([], { type: 'application/json' }));
        }

        // Clear sessionStorage immediately
        sessionStorage.removeItem(JWT_STORAGE_KEY);
      } catch (error) {
        // Silently fail - browser might be closing
        console.debug('Auto-logout beacon error:', error);
        // Still clear sessionStorage as fallback
        sessionStorage.removeItem(JWT_STORAGE_KEY);
      }
    };

    // Handle page hide (most reliable for detecting page unload)
    // This fires when the page is being unloaded (tab close, navigation, etc.)
    const handlePageHide = () => {
      // Only logout if user is authenticated and we haven't already attempted
      if (checkAuth() && !logoutAttemptedRef.current) {
        // Use sendBeacon for reliable logout during page unload
        sendLogoutBeacon();
      }
    };

    // Handle browser/tab close as additional fallback
    // Note: beforeunload may not fire in all cases, but pagehide should
    const handleBeforeUnload = () => {
      // Only attempt logout if user is authenticated
      if (checkAuth() && !logoutAttemptedRef.current) {
        // Use sendBeacon for reliable logout
        sendLogoutBeacon();
      }
    };

    // Add event listeners
    // pagehide is more reliable than beforeunload for detecting page unload
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
     
  }, []); // Empty deps - only run once on mount
}

