import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InvoiceCreateEditForm } from '../invoice-create-edit-form';

// ----------------------------------------------------------------------

export function InvoiceCreateView() {
  const { t } = useTranslate('navbar');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.invoice.createNewInvoice')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('dashboard.invoice.heading'), href: paths.dashboard.invoice.root },
          { name: t('dashboard.invoice.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <InvoiceCreateEditForm />
    </DashboardContent>
  );
}
