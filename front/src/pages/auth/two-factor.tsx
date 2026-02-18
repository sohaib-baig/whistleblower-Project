import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { MuiOtpInput } from 'mui-one-time-password-input';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useSearchParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

import { Form } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const metadata = { title: `Two-factor authentication | ${CONFIG.appName}` };

const TwoFactorSchema = z.object({
  code: z
    .string()
    .min(6, { message: 'Code is required' })
    .max(6, { message: 'Code must be 6 digits' }),
});

type TwoFactorSchemaType = z.infer<typeof TwoFactorSchema>;

// ----------------------------------------------------------------------

export default function Page() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const email = searchParams.get('email') ?? '';
  const method = searchParams.get('method') ?? 'email';

  const methods = useForm<TwoFactorSchemaType>({
    resolver: zodResolver(TwoFactorSchema),
    defaultValues: { code: '' },
  });

  const {
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (!email) {
      setErrorMessage('Missing email. Please login again.');
    } else if (method === 'app') {
      setInfoMessage('Enter the 6-digit code from your authenticator app.');
    } else {
      setInfoMessage('Enter the 6-digit code sent to your email address.');
    }
  }, [email, method]);

  const handleOtpChange = (value: string) => {
    setValue('code', value, { shouldValidate: true });
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!email) {
      setErrorMessage('Missing email. Please login again.');
      return;
    }

    try {
      setErrorMessage(null);
      await initSanctumCsrf();
      await sanctum.post('/api/v1/auth/2fa/verify', {
        email,
        code: data.code,
      });

      // After successful 2FA verification, set a flag to indicate we just logged in
      // This will help the auth provider check the session immediately after redirect
      sessionStorage.setItem('just_logged_in', 'true');
      

      // Small delay to ensure session is fully established before redirect
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Use window.location for reliable redirect after 2FA verification
      // This ensures the page fully reloads and the auth state is properly set
      window.location.href = CONFIG.auth.redirectPath;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to verify two-factor authentication code.';
      setErrorMessage(msg);
    }
  });

  return (
    <>
      <title>{metadata.title}</title>

      <Box sx={{ maxWidth: 420, mx: 'auto', py: 6 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Two-factor authentication
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          We&apos;ve added an extra layer of security to your account. Please enter the 6-digit code to
          continue.
        </Typography>

        {!!infoMessage && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {infoMessage}
          </Alert>
        )}

        {!!errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Form methods={methods} onSubmit={onSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <MuiOtpInput
              length={6}
              value={methods.watch('code')}
              onChange={handleOtpChange}
              TextFieldsProps={{ placeholder: '‒', inputMode: 'numeric' }}
            />

            <Button
              fullWidth
              color="inherit"
              size="large"
              type="submit"
              variant="contained"
              loading={isSubmitting}
            >
              Verify and continue
            </Button>
          </Box>
        </Form>
      </Box>
    </>
  );
}


