import type { DashboardContentProps } from 'src/layouts/dashboard';

import { removeLastSlash } from 'minimal-shared/utils';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Badge from '@mui/material/Badge';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useParams, usePathname } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  getUnreadChatCountAuthenticated,
  getUnreadLegalSupportCountAuthenticated,
} from 'src/actions/company-case-details';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function CaseDetailsLayout({ children, ...other }: DashboardContentProps) {
  const { t } = useTranslate('navbar');
  const pathname = usePathname();
  const params = useParams();
  const { id } = params;
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [legalSupportUnreadCount, setLegalSupportUnreadCount] = useState(0);

  const NAV_ITEMS = [
    {
      id: 'case-details',
      label: t('dashboard.case.detailsTabs.caseDetails'),
      icon: <Iconify width={24} icon="solar:flag-bold" />,
      href: (caseId: string) => `${paths.dashboard.case.root}/${caseId}/details-tabs`,
    },
    {
      id: 'report-setting',
      label: t('dashboard.case.detailsTabs.reportSetting'),
      icon: <Iconify width={24} icon="solar:settings-bold" />,
      href: (caseId: string) =>
        `${paths.dashboard.case.root}/${caseId}/details-tabs/report-setting`,
    },
    {
      id: 'logs',
      label: t('dashboard.case.detailsTabs.logs'),
      icon: <Iconify width={24} icon="solar:bill-list-bold" />,
      href: (caseId: string) => `${paths.dashboard.case.root}/${caseId}/details-tabs/logs`,
    },
    {
      id: 'documents',
      label: t('dashboard.case.detailsTabs.documents'),
      icon: <Iconify width={24} icon="solar:file-text-bold" />,
      href: (caseId: string) => `${paths.dashboard.case.root}/${caseId}/details-tabs/documents`,
    },
    {
      id: 'notes',
      label: t('dashboard.case.detailsTabs.notes'),
      icon: <Iconify width={24} icon="solar:pen-bold" />,
      href: (caseId: string) => `${paths.dashboard.case.root}/${caseId}/details-tabs/notes`,
    },
    {
      id: 'chat',
      label: t('dashboard.case.detailsTabs.chat'),
      icon: <Iconify width={24} icon="solar:chat-round-dots-bold" />,
      href: (caseId: string) => `${paths.dashboard.case.root}/${caseId}/details-tabs/chat`,
    },
    {
      id: 'legal-support',
      label: t('dashboard.case.detailsTabs.legalSupport'),
      icon: <Iconify width={24} icon="solar:chat-round-dots-bold" />,
      href: (caseId: string) => `${paths.dashboard.case.root}/${caseId}/details-tabs/legal-support`,
    },
  ];

  const currentPath = removeLastSlash(pathname);

  // Fetch unread chat count
  const fetchChatUnreadCount = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      const count = await getUnreadChatCountAuthenticated(id);
      setChatUnreadCount(Math.min(count, 99)); // Cap at 99
    } catch (error) {
      console.error('Failed to fetch unread chat count:', error);
    }
  }, [id]);

  const fetchLegalSupportUnreadCount = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      const count = await getUnreadLegalSupportCountAuthenticated(id);
      setLegalSupportUnreadCount(Math.min(count, 99));
    } catch (error) {
      console.error('Failed to fetch unread legal support count:', error);
    }
  }, [id]);

  // Initial fetch and periodic updates
  useEffect(() => {
    if (!id) {
      return undefined;
    }

    fetchChatUnreadCount();
    fetchLegalSupportUnreadCount();

    const interval = setInterval(() => {
      fetchChatUnreadCount();
      fetchLegalSupportUnreadCount();
    }, 5000);

    return () => clearInterval(interval);
  }, [id, fetchChatUnreadCount, fetchLegalSupportUnreadCount]);

  // Listen for chat messages marked as read event (always active)
  useEffect(() => {
    if (!id) {
      return undefined;
    }

    const handleChatMessagesRead = (event: CustomEvent) => {
      if (event.detail?.caseId === id) {
        fetchChatUnreadCount();
        setTimeout(() => fetchChatUnreadCount(), 500);
        setTimeout(() => fetchChatUnreadCount(), 1500);
      }
    };

    const handleLegalSupportMessagesRead = (event: CustomEvent) => {
      if (event.detail?.caseId === id) {
        fetchLegalSupportUnreadCount();
        setTimeout(() => fetchLegalSupportUnreadCount(), 500);
        setTimeout(() => fetchLegalSupportUnreadCount(), 1500);
      }
    };

    window.addEventListener('chatMessagesMarkedAsRead', handleChatMessagesRead as EventListener);
    window.addEventListener(
      'legalSupportMessagesMarkedAsRead',
      handleLegalSupportMessagesRead as EventListener
    );

    return () => {
      window.removeEventListener(
        'chatMessagesMarkedAsRead',
        handleChatMessagesRead as EventListener
      );
      window.removeEventListener(
        'legalSupportMessagesMarkedAsRead',
        handleLegalSupportMessagesRead as EventListener
      );
    };
  }, [id, fetchChatUnreadCount, fetchLegalSupportUnreadCount]);

  // Refresh count when navigating to chat tab
  useEffect(() => {
    if (!id) {
      return undefined;
    }

    if (currentPath.includes('/chat')) {
      const timeout1 = setTimeout(() => fetchChatUnreadCount(), 1000);
      const timeout2 = setTimeout(() => fetchChatUnreadCount(), 2000);

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
      };
    }

    if (currentPath.includes('/legal-support')) {
      const timeout1 = setTimeout(() => fetchLegalSupportUnreadCount(), 1000);
      const timeout2 = setTimeout(() => fetchLegalSupportUnreadCount(), 2000);

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
      };
    }

    return undefined;
  }, [currentPath, id, fetchChatUnreadCount, fetchLegalSupportUnreadCount]);

  return (
    <DashboardContent {...other}>
      <CustomBreadcrumbs
        heading={t('dashboard.case.caseDetails')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('dashboard.case.heading'), href: paths.dashboard.case.root },
          { name: t('dashboard.case.caseDetails') },
        ]}
        sx={{ mb: 3 }}
      />

      <Tabs value={currentPath} sx={{ mb: { xs: 3, md: 5 } }}>
        {NAV_ITEMS.map((tab) => {
          const href = tab.href(id || '');
          const badgeContent =
            tab.id === 'chat'
              ? chatUnreadCount
              : tab.id === 'legal-support'
                ? legalSupportUnreadCount
                : null;

          return (
            <Tab
              component={RouterLink}
              key={tab.id}
              label={tab.label}
              icon={
                badgeContent && badgeContent > 0 ? (
                  <Badge
                    badgeContent={badgeContent}
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.7rem',
                        minWidth: '18px',
                        height: '18px',
                      },
                    }}
                  >
                    {tab.icon}
                  </Badge>
                ) : (
                  tab.icon
                )
              }
              value={href}
              href={href}
            />
          );
        })}
      </Tabs>

      <Box sx={{ minHeight: '60vh' }}>{children}</Box>
    </DashboardContent>
  );
}
