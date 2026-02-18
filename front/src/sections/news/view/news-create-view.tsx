import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { NewsCreateEditForm } from '../news-create-edit-form';

// ----------------------------------------------------------------------

export function NewsCreateView() {
  const { t } = useTranslate('navbar');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.news.createNewNews')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('dashboard.news.heading'), href: paths.dashboard.news.root },
          { name: t('dashboard.news.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <NewsCreateEditForm />
    </DashboardContent>
  );
}
