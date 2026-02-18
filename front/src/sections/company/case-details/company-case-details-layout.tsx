import type { ReactNode } from 'react';

import { useLocation } from 'react-router';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Badge from '@mui/material/Badge';
import Stack from '@mui/material/Stack';

import { useParams } from 'src/routes/hooks';

import { decodeAndDecryptId } from 'src/utils/encryption';

import { getUnreadChatCount } from 'src/actions/company-case-details';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  children?: ReactNode;
};

const NAV_ITEMS = [
  {
    label: 'Case Details',
    icon: <Iconify width={24} icon="solar:flag-bold" />,
    index: 0,
  },
  {
    label: 'Report Setting',
    icon: <Iconify width={24} icon="solar:settings-bold" />,
    index: 1,
  },
  {
    label: 'Logs',
    icon: <Iconify width={24} icon="solar:bill-list-bold" />,
    index: 2,
  },
  {
    label: 'Documents',
    icon: <Iconify width={24} icon="solar:file-text-bold" />,
    index: 3,
  },
  {
    label: 'Notes',
    icon: <Iconify width={24} icon="solar:pen-bold" />,
    index: 4,
  },
  {
    label: 'Chat',
    icon: <Iconify width={24} icon="solar:chat-round-dots-bold" />,
    index: 5,
  },
];

