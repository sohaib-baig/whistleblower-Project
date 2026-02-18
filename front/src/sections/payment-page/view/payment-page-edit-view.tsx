import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PaymentPageEditForm } from '../payment-page-edit-form';

// ----------------------------------------------------------------------

export function PaymentPageEditView() {
  const { t } = useTranslate('navbar');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.paymentPage.editPaymentPage')}
        backHref={paths.dashboard.paymentPage.root}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('sidebar.pages'), href: paths.dashboard.user.root },
          { name: t('dashboard.paymentPage.heading'), href: paths.dashboard.paymentPage.root },
          { name: t('dashboard.paymentPage.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PaymentPageEditForm />
    </DashboardContent>
  );
}


