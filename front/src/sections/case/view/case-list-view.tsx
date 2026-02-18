import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CaseListView as CaseListViewComponent } from '../case-list';

export function CaseListView() {
  const { t } = useTranslate('navbar');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.case.list')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('dashboard.case.heading'), href: paths.dashboard.case.root },
          { name: t('dashboard.case.list') },
        ]}
        action={null}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <CaseListViewComponent />
    </DashboardContent>
  );
}
