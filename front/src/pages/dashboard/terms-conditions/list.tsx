import { CONFIG } from 'src/global-config';

import { TermsConditionsListView } from 'src/sections/terms-conditions/view';

// ----------------------------------------------------------------------

const metadata = { title: `Terms & Conditions | Dashboard - ${CONFIG.appName}` };

export default function TermsConditionsListPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <TermsConditionsListView />
    </>
  );
}
