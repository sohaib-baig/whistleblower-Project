import { CONFIG } from 'src/global-config';

import { SignupView } from 'src/sections/auth/sign-up-view';

// ----------------------------------------------------------------------

const metadata = { title: `Sign Up - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <SignupView />
    </>
  );
}
