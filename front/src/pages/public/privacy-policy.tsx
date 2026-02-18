import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

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

type PrivacyPolicyResponse = {
  title: string;
  content: string;
  updated_at?: string;
};

const normalizePayload = (payload: PagePayload | null | undefined): PrivacyPolicyResponse => {
  if (!payload) {
    return { title: 'Privacy Policy', content: '' };
  }
  return {
    title: payload.page_title || payload.title || 'Privacy Policy',
    content: payload.page_content || payload.content || '',
    updated_at: payload.updated_at,
  };
};

export default function PrivacyPolicyPublicPage() {
  const [policy, setPolicy] = useState<PrivacyPolicyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const LANGUAGES = [
    { value: 'sv', label: 'Swedish', countryCode: 'SE' },
    { value: 'en', label: 'English', countryCode: 'GB' },
    { value: 'no', label: 'Norwegian', countryCode: 'NO' },
    { value: 'da', label: 'Danish', countryCode: 'DK' },
    { value: 'fi', label: 'Finnish', countryCode: 'FI' },
    { value: 'de', label: 'German', countryCode: 'DE' },
    { value: 'fr', label: 'French', countryCode: 'FR' },
  ];

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setError(null);
        setLoading(true);

        const response = await axiosInstance.get('/api/v1/public/pages/privacy-policy', {
          baseURL: CONFIG.serverUrl || undefined,
        });

        const raw = (response as any)?.data ?? response;
        const payload = raw?.data ?? raw;
        setPolicy(normalizePayload(payload));
      } catch (err: any) {
        console.error('Failed to load privacy policy page:', err);
        setError(err?.message || 'Failed to load privacy policy.');
        setPolicy(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  const pageTitle = policy?.title || 'Privacy Policy';

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
          Updated{' '}
          {policy?.updated_at ? new Date(policy.updated_at).toLocaleDateString() : 'recently'}
        </Typography>

        <Typography variant="h3" sx={{ mb: 2, fontWeight: 700 }}>
          {policy?.title || 'Privacy Policy'}
        </Typography>

        {/* <Typography sx={{ mb: 5, color: 'text.secondary', maxWidth: 720 }}>
          We value transparency. This page outlines how Wisling processes data, keeps whistleblowers safe, and
          complies with applicable regulations. Content below is managed by your administrator and updates
          immediately once saved.
        </Typography> */}

        {loading && (
          <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
            <CircularProgress size={32} />
            <Typography sx={{ color: 'text.secondary' }}>Loading privacy policy…</Typography>
          </Stack>
        )}

        {error && !loading && (
          <Typography align="center" color="error" sx={{ mt: 4 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && policy && <PrivacyPolicyContent content={policy.content ?? ''} />}
      </Container>
    </Box>
    </>
  );
}
