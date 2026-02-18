import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance from 'src/lib/axios';
import { CONFIG } from 'src/global-config';

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
    return { title: 'Terms & Conditions', content: '' };
  }
  return {
    title: payload.page_title || payload.title || 'Terms & Conditions',
    content: payload.page_content || payload.content || '',
    updated_at: payload.updated_at,
  };
};

export default function TermsConditionsPublicPage() {
  const [terms, setTerms] = useState<TermsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        console.error('Failed to load terms & conditions page:', err);
        setError(err?.message || 'Failed to load terms & conditions.');
        setTerms(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  const pageTitle = terms?.title || 'Terms & Conditions';

  return (
    <>
      <Helmet>
        <title>{`${pageTitle} - ${CONFIG.appName}`}</title>
      </Helmet>
      <Container sx={{ py: { xs: 6, md: 10 }, maxWidth: 960 }}>
      <Typography variant="h2" sx={{ mb: 3, textAlign: 'center' }}>
        {terms?.title || 'Terms & Conditions'}
      </Typography>
      {loading && (
        <Typography align="center" sx={{ color: 'text.secondary', mt: 4 }}>
          <CircularProgress size={28} sx={{ mr: 1 }} /> Loading...
        </Typography>
      )}
      {error && !loading && (
        <Typography align="center" color="error" sx={{ mt: 4 }}>
          {error}
        </Typography>
      )}
      {!loading && !error && terms && <PrivacyPolicyContent content={terms.content ?? ''} />}
    </Container>
    </>
  );
}
