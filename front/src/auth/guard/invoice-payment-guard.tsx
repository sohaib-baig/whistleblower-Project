import { useLocation } from 'react-router';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fetchInvoices } from 'src/actions/invoice';

import { LoadingScreen } from 'src/components/loading-screen';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

// ----------------------------------------------------------------------

type InvoicePaymentGuardProps = {
  children: React.ReactNode;
};

/**
 * Guard that restricts company users with pending invoices
 * from accessing any pages except invoice listing and invoice details
 */
export function InvoicePaymentGuard({ children }: InvoicePaymentGuardProps) {
  const { user } = useAuthContext();
  const location = useLocation();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasPendingInvoice, setHasPendingInvoice] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Check if current path is an invoice page (allowed)
  const isInvoicePage = location.pathname.startsWith(paths.dashboard.invoice.root);

  useEffect(() => {
    const checkPendingInvoices = async () => {
      // Only check for company users
      if (user?.role !== 'company') {
        setIsChecking(false);
        return;
      }

      try {
        // Fetch invoices with pending status
        const result = await fetchInvoices({ status: 'pending', per_page: 1, page: 1 });
        
        // Check if there are any pending invoices
        const hasPending = result.data.some((invoice) => invoice.status === 'pending');
        setHasPendingInvoice(hasPending);
        
        // If user has pending invoice and tries to access non-invoice page, show dialog and redirect
        if (hasPending && !isInvoicePage) {
          setDialogOpen(true);
          // Auto-redirect to invoice page after showing message
          setTimeout(() => {
            router.push(paths.dashboard.invoice.root);
          }, 3000);
        }
      } catch (error) {
        console.error('Error checking pending invoices:', error);
        // On error, allow access (fail open)
        setHasPendingInvoice(false);
      } finally {
        setIsChecking(false);
      }
    };

    if (user) {
      checkPendingInvoices();
    } else {
      setIsChecking(false);
    }
  }, [user?.role, user, location.pathname, isInvoicePage, router]);

  if (isChecking) {
    return <LoadingScreen />;
  }

  // If company user has pending invoice and tries to access non-invoice page
  if (hasPendingInvoice && !isInvoicePage) {
    return (
      <>
        <Dialog open={dialogOpen} onClose={() => {}} maxWidth="sm" fullWidth>
          <DialogTitle>Payment Required</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              You have a pending invoice that needs to be paid before you can access other features.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please upload your payment receipt and wait for the admin to mark your invoice as paid.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Redirecting to invoices page...
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              variant="contained"
              onClick={() => {
                setDialogOpen(false);
                router.push(paths.dashboard.invoice.root);
              }}
            >
              Go to Invoices Now
            </Button>
          </DialogActions>
        </Dialog>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: 2,
            p: 3,
          }}
        >
          <Typography variant="h5" color="error">
            Payment Required
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            You have a pending invoice. Please upload your payment receipt and wait for admin
            approval before accessing other features.
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Redirecting to invoices page...
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push(paths.dashboard.invoice.root)}
            sx={{ mt: 2 }}
          >
            Go to Invoices
          </Button>
        </Box>
      </>
    );
  }

  return <>{children}</>;
}

