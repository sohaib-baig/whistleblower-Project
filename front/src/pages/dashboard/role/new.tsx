import { CONFIG } from 'src/global-config';

import { RoleCreateView } from 'src/sections/role/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new role | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <RoleCreateView />
    </>
  );
}
