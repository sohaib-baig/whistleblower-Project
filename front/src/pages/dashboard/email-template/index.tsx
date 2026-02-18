import { CONFIG } from 'src/global-config';

import { EmailTemplateListView } from 'src/sections/email-template/view';

const metadata = { title: `Email Templates | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <EmailTemplateListView />
    </>
  );
}
