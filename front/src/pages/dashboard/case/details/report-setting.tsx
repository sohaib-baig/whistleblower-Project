import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';

import ReportSettingTab from 'src/sections/case-details/tabs/report-setting-tab';

// ----------------------------------------------------------------------

const metadata = { title: `Report Setting | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const params = useParams();
  const { id } = params;

  return (
    <>
      <title>{metadata.title}</title>

      <ReportSettingTab caseId={id || ''} />
    </>
  );
}
