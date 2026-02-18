import { CONFIG } from 'src/global-config';

import { AboutUsListView } from 'src/sections/about-us/view';

// ----------------------------------------------------------------------

const metadata = { title: `About Us | Dashboard - ${CONFIG.appName}` };

export default function AboutUsListPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <AboutUsListView />
    </>
  );
}
