import { CONFIG } from 'src/global-config';

import { PrivacyPolicyEditView } from 'src/sections/privacy-policy/view';

// ----------------------------------------------------------------------

const metadata = { title: `Edit Privacy Policy | Dashboard - ${CONFIG.appName}` };

export default function PrivacyPolicyEditPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <PrivacyPolicyEditView />
    </>
  );
}
