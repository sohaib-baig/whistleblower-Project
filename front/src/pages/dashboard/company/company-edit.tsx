import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';

import { CompanyEditView } from 'src/sections/company/view';

// ----------------------------------------------------------------------

const metadata = { title: `Company edit | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id = '' } = useParams();

  return (
    <>
      <title>{metadata.title}</title>

      <CompanyEditView companyId={id} />
    </>
  );
}
