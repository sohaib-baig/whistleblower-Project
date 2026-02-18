import type { IIntegrationItem } from 'src/types/integration';

import { orderBy } from 'es-toolkit';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { _integrationItems, INTEGRATION_SORT_OPTIONS } from 'src/_mock';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { IntegrationList } from '../integration-list';
import { IntegrationSort } from '../integration-sort';
import { IntegrationSearch } from '../integration-search';

// ----------------------------------------------------------------------

export function IntegrationListView() {
  const [sortBy, setSortBy] = useState('latest');
  const [integrations, setIntegrations] = useState(_integrationItems);

  const dataFiltered = applySort({
    inputData: integrations,
    sortBy,
  });

  const handleSortBy = useCallback((newValue: string) => {
    setSortBy(newValue);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setIntegrations((prev) => prev.filter((integration) => integration.id !== id));
    toast.success('Integration deleted successfully!');
  }, []);

  const renderFilters = () => (
    <Box
      sx={{
        gap: 3,
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-end', sm: 'center' },
      }}
    >
      <IntegrationSearch redirectPath={(id: string) => paths.dashboard.integration.details(id)} />

      <Box sx={{ gap: 1, flexShrink: 0, display: 'flex' }}>
        <IntegrationSort
          sort={sortBy}
          onSort={handleSortBy}
          sortOptions={INTEGRATION_SORT_OPTIONS}
        />
      </Box>
    </Box>
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Integrations"
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: 'Integration', href: paths.dashboard.integration.root },
          { name: 'List' },
        ]}
        // action={
        //   <Button
        //     component={RouterLink}
        //     href={paths.dashboard.integration.new}
        //     variant="contained"
        //     startIcon={<Iconify icon="mingcute:add-line" />}
        //   >
        //     Add Integration
        //   </Button>
        // }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={2.5} sx={{ mb: { xs: 3, md: 5 } }}>
        {renderFilters()}
      </Stack>

      <IntegrationList integrations={dataFiltered} onDelete={handleDelete} />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

type ApplySortProps = {
  sortBy: string;
  inputData: IIntegrationItem[];
};

function applySort({ inputData, sortBy }: ApplySortProps) {
  // Sort by
  if (sortBy === 'latest') {
    inputData = orderBy(inputData, ['createdAt'], ['desc']);
  }

  if (sortBy === 'oldest') {
    inputData = orderBy(inputData, ['createdAt'], ['asc']);
  }

  if (sortBy === 'name-asc') {
    inputData = orderBy(inputData, ['name'], ['asc']);
  }

  if (sortBy === 'name-desc') {
    inputData = orderBy(inputData, ['name'], ['desc']);
  }

  if (sortBy === 'status') {
    inputData = orderBy(inputData, ['status'], ['asc']);
  }

  return inputData;
}
