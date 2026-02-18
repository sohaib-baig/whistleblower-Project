import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SupportEditForm } from '../support-edit-form';

// ----------------------------------------------------------------------

export function SupportEditView() {
  const { t } = useTranslate('navbar');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.support.editSupport')}
        backHref={paths.dashboard.support.root}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('sidebar.pages'), href: paths.dashboard.user.root },
          { name: t('dashboard.support.heading'), href: paths.dashboard.support.root },
          { name: t('dashboard.support.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <SupportEditForm />
    </DashboardContent>
  );
}
