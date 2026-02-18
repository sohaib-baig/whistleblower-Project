import type { IRoleItem } from 'src/types/role';

import { orderBy } from 'es-toolkit';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { deleteRole } from 'src/actions/role';
import { DashboardContent } from 'src/layouts/dashboard';
import { _roleItems, ROLE_SORT_OPTIONS } from 'src/_mock';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { RoleList } from '../role-list';
import { RoleSort } from '../role-sort';
import { RoleSearch } from '../role-search';

// ----------------------------------------------------------------------

export function RoleListView() {
  const [sortBy, setSortBy] = useState('latest');
  const [roles, setRoles] = useState(_roleItems);

  const dataFiltered = applySort({
    inputData: roles,
    sortBy,
  });

  const handleSortBy = useCallback((newValue: string) => {
    setSortBy(newValue);
  }, []);

  const handleDeleteRole = useCallback(async (roleId: string) => {
    try {
      await deleteRole(roleId);
      setRoles((prevRoles) => prevRoles.filter((role) => role.id !== roleId));
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  }, []);

  const renderFilters = () => (
    <Box
      sx={{
        gap: 3,
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-end', sm: 'center' },
      }}
    >
      <RoleSearch redirectPath={(id: string) => paths.dashboard.role.details(id)} />

      <Box sx={{ gap: 1, flexShrink: 0, display: 'flex' }}>
        <RoleSort sort={sortBy} onSort={handleSortBy} sortOptions={ROLE_SORT_OPTIONS} />
      </Box>
    </Box>
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="List"
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: 'Role', href: paths.dashboard.role.root },
          { name: 'List' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.role.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Add role
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={2.5} sx={{ mb: { xs: 3, md: 5 } }}>
        {renderFilters()}
      </Stack>

      <RoleList roles={dataFiltered} onDeleteRole={handleDeleteRole} />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

type ApplySortProps = {
  sortBy: string;
  inputData: IRoleItem[];
};

function applySort({ inputData, sortBy }: ApplySortProps) {
  // Sort by
  if (sortBy === 'latest') {
    inputData = orderBy(inputData, ['createdAt'], ['desc']);
  }

  if (sortBy === 'oldest') {
    inputData = orderBy(inputData, ['createdAt'], ['asc']);
  }

  if (sortBy === 'popular') {
    inputData = orderBy(inputData, ['totalViews'], ['desc']);
  }

  return inputData;
}
