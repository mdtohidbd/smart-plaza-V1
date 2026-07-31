import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Tooltip
} from '@mui/material';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useNotifications } from '../hooks/useNotifications';
import { BRAND_PRIMARY, BRAND_PRIMARY_HOVER } from '../theme/brandColors';

const typeColor = (type) => {
  if (type === 'Stock') return '#EF4444';
  if (type === 'Installment Reminder') return '#DC2626'; // Darker red for highest priority
  if (type === 'Online Order') return '#10B981';
  if (type === 'Auto Message Sent' || type === 'Message') return '#3B82F6';
  if (type === 'Payment') return '#10B981';
  return '#94A3B8';
};

/**
 * Header bell + popover; use in dashboard layout and ecommerce when authenticated.
 */
export default function NotificationsBell({ iconColor = '#94A3B8' }) {
  const [anchor, setAnchor] = useState(null);
  const navigate = useNavigate();
  const { items, isLoading, markAsRead, markAllAsRead } = useNotifications({
    enabled: true
  });

  const [readLiveKeys, setReadLiveKeys] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('read_live_notifications') || '[]');
    } catch {
      return [];
    }
  });

  const open = Boolean(anchor);

  const getLiveKey = (item) => {
    return `${item.type}-${item.message}`;
  };

  const dismissedLive = (() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_live_notifications') || '[]');
    } catch {
      return [];
    }
  })();

  const processedItems = items
    .map(item => {
      if (!item._id) { // live notification
        const key = getLiveKey(item);
        if (readLiveKeys.includes(key)) {
          return { ...item, isRead: true };
        }
      }
      return item;
    })
    .filter(item => {
      if (!item._id && dismissedLive.includes(getLiveKey(item))) {
        return false;
      }
      return !item.isRead;
    }); // Only show unread notifications in dropdown

  const localUnreadCount = processedItems.length;

  const handleNavigate = async (item) => {
    if (item._id && !item.isRead) {
      await markAsRead(item._id);
    } else if (!item._id) {
      const key = getLiveKey(item);
      if (!readLiveKeys.includes(key)) {
        const newLiveKeys = [...readLiveKeys, key];
        setReadLiveKeys(newLiveKeys);
        localStorage.setItem('read_live_notifications', JSON.stringify(newLiveKeys));
      }
    }
    setAnchor(null);
    if (item.actionLink) {
      navigate(item.actionLink);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
    // Also mark all current live notifications as read
    const newLiveKeys = [...readLiveKeys];
    items.forEach(item => {
      if (!item._id) {
        const key = getLiveKey(item);
        if (!newLiveKeys.includes(key)) {
          newLiveKeys.push(key);
        }
      }
    });
    setReadLiveKeys(newLiveKeys);
    localStorage.setItem('read_live_notifications', JSON.stringify(newLiveKeys));
    setAnchor(null); // Close the popover
  };

  return (
    <>
      <IconButton
        aria-label="Notifications"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ color: iconColor, '&:hover': { color: '#1E293B' } }}
      >
        <Badge
          badgeContent={localUnreadCount}
          invisible={localUnreadCount === 0}
          overlap="circular"
          sx={{ '& .MuiBadge-badge': { bgcolor: BRAND_PRIMARY, color: '#fff' } }}
        >
          <NotificationsNoneOutlinedIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 360,
              maxHeight: 420,
              bgcolor: '#FFFFFF',
              border: '1px solid #F5F7FA',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.12)'
            }
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            onClick={() => {
              setAnchor(null);
              navigate('/dashboard/notifications');
            }}
            sx={{ 
              color: '#1E293B', 
              fontWeight: 700, 
              fontSize: '0.95rem', 
              cursor: 'pointer',
              '&:hover': { color: BRAND_PRIMARY, textDecoration: 'underline' } 
            }}
          >
            Notifications
          </Typography>
          <Tooltip title="Mark all as read">
            <IconButton
              size="small"
              onClick={handleMarkAllAsRead}
              sx={{ color: BRAND_PRIMARY }}
            >
              <DoneAllIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Divider sx={{ borderColor: '#F5F7FA' }} />

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} sx={{ color: BRAND_PRIMARY }} />
          </Box>
        ) : processedItems.length === 0 ? (
          <Box sx={{ px: 2, py: 3 }}>
            <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>No notifications</Typography>
          </Box>
        ) : (
          <List dense sx={{ py: 0, maxHeight: 320, overflow: 'auto' }}>
            {processedItems.map((item, idx) => (
              <ListItemButton
                key={item._id || `live-${idx}`}
                onClick={() => handleNavigate(item)}
                  sx={{
                    alignItems: 'flex-start',
                    py: 1.25,
                    borderBottom: '1px solid #E2E8F0',
                    bgcolor: item.isRead 
                      ? 'transparent' 
                      : item.priority >= 10 ? 'rgba(220, 38, 38, 0.08)' : 'rgba(19, 52, 50, 0.12)',
                    borderLeft: item.priority >= 10 && !item.isRead ? '3px solid #DC2626' : '3px solid transparent'
                  }}
              >
                <ListItemText
                  primary={
                    <Typography component="span" sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.82rem' }}>
                      {!item.isRead && '● '}
                      {item.type}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography sx={{ color: '#94A3B8', fontSize: '0.8rem', mt: 0.5, display: 'block' }}>
                        {item.message}
                      </Typography>
                      <Typography sx={{ color: '#64748B', fontSize: '0.7rem', mt: 0.5 }}>{item.time}</Typography>
                    </>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
}
