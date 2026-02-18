import type { SelectChangeEvent } from '@mui/material/Select';
import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { IQuestionTableFilters } from 'src/types/question';

import { useCallback } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  onResetPage: () => void;
  filters: UseSetStateReturn<IQuestionTableFilters>;
  inputTypeOptions: Array<{ value: string; label: string }>;
};

export function QuestionTableToolbar({ filters, inputTypeOptions, onResetPage }: Props) {
  const { t } = useTranslate('navbar');
  const menuActions = usePopover();

  const { state: currentFilters, setState: updateFilters } = filters;

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      updateFilters({ name: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterInputType = useCallback(
    (event: SelectChangeEvent<string>) => {
      onResetPage();
      updateFilters({ inputType: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const renderMenuActions = () => (
    <CustomPopover open={menuActions.open} onClose={menuActions.onClose} sx={{ width: 160 }}>
      <MenuList>
        <MenuItem
          onClick={() => {
            menuActions.onClose();
          }}
        >
          <Iconify icon="solar:printer-minimalistic-bold" />
          {t('dashboard.question.print')}
        </MenuItem>

        <MenuItem
          onClick={() => {
            menuActions.onClose();
          }}
        >
          <Iconify icon="solar:import-bold" />
          {t('dashboard.question.import')}
        </MenuItem>

        <MenuItem
          onClick={() => {
            menuActions.onClose();
          }}
        >
          <Iconify icon="solar:export-bold" />
          {t('dashboard.question.export')}
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  return (
    <Box
      sx={{
        py: 2.5,
        px: { xs: 2.5, md: 2 },
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      <TextField
        fullWidth
        value={currentFilters.name}
        onChange={handleFilterName}
        placeholder={t('dashboard.question.searchQuestions')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          maxWidth: { xs: 1, md: 300 },
        }}
      />

      <FormControl
        sx={{
          flexShrink: 0,
          width: { xs: 1, md: 200 },
        }}
      >
        <InputLabel>{t('dashboard.question.inputType')}</InputLabel>
        <Select
          value={currentFilters.inputType}
          onChange={handleFilterInputType}
          label={t('dashboard.question.inputType')}
        >
          {inputTypeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {t(`dashboard.question.inputTypes.${option.value}` as any)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ flexGrow: 1 }} />

      {renderMenuActions()}
    </Box>
  );
}
