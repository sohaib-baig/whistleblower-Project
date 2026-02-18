import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CaseManagerCreateEditForm } from '../case-manager-create-edit-form';

// ----------------------------------------------------------------------

export function CaseManagerCreateView() {
  const { t } = useTranslate('navbar');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.caseManager.createNewCaseManager')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('dashboard.caseManager.caseManagers'), href: paths.dashboard.caseManager.root },
          { name: t('dashboard.caseManager.create') },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.caseManager.root}
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          >
            {t('dashboard.caseManager.back')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <CaseManagerCreateEditForm />
    </DashboardContent>
  );
}
