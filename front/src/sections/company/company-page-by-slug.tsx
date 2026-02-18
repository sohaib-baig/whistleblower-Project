import type { CompanyLanding } from 'src/types/company-landing';

import { useParams } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import axios from 'src/lib/axios';
import { CONFIG } from 'src/global-config';
import { getCompanyBySlug } from 'src/actions/company-landing';

// ----------------------------------------------------------------------

export function CompanyPageBySlug() {
  const { slug: companySlug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();
  const { i18n } = useTranslation();
  const [company, setCompany] = useState<CompanyLanding | null>(null);
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!companySlug || !pageSlug) return;

      try {
        setLoading(true);
        setError(null);
        
        const [companyData, pageResponse] = await Promise.all([
          getCompanyBySlug(companySlug),
          axios.get(`/api/v1/public/companies/${companySlug}/pages/${pageSlug}`),
        ]);

        const pageData = pageResponse?.data?.data ?? pageResponse?.data;
        setCompany(companyData);
        setPage(pageData);
      } catch (err: any) {
        console.error('[CompanyPageBySlug] Error fetching data:', err);
        setError(err?.response?.data?.message || 'Page not found');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companySlug, pageSlug, i18n.language]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error || !page) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5" color="error">
          {error || 'Page not found'}
        </Typography>
      </Container>
    );
  }

  const pageTitle = page?.page_title || company?.name || 'Page';

  return (
    <>
      <Helmet>
        <title>{`${pageTitle} - ${CONFIG.appName}`}</title>
      </Helmet>
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Card sx={{ p: { xs: 2, sm: 4 } }}>
            {page.page_title && (
              <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                {page.page_title}
              </Typography>
            )}
            {page.page_content && (
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
                dangerouslySetInnerHTML={{ __html: page.page_content }}
              />
            )}
          </Card>
        </Container>
      </Box>
    </>
  );
}

