import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

import { Form, Field } from 'src/components/hook-form';

const metadata = { title: `Set password | ${CONFIG.appName}` };

const SetSchema = z
  .object({
    email: z.string().email('Invalid email'),
    token: z.string().min(10, 'Invalid token'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    password_confirmation: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords must match',
    path: ['password_confirmation'],
  });

type SetSchemaType = z.infer<typeof SetSchema>;

export default function Page() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initial = useMemo(
    () => ({
      email: params.get('email') ?? '',
      token: params.get('token') ?? '',
      password: '',
      password_confirmation: '',
    }),
    [params]
  );

  useEffect(() => {
    if (!initial.email || !initial.token) {
      setError('Activation link is invalid or expired.');
    }
  }, [initial]);

  const methods = useForm<SetSchemaType>({
    resolver: zodResolver(SetSchema),
    defaultValues: initial,
  });

  const onSubmit = methods.handleSubmit(async (data) => {
    try {
      setMessage(null);
      setError(null);
      await initSanctumCsrf();
      const res = await sanctum.post('/api/v1/password/set', data);
      const msg = (res as any)?.message || (res as any)?.data?.message;
      setMessage(msg ?? 'Password has been set. Redirecting to login…');
      setRedirecting(true);
    } catch (e: any) {
      // Extract specific validation errors from the response
      const responseData = e?.responseData || e?.response?.data;
      const errors = responseData?.data?.errors || responseData?.errors;
      
      if (errors) {
        // Get the first error message from any field
        const firstError = Object.values(errors).flat()[0];
        if (firstError && typeof firstError === 'string') {
          setError(firstError);
          // Also set field-specific errors if available
          if (errors.password) {
            methods.setError('password', { 
              type: 'server', 
              message: Array.isArray(errors.password) ? errors.password[0] : errors.password 
            });
          }
          if (errors.password_confirmation) {
            methods.setError('password_confirmation', { 
              type: 'server', 
              message: Array.isArray(errors.password_confirmation) ? errors.password_confirmation[0] : errors.password_confirmation 
            });
          }
        } else {
          setError(e?.message ?? 'Failed to set password');
        }
      } else {
        setError(e?.message ?? 'Failed to set password');
      }
    }
  });

  const { register } = methods;

  useEffect(() => {
    if (redirecting) {
      const timer = setTimeout(() => {
        navigate(paths.auth.jwt.signIn, { replace: true });
      }, 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [redirecting, navigate]);

  return (
    <>
      <title>{metadata.title}</title>
      {!!message && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}
      {!!error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      <Form methods={methods} onSubmit={onSubmit}>
        <input type="hidden" {...register('email')} />
        <input type="hidden" {...register('token')} />

        <Stack spacing={2.5}>
          <Box>
            <Field.Text
              name="password"
              label="Create password"
              type="password"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Password must be at least 8 characters and contain: uppercase letter, lowercase letter, and special character
            </Typography>
          </Box>
          <Field.Text
            name="password_confirmation"
            label="Confirm password"
            type="password"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button fullWidth size="large" type="submit" variant="contained">
            Activate account
          </Button>
        </Stack>
      </Form>
    </>
  );
}
