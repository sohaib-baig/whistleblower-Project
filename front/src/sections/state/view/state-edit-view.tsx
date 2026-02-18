import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useGetState } from 'src/actions/state';
import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { StateCreateEditForm } from '../state-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function StateEditView({ id }: Props) {
  const { t } = useTranslate('navbar');
  const { state, loading, error } = useGetState(id);

  if (loading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  if (error || !state) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('dashboard.state.editState')}
          links={[
            { name: 'Dashboard', href: paths.dashboard.overview.analytics },
            { name: t('dashboard.state.heading'), href: paths.dashboard.state.root },
            { name: t('dashboard.state.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{t('dashboard.state.stateNotFound')}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.state.editState')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: t('dashboard.state.heading'), href: paths.dashboard.state.root },
          { name: t('dashboard.state.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <StateCreateEditForm currentState={state} />
    </DashboardContent>
  );
}
