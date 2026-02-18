import type { IRoleItem } from 'src/types/role';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Pagination, { paginationClasses } from '@mui/material/Pagination';

import { paths } from 'src/routes/paths';

import { RoleItem } from './role-item';

// ----------------------------------------------------------------------

type Props = {
  roles: IRoleItem[];
  onDeleteRole: (roleId: string) => void;
};

export function RoleList({ roles, onDeleteRole }: Props) {
  const handleDelete = useCallback(
    (id: string) => {
      onDeleteRole(id);
    },
    [onDeleteRole]
  );

  return (
    <>
      <Box
        sx={{
          gap: 3,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        }}
      >
        {roles.map((role) => (
          <RoleItem
            key={role.id}
            roleItem={role}
            editHref={paths.dashboard.role.edit(role.id)}
            detailsHref={paths.dashboard.role.details(role.id)}
            onDelete={() => handleDelete(role.id)}
          />
        ))}
      </Box>

      {roles.length > 8 && (
        <Pagination
          count={8}
          sx={{
            mt: { xs: 8, md: 8 },
            [`& .${paginationClasses.ul}`]: { justifyContent: 'center' },
          }}
        />
      )}
    </>
  );
}
