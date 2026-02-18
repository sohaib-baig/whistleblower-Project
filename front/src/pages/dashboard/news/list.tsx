import { CONFIG } from 'src/global-config';

import { NewsListView } from 'src/sections/news/view';

// ----------------------------------------------------------------------

const metadata = { title: `News list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <NewsListView />
    </>
  );
}
