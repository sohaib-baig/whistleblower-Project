import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';

import LegalSupportTab from 'src/sections/case-details/tabs/legal-support-tab';

const metadata = { title: `Legal Support | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const params = useParams();
  const { id } = params;

  return (
    <>
      <title>{metadata.title}</title>

      <LegalSupportTab caseId={id || ''} />
    </>
  );
}
