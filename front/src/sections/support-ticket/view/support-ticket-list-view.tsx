import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { SupportTicketListView as SupportTicketListViewComponent } from '../support-ticket-list';

export function SupportTicketListView() {
  const { user } = useAuthContext();
  const isAdmin = user?.role?.toLowerCase?.() === 'admin';

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Support Tickets"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'sidebar.supportTickets', href: paths.dashboard.supportTicket.root },
        ]}
        action={
          isAdmin
            ? null
            : (
              <Button
                component={RouterLink}
                href={paths.dashboard.supportTicket.new}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                Create Support Ticket
              </Button>
            )
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <SupportTicketListViewComponent />
    </DashboardContent>
  );
}