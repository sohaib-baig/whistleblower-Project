import { CONFIG } from 'src/global-config';

import { PaymentPageListView } from 'src/sections/payment-page/view';

// ----------------------------------------------------------------------

const metadata = { title: `Payment Page | Dashboard - ${CONFIG.appName}` };

export default function PaymentPageListPage() {
  return (
    <>
      <title>{metadata.title}</title>
      <PaymentPageListView />
    </>
  );
}


