import type { IIntegrationItem } from 'src/types/integration';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { IntegrationCreateEditForm } from '../integration-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  integration?: IIntegrationItem;
};

export function IntegrationEditView({ integration }: Props) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit Integration"
        backHref={paths.dashboard.integration.root}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: 'Integration', href: paths.dashboard.integration.root },
          { name: integration?.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <IntegrationCreateEditForm currentIntegration={integration} />
    </DashboardContent>
  );
}
