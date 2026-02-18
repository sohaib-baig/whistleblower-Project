import { DashboardContent } from 'src/layouts/dashboard';

import SeverityListView from '../severity-list';

// ----------------------------------------------------------------------

export function SeverityListPage() {
  return (
    <DashboardContent>
      <SeverityListView />
    </DashboardContent>
  );
}
