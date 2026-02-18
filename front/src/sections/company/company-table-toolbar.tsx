import type { SelectChangeEvent } from '@mui/material/Select';
import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { ICompanyTableFilters } from 'src/types/company';

import { usePopover } from 'minimal-shared/hooks';
import { memo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales/use-locales';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  onResetPage: () => void;
  filters: UseSetStateReturn<ICompanyTableFilters>;
  statusOptions: Array<{ value: string; label: string }>;
};

function CompanyTableToolbarComponent({ filters, statusOptions, onResetPage }: Props) {
  const { t } = useTranslate('navbar');
  const menuActions = usePopover();

  const { state: currentFilters, setState: updateFilters } = filters;

  // Local state for controlled input (prevents focus loss)
  const [localSearch, setLocalSearch] = useState(currentFilters.name);

  // Update local state when filters prop changes externally (e.g., reset)
  useEffect(() => {
    setLocalSearch(currentFilters.name);
  }, [currentFilters.name]);

  // Debounce the filter update to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== currentFilters.name) {
        onResetPage();
        updateFilters({ name: localSearch });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, currentFilters.name, onResetPage, updateFilters]);

  const handleFilterName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(event.target.value);
  }, []);

  const handleFilterStatus = useCallback(
    (event: SelectChangeEvent<string>) => {
      onResetPage();
      updateFilters({ status: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem onClick={() => menuActions.onClose()}>
          <Iconify icon="solar:printer-minimalistic-bold" />
          {t('dashboard.company.print')}
        </MenuItem>

        <MenuItem onClick={() => menuActions.onClose()}>
          <Iconify icon="solar:import-bold" />
          {t('dashboard.company.import')}
        </MenuItem>

        <MenuItem onClick={() => menuActions.onClose()}>
          <Iconify icon="solar:export-bold" />
          {t('dashboard.company.export')}
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  return (
    <>
      <Box
        sx={{
          p: 2.5,
          gap: 2,
          display: 'flex',
          pr: { xs: 2.5, md: 1 },
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-end', md: 'center' },
        }}
      >
        <FormControl sx={{ flexShrink: 0, width: { xs: 1, md: 200 } }}>
          <InputLabel htmlFor="filter-status-select">{t('dashboard.company.status')}</InputLabel>
          <Select
            label={t('dashboard.company.status')}
            value={currentFilters.status}
            onChange={handleFilterStatus}
            inputProps={{ id: 'filter-status-select' }}
            MenuProps={{
              slotProps: { paper: { sx: { maxHeight: 240 } } },
            }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box
          sx={{
            gap: 2,
            width: 1,
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <TextField
            fullWidth
            value={localSearch}
            onChange={handleFilterName}
            placeholder={t('dashboard.company.searchCompanies')}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
      </Box>

      {renderMenuActions()}
    </>
  );
}

export const CompanyTableToolbar = memo(CompanyTableToolbarComponent);
