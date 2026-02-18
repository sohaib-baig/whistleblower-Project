import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { IntegrationCreateEditForm } from '../integration-create-edit-form';

// ----------------------------------------------------------------------

export function IntegrationCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new integration"
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: 'Integration', href: paths.dashboard.integration.root },
          { name: 'Create' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <IntegrationCreateEditForm />
    </DashboardContent>
  );
}
