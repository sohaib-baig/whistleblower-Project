import type { IDepartmentItem } from 'src/types/department';

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
import { DEPARTMENT_STATUS_OPTIONS } from 'src/_mock/_department';
import { createDepartment, updateDepartment } from 'src/actions/department';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

// Schema will be created inside component to access translations
const createDepartmentSchema = (t: any) =>
  z.object({
    name: z.string().min(1, { error: t('dashboard.department.errors.nameRequired') }),
    status: z.string().min(1, { error: t('dashboard.department.errors.statusRequired') }),
  });

// ----------------------------------------------------------------------

type Props = {
  currentDepartment?: IDepartmentItem;
  onClose?: () => void;
  onSuccess?: () => void;
};

export function DepartmentCreateEditForm({ currentDepartment, onClose, onSuccess }: Props) {
  const { t } = useTranslate('navbar');
  const router = useRouter();

  const defaultValues = {
    status: 'active',
    name: '',
  };

  const DepartmentSchema = createDepartmentSchema(t);
  type DepartmentCreateSchemaType = z.infer<typeof DepartmentSchema>;

  const methods = useForm<DepartmentCreateSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(DepartmentSchema),
    defaultValues,
    values: currentDepartment,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (currentDepartment) {
        // Update existing department
        await updateDepartment(currentDepartment.id, data);
        toast.success(t('dashboard.department.toast.updatedSuccessfully'));
      } else {
        // Create new department
        await createDepartment(data);
        toast.success(t('dashboard.department.toast.createdSuccessfully'));
      }
      reset();
      if (onSuccess) {
        onSuccess();
      }
      if (onClose) {
        onClose();
      } else {
        router.push(paths.dashboard.department.root);
      }
    } catch (error) {
      console.error('Failed to save department:', error);
      toast.error(t('dashboard.department.toast.saveFailed'));
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
              <Field.Text name="name" label={t('dashboard.department.form.departmentName')} />

              <Field.Select
                name="status"
                label={t('dashboard.department.form.status')}
                placeholder={t('dashboard.department.form.selectStatus')}
              >
                {DEPARTMENT_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.value === 'active'
                      ? t('dashboard.department.status.active')
                      : option.value === 'inactive'
                        ? t('dashboard.department.status.inactive')
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
                {!currentDepartment
                  ? t('dashboard.department.actions.createDepartment')
                  : t('dashboard.department.actions.saveChanges')}
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
