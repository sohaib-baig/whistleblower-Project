import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';

import { useTranslate } from 'src/locales';

import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  chart: {
    categories: string[];
    series: number[];
    options?: ChartOptions;
  };
};

export function AnalyticsCompaniesChart({ title, subheader, chart, sx, ...other }: Props) {
  const theme = useTheme();
  const { t } = useTranslate('navbar');

  const chartOptions = useChart({
    chart: {
      type: 'bar',
      sparkline: { enabled: false },
    },
    colors: [theme.palette.primary.main],
    plotOptions: {
      bar: {
        columnWidth: '60%',
        borderRadius: 4,
      },
    },
    xaxis: {
      categories: chart.categories,
    },
    yaxis: {
      title: {
        text: t('dashboard.analytics.charts.labels.numberOfCompanies'),
      },
    },
    tooltip: {
      y: {
        formatter: (value: number) => `${value} ${t('dashboard.analytics.charts.labels.companies')}`,
      },
    },
    ...chart.options,
  });

  return (
    <Card sx={{ height: '100%', ...sx }} {...other}>
      <CardHeader title={title} subheader={subheader} />

      <Chart
        type="bar"
        series={[{ name: t('dashboard.analytics.charts.labels.companiesJoined'), data: chart.series }]}
        options={chartOptions}
        sx={{ height: 364 }}
      />
    </Card>
  );
}
