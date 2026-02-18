import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';

import ChatTab from 'src/sections/case-details/tabs/chat-tab';

// ----------------------------------------------------------------------

const metadata = { title: `Case Chat | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const params = useParams();
  const { id } = params;

  return (
    <>
      <title>{metadata.title}</title>

      <ChatTab caseId={id || ''} />
    </>
  );
}
