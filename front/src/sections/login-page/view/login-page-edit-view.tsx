import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { LoginPageEditForm } from '../login-page-edit-form';

// ----------------------------------------------------------------------

export function LoginPageEditView() {
  const { t } = useTranslate('navbar');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.loginPage.editLoginPage')}
        backHref={paths.dashboard.loginPage.root}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('sidebar.pages'), href: paths.dashboard.user.root },
          { name: t('dashboard.loginPage.heading'), href: paths.dashboard.loginPage.root },
          { name: t('dashboard.loginPage.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <LoginPageEditForm />
    </DashboardContent>
  );
}
