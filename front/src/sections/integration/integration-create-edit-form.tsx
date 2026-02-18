import type { IIntegrationItem } from 'src/types/integration';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type IntegrationCreateSchemaType = z.infer<typeof IntegrationCreateSchema>;

export const IntegrationCreateSchema = z.object({
  name: z.string().min(1, { error: 'Name is required!' }),
  endpoint: z.string().url({ error: 'Please enter a valid URL!' }),
  appKey: z.string().min(1, { error: 'App Key is required!' }),
  appSecret: z.string().min(1, { error: 'App Secret is required!' }),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

// ----------------------------------------------------------------------

type Props = {
  currentIntegration?: IIntegrationItem;
};

export function IntegrationCreateEditForm({ currentIntegration }: Props) {
  const router = useRouter();

  const openDetails = useBoolean(true);
  const openCredentials = useBoolean(true);
  const openStatus = useBoolean(true);

  const defaultValues: IntegrationCreateSchemaType = {
    name: '',
    endpoint: '',
    appKey: '',
    appSecret: '',
    description: '',
    isActive: true,
  };

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(IntegrationCreateSchema),
    defaultValues,
    values: currentIntegration
      ? {
          ...currentIntegration,
          isActive: currentIntegration.status === 'active',
        }
      : undefined,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Convert isActive boolean to status string
      const formData = {
        ...data,
        status: data.isActive ? 'active' : 'inactive',
      };

      reset();
      toast.success(currentIntegration ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.integration.root);
      console.info('DATA', formData);
    } catch (error) {
      console.error(error);
    }
  });

  const renderCollapseButton = (value: boolean, onToggle: () => void) => (
    <IconButton onClick={onToggle}>
      <Iconify icon={value ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'} />
    </IconButton>
  );

  const renderDetails = () => (
    <Card>
      <CardHeader
        title="Integration Details"
        subheader="Basic information about the integration"
        action={renderCollapseButton(openDetails.value, openDetails.onToggle)}
        sx={{ mb: 3 }}
      />

      <Collapse in={openDetails.value}>
        <Divider />

        <Stack spacing={3} sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Integration Name</Typography>
            <Field.Text name="name" placeholder="Ex: Salesforce CRM..." />
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Description</Typography>
            <Field.Text
              name="description"
              placeholder="Brief description of the integration..."
              multiline
              rows={3}
            />
          </Stack>
        </Stack>
      </Collapse>
    </Card>
  );

  const renderCredentials = () => (
    <Card>
      <CardHeader
        title="API Credentials"
        subheader="Configure the API endpoint and authentication details"
        action={renderCollapseButton(openCredentials.value, openCredentials.onToggle)}
        sx={{ mb: 3 }}
      />

      <Collapse in={openCredentials.value}>
        <Divider />

        <Stack spacing={3} sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">API Endpoint</Typography>
            <Field.Text
              name="endpoint"
              placeholder="https://api.example.com/v1"
              helperText="The base URL for the API endpoint"
            />
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">App Key</Typography>
            <Field.Text
              name="appKey"
              placeholder="Enter your application key"
              helperText="The API key or application identifier"
            />
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">App Secret</Typography>
            <Field.Text
              name="appSecret"
              placeholder="Enter your application secret"
              type="password"
              helperText="The secret key for authentication"
            />
          </Stack>
        </Stack>
      </Collapse>
    </Card>
  );

  const renderStatus = () => (
    <Card>
      <CardHeader
        title="Status Configuration"
        subheader="Set the integration status"
        action={renderCollapseButton(openStatus.value, openStatus.onToggle)}
        sx={{ mb: 3 }}
      />

      <Collapse in={openStatus.value}>
        <Divider />

        <Stack spacing={3} sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Integration Status</Typography>
            <Field.Switch
              name="isActive"
              label="Active"
              helperText="Toggle to activate or deactivate this integration"
            />
          </Stack>
        </Stack>
      </Collapse>
    </Card>
  );

  const renderActions = () => (
    <Stack sx={{ alignItems: 'flex-end' }}>
      <Button type="submit" variant="contained" size="large" loading={isSubmitting} sx={{ ml: 2 }}>
        {!currentIntegration ? 'Create Integration' : 'Save Changes'}
      </Button>
    </Stack>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {renderDetails()}
        {renderCredentials()}
        {renderStatus()}
        {renderActions()}
      </Stack>
    </Form>
  );
}
