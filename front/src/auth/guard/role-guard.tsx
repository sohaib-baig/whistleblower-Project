import type { ReactNode } from 'react';
import type { UserRole } from '../roles';

import { Box, Alert, Container } from '@mui/material';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

type RoleGuardProps = {
  children: ReactNode;
  requiredRoles?: UserRole[];
  fallback?: ReactNode;
};

export function RoleGuard({ children, requiredRoles, fallback }: RoleGuardProps) {
  const { user } = useAuthContext();

  // If no specific roles required, allow access
  if (!requiredRoles || requiredRoles.length === 0) {
    return <>{children}</>;
  }

  const userRole = user?.role as UserRole | undefined;

  // Check if user has required role
  const hasRequiredRole = requiredRoles.includes(userRole as UserRole);

  if (!hasRequiredRole) {
    return (
      fallback || (
        <Container>
          <Box sx={{ py: 12, textAlign: 'center' }}>
            <Alert severity="error" sx={{ maxWidth: 480, mx: 'auto' }}>
              You don&apos;t have permission to access this page
            </Alert>
          </Box>
        </Container>
      )
    );
  }

  return <>{children}</>;
}
