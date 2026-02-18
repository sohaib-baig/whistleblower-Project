import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { getCaseDetails } from 'src/actions/company-landing';

// ----------------------------------------------------------------------

interface CompanyReportSettingTabProps {
  caseId: string;
  userId: string;
  companySlug: string;
}

// ----------------------------------------------------------------------

export function CompanyReportSettingTab({
  caseId,
  userId,
  companySlug,
}: CompanyReportSettingTabProps) {
  const { t } = useTranslate('navbar');
  const { i18n } = useTranslation();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCaseDetails(caseId);
        setCaseData(data);
      } catch (err: any) {
        console.error('Error fetching case details:', err);
        setError(err.message || 'Failed to load report settings');
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchCaseDetails();
    }
  }, [caseId, i18n.language]);

  const renderField = (label: string, value: string) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ minWidth: 250 }}>
        {label}:
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 500 }}>
        {value || 'N/A'}
      </Typography>
    </Box>
  );

  // Format status for display with translation
  const formatStatus = (status: string | null) => {
    if (!status) return t('dashboard.case.caseDetailsTab.noData', 'N/A');
    const statusKey = `dashboard.case.statusOptions.${status.toLowerCase()}`;
    const translated = t(statusKey);
    // If translation exists (not the same as key), use it; otherwise capitalize
    return translated !== statusKey ? translated : status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Format automatic delete value with translation
  const formatAutomaticDelete = (value: string | null | number | boolean) => {
    const yes = t('dashboard.case.reportSettingTab.yes', 'Yes');
    const no = t('dashboard.case.reportSettingTab.no', 'No');

    if (value === null || value === undefined) return no;
    if (typeof value === 'boolean') return value ? yes : no;
    if (typeof value === 'number') return value ? yes : no;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === '1' || lower === 'true' || lower === 'yes') return yes;
      if (lower === '0' || lower === 'false' || lower === 'no') return no;
    }
    return value.toString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!caseData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Typography>No report settings available.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('dashboard.case.reportSettingTab.heading', 'Report Details')}
      </Typography>

      <Stack spacing={3} sx={{ mt: 3 }}>
        {renderField(
          t('dashboard.case.reportSettingTab.assignTo', 'Assign To'),
          caseData?.case_manager_name || t('dashboard.case.caseDetailsTab.noData', 'N/A')
        )}
        {renderField(
          t('dashboard.case.reportSettingTab.assignStatus', 'Assign Status'),
          formatStatus(caseData?.status)
        )}
        {renderField(
          t(
            'dashboard.case.reportSettingTab.nextOpenStateDeadline',
            'Next Open State Deadline Time'
          ),
          caseData?.open_deadline_time || t('dashboard.case.caseDetailsTab.noData', 'N/A')
        )}
        {renderField(
          t(
            'dashboard.case.reportSettingTab.nextCloseStateDeadline',
            'Next Close State Deadline Time'
          ),
          caseData?.close_deadline_time || t('dashboard.case.caseDetailsTab.noData', 'N/A')
        )}
        {renderField(
          t('dashboard.case.reportSettingTab.linkWithOtherReport', 'Link with another report'),
          caseData?.other_report_link || t('dashboard.case.caseDetailsTab.noData', 'N/A')
        )}
        {renderField(
          t(
            'dashboard.case.reportSettingTab.autoDeleteAfter30Days',
            'Automatically Delete after 30 days'
          ),
          formatAutomaticDelete(caseData?.automatic_delete)
        )}
      </Stack>
    </Box>
  );
}
