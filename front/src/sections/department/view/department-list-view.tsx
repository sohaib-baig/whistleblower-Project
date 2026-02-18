import { DashboardContent } from 'src/layouts/dashboard';

import DepartmentListView from '../department-list';

// ----------------------------------------------------------------------

export function DepartmentListPage() {
  return (
    <DashboardContent>
      <DepartmentListView />
    </DashboardContent>
  );
}
