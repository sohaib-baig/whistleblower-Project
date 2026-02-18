import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SupportTicketCreateView as SupportTicketCreateViewComponent } from '../support-ticket-create';

export function SupportTicketCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create Support Ticket"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Support Tickets', href: paths.dashboard.supportTicket.root },
          { name: 'Create' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <SupportTicketCreateViewComponent />
    </DashboardContent>
  );
}