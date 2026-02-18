import { CONFIG } from 'src/global-config';

import { PaymentPageEditView } from 'src/sections/payment-page/view';

// ----------------------------------------------------------------------

const metadata = { title: `Edit Payment Page | Dashboard - ${CONFIG.appName}` };

export default function PaymentPageEditPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <PaymentPageEditView />
    </>
  );
}


