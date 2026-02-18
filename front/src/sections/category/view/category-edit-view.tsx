import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useGetCategory } from 'src/actions/category';
import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CategoryCreateEditForm } from '../category-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function CategoryEditView({ id }: Props) {
  const { t } = useTranslate('navbar');
  const { category, loading, error } = useGetCategory(id);

  if (loading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  if (error || !category) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('dashboard.category.editCategory')}
          links={[
            { name: 'Dashboard', href: paths.dashboard.overview.analytics },
            { name: t('dashboard.category.heading'), href: paths.dashboard.category.root },
            { name: t('dashboard.category.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{t('dashboard.category.categoryNotFound')}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.category.editCategory')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: t('dashboard.category.heading'), href: paths.dashboard.category.root },
          { name: t('dashboard.category.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CategoryCreateEditForm currentCategory={category} />
    </DashboardContent>
  );
}
