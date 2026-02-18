import type { ICategoryItem } from 'src/types/category';

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
import { CATEGORY_STATUS_OPTIONS } from 'src/_mock/_category';
import { createCategory, updateCategory } from 'src/actions/category';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type Props = {
  currentCategory?: ICategoryItem;
};

export function CategoryCreateEditForm({ currentCategory }: Props) {
  const { t } = useTranslate('navbar');
  const router = useRouter();

  const CategorySchema = z.object({
    name: z.string().min(1, { message: t('dashboard.category.categoryName') + ' is required!' }),
    status: z.string().min(1, { message: t('dashboard.category.status') + ' is required!' }),
  });

  type CategoryCreateSchemaType = z.infer<typeof CategorySchema>;

  const defaultValues: CategoryCreateSchemaType = {
    status: 'active',
    name: '',
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(CategorySchema),
    defaultValues,
    values: currentCategory,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (currentCategory) {
        // Update existing category
        await updateCategory(currentCategory.id, data);
        toast.success(t('dashboard.category.categoryUpdated'));
      } else {
        // Create new category
        await createCategory(data);
        toast.success(t('dashboard.category.categoryCreated'));
      }
      reset();
      router.push(paths.dashboard.category.list);
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error(t('dashboard.category.failedToSave'));
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
              <Field.Text name="name" label={t('dashboard.category.categoryName')} />

              <Field.Select
                name="status"
                label={t('dashboard.category.status')}
                placeholder={t('dashboard.category.selectStatus')}
              >
                {CATEGORY_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.value === 'active'
                      ? t('dashboard.category.active')
                      : t('dashboard.category.inactive')}
                  </MenuItem>
                ))}
              </Field.Select>
            </Box>

            <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
              <Button type="submit" variant="contained" loading={isSubmitting}>
                {!currentCategory
                  ? t('dashboard.category.createCategory')
                  : t('dashboard.category.saveChanges')}
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
