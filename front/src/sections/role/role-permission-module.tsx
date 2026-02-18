import type { IRoleModule } from 'src/types/role';

import { useCallback } from 'react';

import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

// ----------------------------------------------------------------------

type Props = {
  module: IRoleModule;
  onPermissionChange: (moduleId: string, permissionId: string, checked: boolean) => void;
  onModuleChange: (moduleId: string, checked: boolean) => void;
};

export function RolePermissionModule({ module, onPermissionChange, onModuleChange }: Props) {
  const handlePermissionChange = useCallback(
    (permissionId: string, checked: boolean) => {
      onPermissionChange(module.id, permissionId, checked);
    },
    [module.id, onPermissionChange]
  );

  const handleModuleChange = useCallback(
    (checked: boolean) => {
      onModuleChange(module.id, checked);
    },
    [module.id, onModuleChange]
  );

  const allChecked = module.permissions.every((permission) => permission.checked);
  const someChecked = module.permissions.some((permission) => permission.checked);

  return (
    <TableRow>
      {/* Module Column */}
      <TableCell sx={{ width: '200px' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={allChecked}
              indeterminate={someChecked && !allChecked}
              onChange={(event) => handleModuleChange(event.target.checked)}
              color="primary"
              sx={{
                '&.Mui-checked': {
                  color: 'primary.main',
                },
              }}
            />
          }
          label={
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'text.primary',
              }}
            >
              {module.name}
            </Typography>
          }
          sx={{
            m: 0,
            '& .MuiFormControlLabel-label': {
              ml: 1,
            },
          }}
        />
      </TableCell>

      {/* Permissions Columns */}
      {module.permissions.map((permission) => (
        <TableCell key={permission.id} align="center">
          <FormControlLabel
            control={
              <Checkbox
                checked={permission.checked}
                onChange={(event) => handlePermissionChange(permission.id, event.target.checked)}
                color="primary"
                sx={{
                  '&.Mui-checked': {
                    color: 'primary.main',
                  },
                }}
              />
            }
            label={
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  fontWeight: 400,
                }}
              >
                {permission.name}
              </Typography>
            }
            sx={{
              m: 0,
              '& .MuiFormControlLabel-label': {
                ml: 0.5,
              },
            }}
          />
        </TableCell>
      ))}
    </TableRow>
  );
}
