import type { CompanyLanding, CompanyContent } from 'src/types/company-landing';

import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import { getCompanyBySlug, getCompanyContent } from 'src/actions/company-landing';

// ----------------------------------------------------------------------

export function CompanySupportPage() {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
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
          getCompanyContent(slug, 'support'),
        ]);
        setCompany(companyData);
        setContent(contentData);
      } catch (error) {
        console.error('[CompanySupport] Error fetching data:', error);
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

  const pageTitle = content?.title || company?.name || 'Support';

  return (
    <>
      <Helmet>
        <title>{`${pageTitle} - ${CONFIG.appName}`}</title>
      </Helmet>
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Main Content */}
      <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
        <Card sx={{ p: 4 }}>
          <Stack spacing={4}>
            {/* Title */}
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              {content.title}
            </Typography>

            {/* Introduction */}
            <Typography variant="body1" color="text.secondary">
              Need help with our whistleblower reporting system? Our support team is here to assist
              you with any questions or technical issues you may encounter.
            </Typography>

            {/* Content */}
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
                '& img': {
                  maxWidth: '100%',
                  height: 'auto',
                },
              }}
              dangerouslySetInnerHTML={{ __html: content.content }}
            />

            {/* Content Sections */}
            {content.sections &&
              content.sections.length > 0 &&
              content.sections.map((section) => (
                <Box key={section.id}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    {section.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {section.content}
                  </Typography>
                </Box>
              ))}
          </Stack>
        </Card>
      </Box>
    </Box>
    </>
  );
}
