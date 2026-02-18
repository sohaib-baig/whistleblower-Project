import { Container, Typography } from '@mui/material';

import { useTranslate } from 'src/locales';

import { EmailTemplateEditForm } from '../email-template-edit-form';

interface EmailTemplateEditViewProps {
  id: string;
}

export function EmailTemplateEditView({ id }: EmailTemplateEditViewProps) {
  const { t } = useTranslate('navbar');

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 5 }}>
        {t('dashboard.emailTemplate.editEmailTemplate')}
      </Typography>

      <EmailTemplateEditForm id={id} />
    </Container>
  );
}
