import { useParams } from 'src/routes/hooks';

import { _roleItems } from 'src/_mock';
import { CONFIG } from 'src/global-config';

import { RoleEditView } from 'src/sections/role/view';

// ----------------------------------------------------------------------

const metadata = { title: `Role edit | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id = '' } = useParams();

  const currentRole = _roleItems.find((role) => role.id === id);

  return (
    <>
      <title>{metadata.title}</title>

      <RoleEditView role={currentRole} />
    </>
  );
}
