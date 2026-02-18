import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';

import DocumentsTab from 'src/sections/case-details/tabs/documents-tab';

// ----------------------------------------------------------------------

const metadata = { title: `Case Documents | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const params = useParams();
  const { id } = params;

  return (
    <>
      <title>{metadata.title}</title>

      <DocumentsTab caseId={id || ''} />
    </>
  );
}
