import type { IQuestion } from 'src/types/question';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: IQuestion;
  selected: boolean;
  onSelectRow: (checked: boolean) => void;
  onDeleteRow: () => void;
  onEditRow: () => void;
  onDragStart?: (id: string) => void;
  onDragOverRow?: (overId: string) => void;
  onDragEnd?: () => void;
  dragging?: boolean;
  dragEnabled?: boolean;
};

export function QuestionTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onEditRow,
  onDragStart,
  onDragOverRow,
  onDragEnd,
  dragging,
}: Props) {
  const { t } = useTranslate('navbar');
  const [open, setOpen] = useState<HTMLElement | null>(null);

  const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setOpen(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(null);
  }, []);

  const getInputTypeLabel = (inputType: string) =>
    t(`dashboard.question.inputTypes.${inputType}` as any) || inputType;

  const getRequiredChip = (isRequired: boolean) => (
    <Chip
      label={isRequired ? t('dashboard.question.required') : t('dashboard.question.optional')}
      color={isRequired ? 'error' : 'default'}
      size="small"
    />
  );

  return (
    <>
      <TableRow
        hover
        selected={selected}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDragEnter={() => {
          onDragOverRow?.(row.id);
        }}
        onDrop={() => {
          onDragEnd?.();
        }}
        sx={{ opacity: dragging ? 0.6 : 1 }}
      >
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onChange={(event) => onSelectRow(event.target.checked)} />
        </TableCell>

        <TableCell sx={{ maxWidth: 300 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              draggable
              onDragStart={(e) => {
                if (e.dataTransfer?.setData) {
                  e.dataTransfer.setData('text/plain', row.id);
                }
                onDragStart?.(row.id);
              }}
              onDragEnd={() => {
                onDragEnd?.();
              }}
              sx={{ cursor: 'grab', display: 'inline-flex', flexShrink: 0 }}
            >
              <Iconify
                icon="custom:drag-dots-fill"
                width={18}
                sx={{ color: 'text.disabled', mr: 1 }}
              />
            </Box>
            <Box sx={{ ml: 2, minWidth: 0, overflow: 'hidden' }}>
              <Tooltip title={row.name} arrow>
                <Typography variant="subtitle2" noWrap sx={{ maxWidth: 250 }}>
                  {row.name}
                </Typography>
              </Tooltip>
            </Box>
          </Box>
        </TableCell>

        <TableCell>{getRequiredChip(row.isRequired)}</TableCell>

        <TableCell>
          <Chip label={getInputTypeLabel(row.inputType)} variant="outlined" size="small" />
        </TableCell>

        <TableCell align="right">
          <IconButton color={open ? 'inherit' : 'default'} onClick={handleOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={!!open}
        anchorEl={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              minWidth: 200,
              maxWidth: 300,
            },
          },
        }}
      >
        <Box sx={{ py: 1 }}>
          <MenuItem
            onClick={() => {
              onEditRow();
              handleClose();
            }}
            sx={{
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}
          >
            <Iconify icon="solar:pen-bold" sx={{ mr: 1, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ flex: 1 }}>
              {t('dashboard.question.editQuestion')}
            </Typography>
          </MenuItem>

          <MenuItem
            onClick={() => {
              onDeleteRow();
              handleClose();
            }}
            sx={{
              color: 'error.main',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 1, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ flex: 1 }}>
              {t('dashboard.question.delete')}
            </Typography>
          </MenuItem>
        </Box>
      </CustomPopover>
    </>
  );
}
