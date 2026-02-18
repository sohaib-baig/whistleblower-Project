import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { BasicConfigurationForm } from '../basic-configuration-form';

// ----------------------------------------------------------------------

export function BasicConfigurationView() {
  const { t } = useTranslate('navbar');

  const handleConfigurationSaved = () => {
    // Configuration saved successfully
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.basicConfiguration.heading')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: 'Settings', href: paths.dashboard.user.root },
          { name: t('dashboard.basicConfiguration.breadcrumb') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <BasicConfigurationForm onSuccess={handleConfigurationSaved} />
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
