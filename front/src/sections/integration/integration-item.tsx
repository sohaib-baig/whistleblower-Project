import type { CardProps } from '@mui/material/Card';
import type { IIntegrationItem } from 'src/types/integration';

import { useState } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import FormControlLabel from '@mui/material/FormControlLabel';

import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = CardProps & {
  integrationItem: IIntegrationItem;
  editHref: string;
  detailsHref: string;
  onDelete: () => void;
};

export function IntegrationItem({
  integrationItem,
  editHref,
  detailsHref,
  onDelete,
  sx,
  ...other
}: Props) {
  const menuActions = usePopover();
  const [isConnected, setIsConnected] = useState(integrationItem.status === 'active');

  const handleConnectionToggle = (connected: boolean) => {
    setIsConnected(connected);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'eva:checkmark-fill';
      case 'inactive':
        return 'eva:cloud-upload-fill';
      default:
        return 'eva:cloud-upload-fill';
    }
  };

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <li>
          <MenuItem component={RouterLink} href={editHref} onClick={() => menuActions.onClose()}>
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>
        </li>

        {/* <MenuItem
          onClick={() => {
            menuActions.onClose();
            setDeleteDialogOpen(true);
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem> */}
      </MenuList>
    </CustomPopover>
  );

  return (
    <>
      <Card sx={sx} {...other}>
        <IconButton onClick={menuActions.onOpen} sx={{ position: 'absolute', top: 8, right: 8 }}>
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>

        <Box sx={{ p: 3, pb: 2 }}>
          <ListItemText
            sx={{ mb: 1 }}
            primary={
              <Link component={RouterLink} href={editHref} color="inherit">
                {integrationItem.name}
              </Link>
            }
            secondary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  size="small"
                  label={integrationItem.status}
                  color={getStatusColor(integrationItem.status)}
                  icon={<Iconify icon={getStatusIcon(integrationItem.status)} width={16} />}
                />
              </Box>
            }
            slotProps={{
              primary: { sx: { typography: 'subtitle1' } },
              secondary: {
                sx: { mt: 1, typography: 'caption', color: 'text.disabled' },
              },
            }}
          />

          <Box
            sx={{
              gap: 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'primary.main',
              typography: 'caption',
            }}
          >
            <Iconify width={16} icon="eva:link-2-fill" />
            {integrationItem.endpoint}
          </Box>

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={isConnected}
                  onChange={(e) => handleConnectionToggle(e.target.checked)}
                  color="success"
                />
              }
              label={
                <Typography
                  variant="caption"
                  color={isConnected ? 'success.main' : 'text.secondary'}
                >
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Typography>
              }
              sx={{ m: 0 }}
            />
          </Box>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box
          sx={{
            p: 3,
            rowGap: 1.5,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
          }}
        >
          {[
            {
              label: `App Key: ${integrationItem.appKey.substring(0, 8)}...`,
              icon: <Iconify width={16} icon="eva:external-link-fill" sx={{ flexShrink: 0 }} />,
            },
            {
              label: `Secret: ${integrationItem.appSecret.substring(0, 8)}...`,
              icon: <Iconify width={16} icon="eva:cloud-upload-fill" sx={{ flexShrink: 0 }} />,
            },
            {
              label: integrationItem.totalRequests
                ? `${integrationItem.totalRequests} requests`
                : 'No requests',
              icon: <Iconify width={16} icon="eva:activity-fill" sx={{ flexShrink: 0 }} />,
            },
            {
              label: integrationItem.successRate
                ? `${integrationItem.successRate}% success`
                : 'No data',
              icon: <Iconify width={16} icon="eva:trending-up-fill" sx={{ flexShrink: 0 }} />,
            },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{
                gap: 0.5,
                minWidth: 0,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                color: 'text.disabled',
              }}
            >
              {item.icon}
              <Typography variant="caption" noWrap>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Card>

      {renderMenuActions()}

      {/* Delete Confirmation Dialog - Commented out */}
      {/* <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Integration
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{integrationItem.name}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              onDelete();
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog> */}
    </>
  );
}
