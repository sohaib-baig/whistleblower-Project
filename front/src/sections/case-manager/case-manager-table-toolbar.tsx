import type { ICaseManagerTableFilters } from 'src/types/case-manager';

import { memo, useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
// import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';
import { CASE_MANAGER_STATUS_OPTIONS } from 'src/_mock/_case-manager';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: ICaseManagerTableFilters;
  onFilters: (name: string, value: string) => void;
  onResetFilter: () => void;
};

function CaseManagerTableToolbarComponent({ filters, onFilters, onResetFilter }: Props) {
  const { t } = useTranslate('navbar');
  // Local state for controlled inputs (prevents focus loss)
  const [localName, setLocalName] = useState(filters.name);
  const [localEmail, setLocalEmail] = useState(filters.email);

  // Update local state when filters prop changes externally (e.g., reset)
  useEffect(() => {
    setLocalName(filters.name);
    setLocalEmail(filters.email);
  }, [filters.name, filters.email]);

  // Debounce the filter updates to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localName !== filters.name) {
        onFilters('name', localName);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localName, filters.name, onFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localEmail !== filters.email) {
        onFilters('email', localEmail);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localEmail, filters.email, onFilters]);

  const handleFilterName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalName(event.target.value);
  }, []);

  const handleFilterEmail = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalEmail(event.target.value);
  }, []);

  const handleFilterStatus = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('status', event.target.value);
    },
    [onFilters]
  );

  return (
    <Stack
      spacing={2}
      direction={{ xs: 'column', md: 'row' }}
      sx={{
        p: 2.5,
        pr: { xs: 2.5, md: 1 },
      }}
    >
      <TextField
        fullWidth
        value={localName}
        onChange={handleFilterName}
        placeholder={t('dashboard.caseManager.searchCaseManager')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        value={localEmail}
        onChange={handleFilterEmail}
        placeholder={t('dashboard.caseManager.searchEmail')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        select
        label={t('dashboard.caseManager.status')}
        value={filters.status}
        onChange={handleFilterStatus}
        SelectProps={{
          MenuProps: {
            PaperProps: {
              sx: { maxHeight: 240 },
            },
          },
        }}
        sx={{
          maxWidth: { xs: 1, sm: 180 },
          textTransform: 'capitalize',
        }}
      >
        <MenuItem value="all">{t('dashboard.caseManager.all')}</MenuItem>
        {CASE_MANAGER_STATUS_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            sx={{
              mx: 1,
              borderRadius: 0.75,
              typography: 'body2',
              textTransform: 'capitalize',
            }}
          >
            {t(`dashboard.caseManager.statusOptions.${option.value}` as any)}
          </MenuItem>
        ))}
      </TextField>

      {/* <IconButton onClick={onResetFilter}>
        <Iconify icon="solar:restart-bold" />
      </IconButton> */}
    </Stack>
  );
}

export const CaseManagerTableToolbar = memo(CaseManagerTableToolbarComponent);
