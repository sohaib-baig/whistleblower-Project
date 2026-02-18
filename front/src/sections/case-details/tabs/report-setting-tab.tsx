import { z as zod } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { fetchStates } from 'src/actions/state';
import { fetchSeverities } from 'src/actions/severity';
import { fetchDepartments } from 'src/actions/department';
import { getCategories, getCaseDetails, getCaseManagers } from 'src/actions/company-landing';
import {
  createCaseLog,
  updateCaseReportSettings,
  type UpdateReportSettingsData,
} from 'src/actions/company-case-details';

import { toast } from 'src/components/snackbar';
import { RHFSelect, RHFTextField } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

type Props = {
  caseId: string;
};

type OptionItem = {
  id: string;
  name: string;
};

export default function ReportSettingTab({ caseId }: Props) {
  const { t } = useTranslate('navbar');
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [caseManagers, setCaseManagers] = useState<any[]>([]);
  const [caseData, setCaseData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<OptionItem[]>([]);
  const [severities, setSeverities] = useState<OptionItem[]>([]);
  const [states, setStates] = useState<OptionItem[]>([]);

  const ReportSettingSchema = zod.object({
    assignedTo: zod.string().optional(),
    assignStatus: zod.string().min(1, t('dashboard.case.reportSettingTab.assignStatusRequired')),
    openDeadlineNumber: zod.number().nullable().optional(),
    openDeadlinePeriod: zod.string().nullable().optional(),
    closeDeadlineNumber: zod.number().nullable().optional(),
    closeDeadlinePeriod: zod.string().nullable().optional(),
    linkWithOtherReport: zod.string().nullable().optional(),
    autoDeleteAfter30Days: zod.string().optional(),
    category: zod.string().optional(),
    department: zod.string().optional(),
    severity: zod.string().optional(),
    state: zod.string().optional(),
  });

  type ReportSettingValues = zod.infer<typeof ReportSettingSchema>;

  const defaultValues = {
    assignedTo: '',
    assignStatus: 'new',
    openDeadlineNumber: null as number | null,
    openDeadlinePeriod: null as string | null,
    closeDeadlineNumber: null as number | null,
    closeDeadlinePeriod: null as string | null,
    linkWithOtherReport: '',
    autoDeleteAfter30Days: 'No',
    category: '',
    department: '',
    severity: '',
    state: '',
  };

  const methods = useForm<ReportSettingValues>({
    resolver: zodResolver(ReportSettingSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  // Fetch case data and case managers - extracted to reusable function
  const fetchData = useCallback(async () => {
      try {
        setLoading(true);

        // Fetch case details
        const data = await getCaseDetails(caseId);
        if (!data) {
          toast.error(t('dashboard.case.reportSettingTab.failedToLoad'));
          return;
        }
        setCaseData(data);

        // Fetch case managers for the company
        const companyId = data.company_id || user?.company_id;
        let caseManagersData: any[] = [];
        if (companyId) {
          caseManagersData = await getCaseManagers(companyId);
          setCaseManagers(caseManagersData);
        }

        // Fetch categories
        const categoriesData = await getCategories();
        setCategories(categoriesData);

        // Fetch departments, severities, and states for the company
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
        }

        // Populate form with case data
        // Convert case manager ID to name for the dropdown
        let assignedToValue = '';
        if (data.case_manager_id && caseManagersData.length > 0) {
          const matchingManager = caseManagersData.find((cm) => cm.id === data.case_manager_id);
          assignedToValue = matchingManager ? matchingManager.name : '';
        }

        // Get deadline number and period from API response
        const openDeadlineNumber = data.open_deadline_number ?? null;
        const openDeadlinePeriod = data.open_deadline_period ?? null;
        const closeDeadlineNumber = data.close_deadline_number ?? null;
        const closeDeadlinePeriod = data.close_deadline_period ?? null;

        // Find matching category name from fetched categories
        const matchingCategory = categoriesData.find(
          (cat) => cat.name === data.category || cat.id === data.category_id
        );
        const categoryValue = matchingCategory ? matchingCategory.name : data.category || '';

        reset({
          assignedTo: assignedToValue,
          assignStatus: data.status || 'new',
          openDeadlineNumber,
          openDeadlinePeriod,
          closeDeadlineNumber,
          closeDeadlinePeriod,
          linkWithOtherReport: data.other_report_link || '',
          autoDeleteAfter30Days: data.automatic_delete ? 'Yes' : 'No',
          category: categoryValue,
          department: data.department_id || '',
          severity: data.severity_id || '',
          state: data.state_id || '',
        });

        // Log tab view
        try {
          await createCaseLog(caseId, 'Tab Viewed', 'Report Setting Tab (Backend)');
        } catch (logError) {
          console.error('Failed to log tab view:', logError);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        toast.error(err.message || t('dashboard.case.reportSettingTab.failedToLoad'));
      } finally {
        setLoading(false);
      }
  }, [caseId, user?.company_id, reset, t]);

  // Fetch case data on mount and when caseId changes
  useEffect(() => {
    if (caseId) {
      fetchData();
    }
  }, [caseId, fetchData]);

  const onSubmit = handleSubmit(
    async (data) => {
      try {
        setSaving(true);

        // Find case manager ID from name
        let caseManagerId = null;
        if (data.assignedTo) {
          const selectedManager = caseManagers.find(
            (cm) => cm.name === data.assignedTo || cm.id === data.assignedTo
          );
          caseManagerId = selectedManager ? selectedManager.id : data.assignedTo;
        }

        // Find category ID from name
        let categoryId = null;
        if (data.category) {
          const selectedCategory = categories.find(
            (cat) => cat.name === data.category || cat.id === data.category
          );
          categoryId = selectedCategory ? selectedCategory.id : data.category;
        }

        const updateData: UpdateReportSettingsData = {
          case_manager_id: caseManagerId,
          status: data.assignStatus,
          open_deadline_number: data.openDeadlineNumber ?? null,
          open_deadline_period: data.openDeadlinePeriod ?? null,
          close_deadline_number: data.closeDeadlineNumber ?? null,
          close_deadline_period: data.closeDeadlinePeriod ?? null,
          other_report_link: data.linkWithOtherReport || null,
          automatic_delete: data.autoDeleteAfter30Days === 'Yes',
          case_category_id: categoryId || null,
          department_id: data.department || null,
          severity_id: data.severity || null,
          state_id: data.state || null,
        };

        await updateCaseReportSettings(caseId, updateData);

        toast.success(t('dashboard.case.reportSettingTab.updatedSuccessfully'));

        // Log the action
        try {
          await createCaseLog(caseId, 'Report Settings Updated', `Status: ${data.assignStatus}`);
        } catch (logError) {
          console.error('Failed to log settings update:', logError);
        }

        // Refetch case data to update the form with saved values
        await fetchData();
      } catch (error: any) {
        console.error('Form submission error:', error);
        toast.error(error.message || t('dashboard.case.reportSettingTab.failedToUpdate'));
      } finally {
        setSaving(false);
      }
    },
    (validationErrors) => {
      console.error('Form validation errors:', validationErrors);
      toast.error(t('dashboard.case.reportSettingTab.fixFormErrors'));
    }
  );

  if (loading) {
    return (
      <Card sx={{ p: 3 }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}
        >
          <CircularProgress />
        </Box>
      </Card>
    );
  }

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{
            py: 1.5,            
          }}>
        {t('dashboard.case.reportSettingTab.heading')}
      </Typography>

      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFSelect
                name="assignedTo"
                label={t('dashboard.case.reportSettingTab.assignTo')}
                placeholder={t('dashboard.case.reportSettingTab.selectCaseManager')}
              >
                {caseManagers.length === 0 ? (
                  <MenuItem value="" disabled>
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.case.reportSettingTab.loadingCaseManagers')}
                    </Typography>
                  </MenuItem>
                ) : (
                  caseManagers.map((manager) => (
                    <MenuItem key={manager.id} value={manager.name}>
                      {manager.name}
                    </MenuItem>
                  ))
                )}
              </RHFSelect>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFSelect
                name="assignStatus"
                label={t('dashboard.case.reportSettingTab.assignStatus')}
                placeholder={t('dashboard.case.reportSettingTab.selectStatus')}
              >
                <MenuItem value="new">{t('dashboard.case.reportSettingTab.new')}</MenuItem>
                <MenuItem value="open">{t('dashboard.case.reportSettingTab.open')}</MenuItem>
                <MenuItem value="in_progress">
                  {t('dashboard.case.reportSettingTab.inProgress')}
                </MenuItem>
                <MenuItem value="closed">{t('dashboard.case.reportSettingTab.closed')}</MenuItem>
                <MenuItem value="pending">{t('dashboard.case.reportSettingTab.pending')}</MenuItem>
                <MenuItem value="resolved">{t('dashboard.case.reportSettingTab.resolved')}</MenuItem>
                <MenuItem value="rejected">{t('dashboard.case.reportSettingTab.rejected')}</MenuItem>
                <MenuItem value="cancelled">{t('dashboard.case.reportSettingTab.cancelled')}</MenuItem>
                <MenuItem value="spam">{t('dashboard.case.reportSettingTab.spam')}</MenuItem>
                <MenuItem value="other">{t('dashboard.case.reportSettingTab.other')}</MenuItem>
              </RHFSelect>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('dashboard.case.reportSettingTab.nextOpenStateDeadline')}
              </Typography>
              <Stack direction="row" spacing={2}>
                <RHFTextField
                  name="openDeadlineNumber"
                  type="number"
                  placeholder="0"
                  sx={{ flex: 1 }}
                  slotProps={{
                    htmlInput: {
                      min: 0,
                    },
                  }}
                />
                <RHFSelect
                  name="openDeadlinePeriod"
                  placeholder={t('dashboard.case.reportSettingTab.selectPeriod')}
                  sx={{ flex: 1 }}
                >
                  <MenuItem value="daily">{t('dashboard.case.reportSettingTab.daily')}</MenuItem>
                  <MenuItem value="weekly">{t('dashboard.case.reportSettingTab.weekly')}</MenuItem>
                  <MenuItem value="monthly">{t('dashboard.case.reportSettingTab.monthly')}</MenuItem>
                  <MenuItem value="yearly">{t('dashboard.case.reportSettingTab.yearly')}</MenuItem>
                </RHFSelect>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('dashboard.case.reportSettingTab.nextOpenStateDeadlineHelper')}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('dashboard.case.reportSettingTab.nextCloseStateDeadline')}
              </Typography>
              <Stack direction="row" spacing={2}>
                <RHFTextField
                  name="closeDeadlineNumber"
                  type="number"
                  placeholder="0"
                  sx={{ flex: 1 }}
                  slotProps={{
                    htmlInput: {
                      min: 0,
                    },
                  }}
                />
                <RHFSelect
                  name="closeDeadlinePeriod"
                  placeholder={t('dashboard.case.reportSettingTab.selectPeriod')}
                  sx={{ flex: 1 }}
                >
                  <MenuItem value="daily">{t('dashboard.case.reportSettingTab.daily')}</MenuItem>
                  <MenuItem value="weekly">{t('dashboard.case.reportSettingTab.weekly')}</MenuItem>
                  <MenuItem value="monthly">{t('dashboard.case.reportSettingTab.monthly')}</MenuItem>
                  <MenuItem value="yearly">{t('dashboard.case.reportSettingTab.yearly')}</MenuItem>
                </RHFSelect>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('dashboard.case.reportSettingTab.nextCloseStateDeadlineHelper')}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFTextField
                name="linkWithOtherReport"
                label={t('dashboard.case.reportSettingTab.linkWithOtherReport')}
                placeholder={t('dashboard.case.reportSettingTab.linkWithOtherReportPlaceholder')}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFSelect
                name="autoDeleteAfter30Days"
                label={t('dashboard.case.reportSettingTab.autoDeleteAfter30Days')}
                placeholder={t('dashboard.case.reportSettingTab.selectOption')}
              >
                <MenuItem value="Yes">{t('dashboard.case.reportSettingTab.yes')}</MenuItem>
                <MenuItem value="No">{t('dashboard.case.reportSettingTab.no')}</MenuItem>
              </RHFSelect>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFSelect
                name="category"
                label={t('dashboard.case.caseDetailsTab.category')}
                placeholder={t('dashboard.case.caseDetailsTab.select')}
              >
                {categories.length === 0 ? (
                  <MenuItem value="" disabled>
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.case.caseDetailsTab.loading')}
                    </Typography>
                  </MenuItem>
                ) : (
                  categories.map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                      {category.name}
                    </MenuItem>
                  ))
                )}
              </RHFSelect>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFSelect
                name="department"
                label={t('dashboard.case.caseDetailsTab.department')}
                placeholder={t('dashboard.case.caseDetailsTab.select')}
                slotProps={{ inputLabel: { shrink: true } }}
              >
                {departments.length === 0 ? (
                  <MenuItem value="" disabled>
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.case.caseDetailsTab.loading')}
                    </Typography>
                  </MenuItem>
                ) : (
                  departments.map((department) => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name}
                    </MenuItem>
                  ))
                )}
              </RHFSelect>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFSelect
                name="severity"
                label={t('dashboard.case.caseDetailsTab.severity')}
                placeholder={t('dashboard.case.caseDetailsTab.select')}
                slotProps={{ inputLabel: { shrink: true } }}
              >
                {severities.length === 0 ? (
                  <MenuItem value="" disabled>
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.case.caseDetailsTab.loading')}
                    </Typography>
                  </MenuItem>
                ) : (
                  severities.map((severity) => (
                    <MenuItem key={severity.id} value={severity.id}>
                      {severity.name}
                    </MenuItem>
                  ))
                )}
              </RHFSelect>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFSelect
                name="state"
                label={t('dashboard.case.caseDetailsTab.state')}
                placeholder={t('dashboard.case.caseDetailsTab.select')}
              >
                {states.length === 0 ? (
                  <MenuItem value="" disabled>
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.case.caseDetailsTab.loading')}
                    </Typography>
                  </MenuItem>
                ) : (
                  states.map((state) => (
                    <MenuItem key={state.id} value={state.id}>
                      {state.name}
                    </MenuItem>
                  ))
                )}
              </RHFSelect>
            </Grid>
          </Grid>
        </form>

        {Object.keys(errors).length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
            <Typography variant="body2" color="error.main">
              {t('dashboard.case.reportSettingTab.pleaseFixErrors')}
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              {Object.entries(errors).map(([field, error]: [string, any]) => (
                <li key={field}>
                  <Typography variant="caption" color="error.main">
                    {field}: {error?.message || t('dashboard.case.reportSettingTab.invalidValue')}
                  </Typography>
                </li>
              ))}
            </Box>
          </Box>
        )}

        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            disabled={saving}
            onClick={() => {
              // Reset form to initial values
              if (caseData) {
                const openDeadlineNumber = caseData.open_deadline_number ?? null;
                const openDeadlinePeriod = caseData.open_deadline_period ?? null;
                const closeDeadlineNumber = caseData.close_deadline_number ?? null;
                const closeDeadlinePeriod = caseData.close_deadline_period ?? null;

                let assignedToValue = '';
                if (caseData.case_manager_id && caseManagers.length > 0) {
                  const matchingManager = caseManagers.find(
                    (cm) => cm.id === caseData.case_manager_id
                  );
                  assignedToValue = matchingManager ? matchingManager.name : '';
                }

                // Find matching category name from fetched categories
                const matchingCategory = categories.find(
                  (cat) => cat.name === caseData.category || cat.id === caseData.category_id
                );
                const categoryValue = matchingCategory ? matchingCategory.name : caseData.category || '';

                reset({
                  assignedTo: assignedToValue,
                  assignStatus: caseData.status || 'new',
                  openDeadlineNumber,
                  openDeadlinePeriod,
                  closeDeadlineNumber,
                  closeDeadlinePeriod,
                  linkWithOtherReport: caseData.other_report_link || '',
                  autoDeleteAfter30Days: caseData.automatic_delete ? 'Yes' : 'No',
                  category: categoryValue,
                  department: caseData.department_id || '',
                  severity: caseData.severity_id || '',
                  state: caseData.state_id || '',
                });
              }
            }}
          >
            {t('dashboard.case.reportSettingTab.cancel')}
          </Button>
          <Button
            type="button"
            variant="contained"
            disabled={saving}
            onClick={(e) => {
              e.preventDefault();
              onSubmit(e as any);
            }}
          >
            {saving
              ? t('dashboard.case.reportSettingTab.saving')
              : t('dashboard.case.reportSettingTab.saveChanges')}
          </Button>
        </Stack>
      </FormProvider>
    </Card>
  );
}
