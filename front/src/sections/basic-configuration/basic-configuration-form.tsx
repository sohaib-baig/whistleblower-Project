import type { BasicConfigurationFormValues } from 'src/types/basic-configuration';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';
import { getBasicConfiguration, saveBasicConfiguration } from 'src/actions/basic-configuration';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type BasicConfigurationFormProps = {
  onSuccess?: () => void;
};

export function BasicConfigurationForm({ onSuccess }: BasicConfigurationFormProps) {
  const { t } = useTranslate('navbar');
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [smallLogoPreview, setSmallLogoPreview] = useState<string | null>(null);

  const createBasicConfigurationSchema = () =>
    z.object({
      logo: z
        .instanceof(File)
        .optional()
        .refine(
          (file) => !file || file.size <= 5 * 1024 * 1024,
          t('dashboard.basicConfiguration.validation.fileSizeError')
        )
        .refine(
          (file) => !file || file.type.startsWith('image/'),
          t('dashboard.basicConfiguration.validation.fileTypeError')
        ),
      smallLogo: z
        .instanceof(File)
        .optional()
        .refine(
          (file) => !file || file.size <= 5 * 1024 * 1024,
          t('dashboard.basicConfiguration.validation.fileSizeError')
        )
        .refine(
          (file) => !file || file.type.startsWith('image/'),
          t('dashboard.basicConfiguration.validation.fileTypeError')
        ),
      defaultOpenStateDeadline: z
        .number()
        .min(1, t('dashboard.basicConfiguration.validation.deadlineMin'))
        .max(365, t('dashboard.basicConfiguration.validation.deadlineMax')),
      defaultClosedStateDeadline: z
        .number()
        .min(1, t('dashboard.basicConfiguration.validation.deadlineMin'))
        .max(365, t('dashboard.basicConfiguration.validation.deadlineMax')),
      invoiceNote: z
        .string()
        .max(500, t('dashboard.basicConfiguration.validation.invoiceNoteMax'))
        .optional(),
      vat: z
        .number()
        .min(0, t('dashboard.basicConfiguration.validation.vatMin'))
        .max(100, t('dashboard.basicConfiguration.validation.vatMax')),
      price: z.number().min(0, t('dashboard.basicConfiguration.validation.priceMin')),
      phoneHoursFrom: z
        .string()
        .regex(
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          t('dashboard.basicConfiguration.validation.timeFormatError')
        ),
      phoneHoursTo: z
        .string()
        .regex(
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          t('dashboard.basicConfiguration.validation.timeFormatError')
        ),
      deleteClosedCases: z.boolean(),
      deleteClosedCasesPeriod: z
        .number()
        .min(1)
        .optional()
        .nullable(),
      deleteClosedCasesPeriodType: z
        .enum(['daily', 'weekly', 'monthly', 'yearly'])
        .optional()
        .nullable(),
    });

  const BasicConfigurationSchema = createBasicConfigurationSchema();

  const methods = useForm<BasicConfigurationFormValues>({
    resolver: zodResolver(BasicConfigurationSchema),
    defaultValues: {
      defaultOpenStateDeadline: 30,
      defaultClosedStateDeadline: 90,
      invoiceNote: '',
      vat: 0,
      price: 0,
      phoneHoursFrom: '09:00',
      phoneHoursTo: '17:00',
      deleteClosedCases: false,
      deleteClosedCasesPeriod: null,
      deleteClosedCasesPeriodType: null,
    },
  });

  const { reset, handleSubmit, watch, register, setValue } = methods;

  // Load existing configuration
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        const config = await getBasicConfiguration();
        if (config) {
          reset({
            defaultOpenStateDeadline: config.defaultOpenStateDeadline,
            defaultClosedStateDeadline: config.defaultClosedStateDeadline,
            invoiceNote: config.invoiceNote || '',
            vat: config.vat,
            price: config.price,
            phoneHoursFrom: config.phoneHoursFrom,
            phoneHoursTo: config.phoneHoursTo,
            deleteClosedCases: config.deleteClosedCases,
            deleteClosedCasesPeriod: config.deleteClosedCasesPeriod || null,
            deleteClosedCasesPeriodType: config.deleteClosedCasesPeriodType || null,
          });
          // Set existing logo preview immediately
          if (config.logo) {
            setLogoPreview(config.logo);
          }
          // Set existing small logo preview immediately
          if (config.smallLogo) {
            setSmallLogoPreview(config.smallLogo);
          }
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
      await saveBasicConfiguration(data);
      toast.success(t('dashboard.basicConfiguration.toast.saveSuccess'));
      onSuccess?.();
    } catch {
      toast.error(t('dashboard.basicConfiguration.toast.saveError'));
    } finally {
      setLoading(false);
    }
  });

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Store file in RHF form state so it is sent to API
      setValue('logo', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setLogoPreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    // Clear the file input
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    // Clear logo in RHF state
    setValue('logo', undefined, { shouldValidate: true });
  };

  const handleSmallLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Store file in RHF form state so it is sent to API
      setValue('smallLogo', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setSmallLogoPreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSmallLogo = () => {
    setSmallLogoPreview(null);
    // Clear the file input
    const fileInput = document.getElementById('small-logo-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    // Clear small logo in RHF state
    setValue('smallLogo', undefined, { shouldValidate: true });
  };

  // const handleResetToDefaults = async () => {
  //   try {
  //     setLoading(true);
  //     await resetToDefaults();
  //     reset({
  //       defaultOpenStateDeadline: 30,
  //       defaultClosedStateDeadline: 90,
  //       invoiceNote: '',
  //       vat: 0,
  //       price: 0,
  //       phoneHoursFrom: '09:00',
  //       phoneHoursTo: '17:00',
  //       deleteClosedCases: false,
  //     });
  //     setLogoPreview(null);
  //     toast.success('Configuration reset to defaults!');
  //   } catch {
  //     toast.error('Failed to reset configuration');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleCancel = () => {
    reset();
    setLogoPreview(null);
    setSmallLogoPreview(null);
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
        {/* Logo Upload Section - Both logos in one row */}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ width: '100%' }}>
            {/* Company Logo */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('dashboard.basicConfiguration.form.companyLogo')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  <Button variant="outlined" component="span">
                    {logoPreview
                      ? t('dashboard.basicConfiguration.form.changeLogo')
                      : t('dashboard.basicConfiguration.form.uploadLogo')}
                  </Button>
                </label>
                {logoPreview && (
                  <>
                    <Box
                      component="img"
                      src={logoPreview}
                      alt="Logo preview"
                      sx={{
                        width: 100,
                        height: 100,
                        objectFit: 'contain',
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                      }}
                    />
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={handleRemoveLogo}
                    >
                      {t('dashboard.basicConfiguration.form.remove')}
                    </Button>
                  </>
                )}
              </Box>
            </Box>

            {/* Small Company Logo */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('dashboard.basicConfiguration.form.smallCompanyLogo')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSmallLogoChange}
                  style={{ display: 'none' }}
                  id="small-logo-upload"
                />
                <label htmlFor="small-logo-upload">
                  <Button variant="outlined" component="span">
                    {smallLogoPreview
                      ? t('dashboard.basicConfiguration.form.changeLogo')
                      : t('dashboard.basicConfiguration.form.uploadLogo')}
                  </Button>
                </label>
                {smallLogoPreview && (
                  <>
                    <Box
                      component="img"
                      src={smallLogoPreview}
                      alt="Small logo preview"
                      sx={{
                        width: 100,
                        height: 100,
                        objectFit: 'contain',
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                      }}
                    />
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={handleRemoveSmallLogo}
                    >
                      {t('dashboard.basicConfiguration.form.remove')}
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Stack>
        </Box>

        <Field.Text
          name="defaultOpenStateDeadline"
          label={t('dashboard.basicConfiguration.form.defaultOpenStateDeadline')}
          type="number"
          inputProps={{ min: 1, max: 365 }}
        />

        <Field.Text
          name="defaultClosedStateDeadline"
          label={t('dashboard.basicConfiguration.form.defaultClosedStateDeadline')}
          type="number"
          inputProps={{ min: 1, max: 365 }}
        />

        <Field.Text
          name="vat"
          label={t('dashboard.basicConfiguration.form.vat')}
          type="number"
          inputProps={{ min: 0, max: 100, step: 0.01 }}
        />

        <Field.Text
          name="price"
          label={t('dashboard.basicConfiguration.form.defaultPrice')}
          type="number"
          inputProps={{ min: 0, step: 0.01 }}
        />

        <Field.Text
          name="phoneHoursFrom"
          label={t('dashboard.basicConfiguration.form.phoneHoursFrom')}
          type="time"
          InputLabelProps={{ shrink: true }}
        />

        <Field.Text
          name="phoneHoursTo"
          label={t('dashboard.basicConfiguration.form.phoneHoursTo')}
          type="time"
          InputLabelProps={{ shrink: true }}
        />

        <Field.Text
          name="invoiceNote"
          label={t('dashboard.basicConfiguration.form.invoiceNote')}
          multiline
          rows={3}
          helperText={t('dashboard.basicConfiguration.form.invoiceNoteHelperText')}
        />

        <Box sx={{ gridColumn: '1 / -1' }}>
          <FormControlLabel
            control={
              <Switch {...register('deleteClosedCases')} checked={watch('deleteClosedCases')} />
            }
            label={t('dashboard.basicConfiguration.form.deleteClosedCases')}
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
            {t('dashboard.basicConfiguration.form.deleteClosedCasesHelperText')}
          </Typography>
        </Box>

        {watch('deleteClosedCases') && (
          <>
            <Field.Text
              name="deleteClosedCasesPeriod"
              label={t('dashboard.basicConfiguration.form.deleteClosedCasesPeriod')}
              type="number"
              inputProps={{ min: 1 }}
            />

            <Field.Select
              name="deleteClosedCasesPeriodType"
              label={t('dashboard.basicConfiguration.form.deleteClosedCasesPeriodType')}
            >
              <MenuItem value="daily">{t('dashboard.basicConfiguration.form.periodDaily')}</MenuItem>
              <MenuItem value="weekly">{t('dashboard.basicConfiguration.form.periodWeekly')}</MenuItem>
              <MenuItem value="monthly">{t('dashboard.basicConfiguration.form.periodMonthly')}</MenuItem>
              <MenuItem value="yearly">{t('dashboard.basicConfiguration.form.periodYearly')}</MenuItem>
            </Field.Select>
          </>
        )}
      </Box>

      <Stack direction="row" spacing={2} sx={{ mt: 3, alignItems: 'flex-end' }}>
        <Button type="submit" variant="contained" loading={loading} disabled={loading}>
          {t('dashboard.basicConfiguration.form.saveConfiguration')}
        </Button>

        <Button variant="outlined" onClick={handleCancel} disabled={loading}>
          {t('dashboard.basicConfiguration.form.cancel')}
        </Button>
      </Stack>

      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>{t('dashboard.basicConfiguration.form.note')}</strong>{' '}
          {t('dashboard.basicConfiguration.form.noteText')}
        </Typography>
      </Box>
    </Form>
  );
}
