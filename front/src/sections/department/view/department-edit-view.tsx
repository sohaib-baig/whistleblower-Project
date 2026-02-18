import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetDepartment } from 'src/actions/department';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DepartmentCreateEditForm } from '../department-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function DepartmentEditView({ id }: Props) {
  const { t } = useTranslate('navbar');
  const { department, loading, error } = useGetDepartment(id);

  if (loading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  if (error || !department) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('dashboard.department.editDepartment')}
          links={[
            { name: 'Dashboard', href: paths.dashboard.overview.analytics },
            { name: t('dashboard.department.heading'), href: paths.dashboard.department.root },
            { name: t('dashboard.department.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{t('dashboard.department.departmentNotFound')}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.department.editDepartment')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: t('dashboard.department.heading'), href: paths.dashboard.department.root },
          { name: t('dashboard.department.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <DepartmentCreateEditForm currentDepartment={department} />
    </DashboardContent>
  );
}
