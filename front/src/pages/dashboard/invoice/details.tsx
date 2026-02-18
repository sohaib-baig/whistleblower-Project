import type { IInvoice } from 'src/types/invoice';

import { useState, useEffect } from 'react';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';
import { fetchInvoice } from 'src/actions/invoice';

import { toast } from 'src/components/snackbar';
import { LoadingScreen } from 'src/components/loading-screen';

import { InvoiceDetailsView } from 'src/sections/invoice/view';

// ----------------------------------------------------------------------

const metadata = { title: `Invoice details | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id = '' } = useParams();
  const [invoice, setInvoice] = useState<IInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvoice = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchInvoice(id);
        setInvoice(data);
      } catch (error: any) {
        console.error('Error loading invoice:', error);
        toast.error(error?.message || 'Failed to load invoice');
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [id]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <title>{metadata.title}</title>

      <InvoiceDetailsView invoice={invoice || undefined} />
    </>
  );
}
