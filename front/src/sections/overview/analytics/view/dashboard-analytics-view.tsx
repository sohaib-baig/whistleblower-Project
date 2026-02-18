import type { Dayjs } from 'dayjs';
import type { PaletteColorKey } from 'src/theme/core';

import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useTranslation } from 'react-i18next';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  fetchDashboardOverview,
  type DashboardTimePeriod,
  type DashboardOverviewResponse,
} from 'src/actions/dashboard';

import { useAuthContext } from 'src/auth/hooks';

import { AnalyticsUserActivity } from '../analytics-user-activity';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { AnalyticsCompaniesChart } from '../analytics-companies-chart';
import { AnalyticsLatestCompanies } from '../analytics-latest-companies';
import { AnalyticsTimeOfReporting } from '../analytics-time-of-reporting';
import { AnalyticsCategoryBreakdown } from '../analytics-category-breakdown';
import { AnalyticsCaseRegisteredChart } from '../analytics-case-registered-chart';

const DEFAULT_TIME_PERIOD: DashboardTimePeriod = 'all-time';

type AppliedFilters = {
  fromDate?: string;
  toDate?: string;
  timePeriod: DashboardTimePeriod;
  companyId?: string;
};

type FilterOverrides = {
  timePeriod?: DashboardTimePeriod;
  fromDate?: Dayjs | null;
  toDate?: Dayjs | null;
};

type MetricKey = keyof DashboardOverviewResponse['metrics'];

// ----------------------------------------------------------------------

