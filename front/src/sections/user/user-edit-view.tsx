import type { IUserItem } from 'src/types/user';

import dayjs from 'dayjs';
import { useState, useEffect, useCallback } from 'react';

import { getUser } from 'src/actions/user';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserCreateEditForm } from './user-create-edit-form';

// ----------------------------------------------------------------------

type Props = { userId: string };

export function UserEditView({ userId }: Props) {
  const [currentUser, setCurrentUser] = useState<IUserItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const user: any = await getUser(userId);
      const roleName =
        Array.isArray(user?.roles) && user.roles.length
          ? user.roles[0]?.name
          : user?.primary_role || user?.role || '';
      
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
      
      setCurrentUser({
        id: user.id,
        name: user.name ?? '',
        email: user.email ?? '',
        phoneNumber: user.phone ?? '',
        avatar: user.avatar_path ?? '',
        avatarUrl: user.avatar_url ?? '',
        role: roleName ?? '',
        status: user.is_active === 1 ? 'active' : user.is_active === 0 ? 'banned' : 'pending',
        company: user.company_name ?? '',
        country: user.country ?? null,
        address: user.address ?? '',
        physicalAddress: user.physical_address ?? '',
        phoneHoursFrom: parseTimeValue(user.phone_hours_from),
        phoneHoursTo: parseTimeValue(user.phone_hours_to),
        state: user.state ?? '',
        city: user.city ?? '',
        zipCode: user.zip_code ?? '',
        isVerified: Boolean(user.email_verified_at),
        createdAt: user.created_at ?? new Date().toISOString(),
        updatedAt: user.updated_at ?? new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser, refreshKey]);
  
  const handleSaveSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <DashboardContent>
        <div>Loading...</div>
      </DashboardContent>
    );
  }

  if (!currentUser) {
    return (
      <DashboardContent>
        <div>User not found</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit Profile"
        links={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Profile', href: '/dashboard/user' },
          { name: 'Edit' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <UserCreateEditForm currentUser={currentUser || undefined} onSaveSuccess={handleSaveSuccess} />
    </DashboardContent>
  );
}
