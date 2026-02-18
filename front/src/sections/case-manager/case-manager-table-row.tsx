import type { ICaseManagerItem } from 'src/types/case-manager';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: ICaseManagerItem;
  selected: boolean;
  onSelectRow: () => void;
  onEditRow: () => void;
  onAccessAccount: () => void;
  onDeleteRow: () => void;
  canAccessAccount?: boolean;
};

export function CaseManagerTableRow({
  row,
  selected,
  onSelectRow,
  onEditRow,
  onAccessAccount,
  onDeleteRow,
  canAccessAccount = true,
}: Props) {
  const { t } = useTranslate('navbar');
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) =>
    t(`dashboard.caseManager.statusOptions.${status}` as any);

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
              onEditRow();
              menuActions.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            {t('dashboard.caseManager.edit')}
          </MenuItem>
        </li>

        {canAccessAccount && (
          <li>
            <MenuItem
              onClick={() => {
                onAccessAccount();
                menuActions.onClose();
              }}
            >
              <Iconify icon="solar:user-id-bold" />
              {t('dashboard.caseManager.accessAccount')}
            </MenuItem>
          </li>
        )}

        <MenuItem
          onClick={() => {
            confirmDialog.onTrue();
            menuActions.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          {t('dashboard.caseManager.delete')}
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('dashboard.caseManager.deleteConfirmTitle')}
      content={t('dashboard.caseManager.deleteConfirmMessage')}
      action={
        <Button variant="contained" color="error" onClick={onDeleteRow}>
          {t('dashboard.caseManager.delete')}
        </Button>
      }
    />
  );

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onChange={onSelectRow} />
        </TableCell>
        <TableCell sx={{ maxWidth: 180 }}>
          <Tooltip title={row.name || ''} arrow>
            <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
              {row.name}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell sx={{ maxWidth: 200 }}>
          <Tooltip title={row.email || ''} arrow>
            <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
              {row.email}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell sx={{ maxWidth: 150 }}>
          <Typography variant="body2" noWrap sx={{ maxWidth: 130 }}>
            {row.phone}
          </Typography>
        </TableCell>
        <TableCell>
          <Iconify
            icon={row.isVerified ? 'solar:check-circle-bold' : 'solar:close-circle-bold'}
            sx={{
              color: row.isVerified ? 'success.main' : 'error.main',
              fontSize: 20,
            }}
          />
        </TableCell>
        <TableCell>
          <Iconify
            icon={row.isActive ? 'solar:check-circle-bold' : 'solar:close-circle-bold'}
            sx={{
              color: row.isActive ? 'success.main' : 'error.main',
              fontSize: 20,
            }}
          />
        </TableCell>
        <TableCell>
          <Label variant="soft" color={getStatusColor(row.status)}>
            {getStatusLabel(row.status)}
          </Label>
        </TableCell>
        <TableCell>{fDate(row.createdAt)}</TableCell>
        <TableCell align="right">
          <IconButton onClick={menuActions.onOpen} sx={{ position: 'static' }}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}
