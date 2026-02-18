import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useCallback } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Portal from '@mui/material/Portal';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { allLangs } from 'src/locales/locales-config';
import { useGetSupport, useUpdateSupport } from 'src/actions/support';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

// ----------------------------------------------------------------------

// Schema will be created inside component to access translations
const createSupportEditSchema = (t: any) =>
  z.object({
    title: z.string().min(5, { message: t('dashboard.support.errors.titleMinLength') }),
    content: schemaUtils
      .editor()
      .min(20, { message: t('dashboard.support.errors.contentMinLength') }),
    status: z.string().optional(),
    language: z.string().optional(),
  });

// ----------------------------------------------------------------------

type Props = {
  isReportingLinkContext?: boolean;
};

export function SupportEditForm({ isReportingLinkContext = false }: Props) {
  const { t } = useTranslate('navbar');
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  const { data: support, isLoading, refetch } = useGetSupport(selectedLanguage);
  const updateSupport = useUpdateSupport();

  const SupportEditSchema = createSupportEditSchema(t);
  type SupportEditSchemaType = z.infer<typeof SupportEditSchema>;

  const showPreview = useBoolean();
  const openDetails = useBoolean(true);

  const defaultValues: SupportEditSchemaType = {
    title: '',
    content: '',
    status: 'active',
    language: 'en',
  };

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(SupportEditSchema),
    defaultValues,
    values: support
      ? {
          title: support.title,
          content: support.content,
          status: support.status || 'active',
          language: support.language || selectedLanguage,
        }
      : undefined,
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = methods;

  const values = watch();

  // Handle language change
  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    setValue('language', newLanguage);
    refetch();
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateSupport.mutateAsync({
        ...data,
        language: selectedLanguage,
      });
      toast.success(
        isReportingLinkContext
          ? t('dashboard.reportingLink.page3.updatedSuccessfully')
          : t('dashboard.support.toast.updatedSuccessfully')
      );
    } catch (error) {
      console.error(error);
      toast.error(t('dashboard.support.toast.updateFailed'));
    }
  });

  const handleCancel = useCallback(() => {
    router.push(paths.dashboard.support.root);
  }, [router]);

  const renderCollapseButton = (value: boolean, onToggle: () => void) => (
    <IconButton onClick={onToggle}>
      <Iconify icon={value ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'} />
    </IconButton>
  );

  const renderDetails = () => (
    <Card>
      <CardHeader
        title={t('dashboard.support.form.title')}
        subheader={t('dashboard.support.form.subheader')}
        action={renderCollapseButton(openDetails.value, openDetails.onToggle)}
        sx={{ mb: 3 }}
      />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Field.Text name="title" label={t('dashboard.support.form.titleLabel')} />

        <Field.Select
          name="language"
          label="Language"
          value={selectedLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
        >
          {allLangs.map((lang) => (
            <MenuItem key={lang.value} value={lang.value}>
              {lang.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Field.Select
          name="status"
          label={t('dashboard.support.form.status')}
          placeholder={t('dashboard.support.form.selectStatus')}
        >
          <MenuItem value="active">{t('dashboard.support.status.active')}</MenuItem>
          <MenuItem value="inactive">{t('dashboard.support.status.inactive')}</MenuItem>
        </Field.Select>

        <Collapse in={openDetails.value}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">{t('dashboard.support.form.content')}</Typography>
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
              {t('dashboard.support.form.tip')}
            </Typography>
          </Stack>
        </Collapse>
      </Stack>
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
        {t('dashboard.support.actions.preview')}
      </Button>

      <Button color="inherit" variant="outlined" size="medium" onClick={handleCancel}>
        {t('dashboard.support.actions.cancel')}
      </Button>

      <Button
        type="submit"
        variant="contained"
        size="medium"
        loading={isSubmitting}
        disabled={!isValid}
      >
        {t('dashboard.support.actions.saveChanges')}
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
        <Typography>{t('dashboard.support.loading')}</Typography>
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
        <Portal>
          <Box
            onClick={showPreview.onFalse}
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
              onClick={(e) => e.stopPropagation()}
              sx={{
                width: '100%',
                maxWidth: { xs: '95vw', sm: '90vw', md: '800px', lg: '1000px' },
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">{t('dashboard.support.actions.preview')}</Typography>
                  <IconButton onClick={showPreview.onFalse}>
                    <Iconify icon="solar:close-circle-bold" />
                  </IconButton>
                </Stack>
              </Box>
              <Box sx={{ p: 3, overflow: 'auto', flex: 1 }}>
                {values.title && (
                  <Typography variant="h4" sx={{ mb: 2 }}>
                    {values.title}
                  </Typography>
                )}
                {values.content ? (
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
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t('dashboard.support.form.noContent')}
                  </Typography>
                )}
              </Box>
            </Card>
          </Box>
        </Portal>
      )}
    </Form>
  );
}
