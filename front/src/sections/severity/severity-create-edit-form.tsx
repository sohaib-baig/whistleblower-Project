import type { ISeverityItem } from 'src/types/severity';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { SEVERITY_STATUS_OPTIONS } from 'src/_mock/_severity';
import { createSeverity, updateSeverity } from 'src/actions/severity';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

// Schema will be created inside component to access translations
const createSeveritySchema = (t: any) =>
  z.object({
    name: z.string().min(1, { error: t('dashboard.severity.errors.nameRequired') }),
    status: z.string().min(1, { error: t('dashboard.severity.errors.statusRequired') }),
  });

// ----------------------------------------------------------------------

type Props = {
  currentSeverity?: ISeverityItem;
  onClose?: () => void;
  onSuccess?: () => void;
};

export function SeverityCreateEditForm({ currentSeverity, onClose, onSuccess }: Props) {
  const { t } = useTranslate('navbar');
  const router = useRouter();

  const defaultValues = {
    status: 'active',
    name: '',
  };

  const SeveritySchema = createSeveritySchema(t);
  type SeverityCreateSchemaType = z.infer<typeof SeveritySchema>;

  const methods = useForm<SeverityCreateSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(SeveritySchema),
    defaultValues,
    values: currentSeverity,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (currentSeverity) {
        // Update existing severity
        await updateSeverity(currentSeverity.id, data);
        toast.success(t('dashboard.severity.toast.updatedSuccessfully'));
      } else {
        // Create new severity
        await createSeverity(data);
        toast.success(t('dashboard.severity.toast.createdSuccessfully'));
      }
      reset();
      if (onSuccess) {
        onSuccess();
      }
      if (onClose) {
        onClose();
      } else {
        router.push(paths.dashboard.severity.root);
      }
    } catch (error) {
      console.error('Failed to save severity:', error);
      toast.error(t('dashboard.severity.toast.saveFailed'));
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
              <Field.Text name="name" label={t('dashboard.severity.form.severityName')} />

              <Field.Select
                name="status"
                label={t('dashboard.severity.form.status')}
                placeholder={t('dashboard.severity.form.selectStatus')}
              >
                {SEVERITY_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.value === 'active'
                      ? t('dashboard.severity.status.active')
                      : option.value === 'inactive'
                        ? t('dashboard.severity.status.inactive')
                        : option.label}
                  </MenuItem>
                ))}
              </Field.Select>
            </Box>

            <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'flex-end' }}>
              {onClose && (
                <Button variant="outlined" onClick={onClose}>
                  Cancel
                </Button>
              )}
              <Button type="submit" variant="contained" loading={isSubmitting}>
                {!currentSeverity
                  ? t('dashboard.severity.actions.createSeverity')
                  : t('dashboard.severity.actions.saveChanges')}
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
