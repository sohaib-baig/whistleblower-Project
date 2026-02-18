import { CONFIG } from 'src/global-config';

import { PrivacyPolicyListView } from 'src/sections/privacy-policy/view';

// ----------------------------------------------------------------------

const metadata = { title: `Privacy Policy | Dashboard - ${CONFIG.appName}` };

export default function PrivacyPolicyListPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <PrivacyPolicyListView />
    </>
  );
}
