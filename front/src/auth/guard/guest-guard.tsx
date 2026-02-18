import { useState, useEffect } from 'react';

import { CONFIG } from 'src/global-config';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

type GuestGuardProps = {
  children: React.ReactNode;
};

export function GuestGuard({ children }: GuestGuardProps) {
  const { loading, authenticated } = useAuthContext();

  // Always redirect to the configured redirect path (dashboard/analytics) after login
  // regardless of any returnTo parameter
  const returnTo = CONFIG.auth.redirectPath;

  const [isChecking, setIsChecking] = useState(true);

  const checkPermissions = async (): Promise<void> => {
    // Wait for loading to complete
    if (loading) {
      return;
    }

    // Check if we just logged in (give it a moment for session to be established)
    const justLoggedIn = sessionStorage.getItem('just_logged_in') === 'true';
    
    if (justLoggedIn) {
      // Wait a bit for session check to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      // Clear the flag
      sessionStorage.removeItem('just_logged_in');
    }

    if (authenticated) {
      // Redirect authenticated users to the returnTo path
      // Using `window.location.href` instead of `router.replace` to avoid unnecessary re-rendering
      // that might be caused by the AuthGuard component
      window.location.href = returnTo;
      return;
    }

    setIsChecking(false);
  };

  useEffect(() => {
    checkPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, loading]);

  if (isChecking) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
