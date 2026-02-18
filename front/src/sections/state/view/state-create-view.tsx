import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { StateCreateEditForm } from '../state-create-edit-form';

// ----------------------------------------------------------------------

export function StateCreateView() {
  const { t } = useTranslate('navbar');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.state.createNewState')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: t('dashboard.state.heading'), href: paths.dashboard.state.root },
          { name: t('dashboard.state.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <StateCreateEditForm />
    </DashboardContent>
  );
}
