import { useParams } from 'react-router';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';
import { useGetNewsItem } from 'src/actions/news';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { NewsEditView } from 'src/sections/news/view';

// ----------------------------------------------------------------------

const metadata = { title: `Edit news article | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const router = useRouter();
  const { id = '' } = useParams();

  const { news: newsItem, loading, error } = useGetNewsItem(id);

  if (loading) {
    return (
      <>
        <title>{metadata.title}</title>
        <DashboardContent>
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}
          >
            <CircularProgress />
          </Box>
        </DashboardContent>
      </>
    );
  }

  if (error || !newsItem) {
    return (
      <>
        <title>{metadata.title}</title>
        <DashboardContent>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Box sx={{ color: 'error.main', mb: 2 }}>
              <Iconify icon="solar:danger-bold" width={48} />
            </Box>
            <Box sx={{ typography: 'h6', mb: 1 }}>News Not Found</Box>
            <Box sx={{ typography: 'body2', color: 'text.secondary', mb: 2 }}>
              {error || 'The news article you are looking for does not exist.'}
            </Box>
            <Button variant="contained" onClick={() => router.push(paths.dashboard.news.list)}>
              Back to List
            </Button>
          </Card>
        </DashboardContent>
      </>
    );
  }

  return (
    <>
      <title>{metadata.title}</title>

      <NewsEditView newsId={id} />
    </>
  );
}
