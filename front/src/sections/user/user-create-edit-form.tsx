import type { IUserItem } from 'src/types/user';

import * as z from 'zod';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fData } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';
import { updateUser } from 'src/actions/user';
import { allLangs } from 'src/locales/locales-config';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type Props = {
  currentUser?: IUserItem;
  onSaveSuccess?: () => void;
  showOnlyReportingFields?: boolean;
};

export function UserCreateEditForm({ currentUser, onSaveSuccess, showOnlyReportingFields = false }: Props) {
  const { t } = useTranslate('navbar');
  const router = useRouter();

  // Helper function to format time value to HH:mm (always store in 24h format in database)
  const formatTimeValue = (value: unknown, format?: '12h' | '24h'): string | undefined => {
    if (!value) return undefined;
    
    // Handle dayjs object
    if (dayjs.isDayjs(value)) {
      return value.format('HH:mm');
    }
    
    // Handle string values
    if (typeof value === 'string') {
      // If already in HH:mm format, return as is
      if (/^\d{2}:\d{2}$/.test(value)) {
        return value;
      }
      
      // Handle 12h format (e.g., "01:30 PM" or "1:30 PM")
      if (format === '12h' || (typeof value === 'string' && (value.includes('AM') || value.includes('PM')))) {
        const timeValue = dayjs(value, 'hh:mm A');
        if (timeValue.isValid()) {
          return timeValue.format('HH:mm');
        }
      }
      
      // Handle ISO datetime string - extract time portion
      // Format: "2025-12-05T10:00:00+05:30" or "2025-12-05T10:00:00Z"
      if (typeof value === 'string' && value.includes('T')) {
        const timeMatch = value.match(/T(\d{2}):(\d{2})/);
        if (timeMatch) {
          return `${timeMatch[1]}:${timeMatch[2]}`;
        }
      }
      
      // Try parsing with dayjs as fallback
      const timeValue = dayjs(value);
      if (timeValue.isValid()) {
        return timeValue.format('HH:mm');
      }
    }
    
    return undefined;
  };

  const createUserCreateSchema = () => {
    if (showOnlyReportingFields) {
      // Only validate the reporting fields
      return z.object({
        physicalAddress: z.string().optional(),
        phoneHoursFrom: z.string().optional(),
        phoneHoursTo: z.string().optional(),
        phoneHoursFormat: z.enum(['12h', '24h']).optional(),
        userLanguage: z.string().optional(),
        // Include other fields as optional to avoid validation errors
        avatarUrl: schemaUtils.file().optional(),
        name: z.string().optional(),
        email: z.string().optional(),
        phoneNumber: z.string().optional(),
        country: z.string().nullable().optional(),
        address: z.string().optional(),
        company: z.string().optional(),
        companyNumber: z.string().optional(),
        state: z.string().optional(),
        city: z.string().optional(),
        role: z.string().optional(),
        zipCode: z.string().optional(),
        status: z.string().optional(),
        isVerified: z.boolean().optional(),
      });
    }
    
    return z.object({
      avatarUrl: schemaUtils.file().optional(),
      name: z.string().min(1, { error: t('dashboard.user.validation.nameRequired') }),
      email: schemaUtils.email(),
      phoneNumber: schemaUtils.phoneNumber({ isValid: isValidPhoneNumber }),
      country: schemaUtils.nullableInput(
        z.string().min(1, { error: t('dashboard.user.validation.countryRequired') }),
        {
          error: t('dashboard.user.validation.countryRequired'),
        }
      ),
      address: z.string().min(1, { error: t('dashboard.user.validation.addressRequired') }),
      physicalAddress: z.string().optional(),
      phoneHoursFrom: z.string().optional(),
      phoneHoursTo: z.string().optional(),
      phoneHoursFormat: z.enum(['12h', '24h']).optional(),
      userLanguage: z.string().optional(),
      company: z.string().min(1, { error: t('dashboard.user.validation.companyRequired') }),
      companyNumber: z.string().optional(),
      state: z.string().min(1, { error: t('dashboard.user.validation.stateRequired') }),
      city: z.string().min(1, { error: t('dashboard.user.validation.cityRequired') }),
      role: z.string().min(1, { error: t('dashboard.user.validation.roleRequired') }),
      zipCode: z.string().min(1, { error: t('dashboard.user.validation.zipCodeRequired') }),
      // Not required
      status: z.string(),
      isVerified: z.boolean(),
    });
  };

  const UserCreateSchema = createUserCreateSchema();

  type UserCreateSchemaType = z.infer<typeof UserCreateSchema>;

  const defaultValues: UserCreateSchemaType = {
    status: '',
    avatarUrl: null,
    isVerified: true,
    name: '',
    email: '',
    phoneNumber: '',
    country: '',
    state: '',
    city: '',
    address: '',
    physicalAddress: '',
    phoneHoursFrom: '',
    phoneHoursTo: '',
    phoneHoursFormat: '24h',
    userLanguage: 'en',
    zipCode: '',
    company: '',
    companyNumber: '',
    role: '',
  };

  const methods = useForm<UserCreateSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(UserCreateSchema),
    defaultValues,
    values: currentUser as UserCreateSchemaType | undefined,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (currentUser) {
        if (showOnlyReportingFields) {
          // Only update the reporting fields (phoneHoursFormat is set in account page, not here)
          await updateUser(currentUser.id, {
            physicalAddress: data.physicalAddress || undefined,
            phoneHoursFrom: formatTimeValue(data.phoneHoursFrom, data.phoneHoursFormat),
            phoneHoursTo: formatTimeValue(data.phoneHoursTo, data.phoneHoursFormat),
          });
        } else {
          // Update all fields (excluding physicalAddress, phoneHoursFrom, phoneHoursTo from account page)
          await updateUser(currentUser.id, {
            name: data.name,
            email: data.email,
            phoneNumber: data.phoneNumber,
            country: data.country || undefined,
            address: data.address,
            phoneHoursFormat: data.phoneHoursFormat || undefined,
            userLanguage: data.userLanguage || undefined,
            state: data.state,
            city: data.city,
            zipCode: data.zipCode,
            company: data.company,
            companyNumber: data.companyNumber,
            role: data.role,
            avatar: (data.avatarUrl as any) instanceof File ? (data.avatarUrl as any) : undefined,
          });
        }
        toast.success(t('dashboard.user.toast.updateSuccess'));
        // Call onSaveSuccess callback to trigger refetch in parent component
        onSaveSuccess?.();
      } else {
        // Keep existing mock create behavior
        await new Promise((resolve) => setTimeout(resolve, 500));
        toast.success(t('dashboard.user.toast.createSuccess'));
        router.push(paths.dashboard.user.list);
      }
    } catch (error) {
      console.error(error);
      toast.error(t('dashboard.user.toast.saveError'));
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {!showOnlyReportingFields && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ pt: 10, pb: 5, px: 3 }}>
              {/* Removed banned/status indicator */}

              <Box sx={{ mb: 5 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 2,
                    textAlign: 'center',
                    fontWeight: 600,
                  }}
                >
                  {t('dashboard.user.form.companyLogo')}
                </Typography>
                <Field.UploadAvatar
                  name="avatarUrl"
                  maxSize={3145728}
                  helperText={
                    <Typography
                      variant="caption"
                      sx={{
                        mt: 3,
                        mx: 'auto',
                        display: 'block',
                        textAlign: 'center',
                        color: 'text.disabled',
                      }}
                    >
                      {t('dashboard.user.form.avatarAllowed')}
                      <br /> {t('dashboard.user.form.avatarMaxSize')} {fData(3145728)}
                    </Typography>
                  }
                />
              </Box>

              {/* Removed banned toggle */}

              {/* Removed email verified toggle */}

              {/* Removed delete user action */}
            </Card>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: showOnlyReportingFields ? 12 : 8 }}>
          <Card sx={{ p: 3 }}>
            {!showOnlyReportingFields && (
              <Box
                sx={{
                  rowGap: 3,
                  columnGap: 2,
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                }}
              >
                <Field.Text name="name" label={t('dashboard.user.form.fullName')} />
                <Field.Text name="email" label={t('dashboard.user.form.emailAddress')} disabled />
                <Field.Phone
                  name="phoneNumber"
                  label={t('dashboard.user.form.phoneNumber')}
                  defaultCountry="US"
                />

                <Field.CountrySelect
                  fullWidth
                  name="country"
                  label={t('dashboard.user.form.country')}
                  placeholder={t('dashboard.user.form.chooseCountry')}
                />

                <Field.Text name="state" label={t('dashboard.user.form.stateRegion')} />
                <Field.Text name="city" label={t('dashboard.user.form.city')} />
                <Field.Text name="address" label={t('dashboard.user.form.address')} />
                <Field.Text name="zipCode" label={t('dashboard.user.form.zipCode')} />
                <Field.Text name="company" label={t('dashboard.user.form.company')} />
                <Field.Text name="companyNumber" label={t('dashboard.user.form.companyNumber')} />
                <Field.Text name="role" label={t('dashboard.user.form.role')} disabled />
              </Box>
            )}

            {!showOnlyReportingFields && (
              <Box
                sx={{
                  mt: 3,
                  rowGap: 3,
                  columnGap: 2,
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                }}
              >
                <Field.Select
                  name="phoneHoursFormat"
                  label={t('dashboard.user.form.phoneHoursFormat')}
                >
                  <MenuItem value="24h">24 Hours</MenuItem>
                  <MenuItem value="12h">12 Hours (AM/PM)</MenuItem>
                </Field.Select>
                <Field.Select
                  name="userLanguage"
                  label={t('dashboard.user.form.userLanguage') || 'User Language'}
                >
                  {allLangs.map((lang) => (
                    <MenuItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Box>
            )}

            {showOnlyReportingFields && (
              <>
                <Box sx={{ mt: showOnlyReportingFields ? 0 : 3 }}>
                  <Field.Text
                    name="physicalAddress"
                    label={t('dashboard.user.form.physicalAddress')}
                    multiline
                    rows={4}
                    fullWidth
                  />
                </Box>

                <Box
                  sx={{
                    mt: 3,
                    rowGap: 3,
                    columnGap: 2,
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                  }}
                >
                  <Field.TimePicker
                    name="phoneHoursFrom"
                    label={t('dashboard.user.form.phoneHoursFrom')}
                    ampm={methods.watch('phoneHoursFormat') === '12h'}
                    format={methods.watch('phoneHoursFormat') === '12h' ? 'hh:mm A' : 'HH:mm'}
                  />
                  <Field.TimePicker
                    name="phoneHoursTo"
                    label={t('dashboard.user.form.phoneHoursTo')}
                    ampm={methods.watch('phoneHoursFormat') === '12h'}
                    format={methods.watch('phoneHoursFormat') === '12h' ? 'hh:mm A' : 'HH:mm'}
                  />
                </Box>
              </>
            )}

            <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
              <Button type="submit" variant="contained" loading={isSubmitting}>
                {!currentUser
                  ? t('dashboard.user.form.createUser')
                  : t('dashboard.user.form.saveChanges')}
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
