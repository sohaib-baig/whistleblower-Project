import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PolicyPageList } from '../policy-page-list';

// ----------------------------------------------------------------------

export function PolicyPageListView() {
  const { t } = useTranslate('navbar');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.policyPage.heading')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('dashboard.policyPage.heading') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <PolicyPageList />
    </DashboardContent>
  );
}

