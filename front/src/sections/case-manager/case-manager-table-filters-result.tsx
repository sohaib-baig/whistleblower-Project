import type { ICaseManagerTableFilters } from 'src/types/case-manager';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: ICaseManagerTableFilters;
  onFilters: (name: string, value: string) => void;
  onResetFilter: () => void;
  results: number;
};

export function CaseManagerTableFiltersResult({
  filters,
  onFilters,
  onResetFilter,
  results,
}: Props) {
  const handleRemoveStatus = () => {
    onFilters('status', 'all');
  };

  const handleRemoveName = () => {
    onFilters('name', '');
  };

  const handleRemoveEmail = () => {
    onFilters('email', '');
  };

  return (
    <Stack spacing={1.5} sx={{ p: 3 }}>
      <Stack flexGrow={1} spacing={1} direction="row" flexWrap="wrap" alignItems="center">
        <Stack spacing={1} direction="row" flexWrap="wrap" alignItems="center">
          {!!filters.name && (
            <Chip
              size="small"
              label={filters.name}
              onDelete={handleRemoveName}
              sx={{ height: 24 }}
            />
          )}

          {!!filters.email && (
            <Chip
              size="small"
              label={filters.email}
              onDelete={handleRemoveEmail}
              sx={{ height: 24 }}
            />
          )}

          {filters.status !== 'all' && (
            <Chip
              size="small"
              label={filters.status}
              onDelete={handleRemoveStatus}
              sx={{ height: 24 }}
            />
          )}
        </Stack>

        <Button
          color="error"
          onClick={onResetFilter}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Clear
        </Button>
      </Stack>

      <Stack spacing={0.5} direction="row" alignItems="center" sx={{ typography: 'body2' }}>
        <Iconify
          icon="solar:info-circle-bold"
          sx={{ width: 16, height: 16, color: 'text.disabled' }}
        />
        <Box component="span" sx={{ color: 'text.disabled' }}>
          {results} results found
        </Box>
      </Stack>
    </Stack>
  );
}
