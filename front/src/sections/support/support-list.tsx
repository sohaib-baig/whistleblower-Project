import { varAlpha } from 'minimal-shared/utils';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import { useGetSupport } from 'src/actions/support';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function SupportList() {
  const { t } = useTranslate('navbar');
  const router = useRouter();
  const { user } = useAuthContext();

  const { data: support, isLoading, error } = useGetSupport();
  const [copied, setCopied] = useState(false);

  const publicUrl = useMemo(() => {
    const origin = (
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : CONFIG.serverUrl || ''
    ).replace(/\/$/, '');

    const companyIdentifier =
      user?.companySlug ||
      user?.company_slug ||
      user?.slug ||
      '';

    const isCompany = (user?.role || '').toLowerCase() === 'company';

    if (isCompany && companyIdentifier) {
      return origin
        ? `${origin}/company/${companyIdentifier}/support`
        : `/company/${companyIdentifier}/support`;
    }

    return origin ? `${origin}/support` : '/support';
  }, [user]);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopyUrl = async () => {
    if (!publicUrl || typeof navigator === 'undefined' || !navigator.clipboard) {
      console.warn('Clipboard API not available to copy support URL');
      return;
    }

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy support URL', err);
    }
  };

  const handleEdit = () => {
    router.push(paths.dashboard.support.edit);
  };

  const renderLoading = () => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
      }}
    >
      <CircularProgress />
    </Box>
  );

  const renderError = () => (
    <EmptyContent
      filled
      title={t('dashboard.support.error.title')}
      description={t('dashboard.support.error.description')}
      action={
        <Button variant="contained" onClick={() => window.location.reload()}>
          {t('dashboard.support.error.retry')}
        </Button>
      }
    />
  );

  const renderContent = () => (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header with Edit Button */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
              {support?.title}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {t('dashboard.support.lastUpdated')}:{' '}
                {support?.lastUpdated
                  ? new Date(support.lastUpdated).toLocaleDateString()
                  : t('dashboard.support.unknown')}
              </Typography>
            </Stack>
          </Box>

          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:pen-bold" />}
            onClick={handleEdit}
            sx={{ minWidth: 160 }}
          >
            {t('dashboard.support.editSupportButton')}
          </Button>
        </Stack>

        {/* Support Card */}
        <Card
          sx={{
            p: 4,
            borderRadius: 2,
            boxShadow: (theme) =>
              `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            bgcolor: 'grey.200',
          }}
        >
          <Box
            sx={{
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                color: 'text.primary',
                fontWeight: 600,
                mb: 2,
                mt: 3,
                '&:first-of-type': {
                  mt: 0,
                },
              },
              '& h1': {
                fontSize: { xs: '1.5rem', md: '2rem' },
                mb: 3,
              },
              '& h2': {
                fontSize: { xs: '1.25rem', md: '1.5rem' },
              },
              '& h3': {
                fontSize: { xs: '1.125rem', md: '1.25rem' },
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
              '& strong': {
                fontWeight: 600,
                color: 'text.primary',
              },
              '& a': {
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              },
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 1,
                my: 2,
              },
              '& blockquote': {
                borderLeft: 4,
                borderColor: 'primary.main',
                pl: 2,
                py: 1,
                my: 2,
                backgroundColor: 'grey.50',
                fontStyle: 'italic',
              },
              '& code': {
                backgroundColor: 'grey.100',
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                fontSize: '0.875em',
                fontFamily: 'monospace',
              },
              '& pre': {
                backgroundColor: 'grey.100',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                '& code': {
                  backgroundColor: 'transparent',
                  p: 0,
                },
              },
              '& table': {
                width: '100%',
                borderCollapse: 'collapse',
                mb: 2,
                '& th, & td': {
                  border: 1,
                  borderColor: 'divider',
                  p: 1,
                  textAlign: 'left',
                },
                '& th': {
                  backgroundColor: 'grey.50',
                  fontWeight: 600,
                },
              },
            }}
            dangerouslySetInnerHTML={{ __html: support?.content || '' }}
          />
        </Card>

        <Card
          sx={{
            p: 4,
            borderRadius: 2,
            boxShadow: (theme) => theme.customShadows.z1,
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h5">
              {t('dashboard.support.publicLinkTitle', { defaultValue: 'Public page URL' })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.support.publicLinkDescription', {
                defaultValue: 'Share or embed this link to show the public support page.',
              })}
            </Typography>

            <Stack
              spacing={2}
              direction={{ xs: 'column', md: 'row' }}
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Link
                href={publicUrl}
                target="_blank"
                rel="noopener"
                sx={{ wordBreak: 'break-all', fontWeight: 600 }}
              >
                {publicUrl}
              </Link>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  color={copied ? 'success' : 'inherit'}
                  startIcon={
                    <Iconify icon={copied ? 'solar:check-circle-bold' : 'solar:copy-bold'} />
                  }
                  onClick={handleCopyUrl}
                >
                  {copied
                    ? t('dashboard.support.publicLinkCopied', { defaultValue: 'Copied!' })
                    : t('dashboard.support.copyLink', { defaultValue: 'Copy link' })}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Iconify icon="solar:external-drive-bold" />}
                  onClick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
                >
                  {t('dashboard.support.viewPublicPage', { defaultValue: 'Open page' })}
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );

  if (isLoading) {
    return renderLoading();
  }

  if (error || !support) {
    return renderError();
  }

  return renderContent();
}
