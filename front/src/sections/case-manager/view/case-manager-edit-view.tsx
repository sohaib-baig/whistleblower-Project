import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetCaseManager } from 'src/actions/case-manager';

import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CaseManagerCreateEditForm } from '../case-manager-create-edit-form';

// ----------------------------------------------------------------------

export function CaseManagerEditView() {
  const { t } = useTranslate('navbar');
  const params = useParams();
  const { id } = params;

  const { caseManager, loading, error } = useGetCaseManager(id || '');

  if (loading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  if (error || !caseManager) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('dashboard.caseManager.editCaseManager')}
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            {
              name: t('dashboard.caseManager.caseManagers'),
              href: paths.dashboard.caseManager.root,
            },
            { name: t('dashboard.caseManager.edit') },
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
        <div>{t('dashboard.caseManager.caseManagerNotFound')}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.caseManager.editCaseManager')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('dashboard.caseManager.caseManagers'), href: paths.dashboard.caseManager.root },
          { name: caseManager?.name || t('dashboard.caseManager.edit') },
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
      <CaseManagerCreateEditForm currentCaseManager={caseManager} />
    </DashboardContent>
  );
}
