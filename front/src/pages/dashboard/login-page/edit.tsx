import { CONFIG } from 'src/global-config';

import { LoginPageEditView } from 'src/sections/login-page/view';

// ----------------------------------------------------------------------

const metadata = { title: `Edit Login Page | Dashboard - ${CONFIG.appName}` };

export default function LoginPageEditPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <LoginPageEditView />
    </>
  );
}
