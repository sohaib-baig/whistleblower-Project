import type { BoxProps } from '@mui/material/Box';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import AlertTitle from '@mui/material/AlertTitle';

import { paths } from 'src/routes/paths';

import { stopImpersonation } from 'src/actions/impersonation';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = BoxProps & {
  impersonatorName?: string;
  onStopImpersonation?: () => void;
};

export function ImpersonationBanner({
  impersonatorName,
  onStopImpersonation,
  sx,
  ...other
}: Props) {
  const handleStopImpersonation = useCallback(async () => {
    try {
      await stopImpersonation();
      toast.success('Returned to admin account. Page will reload...');

      // Verify session is established before redirecting
      // Wait a bit for the session cookie to be set and processed by the browser
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Ensure CSRF cookie is set
      await initSanctumCsrf();
      
      // Verify authentication by checking the session (retry up to 3 times)
      let sessionVerified = false;
      for (let i = 0; i < 3; i++) {
        try {
          const meResponse = await sanctum.get('/api/v1/auth/me');
          const userData = (meResponse as any)?.data?.user ?? (meResponse as any)?.data;
          if (userData) {
            sessionVerified = true;
            break;
          }
        } catch (authError) {
          if (i < 2) {
            // Wait a bit longer before retrying
            await new Promise((resolve) => setTimeout(resolve, 500));
          } else {
            console.error('Session verification failed after retries:', authError);
          }
        }
      }

      if (!sessionVerified) {
        toast.error('Session verification failed. Please try again.');
        return;
      }

      // Set flag to indicate we just logged back in as admin
      sessionStorage.setItem('just_logged_in', 'true');
      
      // Redirect to analytics dashboard
      const redirectPath = paths.dashboard.overview.analytics;
      
      // Use window.location.href for full page reload to ensure session is properly checked
      window.location.href = redirectPath;

      onStopImpersonation?.();
    } catch (err) {
      console.error('Failed to stop impersonation:', err);
      toast.error('Failed to return to admin account. Please try again.');
    }
  }, [onStopImpersonation]);

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1300,
        ...sx,
      }}
      {...other}
    >
      <Alert
        severity="warning"
        icon={<Iconify icon="solar:danger-bold" width={24} />}
        action={
          <Button
            color="inherit"
            size="small"
            variant="outlined"
            startIcon={<Iconify icon="material-symbols:exit-to-app" />}
            onClick={handleStopImpersonation}
            sx={{
              borderColor: 'currentColor',
              '&:hover': {
                borderColor: 'currentColor',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            Switch Back to Admin
          </Button>
        }
        sx={{
          borderRadius: 0,
          '& .MuiAlert-action': {
            alignItems: 'center',
          },
        }}
      >
        <AlertTitle sx={{ mb: 0.5 }}>
          <strong>Impersonation Mode Active</strong>
        </AlertTitle>
        {impersonatorName && (
          <Box component="span" sx={{ typography: 'body2' }}>
            You are viewing as another user. Click &quot;Switch Back to Admin&quot; to return to{' '}
            <strong>{impersonatorName}</strong>&apos;s account.
          </Box>
        )}
        {!impersonatorName && (
          <Box component="span" sx={{ typography: 'body2' }}>
            You are viewing as another user. Click &quot;Switch Back to Admin&quot; to return to
            your admin account.
          </Box>
        )}
      </Alert>
    </Box>
  );
}
