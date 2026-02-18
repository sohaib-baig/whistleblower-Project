import type { IUserItem } from 'src/types/user';

import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/global-config';
import { getUser } from 'src/actions/user';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import StateListView from '../state/state-list';
import { QuestionListView } from '../question/view';
import SeverityListView from '../severity/severity-list';
import DepartmentListView from '../department/department-list';
import { SupportEditForm } from '../support/support-edit-form';
import { ReportingLinkSettings } from './reporting-link-settings';
import { UserCreateEditForm } from '../user/user-create-edit-form';
import { ReportingPageEditForm } from './reporting-page-edit-form';
import { PrivacyPolicyEditForm } from '../privacy-policy/privacy-policy-edit-form';
import { TermsConditionsEditForm } from '../terms-conditions/terms-conditions-edit-form';

// ----------------------------------------------------------------------

// Wrapper component to fetch and display user edit form
function UserEditFormWrapper({ userId }: { userId: string }) {
  const { t } = useTranslate('navbar');
  const [currentUser, setCurrentUser] = useState<IUserItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
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
          physicalAddress: user.physical_address ?? '',
          phoneHoursFrom: user.phone_hours_from ?? '',
          phoneHoursTo: user.phone_hours_to ?? '',
          phoneHoursFormat: (user.phone_hours_format as '12h' | '24h') ?? '24h',
          userLanguage: user.user_language ?? 'en',
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
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (isLoading) {
    return <Box>{t('dashboard.reportingLink.loading')}</Box>;
  }

  return <UserCreateEditForm currentUser={currentUser || undefined} showOnlyReportingFields />;
}

export function ReportingLinkPage() {
  const { t } = useTranslate('navbar');
  const { user } = useAuthContext();

  const allTabs = useMemo(
    () => [
      {
        key: 'setting',
        label: t('dashboard.reportingLink.tabs.setting'),
        render: () =>
          user?.id ? (
            <Box sx={{ p: 3 }}>
              <UserEditFormWrapper userId={user.id} />
            </Box>
          ) : null,
      },
      {
        key: 'page',
        label: t('dashboard.reportingLink.tabs.page'),
        render: () => (
          <Box sx={{ p: 3 }}>
            <ReportingPageEditForm />
          </Box>
        ),
      },
      {
        key: 'privacy-policy',
        label: t('dashboard.reportingLink.tabs.privacyPolicy'),
        render: () => (
          <Box sx={{ p: 3 }}>
            <PrivacyPolicyEditForm isReportingLinkContext />
          </Box>
        ),
      },
      {
        key: 'terms-conditions',
        label: t('dashboard.reportingLink.tabs.termsConditions'),
        render: () => (
          <Box sx={{ p: 3 }}>
            <TermsConditionsEditForm isReportingLinkContext />
          </Box>
        ),
      },
      {
        key: 'support',
        label: t('dashboard.reportingLink.tabs.support'),
        render: () => (
          <Box sx={{ p: 3 }}>
            <SupportEditForm isReportingLinkContext />
          </Box>
        ),
      },
      {
        key: 'question',
        label: t('dashboard.reportingLink.tabs.question'),
        render: () => (
          <Box sx={{ p: 0, pt: 3 }}>
            <QuestionListView />
          </Box>
        ),
      },
      {
        key: 'department',
        label: t('dashboard.reportingLink.tabs.department'),
        render: () => (
          <Box sx={{ p: 3 }}>
            <DepartmentListView showBreadcrumbs={false} />
          </Box>
        ),
      },
      {
        key: 'state',
        label: t('dashboard.reportingLink.tabs.state'),
        render: () => (
          <Box sx={{ p: 3 }}>
            <StateListView showBreadcrumbs={false} />
          </Box>
        ),
      },
      {
        key: 'severity',
        label: t('dashboard.reportingLink.tabs.severity'),
        render: () => (
          <Box sx={{ p: 3 }}>
            <SeverityListView showBreadcrumbs={false} />
          </Box>
        ),
      },
    ],
    [t, user?.id]
  );

  const isCaseManager = user?.role === 'case_manager';

  const visibleTabs = useMemo(
    () => (isCaseManager ? allTabs.filter((tab) => tab.key === 'setting') : allTabs),
    [allTabs, isCaseManager]
  );

  const [selectedTab, setSelectedTab] = useState<string>(visibleTabs[0]?.key ?? 'setting');

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.key === selectedTab)) {
      setSelectedTab(visibleTabs[0]?.key ?? 'setting');
    }
  }, [visibleTabs, selectedTab]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
  };

  return (
    <>
      <CustomBreadcrumbs
        heading={t('dashboard.reportingLink.heading')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          {
            name: t('dashboard.reportingLink.breadcrumb'),
            href: paths.dashboard.reportingLink.root,
          },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Box sx={{ px: 3, pt: 3, pb: 5 }}>
            <ReportingLinkSettings />
          </Box>

        {!isCaseManager && (
        <Box sx={{ borderTop: !isCaseManager ? 1 : 0, borderBottom: 1, borderColor: 'divider', px: 3, pt: isCaseManager ? 3 : 0 }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            {visibleTabs.map((tab) => (
              <Tab key={tab.key} label={tab.label} value={tab.key} />
            ))}
          </Tabs>
        </Box>
        )}
        {!isCaseManager && (
        <Box sx={{ px: 0, py: 0 }}>
          {visibleTabs.map((tab) => (
            <Box key={tab.key} sx={{ display: tab.key === selectedTab ? 'block' : 'none' }}>
              {tab.render()}
            </Box>
          ))}
        </Box>
        )}
      </Card>
    </>
  );
}
