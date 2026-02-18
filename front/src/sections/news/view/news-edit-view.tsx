import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { useGetNewsItem } from 'src/actions/news';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { NewsCreateEditForm } from '../news-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  newsId: string;
};

export function NewsEditView({ newsId }: Props) {
  const { t } = useTranslate('navbar');
  const router = useRouter();
  const { news: currentNews, loading, error } = useGetNewsItem(newsId);


  if (loading) {
    return (
      <DashboardContent>
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}
        >
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (error || !currentNews) {
    return (
      <DashboardContent>
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ color: 'error.main', mb: 2 }}>
            <Iconify icon="solar:danger-bold" width={48} />
          </Box>
          <Box sx={{ typography: 'h6', mb: 1 }}>{t('dashboard.news.newsNotFound')}</Box>
          <Box sx={{ typography: 'body2', color: 'text.secondary', mb: 2 }}>
            {error || t('dashboard.news.newsNotFoundMessage')}
          </Box>
          <Button variant="contained" onClick={() => router.push(paths.dashboard.news.list)}>
            {t('dashboard.news.backToList')}
          </Button>
        </Card>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.news.edit')}
        backHref={paths.dashboard.news.root}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('dashboard.news.heading'), href: paths.dashboard.news.root },
          { name: currentNews.title },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <NewsCreateEditForm currentNews={currentNews} />
    </DashboardContent>
  );
}
