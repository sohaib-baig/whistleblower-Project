import type { INewsItem } from 'src/types/news';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { NewsItemSkeleton } from './news-skeleton';
import { NewsItem, NewsItemLatest } from './news-item';

// ----------------------------------------------------------------------

type Props = {
  news: INewsItem[];
  loading?: boolean;
};

export function NewsList({ news, loading }: Props) {
  const renderLoading = () => (
    <Box
      sx={{
        gap: 3,
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
      }}
    >
      <NewsItemSkeleton />
    </Box>
  );

  const renderList = () => (
    <Grid container spacing={3}>
      {news.slice(0, 3).map((newsItem, index) => (
        <Grid
          key={newsItem.id}
          sx={{ display: { xs: 'none', lg: 'block' } }}
          size={{
            xs: 12,
            sm: 6,
            md: 4,
            lg: index === 0 ? 6 : 3,
          }}
        >
          <NewsItemLatest
            news={newsItem}
            index={index}
            detailsHref={paths.dashboard.news.details(newsItem.title)}
          />
        </Grid>
      ))}

      {news.slice(0, 3).map((newsItem) => (
        <Grid
          key={newsItem.id}
          sx={{ display: { lg: 'none' } }}
          size={{
            xs: 12,
            sm: 6,
            md: 4,
            lg: 3,
          }}
        >
          <NewsItem news={newsItem} detailsHref={paths.dashboard.news.details(newsItem.title)} />
        </Grid>
      ))}

      {news.slice(3, news.length).map((newsItem) => (
        <Grid
          key={newsItem.id}
          size={{
            xs: 12,
            sm: 6,
            md: 4,
            lg: 3,
          }}
        >
          <NewsItem news={newsItem} detailsHref={paths.dashboard.news.details(newsItem.title)} />
        </Grid>
      ))}
    </Grid>
  );

  return (
    <>
      {loading ? renderLoading() : renderList()}

      {news.length > 8 && (
        <Stack sx={{ mt: 8, alignItems: 'center' }}>
          <Button
            size="large"
            variant="outlined"
            startIcon={<CircularProgress size={18} color="inherit" />}
          >
            Load more
          </Button>
        </Stack>
      )}
    </>
  );
}
