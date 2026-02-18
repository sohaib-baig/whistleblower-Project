import type { CaseHiddenField } from 'src/types/case-details';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { getCaseDetails } from 'src/actions/company-landing';
import { createCaseLog } from 'src/actions/company-case-details';

// ----------------------------------------------------------------------

interface CompanyCaseDetailsTabProps {
  caseId: string;
  userId: string;
  companySlug: string;
}

// ----------------------------------------------------------------------

export function CompanyCaseDetailsTab({ caseId, userId, companySlug }: CompanyCaseDetailsTabProps) {
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

        // Log tab view
        try {
          await createCaseLog(caseId, 'Tab Viewed', 'Case Details Tab');
        } catch (logError) {
          console.error('Failed to log tab view:', logError);
        }
      } catch (err: any) {
        console.error('Error fetching case details:', err);
        setError(err.message || 'Failed to load case details');
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchCaseDetails();
    }
  }, [caseId, i18n.language]);

  const renderDetailItem = (label: string, value: string) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ minWidth: 180 }}>
        {label}:
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
        }}
      >
        <Typography color="error">
          {error || t('dashboard.case.caseDetailsTab.failedToLoad', 'Failed to load case details')}
        </Typography>
      </Box>
    );
  }

  if (!caseData) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
        }}
      >
        <Typography>
          {t('dashboard.case.caseDetailsTab.failedToLoad', 'No case data available.')}
        </Typography>
      </Box>
    );
  }

  const hiddenFields = Array.isArray(caseData.hidden_fields)
    ? (caseData.hidden_fields as CaseHiddenField[])
    : [];
  const isFieldVisible = (fieldKey: CaseHiddenField) => !hiddenFields.includes(fieldKey);

  // Format reporting medium for display with translation
  const formatReportingMedium = (medium: string) => {
    if (!medium) return t('dashboard.case.caseDetailsTab.noData', 'N/A');
    const mediumKey = `dashboard.case.caseDetailsTab.${medium.toLowerCase()}`;
    const translated = t(mediumKey);
    // If translation exists (not the same as key), use it; otherwise format it
    return translated !== mediumKey
      ? translated
      : medium
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
  };

  // Format report type for display with translation
  const formatReportType = (reportType: string) => {
    if (!reportType) return t('dashboard.case.caseDetailsTab.noData', 'N/A');
    // Try common report type translations
    const reportTypeMap: Record<string, string> = {
      report_annonymously: t(
        'dashboard.case.caseDetailsTab.reportAnnonymously',
        'Report Annonymously'
      ),
      report_with_personal_details: t(
        'dashboard.case.caseDetailsTab.reportWithPersonalDetails',
        'Report with Personal Details'
      ),
    };

    if (reportTypeMap[reportType]) {
      return reportTypeMap[reportType];
    }

    // Fallback: format the string
    return reportType
      .split('_')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format status for display with translation
  const formatStatus = (status: string) => {
    if (!status) return t('dashboard.case.caseDetailsTab.noData', 'N/A');
    const statusKey = `dashboard.case.statusOptions.${status.toLowerCase()}`;
    const translated = t(statusKey);
    // If translation exists (not the same as key), use it; otherwise capitalize
    return translated !== statusKey ? translated : status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('dashboard.case.caseDetails', 'Case Information')}
      </Typography>

      <Stack spacing={3}>
        {renderDetailItem(
          t('dashboard.case.tableHeaders.caseId', 'Case ID'),
          caseData?.case_id || caseData?.id || caseId
        )}
        {isFieldVisible('dateTime') &&
          renderDetailItem(
            t('dashboard.case.caseDetailsTab.dateTime', 'Date & Time'),
            caseData?.date_time ||
              caseData?.created_at ||
              t('dashboard.case.caseDetailsTab.noData', 'N/A')
          )}
        {isFieldVisible('subject') &&
          renderDetailItem(
            t('dashboard.case.caseDetailsTab.subject', 'Subject'),
            caseData?.subject || caseData?.title || t('dashboard.case.caseDetailsTab.noData', 'N/A')
          )}
        {isFieldVisible('description') &&
          renderDetailItem(
            t('dashboard.case.caseDetailsTab.description', 'Description'),
            caseData?.description || t('dashboard.case.caseDetailsTab.noData', 'N/A')
          )}
        {isFieldVisible('category') &&
          renderDetailItem(
            t('dashboard.case.caseDetailsTab.category', 'Category'),
            caseData?.category || t('dashboard.case.caseDetailsTab.noData', 'N/A')
          )}
        {isFieldVisible('reportingMedium') &&
          renderDetailItem(
            t('dashboard.case.caseDetailsTab.reportingMedium', 'Reporting Medium'),
            formatReportingMedium(caseData?.reporting_medium || '')
          )}
        {renderDetailItem(
          t('dashboard.case.caseDetailsTab.reportType', 'Report Type'),
          formatReportType(caseData?.report_type || '')
        )}
        {renderDetailItem(
          t('dashboard.case.tableHeaders.status', 'Status'),
          formatStatus(caseData?.status || '')
        )}
        {caseData?.case_manager_name &&
          isFieldVisible('assignedTo') &&
          renderDetailItem(
            t('dashboard.case.caseDetailsTab.assignedTo', 'Case Manager'),
            caseData.case_manager_name
          )}
        {caseData?.email &&
          renderDetailItem(
            t('dashboard.case.caseManagers.tableHeaders.email', 'Email'),
            caseData.email
          )}
      </Stack>
    </Box>
  );
}
