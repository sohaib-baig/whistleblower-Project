import { CONFIG } from 'src/global-config';

import { SupportEditView } from 'src/sections/support/view';

// ----------------------------------------------------------------------

const metadata = { title: `Edit Support | Dashboard - ${CONFIG.appName}` };

export default function SupportEditPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <SupportEditView />
    </>
  );
}
