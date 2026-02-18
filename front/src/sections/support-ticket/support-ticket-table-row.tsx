import type { ISupportTicketItem } from 'src/types/support-ticket';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDate, fTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  row: ISupportTicketItem;
  selected: boolean;
  onSelectRow: () => void;
  onViewRow: () => void;
  onDeleteRow: () => void;
};

export function SupportTicketTableRow({ row, selected, onSelectRow, onViewRow, onDeleteRow }: Props) {
  return (
    <TableRow hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onClick={onSelectRow} />
      </TableCell>

      <TableCell>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            #{row.id.slice(-8)}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="subtitle2" noWrap>
              {row.title}
            </Typography>
            {row.latest_chat && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Last: {row.latest_chat.content.substring(0, 50)}...
              </Typography>
            )}
          </Box>
        </Stack>
      </TableCell>

      <TableCell>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            alt={row.creator.name}
            src={undefined}
            sx={{ width: 32, height: 32 }}
          >
            {row.creator.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" noWrap>
              {row.creator.name}
            </Typography>
            {row.creator.company_name && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {row.creator.company_name}
              </Typography>
            )}
          </Box>
        </Stack>
      </TableCell>

      <TableCell>
        <Label
          variant="soft"
          color={
            (row.status === 'open' && 'success') ||
            (row.status === 'closed' && 'default') ||
            'default'
          }
        >
          {row.status}
        </Label>
      </TableCell>

      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
          {row.unread_count > 0 && (
            <Label color="error" variant="filled">
              {row.unread_count}
            </Label>
          )}
          <Typography variant="caption">
            {row.unread_count > 0 ? 'unread' : 'read'}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell>
        <Stack direction="column">
          <Typography variant="body2">{fDate(row.created_at)}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {fTime(row.created_at)}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell align="right">
        <IconButton onClick={onViewRow}>
          <Iconify icon="solar:eye-bold" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}