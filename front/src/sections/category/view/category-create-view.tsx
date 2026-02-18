import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CategoryCreateEditForm } from '../category-create-edit-form';

// ----------------------------------------------------------------------

export function CategoryCreateView() {
  const { t } = useTranslate('navbar');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.category.createNewCategory')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: t('dashboard.category.heading'), href: paths.dashboard.category.root },
          { name: t('dashboard.category.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CategoryCreateEditForm />
    </DashboardContent>
  );
}
