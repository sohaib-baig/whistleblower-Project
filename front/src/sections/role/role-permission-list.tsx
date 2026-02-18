import type { IRoleModule } from 'src/types/role';

import { useCallback } from 'react';

import Card from '@mui/material/Card';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';

import { RolePermissionModule } from './role-permission-module';

// ----------------------------------------------------------------------

type Props = {
  modules: IRoleModule[];
  onPermissionChange: (moduleId: string, permissionId: string, checked: boolean) => void;
  onModuleChange: (moduleId: string, checked: boolean) => void;
};

export function RolePermissionList({ modules, onPermissionChange, onModuleChange }: Props) {
  const handlePermissionChange = useCallback(
    (moduleId: string, permissionId: string, checked: boolean) => {
      onPermissionChange(moduleId, permissionId, checked);
    },
    [onPermissionChange]
  );

  const handleModuleChange = useCallback(
    (moduleId: string, checked: boolean) => {
      onModuleChange(moduleId, checked);
    },
    [onModuleChange]
  );

  // Get all unique permissions from the first module to create table headers
  const permissionHeaders = modules.length > 0 ? modules[0].permissions : [];

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 0,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      {/* <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Role Permission
        </Typography>
      </Box> */}

      {/* Permission Table */}
      <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
        <Table sx={{ minWidth: 650 }} aria-label="role permissions table">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Module
              </TableCell>
              {permissionHeaders.map((permission) => (
                <TableCell
                  key={permission.id}
                  align="center"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  {permission.name}
                </TableCell>
              ))}
              <TableCell
                align="center"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Create
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Update
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Delete
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {modules.map((module) => (
              <RolePermissionModule
                key={module.id}
                module={module}
                onPermissionChange={handlePermissionChange}
                onModuleChange={handleModuleChange}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
