import type { IconButtonProps } from '@mui/material/IconButton';
import type { NotificationItemProps } from './notification-item';

import { m } from 'framer-motion';
import { useBoolean } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useRouter } from 'src/routes/hooks';

import {
  type INotification,
  fetchMyNotifications,
  markAllNotificationsAsRead,
} from 'src/actions/notification';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { varTap, varHover, transitionTap } from 'src/components/animate';

import { NotificationItem } from './notification-item';

// ----------------------------------------------------------------------

export type NotificationsDrawerProps = IconButtonProps & {
  data?: NotificationItemProps['notification'][];
};

export function NotificationsDrawer({ data = [], sx, ...other }: NotificationsDrawerProps) {
  const router = useRouter();
  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

  const [currentTab, setCurrentTab] = useState('all');
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(false);

  const handleChangeTab = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const status =
        currentTab === 'all' ? undefined : currentTab === 'unread' ? 'unread' : 'archived';
      const response = await fetchMyNotifications(status);
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentTab]);

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open, currentTab, loadNotifications]);

  const totalUnRead = notifications.filter((item) => item.status === 'unread').length;
  const totalArchived = notifications.filter((item) => item.status === 'archived').length;

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = useCallback(
    (notification: INotification) => {
      if (notification.redirect_url) {
        router.push(notification.redirect_url);
        onClose();
      }
    },
    [router, onClose]
  );

  const renderHead = () => (
    <Box
      sx={{
        py: 2,
        pr: 1,
        pl: 2.5,
        minHeight: 68,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Notifications
      </Typography>

      {!!totalUnRead && (
        <Tooltip title="Mark all as read">
          <IconButton color="primary" onClick={handleMarkAllAsRead}>
            <Iconify icon="eva:done-all-fill" />
          </IconButton>
        </Tooltip>
      )}

      <IconButton onClick={onClose} sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
        <Iconify icon="mingcute:close-line" />
      </IconButton>

      <IconButton>
        <Iconify icon="solar:settings-bold-duotone" />
      </IconButton>
    </Box>
  );

  const renderTabs = () => {
    const tabs = [
      { value: 'all', label: 'All', count: notifications.length },
      { value: 'unread', label: 'Unread', count: totalUnRead },
      { value: 'archived', label: 'Archived', count: totalArchived },
    ];

    return (
      <Tabs
        variant="fullWidth"
        value={currentTab}
        onChange={handleChangeTab}
        indicatorColor="custom"
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.value}
            iconPosition="end"
            value={tab.value}
            label={tab.label}
            icon={
              <Label
                variant={((tab.value === 'all' || tab.value === currentTab) && 'filled') || 'soft'}
                color={
                  (tab.value === 'unread' && 'info') ||
                  (tab.value === 'archived' && 'success') ||
                  'default'
                }
              >
                {tab.count}
              </Label>
            }
          />
        ))}
      </Tabs>
    );
  };

  const renderList = () => {
    if (loading) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Loading notifications...
          </Typography>
        </Box>
      );
    }

    if (notifications.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No notifications
          </Typography>
        </Box>
      );
    }

    return (
      <Scrollbar>
        <Box component="ul">
          {notifications.map((notification) => (
            <Box component="li" key={notification.id} sx={{ display: 'flex' }}>
              <NotificationItem
                notification={{
                  id: notification.id,
                  type: notification.type,
                  title: notification.message,
                  category: notification.type,
                  isUnRead: notification.status === 'unread',
                  avatarUrl: null,
                  createdAt: notification.created_at,
                  redirectUrl: notification.redirect_url,
                }}
                onClick={() => handleNotificationClick(notification)}
              />
            </Box>
          ))}
        </Box>
      </Scrollbar>
    );
  };

  return (
    <>
      <IconButton
        component={m.button}
        whileTap={varTap(0.96)}
        whileHover={varHover(1.04)}
        transition={transitionTap()}
        aria-label="Notifications button"
        onClick={onOpen}
        sx={sx}
        {...other}
      >
        <Badge badgeContent={totalUnRead} color="error">
          <Iconify width={24} icon="solar:bell-bing-bold-duotone" />
        </Badge>
      </IconButton>

      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        slotProps={{
          backdrop: { invisible: true },
          paper: { sx: { width: 1, maxWidth: 420 } },
        }}
      >
        {renderHead()}
        {renderTabs()}
        {renderList()}
      </Drawer>
    </>
  );
}
