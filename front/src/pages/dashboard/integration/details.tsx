import { useParams } from 'src/routes/hooks';

import { _integrationItems } from 'src/_mock';

import { IntegrationDetailsView } from 'src/sections/integration/view';

// ----------------------------------------------------------------------

export default function Page() {
  const params = useParams();

  const { id } = params;

  const integration = _integrationItems.find((item) => item.id === id);

  return <IntegrationDetailsView integration={integration} />;
}
