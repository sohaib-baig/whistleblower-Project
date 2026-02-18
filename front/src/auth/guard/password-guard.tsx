import { Navigate } from 'react-router';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { getPasswordSession, isPasswordSessionValid } from 'src/utils/password-session';

// ----------------------------------------------------------------------

interface PasswordGuardProps {
  children: React.ReactNode;
  companySlug: string;
  requiredPassword?: string;
}

// ----------------------------------------------------------------------

export function PasswordGuard({ children, companySlug, requiredPassword }: PasswordGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const session = getPasswordSession(companySlug);
        const isValid = isPasswordSessionValid(companySlug);

        // If requiredPassword is provided, validate against it
        if (requiredPassword && session) {
          const passwordMatch = session.password === requiredPassword;
          setIsAuthenticated(isValid && passwordMatch);
        } else {
          setIsAuthenticated(isValid);
        }
      } catch (error) {
        console.error('Password guard authentication error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, [companySlug, requiredPassword]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Verifying access...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/company/${companySlug}/login`} replace />;
  }

  return <>{children}</>;
}

// ----------------------------------------------------------------------

interface PasswordGuardWithFallbackProps extends PasswordGuardProps {
  fallback?: React.ReactNode;
}

export function PasswordGuardWithFallback({
  children,
  companySlug,
  requiredPassword,
  fallback,
}: PasswordGuardWithFallbackProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const session = getPasswordSession(companySlug);
        const isValid = isPasswordSessionValid(companySlug);

        if (requiredPassword && session) {
          const passwordMatch = session.password === requiredPassword;
          setIsAuthenticated(isValid && passwordMatch);
        } else {
          setIsAuthenticated(isValid);
        }
      } catch (error) {
        console.error('Password guard authentication error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, [companySlug, requiredPassword]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Verifying access...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return fallback || <Navigate to={`/company/${companySlug}/login`} replace />;
  }

  return <>{children}</>;
}
