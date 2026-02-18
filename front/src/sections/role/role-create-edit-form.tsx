import type { IRoleItem } from 'src/types/role';

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

import { ROLE_MODULES, ROLE_PERMISSIONS } from 'src/_mock';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { RolePermissionList } from './role-permission-list';

// ----------------------------------------------------------------------

export type RoleCreateSchemaType = z.infer<typeof RoleCreateSchema>;

export const RoleCreateSchema = z.object({
  title: z.string().min(1, { error: 'Title is required!' }),
  content: schemaUtils.editor().min(100, { error: 'Content must be at least 100 characters' }),
  permissions: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        permissions: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            checked: z.boolean(),
          })
        ),
      })
    )
    .min(1, { error: 'At least one permission is required!' }),
});

// ----------------------------------------------------------------------

type Props = {
  currentRole?: IRoleItem;
};

export function RoleCreateEditForm({ currentRole }: Props) {
  const router = useRouter();

  const openDetails = useBoolean(true);
  const openProperties = useBoolean(true);

  const defaultValues: RoleCreateSchemaType = {
    title: '',
    content: '',
    permissions: ROLE_MODULES.map((module) => ({
      id: module.id,
      name: module.name,
      permissions:
        module.id === 'dashboard'
          ? [ROLE_PERMISSIONS[0]].map((permission) => ({
              id: permission.id,
              name: permission.name,
              checked: false,
            }))
          : ROLE_PERMISSIONS.slice(0, 4).map((permission) => ({
              id: permission.id,
              name: permission.name,
              checked: false,
            })),
    })),
  };

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(RoleCreateSchema),
    defaultValues,
    values: currentRole,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      reset();
      toast.success(currentRole ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.role.root);
      console.info('DATA', data);
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
        title="Details"
        subheader="Title, short description, image..."
        action={renderCollapseButton(openDetails.value, openDetails.onToggle)}
        sx={{ mb: 3 }}
      />

      <Collapse in={openDetails.value}>
        <Divider />

        <Stack spacing={3} sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Title</Typography>
            <Field.Text name="title" placeholder="Ex: Software engineer..." />
          </Stack>
        </Stack>
      </Collapse>
    </Card>
  );

  const renderPermissions = () => (
    <Card>
      <CardHeader
        title="Permissions"
        subheader="Set module permissions for this role..."
        action={renderCollapseButton(openProperties.value, openProperties.onToggle)}
        sx={{ mb: 3 }}
      />

      <Collapse in={openProperties.value}>
        <Divider />

        {/* <Box sx={{ p: 3 }}> */}
        <RolePermissionList
          modules={methods.watch('permissions')}
          onPermissionChange={(moduleId, permissionId, checked) => {
            const currentPermissions = methods.getValues('permissions');
            const updatedPermissions = currentPermissions.map((module) => {
              if (module.id === moduleId) {
                return {
                  ...module,
                  permissions: module.permissions.map((permission) =>
                    permission.id === permissionId ? { ...permission, checked } : permission
                  ),
                };
              }
              return module;
            });
            methods.setValue('permissions', updatedPermissions);
          }}
          onModuleChange={(moduleId, checked) => {
            const currentPermissions = methods.getValues('permissions');
            const updatedPermissions = currentPermissions.map((module) => {
              if (module.id === moduleId) {
                return {
                  ...module,
                  permissions: module.permissions.map((permission) => ({
                    ...permission,
                    checked,
                  })),
                };
              }
              return module;
            });
            methods.setValue('permissions', updatedPermissions);
          }}
        />
        {/* </Box> */}
      </Collapse>
    </Card>
  );

  const renderActions = () => (
    <Stack sx={{ alignItems: 'flex-end' }}>
      <Button type="submit" variant="contained" size="large" loading={isSubmitting} sx={{ ml: 2 }}>
        {!currentRole ? 'Create role' : 'Save changes'}
      </Button>
    </Stack>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {renderDetails()}
        {renderPermissions()}
        {renderActions()}
      </Stack>
    </Form>
  );
}
