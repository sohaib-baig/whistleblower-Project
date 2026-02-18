import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { PolicyPageEditForm } from '../policy-page-edit-form';

// ----------------------------------------------------------------------

export function PolicyPageEditView() {
  const { t } = useTranslate('navbar');
  const { user } = useAuthContext();

  // Only company users can edit
  if (user?.role !== 'company') {
    return (
      <DashboardContent>
        <EmptyContent
          filled
          title={t('dashboard.policyPage.unauthorized.title')}
          description={t('dashboard.policyPage.unauthorized.description')}
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.policyPage.editPolicyPage')}
        backHref={paths.dashboard.policyPage.root}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('dashboard.policyPage.heading'), href: paths.dashboard.policyPage.root },
          { name: t('dashboard.policyPage.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PolicyPageEditForm />
    </DashboardContent>
  );
}

