import { CONFIG } from 'src/global-config';

import { AboutUsEditView } from 'src/sections/about-us/view';

// ----------------------------------------------------------------------

const metadata = { title: `Edit About Us | Dashboard - ${CONFIG.appName}` };

export default function AboutUsEditPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <AboutUsEditView />
    </>
  );
}
