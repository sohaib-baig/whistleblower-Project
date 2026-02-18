import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';

import CaseDetailsTab from 'src/sections/case-details/tabs/case-details-tab';

// ----------------------------------------------------------------------

const metadata = { title: `Case Details | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const params = useParams();
  const { id } = params;

  return (
    <>
      <title>{metadata.title}</title>

      <CaseDetailsTab caseId={id || ''} />
    </>
  );
}
