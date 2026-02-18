import * as z from 'zod';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { useGetPolicyPage, useUpdatePolicyPage } from 'src/actions/policy-page';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

// ----------------------------------------------------------------------

// Schema will be created inside component to access translations
const createPolicyPageEditSchema = (t: any) =>
  z.object({
    // Title is optional and can be empty string
    title: z.string().optional(),
    content: schemaUtils
      .editor()
      .min(20, { message: t('dashboard.policyPage.errors.contentMinLength') }),
  });

// ----------------------------------------------------------------------

export function PolicyPageEditForm() {
  const { t } = useTranslate('navbar');
  const router = useRouter();

  const { data: policyPage, isLoading } = useGetPolicyPage();
  const updatePolicyPage = useUpdatePolicyPage();

  const PolicyPageEditSchema = createPolicyPageEditSchema(t);
  type PolicyPageEditSchemaType = z.infer<typeof PolicyPageEditSchema>;

  const showPreview = useBoolean();
  const openDetails = useBoolean(true);

  const defaultValues: PolicyPageEditSchemaType = {
    title: '',
    content: '',
  };

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(PolicyPageEditSchema),
    defaultValues,
    values: policyPage
      ? {
          title: policyPage.title,
          content: policyPage.content,
        }
      : undefined,
  });

  const {
    watch,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Allow empty title - trim whitespace but keep empty string if empty
      const submitData = {
        ...data,
        title: data.title?.trim() || '',
      };
      await updatePolicyPage.mutateAsync(submitData);
      toast.success(t('dashboard.policyPage.toast.updatedSuccessfully'));
      router.push(paths.dashboard.policyPage.root);
    } catch (error) {
      console.error(error);
      toast.error(t('dashboard.policyPage.toast.updateFailed'));
    }
  });

  const handleCancel = useCallback(() => {
    router.push(paths.dashboard.policyPage.root);
  }, [router]);

  const renderCollapseButton = (value: boolean, onToggle: () => void) => (
    <IconButton onClick={onToggle}>
      <Iconify icon={value ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'} />
    </IconButton>
  );

  const renderDetails = () => (
    <Card>
      <CardHeader
        title={t('dashboard.policyPage.form.title')}
        subheader={t('dashboard.policyPage.form.subheader')}
        action={renderCollapseButton(openDetails.value, openDetails.onToggle)}
        sx={{ mb: 3 }}
      />

      <Collapse in={openDetails.value}>
        <Divider />

        <Stack spacing={3} sx={{ p: 3 }}>
          <Field.Text name="title" label={t('dashboard.policyPage.form.titleLabel')} />

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">{t('dashboard.policyPage.form.content')}</Typography>
            <Field.Editor
              name="content"
              fullItem
              sx={{
                maxHeight: 600,
                '& .ql-editor': {
                  minHeight: 400,
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {t('dashboard.policyPage.form.tip')}
            </Typography>
          </Stack>
        </Stack>
      </Collapse>
    </Card>
  );

  const renderActions = () => (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 2,
        p: 2.5,
      }}
    >
      <Button
        color="inherit"
        variant="outlined"
        size="medium"
        onClick={showPreview.onTrue}
        disabled={!isValid}
      >
        {t('dashboard.policyPage.actions.preview')}
      </Button>

      <Button color="inherit" variant="outlined" size="medium" onClick={handleCancel}>
        {t('dashboard.policyPage.actions.cancel')}
      </Button>

      <Button
        type="submit"
        variant="contained"
        size="medium"
        loading={isSubmitting}
        disabled={!isValid}
      >
        {t('dashboard.policyPage.actions.saveChanges')}
      </Button>
    </Box>
  );

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        <Typography>{t('dashboard.policyPage.loading')}</Typography>
      </Box>
    );
  }

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={5} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {renderDetails()}
        {renderActions()}
      </Stack>

      {/* Preview Modal */}
      {showPreview.value && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
        >
          <Card
            sx={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{t('dashboard.policyPage.actions.preview')}</Typography>
                <IconButton onClick={showPreview.onFalse}>
                  <Iconify icon="solar:close-circle-bold" />
                </IconButton>
              </Stack>
            </Box>
            <Box sx={{ p: 3 }}>
              {values.title?.trim() && (
                <Typography variant="h4" sx={{ mb: 2 }}>
                  {values.title}
                </Typography>
              )}
              <Box
                sx={{
                  '& h1, & h2, & h3, & h4, & h5, & h6': {
                    color: 'text.primary',
                    fontWeight: 600,
                    mb: 2,
                    mt: 3,
                    '&:first-of-type': { mt: 0 },
                  },
                  '& p': {
                    color: 'text.secondary',
                    lineHeight: 1.7,
                    mb: 2,
                  },
                  '& ul, & ol': {
                    pl: 3,
                    mb: 2,
                    '& li': {
                      color: 'text.secondary',
                      lineHeight: 1.7,
                      mb: 0.5,
                    },
                  },
                }}
                dangerouslySetInnerHTML={{ __html: values.content }}
              />
            </Box>
          </Card>
        </Box>
      )}
    </Form>
  );
}




