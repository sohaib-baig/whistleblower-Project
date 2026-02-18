import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';

import LogsTab from 'src/sections/case-details/tabs/logs-tab';

// ----------------------------------------------------------------------

const metadata = { title: `Case Logs | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const params = useParams();
  const { id } = params;

  return (
    <>
      <title>{metadata.title}</title>

      <LogsTab caseId={id || ''} />
    </>
  );
}
