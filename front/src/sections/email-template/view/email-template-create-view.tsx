import { Container, Typography } from '@mui/material';

import { useTranslate } from 'src/locales';

import { EmailTemplateCreateForm } from '../email-template-create-form';

export function EmailTemplateCreateView() {
  const { t } = useTranslate('navbar');

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 5 }}>
        {t('dashboard.emailTemplate.createNewEmailTemplate')}
      </Typography>

      <EmailTemplateCreateForm />
    </Container>
  );
}
