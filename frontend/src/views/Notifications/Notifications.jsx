import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MessageIcon from '@mui/icons-material/Message';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PaymentIcon from '@mui/icons-material/Payment';
import { useNotifications } from '../../hooks/useNotifications';
import { BRAND_PRIMARY } from '../../theme/brandColors';

const typeColor = (type) => {
  if (type === 'Stock') return '#EF4444';
  if (type === 'Installment Reminder') return '#DC2626'; // Darker red for highest priority
  if (type === 'Online Order') return '#10B981';
  if (type === 'Auto Message Sent' || type === 'Message') return '#3B82F6';
  if (type === 'Payment') return '#10B981';
  return '#94A3B8';
};

const getNotificationIcon = (type) => {
  if (type === 'Stock') return <WarningAmberIcon sx={{ color: '#EF4444' }} />;
  if (type === 'Installment Reminder') return <ErrorOutlineIcon sx={{ color: '#DC2626' }} />;
  if (type === 'Online Order') return <ShoppingCartIcon sx={{ color: '#10B981' }} />;
  if (type === 'Auto Message Sent' || type === 'Message') return <MessageIcon sx={{ color: '#3B82F6' }} />;
  if (type === 'Payment') return <PaymentIcon sx={{ color: '#10B981' }} />;
  if (type === 'Offer') return <LocalOfferIcon sx={{ color: '#10B981' }} />;
  return <NotificationsIcon sx={{ color: '#94A3B8' }} />;
};

const Notifications = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const { items, isLoading, error, markAsRead, markAllAsRead, removeNotification } = useNotifications({
    enabled: true
  });

  const [readLiveKeys, setReadLiveKeys] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('read_live_notifications') || '[]');
    } catch {
      return [];
    }
  });

  const getLiveKey = (item) => {
    return `${item.type}-${item.message}`;
  };

  const processedItems = items.map(item => {
    if (!item._id) { // live notification
      const key = getLiveKey(item);
      if (readLiveKeys.includes(key)) {
        return { ...item, isRead: true };
      }
    }
    return item;
  });

  const filteredItems = processedItems.filter(item => {
    if (filter === 'unread') return !item.isRead;
    if (filter === 'read') return item.isRead;
    return true;
  });

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
    if (item.actionLink) {
      navigate(item.actionLink);
    }
  };

  const handleMarkAsRead = async (e, item) => {
    e.stopPropagation();
    if (item._id) {
      await markAsRead(item._id);
    } else {
      const key = getLiveKey(item);
      if (!readLiveKeys.includes(key)) {
        const newLiveKeys = [...readLiveKeys, key];
        setReadLiveKeys(newLiveKeys);
        localStorage.setItem('read_live_notifications', JSON.stringify(newLiveKeys));
      }
    }
  };

  const handleDelete = async (e, item) => {
    e.stopPropagation();
    if (item._id) {
      await removeNotification(item._id);
    } else {
      // For live notifications, we just add it to a dismissed list
      const key = getLiveKey(item);
      const dismissed = JSON.parse(localStorage.getItem('dismissed_live_notifications') || '[]');
      if (!dismissed.includes(key)) {
        dismissed.push(key);
        localStorage.setItem('dismissed_live_notifications', JSON.stringify(dismissed));
        // Force state update to re-render
        setReadLiveKeys([...readLiveKeys]);
      }
    }
  };

  // Filter out dismissed live notifications
  const dismissedLive = (() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_live_notifications') || '[]');
    } catch {
      return [];
    }
  })();

  const visibleItems = filteredItems.filter(item => {
    if (!item._id) {
      return !dismissedLive.includes(getLiveKey(item));
    }
    return true;
  });

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
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
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Error loading notifications: {error.message}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 3 }, backgroundColor: '#F8FAFC', minHeight: '85vh' }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2.5,
              mb: 2,
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ color: '#1E293B', fontWeight: 700, fontFamily: '"Outfit", sans-serif', fontSize: '1.5rem', mb: 0.5 }}>
                Notifications
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', fontFamily: '"Outfit", sans-serif' }}>
                View and manage all your system messages and alerts.
              </Typography>
            </Box>
            {visibleItems.some(i => !i.isRead) && (
              <Button
                variant="contained"
                startIcon={<DoneAllIcon />}
                onClick={handleMarkAllAsRead}
                sx={{
                  backgroundColor: BRAND_PRIMARY,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: BRAND_PRIMARY
                  }
                }}
              >
                Mark all as read
              </Button>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper
            sx={{
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: '#FFFFFF' }}>
              <Tabs
                value={filter}
                onChange={(e, val) => setFilter(val)}
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    minWidth: 100,
                    color: '#64748B',
                    '&.Mui-selected': {
                      color: BRAND_PRIMARY
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: BRAND_PRIMARY
                  }
                }}
              >
                <Tab label="All" value="all" />
                <Tab label={`Unread (${visibleItems.filter(i => !i.isRead).length})`} value="unread" />
                <Tab label="Read" value="read" />
              </Tabs>
            </Box>

            {visibleItems.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center', bgcolor: '#FFFFFF' }}>
                <NotificationsIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1.5 }} />
                <Typography sx={{ color: '#64748B', fontWeight: 500 }}>
                  No notifications found
                </Typography>
              </Box>
            ) : (
              <List sx={{ py: 0, bgcolor: '#FFFFFF' }}>
                {visibleItems.map((item, idx) => (
                  <React.Fragment key={item._id || `live-page-${idx}`}>
                    {idx > 0 && <Divider sx={{ borderColor: '#F1F5F9' }} />}
                    <ListItemButton
                      onClick={() => handleNavigate(item)}
                      sx={{
                        p: 2.5,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2,
                        bgcolor: item.isRead 
                          ? 'transparent' 
                          : item.priority >= 10 ? 'rgba(220, 38, 38, 0.08)' : 'rgba(19, 52, 50, 0.04)',
                        borderLeft: item.priority >= 10 && !item.isRead ? '4px solid #DC2626' : '4px solid transparent',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          bgcolor: item.isRead 
                            ? '#F8FAFC' 
                            : item.priority >= 10 ? 'rgba(220, 38, 38, 0.12)' : 'rgba(19, 52, 50, 0.08)'
                        }
                      }}
                    >
                      <Box sx={{
                        p: 1,
                        borderRadius: '10px',
                        bgcolor: item.isRead ? '#F1F5F9' : 'rgba(19, 52, 50, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {getNotificationIcon(item.type)}
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                            {item.type}
                          </Typography>
                          {!item.isRead && (
                            <Chip
                              label="New"
                              size="small"
                              sx={{
                                height: '20px',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: BRAND_PRIMARY,
                                color: '#FFFFFF'
                              }}
                            />
                          )}
                        </Box>
                        <Typography variant="body2" sx={{ color: '#475569', mb: 1, lineHeight: 1.5 }}>
                          {item.message}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500 }}>
                          {item.time}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, alignSelf: 'center' }}>
                        {!item.isRead && (
                          <Tooltip title="Mark as read">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMarkAsRead(e, item)}
                              sx={{ color: '#64748B', '&:hover': { color: BRAND_PRIMARY } }}
                            >
                              <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={(e) => handleDelete(e, item)}
                            sx={{ color: '#64748B', '&:hover': { color: '#EF4444' } }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemButton>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Notifications;
