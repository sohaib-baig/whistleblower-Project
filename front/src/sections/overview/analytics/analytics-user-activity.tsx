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

export function AnalyticsUserActivity({ title, subheader, chart, sx, ...other }: Props) {
  const chartOptions = useChart({
    chart: {
      type: 'area',
    },
    colors: chart.colors,
    xaxis: {
      categories: chart.categories,
    },
    stroke: {
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 100],
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
      <Chart type="area" series={chart.series} options={chartOptions} sx={{ height: 364 }} />
    </Card>
  );
}
