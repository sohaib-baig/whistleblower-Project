import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { changePassword } from 'src/actions/user';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

const mapServerFieldToFormField = (field: string): keyof ChangePassWordSchemaType | null => {
  if (field === 'old_password') return 'oldPassword';
  if (field === 'new_password') return 'newPassword';
  if (field === 'new_password_confirmation') return 'confirmNewPassword';
  return null;
};

// ----------------------------------------------------------------------

export type ChangePassWordSchemaType = z.infer<typeof ChangePassWordSchema>;

export const ChangePassWordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(1, { error: 'Password is required!' })
      .min(8, { error: 'Password must be at least 8 characters!' }),
    newPassword: z
      .string()
      .min(1, { error: 'New password is required!' })
      .min(8, { error: 'Password must be at least 8 characters!' })
      .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
      .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
      .regex(/[0-9]/, { message: 'Password must contain at least one digit' })
      .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one symbol' }),
    confirmNewPassword: z.string().min(1, { error: 'Confirm password is required!' }),
  })
  .refine((val) => val.oldPassword !== val.newPassword, {
    error: 'New password must be different than old password',
    path: ['newPassword'],
  })
  .refine((val) => val.newPassword === val.confirmNewPassword, {
    error: 'Passwords do not match!',
    path: ['confirmNewPassword'],
  });

// ----------------------------------------------------------------------

export function AccountChangePassword() {
  const showPassword = useBoolean();

  const defaultValues: ChangePassWordSchemaType = {
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  };

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(ChangePassWordSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
    setError,
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await changePassword({
        currentPassword: data.oldPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmNewPassword,
      });
      reset();
      toast.success('Password updated successfully');
    } catch (error: any) {
      const backendErrors = error?.response?.data?.data?.errors;

      if (backendErrors && typeof backendErrors === 'object') {
        const messagesToShow: string[] = [];
        let focusField: keyof ChangePassWordSchemaType | null = null;

        Object.entries(backendErrors).forEach(([field, messages]) => {
          const fieldMessages = Array.isArray(messages) ? messages : [messages];
          const cleanMessage = fieldMessages.find(
            (msg): msg is string => typeof msg === 'string' && msg.trim().length > 0
          );

          if (cleanMessage) {
            const mappedField = mapServerFieldToFormField(field);

            if (mappedField) {
              setError(
                mappedField,
                {
                  type: 'server',
                  message: cleanMessage,
                },
                { shouldFocus: focusField === null }
              );
              if (focusField === null) {
                focusField = mappedField;
              }
            }

            messagesToShow.push(cleanMessage);
          }
        });

        const toastMessage = messagesToShow.length
          ? messagesToShow[0]
          : 'Failed to update password';
        toast.error(toastMessage);
        return;
      }

      toast.error(
        error instanceof Error && error.message ? error.message : 'Failed to update password'
      );
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card
        sx={{
          p: 3,
          gap: 3,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Field.Text
          name="oldPassword"
          type={showPassword.value ? 'text' : 'password'}
          label="Old password"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={showPassword.onToggle} edge="end">
                    <Iconify
                      icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Field.Text
          name="newPassword"
          label="New password"
          type={showPassword.value ? 'text' : 'password'}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={showPassword.onToggle} edge="end">
                    <Iconify
                      icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Field.Text
          name="confirmNewPassword"
          type={showPassword.value ? 'text' : 'password'}
          label="Confirm new password"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={showPassword.onToggle} edge="end">
                    <Iconify
                      icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Button type="submit" variant="contained" loading={isSubmitting} sx={{ ml: 'auto' }}>
          Save changes
        </Button>
      </Card>
    </Form>
  );
}
