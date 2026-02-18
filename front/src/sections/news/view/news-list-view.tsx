import type { INewsItem, INewsFilters } from 'src/types/news';

import { useCallback } from 'react';
import { orderBy } from 'es-toolkit';
import { useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { deleteNews, useGetNews } from 'src/actions/news';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { NewsSearch } from '../news-search';
import { NewsListHorizontal } from '../news-list-horizontal';

// ----------------------------------------------------------------------

const PUBLISH_OPTIONS = ['all', 'published', 'draft'] as const;

// ----------------------------------------------------------------------

export function NewsListView() {
  const { t } = useTranslate('navbar');
  const { state, setState } = useSetState<INewsFilters>({ publish: 'all' });
  const { user } = useAuthContext();

  // Fetch news from API (fetch all news, filter client-side)
  const { news, loading, refetch } = useGetNews();

  const dataFiltered = applyFilter({ inputData: news, filters: state, sortBy: 'latest' });

  const userRole = (user?.role ?? '').toLowerCase();

  // Only admin users can create news
  const canCreate = userRole === 'admin';

  // Only admin users can manage (edit/delete) news
  const canManageNews = useCallback(
    (item: INewsItem) => {
      if (!user) {
        return false;
      }
      // Only admin users can manage news
      if (userRole === 'admin') {
        return true;
      }
      // Company users cannot manage any news
      return false;
    },
    [user, userRole]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteNews(id);
        toast.success(t('dashboard.news.toast.deletedSuccessfully'));
        refetch(); // Refresh the list
      } catch (err) {
        console.error('Failed to delete news:', err);
        toast.error(t('dashboard.news.toast.deleteFailed'));
      }
    },
    [refetch, t]
  );

  const handleFilterPublish = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      setState({ publish: newValue });
    },
    [setState]
  );

  const getTabLabel = (tab: string) => {
    if (tab === 'all') return t('dashboard.news.tabs.all');
    if (tab === 'published') return t('dashboard.news.tabs.published');
    if (tab === 'draft') return t('dashboard.news.tabs.draft');
    return tab;
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.news.list')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('dashboard.news.heading'), href: paths.dashboard.news.root },
          { name: t('dashboard.news.list') },
        ]}
        action={
          canCreate ? (
            <Button
              component={RouterLink}
              href={paths.dashboard.news.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('dashboard.news.addNews')}
            </Button>
          ) : undefined
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Box sx={{ mb: { xs: 3, md: 5 } }}>
        <NewsSearch
          redirectPath={(id: string) => paths.dashboard.news.details(id)}
          sx={{ width: '100%', maxWidth: { xs: '100%', sm: 400 } }}
        />
      </Box>

      {/* Only show tabs for admin users */}
      {userRole === 'admin' && (
        <Tabs value={state.publish} onChange={handleFilterPublish} sx={{ mb: { xs: 3, md: 5 } }}>
          {PUBLISH_OPTIONS.map((tab) => (
            <Tab
              key={tab}
              iconPosition="end"
              value={tab}
              label={getTabLabel(tab)}
              icon={
                <Label
                  variant={((tab === 'all' || tab === state.publish) && 'filled') || 'soft'}
                  color={(tab === 'published' && 'info') || 'default'}
                >
                  {tab === 'all' && news.length}
                  {tab === 'published' &&
                    news.filter((newsItem: any) => newsItem.publish === 'published').length}
                  {tab === 'draft' &&
                    news.filter((newsItem: any) => newsItem.publish === 'draft').length}
                </Label>
              }
              sx={{ textTransform: 'capitalize' }}
            />
          ))}
        </Tabs>
      )}

      <NewsListHorizontal
        news={dataFiltered}
        loading={loading}
        onDelete={canCreate ? handleDelete : undefined}
        canManage={canManageNews}
      />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: INewsItem[];
  filters: INewsFilters;
  sortBy: string;
};

function applyFilter({ inputData, filters, sortBy }: ApplyFilterProps) {
  const { publish } = filters;

  if (sortBy === 'latest') {
    inputData = orderBy(inputData, ['createdAt'], ['desc']);
  }

  if (sortBy === 'oldest') {
    inputData = orderBy(inputData, ['createdAt'], ['asc']);
  }

  if (sortBy === 'popular') {
    inputData = orderBy(inputData, ['totalViews'], ['desc']);
  }

  if (publish !== 'all') {
    inputData = inputData.filter((news) => news.publish === publish);
  }

  return inputData;
}
