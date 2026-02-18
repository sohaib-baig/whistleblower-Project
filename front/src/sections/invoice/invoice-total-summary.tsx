import type { BoxProps } from '@mui/material/Box';
import type { Theme, SxProps } from '@mui/material/styles';

import Box from '@mui/material/Box';

import { fPercent, fCurrency } from 'src/utils/format-number';

import { useTranslate } from 'src/locales/use-locales';

// ----------------------------------------------------------------------

type InvoiceTotalSummaryProps = BoxProps & {
  taxes?: number;
  subtotal?: number;
  totalAmount?: number;
};

export function InvoiceTotalSummary({
  sx,
  taxes,
  subtotal,
  totalAmount,
  ...other
}: InvoiceTotalSummaryProps) {
  const { t } = useTranslate('navbar');
  
  const rowStyles: SxProps<Theme> = {
    display: 'flex',
    alignItems: 'center',
  };

  const labelStyles: SxProps<Theme> = {
    color: 'text.secondary',
  };

  const valueStyles: SxProps<Theme> = {
    width: 160,
  };

  return (
    <Box
      sx={[
        {
          mt: 3,
          gap: 2,
          display: 'flex',
          textAlign: 'right',
          typography: 'body2',
          alignItems: 'flex-end',
          flexDirection: 'column',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box sx={rowStyles}>
        <Box component="span" sx={labelStyles}>
          Subtotal
        </Box>
        <Box component="span" sx={[valueStyles, { fontWeight: 'fontWeightSemiBold' }]}>
          {fCurrency(subtotal) || '-'}
        </Box>
      </Box>

      <Box sx={rowStyles}>
        <Box component="span" sx={labelStyles}>
          {t('dashboard.invoice.details.vat')}
        </Box>
        <Box component="span" sx={valueStyles}>
          {taxes && subtotal && subtotal > 0
            ? fPercent((taxes / subtotal) * 100)
            : '-'}
        </Box>
      </Box>

      <Box sx={[rowStyles, { typography: 'subtitle1' }]}>
        <Box component="span">Total</Box>
        <Box component="span" sx={valueStyles}>
          {fCurrency(totalAmount) || '-'}
        </Box>
      </Box>
    </Box>
  );
}
