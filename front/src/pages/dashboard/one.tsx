import { useEffect } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export default function Page() {
  const router = useRouter();
  const { user } = useAuthContext();

  useEffect(() => {
    // Redirect admin, company, and case_manager users to analytics page
    const userRole = user?.role?.toLowerCase();
    if (userRole === 'admin' || userRole === 'company' || userRole === 'case_manager') {
      router.replace(paths.dashboard.overview.analytics);
    }
  }, [user, router]);

  // Show nothing while redirecting
  return null;
}
