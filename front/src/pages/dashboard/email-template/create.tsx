import { CONFIG } from 'src/global-config';

import { EmailTemplateCreateView } from 'src/sections/email-template/view';

const metadata = { title: `Create Email Template | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>
      <EmailTemplateCreateView />
    </>
  );
}
