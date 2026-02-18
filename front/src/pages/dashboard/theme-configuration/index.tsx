import { CONFIG } from 'src/global-config';

import { ThemeConfigurationView } from 'src/sections/theme-configuration/view';

const metadata = { title: `Theme Configuration | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <ThemeConfigurationView />;
}

export { metadata };
