import type { IStateItem } from 'src/types/state';

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
import { STATE_STATUS_OPTIONS } from 'src/_mock/_state';
import { createState, updateState } from 'src/actions/state';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

// Schema will be created inside component to access translations
const createStateSchema = (t: any) =>
  z.object({
    name: z.string().min(1, { error: t('dashboard.state.errors.nameRequired') }),
    status: z.string().min(1, { error: t('dashboard.state.errors.statusRequired') }),
  });

// ----------------------------------------------------------------------

type Props = {
  currentState?: IStateItem;
  onClose?: () => void;
  onSuccess?: () => void;
};

export function StateCreateEditForm({ currentState, onClose, onSuccess }: Props) {
  const { t } = useTranslate('navbar');
  const router = useRouter();

  const defaultValues = {
    status: 'active',
    name: '',
  };

  const StateSchema = createStateSchema(t);
  type StateCreateSchemaType = z.infer<typeof StateSchema>;

  const methods = useForm<StateCreateSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(StateSchema),
    defaultValues,
    values: currentState,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (currentState) {
        // Update existing state
        await updateState(currentState.id, data);
        toast.success(t('dashboard.state.toast.updatedSuccessfully'));
      } else {
        // Create new state
        await createState(data);
        toast.success(t('dashboard.state.toast.createdSuccessfully'));
      }
      reset();
      if (onSuccess) {
        onSuccess();
      }
      if (onClose) {
        onClose();
      } else {
        router.push(paths.dashboard.state.root);
      }
    } catch (error) {
      console.error('Failed to save state:', error);
      toast.error(t('dashboard.state.toast.saveFailed'));
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
              <Field.Text name="name" label={t('dashboard.state.form.stateName')} />

              <Field.Select
                name="status"
                label={t('dashboard.state.form.status')}
                placeholder={t('dashboard.state.form.selectStatus')}
              >
                {STATE_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.value === 'active'
                      ? t('dashboard.state.status.active')
                      : option.value === 'inactive'
                        ? t('dashboard.state.status.inactive')
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
                {!currentState
                  ? t('dashboard.state.actions.createState')
                  : t('dashboard.state.actions.saveChanges')}
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
