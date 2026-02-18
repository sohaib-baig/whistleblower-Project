import type { IStateItem } from 'src/types/state';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IStateItem;
  selected: boolean;
  editHref: string;
  onSelectRow: () => void;
  onDeleteRow: () => void;
  onEdit?: (id: string) => void;
};

export function StateTableRow({ row, selected, editHref, onSelectRow, onDeleteRow, onEdit }: Props) {
  const { t } = useTranslate('navbar');
  const menuActions = usePopover();

  const confirmDialog = useBoolean();

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <li>
          <MenuItem
            onClick={() => {
              menuActions.onClose();
              if (onEdit) {
                onEdit(row.id);
              }
            }}
            component={onEdit ? 'div' : RouterLink}
            href={onEdit ? undefined : editHref}
          >
            <Iconify icon="solar:pen-bold" />
            {t('dashboard.state.menu.edit')}
          </MenuItem>
        </li>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuItem
          onClick={() => {
            confirmDialog.onTrue();
            menuActions.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          {t('dashboard.state.menu.delete')}
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('dashboard.state.confirmDialog.delete')}
      content={t('dashboard.state.confirmDialog.deleteConfirm')}
      action={
        <Button variant="contained" color="error" onClick={onDeleteRow}>
          {t('dashboard.state.confirmDialog.delete')}
        </Button>
      }
    />
  );

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox
            checked={selected}
            onClick={onSelectRow}
            slotProps={{
              input: {
                id: `${row.id}-checkbox`,
                'aria-label': `${row.id} checkbox`,
              },
            }}
          />
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ListItemText
              primary={row.name}
              secondary={row.id}
              slotProps={{
                primary: { noWrap: true, sx: { typography: 'body2' } },
                secondary: { sx: { mt: 0.5, typography: 'caption' } },
              }}
            />
          </Box>
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (row.status === 'active' && 'success') ||
              (row.status === 'inactive' && 'error') ||
              'default'
            }
          >
            {row.status === 'active'
              ? t('dashboard.state.status.active')
              : row.status === 'inactive'
                ? t('dashboard.state.status.inactive')
                : row.status}
          </Label>
        </TableCell>

        <TableCell>
          <ListItemText
            primary={fDate(row.createdAt)}
            slotProps={{
              primary: { noWrap: true, sx: { typography: 'body2' } },
            }}
          />
        </TableCell>

        <TableCell align="right" sx={{ px: 1 }}>
          <IconButton color={menuActions.open ? 'inherit' : 'default'} onClick={menuActions.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}
