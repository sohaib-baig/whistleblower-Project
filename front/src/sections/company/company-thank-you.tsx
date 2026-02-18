import type { CompanyLanding } from 'src/types/company-landing';

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import { getCompanyBySlug } from 'src/actions/company-landing';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function CompanyThankYouPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('company');
  const [company, setCompany] = useState<CompanyLanding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const companyData = await getCompanyBySlug(slug);
        setCompany(companyData);
      } catch (error) {
        console.error('[CompanyThankYou] Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleCreateNewCase = () => {
    navigate(`/company/${slug}/create-case`);
  };

  const handleFollowUp = () => {
    navigate(`/company/${slug}/login`);
  };

  const handleGoHome = () => {
    navigate(`/company/${slug}/`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  const pageTitle = t('thankYou.title', 'Thank You');

  return (
    <>
      <Helmet>
        <title>{`${pageTitle} - ${CONFIG.appName}`}</title>
      </Helmet>
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Card sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
            <Stack spacing={3} alignItems="center">
              {/* Success Icon */}
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'success.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <Iconify icon="eva:checkmark-fill" width={48} sx={{ color: 'success.main' }} />
              </Box>

              {/* Title */}
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                {t('thankYou.title', 'Thank You')}
              </Typography>

              {/* Message */}
              <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
                {t('thankYou.message', 'Your case has been submitted successfully. We have received your report and will review it shortly.')}
              </Typography>

              {company && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  {t('thankYou.companyMessage', 'Thank you for reporting to')} {company.name}
                </Typography>
              )}

              {/* Additional Info */}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 1, maxWidth: 500, mx: 'auto' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('thankYou.additionalInfo', 'Please keep your case password safe. You will need it to access your case details and follow up on your report.')}
                </Typography>
              </Box>

              {/* Action Buttons */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="center"
                sx={{ mt: 4, width: '100%' }}
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={handleCreateNewCase}
                  sx={{
                    minWidth: { xs: '100%', sm: 200 },
                  }}
                >
                  {t('thankYou.createNewCase', 'Create New Case')}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Iconify icon="solar:login-3-bold" />}
                  onClick={handleFollowUp}
                  sx={{
                    minWidth: { xs: '100%', sm: 200 },
                  }}
                >
                  {t('thankYou.followUp', 'Follow Up on Case')}
                </Button>
                <Button
                  variant="text"
                  size="large"
                  onClick={handleGoHome}
                  sx={{
                    minWidth: { xs: '100%', sm: 200 },
                  }}
                >
                  {t('thankYou.goHome', 'Go to Home')}
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Container>
      </Box>
    </>
  );
}
