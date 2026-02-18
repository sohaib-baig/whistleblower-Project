import type { IIntegrationItem } from 'src/types/integration';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';

import { INTEGRATION_PUBLISH_OPTIONS } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { IntegrationDetailsToolbar } from '../integration-details-toolbar';

// ----------------------------------------------------------------------

type Props = {
  integration?: IIntegrationItem;
};

export function IntegrationDetailsView({ integration }: Props) {
  const [status, setStatus] = useState(integration?.status || 'active');
  const [isConnected, setIsConnected] = useState(integration?.status === 'active');

  const handleChangeStatus = (newStatus: string) => {
    setStatus(newStatus as 'active' | 'inactive');
  };

  const handleConnectionToggle = (connected: boolean) => {
    setIsConnected(connected);
    setStatus(connected ? 'active' : 'inactive');
  };

  const renderOverview = () => (
    <Card>
      <CardHeader title="Integration Overview" />
      <Divider />
      <Stack spacing={3} sx={{ p: 3 }}>
        <Stack direction="row" spacing={2}>
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Name
            </Typography>
          </Box>
          <Typography variant="body2">{integration?.name}</Typography>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Endpoint
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            {integration?.endpoint}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="subtitle2" color="text.secondary">
              App Key
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {integration?.appKey}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="subtitle2" color="text.secondary">
              App Secret
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {integration?.appSecret}
          </Typography>
        </Stack>

        {integration?.description && (
          <Stack direction="row" spacing={2}>
            <Box sx={{ minWidth: 120 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Description
              </Typography>
            </Box>
            <Typography variant="body2">{integration.description}</Typography>
          </Stack>
        )}

        <Stack direction="row" spacing={2}>
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            color={status === 'active' ? 'success' : 'inherit'}
            startIcon={
              <Iconify
                icon={status === 'active' ? 'eva:checkmark-fill' : 'eva:cloud-upload-fill'}
              />
            }
          >
            {status}
          </Button>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Created
            </Typography>
          </Box>
          <Typography variant="body2">{integration?.createdAt}</Typography>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Last Updated
            </Typography>
          </Box>
          <Typography variant="body2">{integration?.updatedAt}</Typography>
        </Stack>

        {integration?.lastSyncAt && (
          <Stack direction="row" spacing={2}>
            <Box sx={{ minWidth: 120 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Last Sync
              </Typography>
            </Box>
            <Typography variant="body2">{integration.lastSyncAt}</Typography>
          </Stack>
        )}
      </Stack>
    </Card>
  );

  const renderConnectionControl = () => (
    <Card>
      <CardHeader title="Connection Control" />
      <Divider />
      <Stack spacing={3} sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Connection Status
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={isConnected}
                onChange={(e) => handleConnectionToggle(e.target.checked)}
                color="success"
              />
            }
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Iconify
                  icon={isConnected ? 'eva:checkmark-fill' : 'eva:cloud-upload-fill'}
                  color={isConnected ? 'success.main' : 'error.main'}
                />
                <Typography variant="body2" color={isConnected ? 'success.main' : 'error.main'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Typography>
              </Stack>
            }
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Endpoint Status
            </Typography>
          </Box>
          <Typography
            variant="body2"
            color={isConnected ? 'success.main' : 'text.secondary'}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Iconify
              icon={isConnected ? 'eva:checkmark-fill' : 'eva:cloud-upload-fill'}
              color={isConnected ? 'success.main' : 'error.main'}
            />
            {isConnected ? 'Endpoint is reachable' : 'Endpoint is unreachable'}
          </Typography>
        </Stack>

        {isConnected && (
          <Stack direction="row" spacing={2}>
            <Box sx={{ minWidth: 120 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Last Connection
              </Typography>
            </Box>
            <Typography variant="body2">{integration?.lastSyncAt || 'Never connected'}</Typography>
          </Stack>
        )}
      </Stack>
    </Card>
  );

  const renderStats = () => (
    <Card>
      <CardHeader title="Integration Statistics" />
      <Divider />
      <Stack spacing={3} sx={{ p: 3 }}>
        <Stack direction="row" spacing={2}>
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total Requests
            </Typography>
          </Box>
          <Typography variant="body2">{integration?.totalRequests || 0}</Typography>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Success Rate
            </Typography>
          </Box>
          <Typography variant="body2">{integration?.successRate || 0}%</Typography>
        </Stack>
      </Stack>
    </Card>
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={integration?.name || 'Integration Details'}
        backHref={paths.dashboard.integration.root}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: 'Integration', href: paths.dashboard.integration.root },
          { name: integration?.name || 'Details' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <IntegrationDetailsToolbar
        backHref={paths.dashboard.integration.root}
        editHref={paths.dashboard.integration.edit(integration?.id || '')}
        liveHref={integration?.endpoint || ''}
        status={status}
        onChangeStatus={handleChangeStatus}
        statusOptions={INTEGRATION_PUBLISH_OPTIONS}
      />

      <Stack spacing={3}>
        {renderOverview()}
        {renderConnectionControl()}
        {renderStats()}
      </Stack>
    </DashboardContent>
  );
}
