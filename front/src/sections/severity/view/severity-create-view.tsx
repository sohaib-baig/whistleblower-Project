import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SeverityCreateEditForm } from '../severity-create-edit-form';

// ----------------------------------------------------------------------

export function SeverityCreateView() {
  const { t } = useTranslate('navbar');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.severity.createNewSeverity')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: t('dashboard.severity.heading'), href: paths.dashboard.severity.root },
          { name: t('dashboard.severity.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <SeverityCreateEditForm />
    </DashboardContent>
  );
}
