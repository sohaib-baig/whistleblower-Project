import type { EmailTemplateFormValues } from 'src/types/email-template';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import {
  updateEmailTemplate,
  useGetEmailTemplate,
  fetchEmailTemplateByNameAndLanguage,
} from 'src/actions/email-template';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

export type EmailTemplateEditSchemaType = {
  name: string;
  subject: string;
  content: any;
  placeholder?: string;
  language: string;
  status: string;
};

interface EmailTemplateEditFormProps {
  id: string;
}

export function EmailTemplateEditForm({ id }: EmailTemplateEditFormProps) {
  const { t } = useTranslate('navbar');
  const router = useRouter();

  const createEmailTemplateEditSchema = () =>
    z.object({
      name: z
        .string()
        .min(1, { message: t('dashboard.emailTemplate.validation.templateNameRequired') }),
      subject: z
        .string()
        .min(1, { message: t('dashboard.emailTemplate.validation.subjectRequired') }),
      content: schemaUtils
        .editor()
        .min(1, { message: t('dashboard.emailTemplate.validation.contentRequired') }),
      placeholder: z.string().optional(),
      language: z
        .string()
        .min(1, { message: t('dashboard.emailTemplate.validation.languageRequired') }),
      status: z
        .string()
        .min(1, { message: t('dashboard.emailTemplate.validation.statusRequired') }),
    });

  const EmailTemplateEditSchema = createEmailTemplateEditSchema();

  const { template: currentTemplate, loading } = useGetEmailTemplate(id);

  const defaultValues: EmailTemplateEditSchemaType = {
    name: '',
    subject: '',
    content: '',
    placeholder: '',
    language: 'en',
    status: 'active',
  };

  const methods = useForm<EmailTemplateEditSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(EmailTemplateEditSchema),
    defaultValues,
    values: currentTemplate || undefined,
  });

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const watchedLanguage = watch('language');
  const watchedName = watch('name');
  const [isLoadingLanguageTemplate, setIsLoadingLanguageTemplate] = useState(false);
  const [previousLanguage, setPreviousLanguage] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load template content when language changes (but not on initial load)
  useEffect(() => {
    // Skip on initial load - let the form load with current template data
    if (isInitialLoad && currentTemplate) {
      setPreviousLanguage(currentTemplate.language || 'en');
      setIsInitialLoad(false);
      return;
    }

    const loadTemplateByLanguage = async () => {
      // Skip if name is empty or language hasn't changed
      if (!watchedName || !currentTemplate || watchedLanguage === previousLanguage) {
        return;
      }

      setIsLoadingLanguageTemplate(true);
      try {
        const templateData = await fetchEmailTemplateByNameAndLanguage(
          watchedName,
          watchedLanguage
        );

        if (templateData) {
          // Update form fields with the template data for the selected language
          setValue('subject', templateData.subject || '');
          setValue('content', templateData.content || '');
          setValue('status', templateData.status || 'active');
          setValue('placeholder', templateData.placeholder || '');
        } else {
          // Template doesn't exist for this language, clear the fields
          setValue('subject', '');
          setValue('content', '');
          setValue('status', 'active');
          // Keep placeholder as it's usually the same across languages
        }
        setPreviousLanguage(watchedLanguage);
      } catch (error) {
        console.error('Failed to load template for language:', error);
        // On error, keep current values
      } finally {
        setIsLoadingLanguageTemplate(false);
      }
    };

    loadTemplateByLanguage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedLanguage, watchedName]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateEmailTemplate(id, data as EmailTemplateFormValues);
      toast.success(t('dashboard.emailTemplate.toast.updateSuccess'));
      router.push(paths.dashboard.emailTemplate.root);
    } catch (error) {
      console.error(error);
      toast.error(t('dashboard.emailTemplate.toast.updateError'));
    }
  });

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        {t('dashboard.emailTemplate.form.loading')}
      </Box>
    );
  }

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
              <Field.Text name="name" label={t('dashboard.emailTemplate.form.templateName')} />
              <Field.Text name="subject" label={t('dashboard.emailTemplate.form.subject')} />

              <Field.Select
                name="language"
                label={t('dashboard.emailTemplate.form.language')}
                disabled={isLoadingLanguageTemplate}
              >
                <MenuItem value="en">{t('dashboard.emailTemplate.languageOptions.en')}</MenuItem>
                <MenuItem value="sv">{t('dashboard.emailTemplate.languageOptions.sv')}</MenuItem>
                <MenuItem value="no">{t('dashboard.emailTemplate.languageOptions.no')}</MenuItem>
                <MenuItem value="da">{t('dashboard.emailTemplate.languageOptions.da')}</MenuItem>
                <MenuItem value="fi">{t('dashboard.emailTemplate.languageOptions.fi')}</MenuItem>
                <MenuItem value="fr">{t('dashboard.emailTemplate.languageOptions.fr')}</MenuItem>
                <MenuItem value="de">{t('dashboard.emailTemplate.languageOptions.de')}</MenuItem>
              </Field.Select>

              <Field.Select
                name="status"
                label={t('dashboard.emailTemplate.form.status')}
                placeholder={t('dashboard.emailTemplate.form.selectStatus')}
              >
                <MenuItem value="active">
                  {t('dashboard.emailTemplate.statusOptions.active')}
                </MenuItem>
                <MenuItem value="inactive">
                  {t('dashboard.emailTemplate.statusOptions.inactive')}
                </MenuItem>
              </Field.Select>
            </Box>

            <Stack spacing={3} sx={{ mt: 3 }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2">
                  {t('dashboard.emailTemplate.form.content')}
                </Typography>
                <Field.Editor
                  name="content"
                  fullItem
                  sx={{
                    maxHeight: 400,
                    '& .ql-editor': {
                      minHeight: 200,
                    },
                  }}
                />
              </Stack>

              <Field.Text
                name="placeholder"
                label={t('dashboard.emailTemplate.form.placeholderVariables')}
                placeholder={t('dashboard.emailTemplate.form.placeholderExample')}
                multiline
                rows={3}
                helperText={t('dashboard.emailTemplate.form.placeholderHelperText')}
              />
            </Stack>

            <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => router.push(paths.dashboard.emailTemplate.root)}
                >
                  {t('dashboard.emailTemplate.form.cancel')}
                </Button>
                <Button type="submit" variant="contained" loading={isSubmitting}>
                  {t('dashboard.emailTemplate.form.save')}
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
