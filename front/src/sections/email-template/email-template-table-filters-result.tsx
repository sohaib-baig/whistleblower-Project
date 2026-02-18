import type { UseSetStateReturn } from 'minimal-shared/hooks';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: UseSetStateReturn<{ name: string; status: string }>;
  onResetPage: () => void;
  totalResults: number;
  sx?: object;
};

export function EmailTemplateTableFiltersResult({ filters, onResetPage, totalResults, sx }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleRemoveStatus = useCallback(() => {
    updateFilters({ status: '' });
    onResetPage();
  }, [updateFilters, onResetPage]);

  const handleRemoveName = useCallback(() => {
    updateFilters({ name: '' });
    onResetPage();
  }, [updateFilters, onResetPage]);

  const handleResetAll = useCallback(() => {
    updateFilters({ name: '', status: '' });
    onResetPage();
  }, [updateFilters, onResetPage]);

  const canReset = !!currentFilters.name || !!currentFilters.status;

  if (!canReset) {
    return null;
  }

  return (
    <Stack spacing={1.5} sx={{ p: 2.5, pt: 0 }}>
      <Box sx={{ typography: 'body2' }}>
        <strong>{totalResults}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          results found
        </Box>
      </Box>

      <Stack flexWrap="wrap" direction="row" spacing={1}>
        {!!currentFilters.name && (
          <Chip
            size="small"
            label="Name"
            onDelete={handleRemoveName}
            deleteIcon={<Iconify icon="solar:close-circle-bold" />}
          />
        )}

        {!!currentFilters.status && (
          <Chip
            size="small"
            label="Status"
            onDelete={handleRemoveStatus}
            deleteIcon={<Iconify icon="solar:close-circle-bold" />}
          />
        )}

        <Button
          color="error"
          onClick={handleResetAll}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Clear
        </Button>
      </Stack>
    </Stack>
  );
}
