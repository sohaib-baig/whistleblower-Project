import type { IUserItem } from 'src/types/user';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/global-config';
import { getUser } from 'src/actions/user';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserCreateEditForm } from '../user-create-edit-form';

// ----------------------------------------------------------------------

type Props = { userId: string };

export function UserEditView({ userId }: Props) {
  const { t } = useTranslate('navbar');
  const [currentUser, setCurrentUser] = useState<IUserItem | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user: any = await getUser(userId);
        const roleName =
          Array.isArray(user?.roles) && user.roles.length
            ? user.roles[0]?.name
            : user?.primary_role || user?.role || '';
        const avatarUrl = user.avatar_url
          ? String(user.avatar_url).startsWith('/')
            ? `${CONFIG.serverUrl}${user.avatar_url}`
            : String(user.avatar_url)
          : '';
        setCurrentUser({
          id: user.id,
          name: user.name ?? '',
          email: user.email ?? '',
          phoneNumber: user.phone ?? '',
          avatar: user.avatar_path ?? '',
          avatarUrl,
          role: roleName ?? '',
          status: user.is_active === 1 ? 'active' : user.is_active === 0 ? 'banned' : 'pending',
          company: user.company_name ?? '',
          country: user.country ?? null,
          address: user.address ?? '',
          state: user.state ?? '',
          city: user.city ?? '',
          zipCode: user.zip_code ?? '',
          isVerified: Boolean(user.email_verified_at),
          createdAt: user.created_at ?? new Date().toISOString(),
          updatedAt: user.updated_at ?? new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, [userId]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.user.edit')}
        backHref={paths.dashboard.user.list}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: t('dashboard.user.heading'), href: paths.dashboard.user.root },
          { name: currentUser?.name || t('dashboard.user.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <UserCreateEditForm currentUser={currentUser || undefined} />
    </DashboardContent>
  );
}
