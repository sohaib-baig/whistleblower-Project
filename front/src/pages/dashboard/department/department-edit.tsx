import { useParams } from 'src/routes/hooks';

import { DepartmentEditView } from 'src/sections/department/view';

export default function Page() {
  const { id } = useParams();

  return <DepartmentEditView id={id || ''} />;
}
