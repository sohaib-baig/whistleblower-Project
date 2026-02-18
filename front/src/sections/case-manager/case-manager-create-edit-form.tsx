import type { ICaseManagerItem } from 'src/types/case-manager';

import { z as zod } from 'zod';
import { useMemo, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { endpoints } from 'src/lib/axios';
import { useTranslate } from 'src/locales';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';
import { createCaseManager, updateCaseManager } from 'src/actions/case-manager';

import { toast } from 'src/components/snackbar';
import { RHFTextField, RHFPhoneInput } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type Props = {
  currentCaseManager?: ICaseManagerItem;
};

type CaseManagerValues = {
  name: string;
  email: string;
  password?: string;
  phone: string;
};

export function CaseManagerCreateEditForm({ currentCaseManager }: Props) {
  const { t } = useTranslate('navbar');
  const router = useRouter();

  const duplicateEmailMessage = t('dashboard.caseManager.emailExists', {
    defaultValue: 'This email address is already registered.',
  });
  const duplicatePhoneMessage = t('dashboard.caseManager.phoneExists', {
    defaultValue: 'This phone number is already registered.',
  });
  const emailValidationFailedMessage = t('dashboard.caseManager.emailValidationFailed', {
    defaultValue: 'Unable to validate email right now. Please try again.',
  });
  const phoneValidationFailedMessage = t('dashboard.caseManager.phoneValidationFailed', {
    defaultValue: 'Unable to validate phone number right now. Please try again.',
  });

  const CaseManagerSchema = zod.object({
    name: zod.string().min(2, t('dashboard.caseManager.nameMinLength')),
    email: zod.string().email(t('dashboard.caseManager.invalidEmail')),
    password: zod
      .string()
      .min(8, t('dashboard.caseManager.passwordMinLength'))
      .optional()
      .or(zod.literal('')),
    phone: zod.string().min(10, t('dashboard.caseManager.phoneMinLength')),
  });

  const defaultValues: CaseManagerValues = {
    name: '',
    email: '',
    password: '',
    phone: '',
  };

  const methods = useForm<CaseManagerValues>({
    resolver: zodResolver(CaseManagerSchema),
    defaultValues,
    values: currentCaseManager
      ? {
          name: currentCaseManager.name,
          email: currentCaseManager.email,
          password: '',
          phone: currentCaseManager.phone,
        }
      : undefined,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting, errors },
    setError,
    clearErrors,
    getValues,
  } = methods;

  const normalizedOriginalEmail = useMemo(() => {
    if (!currentCaseManager?.email) {
      return '';
    }
    return currentCaseManager.email.trim().toLowerCase();
  }, [currentCaseManager?.email]);

  const normalizedOriginalPhone = useMemo(() => {
    if (!currentCaseManager?.phone) {
      return '';
    }
    return currentCaseManager.phone.trim();
  }, [currentCaseManager?.phone]);

  const handleCheckEmail = useCallback(async () => {
    const email = (getValues('email') || '').trim().toLowerCase();

    if (!email) {
      clearErrors('email');
      return;
    }

    if (normalizedOriginalEmail && email === normalizedOriginalEmail) {
      clearErrors('email');
      return;
    }

    try {
      await initSanctumCsrf();
      const res = await sanctum.post(endpoints.auth.checkEmail, { email });
      const exists = !!(res.data as any)?.exists;

      if (exists) {
        setError('email', {
          type: 'duplicate',
          message: duplicateEmailMessage,
        });
      } else {
        clearErrors('email');
      }
    } catch (err: any) {
      const message = err?.message || emailValidationFailedMessage;
      setError('email', {
        type: 'manual',
        message,
      });
    }
  }, [
    clearErrors,
    duplicateEmailMessage,
    emailValidationFailedMessage,
    getValues,
    normalizedOriginalEmail,
    setError,
  ]);

  const handleCheckPhone = useCallback(async () => {
    const phone = (getValues('phone') || '').trim();

    if (!phone) {
      clearErrors('phone');
      return;
    }

    if (normalizedOriginalPhone && phone === normalizedOriginalPhone) {
      clearErrors('phone');
      return;
    }

    try {
      await initSanctumCsrf();
      const res = await sanctum.post(endpoints.auth.checkPhone, { phone });
      const exists = !!(res.data as any)?.exists;

      if (exists) {
        setError('phone', {
          type: 'duplicate',
          message: duplicatePhoneMessage,
        });
      } else {
        clearErrors('phone');
      }
    } catch (err: any) {
      const message = err?.message || phoneValidationFailedMessage;
      setError('phone', {
        type: 'manual',
        message,
      });
    }
  }, [
    clearErrors,
    duplicatePhoneMessage,
    getValues,
    normalizedOriginalPhone,
    phoneValidationFailedMessage,
    setError,
  ]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Remove empty password field when editing
      const submitData = { ...data };
      if (currentCaseManager && !submitData.password) {
        delete submitData.password;
      }

      if (currentCaseManager) {
        // Update existing case manager
        await updateCaseManager(currentCaseManager.id, submitData);
        toast.success(t('dashboard.caseManager.caseManagerUpdated'));
      } else {
        // Create new case manager
        await createCaseManager(submitData);
        toast.success(t('dashboard.caseManager.caseManagerCreated'));
      }
      reset();
      router.push(paths.dashboard.caseManager.list);
    } catch (error: any) {
      console.error('Failed to save case manager:', error);

      const fieldErrors = error?.errors;
      if (fieldErrors && typeof fieldErrors === 'object') {
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          const firstMessage = Array.isArray(messages) ? messages[0] : messages;
          if (typeof firstMessage === 'string') {
            if (
              field === 'email' ||
              field === 'phone' ||
              field === 'name' ||
              field === 'password'
            ) {
              setError(field as keyof CaseManagerValues, {
                type: 'server',
                message: firstMessage,
              });
            }
          }
        });
      }

      const fallbackMessage =
        error?.message ||
        t('dashboard.caseManager.failedToSave', {
          defaultValue: 'Failed to save case manager. Please try again.',
        });
      toast.error(fallbackMessage);
    }
  });

  return (
    <FormProvider {...methods}>
      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
            }}
          >
            <RHFTextField name="name" label={t('dashboard.caseManager.fullName')} />

            <RHFTextField
              name="email"
              label={t('dashboard.caseManager.emailAddress')}
              onBlur={handleCheckEmail}
            />

            <RHFTextField
              name="password"
              label={t('dashboard.caseManager.password')}
              type="password"
              helperText={
                currentCaseManager
                  ? t('dashboard.caseManager.passwordPlaceholder')
                  : t('dashboard.caseManager.passwordHelperText')
              }
            />

            <RHFPhoneInput
              name="phone"
              label={t('dashboard.caseManager.phoneNumber')}
              onBlur={handleCheckPhone}
            />
          </Box>
        </Card>

        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button variant="outlined" onClick={() => reset()} disabled={isSubmitting}>
            {t('dashboard.caseManager.reset')}
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting} onClick={onSubmit}>
            {isSubmitting ? t('dashboard.caseManager.saving') : t('dashboard.caseManager.save')}
          </Button>
        </Stack>

        {/* Debug: Show form errors */}
        {Object.keys(errors).length > 0 && (
          <Card sx={{ p: 2, bgcolor: 'error.lighter' }}>
            <Stack spacing={1}>
              <strong>Form Validation Errors:</strong>
              {Object.entries(errors).map(([field, error]) => (
                <Box key={field}>
                  <strong>{field}:</strong> {error?.message}
                </Box>
              ))}
            </Stack>
          </Card>
        )}

        {/* Debug: Show current form values - HIDDEN */}
        {/* <Card sx={{ p: 2, bgcolor: 'grey.100' }}>
          <Stack spacing={1}>
            <strong>Current Form Values:</strong>
            <pre>{JSON.stringify(values, null, 2)}</pre>
          </Stack>
        </Card> */}
      </Stack>
    </FormProvider>
  );
}
