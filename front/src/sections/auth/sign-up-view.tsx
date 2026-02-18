import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import { SignupFormWizard } from './signup-form-wizard';

// ----------------------------------------------------------------------

export function SignupView() {
  const { t } = useTranslate('messages');

  return (
    <Container sx={{ py: { xs: 3, md: 5 } }}>
      <Typography variant="h3" align="center" sx={{ mb: 2 }}>
        {t('signUp.title')}
      </Typography>

      <Typography align="center" sx={{ color: 'text.secondary', mb: 5 }}>
        {t('signUp.description')}
      </Typography>

      <SignupFormWizard />
    </Container>
  );
}
