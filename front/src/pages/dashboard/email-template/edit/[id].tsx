import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';

import { EmailTemplateEditView } from 'src/sections/email-template/view';

const metadata = { title: `Edit Email Template | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id } = useParams();

  return (
    <>
      <title>{metadata.title}</title>
      <EmailTemplateEditView id={id || ''} />
    </>
  );
}
