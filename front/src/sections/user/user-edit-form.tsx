import type { User, UserFormValues, PasswordChangeData } from 'src/types/user';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { GENDER_OPTIONS, COUNTRY_OPTIONS } from 'src/_mock/_user';
import {
  updateUser,
  changePassword,
  uploadCoverPhoto,
  uploadProfilePicture,
} from 'src/actions/user';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const UserEditSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  bio: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  }),
  website: z.string().url().optional().or(z.literal('')),
  socialMedia: z.object({
    linkedin: z.string().url().optional().or(z.literal('')),
    twitter: z.string().url().optional().or(z.literal('')),
    facebook: z.string().url().optional().or(z.literal('')),
    instagram: z.string().url().optional().or(z.literal('')),
  }),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  marketingEmails: z.boolean(),
});

const PasswordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type Props = {
  currentUser: User;
  onSuccess?: () => void;
};

export function UserEditForm({ currentUser, onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(currentUser.profilePicture);
  const [coverPhoto, setCoverPhoto] = useState(currentUser.coverPhoto);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const methods = useForm<UserFormValues>({
    resolver: zodResolver(UserEditSchema),
    defaultValues: {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      phoneNumber: currentUser.phoneNumber,
      dateOfBirth: currentUser.dateOfBirth,
      gender: currentUser.gender,
      bio: currentUser.bio,
      address: currentUser.address,
      website: currentUser.website,
      socialMedia: currentUser.socialMedia,
      username: currentUser.username,
      emailNotifications: currentUser.emailNotifications,
      smsNotifications: currentUser.smsNotifications,
      marketingEmails: currentUser.marketingEmails,
    },
  });

  const passwordMethods = useForm<PasswordChangeData>({
    resolver: zodResolver(PasswordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const { handleSubmit } = methods;
  const { handleSubmit: handlePasswordSubmit } = passwordMethods;

  const onSubmit = handleSubmit(async (data: UserFormValues) => {
    try {
      setLoading(true);
      const payload = {
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        phoneNumber: data.phoneNumber,
        country: data.address?.country,
        state: data.address?.state,
        city: data.address?.city,
        zipCode: data.address?.postalCode,
        address: data.address?.street,
        company: (data as any).company,
        role: (data as any).role,
        avatar: (data as any).avatarUrl instanceof File ? (data as any).avatarUrl : undefined,
      } as any;
      await updateUser(currentUser.id, payload);
      toast.success('Profile updated successfully!');
      onSuccess?.();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  });

  const onPasswordSubmit = handlePasswordSubmit(async (data) => {
    try {
      setLoading(true);
      await changePassword(data);
      toast.success('Password changed successfully!');
      setShowPasswordForm(false);
      passwordMethods.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  });

  const handleProfilePictureUpload = useCallback(async (file: File) => {
    try {
      setLoading(true);
      const url = await uploadProfilePicture(file);
      setProfilePicture(url);
      toast.success('Profile picture updated successfully!');
    } catch {
      toast.error('Failed to upload profile picture');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCoverPhotoUpload = useCallback(async (file: File) => {
    try {
      setLoading(true);
      const url = await uploadCoverPhoto(file);
      setCoverPhoto(url);
      toast.success('Cover photo updated successfully!');
    } catch {
      toast.error('Failed to upload cover photo');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCancel = () => {
    router.push(paths.dashboard.root);
  };

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {/* Cover Photo */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3, position: 'relative' }}>
            <Box
              sx={{
                height: 200,
                borderRadius: 1,
                backgroundImage: `url(${coverPhoto})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                mb: 3,
              }}
            >
              <IconButton
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                  },
                }}
                component="label"
              >
                <Iconify icon="solar:camera-add-bold" />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverPhotoUpload(file);
                  }}
                />
              </IconButton>
            </Box>

            {/* Profile Picture */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar src={profilePicture} sx={{ width: 80, height: 80, mr: 3 }} />
              <Box>
                <Typography variant="h6">
                  {currentUser.firstName} {currentUser.lastName}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  component="label"
                  startIcon={<Iconify icon="solar:camera-add-bold" />}
                >
                  Change Photo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProfilePictureUpload(file);
                    }}
                  />
                </Button>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Personal Information */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Personal Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.Text name="firstName" label="First Name" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.Text name="lastName" label="Last Name" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.Text name="email" label="Email Address" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.Text name="phoneNumber" label="Phone Number" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.Text name="dateOfBirth" label="Date of Birth" type="date" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.Select name="gender" label="Gender">
                  {GENDER_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Field.Text name="bio" label="Bio" multiline rows={4} />
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Address Information */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Address Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Field.Text name="address.street" label="Street Address" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.Text name="address.city" label="City" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.Text name="address.state" label="State/Province" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.Select name="address.country" label="Country">
                  {COUNTRY_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.Text name="address.postalCode" label="Postal Code" />
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Social Media & Website */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Social Media & Website
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Field.Text name="website" label="Website URL" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.Text name="socialMedia.linkedin" label="LinkedIn" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.Text name="socialMedia.twitter" label="Twitter" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.Text name="socialMedia.facebook" label="Facebook" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.Text name="socialMedia.instagram" label="Instagram" />
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Account Settings */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Account Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Field.Text name="username" label="Username" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  startIcon={<Iconify icon="solar:lock-password-outline" />}
                >
                  Change Password
                </Button>
              </Grid>
            </Grid>

            {/* Password Change Form */}
            {showPasswordForm && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Form methods={passwordMethods} onSubmit={onPasswordSubmit}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <Field.Text name="currentPassword" label="Current Password" type="password" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field.Text name="newPassword" label="New Password" type="password" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field.Text
                        name="confirmPassword"
                        label="Confirm New Password"
                        type="password"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Stack direction="row" spacing={2}>
                        <Button type="submit" variant="contained" disabled={loading}>
                          Update Password
                        </Button>
                        <Button variant="outlined" onClick={() => setShowPasswordForm(false)}>
                          Cancel
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </Form>
              </Box>
            )}

            {/* Notification Settings */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Notification Preferences
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field.Switch name="emailNotifications" label="Email Notifications" />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field.Switch name="smsNotifications" label="SMS Notifications" />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field.Switch name="marketingEmails" label="Marketing Emails" />
                </Grid>
              </Grid>
            </Box>
          </Card>
        </Grid>

        {/* Form Actions */}
        <Grid size={{ xs: 12 }}>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Form>
  );
}