export function CompanyCaseDetailsLayout({ children }: Props) {
  const location = useLocation();
  const { encryptedCaseId: _encryptedCaseId } = useParams();
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [tabValue, setTabValue] = useState(0);

  // Decrypt case ID - try multiple approaches
  const caseId = useMemo(() => {
    // First, try to get encrypted case ID from params
    if (_encryptedCaseId) {
      try {
        const decrypted = decodeAndDecryptId(_encryptedCaseId);
        if (decrypted) {
          return decrypted;
        }
      } catch (error) {
        console.error('❌ Failed to decrypt caseId from params:', error);
      }
    }

    // If that fails, try extracting from URL path
    try {
      const currentPath = location.pathname;
      const caseDetailsIndex = currentPath.indexOf('/case-details/');

      if (caseDetailsIndex !== -1) {
        const fullPath = currentPath.substring(caseDetailsIndex + '/case-details/'.length);
        const pathParts = fullPath.split('/').filter((p) => p); // Filter out empty strings

        // If only one part exists, it's likely the case ID (not encryptedUserId/encryptedCaseId format)
        if (pathParts.length === 1) {
          const singleId = pathParts[0];
          // Decode URL encoding if needed
          const decodedId = singleId.includes('%') ? decodeURIComponent(singleId) : singleId;

          // Check if it looks like a UUID (plain, unencrypted case ID)
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidPattern.test(decodedId)) {
            return decodedId;
          }

          // If not a UUID, try to decrypt it
          try {
            const decrypted = decodeAndDecryptId(decodedId);
            return decrypted;
          } catch (error) {
            console.error('❌ Failed to decrypt single ID:', error);
            // If decryption fails, use it as-is (might be a valid ID format we don't recognize)
            return decodedId;
          }
        }

        // If two parts exist, pathParts[0] is encryptedUserId, pathParts[1] is encryptedCaseId
        if (pathParts.length >= 2) {
          const encryptedCaseIdFromUrl = pathParts[1] || '';
          if (encryptedCaseIdFromUrl) {
            // Decode if needed
            const decodedCaseId = encryptedCaseIdFromUrl.includes('%')
              ? decodeURIComponent(encryptedCaseIdFromUrl)
              : encryptedCaseIdFromUrl;
            const decrypted = decodeAndDecryptId(decodedCaseId);
            return decrypted;
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to extract and decrypt caseId from URL:', error);
    }

    console.warn('⚠️ Could not extract caseId from any source');
    return '';
  }, [_encryptedCaseId, location.pathname]);

  // Fetch unread chat count
  const fetchUnreadCount = useCallback(async () => {
    if (!caseId) {
      return;
    }
    try {
      const count = await getUnreadChatCount(caseId);
      setChatUnreadCount(Math.min(count, 99)); // Cap at 99
    } catch (error: any) {
      console.error('❌ Failed to fetch unread chat count:', error);
      console.error('❌ Error details:', error?.response?.data || error?.message);
      console.error('❌ Error status:', error?.response?.status);
      console.error('❌ Error URL:', error?.config?.url);
      // Set to 0 on error so badge doesn't show incorrectly
      setChatUnreadCount(0);
    }
  }, [caseId]);

  // Initial fetch and periodic updates
  useEffect(() => {
    if (!caseId) {
      return undefined;
    }

    // Fetch immediately
    fetchUnreadCount();

    // Update every 5 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [caseId, fetchUnreadCount]);

  // Listen for chat messages marked as read event (always active)
  useEffect(() => {
    if (!caseId) {
      return undefined;
    }

    const handleChatMessagesRead = (event: CustomEvent) => {
      // Only refresh if it's for this case
      if (event.detail?.caseId === caseId) {
        // Refresh count multiple times to ensure it updates (backend might need time to process)
        fetchUnreadCount();
        setTimeout(() => fetchUnreadCount(), 500);
        setTimeout(() => fetchUnreadCount(), 1500);
      }
    };

    // Listen for custom event from chat tab
    window.addEventListener('chatMessagesMarkedAsRead', handleChatMessagesRead as EventListener);

    return () => {
      window.removeEventListener(
        'chatMessagesMarkedAsRead',
        handleChatMessagesRead as EventListener
      );
    };
  }, [caseId, fetchUnreadCount]);

  // Refresh count when navigating to chat tab (check URL tab)
  useEffect(() => {
    if (!caseId) {
      return undefined;
    }

    const currentPath = location.pathname;
    const fullPath = currentPath.substring(
      currentPath.indexOf('/case-details/') + '/case-details/'.length
    );
    const pathParts = fullPath.split('/').filter((p) => p);
    const urlTab = pathParts[2] || '';
    const isChatTab = urlTab === 'chat';

    if (isChatTab) {
      // Refresh count when navigating to chat tab (multiple refreshes to ensure update)
      const timeout1 = setTimeout(() => fetchUnreadCount(), 1000);
      const timeout2 = setTimeout(() => fetchUnreadCount(), 2000);

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
      };
    }
    return undefined;
  }, [location.pathname, caseId, fetchUnreadCount]);

  // Get current tab from URL to sync with page component's URL-based routing
  useEffect(() => {
    const currentPath = location.pathname;
    const fullPath = currentPath.substring(
      currentPath.indexOf('/case-details/') + '/case-details/'.length
    );
    const pathParts = fullPath.split('/').filter((p) => p);
    const urlTab = pathParts[2] || '';

    // Map URL tab names to tab indices
    const tabMap: Record<string, number> = {
      '': 0,
      'report-setting': 1,
      logs: 2,
      documents: 3,
      notes: 4,
      chat: 5,
    };

    const newTabValue = tabMap[urlTab] ?? 0;
    if (tabValue !== newTabValue) {
      setTabValue(newTabValue);
    }
  }, [location.pathname, tabValue]);

  // Handle tab change - navigate using URL
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    const currentPath = location.pathname;
    const basePath = currentPath.substring(
      0,
      currentPath.indexOf('/case-details/') + '/case-details/'.length
    );
    const fullPath = currentPath.substring(
      currentPath.indexOf('/case-details/') + '/case-details/'.length
    );
    const pathParts = fullPath.split('/').filter((p) => p);
    const encryptedUserId = pathParts[0] || '';
    const encryptedCaseId = pathParts[1] || '';

    const tabMap: Record<number, string> = {
      0: '',
      1: 'report-setting',
      2: 'logs',
      3: 'documents',
      4: 'notes',
      5: 'chat',
    };

    const tabName = tabMap[newValue] || '';
    const newUrl = tabName
      ? `${basePath}${encryptedUserId}/${encryptedCaseId}/${tabName}`
      : `${basePath}${encryptedUserId}/${encryptedCaseId}`;

    window.location.href = newUrl;
  };

  // Always show tabs with badge, then render children below
  return (
    <Stack spacing={3} sx={{ pb: { xs: 3, md: 5 }, pt: 1.5 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: { xs: 3, md: 5 } }}>
          {NAV_ITEMS.map((item) => {
            const isChatTab = item.index === 5;


            return (
              <Tab
                key={item.index}
                label={item.label}
                value={item.index}
                icon={
                  isChatTab ? (
                    <Badge
                      badgeContent={chatUnreadCount ?? 0}
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.7rem',
                          minWidth: '18px',
                          height: '18px',
                        },
                      }}
                    >
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )
                }
                iconPosition="start"
              />
            );
          })}
        </Tabs>
      </Box>

      <Box sx={{ minHeight: '60vh' }}>
        {/* Always render children from page component */}
        {children}
      </Box>
    </Stack>
  );
}
