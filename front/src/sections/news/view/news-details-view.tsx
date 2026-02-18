import type { INewsItem } from 'src/types/news';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { NEWS_PUBLISH_OPTIONS } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Markdown } from 'src/components/markdown';
import { EmptyContent } from 'src/components/empty-content';

import { NewsDetailsSkeleton } from '../news-skeleton';
import { NewsDetailsHero } from '../news-details-hero';
import { NewsDetailsToolbar } from '../news-details-toolbar';

// ----------------------------------------------------------------------

type Props = {
  news?: INewsItem;
  loading?: boolean;
  error?: any;
};

export function NewsDetailsView({ news, loading, error }: Props) {
  const { t } = useTranslate('navbar');
  const [publish, setPublish] = useState('');

  const handleChangePublish = useCallback((newValue: string) => {
    setPublish(newValue);
  }, []);

  useEffect(() => {
    if (news) {
      setPublish(news.publish);
    }
  }, [news]);

  if (loading) {
    return (
      <DashboardContent maxWidth={false} disablePadding>
        <NewsDetailsSkeleton />
      </DashboardContent>
    );
  }

  if (error || !news) {
    return (
      <DashboardContent maxWidth={false}>
        <EmptyContent
          filled
          title={t('dashboard.news.emptyState.notFound')}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.news.root}
              startIcon={<Iconify width={16} icon="eva:arrow-ios-back-fill" />}
              sx={{ mt: 3 }}
            >
              {t('dashboard.news.emptyState.backToList')}
            </Button>
          }
          sx={{ py: 10, height: 'auto', flexGrow: 'unset' }}
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth={false} disablePadding>
      <Container maxWidth={false} sx={{ px: { sm: 5 } }}>
        <NewsDetailsToolbar
          backHref={paths.dashboard.news.root}
          editHref={paths.dashboard.news.edit(news.id)}
          liveHref={paths.dashboard.news.details(news.id)}
          publish={`${publish}`}
          onChangePublish={handleChangePublish}
          publishOptions={NEWS_PUBLISH_OPTIONS}
        />
      </Container>

      <NewsDetailsHero title={news.title} coverUrl={news.coverUrl} />

      <Box
        sx={{
          pb: 5,
          mx: 'auto',
          maxWidth: 720,
          mt: { xs: 5, md: 10 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Typography variant="subtitle1">{news.description}</Typography>

        <Markdown children={news.content} />

        <Stack
          spacing={3}
          sx={[
            (theme) => ({
              py: 3,
              borderTop: `dashed 1px ${theme.vars.palette.divider}`,
              borderBottom: `dashed 1px ${theme.vars.palette.divider}`,
            }),
          ]}
        >
          <Box sx={{ gap: 1, display: 'flex', flexWrap: 'wrap' }}>
            {news.tags.map((tag) => (
              <Chip key={tag} label={tag} variant="soft" />
            ))}
          </Box>
        </Stack>
      </Box>
    </DashboardContent>
  );
}
