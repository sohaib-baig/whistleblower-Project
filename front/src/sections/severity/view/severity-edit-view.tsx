import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useGetSeverity } from 'src/actions/severity';
import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SeverityCreateEditForm } from '../severity-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function SeverityEditView({ id }: Props) {
  const { t } = useTranslate('navbar');
  const { severity, loading, error } = useGetSeverity(id);

  if (loading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  if (error || !severity) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('dashboard.severity.editSeverity')}
          links={[
            { name: 'Dashboard', href: paths.dashboard.overview.analytics },
            { name: t('dashboard.severity.heading'), href: paths.dashboard.severity.root },
            { name: t('dashboard.severity.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{t('dashboard.severity.severityNotFound')}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.severity.editSeverity')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: t('dashboard.severity.heading'), href: paths.dashboard.severity.root },
          { name: t('dashboard.severity.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <SeverityCreateEditForm currentSeverity={severity} />
    </DashboardContent>
  );
}
