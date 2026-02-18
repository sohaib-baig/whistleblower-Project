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

export function AnalyticsNetworkTraffic({ title, subheader, chart, sx, ...other }: Props) {
  const chartOptions = useChart({
    chart: {
      type: 'bar',
    },
    colors: chart.colors,
    xaxis: {
      categories: chart.categories,
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
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
      <Chart type="bar" series={chart.series} options={chartOptions} sx={{ height: 364 }} />
    </Card>
  );
}
