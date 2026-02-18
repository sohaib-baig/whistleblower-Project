import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';

import NotesTab from 'src/sections/case-details/tabs/notes-tab';

// ----------------------------------------------------------------------

const metadata = { title: `Case Notes | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const params = useParams();
  const { id } = params;

  return (
    <>
      <title>{metadata.title}</title>

      <NotesTab caseId={id || ''} />
    </>
  );
}
