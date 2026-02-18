import { CONFIG } from 'src/global-config';

import { NewsCreateView } from 'src/sections/news/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new news article | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <NewsCreateView />
    </>
  );
}
