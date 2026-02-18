import type { StripeConfigurationFormValues } from 'src/types/stripe-configuration';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import {
  testStripeConnection,
  getStripeConfiguration,
  saveStripeConfiguration,
} from 'src/actions/stripe-configuration';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type StripeConfigurationFormProps = {
  onSuccess?: () => void;
};

export function StripeConfigurationForm({ onSuccess }: StripeConfigurationFormProps) {
  const { t } = useTranslate('navbar');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null);

  const createStripeConfigurationSchema = () =>
    z.object({
      clientId: z.string().min(1, t('dashboard.stripeConfiguration.validation.clientIdRequired')),
      secretKey: z.string().min(1, t('dashboard.stripeConfiguration.validation.secretKeyRequired')),
      productKey: z
        .string()
        .min(1, t('dashboard.stripeConfiguration.validation.webhookSecretRequired')),
    });

  const StripeConfigurationSchema = createStripeConfigurationSchema();

  const methods = useForm<StripeConfigurationFormValues>({
    resolver: zodResolver(StripeConfigurationSchema),
    defaultValues: {
      clientId: '',
      secretKey: '',
      productKey: '',
    },
  });

  const { reset, watch, handleSubmit } = methods;

  // Load existing configuration
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        const config = await getStripeConfiguration();
        if (config) {
          reset({
            clientId: config.clientId,
            secretKey: config.secretKey,
            productKey: config.productKey,
          });
        }
      } catch (error) {
        console.error('Error loading configuration:', error);
      }
    };

    loadConfiguration();
  }, [reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);
      await saveStripeConfiguration(data);
      toast.success(t('dashboard.stripeConfiguration.toast.saveSuccess'));
      onSuccess?.();
    } catch {
      toast.error(t('dashboard.stripeConfiguration.toast.saveError'));
    } finally {
      setLoading(false);
    }
  });

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setConnectionStatus(null);

      const formData = watch();
      const isValid = await testStripeConnection(formData);

      if (isValid) {
        setConnectionStatus('success');
        toast.success(t('dashboard.stripeConfiguration.toast.testSuccess'));
      } else {
        setConnectionStatus('error');
        toast.error(t('dashboard.stripeConfiguration.toast.testError'));
      }
    } catch {
      setConnectionStatus('error');
      toast.error(t('dashboard.stripeConfiguration.toast.testConnectionError'));
    } finally {
      setTesting(false);
    }
  };

  const handleCancel = () => {
    reset();
    setConnectionStatus(null);
  };

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text
          name="clientId"
          label={t('dashboard.stripeConfiguration.form.clientId')}
          placeholder={t('dashboard.stripeConfiguration.form.clientIdPlaceholder')}
          helperText={t('dashboard.stripeConfiguration.form.clientIdHelperText')}
        />

        <Field.Text
          name="secretKey"
          label={t('dashboard.stripeConfiguration.form.secretKey')}
          type="password"
          placeholder={t('dashboard.stripeConfiguration.form.secretKeyPlaceholder')}
          helperText={t('dashboard.stripeConfiguration.form.secretKeyHelperText')}
        />

        <Field.Text
          name="productKey"
          label={t('dashboard.stripeConfiguration.form.webhookSecret')}
          type="password"
          placeholder={t('dashboard.stripeConfiguration.form.webhookSecretPlaceholder')}
          helperText={t('dashboard.stripeConfiguration.form.webhookSecretHelperText')}
          sx={{ gridColumn: '1 / -1' }}
        />
      </Box>

      {connectionStatus && (
        <Box sx={{ mt: 2 }}>
          {connectionStatus === 'success' && (
            <Alert severity="success">{t('dashboard.stripeConfiguration.alert.testSuccess')}</Alert>
          )}
          {connectionStatus === 'error' && (
            <Alert severity="error">{t('dashboard.stripeConfiguration.alert.testError')}</Alert>
          )}
        </Box>
      )}

      <Stack direction="row" spacing={2} sx={{ mt: 3, alignItems: 'flex-end' }}>
        <Button type="submit" variant="contained" loading={loading} disabled={loading || testing}>
          {t('dashboard.stripeConfiguration.form.saveConfiguration')}
        </Button>

        <Button variant="outlined" onClick={handleCancel} disabled={loading || testing}>
          {t('dashboard.stripeConfiguration.form.cancel')}
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          onClick={handleTestConnection}
          loading={testing}
          disabled={loading || testing}
        >
          {t('dashboard.stripeConfiguration.form.testConnection')}
        </Button>
      </Stack>

      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>{t('dashboard.stripeConfiguration.form.securityNote')}</strong>{' '}
          {t('dashboard.stripeConfiguration.form.securityNoteText')}
        </Typography>
      </Box>
    </Form>
  );
}
