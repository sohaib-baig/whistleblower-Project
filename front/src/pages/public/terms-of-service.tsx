import { Helmet } from 'react-helmet-async';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance from 'src/lib/axios';
import { CONFIG } from 'src/global-config';
import { LanguagePopover } from 'src/layouts/components/language-popover';

import { Logo } from 'src/components/logo';

import { PrivacyPolicyContent } from 'src/sections/privacy-policy/privacy-policy-content';

// ----------------------------------------------------------------------

type PagePayload = {
  page_title?: string;
  title?: string;
  page_content?: string;
  content?: string;
  updated_at?: string;
};

type TermsResponse = {
  title: string;
  content: string;
  updated_at?: string;
};

const normalizePayload = (payload: PagePayload | null | undefined): TermsResponse => {
  if (!payload) {
    return { title: 'Terms of Service', content: '' };
  }
  return {
    title: payload.page_title || payload.title || 'Terms of Service',
    content: payload.page_content || payload.content || '',
    updated_at: payload.updated_at,
  };
};

const LANGUAGES = [
  { value: 'sv', label: 'Swedish', countryCode: 'SE' },
  { value: 'en', label: 'English', countryCode: 'GB' },
  { value: 'no', label: 'Norwegian', countryCode: 'NO' },
  { value: 'da', label: 'Danish', countryCode: 'DK' },
  { value: 'fi', label: 'Finnish', countryCode: 'FI' },
  { value: 'de', label: 'German', countryCode: 'DE' },
  { value: 'fr', label: 'French', countryCode: 'FR' },
];

export default function TermsOfServicePublicPage() {
  const [terms, setTerms] = useState<TermsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updatedLabel = useMemo(() => {
    if (!terms?.updated_at) {
      return 'Recently updated';
    }
    return new Date(terms.updated_at).toLocaleDateString();
  }, [terms?.updated_at]);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setError(null);
        setLoading(true);

        const response = await axiosInstance.get('/api/v1/public/pages/terms-conditions', {
          baseURL: CONFIG.serverUrl || undefined,
        });

        const raw = (response as any)?.data ?? response;
        const payload = raw?.data ?? raw;
        setTerms(normalizePayload(payload));
      } catch (err: any) {
        console.error('Failed to load terms of service page:', err);
        setError(err?.message || 'Failed to load terms of service.');
        setTerms(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  const pageTitle = terms?.title || 'Terms of Service';

  return (
    <>
      <Helmet>
        <title>{`${pageTitle} - ${CONFIG.appName}`}</title>
      </Helmet>
      <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        backgroundImage: (theme) =>
          `linear-gradient(135deg, ${theme.vars.palette.grey[50]} 0%, ${theme.vars.palette.common.white} 100%)`,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: { xs: 2, md: 6 }, py: 2 }}
      >
        <Logo />
        <LanguagePopover data={LANGUAGES} />
      </Stack>

      <Container sx={{ py: { xs: 4, md: 8 }, maxWidth: 960 }}>
        <Typography variant="overline" sx={{ color: 'primary.main', letterSpacing: 1.2 }}>
          Updated {updatedLabel}
        </Typography>

        <Typography variant="h3" sx={{ mb: 2, fontWeight: 700 }}>
          {terms?.title || 'Terms of Service'}
        </Typography>

        {/* <Typography sx={{ mb: 5, color: 'text.secondary', maxWidth: 720 }}>
          These terms describe how Wisling operates the whistleblowing management platform and the responsibilities
          of organizations using it. The administrator manages this content and any changes appear immediately after
          saving.
        </Typography> */}

        {loading && (
          <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
            <CircularProgress size={32} />
            <Typography sx={{ color: 'text.secondary' }}>Loading terms of service…</Typography>
          </Stack>
        )}

        {error && !loading && (
          <Typography align="center" color="error" sx={{ mt: 4 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && terms && <PrivacyPolicyContent content={terms.content ?? ''} />}
      </Container>
    </Box>
    </>
  );
}
