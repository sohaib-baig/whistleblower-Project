import { useParams } from 'src/routes/hooks';

import { StateEditView } from 'src/sections/state/view';

export default function Page() {
  const { id } = useParams();

  return <StateEditView id={id || ''} />;
}
