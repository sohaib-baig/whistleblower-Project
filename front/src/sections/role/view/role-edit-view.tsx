import type { IRoleItem } from 'src/types/role';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { RoleCreateEditForm } from '../role-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  role?: IRoleItem;
};

export function RoleEditView({ role }: Props) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit"
        backHref={paths.dashboard.role.root}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: 'Role', href: paths.dashboard.role.root },
          { name: role?.title },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <RoleCreateEditForm currentRole={role} />
    </DashboardContent>
  );
}
