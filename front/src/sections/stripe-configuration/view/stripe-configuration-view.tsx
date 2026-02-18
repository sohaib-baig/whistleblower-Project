import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { StripeConfigurationForm } from '../stripe-configuration-form';

// ----------------------------------------------------------------------

export function StripeConfigurationView() {
  const { t } = useTranslate('navbar');

  const handleConfigSaved = () => {
    // Configuration saved successfully
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.stripeConfiguration.heading')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: 'Settings', href: paths.dashboard.user.root },
          { name: t('dashboard.stripeConfiguration.breadcrumb') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <StripeConfigurationForm onSuccess={handleConfigSaved} />
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
