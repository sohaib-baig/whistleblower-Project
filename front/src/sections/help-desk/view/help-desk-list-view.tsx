import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

export function HelpDeskListView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Help Desk"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Help Desk' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <div>Help desk view is not yet implemented.</div>
    </DashboardContent>
  );
}
