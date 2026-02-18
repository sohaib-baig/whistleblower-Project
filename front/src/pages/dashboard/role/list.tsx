import { CONFIG } from 'src/global-config';

import { RoleListView } from 'src/sections/role/view';

// ----------------------------------------------------------------------

const metadata = { title: `Role list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <RoleListView />
    </>
  );
}
