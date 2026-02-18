import type { AuthState } from '../../types';
import type { UserRole } from 'src/auth/roles';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { CONFIG } from 'src/global-config';
import sanctum from 'src/lib/axios-sanctum';

import { AuthContext } from '../auth-context';
import { useAutoLogout } from '../../hooks/use-auto-logout';
import { useInactivityTimeout } from '../../hooks/use-inactivity-timeout';
import { SessionTimeoutDialog } from '../../components/session-timeout-dialog';

// ----------------------------------------------------------------------

/**
 * NOTE:
 * We only build demo at basic level.
 * Customer will need to do some extra handling yourself if you want to extend the logic and other features...
 */

type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  const { state, setState } = useSetState<AuthState>({ user: null, loading: true });
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Enable auto-logout on browser close
  useAutoLogout();

  // Enable inactivity timeout with API session validation
  // Use a stable enabled value to prevent hook re-initialization
  const isAuthenticated = state.user !== null;
  const timeoutEnabled = CONFIG.auth.inactivityTimeout.enabled && isAuthenticated;
  
  const { resetTimers, getTimeRemaining } = useInactivityTimeout({
    enabled: timeoutEnabled,
    warningTime: CONFIG.auth.inactivityTimeout.warningTime * 60 * 1000,
    logoutTime: CONFIG.auth.inactivityTimeout.logoutTime * 60 * 1000,
    onWarning: (remaining) => {
      setTimeRemaining(remaining);
      setShowTimeoutWarning(true);
    },
    onLogout: () => {
      setShowTimeoutWarning(false);
      // Clear user state immediately
      setState({ user: null, loading: false });
    },
  });

  // Update time remaining in dialog
  useEffect(() => {
    if (!showTimeoutWarning) {
      return undefined;
    }

    const interval = setInterval(() => {
      const remaining = getTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setShowTimeoutWarning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showTimeoutWarning, getTimeRemaining]);

  const checkUserSession = useCallback(async () => {
    // Don't check session if we're on the sign-in, sign-up, or set-password page (prevents auto-login after logout and redirect loops)
    const currentPath = window.location.pathname;
    if (currentPath.includes('/auth/sign-in') || currentPath.includes('/auth/sign-up') || currentPath.includes('/auth/set-password')) {
      setState({ user: null, loading: false });
      return;
    }

    // Don't check session if logout is in progress
    if (sessionStorage.getItem('logout_in_progress') === 'true') {
      setState({ user: null, loading: false });
      return;
    }

    try {
      const res = await sanctum.get('/api/v1/auth/me');
      const user = (res as any)?.data?.user ?? (res as any)?.data;
      setState({ user: user ?? null, loading: false });
    } catch (error: any) {
      // Check if error is due to password requirement
      const responseData = error?.responseData;
      if (error?.httpStatus === 403 && responseData?.data?.requires_password_setup) {
        const setPasswordUrl = responseData?.data?.set_password_url;
        if (setPasswordUrl) {
          // Only redirect if we're not already on the set-password page
          const setPasswordPath = window.location.pathname;
          if (!setPasswordPath.includes('/auth/set-password')) {
            // Redirect to set-password page with token
            window.location.href = setPasswordUrl;
            return;
          }
        }
      }
      console.error('🔍 Auth Provider - Session check error:', error);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    // Check if we just logged in (sessionStorage flag)
    const justLoggedIn = sessionStorage.getItem('just_logged_in') === 'true';
    // Check if we just impersonated (sessionStorage flag)
    const justImpersonated = sessionStorage.getItem('just_impersonated') === 'true';
    
    if (justLoggedIn || justImpersonated) {
      // Don't clear the flag yet - let GuestGuard handle it
      // Wait a bit longer after redirect to ensure session cookies are set
      // Then check session after login (skip the path check)
      const checkSessionAfterLogin = async () => {
        // Add a small delay to ensure cookies are properly set after redirect
        await new Promise(resolve => setTimeout(resolve, 200));
        
        try {
          const res = await sanctum.get('/api/v1/auth/me');
          const user = (res as any)?.data?.user ?? (res as any)?.data;
          
          if (user) {
            setState({ user: user ?? null, loading: false });
            // Now clear the flags after successful session check
            sessionStorage.removeItem('just_logged_in');
            sessionStorage.removeItem('just_impersonated');
          } else {
            console.warn('⚠️ Session check returned no user after login/impersonation');
            setState({ user: null, loading: false });
            // Clear flags even on failure to prevent infinite loop
            sessionStorage.removeItem('just_logged_in');
            sessionStorage.removeItem('just_impersonated');
          }
        } catch (error: any) {
          // Check if error is due to password requirement
          const responseData = error?.responseData;
          if (error?.httpStatus === 403 && responseData?.data?.requires_password_setup) {
            const setPasswordUrl = responseData?.data?.set_password_url;
            if (setPasswordUrl) {
              // Only redirect if we're not already on the set-password page
              const currentPath = window.location.pathname;
              if (!currentPath.includes('/auth/set-password')) {
                // Redirect to set-password page with token
                sessionStorage.removeItem('just_logged_in');
                sessionStorage.removeItem('just_impersonated');
                window.location.href = setPasswordUrl;
                return;
              } else {
                // Already on set-password page, just clear flags
                sessionStorage.removeItem('just_logged_in');
                sessionStorage.removeItem('just_impersonated');
                setState({ user: null, loading: false });
                return;
              }
            }
          }
          console.error('🔍 Auth Provider - Session check error after login/impersonation:', {
            error,
            message: error?.message,
            httpStatus: error?.httpStatus,
            response: error?.response,
          });
          setState({ user: null, loading: false });
          // Clear flags even on error to prevent infinite loop
          sessionStorage.removeItem('just_logged_in');
          sessionStorage.removeItem('just_impersonated');
        }
      };
      checkSessionAfterLogin();
      return () => {
        // No cleanup needed for async function
      };
    } else {
      // Add a small delay to ensure any logout operations complete first
      const timer = setTimeout(() => {
        checkUserSession();
      }, 100);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(() => {
    let userRole: UserRole | undefined = undefined;

    if (state.user) {
      // First, try to get role from direct 'role' property
      let roleValue: string | undefined = state.user.role;

      // If not found, try to extract from Spatie roles array
      if (!roleValue && Array.isArray(state.user.roles) && state.user.roles.length > 0) {
        // Get the first role name (users typically have one primary role)
        const firstRole = state.user.roles[0];
        roleValue = typeof firstRole === 'string' ? firstRole : firstRole?.name;
      }

      // Normalize role to lowercase and validate it's a valid UserRole
      if (roleValue) {
        const roleLower = roleValue.toLowerCase();
        const validRoles: UserRole[] = ['admin', 'company', 'case_manager'];

        if (validRoles.includes(roleLower as UserRole)) {
          userRole = roleLower as UserRole;
        } else {
          console.warn(
            '🔍 Auth Provider - Invalid role detected:',
            roleValue,
            'defaulting to case_manager'
          );
          userRole = 'case_manager';
        }
      }
    }

    const finalUser = state.user
      ? {
          ...state.user,
          role: userRole || undefined, // Don't default to admin - leave undefined if not found
        }
      : null;


    return {
      user: finalUser,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    };
  }, [checkUserSession, state.user, status]);

  const handleExtendSession = useCallback(() => {
    setShowTimeoutWarning(false);
    resetTimers();
  }, [resetTimers]);

  const handleLogoutNow = useCallback(async () => {
    setShowTimeoutWarning(false);
    try {
      await sanctum.post('/api/v1/auth/logout');
      setState({ user: null, loading: false });
      window.location.href = '/auth/sign-in';
    } catch (error) {
      console.error('Error during logout:', error);
      setState({ user: null, loading: false });
      window.location.href = '/auth/sign-in';
    }
  }, [setState]);

  return (
    <>
      <AuthContext value={memoizedValue}>{children}</AuthContext>
      <SessionTimeoutDialog
        open={showTimeoutWarning}
        timeRemaining={timeRemaining}
        onExtend={handleExtendSession}
        onLogout={handleLogoutNow}
      />
    </>
  );
}
