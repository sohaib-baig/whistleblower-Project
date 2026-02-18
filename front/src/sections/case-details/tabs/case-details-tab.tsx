import type { CaseHiddenField } from 'src/types/case-details';

import dayjs from 'dayjs';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { fetchStates } from 'src/actions/state';
import { fetchSeverities } from 'src/actions/severity';
import { fetchDepartments } from 'src/actions/department';
import { createCaseLog, updateCaseAttributes } from 'src/actions/company-case-details';
import { getCategories, getCaseDetails, getCaseManagers } from 'src/actions/company-landing';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

type Props = {
  caseId: string;
};

type OptionItem = {
  id: string;
  name: string;
};

const HIDEABLE_FIELDS: CaseHiddenField[] = [
  'dateTime',
  'subject',
  'description',
  'files',
  'reportingChannel',
  'category',
  'assignedTo',
  'reportingMedium',
  'department',
  'severity',
  'state',
];

const buildVisibilityState = (hiddenFields: CaseHiddenField[]) =>
  HIDEABLE_FIELDS.reduce(
    (acc, field) => {
      acc[field] = !hiddenFields.includes(field);
      return acc;
    },
    {} as Record<CaseHiddenField, boolean>
  );

export default function CaseDetailsTab({ caseId }: Props) {
  const { t } = useTranslate('navbar');
  const { user } = useAuthContext();
  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<OptionItem[]>([]);
  const [severities, setSeverities] = useState<OptionItem[]>([]);
  const [states, setStates] = useState<OptionItem[]>([]);

  // State for visibility toggles
  const [fieldVisibility, setFieldVisibility] = useState<Record<CaseHiddenField, boolean>>(
    () => buildVisibilityState([])
  );

  // State for dropdown values
  const [dropdownValues, setDropdownValues] = useState({
    category: '',
    assignedTo: 'Not Assigned',
    reportingMedium: '',
    department: '',
    severity: '',
    state: '',
  });
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, string | null>>({});
  const [pendingLabels, setPendingLabels] = useState<Record<string, string>>({});
  const [attributeLabels, setAttributeLabels] = useState({
    department: '',
    severity: '',
    state: '',
  });

  // Fetch case details, categories, and case managers from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch case details
        const caseData = await getCaseDetails(caseId);
        if (!caseData) {
          setCaseDetails(null);
          setFieldVisibility(buildVisibilityState([]));
          return;
        }

        const serverHiddenFields = Array.isArray(caseData.hidden_fields)
          ? (caseData.hidden_fields as CaseHiddenField[])
          : [];
        setFieldVisibility(buildVisibilityState(serverHiddenFields));

        // Fetch categories
        const categoriesData = await getCategories();

        // Fetch case managers for the company (using the company from case data or user)
        const companyId =
          user?.role === 'case_manager'
            ? user?.company_id || caseData.company_id
            : caseData.company_id || user?.company_id;
        let caseManagersData: any[] = [];
        if (companyId) {
          caseManagersData = await getCaseManagers(companyId);
        }

        if (companyId) {
          try {
            const [departmentResp, severityResp, stateResp] = await Promise.all([
              fetchDepartments({ per_page: 1000, company_id: companyId }),
              fetchSeverities({ per_page: 1000, company_id: companyId }),
              fetchStates({ per_page: 1000, company_id: companyId }),
            ]);

            const getItemCompanyId = (item: any) =>
              item?.company_id ??
              item?.companyId ??
              item?.company?.id ??
              item?.company?.company_id ??
              item?.company?.companyId ??
              null;

            const normalizedCompanyId = companyId ? String(companyId).toLowerCase() : null;

            const filterByCompany = (items: any[]) =>
              items.filter((item: any) => {
                const itemCompanyId = getItemCompanyId(item);
                if (!normalizedCompanyId) {
                  return true;
                }
                if (!itemCompanyId) {
                  return false;
                }
                return String(itemCompanyId).toLowerCase() === normalizedCompanyId;
              });

            const departmentItems: OptionItem[] = filterByCompany(
              departmentResp.data?.data ?? []
            ).map((item: any) => ({
              id: item.id,
              name: item.name,
            }));
            const severityItems: OptionItem[] = filterByCompany(severityResp.data?.data ?? []).map(
              (item: any) => ({
                id: item.id,
                name: item.name,
              })
            );
            const stateItems: OptionItem[] = filterByCompany(stateResp.data?.data ?? []).map(
              (item: any) => ({
                id: item.id,
                name: item.name,
              })
            );

            setDepartments(departmentItems);
            setSeverities(severityItems);
            setStates(stateItems);
          } catch (listError) {
            console.error('Failed to fetch company-specific options:', listError);
          }
        } else {
          // Reset lists if no company context
          setDepartments([]);
          setSeverities([]);
          setStates([]);
        }


        setCaseDetails({
          id: caseData.id,
          caseId: caseData.case_id,
          dateTime: caseData.created_at,
          subject: caseData.subject,
          description: caseData.description,
          category: caseData.category || 'N/A',
          category_id: caseData.category_id || null,
          reportingMedium: caseData.reporting_medium || 'N/A',
          department: caseData.department_name || 'N/A',
          department_id: caseData.department_id || null,
          severity: caseData.severity_name || 'N/A',
          severity_id: caseData.severity_id || null,
          state: caseData.state_name || 'N/A',
          state_id: caseData.state_id || null,
          assignedTo: caseData.case_manager_name || 'Not Assigned',
          case_manager_id: caseData.case_manager_id || null,
          report_type: caseData.report_type || null,
          status: caseData.status || null,
          open_deadline_time: caseData.open_deadline_time || null,
          close_deadline_time: caseData.close_deadline_time || null,
          other_report_link: caseData.other_report_link || null,
          automatic_delete: caseData.automatic_delete || null,
        });

        setAttributeLabels({
          department: caseData.department_name || '',
          severity: caseData.severity_name || '',
          state: caseData.state_name || '',
        });

        // Find matching category name from fetched categories
        const matchingCategory = categoriesData.find(
          (cat) => cat.name === caseData.category || cat.id === caseData.category_id
        );
        const categoryValue = matchingCategory ? matchingCategory.name : caseData.category || '';

        // Find matching case manager name from fetched case managers
        const matchingCaseManager = caseManagersData.find(
          (cm) => cm.name === caseData.case_manager_name || cm.id === caseData.case_manager_id
        );
        const caseManagerValue = matchingCaseManager
          ? matchingCaseManager.name
          : caseData.case_manager_name || 'Not Assigned';

        // Normalize reporting medium value to match dropdown options (oral is now combined with written)
        const reportingMediumOptions = [t('dashboard.case.caseDetailsTab.written'), t('dashboard.case.caseDetailsTab.phoneCall'), t('dashboard.case.caseDetailsTab.physicalMeeting')];
        // Map database values to display values
        const reportingMediumMap: { [key: string]: string } = {
          written: t('dashboard.case.caseDetailsTab.written'),
          oral: t('dashboard.case.caseDetailsTab.written'), // Convert oral to Written & Oral (combined functionality)
          phone_call: t('dashboard.case.caseDetailsTab.phoneCall'),
          phone: t('dashboard.case.caseDetailsTab.phoneCall'),
          physical_meeting: t('dashboard.case.caseDetailsTab.physicalMeeting'),
          physical: t('dashboard.case.caseDetailsTab.physicalMeeting'),
        };
        const normalizedReportingMedium =
          reportingMediumMap[caseData.reporting_medium?.toLowerCase() || ''] ||
          caseData.reporting_medium;
        const reportingMediumValue =
          normalizedReportingMedium && reportingMediumOptions.includes(normalizedReportingMedium)
            ? normalizedReportingMedium
            : normalizedReportingMedium || '';

        // Set dropdown values based on case data
        const finalDropdownValues = {
          category: categoryValue,
          assignedTo: caseManagerValue,
          reportingMedium: reportingMediumValue,
          department: caseData.department_id || '',
          severity: caseData.severity_id || '',
          state: caseData.state_id || '',
        };
        setDropdownValues(finalDropdownValues);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setCaseDetails(null);
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchData();
    }
  }, [caseId, user?.company_id, user?.role, t]);

  // Update dropdown values when categories/case managers are loaded
  useEffect(() => {
    if (!caseDetails || loading) return;

    // Update department dropdown (store ID)
    if (departments.length > 0) {
      let matchingDepartment: OptionItem | undefined;
      if ((caseDetails as any).department_id) {
        matchingDepartment = departments.find(
          (dep) => dep.id === (caseDetails as any).department_id
        );
      } else if ((caseDetails as any).department && (caseDetails as any).department !== 'N/A') {
        matchingDepartment = departments.find(
          (dep) => dep.name === (caseDetails as any).department
        );
      }
      if (matchingDepartment && dropdownValues.department !== matchingDepartment.id) {
        setDropdownValues((prev) => ({ ...prev, department: matchingDepartment?.id ?? '' }));
      }
      if (matchingDepartment && attributeLabels.department !== matchingDepartment.name) {
        setAttributeLabels((prev) => ({
          ...prev,
          department: matchingDepartment?.name ?? prev.department,
        }));
      }
    }

    if (severities.length > 0) {
      let matchingSeverity: OptionItem | undefined;
      if ((caseDetails as any).severity_id) {
        matchingSeverity = severities.find((sev) => sev.id === (caseDetails as any).severity_id);
      } else if ((caseDetails as any).severity && (caseDetails as any).severity !== 'N/A') {
        matchingSeverity = severities.find((sev) => sev.name === (caseDetails as any).severity);
      }
      if (matchingSeverity && dropdownValues.severity !== matchingSeverity.id) {
        setDropdownValues((prev) => ({ ...prev, severity: matchingSeverity?.id ?? '' }));
      }
      if (matchingSeverity && attributeLabels.severity !== matchingSeverity.name) {
        setAttributeLabels((prev) => ({
          ...prev,
          severity: matchingSeverity?.name ?? prev.severity,
        }));
      }
    }

    if (states.length > 0) {
      let matchingState: OptionItem | undefined;
      if ((caseDetails as any).state_id) {
        matchingState = states.find((st) => st.id === (caseDetails as any).state_id);
      } else if ((caseDetails as any).state && (caseDetails as any).state !== 'N/A') {
        matchingState = states.find((st) => st.name === (caseDetails as any).state);
      }
      if (matchingState && dropdownValues.state !== matchingState.id) {
        setDropdownValues((prev) => ({ ...prev, state: matchingState?.id ?? '' }));
      }
      if (matchingState && attributeLabels.state !== matchingState.name) {
        setAttributeLabels((prev) => ({ ...prev, state: matchingState?.name ?? prev.state }));
      }
    }
  }, [
    departments,
    severities,
    states,
    caseDetails,
    loading,
    dropdownValues.department,
    dropdownValues.severity,
    dropdownValues.state,
    attributeLabels.department,
    attributeLabels.severity,
    attributeLabels.state,
  ]);

  // Log tab view
  useEffect(() => {
    if (caseId && !loading && caseDetails) {
      try {
        createCaseLog(caseId, 'Tab Viewed', 'Case Details Tab (Backend)');
      } catch (logError) {
        console.error('Failed to log tab view:', logError);
      }
    }
  }, [caseId, loading, caseDetails]);

  // Check if user can manage fields (admin, company, case_manager)
  const canManageFields =
    user?.role === 'admin' || user?.role === 'company' || user?.role === 'case_manager';


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!caseDetails) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Typography color="error">{t('dashboard.case.caseDetailsTab.failedToLoad')}</Typography>
      </Box>
    );
  }

  const attributeFields = ['department', 'severity', 'state'] as const;

  const handleDropdownChange = async (field: keyof typeof dropdownValues, value: string) => {
    if (!canManageFields) {
      return;
    }

    const previousValue = dropdownValues[field];

    if (!(attributeFields as readonly string[]).includes(field)) {
      setDropdownValues((prev) => ({
        ...prev,
        [field]: value,
      }));
      return;
    }

    const listMap: Record<(typeof attributeFields)[number], OptionItem[]> = {
      department: departments,
      severity: severities,
      state: states,
    };

    const selectedOption = listMap[field as (typeof attributeFields)[number]].find(
      (item) => item.id === value || item.name === value
    );

    setDropdownValues((prev) => ({
      ...prev,
      [field]: value,
    }));

    const payloadKeyMap: Record<
      (typeof attributeFields)[number],
      'department_id' | 'severity_id' | 'state_id'
    > = {
      department: 'department_id',
      severity: 'severity_id',
      state: 'state_id',
    };

    setPendingUpdates((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (['department', 'severity', 'state'].includes(field)) {
      const attrField = field as keyof typeof attributeLabels;
      setAttributeLabels((prev) => ({
        ...prev,
        [attrField]: selectedOption?.name ?? prev[attrField],
      }));
    }

    setPendingLabels((prev) => ({
      ...prev,
      [field]: selectedOption?.name ?? value,
    }));

    const payloadKey = payloadKeyMap[field as (typeof attributeFields)[number]];
    const payloadValue = value ? value : null;
    const payload: Record<string, string | null> = {
      [payloadKey]: payloadValue,
    };

    try {
      const response = await updateCaseAttributes(caseId, payload);

      setCaseDetails((prev: any) => {
        if (!prev) return prev;
        const nameKey = `${field}_name`;
        const idKey = `${field}_id`;
        return {
          ...prev,
          [field]: response?.data?.[nameKey] ?? 'N/A',
          [idKey]: response?.data?.[idKey] ?? null,
        };
      });

      const updatedId = response?.data?.[`${field}_id`] ?? null;
      setDropdownValues((prev) => ({
        ...prev,
        [field]: updatedId || value || '',
      }));
      if (['department', 'severity', 'state'].includes(field)) {
        const attrField = field as keyof typeof attributeLabels;
        setAttributeLabels((prev) => ({
          ...prev,
          [attrField]: response?.data?.[`${field}_name`] ?? prev[attrField],
        }));
      }
      setPendingUpdates((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
      setPendingLabels((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    } catch (error) {
      console.error(`Failed to update case ${field}:`, error);
      setDropdownValues((prev) => ({
        ...prev,
        [field]: previousValue,
      }));
      setPendingUpdates((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
      setPendingLabels((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const renderDetailItem = (
    label: string,
    value: string,
    fieldKey: CaseHiddenField,
    isDropdown = false,
    options: Array<string | OptionItem> = []
  ) => {
    const selectValue = ((pendingUpdates[fieldKey] ??
      dropdownValues[fieldKey as keyof typeof dropdownValues]) ||
      '') as string;
    const pendingLabel = pendingUpdates[fieldKey] ? pendingLabels[fieldKey] : undefined;
    const isObjectOptions = options.length > 0 && typeof options[0] === 'object';
    const attributeLabel =
      fieldKey === 'department'
        ? attributeLabels.department
        : fieldKey === 'severity'
          ? attributeLabels.severity
          : fieldKey === 'state'
            ? attributeLabels.state
            : '';

    const renderPlaceholder = () => (
      <Typography variant="body2" color="text.secondary">
        {t('dashboard.case.caseDetailsTab.select')}
      </Typography>
    );

    const resolveSelectedLabel = (selected: string) => {
      if (!selected) {
        return renderPlaceholder();
      }
      if (pendingLabel && pendingUpdates[fieldKey] === selected) {
        return pendingLabel;
      }
      if (isObjectOptions) {
        const match = (options as OptionItem[]).find((option) => option.id === selected);
        if (match) {
          return match.name;
        }
        if (attributeLabel) {
          return attributeLabel;
        }
        if (value && value !== 'N/A') {
          return value;
        }
        return renderPlaceholder();
      }
      return selected || (value && value !== 'N/A' ? value : renderPlaceholder());
    };

    return (
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: isDropdown ? 'flex-start' : 'center',
            gap: 1,
            py: isDropdown ? 2 : 1.5,
            flexDirection: isDropdown ? 'column' : 'row',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: isDropdown ? '100%' : 'auto',
              mb: isDropdown ? 1 : 0,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" sx={{ minWidth: 120 }}>
              {label}
            </Typography>

            {canManageFields && (
              <IconButton
                size="small"
                disabled
                sx={{ 
                  p: 0.5,
                  cursor: 'default',
                }}
                aria-label={`Toggle ${label} visibility`}
              >
                <Iconify
                  icon={fieldVisibility[fieldKey] === true ? 'material-symbols:visibility-off' : 'material-symbols:visibility'}
                  sx={{ fontSize: 16 }}
                />
              </IconButton>
            )}
          </Box>

          <Box sx={{ flex: 1, width: isDropdown ? '100%' : 'auto' }}>
            {isDropdown && canManageFields ? (
              <FormControl
                size="medium"
                sx={{
                  minWidth: 280,
                  width: '100%',
                  maxWidth: 400,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: 'background.paper',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: 2,
                    },
                  },
                }}
              >
                <Select
                  value={selectValue}
                  onChange={(e) =>
                    handleDropdownChange(fieldKey as keyof typeof dropdownValues, e.target.value)
                  }
                  displayEmpty
                  sx={{
                    height: 48,
                    fontSize: '0.95rem',
                    '& .MuiSelect-select': {
                      padding: '12px 14px',
                    },
                  }}
                  renderValue={(selected) => {
                    if (typeof selected !== 'string' || selected === '') {
                      return renderPlaceholder();
                    }
                    return resolveSelectedLabel(selected);
                  }}
                >
                  {options.length === 0 ? (
                    <MenuItem value="" disabled>
                      <Typography variant="body2" color="text.secondary">
                        {t('dashboard.case.caseDetailsTab.loading')}
                      </Typography>
                    </MenuItem>
                  ) : (
                    options.map((option) => (
                      <MenuItem
                        key={typeof option === 'string' ? option : option.id}
                        value={typeof option === 'string' ? option : option.id}
                        sx={{ fontSize: '0.95rem' }}
                      >
                        {typeof option === 'string' ? option : option.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            ) : (
              <Typography variant="body1">{value}</Typography>
            )}
          </Box>
        </Box>
        <Divider sx={{ borderStyle: 'dashed' }} />
      </Box>
    );
  };

  return (
    <Card sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {t('dashboard.case.caseDetails')}
        </Typography>
        {caseDetails?.report_type === 'report_annonymously' && (
          <Chip
            label="Anonymous"
            size="small"
            sx={{
              bgcolor: 'grey.100',
              color: 'text.secondary',
              '& .MuiChip-icon': { fontSize: 16 },
            }}
            icon={<Iconify icon="solar:shield-check-bold" />}
          />
        )}
      </Box>

      <Stack spacing={1}>
        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 1.5,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" sx={{ minWidth: 120 }}>
              {t('dashboard.case.caseDetailsTab.caseId')}:
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
              {caseId}
            </Typography>
          </Box>
          <Divider sx={{ borderStyle: 'dashed' }} />
        </Box>
        {renderDetailItem(
          t('dashboard.case.caseDetailsTab.dateTime'),
          caseDetails.dateTime,
          'dateTime'
        )}
        {renderDetailItem(
          t('dashboard.case.caseDetailsTab.subject'),
          caseDetails.subject,
          'subject'
        )}
        {renderDetailItem(
          t('dashboard.case.caseDetailsTab.description'),
          caseDetails.description,
          'description'
        )}
        {renderDetailItem(t('dashboard.case.caseDetailsTab.files'), 'No files', 'files')}
        {renderDetailItem(
          t('dashboard.case.caseDetailsTab.reportingChannel'),
          'Default',
          'reportingChannel'
        )}
        {renderDetailItem(
          t('dashboard.case.caseDetailsTab.assignedTo'),
          caseDetails.assignedTo || 'Not Assigned',
          'assignedTo'
        )}
        {/* Report Settings Fields - Only show if they have values */}
        {caseDetails.status && (
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 1.5,
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" sx={{ minWidth: 120 }}>
                {t('dashboard.case.reportSettingTab.assignStatus')}:
              </Typography>
              <Typography variant="body1">
                {t(`dashboard.case.reportSettingTab.${caseDetails.status === 'in_progress' ? 'inProgress' : caseDetails.status}`) || caseDetails.status}
              </Typography>
            </Box>
            <Divider sx={{ borderStyle: 'dashed' }} />
          </Box>
        )}
        {caseDetails.category && caseDetails.category !== 'N/A' && renderDetailItem(
          t('dashboard.case.caseDetailsTab.category'),
          caseDetails.category,
          'category'
        )}
        {caseDetails.reportingMedium && caseDetails.reportingMedium !== 'N/A' && renderDetailItem(
          t('dashboard.case.caseDetailsTab.reportingMedium'),
          caseDetails.reportingMedium,
          'reportingMedium'
        )}
        {caseDetails.department && caseDetails.department !== 'N/A' && renderDetailItem(
          t('dashboard.case.caseDetailsTab.department'),
          caseDetails.department,
          'department'
        )}
        {caseDetails.severity && caseDetails.severity !== 'N/A' && renderDetailItem(
          t('dashboard.case.caseDetailsTab.severity'),
          caseDetails.severity,
          'severity'
        )}
        {caseDetails.state && caseDetails.state !== 'N/A' && renderDetailItem(
          t('dashboard.case.caseDetailsTab.state'),
          caseDetails.state,
          'state'
        )}
        {caseDetails.open_deadline_time && (() => {
          const openDeadline = dayjs(caseDetails.open_deadline_time, 'DD-MM-YYYY hh:mm A');
          const formattedDate = openDeadline.isValid()
            ? openDeadline.format('YYYY-MM-DD HH:mm')
            : dayjs(caseDetails.open_deadline_time).isValid()
              ? dayjs(caseDetails.open_deadline_time).format('YYYY-MM-DD HH:mm')
              : caseDetails.open_deadline_time;
          return (
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 1.5,
                }}
              >
                <Typography variant="subtitle2" color="text.secondary" sx={{ minWidth: 120 }}>
                  {t('dashboard.case.reportSettingTab.nextOpenStateDeadline')}:
                </Typography>
                <Typography variant="body1">
                  {formattedDate}
                </Typography>
              </Box>
              <Divider sx={{ borderStyle: 'dashed' }} />
            </Box>
          );
        })()}
        {caseDetails.close_deadline_time && (() => {
          const closeDeadline = dayjs(caseDetails.close_deadline_time, 'DD-MM-YYYY hh:mm A');
          const formattedDate = closeDeadline.isValid()
            ? closeDeadline.format('YYYY-MM-DD HH:mm')
            : dayjs(caseDetails.close_deadline_time).isValid()
              ? dayjs(caseDetails.close_deadline_time).format('YYYY-MM-DD HH:mm')
              : caseDetails.close_deadline_time;
          return (
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 1.5,
                }}
              >
                <Typography variant="subtitle2" color="text.secondary" sx={{ minWidth: 120 }}>
                  {t('dashboard.case.reportSettingTab.nextCloseStateDeadline')}:
                </Typography>
                <Typography variant="body1">
                  {formattedDate}
                </Typography>
              </Box>
              <Divider sx={{ borderStyle: 'dashed' }} />
            </Box>
          );
        })()}
        {caseDetails.other_report_link && (
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 1.5,
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" sx={{ minWidth: 120 }}>
                {t('dashboard.case.reportSettingTab.linkWithOtherReport')}:
              </Typography>
              <Typography variant="body1">
                {caseDetails.other_report_link}
              </Typography>
            </Box>
            <Divider sx={{ borderStyle: 'dashed' }} />
          </Box>
        )}
        {caseDetails.automatic_delete && (
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 1.5,
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" sx={{ minWidth: 120 }}>
                {t('dashboard.case.reportSettingTab.autoDeleteAfter30Days')}:
              </Typography>
              <Typography variant="body1">
                {caseDetails.automatic_delete === 'yes' || caseDetails.automatic_delete === true
                  ? t('dashboard.case.reportSettingTab.yes')
                  : t('dashboard.case.reportSettingTab.no')}
              </Typography>
            </Box>
            <Divider sx={{ borderStyle: 'dashed' }} />
          </Box>
        )}
      </Stack>
    </Card>
  );
}
