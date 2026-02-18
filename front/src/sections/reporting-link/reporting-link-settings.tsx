import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function ReportingLinkSettings() {
  const { t } = useTranslate('navbar');
  const { user } = useAuthContext();

  const reportingUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : CONFIG.serverUrl;

    // Always use slug for URLs (don't fall back to ID)
    const companySlug = (user as any)?.companySlug || 
                       (user as any)?.company_slug || 
                       (user as any)?.slug ||
                       '';
    
    const identifier = companySlug;

    return `${origin}/company/${identifier}/`;
  }, [user]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(reportingUrl);
    // You might want to add a toast notification here
  };

  const handleOpenPage = () => {
    window.open(reportingUrl, '_blank');
  };

  return (
    <Box>
      <Stack spacing={2}>
        {/* Header with Open Page button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              {t('dashboard.reportingLink.customizeChannel')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.reportingLink.customizeDescription')}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:external-link-fill" />}
            onClick={handleOpenPage}
          >
            {t('dashboard.reportingLink.openPage')}
          </Button>
        </Box>

        {/* Reporting Link Field */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('dashboard.reportingLink.reportingLink')}
          </Typography>
          <TextField
            fullWidth
            value={reportingUrl}
            InputProps={{
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:link-2-fill" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={handleCopyUrl}
                    startIcon={<Iconify icon="solar:copy-bold" />}
                  >
                    {t('dashboard.reportingLink.copy')}
                  </Button>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Stack>
    </Box>
  );
}
