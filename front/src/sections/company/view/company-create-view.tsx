import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales/use-locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CompanyCreateEditForm } from '../company-create-edit-form';

// ----------------------------------------------------------------------

export function CompanyCreateView() {
  const { t } = useTranslate('navbar');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.company.createNewCompany')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: t('dashboard.company.heading'), href: paths.dashboard.company.root },
          { name: t('dashboard.company.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CompanyCreateEditForm />
    </DashboardContent>
  );
}
