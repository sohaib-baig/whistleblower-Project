import { useParams } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SupportTicketDetailsView as SupportTicketDetailsViewComponent } from '../support-ticket-details';

export function SupportTicketDetailsView() {
  const { id } = useParams();

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`Support Ticket #${id?.slice(-8)}`}
        links={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Support Tickets', href: '/dashboard/support-tickets' },
          { name: `Ticket #${id?.slice(-8)}` },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <SupportTicketDetailsViewComponent />
    </DashboardContent>
  );
}