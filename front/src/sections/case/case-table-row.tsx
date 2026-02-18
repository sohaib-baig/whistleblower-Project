import type { CaseListItem } from 'src/actions/company-case-details';

import React from 'react';

import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

type Props = {
  row: CaseListItem;
  selected: boolean;
  onSelectRow: () => void;
  onViewRow: (id: string) => void;
  onDeleteRow: (id: string) => void;
  onDownloadRow?: (id: string) => void;
};

export function CaseTableRow({ row, selected, onSelectRow, onViewRow, onDeleteRow, onDownloadRow }: Props) {
  const { t } = useTranslate('navbar');
  const { user } = useAuthContext();

  const isAdmin = user?.role === 'admin';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'info';
      case 'in_progress':
        return 'warning';
      case 'open':
        return 'primary';
      case 'closed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return t('dashboard.case.statusOptions.new');
      case 'in_progress':
        return t('dashboard.case.statusOptions.inProgress');
      case 'open':
        return t('dashboard.case.statusOptions.open');
      case 'closed':
        return t('dashboard.case.statusOptions.closed');
      default:
        return status;
    }
  };

  return (
    <TableRow hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onChange={onSelectRow} />
      </TableCell>

      {/* Case ID */}
      <TableCell sx={{ maxWidth: 'unset' }}>
        <Typography variant="body2" sx={{ whiteSpace: 'normal' }}>
          {row.case_id || row.id || '-'}
        </Typography>
      </TableCell>

      {/* Company - Only show for admin */}
      {isAdmin && (
        <TableCell sx={{ maxWidth: 180 }}>
          <Tooltip title={row.company?.name || ''} arrow>
            <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
              {row.company?.name || '-'}
            </Typography>
          </Tooltip>
        </TableCell>
      )}

      {/* Title */}
      <TableCell sx={{ maxWidth: 250 }}>
        <Tooltip title={row.title || row.subject || ''} arrow>
          <Typography variant="body2" noWrap sx={{ maxWidth: 230 }}>
            {row.title || row.subject || '-'}
          </Typography>
        </Tooltip>
      </TableCell>

      {/* Category */}
      <TableCell>{row.category?.name || 'N/A'}</TableCell>

      {/* Case Manager */}
      <TableCell sx={{ maxWidth: 150 }}>
        <Tooltip title={row.case_manager?.name || ''} arrow>
          <Typography variant="body2" noWrap sx={{ maxWidth: 130 }}>
            {row.case_manager?.name || t('dashboard.case.unassigned')}
          </Typography>
        </Tooltip>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Label variant="soft" color={getStatusColor(row.status)}>
          {getStatusLabel(row.status)}
        </Label>
      </TableCell>

      {/* Created Date */}
      <TableCell>{fDate(row.created_at)}</TableCell>

      {/* Actions */}
      <TableCell>
        <Stack direction="row" spacing={1}>
          <IconButton
            size="small"
            onClick={() => onViewRow(row.id)}
            sx={{ color: 'text.secondary' }}
          >
            <Iconify icon="solar:eye-bold" />
          </IconButton>
          {onDownloadRow && (
            <IconButton
              size="small"
              onClick={() => onDownloadRow(row.id)}
              sx={{ color: 'text.secondary' }}
            >
              <Iconify icon="solar:download-bold" />
            </IconButton>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}
