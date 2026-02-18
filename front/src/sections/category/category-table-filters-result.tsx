import type { ICategoryTableFilters } from 'src/types/category';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: ICategoryTableFilters;
  onFilters: (name: string, value: ICategoryTableFilters) => void;
  onResetFilters: () => void;
  results: number;
  sx?: object;
};

export function CategoryTableFiltersResult({
  filters,
  onFilters,
  onResetFilters,
  results,
  sx,
}: Props) {
  const handleRemoveStatus = () => {
    onFilters('status', { ...filters, status: 'all' });
  };

  const handleRemoveName = () => {
    onFilters('name', { ...filters, name: '' });
  };

  return (
    <Stack spacing={1.5} sx={{ ...sx }}>
      <Box sx={{ typography: 'body2' }}>
        <strong>{results}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          results found
        </Box>
      </Box>

      <Stack flexWrap="wrap" direction="row" spacing={1}>
        {!!filters.name && (
          <Chip
            size="small"
            label="Name"
            onDelete={handleRemoveName}
            deleteIcon={<Iconify icon="eva:minus-circle-fill" />}
          />
        )}

        {filters.status && filters.status !== 'all' && (
          <Chip
            size="small"
            label="Status"
            onDelete={handleRemoveStatus}
            deleteIcon={<Iconify icon="eva:minus-circle-fill" />}
          />
        )}

        <Button
          color="error"
          size="small"
          onClick={onResetFilters}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Clear
        </Button>
      </Stack>
    </Stack>
  );
}
