import { CONFIG } from 'src/global-config';

import { TermsConditionsEditView } from 'src/sections/terms-conditions/view';

// ----------------------------------------------------------------------

const metadata = { title: `Edit Terms & Conditions | Dashboard - ${CONFIG.appName}` };

export default function TermsConditionsEditPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <TermsConditionsEditView />
    </>
  );
}
