import { Card, CardHeader } from '@mui/material';

import { fNumber } from 'src/utils/format-number';

import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = {
  chart: {
    colors?: string[];
    series: {
      name: string;
      data: number[];
    }[];
    categories: string[];
  };
  title?: string;
  subheader?: string;
  sx?: object;
};

export function AnalyticsSecurityAlerts({ title, subheader, chart, sx, ...other }: Props) {
  const chartOptions = useChart({
    chart: {
      type: 'donut',
    },
    colors: chart.colors,
    labels: chart.categories,
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
        },
      },
    },
    tooltip: {
      y: {
        formatter: (value: number) => fNumber(value),
      },
    },
  });

  return (
    <Card sx={{ height: '100%', ...sx }} {...other}>
      <CardHeader title={title} subheader={subheader} />
      <Chart
        type="donut"
        series={chart.series[0]?.data || []}
        options={chartOptions}
        sx={{ height: 364 }}
      />
    </Card>
  );
}
