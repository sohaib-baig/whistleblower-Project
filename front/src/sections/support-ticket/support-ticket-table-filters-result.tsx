import type { ISupportTicketTableFilters } from 'src/types/support-ticket';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

type Props = {
  filters: ISupportTicketTableFilters;
  onFilters: (name: string, value: string | Date | null) => void;
  onResetFilters: () => void;
  results: number;
  sx?: object;
};

export function SupportTicketTableFiltersResult({
  filters,
  onFilters,
  onResetFilters,
  results,
  ...other
}: Props) {
  const handleRemoveKeyword = () => {
    onFilters('name', '');
  };

  const handleRemoveStatus = () => {
    onFilters('status', 'all');
  };

  const handleRemoveDate = () => {
    onFilters('startDate', null);
    onFilters('endDate', null);
  };

  return (
    <Stack gap={1.5} direction="row" flexWrap="wrap" alignItems="center" {...other}>
      <Box component="span" sx={{ typography: 'body2', color: 'text.secondary' }}>
        {results} results found
      </Box>

      {(!!filters.name) && (
        <Chip
          label={`Subject/Creator: ${filters.name}`}
          size="small"
          onDelete={handleRemoveKeyword}
        />
      )}

      {filters.status !== 'all' && (
        <Chip
          label={`Status: ${filters.status}`}
          size="small"
          onDelete={handleRemoveStatus}
        />
      )}

      {(!!filters.startDate || !!filters.endDate) && (
        <Chip
          label={`Date: ${fDate(filters.startDate)} - ${fDate(filters.endDate)}`}
          size="small"
          onDelete={handleRemoveDate}
        />
      )}
    </Stack>
  );
}