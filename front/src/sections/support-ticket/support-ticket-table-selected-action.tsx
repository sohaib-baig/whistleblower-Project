import Box from '@mui/material/Box';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

type Props = {
  sx?: object;
  dense?: boolean;
  action?: React.ReactNode;
  rowCount?: number;
  numSelected?: number;
  onSelectAllRows?: (checked: boolean) => void;
};

export function SupportTicketTableSelectedAction({
  dense,
  action,
  rowCount,
  numSelected,
  onSelectAllRows,
  sx,
  ...other
}: Props) {
  if (!numSelected) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        zIndex: 9,
        top: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1.5,
        borderRadius: 1,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        ...sx,
      }}
      {...other}
    >
      <Label
        variant="filled"
        color="default"
        sx={{
          color: 'primary.contrastText',
          bgcolor: 'primary.darker',
        }}
      >
        {numSelected} selected
      </Label>

      {action && action}
    </Box>
  );
}