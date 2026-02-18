import type { CardProps } from '@mui/material/Card';
import type { PaletteColorKey } from 'src/theme/core';
import type { ChartOptions } from 'src/components/chart';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { fNumber, fPercent, fShortenNumber } from 'src/utils/format-number';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = Omit<CardProps, 'variant'> & {
  title: string;
  total: number;
  percent: number;
  color?: PaletteColorKey;
  icon: React.ReactNode;
  chart: {
    series: number[];
    categories: string[];
    options?: ChartOptions;
    colors?: string[];
  };
  displayVariant?: 'default' | 'clean';
  periodText?: string;
  onClick?: () => void;
};

export function AnalyticsWidgetSummary({
  sx,
  icon,
  title,
  total,
  chart,
  percent,
  color = 'primary',
  displayVariant = 'default',
  periodText = 'last 7 days',
  onClick,
  ...other
}: Props) {
  const theme = useTheme();
  const isCleanVariant = displayVariant === 'clean';

  const trendColor =
    percent > 0
      ? theme.palette.success.main
      : percent < 0
        ? theme.palette.error.main
        : theme.palette.info.main;
  const cleanChartColor = chart.colors?.[0] ?? trendColor;

  const cleanChartOptions = useChart({
    chart: {
      sparkline: { enabled: true },
      type: 'bar',
      toolbar: { show: false },
    },
    colors: [cleanChartColor],
    stroke: { width: 0 },
    xaxis: {
      categories: chart.categories,
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { show: false },
    grid: {
      show: false,
      padding: { top: 0, left: 0, right: 0, bottom: 0 },
    },
    plotOptions: {
      bar: {
        columnWidth: '56%',
        borderRadius: 2,
      },
    },
    tooltip: { enabled: false },
    dataLabels: { enabled: false },
    ...chart.options,
  });

  const chartColors = [theme.palette[color].dark];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors,
    xaxis: { categories: chart.categories },
    grid: {
      padding: {
        top: 6,
        left: 6,
        right: 6,
        bottom: 6,
      },
    },
    tooltip: {
      y: { formatter: (value: number) => fNumber(value), title: { formatter: () => '' } },
    },
    markers: {
      strokeWidth: 0,
    },
    ...chart.options,
  });

  if (isCleanVariant) {
    return (
      <Card
        sx={[
          () => ({
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: theme.customShadows?.z8 ?? '0 18px 36px rgba(15, 23, 42, 0.08)',
            backgroundColor: theme.palette.background.paper,
            borderRadius: 3,
            cursor: onClick ? 'pointer' : 'default',
            transition: 'all 0.2s ease-in-out',
            '&:hover': onClick
              ? {
                  boxShadow: theme.customShadows?.z16 ?? '0 24px 48px rgba(15, 23, 42, 0.12)',
                  transform: 'translateY(-2px)',
                }
              : {},
          }),
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        onClick={onClick}
        {...other}
      >
        <Box sx={{ flexGrow: 1, minWidth: 0, pr: 3 }}>
          <Typography variant="subtitle2" noWrap sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {title}
          </Typography>

          <Box
            sx={{
              mt: 1.5,
              mb: 2,
              typography: 'h3',
              color: 'text.primary',
            }}
          >
            {fNumber(total)}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Iconify
              width={18}
              icon={
                percent < 0
                  ? 'solar:double-alt-arrow-down-bold-duotone'
                  : 'solar:double-alt-arrow-up-bold-duotone'
              }
              sx={{ color: trendColor }}
            />

            <Box component="span" sx={{ fontSize: '0.875rem', fontWeight: 600, color: trendColor }}>
              {percent > 0 && '+'}
              {fPercent(percent)}
            </Box>

            {periodText && (
              <Box component="span" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                {periodText}
              </Box>
            )}
          </Box>
        </Box>

        <Chart
          type="bar"
          series={[{ data: chart.series }]}
          options={cleanChartOptions}
          sx={{ width: 86, height: 64, flexShrink: 0 }}
        />
      </Card>
    );
  }

  const getColorChannels = () => {
    try {
      const colorPalette = theme.vars?.palette?.[color];
      if (colorPalette?.lighterChannel && colorPalette?.lightChannel) {
        return {
          lighter: varAlpha(colorPalette.lighterChannel, 0.48),
          light: varAlpha(colorPalette.lightChannel, 0.48),
        };
      }
    } catch {
      // Fallback if color channels don't exist
    }
    const fallbackLighter = theme.palette[color]?.light || theme.palette.primary.light;
    const fallbackLight = theme.palette[color]?.main || theme.palette.primary.main;
    return {
      lighter: fallbackLighter,
      light: fallbackLight,
    };
  };

  const colorChannels = getColorChannels();

  const renderTrending = () => (
    <Box
      sx={{
        top: 16,
        gap: 0.5,
        right: 16,
        display: 'flex',
        position: 'absolute',
        alignItems: 'center',
      }}
    >
      <Iconify width={20} icon={percent < 0 ? 'eva:trending-down-fill' : 'eva:trending-up-fill'} />
      <Box component="span" sx={{ typography: 'subtitle2' }}>
        {percent > 0 && '+'}
        {fPercent(percent)}
      </Box>
    </Box>
  );

  return (
    <Card
      sx={[
        () => ({
          p: 3,
          boxShadow: isCleanVariant
            ? '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
            : 'none',
          position: 'relative',
          color: isCleanVariant ? 'text.primary' : `${color}.darker`,
          backgroundColor: 'common.white',
          backgroundImage: `linear-gradient(135deg, ${colorChannels.lighter}, ${colorChannels.light})`,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box sx={{ width: 48, height: 48, mb: 3 }}>{icon}</Box>

      {renderTrending()}

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 112 }}>
          <Typography variant="subtitle2" noWrap sx={{ mb: 1 }}>
            {title}
          </Typography>

          <Box sx={{ typography: 'h4' }}>{fShortenNumber(total)}</Box>
        </Box>

        <Chart
          type="line"
          series={[{ data: chart.series }]}
          options={chartOptions}
          sx={{ width: 84, height: 56 }}
        />
      </Box>

      <SvgColor
        src={`${CONFIG.assetsDir}/assets/background/shape-square.svg`}
        sx={{
          top: 0,
          left: -20,
          width: 240,
          zIndex: -1,
          height: 240,
          opacity: 0.24,
          position: 'absolute',
          color: `${color}.main`,
        }}
      />
    </Card>
  );
}
