import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

const ForgotSchema = z.object({
  email: schemaUtils.email(),
});

type ForgotSchemaType = z.infer<typeof ForgotSchema>;

export default function Page() {
  const { t } = useTranslate('messages');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const metadata = { title: `${t('forgotPassword.title')} | ${CONFIG.appName}` };

  const methods = useForm<ForgotSchemaType>({
    resolver: zodResolver(ForgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = methods.handleSubmit(async ({ email }) => {
    try {
      setMessage(null);
      setError(null);
      await initSanctumCsrf();
      const res = await sanctum.post('/api/v1/password/forgot', { email });
      const msg = (res as any)?.message || (res as any)?.data?.message;
      setMessage(msg ?? t('forgotPassword.successMessage'));
    } catch (e: any) {
      setError(e?.message ?? t('forgotPassword.errorMessage'));
    }
  });

  return (
    <>
      <title>{metadata.title}</title>
      
      <Box sx={{ maxWidth: 420, mx: 'auto', py: 6 }}>
        {/* Icon */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify
              icon="solar:lock-password-bold"
              width={80}
              sx={{
                color: 'success.main',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'warning.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid',
                borderColor: 'background.paper',
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: 'common.white',
                  fontWeight: 'bold',
                  lineHeight: 1,
                }}
              >
                ?
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Title */}
        <Typography variant="h4" sx={{ mb: 1, textAlign: 'center', fontWeight: 600 }}>
          {t('forgotPassword.pageTitle')}
        </Typography>

        {/* Description */}
        <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
          {t('forgotPassword.description')}
        </Typography>

        {/* Alerts */}
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

        {/* Form */}
        <Form methods={methods} onSubmit={onSubmit}>
          <Field.Text
            name="email"
            label={t('forgotPassword.emailAddress')}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { placeholder: t('forgotPassword.emailPlaceholder') },
            }}
          />
          <Button
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            sx={{ mt: 2 }}
          >
            {t('forgotPassword.sendRequest')}
          </Button>
        </Form>

        {/* Return to sign in link */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Link
            component={RouterLink}
            href={paths.auth.jwt.signIn}
            variant="body2"
            color="inherit"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Iconify icon="eva:arrow-back-fill" width={16} />
            {t('forgotPassword.returnToSignIn')}
          </Link>
        </Box>
      </Box>
    </>
  );
}
