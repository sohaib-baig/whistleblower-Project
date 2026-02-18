import type { ICompanyItem } from 'src/types/company';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales/use-locales';
import { COMPANY_STATUS_OPTIONS } from 'src/_mock/_company';
import { createCompany, updateCompany } from 'src/actions/company';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const CompanySchema = z.object({
  name: z.string().min(1, { message: 'Company name is required!' }),
  email: schemaUtils.email(),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .optional()
    .or(z.literal('')),
  phoneNumber: schemaUtils.phoneNumber({ isValid: isValidPhoneNumber }).optional(),
  address: z.string().min(1, { message: 'Address is required!' }),
  status: z.string().min(1, { message: 'Status is required!' }),
});

export type CompanyCreateSchemaType = z.infer<typeof CompanySchema>;

// ----------------------------------------------------------------------

type Props = {
  currentCompany?: ICompanyItem;
};

export function CompanyCreateEditForm({ currentCompany }: Props) {
  const router = useRouter();
  const { t } = useTranslate('navbar');

  const defaultValues: CompanyCreateSchemaType = {
    status: 'pending',
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    address: '',
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(CompanySchema),
    defaultValues,
    values: currentCompany,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Map frontend status to backend is_active values
      const statusMap: Record<string, number> = {
        active: 1,
        pending: 2,
        banned: 3,
      };

      // Prepare data for API
      const apiData: any = {
        name: data.name,
        email: data.email,
        phone: data.phoneNumber || undefined,
        address: data.address,
        is_active: statusMap[data.status] || 2,
        company_name: data.name, // Use name as company_name
      };

      // Only include password if it's provided (required for create, optional for update)
      if (data.password && data.password.trim() !== '') {
        apiData.password = data.password;
      }

      if (currentCompany) {
        // Update existing company
        await updateCompany(currentCompany.id, apiData);
        toast.success(t('dashboard.company.companyUpdated'));
      } else {
        // Create new company
        await createCompany(apiData);
        toast.success(t('dashboard.company.companyCreated'));
      }

      reset();
      router.push(paths.dashboard.company.list);
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error(error instanceof Error ? error.message : t('dashboard.company.failedToSave'));
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <Box
              sx={{
                rowGap: 3,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              <Field.Text name="name" label={t('dashboard.company.companyName')} />
              <Field.Text name="email" label={t('dashboard.company.emailAddress')} />
              <Field.Text
                name="password"
                label={t('dashboard.company.password')}
                type="password"
                placeholder={
                  currentCompany
                    ? t('dashboard.company.passwordPlaceholderEdit')
                    : t('dashboard.company.passwordPlaceholder')
                }
                helperText={currentCompany ? t('dashboard.company.passwordHelperText') : undefined}
              />
              <Field.Phone
                name="phoneNumber"
                label={t('dashboard.company.phoneNumber')}
                defaultCountry="US"
              />
              <Field.Select
                name="status"
                label={t('dashboard.company.status')}
                placeholder={t('dashboard.company.selectStatus')}
              >
                {COMPANY_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field.Select>
              <Field.Text
                name="address"
                label={t('dashboard.company.address')}
                sx={{ gridColumn: '1 / -1' }}
              />
            </Box>

            <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
              <Button type="submit" variant="contained" loading={isSubmitting}>
                {!currentCompany
                  ? t('dashboard.company.createCompany')
                  : t('dashboard.company.saveChanges')}
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
