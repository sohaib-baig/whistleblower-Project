import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PrivacyPolicyEditForm } from '../privacy-policy-edit-form';

// ----------------------------------------------------------------------

export function PrivacyPolicyEditView() {
  const { t } = useTranslate('navbar');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.privacyPolicy.editPrivacyPolicy')}
        backHref={paths.dashboard.privacyPolicy.root}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('sidebar.pages'), href: paths.dashboard.user.root },
          { name: t('dashboard.privacyPolicy.heading'), href: paths.dashboard.privacyPolicy.root },
          { name: t('dashboard.privacyPolicy.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PrivacyPolicyEditForm />
    </DashboardContent>
  );
}
