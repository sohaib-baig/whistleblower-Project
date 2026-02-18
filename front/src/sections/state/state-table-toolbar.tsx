import type { IStateTableFilters } from 'src/types/state';

import { memo, useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: IStateTableFilters;
  onFilters: (name: string, value: string) => void;
  statusOptions: string[];
};

function StateTableToolbarComponent({ filters, onFilters, statusOptions }: Props) {
  const { t } = useTranslate('navbar');
  // Local state for controlled input (prevents focus loss)
  const [localSearch, setLocalSearch] = useState(filters.name);

  // Update local state when filters prop changes externally (e.g., reset)
  useEffect(() => {
    setLocalSearch(filters.name);
  }, [filters.name]);

  // Debounce the filter update to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.name) {
        onFilters('name', localSearch);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, filters, onFilters]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(event.target.value);
  }, []);

  return (
    <Stack
      spacing={2.5}
      direction={{
        xs: 'column',
        md: 'row',
      }}
      sx={{
        p: 2.5,
        pr: { xs: 2.5, md: 1 },
      }}
    >
      <TextField
        fullWidth
        value={localSearch}
        onChange={handleSearchChange}
        placeholder={t('dashboard.state.search.placeholder')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />
    </Stack>
  );
}

export const StateTableToolbar = memo(StateTableToolbarComponent);
