import { CONFIG } from 'src/global-config';

import { PolicyPageListView } from 'src/sections/policy-page/view';

// ----------------------------------------------------------------------

const metadata = { title: `Policy Page | Dashboard - ${CONFIG.appName}` };

export default function PolicyPageListPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <PolicyPageListView />
    </>
  );
}

