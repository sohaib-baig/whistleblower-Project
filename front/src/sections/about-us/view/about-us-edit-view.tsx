import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AboutUsEditForm } from '../about-us-edit-form';

// ----------------------------------------------------------------------

export function AboutUsEditView() {
  const { t } = useTranslate('navbar');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.aboutUs.editAboutUs')}
        backHref={paths.dashboard.aboutUs.root}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('sidebar.pages'), href: paths.dashboard.user.root },
          { name: t('dashboard.aboutUs.heading'), href: paths.dashboard.aboutUs.root },
          { name: t('dashboard.aboutUs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AboutUsEditForm />
    </DashboardContent>
  );
}
