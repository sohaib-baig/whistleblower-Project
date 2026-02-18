import type { CardProps } from '@mui/material/Card';
import type { IRoleItem } from 'src/types/role';

import { usePopover, useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = CardProps & {
  roleItem: IRoleItem;
  editHref: string;
  detailsHref: string;
  onDelete: () => void;
};

export function RoleItem({ roleItem, editHref, detailsHref, onDelete, sx, ...other }: Props) {
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  // Calculate module and permission statistics
  const moduleCount = roleItem.permissions?.length || 0;
  const permissionCount =
    roleItem.permissions?.reduce(
      (total, module) => total + module.permissions.filter((p) => p.checked).length,
      0
    ) || 0;

  const moduleNames = roleItem.permissions?.map((m) => m.name).join(', ') || 'No modules';

  // Calculate permission breakdown
  const permissionBreakdown =
    roleItem.permissions?.reduce(
      (acc, module) => {
        module.permissions.forEach((permission) => {
          if (permission.checked) {
            acc[permission.name] = (acc[permission.name] || 0) + 1;
          }
        });
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  const permissionSummary =
    Object.entries(permissionBreakdown)
      .map(([name, count]) => `${name}: ${count}`)
      .join(', ') || 'No permissions';

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

        <MenuItem
          onClick={() => {
            confirmDialog.onTrue();
            menuActions.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="Delete Role"
      content="Are you sure you want to delete this role? This action cannot be undone."
      action={
        <Button variant="contained" color="error" onClick={onDelete}>
          Delete
        </Button>
      }
    />
  );

  return (
    <>
      <Card sx={sx} {...other}>
        <IconButton onClick={menuActions.onOpen} sx={{ position: 'absolute', top: 8, right: 8 }}>
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>

        <Box sx={{ p: 3, pb: 2 }}>
          {/* <Avatar
            alt={roleItem.title}
            src={roleItem.company?.logo}
            variant="rounded"
            sx={{ width: 48, height: 48, mb: 2 }}
          /> */}

          <ListItemText
            sx={{ mb: 1 }}
            primary={
              <Link component={RouterLink} href={editHref} color="inherit">
                {roleItem.title}
              </Link>
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
            <Iconify width={16} icon="solar:shield-check-bold" />
            {permissionCount} permissions
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
              label: `${moduleCount} Modules`,
              icon: <Iconify width={16} icon="solar:list-bold" sx={{ flexShrink: 0 }} />,
            },
            {
              label: moduleNames,
              icon: <Iconify width={16} icon="solar:add-folder-bold" sx={{ flexShrink: 0 }} />,
            },
            {
              label: `${permissionCount} Permissions`,
              icon: <Iconify width={16} icon="solar:check-circle-bold" sx={{ flexShrink: 0 }} />,
            },
            {
              label: permissionSummary,
              icon: <Iconify width={16} icon="solar:shield-check-bold" sx={{ flexShrink: 0 }} />,
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
      {renderConfirmDialog()}
    </>
  );
}
