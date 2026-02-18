import { CONFIG } from 'src/global-config';

import { LoginPageListView } from 'src/sections/login-page/view';

// ----------------------------------------------------------------------

const metadata = { title: `Login Page | Dashboard - ${CONFIG.appName}` };

export default function LoginPageListPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <LoginPageListView />
    </>
  );
}
