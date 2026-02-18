import type { INewsItem } from 'src/types/news';

import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';

import { NewsItemSkeleton } from './news-skeleton';
import { NewsItemHorizontal } from './news-item-horizontal';

// ----------------------------------------------------------------------

type Props = {
  news: INewsItem[];
  loading?: boolean;
  onDelete?: (id: string) => void;
  canManage?: (item: INewsItem) => boolean;
};

export function NewsListHorizontal({ news, loading, onDelete, canManage }: Props) {
  const renderLoading = () => <NewsItemSkeleton variant="horizontal" />;

  const renderList = () =>
    news.map((newsItem) => {
      const manageable = canManage ? canManage(newsItem) : true;
      return (
        <NewsItemHorizontal
          key={newsItem.id}
          news={newsItem}
          detailsHref={paths.dashboard.news.details(newsItem.id)}
          editHref={paths.dashboard.news.edit(newsItem.id)}
          onDelete={manageable && onDelete ? () => onDelete(newsItem.id) : undefined}
          canManage={manageable}
        />
      );
    });

  return (
    <Box
      sx={{
        gap: 3,
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
      }}
    >
      {loading ? renderLoading() : renderList()}
    </Box>
  );
}
