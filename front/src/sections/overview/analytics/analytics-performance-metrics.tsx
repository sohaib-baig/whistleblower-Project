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

export function AnalyticsPerformanceMetrics({ title, subheader, chart, sx, ...other }: Props) {
  const chartOptions = useChart({
    chart: {
      type: 'radar',
    },
    colors: chart.colors,
    xaxis: {
      categories: chart.categories,
    },
    plotOptions: {
      radar: {
        size: 140,
        polygons: {
          strokeColors: 'transparent',
          connectorColors: 'transparent',
          fill: {
            colors: ['transparent'],
          },
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
      <Chart type="radar" series={chart.series} options={chartOptions} sx={{ height: 364 }} />
    </Card>
  );
}
