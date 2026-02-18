import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { CASE_CATEGORY_OPTIONS } from 'src/_mock/_case';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: {
    name: string;
    status: string;
    category: string[];
  };
  onFilters: (name: string, value: string | string[]) => void;
  onResetFilter: () => void;
  results: number;
};

export function CaseTableFiltersResult({ filters, onFilters, onResetFilter, results }: Props) {
  const handleRemoveCategory = useCallback(
    (inputValue: string) => {
      const newValue = filters.category.filter((item) => item !== inputValue);
      onFilters('category', newValue);
    },
    [filters.category, onFilters]
  );

  const handleRemoveName = useCallback(() => {
    onFilters('name', '');
  }, [onFilters]);

  return (
    <Stack spacing={1.5} sx={{ p: 3 }}>
      <Box sx={{ typography: 'body2' }}>
        <strong>{results}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          results found
        </Box>
      </Box>

      <Stack flexGrow={1} spacing={1} direction="row" flexWrap="wrap" alignItems="center">
        {!!filters.name && (
          <Chip
            size="small"
            label="Search"
            onDelete={handleRemoveName}
            deleteIcon={<Iconify icon="solar:close-circle-bold" />}
          />
        )}

        {!!filters.category.length && (
          <>
            {filters.category.map((item) => (
              <Chip
                key={item}
                size="small"
                label={CASE_CATEGORY_OPTIONS.find((option) => option.value === item)?.label}
                onDelete={() => handleRemoveCategory(item)}
                deleteIcon={<Iconify icon="solar:close-circle-bold" />}
              />
            ))}
          </>
        )}

        <Button
          variant="soft"
          color="error"
          onClick={onResetFilter}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Clear
        </Button>
      </Stack>
    </Stack>
  );
}
