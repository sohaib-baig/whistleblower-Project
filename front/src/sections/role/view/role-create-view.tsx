import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { RoleCreateEditForm } from '../role-create-edit-form';

// ----------------------------------------------------------------------

export function RoleCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new role"
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: 'Role', href: paths.dashboard.role.root },
          { name: 'Create' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <RoleCreateEditForm />
    </DashboardContent>
  );
}
