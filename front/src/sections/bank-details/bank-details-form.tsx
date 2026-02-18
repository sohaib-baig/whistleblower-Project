import type { BankDetailsFormValues } from 'src/types/bank-details';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { getBankDetails, saveBankDetails } from 'src/actions/bank-details';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type BankDetailsFormProps = {
  onSuccess?: () => void;
};

export function BankDetailsForm({ onSuccess }: BankDetailsFormProps) {
  const { t } = useTranslate('navbar');
  const [loading, setLoading] = useState(false);

  const createBankDetailsSchema = () =>
    z.object({
      iban: z
        .string()
        .min(1, t('dashboard.bankDetails.validation.ibanRequired'))
        // Allow spaces between groups; general IBAN pattern: CCdd + up to 30 alphanumerics/spaces
        .regex(
          /^[A-Z]{2}[0-9]{2}[A-Z0-9 ]{8,30}$/i,
          t('dashboard.bankDetails.validation.ibanInvalid')
        ),
      bic: z
        .string()
        .min(1, t('dashboard.bankDetails.validation.bicRequired'))
        .regex(
          /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i,
          t('dashboard.bankDetails.validation.bicInvalid')
        ),
      bankAccount: z
        .string()
        .min(1, t('dashboard.bankDetails.validation.bankAccountRequired'))
        // Allow letters, numbers, spaces and dashes
        .regex(/^[A-Za-z0-9 -]{4,64}$/i, t('dashboard.bankDetails.validation.bankAccountInvalid')),
    });

  const BankDetailsSchema = createBankDetailsSchema();

  const methods = useForm<BankDetailsFormValues>({
    resolver: zodResolver(BankDetailsSchema),
    defaultValues: {
      iban: '',
      bic: '',
      bankAccount: '',
    },
  });

  const { reset, handleSubmit } = methods;

  // Load existing bank details
  useEffect(() => {
    const loadBankDetails = async () => {
      try {
        const details = await getBankDetails();
        if (details) {
          reset({
            iban: details.iban,
            bic: details.bic,
            bankAccount: details.bankAccount,
          });
        }
      } catch (error) {
        console.error('Error loading bank details:', error);
      }
    };

    loadBankDetails();
  }, [reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setLoading(true);
      await saveBankDetails(data);
      toast.success(t('dashboard.bankDetails.toast.saveSuccess'));
      onSuccess?.();
    } catch {
      toast.error(t('dashboard.bankDetails.toast.saveError'));
    } finally {
      setLoading(false);
    }
  });

  const handleCancel = () => {
    reset();
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
          name="iban"
          label={t('dashboard.bankDetails.form.iban')}
          placeholder={t('dashboard.bankDetails.form.ibanPlaceholder')}
          helperText={t('dashboard.bankDetails.form.ibanHelperText')}
        />

        <Field.Text
          name="bic"
          label={t('dashboard.bankDetails.form.bic')}
          placeholder={t('dashboard.bankDetails.form.bicPlaceholder')}
          helperText={t('dashboard.bankDetails.form.bicHelperText')}
        />

        <Field.Text
          name="bankAccount"
          label={t('dashboard.bankDetails.form.bankAccount')}
          placeholder={t('dashboard.bankDetails.form.bankAccountPlaceholder')}
          helperText={t('dashboard.bankDetails.form.bankAccountHelperText')}
          sx={{ gridColumn: '1 / -1' }}
        />
      </Box>

      <Stack direction="row" spacing={2} sx={{ mt: 3, alignItems: 'flex-end' }}>
        <Button type="submit" variant="contained" loading={loading} disabled={loading}>
          {t('dashboard.bankDetails.form.saveBankDetails')}
        </Button>

        <Button variant="outlined" onClick={handleCancel} disabled={loading}>
          {t('dashboard.bankDetails.form.cancel')}
        </Button>
      </Stack>

      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>{t('dashboard.bankDetails.form.securityNote')}</strong>{' '}
          {t('dashboard.bankDetails.form.securityNoteText')}
        </Typography>
      </Box>
    </Form>
  );
}
