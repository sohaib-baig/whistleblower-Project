import { useState, useEffect, useCallback } from 'react';

import { usePathname } from 'src/routes/hooks';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export type ImpersonationStatus = {
  impersonating: boolean;
  can_leave_impersonation: boolean;
  impersonator?: {
    id: string;
    name: string;
    email: string;
  };
};

// ----------------------------------------------------------------------

/**
 * Start impersonating a user (login as)
 */
export async function startImpersonation(userId: string): Promise<any> {
  await initSanctumCsrf();
  const response = await sanctum.post(`${endpoints.impersonation.start(userId)}`);
  return response.data;
}

/**
 * Stop impersonating and return to admin account
 */
export async function stopImpersonation(): Promise<any> {
  await initSanctumCsrf();
  const response = await sanctum.post(endpoints.impersonation.stop);
  return response.data;
}

/**
 * Get current impersonation status
 */
export async function getImpersonationStatus(): Promise<ImpersonationStatus> {
  const response = await sanctum.get(endpoints.impersonation.status);
  return response.data;
}

// ----------------------------------------------------------------------

/**
 * Hook to check impersonation status
 */
export function useImpersonationStatus() {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const [status, setStatus] = useState<ImpersonationStatus>({
    impersonating: false,
    can_leave_impersonation: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getImpersonationStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to check impersonation status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check status');
      setStatus({
        impersonating: false,
        can_leave_impersonation: false,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus, pathname, user?.id]); // Refetch when pathname or user changes (e.g., after impersonation)

  return {
    status,
    loading,
    error,
    refetch: checkStatus,
  };
}
