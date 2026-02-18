import { CONFIG } from 'src/global-config';

import { SupportListView } from 'src/sections/support/view';

// ----------------------------------------------------------------------

const metadata = { title: `Support | Dashboard - ${CONFIG.appName}` };

export default function SupportListPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <SupportListView />
    </>
  );
}
