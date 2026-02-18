import type { User, PasswordChangeData } from 'src/types/user';

import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

export async function getUser(id: string): Promise<any> {
  const res = await sanctum.get(`${endpoints.users.details(id)}`);
  const data: any = (res as any).data || {};
  return data as User;
}

type UpdateUserFields = {
  name?: string;
  email?: string;
  phoneNumber?: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  address?: string;
  physicalAddress?: string;
  phoneHoursFrom?: string;
  phoneHoursTo?: string;
  phoneHoursFormat?: '12h' | '24h';
  userLanguage?: string;
  company?: string;
  companyNumber?: string;
  role?: string;
  avatar?: File | null | undefined;
};

export async function updateUser(id: string, form: UpdateUserFields): Promise<User> {
  await initSanctumCsrf();
  const payload: any = new FormData();
  if (form.name) payload.append('name', form.name);
  if (form.email) payload.append('email', form.email);
  if (form.phoneNumber) payload.append('phone', form.phoneNumber as any);
  if (form.country) payload.append('country', form.country as any);
  if (form.state) payload.append('state', form.state as any);
  if (form.city) payload.append('city', form.city as any);
  if (form.zipCode) payload.append('zip_code', form.zipCode as any);
  if (form.address) payload.append('address', form.address as any);
  if (form.physicalAddress) payload.append('physical_address', form.physicalAddress as any);
  if (form.phoneHoursFrom) payload.append('phone_hours_from', form.phoneHoursFrom as any);
  if (form.phoneHoursTo) payload.append('phone_hours_to', form.phoneHoursTo as any);
  if (form.phoneHoursFormat) payload.append('phone_hours_format', form.phoneHoursFormat as any);
  if (form.userLanguage) payload.append('user_language', form.userLanguage as any);
  // Backend validator expects 'company'; controller maps it to 'company_name'
  if (form.company) payload.append('company', form.company);
  if (form.companyNumber) payload.append('company_number', form.companyNumber);
  if (form.role) payload.append('role', form.role);
  if (form.avatar instanceof File) payload.append('avatar', form.avatar);

  const res = await sanctum.post(`${endpoints.users.update(id)}?_method=PUT`, payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return (res as any).data as User;
}

export async function uploadProfilePicture(file: File): Promise<string> {
  await initSanctumCsrf();
  const fd = new FormData();
  fd.append('avatar', file);
  const res = await sanctum.post('/api/v1/profile/avatar', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const data: any = (res as any).data || {};
  return data.url || data.avatar_url || '';
}

export async function uploadCoverPhoto(file: File): Promise<string> {
  // Not implemented server-side; keep client preview
  return URL.createObjectURL(file);
}

export async function changePassword(data: PasswordChangeData): Promise<void> {
  await initSanctumCsrf();
  const res = await sanctum.post('/api/v1/profile/change-password', {
    old_password: data.currentPassword,
    new_password: data.newPassword,
    new_password_confirmation: data.confirmPassword,
  });

  if ((res as any).data?.status === false) {
    const backendErrors = (res as any).data?.data?.errors;
    if (backendErrors) {
      const error = new Error('The given data was invalid.');
      (error as any).response = { data: (res as any).data };
      throw error;
    }
  }
}

export async function updateProfile(data: { user_language?: string }): Promise<any> {
  await initSanctumCsrf();
  try {
    const res = await sanctum.put('/api/v1/profile', data);
    return (res as any).data;
  } catch (error: any) {
    console.error('updateProfile error:', error);
    console.error('updateProfile error response:', error.response);
    throw error;
  }
}
