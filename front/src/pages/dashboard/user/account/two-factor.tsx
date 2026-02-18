import { CONFIG } from 'src/global-config';

import { AccountTwoFactorView } from 'src/sections/account/view';

// ----------------------------------------------------------------------

const metadata = { title: `Account two-factor authentication | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AccountTwoFactorView />
    </>
  );
}











