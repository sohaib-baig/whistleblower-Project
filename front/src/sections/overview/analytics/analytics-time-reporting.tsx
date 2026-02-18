import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from 'src/components/chart';

import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';

import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  chart: {
    categories: string[];
    series: {
      name: string;
      data: number[];
    }[];
    options?: ChartOptions;
  };
};

export function AnalyticsTimeReporting({ title, subheader, chart, sx, ...other }: Props) {
  const theme = useTheme();

  const chartOptions = useChart({
    chart: {
      type: 'line',
      sparkline: { enabled: false },
    },
    colors: [theme.palette.primary.main],
    stroke: {
      width: 3,
      curve: 'smooth',
    },
    xaxis: {
      categories: chart.categories,
    },
    yaxis: {
      title: {
        text: 'Number of Cases',
      },
    },
    tooltip: {
      y: {
        formatter: (value: number) => `${value} cases`,
      },
    },
    ...chart.options,
  });

  return (
    <Card sx={sx} {...other}>
      <CardHeader title={title} subheader={subheader} />

      <Chart type="line" series={chart.series} options={chartOptions} />
    </Card>
  );
}
