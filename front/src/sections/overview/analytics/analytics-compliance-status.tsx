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

export function AnalyticsComplianceStatus({ title, subheader, chart, sx, ...other }: Props) {
  const chartOptions = useChart({
    chart: {
      type: 'polarArea',
    },
    colors: chart.colors,
    labels: chart.categories,
    plotOptions: {
      polarArea: {
        rings: {
          strokeWidth: 0,
        },
        spokes: {
          strokeWidth: 0,
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
        type="polarArea"
        series={chart.series[0]?.data || []}
        options={chartOptions}
        sx={{ height: 364 }}
      />
    </Card>
  );
}
