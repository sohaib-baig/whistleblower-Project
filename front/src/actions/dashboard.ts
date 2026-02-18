import { endpoints } from 'src/lib/axios';
import sanctum from 'src/lib/axios-sanctum';

export type DashboardTimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all-time';

export type DashboardOverviewFilters = {
  time_period: DashboardTimePeriod;
  granularity: 'daily' | 'weekly' | 'monthly' | 'yearly';
  from_date: string;
  to_date: string;
  company_id: string | null;
  companies: {
    id: string;
    label: string;
  }[];
};

export type DashboardMetric = {
  value: number | null;
  percent: number;
  chart: {
    categories: string[];
    series: number[];
  };
  periodText: string;
};

export type DashboardOverviewMetrics = {
  totalCases: DashboardMetric;
  avgDaysUntilReceived: DashboardMetric;
  avgDaysUntilClosed: DashboardMetric;
  totalMessageTemplates: DashboardMetric;
  totalDocuments: DashboardMetric;
  totalCompanies: DashboardMetric;
  totalLogs: DashboardMetric;
  totalCaseManagers: DashboardMetric;
  totalNews: DashboardMetric;
  totalOpenStateDeadline: DashboardMetric;
  totalCloseStateDeadline: DashboardMetric;
};

export type DashboardOverviewResponse = {
  filters: DashboardOverviewFilters;
  metrics: DashboardOverviewMetrics;
  companiesChart: {
    categories: string[];
    series: number[];
  };
  categoryBreakdown: {
    series: {
      label: string;
      value: number;
    }[];
  };
  timeOfReporting: {
    categories: string[];
    series: {
      name: string;
      data: number[];
    }[];
  };
  userActivity: {
    categories: string[];
    series: {
      name: string;
      data: number[];
    }[];
  };
  latestCompanies: {
    id: string;
    name: string;
    phone: string;
    address: string;
    date: string;
  }[];
};

export type DashboardOverviewRequest = {
  fromDate?: string;
  toDate?: string;
  timePeriod?: DashboardTimePeriod;
  companyId?: string | null;
};

export async function fetchDashboardOverview(params: DashboardOverviewRequest = {}) {
  const response = await sanctum.get<DashboardOverviewResponse>(endpoints.dashboard.overview, {
    params: {
      from_date: params.fromDate,
      to_date: params.toDate,
      time_period: params.timePeriod,
      company_id: params.companyId ?? undefined,
    },
  });

  return response.data;
}
