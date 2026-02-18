import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { useGetPaymentPage } from 'src/actions/payment-page';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

export function PaymentPageList() {
  const { t } = useTranslate('navbar');
  const router = useRouter();

  const { data: paymentPage, isLoading, error } = useGetPaymentPage();

  const handleEdit = () => {
    router.push(paths.dashboard.paymentPage.edit);
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
      title={t('dashboard.paymentPage.error.title')}
      description={t('dashboard.paymentPage.error.description')}
      action={
        <Button variant="contained" onClick={() => window.location.reload()}>
          {t('dashboard.paymentPage.error.retry')}
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
              {paymentPage?.title}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {t('dashboard.paymentPage.lastUpdated')}:{' '}
                {paymentPage?.lastUpdated
                  ? new Date(paymentPage.lastUpdated).toLocaleDateString()
                  : t('dashboard.paymentPage.unknown')}
              </Typography>
            </Stack>
          </Box>

          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:pen-bold" />}
            onClick={handleEdit}
            sx={{ minWidth: 160 }}
          >
            {t('dashboard.paymentPage.editPaymentPageButton')}
          </Button>
        </Stack>

        {/* Payment Page Card */}
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
            dangerouslySetInnerHTML={{ __html: paymentPage?.content || '' }}
          />
        </Card>
      </Stack>
    </Container>
  );

  if (isLoading) {
    return renderLoading();
  }

  // Show error only if we have no data at all
  // If we have default data from error handling, show content instead
  if (error && !paymentPage) {
    return renderError();
  }

  // If we have paymentPage data (either from API or defaults), show content
  if (paymentPage) {
    return renderContent();
  }

  // Fallback: should not reach here, but show error as safety
  return renderError();
}


