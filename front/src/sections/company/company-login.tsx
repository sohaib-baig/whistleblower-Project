import type { CompanyLanding, LoginCredentials } from 'src/types/company-landing';

import { useParams } from 'react-router';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { useRouter } from 'src/routes/hooks';

import { storePasswordSession } from 'src/utils/password-session';
import { getTurnstileSiteKey, shouldEnableTurnstile } from 'src/utils/turnstile-config';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales/use-locales';
import { loginUser, getCompanyBySlug } from 'src/actions/company-landing';

import { Iconify } from 'src/components/iconify';
import { Turnstile } from 'src/components/turnstile';

const TURNSTILE_SITE_KEY = getTurnstileSiteKey();

// ----------------------------------------------------------------------

export function CompanyLoginPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { t } = useTranslate('company');
  const [company, setCompany] = useState<CompanyLanding | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false,
  });

  useEffect(() => {
    const fetchCompany = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const companyData = await getCompanyBySlug(slug);
        setCompany(companyData);
      } catch (fetchError) {
        console.error('Error fetching company:', fetchError);
        setError('Company not found');
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [slug]);

  const handleInputChange =
    (field: keyof LoginCredentials) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = field === 'rememberMe' ? event.target.checked : event.target.value;
      setFormData({
        ...formData,
        [field]: value,
      });
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!slug) {
      return;
    }

    if (shouldEnableTurnstile() && !turnstileToken) {
      setError('Please complete the security verification.');
      return;
    }

    try {
      setLoginLoading(true);
      setError(null);

      const response = await loginUser(slug, formData, shouldEnableTurnstile() ? (turnstileToken ?? undefined) : undefined);

      // Handle successful login
      if (response.status && response.data?.case_id) {
        // Store password session for case details access
        storePasswordSession(formData.password, slug, slug, response.data.case_id);

        // Redirect to case details page (public route without encryption needed)
        router.push(`/company/${slug}/case-details/${response.data.case_id}`);
      } else {
        setError('Invalid password. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid password. Please try again.');
      // Reset Turnstile on error
      setTurnstileToken(null);
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography>{t('layout.loading')}</Typography>
      </Container>
    );
  }

  if (!company) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{t('layout.companyNotFound')}</Alert>
      </Container>
    );
  }

  const pageTitle = company?.name || 'Login';

  return (
    <>
      <Helmet>
        <title>{`${pageTitle} - ${CONFIG.appName}`}</title>
      </Helmet>
      <Container maxWidth="sm" sx={{ py: 4 }}>
      {/* Company Branding */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, textAlign: 'center' }}>
        <Box
          component="img"
          src={company.logo}
          alt={company.name}
          sx={{
            width: 80,
            height: 80,
            mx: 'auto',
            mb: 2,
            objectFit: 'contain',
            display: 'block',
          }}
        />
        <Typography variant="h4" component="h1" gutterBottom>
          {t('login.welcome')} {company.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('login.signInToCase')}
        </Typography>
      </Paper>

      {/* Login Form */}
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom textAlign="center">
          {t('login.signIn')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label={t('login.password')}
            type="password"
            value={formData.password}
            onChange={handleInputChange('password')}
            margin="normal"
            required
            autoComplete="current-password"
          />

          {shouldEnableTurnstile() && (
            <Box sx={{ mt: 2, mb: 2, display: 'flex', justifyContent: 'center' }}>
              <Turnstile
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={(token) => {
                  setTurnstileToken(token);
                }}
                onError={() => {
                  setTurnstileToken(null);
                  setError('Security verification failed. Please refresh and try again.');
                }}
                onExpire={() => {
                  setTurnstileToken(null);
                }}
                theme="auto"
                size="normal"
              />
            </Box>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loginLoading || (shouldEnableTurnstile() && !turnstileToken)}
            sx={{ mt: 2, mb: 2 }}
          >
            {loginLoading ? t('login.signingIn') : t('login.signIn')}
          </Button>
        </Box>
      </Paper>

      {/* Company Contact Info */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('login.needHelp')}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('login.troubleSigningIn')}
          </Typography>
          {company.contactInfo?.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Iconify icon="solar:letter-unread-bold" sx={{ mr: 1 }} />
              <Typography variant="body2" fontWeight="medium">
                {company.contactInfo.email}
              </Typography>
            </Box>
          )}
          {company.contactInfo?.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Iconify icon="solar:phone-bold" sx={{ mr: 1 }} />
              <Typography variant="body2" fontWeight="medium">
                {company.contactInfo.phone}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
    </>
  );
}
