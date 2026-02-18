import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function SignupSuccessPage() {
  const router = useRouter();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || !orderId) {
        setVerificationError('Missing session or order information');
        setIsVerifying(false);
        return;
      }

      try {
        await initSanctumCsrf();
        await sanctum.post(endpoints.orders.verifyPayment, {
          session_id: sessionId,
          order_id: orderId,
        });

        // Payment verified successfully
        setIsVerifying(false);
      } catch (error: any) {
        console.error('Payment verification failed:', error);
        setVerificationError(error?.message || 'Failed to verify payment');
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, orderId]);

  const handleGoToLogin = () => {
    router.push(paths.auth.jwt.signIn);
  };

  if (isVerifying) {
    return (
      <Container sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          Verifying your payment...
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Please wait while we confirm your payment with Stripe.
        </Typography>
      </Container>
    );
  }

  if (verificationError) {
    return (
      <Container sx={{ py: 10 }}>
        <Card sx={{ p: 5, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 3,
              borderRadius: '50%',
              bgcolor: 'error.lighter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="solar:close-circle-bold" width={48} sx={{ color: 'error.main' }} />
          </Box>

          <Typography variant="h4" sx={{ mb: 2 }}>
            Verification Failed
          </Typography>

          <Alert severity="error" sx={{ mb: 3 }}>
            {verificationError}
          </Alert>

          <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
            Please contact support if you believe this is an error.
          </Typography>

          <Button variant="contained" size="large" onClick={handleGoToLogin}>
            Go to Login
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 10 }}>
      <Card sx={{ p: 5, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            mx: 'auto',
            mb: 3,
            borderRadius: '50%',
            bgcolor: 'success.lighter',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify icon="eva:checkmark-fill" width={48} sx={{ color: 'success.main' }} />
        </Box>

        <Typography variant="h4" sx={{ mb: 2 }}>
          Payment Successful!
        </Typography>

        <Typography variant="body1" sx={{ mb: 1, color: 'text.secondary' }}>
          Thank you for subscribing to Wisling!
        </Typography>

        <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
          Your account has been created successfully. A confirmation email with your login
          credentials has been sent to your email address.
        </Typography>

        {orderId && (
          <Typography variant="caption" sx={{ display: 'block', mb: 4, color: 'text.disabled' }}>
            Order ID: {orderId}
          </Typography>
        )}

        <Button
          variant="contained"
          size="large"
          onClick={handleGoToLogin}
          startIcon={<Iconify icon="eva:arrow-forward-fill" />}
        >
          Go to Login
        </Button>
      </Card>
    </Container>
  );
}
