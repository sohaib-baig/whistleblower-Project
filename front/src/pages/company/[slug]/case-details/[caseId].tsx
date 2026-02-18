import { useParams } from 'react-router';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Badge from '@mui/material/Badge';

import { getPasswordSession } from 'src/utils/password-session';

import { useTranslate } from 'src/locales';
import { getUnreadChatCount } from 'src/actions/company-case-details';

import { Iconify } from 'src/components/iconify';

import { ChatProvider } from 'src/sections/company/case-details/chat-context';
import { CompanyChatTab } from 'src/sections/company/case-details/tabs/company-chat-tab';
import { CompanyDocumentsTab } from 'src/sections/company/case-details/tabs/company-documents-tab';
import { CompanyCaseDetailsTab } from 'src/sections/company/case-details/tabs/company-case-details-tab';

import { PasswordGuard } from 'src/auth/guard/password-guard';

// ----------------------------------------------------------------------

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`case-details-tabpanel-${index}`}
      aria-labelledby={`case-details-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `case-details-tab-${index}`,
    'aria-controls': `case-details-tabpanel-${index}`,
  };
}

export default function CompanyCaseDetailsPage() {
  const { t } = useTranslate('navbar');
  const { slug, caseId } = useParams<{ slug: string; caseId: string }>();
  const [tabValue, setTabValue] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  // Fetch unread chat count
  const fetchUnreadCount = useCallback(async () => {
    if (!caseId) {
      return;
    }
    try {
      const count = await getUnreadChatCount(caseId);
      setChatUnreadCount(Math.min(count, 99)); // Cap at 99
    } catch (error: any) {
      console.error('❌ [caseId].tsx: Failed to fetch unread chat count:', error);
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

    return () => clearInterval(interval);
  }, [caseId, fetchUnreadCount]);

  // Listen for chat messages marked as read event
  useEffect(() => {
    if (!caseId) {
      return undefined;
    }

    const handleChatMessagesRead = (event: CustomEvent) => {
      if (event.detail?.caseId === caseId) {
        fetchUnreadCount();
        setTimeout(() => fetchUnreadCount(), 500);
        setTimeout(() => fetchUnreadCount(), 1500);
      }
    };

    window.addEventListener('chatMessagesMarkedAsRead', handleChatMessagesRead as EventListener);

    return () => {
      window.removeEventListener(
        'chatMessagesMarkedAsRead',
        handleChatMessagesRead as EventListener
      );
    };
  }, [caseId, fetchUnreadCount]);

  // Refresh count when navigating to chat tab (tab index 2)
  useEffect(() => {
    if (!caseId) {
      return undefined;
    }

    if (tabValue === 2) {
      const timeout1 = setTimeout(() => fetchUnreadCount(), 1000);
      const timeout2 = setTimeout(() => fetchUnreadCount(), 2000);

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
      };
    }
    return undefined;
  }, [tabValue, caseId, fetchUnreadCount]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Reset chat count function
  const resetChatCount = () => {
    // Chat count reset handler
  };

  // Get password from session
  const session = getPasswordSession(slug || '');
  const requiredPassword = session?.password || '';

  if (!slug || !caseId) {
    return (
      <Box
        sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <p>Invalid case access. Please check the URL.</p>
      </Box>
    );
  }

  return (
    <PasswordGuard companySlug={slug} requiredPassword={requiredPassword}>
      <Box
        sx={{
          pt: 5,
          pb: 5,
          minHeight: '100vh',
          bgcolor: 'grey.50',
          px: { xs: 2, sm: 3, md: 4, lg: 5 },
        }}
      >
        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: { xs: 2, sm: 3, md: 4 } }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="case details tabs"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 64,
                  px: { xs: 2, sm: 3, md: 4 },
                  mx: { xs: 0.5, sm: 1 },
                },
              }}
            >
              <Tab label={t('dashboard.case.detailsTabs.caseDetails')} {...a11yProps(0)} />
              <Tab label={t('dashboard.case.detailsTabs.documents')} {...a11yProps(1)} />
              <Tab
                label={t('dashboard.case.detailsTabs.chat')}
                {...a11yProps(2)}
                icon={
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
                    <Iconify width={24} icon="solar:chat-round-dots-bold" />
                  </Badge>
                }
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <CompanyCaseDetailsTab caseId={caseId} userId={slug} companySlug={slug} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <CompanyDocumentsTab caseId={caseId} userId={slug} companySlug={slug} />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <ChatProvider resetChatCount={resetChatCount}>
              <CompanyChatTab caseId={caseId} userId={slug} companySlug={slug} />
            </ChatProvider>
          </TabPanel>
        </Card>
      </Box>
    </PasswordGuard>
  );
}