export function DashboardAnalyticsView() {
  const { user } = useAuthContext();
  const { t } = useTranslate('navbar');
  const { i18n } = useTranslation();
  const router = useRouter();

  dayjs.extend(weekOfYear);
  dayjs.extend(isoWeek);

  const normalizedRole = (user?.role || '').toLowerCase();
  const isAdmin = normalizedRole === 'admin';
  const isCompany = normalizedRole === 'company';
  const isCaseManager = normalizedRole === 'case_manager';
  const isRestrictedRole = isCompany || isCaseManager;

  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [timePeriod, setTimePeriod] = useState<DashboardTimePeriod>(DEFAULT_TIME_PERIOD);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');

  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    timePeriod: DEFAULT_TIME_PERIOD,
  });
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (filters: AppliedFilters) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchDashboardOverview({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        timePeriod: filters.timePeriod,
        companyId: filters.companyId,
      });

      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dashboard.analytics.errors.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData(appliedFilters);
  }, [appliedFilters, loadData]);

  useEffect(() => {
    if (!data || !data.filters) {
      return;
    }
    setTimePeriod(data.filters.time_period);
    setFromDate(data.filters.from_date ? dayjs(data.filters.from_date) : null);
    setToDate(data.filters.to_date ? dayjs(data.filters.to_date) : null);
    setSelectedCompany(data.filters.company_id ?? 'all');
  }, [data]);

  const companyOptions = useMemo(() => data?.filters?.companies ?? [], [data?.filters?.companies]);

  // Format chart categories with correct locale
  const formatChartCategories = useCallback((categories: string[]): string[] => {
    const currentLocale = i18n.resolvedLanguage || 'en';
    // Map language codes to dayjs locale codes
    const localeMap: Record<string, string> = {
      en: 'en',
      sv: 'sv',
      no: 'nb',
      da: 'da',
      fi: 'fi',
      de: 'de',
      fr: 'fr',
    };
    const dayjsLocale = localeMap[currentLocale] || 'en';
    
    return categories.map((cat) => {
      // Try to parse common date formats from backend
      // Format: "M Y" (e.g., "Oct 2025") or "d M" (e.g., "15 Oct") or "Y" (e.g., "2025")
      
      // Try "M Y" format (e.g., "Oct 2025", "Dec 2024")
      let parsed = dayjs(cat, 'MMM YYYY', 'en', true);
      if (parsed.isValid()) {
        return parsed.locale(dayjsLocale).format('MMM YYYY');
      }
      
      // Try "d M" format (e.g., "15 Oct", "01 Jan")
      parsed = dayjs(cat, 'DD MMM', 'en', true);
      if (parsed.isValid()) {
        return parsed.locale(dayjsLocale).format('DD MMM');
      }
      
      // Try "Y" format (e.g., "2025")
      parsed = dayjs(cat, 'YYYY', true);
      if (parsed.isValid()) {
        return parsed.locale(dayjsLocale).format('YYYY');
      }
      
      // Try "Week XX YYYY" format - if it matches, just return as is since it's already formatted
      const weekMatch = cat.match(/Week (\d{2}) (\d{4})/);
      if (weekMatch) {
        // The format is already correct, just return it
        // Optionally, we could localize the week number if needed
        return cat;
      }
      
      // If can't parse, return as is
      return cat;
    });
  }, [i18n.resolvedLanguage]);

  const filteredMetricCards = useMemo(() => {
    const METRIC_CARDS: { key: MetricKey; title: string; color: PaletteColorKey; icon: string }[] = [
      { key: 'totalCases', title: t('dashboard.analytics.metrics.totalCases'), color: 'primary', icon: '📊' },
      { key: 'totalOpenStateDeadline', title: t('dashboard.analytics.metrics.totalOpenStateDeadline'), color: 'warning', icon: '⏰' },
      { key: 'totalCloseStateDeadline', title: t('dashboard.analytics.metrics.totalCloseStateDeadline'), color: 'error', icon: '⏱️' },
      { key: 'avgDaysUntilReceived', title: t('dashboard.analytics.metrics.avgDaysUntilReceived'), color: 'info', icon: '📅' },
      { key: 'avgDaysUntilClosed', title: t('dashboard.analytics.metrics.avgDaysUntilClosed'), color: 'success', icon: '✅' },
      { key: 'totalMessageTemplates', title: t('dashboard.analytics.metrics.totalMessageTemplates'), color: 'warning', icon: '📝' },
      { key: 'totalDocuments', title: t('dashboard.analytics.metrics.totalDocuments'), color: 'secondary', icon: '📄' },
      { key: 'totalCompanies', title: t('dashboard.analytics.metrics.totalCompanies'), color: 'primary', icon: '🏢' },
      { key: 'totalLogs', title: t('dashboard.analytics.metrics.totalLogs'), color: 'error', icon: '📋' },
      { key: 'totalCaseManagers', title: t('dashboard.analytics.metrics.totalCaseManagers'), color: 'info', icon: '👤' },
      { key: 'totalNews', title: t('dashboard.analytics.metrics.totalNews'), color: 'success', icon: '📰' },
    ];

    return METRIC_CARDS.filter((metric) => {
      if (isAdmin) {
        return true;
      }
      if (['totalMessageTemplates', 'totalCompanies', 'totalLogs'].includes(metric.key)) {
        return false;
      }
      if (isCaseManager && metric.key === 'totalCaseManagers') {
        return false;
      }
      return true;
    });
  }, [isAdmin, isCaseManager, t]);

  const buildAppliedFilters = (overrides?: FilterOverrides) => {
    const effectiveFrom =
      overrides && Object.prototype.hasOwnProperty.call(overrides, 'fromDate')
        ? (overrides.fromDate ?? null)
        : fromDate;
    const effectiveTo =
      overrides && Object.prototype.hasOwnProperty.call(overrides, 'toDate')
        ? (overrides.toDate ?? null)
        : toDate;
    const effectivePeriod = overrides?.timePeriod ?? timePeriod;

    return {
      fromDate: effectiveFrom ? effectiveFrom.format('YYYY-MM-DD') : undefined,
      toDate: effectiveTo ? effectiveTo.format('YYYY-MM-DD') : undefined,
      timePeriod: effectivePeriod,
      companyId: selectedCompany !== 'all' ? selectedCompany : undefined,
    };
  };

  const applyFilters = (overrides?: FilterOverrides) => {
    const effectiveFrom =
      overrides && Object.prototype.hasOwnProperty.call(overrides, 'fromDate')
        ? (overrides.fromDate ?? null)
        : fromDate;
    const effectiveTo =
      overrides && Object.prototype.hasOwnProperty.call(overrides, 'toDate')
        ? (overrides.toDate ?? null)
        : toDate;

    if (effectiveFrom && effectiveTo && effectiveFrom.isAfter(effectiveTo)) {
      setError(t('dashboard.analytics.errors.dateRangeInvalid'));
      return;
    }

    setError(null);
    setAppliedFilters(buildAppliedFilters(overrides));
  };

  const computePresetRange = (period: DashboardTimePeriod, anchor?: Dayjs | null) => {
    if (period === 'all-time') {
      return { from: null, to: null };
    }

    const base = (anchor ?? dayjs()).endOf('day');

    switch (period) {
      case 'daily':
        return {
          from: base.startOf('day'),
          to: base,
        };
      case 'weekly':
        return {
          from: base.subtract(6, 'day').startOf('day'),
          to: base,
        };
      case 'monthly':
        return {
          from: base.subtract(1, 'month').startOf('day'),
          to: base,
        };
      case 'yearly':
        return {
          from: base.subtract(1, 'year').startOf('day'),
          to: base,
        };
      default:
        return { from: null, to: null };
    }
  };

  const handleTimePeriodChange = (
    event: React.MouseEvent<HTMLElement>,
    newPeriod: DashboardTimePeriod | null
  ) => {
    if (newPeriod) {
      const { from: presetFrom, to: presetTo } = computePresetRange(newPeriod, toDate);
      setTimePeriod(newPeriod);
      setFromDate(presetFrom);
      setToDate(presetTo);
      applyFilters({ timePeriod: newPeriod, fromDate: presetFrom, toDate: presetTo });
    }
  };

  const handleFilter = () => {
    applyFilters();
  };

  const handleSearch = () => {
    applyFilters();
  };

  const handleDeadlineClick = useCallback(
    (deadlineType: 'open' | 'close', period?: string) => {
      const params = new URLSearchParams();
      if (deadlineType === 'open') {
        params.set('open_deadline_period', period || '');
      } else {
        params.set('close_deadline_period', period || '');
      }
      router.push(`${paths.dashboard.case.list}?${params.toString()}`);
    },
    [router]
  );

  const renderMetricCard = (
    metricKey: MetricKey,
    title: string,
    color: PaletteColorKey,
    emoji: string
  ) => {
    const metricData = data?.metrics?.[metricKey];

    if (!metricData || !metricData.chart) {
      return (
        <Card sx={{ p: 3 }}>
          <Skeleton variant="rectangular" height={110} />
        </Card>
      );
    }

    // Determine if this is a deadline metric and get the onClick handler
    let onClick: (() => void) | undefined;
    if (metricKey === 'totalOpenStateDeadline') {
      onClick = () => handleDeadlineClick('open', timePeriod !== 'all-time' ? timePeriod : undefined);
    } else if (metricKey === 'totalCloseStateDeadline') {
      onClick = () => handleDeadlineClick('close', timePeriod !== 'all-time' ? timePeriod : undefined);
    }

    return (
      <AnalyticsWidgetSummary
        title={title}
        total={metricData.value ?? 0}
        percent={metricData.percent ?? 0}
        displayVariant="clean"
        color={color}
        icon={
          <Box component="span" aria-hidden sx={{ fontSize: 28 }}>
            {emoji}
          </Box>
        }
        periodText={t('dashboard.analytics.periodText')}
        chart={{
          series: metricData.chart?.series ?? [],
          categories: formatChartCategories(metricData.chart?.categories ?? []),
        }}
        onClick={onClick}
      />
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DashboardContent maxWidth="xl">
        <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
          {t('dashboard.analytics.heading')}
        </Typography>

        <Typography variant="body1" sx={{ mb: { xs: 3, md: 5 }, color: 'text.secondary' }}>
          {t('dashboard.analytics.subtitle')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <DatePicker
                label={t('dashboard.analytics.filters.fromDate')}
                value={fromDate}
                onChange={(newValue) => setFromDate(newValue)}
                slotProps={{
                  textField: {
                    placeholder: t('dashboard.analytics.filters.selectDate'),
                    size: 'medium',
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <DatePicker
                label={t('dashboard.analytics.filters.toDate')}
                value={toDate}
                onChange={(newValue) => setToDate(newValue)}
                slotProps={{
                  textField: {
                    placeholder: t('dashboard.analytics.filters.selectDate'),
                    size: 'medium',
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Button
                variant="contained"
                size="medium"
                onClick={handleFilter}
                disabled={loading}
                sx={{ height: '56px', width: '100%' }}
              >
                {t('dashboard.analytics.filters.filter')}
              </Button>
            </Grid>
          </Grid>

          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ToggleButtonGroup
                value={timePeriod}
                exclusive
                onChange={handleTimePeriodChange}
                aria-label="time period"
                size="medium"
                sx={{ width: '100%', justifyContent: { xs: 'flex-start', md: 'space-between' } }}
              >
                <ToggleButton value="daily">{t('dashboard.analytics.timePeriod.daily')}</ToggleButton>
                <ToggleButton value="weekly">{t('dashboard.analytics.timePeriod.weekly')}</ToggleButton>
                <ToggleButton value="monthly">{t('dashboard.analytics.timePeriod.monthly')}</ToggleButton>
                <ToggleButton value="yearly">{t('dashboard.analytics.timePeriod.yearly')}</ToggleButton>
                <ToggleButton value="all-time">{t('dashboard.analytics.timePeriod.allTime')}</ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                select
                label={t('dashboard.analytics.filters.selectCompany')}
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                size="medium"
                SelectProps={{
                  native: true,
                }}
                sx={{ width: '100%' }}
              >
                <option value="all">{t('dashboard.analytics.filters.all')}</option>
                {companyOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 12, md: 4 }}>
              <Button
                variant="contained"
                size="medium"
                onClick={handleSearch}
                disabled={loading}
                sx={{ height: '56px', width: '100%' }}
              >
                {t('dashboard.analytics.filters.search')}
              </Button>
            </Grid>
          </Grid>
        </Card>

        {loading && !data ? (
          <Box sx={{ py: 5, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {data?.metrics && (
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {filteredMetricCards.map((metric) => (
                  <Grid key={metric.key} size={{ xs: 12, sm: 6, md: 4 }}>
                    {renderMetricCard(metric.key, metric.title, metric.color, metric.icon)}
                  </Grid>
                ))}
              </Grid>
            )}

            <Grid container spacing={3}>
              {!isRestrictedRole && (
                <Grid size={{ xs: 12, md: 6 }}>
                  {data?.companiesChart ? (
                    <AnalyticsCompaniesChart
                      title={t('dashboard.analytics.charts.companiesRegistered')}
                      chart={{
                        categories: formatChartCategories(data.companiesChart.categories),
                        series: data.companiesChart.series,
                      }}
                    />
                  ) : (
                    <Card sx={{ p: 3, height: '100%' }}>
                      <Skeleton variant="rectangular" height={300} />
                    </Card>
                  )}
                </Grid>
              )}

              {isRestrictedRole && (
                <Grid size={{ xs: 12, md: 6 }}>
                  {data?.metrics?.totalCases ? (
                    <AnalyticsCaseRegisteredChart
                      title={t('dashboard.analytics.charts.caseRegistered')}
                      chart={{
                        categories: formatChartCategories(data.metrics.totalCases.chart.categories),
                        series: data.metrics.totalCases.chart.series,
                      }}
                    />
                  ) : (
                    <Card sx={{ p: 3, height: '100%' }}>
                      <Skeleton variant="rectangular" height={300} />
                    </Card>
                  )}
                </Grid>
              )}

              <Grid size={{ xs: 12, md: 6 }}>
                {data?.categoryBreakdown ? (
                  <AnalyticsCategoryBreakdown
                    title={t('dashboard.analytics.charts.categoryBreakdown')}
                    chart={data.categoryBreakdown}
                  />
                ) : (
                  <Card sx={{ p: 3, height: '100%' }}>
                    <Skeleton variant="rectangular" height={300} />
                  </Card>
                )}
              </Grid>

              <Grid size={{ xs: 12, md: isRestrictedRole ? 12 : 6 }}>
                  {data?.timeOfReporting ? (
                    <AnalyticsTimeOfReporting
                      title={t('dashboard.analytics.charts.timeOfReporting')}
                      chart={{
                        ...data.timeOfReporting,
                        categories: formatChartCategories(data.timeOfReporting.categories),
                      }}
                    />
                  ) : (
                  <Card sx={{ p: 3, height: '100%' }}>
                    <Skeleton variant="rectangular" height={300} />
                  </Card>
                )}
              </Grid>

              {!isRestrictedRole && (
                <Grid size={{ xs: 12, md: 6 }}>
                  {data?.userActivity ? (
                    <AnalyticsUserActivity
                      title={t('dashboard.analytics.charts.userActivity')}
                      chart={{
                        ...data.userActivity,
                        categories: formatChartCategories(data.userActivity.categories),
                      }}
                    />
                  ) : (
                    <Card sx={{ p: 3, height: '100%' }}>
                      <Skeleton variant="rectangular" height={300} />
                    </Card>
                  )}
                </Grid>
              )}

              {!isRestrictedRole && (
                <Grid size={{ xs: 12 }}>
                  {data?.latestCompanies ? (
                    <AnalyticsLatestCompanies
                      title={t('dashboard.analytics.charts.latestCompanies')}
                      list={data.latestCompanies}
                    />
                  ) : (
                    <Card sx={{ p: 3 }}>
                      <Skeleton variant="rectangular" height={260} />
                    </Card>
                  )}
                </Grid>
              )}
            </Grid>
          </>
        )}
      </DashboardContent>
    </LocalizationProvider>
  );
}
