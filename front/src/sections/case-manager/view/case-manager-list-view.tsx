import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import CaseManagerListViewComponent from '../case-manager-list';

// ----------------------------------------------------------------------

export function CaseManagerListView() {
  const { t } = useTranslate('navbar');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.caseManager.heading')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('dashboard.caseManager.caseManagers') },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.caseManager.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('dashboard.caseManager.addCaseManager')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <CaseManagerListViewComponent />
    </DashboardContent>
  );
}
