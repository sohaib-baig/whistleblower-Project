import type { IUserItem } from 'src/types/user';

import dayjs from 'dayjs';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/global-config';
import { getUser } from 'src/actions/user';

import { UserCreateEditForm } from 'src/sections/user/user-create-edit-form';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const resolveAvatarUrl = (url?: string | null) => {
  if (!url) {
    return '';
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  const base = CONFIG.serverUrl || '';
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
};

// Helper to parse time value for TimePicker
const parseTimeValue = (timeStr: string | null | undefined): string => {
  if (!timeStr) return '';
  // If in HH:mm or HH:mm:ss format, convert to ISO datetime for TimePicker
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
    const timeOnly = timeStr.substring(0, 5); // Extract HH:mm part
    const today = dayjs().format('YYYY-MM-DD');
    return dayjs(`${today} ${timeOnly}`, 'YYYY-MM-DD HH:mm').format();
  }
  // Try parsing as ISO datetime string
  const parsed = dayjs(timeStr);
  if (parsed.isValid()) {
    return parsed.format();
  }
  return timeStr;
};

const mapUserToItem = (data: any): IUserItem => {
  const primaryRole =
    Array.isArray(data?.roles) && data.roles.length
      ? typeof data.roles[0] === 'string'
        ? data.roles[0]
        : data.roles[0]?.name
      : data?.primary_role || data?.role || '';

  const status = data?.is_active === 1 ? 'active' : data?.is_active === 0 ? 'banned' : 'pending';

  return {
    id: data?.id ?? '',
    name: data?.name ?? '',
    email: data?.email ?? '',
    phoneNumber: data?.phone ?? data?.phone_number ?? '',
    avatar: data?.avatar_path ?? '',
    avatarUrl: resolveAvatarUrl(data?.avatar_url ?? data?.avatar ?? data?.avatar_path),
    role: primaryRole ?? '',
    status,
    company: data?.company_name ?? data?.company ?? '',
    companyNumber: data?.company_number ?? '',
    country: data?.country ?? null,
    address: data?.address ?? '',
    physicalAddress: data?.physical_address ?? '',
    phoneHoursFrom: parseTimeValue(data?.phone_hours_from),
    phoneHoursTo: parseTimeValue(data?.phone_hours_to),
    phoneHoursFormat: (data?.phone_hours_format as '12h' | '24h') ?? '24h',
    userLanguage: data?.user_language ?? 'en',
    state: data?.state ?? '',
    city: data?.city ?? '',
    zipCode: data?.zip_code ?? '',
    isVerified: Boolean(data?.email_verified_at),
    createdAt: data?.created_at ?? new Date().toISOString(),
    updatedAt: data?.updated_at ?? new Date().toISOString(),
  };
};

// ----------------------------------------------------------------------

export function AccountGeneral() {
  const { user } = useAuthContext();

  const [currentUser, setCurrentUser] = useState<IUserItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadUser = useCallback(async () => {
    if (!user?.id) {
      setError('Unable to load account details. User ID is missing.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getUser(user.id);
      setCurrentUser(mapUserToItem(response));
    } catch (err: any) {
      setError(err?.message || 'Failed to load account details.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadUser();
  }, [loadUser, refreshKey]);

  const handleSaveSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!currentUser) {
    return <Alert severity="warning">No account details available.</Alert>;
  }

  return <UserCreateEditForm currentUser={currentUser} onSaveSuccess={handleSaveSuccess} />;
}
