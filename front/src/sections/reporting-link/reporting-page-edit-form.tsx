import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { useRef, useState, useEffect } from 'react';
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
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { allLangs } from 'src/locales/locales-config';
import { useGetReportingPage, useUpdateReportingPage } from 'src/actions/reporting-page';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export function ReportingPageEditForm() {
  const { t } = useTranslate('navbar');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const { data: reportingPage, isLoading, refetch } = useGetReportingPage(selectedLanguage);
  const updateReportingPage = useUpdateReportingPage();

  const showPreview = useBoolean();
  const openDetails = useBoolean(true);
  const isInitialized = useRef(false);

  const ReportingPageEditSchema = z.object({
    title: z.string().min(5, { message: t('dashboard.reportingLink.pageContent.titleMinLength') }),
    content: schemaUtils
      .editor()
      .min(20, { message: t('dashboard.reportingLink.pageContent.contentMinLength') }),
    language: z.string().optional(),
  });

  type ReportingPageEditSchemaType = z.infer<typeof ReportingPageEditSchema>;

  const defaultValues: ReportingPageEditSchemaType = {
    title: '',
    content: '',
    language: 'en',
  };

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(ReportingPageEditSchema),
    defaultValues,
  });

  const {
    watch,
    reset,
    setValue,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = methods;

  // Initialize form values when data is loaded or language changes
  useEffect(() => {
    if (reportingPage) {
      reset({
        title: reportingPage.title || '',
        content: reportingPage.content || '',
        language: reportingPage.language || selectedLanguage,
      });
      isInitialized.current = true;
    }
  }, [reportingPage, reset, selectedLanguage]);

  // Handle language change
  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    setValue('language', newLanguage);
    isInitialized.current = false;
    refetch();
  };

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateReportingPage.mutateAsync({
        ...data,
        language: selectedLanguage,
      });
      toast.success(t('dashboard.reportingLink.pageContent.updatedSuccessfully'));
    } catch (error) {
      console.error(error);
      toast.error(t('dashboard.reportingLink.pageContent.updateFailed'));
    }
  });

  const renderCollapseButton = (value: boolean, onToggle: () => void) => (
    <IconButton onClick={onToggle}>
      <Iconify icon={value ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'} />
    </IconButton>
  );

  const renderDetails = () => (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {t('dashboard.reportingLink.pageContent.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.reportingLink.pageContent.description')}
          </Typography>
        </Box>
        {renderCollapseButton(openDetails.value, openDetails.onToggle)}
      </Box>

      <Collapse in={openDetails.value}>
        <Divider sx={{ mb: 2 }} />

        <Stack spacing={3}>
          <Field.Text name="title" label={t('dashboard.reportingLink.pageContent.titleLabel')} />

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

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">
              {t('dashboard.reportingLink.pageContent.content')}
            </Typography>
            <Field.Editor
              key={reportingPage?.id || 'editor'}
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
              {t('dashboard.reportingLink.pageContent.tip')}
            </Typography>
          </Stack>
        </Stack>
      </Collapse>
    </Box>
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
        {t('dashboard.reportingLink.pageContent.preview')}
      </Button>

      <Button
        type="submit"
        variant="contained"
        size="medium"
        loading={isSubmitting}
        disabled={!isValid}
      >
        {t('dashboard.reportingLink.pageContent.saveChanges')}
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
        <Typography>{t('dashboard.reportingLink.loading')}</Typography>
      </Box>
    );
  }

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3} sx={{ mx: 0, maxWidth: 'none', width: 1 }}>
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
                  <Typography variant="h6">
                    {t('dashboard.reportingLink.pageContent.preview')}
                  </Typography>
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
                    {t('dashboard.reportingLink.pageContent.noContent')}
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
