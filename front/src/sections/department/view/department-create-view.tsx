import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DepartmentCreateEditForm } from '../department-create-edit-form';

// ----------------------------------------------------------------------

export function DepartmentCreateView() {
  const { t } = useTranslate('navbar');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.department.createNewDepartment')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: t('dashboard.department.heading'), href: paths.dashboard.department.root },
          { name: t('dashboard.department.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <DepartmentCreateEditForm />
    </DashboardContent>
  );
}
