import { useParams } from 'react-router';

import { CONFIG } from 'src/global-config';
import { useGetNewsItem } from 'src/actions/news';

import { NewsDetailsView } from 'src/sections/news/view';

// ----------------------------------------------------------------------

const metadata = { title: `News details | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id = '' } = useParams();

  const {
    news: newsItem,
    loading: newsItemLoading,
    error: newsItemError,
  } = useGetNewsItem(id || '');

  return (
    <>
      <title>{metadata.title}</title>

      <NewsDetailsView
        news={newsItem || undefined}
        loading={newsItemLoading}
        error={newsItemError}
      />
    </>
  );
}
