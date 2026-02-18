import { useParams } from 'src/routes/hooks';

import { SeverityEditView } from 'src/sections/severity/view';

export default function Page() {
  const { id } = useParams();

  return <SeverityEditView id={id || ''} />;
}
