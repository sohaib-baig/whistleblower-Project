import type { IIntegrationItem } from 'src/types/integration';

import Box from '@mui/material/Box';
import Pagination, { paginationClasses } from '@mui/material/Pagination';

import { paths } from 'src/routes/paths';

import { IntegrationItem } from './integration-item';

// ----------------------------------------------------------------------

type Props = {
  integrations: IIntegrationItem[];
  onDelete: (id: string) => void;
};

export function IntegrationList({ integrations, onDelete }: Props) {
  return (
    <>
      <Box
        sx={{
          gap: 3,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        }}
      >
        {integrations.map((integration) => (
          <IntegrationItem
            key={integration.id}
            integrationItem={integration}
            editHref={paths.dashboard.integration.edit(integration.id)}
            detailsHref={paths.dashboard.integration.details(integration.id)}
            onDelete={() => onDelete(integration.id)}
          />
        ))}
      </Box>

      {integrations.length > 8 && (
        <Pagination
          count={8}
          sx={{
            mt: { xs: 8, md: 8 },
            [`& .${paginationClasses.ul}`]: { justifyContent: 'center' },
          }}
        />
      )}
    </>
  );
}
