import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { BankDetailsForm } from '../bank-details-form';

// ----------------------------------------------------------------------

export function BankDetailsView() {
  const { t } = useTranslate('navbar');

  const handleBankDetailsSaved = () => {
    // Bank details saved successfully
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.bankDetails.heading')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: 'Settings', href: paths.dashboard.user.root },
          { name: t('dashboard.bankDetails.breadcrumb') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <BankDetailsForm onSuccess={handleBankDetailsSaved} />
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
