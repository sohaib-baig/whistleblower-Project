import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TermsConditionsEditForm } from '../terms-conditions-edit-form';

// ----------------------------------------------------------------------

export function TermsConditionsEditView() {
  const { t } = useTranslate('navbar');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.termsConditions.editTermsConditions')}
        backHref={paths.dashboard.termsConditions.root}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('sidebar.pages'), href: paths.dashboard.user.root },
          {
            name: t('dashboard.termsConditions.heading'),
            href: paths.dashboard.termsConditions.root,
          },
          { name: t('dashboard.termsConditions.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <TermsConditionsEditForm />
    </DashboardContent>
  );
}
