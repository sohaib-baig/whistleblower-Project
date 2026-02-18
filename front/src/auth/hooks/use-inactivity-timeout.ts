import { useRef, useEffect, useCallback } from 'react';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import sanctum from 'src/lib/axios-sanctum';

import { signOut } from 'src/auth/context/jwt/action';

// ----------------------------------------------------------------------

/**
 * Configuration for inactivity timeout
 * Default: 1 minute of inactivity triggers warning, 2 minutes triggers logout
 */
const INACTIVITY_WARNING_TIME = 1 * 60 * 1000; // 1 minute in milliseconds
const INACTIVITY_LOGOUT_TIME = 2 * 60 * 1000; // 2 minutes in milliseconds
const SESSION_CHECK_INTERVAL = CONFIG.auth.inactivityTimeout.sessionCheckInterval * 60 * 1000;

// Events that indicate user activity
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click',
  'keydown',
] as const;

// ----------------------------------------------------------------------

type UseInactivityTimeoutOptions = {
  enabled?: boolean;
  warningTime?: number; // Time before showing warning (ms)
  logoutTime?: number; // Time before auto logout (ms)
  onWarning?: (timeRemaining: number) => void;
  onLogout?: () => void;
};

/**
 * Hook to handle auto-logout based on inactivity
 * Tracks user activity and validates session via API
 */
export function useInactivityTimeout(options: UseInactivityTimeoutOptions = {}) {
  const {
    enabled = true,
    warningTime = INACTIVITY_WARNING_TIME,
    logoutTime = INACTIVITY_LOGOUT_TIME,
    onWarning,
    onLogout,
  } = options;

  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLoggingOutRef = useRef<boolean>(false);
  
  // Store options in refs to avoid recreating callbacks
  const optionsRef = useRef({ enabled, warningTime, logoutTime, onWarning, onLogout });
  optionsRef.current = { enabled, warningTime, logoutTime, onWarning, onLogout };

  // Check session validity via API
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      await sanctum.get('/api/v1/auth/me');
      return true;
    } catch (error: unknown) {
      const httpError = error as { httpStatus?: number };
      if (httpError?.httpStatus === 401 || httpError?.httpStatus === 403) {
        return false;
      }
      return true;
    }
  }, []);

  // Handle logout - use refs to avoid dependency issues
  const handleLogoutRef = useRef<(() => Promise<void>) | null>(null);
  
  const handleLogout = useCallback(async () => {
    if (isLoggingOutRef.current) {
      return;
    }

    isLoggingOutRef.current = true;

    // Clear all timers immediately
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (sessionCheckTimerRef.current) {
      clearInterval(sessionCheckTimerRef.current);
      sessionCheckTimerRef.current = null;
    }

    // Call custom logout handler first to clear UI state
    if (optionsRef.current.onLogout) {
      optionsRef.current.onLogout();
    }

    // Perform logout via API to invalidate server session
    // Use a timeout to ensure it completes, but don't block navigation
    try {
      // Set a flag in sessionStorage to prevent auto-login on refresh
      sessionStorage.setItem('logout_in_progress', 'true');
      
      // Attempt logout with a timeout
      const logoutPromise = signOut();
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000));
      
      await Promise.race([logoutPromise, timeoutPromise]);
    } catch (error) {
      console.error('Auto-logout: SignOut API error (continuing):', error);
    }

    // Clear the logout flag after a delay to allow navigation
    setTimeout(() => {
      sessionStorage.removeItem('logout_in_progress');
    }, 1000);

    // Force navigation using window.location for reliability
    window.location.href = paths.auth.jwt.signIn;
  }, []);
  
  // Store the callback in ref
  handleLogoutRef.current = handleLogout;

  // Reset timers on user activity
  const resetTimers = useCallback(() => {
    const opts = optionsRef.current;
    
    if (!opts.enabled || isLoggingOutRef.current) {
      return;
    }

    const now = Date.now();
    lastActivityRef.current = now;
    warningShownRef.current = false;

    // Clear existing timers
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }

    // Set warning timer
    warningTimerRef.current = setTimeout(() => {
      const timeRemaining = opts.logoutTime - opts.warningTime;

      if (timeRemaining > 0 && !warningShownRef.current) {
        warningShownRef.current = true;

        // Clear any existing logout timer
        if (logoutTimerRef.current) {
          clearTimeout(logoutTimerRef.current);
          logoutTimerRef.current = null;
        }

        // Call warning callback
        if (opts.onWarning) {
          opts.onWarning(timeRemaining);
        }

        // Set logout timer for remaining time
        logoutTimerRef.current = setTimeout(() => {
          const logoutFn = handleLogoutRef.current;
          if (logoutFn) {
            logoutFn();
          }
        }, timeRemaining);
      }
    }, opts.warningTime);

    // Set initial logout timer (backup)
    logoutTimerRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        const logoutFn = handleLogoutRef.current;
        if (logoutFn) {
          logoutFn();
        }
      }
    }, opts.logoutTime);
  }, []);

  // Handle user activity
  const handleActivity = useCallback(() => {
    // Don't reset if warning is shown - user must click "Stay Logged In"
    if (warningShownRef.current) {
      return;
    }
    resetTimers();
  }, [resetTimers]);

  // Main effect - only runs when enabled changes, not on every render
  useEffect(() => {
    if (!enabled) {
      // Clear all timers when disabled
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
      if (sessionCheckTimerRef.current) {
        clearInterval(sessionCheckTimerRef.current);
        sessionCheckTimerRef.current = null;
      }
      return undefined;
    }

    // Initialize timers
    resetTimers();

    // Add activity event listeners
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Periodically check session validity
    sessionCheckTimerRef.current = setInterval(async () => {
      const isValid = await checkSession();
      if (!isValid) {
        const logoutFn = handleLogoutRef.current;
        if (logoutFn) {
          logoutFn();
        }
      }
    }, SESSION_CHECK_INTERVAL);

    // Cleanup
    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
      if (sessionCheckTimerRef.current) {
        clearInterval(sessionCheckTimerRef.current);
      }
    };
    // Only depend on enabled - other values are in refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Return functions
  return {
    resetTimers,
    getTimeRemaining: () => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      return Math.max(0, logoutTime - timeSinceActivity);
    },
  };
}
