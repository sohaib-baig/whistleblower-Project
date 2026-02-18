import { CONFIG } from 'src/global-config';

import { PolicyPageEditView } from 'src/sections/policy-page/view';

// ----------------------------------------------------------------------

const metadata = { title: `Edit Policy Page | Dashboard - ${CONFIG.appName}` };

export default function PolicyPageEditPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <PolicyPageEditView />
    </>
  );
}

