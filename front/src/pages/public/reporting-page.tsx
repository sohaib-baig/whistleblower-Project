import { useParams } from 'react-router';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';
import sanctum from 'src/lib/axios-sanctum';
import { fetchPublicCompany } from 'src/actions/public-company';

// ----------------------------------------------------------------------

export default function PublicReportingPage() {
  const { companySlug } = useParams();
  const [companyName, setCompanyName] = useState<string>('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [reportingTitle, setReportingTitle] = useState<string>('');
  const [reportingContent, setReportingContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!companySlug) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch company details (works with both slug and ID for backward compatibility)
        const company = await fetchPublicCompany(companySlug);
        if (company) {
          setCompanyName(company.name || '');
          if (company.logo) {
            // Ensure logo URL is complete
            const logoUrl = company.logo.startsWith('http')
              ? company.logo
              : `${CONFIG.serverUrl}${company.logo}`;
            setCompanyLogo(logoUrl);
          }
        }

        // Fetch reporting page content (works with both slug and ID)
        try {
          const res = await sanctum.get(`/api/v1/public/pages/reporting-page/${companySlug}`);
          const payload: any = (res as any).data || {};
          const page = payload?.data ?? payload;
          setReportingTitle(page.page_title || '');
          setReportingContent(page.page_content || '');
        } catch (e) {
          console.error('Failed to fetch reporting page:', e);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [companySlug]);

  const pageTitle = reportingTitle || companyName || 'Reporting Page';

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>{`Reporting Page - ${CONFIG.appName}`}</title>
        </Helmet>
        <Box
          sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Typography>Loading...</Typography>
        </Box>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${pageTitle} - ${CONFIG.appName}`}</title>
      </Helmet>
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          px: 3,
          py: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          {companyLogo && (
            <Box
              component="img"
              src={companyLogo}
              alt={companyName || 'Company Logo'}
              sx={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 1 }}
            />
          )}
          {companyName && (
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {companyName}
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Card sx={{ p: 4 }}>
          <Stack spacing={3}>
            {/* Title from reporting page or company name */}
            {reportingTitle && (
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                {reportingTitle}
              </Typography>
            )}

            {/* Dynamic content from reporting page */}
            {reportingContent ? (
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
                    // Respect width/height attributes from the editor
                    // maxWidth prevents overflow while allowing smaller images to use their set width
                    maxWidth: '100%',
                    // Don't set height: auto as it overrides the height attribute
                    // The browser will use the height attribute if present, or auto if not
                    display: 'block',
                  },
                }}
                dangerouslySetInnerHTML={{ __html: reportingContent }}
              />
            ) : (
              <Typography variant="body1" color="text.secondary">
                No content available.
              </Typography>
            )}
          </Stack>
        </Card>
      </Box>
    </Box>
    </>
  );
}
