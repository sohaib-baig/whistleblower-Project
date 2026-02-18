import type { CompanyLanding, CompanyContent } from 'src/types/company-landing';

import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import { getCompanyBySlug, getCompanyContent } from 'src/actions/company-landing';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function CompanyAboutPage() {
  const { slug } = useParams<{ slug: string }>();
  const { i18n, t } = useTranslation('company');
  const [company, setCompany] = useState<CompanyLanding | null>(null);
  const [content, setContent] = useState<CompanyContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const [companyData, contentData] = await Promise.all([
          getCompanyBySlug(slug),
          getCompanyContent(slug, 'about-us'),
        ]);
        setCompany(companyData);
        setContent(contentData);
      } catch (error) {
        console.error('[CompanyAbout] Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, i18n.language]); // Refetch when language changes

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!company || !content) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Content not found</Typography>
      </Container>
    );
  }

  const handleCreateCase = () => {
    window.location.href = `/company/${slug}/create-case`;
  };

  const handleFollowUp = () => {
    window.location.href = `/company/${slug}/login`;
  };

  const pageTitle = content?.title || company?.name || 'About Us';

  return (
    <>
      <Helmet>
        <title>{`${pageTitle} - ${CONFIG.appName}`}</title>
      </Helmet>
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Main Content */}
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1000, mx: 'auto' }}>
        <Card sx={{ p: { xs: 2, sm: 4 } }}>
          <Stack spacing={4}>
            {/* Title */}
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              {content.title}
            </Typography>

            {/* Dynamic content from API */}
            {content.content ? (
              <Box
                sx={{
                  textAlign: 'left',
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
                  '& img': {
                    maxWidth: '100%',
                    height: 'auto',
                  },
                }}
                dangerouslySetInnerHTML={{ __html: content.content }}
              />
            ) : (
              <Typography variant="body1" color="text.secondary">
                No content available.
              </Typography>
            )}

            {/* Action Buttons */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
              sx={{ mt: 4, px: { xs: 0, sm: 0 } }}
              key={i18n.language}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<Iconify icon="mingcute:add-line" />}
                sx={{
                  minWidth: { xs: '100%', sm: 200 },
                  width: { xs: '100%', sm: 'auto' },
                }}
                onClick={handleCreateCase}
              >
                {t('aboutUs.createNewReport', 'Create a new report')}
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  minWidth: { xs: '100%', sm: 200 },
                  width: { xs: '100%', sm: 'auto' },
                }}
                onClick={handleFollowUp}
              >
                {t('aboutUs.followUpReport', 'Follow up on existing report')}
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Box>
    </Box>
    </>
  );
}
