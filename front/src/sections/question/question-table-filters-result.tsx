import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { IQuestionTableFilters } from 'src/types/question';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: UseSetStateReturn<IQuestionTableFilters>;
  onResetPage: () => void;
  totalResults: number;
  sx?: any;
};

export function QuestionTableFiltersResult({ filters, onResetPage, totalResults, sx }: Props) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleRemoveName = useCallback(() => {
    updateFilters({ name: '' });
    onResetPage();
  }, [onResetPage, updateFilters]);

  const handleRemoveInputType = useCallback(() => {
    updateFilters({ inputType: '' });
    onResetPage();
  }, [onResetPage, updateFilters]);

  const handleResetAll = useCallback(() => {
    updateFilters({ name: '', inputType: '' });
    onResetPage();
  }, [onResetPage, updateFilters]);

  return (
    <Stack spacing={1.5} sx={{ p: 3 }}>
      <Box sx={{ typography: 'body2' }}>
        <strong>{totalResults}</strong>
        <Box component="span" sx={{ typography: 'body2', color: 'text.secondary' }}>
          {' '}
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

        {!!currentFilters.inputType && (
          <Chip
            size="small"
            label="Input Type"
            onDelete={handleRemoveInputType}
            deleteIcon={<Iconify icon="solar:close-circle-bold" />}
          />
        )}

        <Button
          color="error"
          onClick={handleResetAll}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Clear All
        </Button>
      </Stack>
    </Stack>
  );
}
