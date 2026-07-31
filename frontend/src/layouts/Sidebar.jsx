import React, { useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import Tooltip from '@mui/material/Tooltip';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMenu } from '../hooks/useMenu';

export const drawerWidth = 260;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

export const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 0.5),
  minHeight: '48px !important',
  height: 48,
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  width: open ? drawerWidth : `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: open ? drawerWidth : `calc(${theme.spacing(8)} + 1px)`,
  },
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  '& .MuiDrawer-paper': {
    ...(open ? openedMixin(theme) : closedMixin(theme)),
    backgroundColor: '#FFFFFF',
    borderRight: `1px solid ${theme.palette.divider}`,
    boxShadow: 'none',
    padding: '12px 0',
  },
}));

const Sidebar = ({ open, setOpen, isMobile }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { getMenuItems } = useMenu();
  const [expandedMenu, setExpandedMenu] = useState(null);

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const toggleMenu = (menuName) => {
    setExpandedMenu(expandedMenu === menuName ? null : menuName);
  };

  const handleNavigation = (path) => {
    console.log('Sidebar - Navigating to:', path);
    navigate(path);
    // Close drawer only on mobile (when it's in temporary mode)
    if (isMobile) {
      setOpen(false);
    }
  };

  const isItemActive = (item) => {
    if (item.path) {
      if (item.path === '/dashboard') return location.pathname === '/dashboard';
      if (location.pathname === item.path) return true;
      if (!item.exactMatch && location.pathname.startsWith(item.path + '/')) return true;
    }
    if (item.subItems) {
      return item.subItems.some(sub => isItemActive(sub));
    }
    return false;
  };

  const renderMenuItems = (items) => {
    return items.map((item) => {
      if (item.subItems) {
        const isExpanded = expandedMenu === item.text;
        const parentActive = isItemActive(item);
        return (
          <div key={item.text}>
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
              <Tooltip title={!open ? item.text : ''} placement="right" arrow>
                <ListItemButton
                  selected={parentActive}
                  onClick={() => {
                    if (!open) {
                      setOpen(true);
                      if (item.subItems) {
                        setExpandedMenu(item.text);
                      }
                    } else {
                      toggleMenu(item.text);
                    }
                  }}
                  sx={{
                    minHeight: 40,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2,
                    py: 1,
                    borderRadius: '8px',
                    margin: '4px 12px',
                    color: '#64748B',
                    transition: 'all 0.2s ease',
                    '& .MuiListItemIcon-root': {
                      color: '#64748B',
                      transition: 'color 0.2s ease',
                    },
                    '& .MuiListItemText-primary': {
                      color: '#64748B',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                    },
                    '&:hover': {
                      backgroundColor: '#F0F2F5',
                      color: theme.palette.primary.main,
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                      },
                      '& .MuiListItemText-primary': {
                        color: theme.palette.primary.main,
                      },
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(20, 184, 166, 0.08)',
                      color: theme.palette.primary.main,
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                      },
                      '& .MuiListItemText-primary': {
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                      },
                    },
                    '&.Mui-selected:hover': {
                      backgroundColor: 'rgba(20, 184, 166, 0.12)',
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 1.5 : 'auto',
                      justifyContent: 'center',
                      color: '#64748B',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      '& .MuiSvgIcon-root': { fontSize: '1.1rem' },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      opacity: open ? 1 : 0,
                      margin: 0,
                      padding: 0,
                    }}
                  />
                  {open && (isExpanded ? <ExpandLess sx={{ color: '#64748B' }} /> : <ExpandMore sx={{ color: '#64748B' }} />)}

                </ListItemButton>
              </Tooltip>
            </ListItem>
            <Collapse in={isExpanded && open} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {item.subItems.map((subItem) => {
                  const subActive = isItemActive(subItem);
                  return (
                    <ListItemButton
                      key={subItem.text}
                      selected={subActive}
                      sx={{
                        pl: open ? 5.5 : 1.5,
                        minHeight: 36,
                        justifyContent: 'initial',
                        px: 2,
                        py: 0.75,
                        borderRadius: '8px',
                        margin: '2px 12px 2px 20px',
                        color: '#94A3B8',
                        transition: 'all 0.2s ease',
                        '& .MuiListItemText-primary': {
                          color: '#94A3B8',
                          fontWeight: 400,
                          fontSize: '0.8125rem',
                        },
                        '&:hover': {
                          backgroundColor: '#F0F2F5',
                          color: '#1E293B',
                          '& .MuiListItemText-primary': {
                            color: '#1E293B',
                          }
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(20, 184, 166, 0.08)',
                          color: '#14B8A6',
                          '& .MuiListItemText-primary': {
                            color: '#14B8A6',
                            fontWeight: 500,
                          },
                        },
                        '&.Mui-selected:hover': {
                          backgroundColor: 'rgba(20, 184, 166, 0.12)',
                        }
                      }}
                      onClick={() => handleNavigation(subItem.path)}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 20,
                          color: 'inherit',
                        }}
                      >
                        <Box sx={{
                          width: 3,
                          height: 3,
                          borderRadius: '50%',
                          backgroundColor: 'currentColor',
                          opacity: 0.5
                        }} />
                      </ListItemIcon>
                      <ListItemText
                        sx={{
                          opacity: 1,
                          margin: 0,
                          padding: 0,
                        }}
                        primary={subItem.text}
                      />
                    </ListItemButton>
                  )
                })}
              </List>
            </Collapse>
          </div>
        );
      } else {
        const itemActive = isItemActive(item);
        return (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <Tooltip title={!open ? item.text : ''} placement="right" arrow>
              <ListItemButton
                selected={itemActive}
                sx={{
                  minHeight: 40,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2,
                  py: 1,
                  borderRadius: '8px',
                  margin: '4px 12px',
                  color: '#64748B',
                  transition: 'all 0.2s ease',
                  '& .MuiListItemIcon-root': {
                    color: '#64748B',
                    transition: 'color 0.2s ease',
                  },
                  '& .MuiListItemText-primary': {
                    color: '#64748B',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                  },
                  '&:hover': {
                    backgroundColor: '#F0F2F5',
                    color: '#14B8A6',
                    '& .MuiListItemIcon-root': {
                      color: '#14B8A6',
                    },
                    '& .MuiListItemText-primary': {
                      color: '#14B8A6',
                    },
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(20, 184, 166, 0.1)',
                    color: '#14B8A6',
                    '& .MuiListItemIcon-root': {
                      color: '#14B8A6',
                    },
                    '& .MuiListItemText-primary': {
                      color: '#14B8A6',
                      fontWeight: 600,
                    },
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: 'rgba(20, 184, 166, 0.15)',
                  }
                }}
                onClick={() => handleNavigation(item.path)}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 1.5 : 'auto',
                    justifyContent: 'center',
                    color: 'inherit',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    '& .MuiSvgIcon-root': { fontSize: '1.1rem' },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    opacity: open ? 1 : 0,
                    margin: 0,
                    padding: 0,
                  }}
                />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        );
      }
    });
  };

  const logoutButton = (
    <ListItem disablePadding sx={{ display: 'block' }}>
      <Tooltip title={open ? '' : "Logout"} placement="right" arrow>
        <ListItemButton
          sx={{
            minHeight: 44,
            justifyContent: open ? 'initial' : 'center',
            px: 2.5,
            mx: 1.5,
            borderRadius: '10px',
            color: '#64748B',
            '&:hover': {
              backgroundColor: 'rgba(239, 68, 68, 0.06)',
              color: '#EF4444',
              '& .MuiListItemIcon-root': { color: '#EF4444' }
            }
          }}
          onClick={logout}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: open ? 2 : 'auto',
              justifyContent: 'center',
              color: 'inherit',
            }}
          >
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            sx={{
              opacity: open ? 1 : 0,
              '& .MuiTypography-root': { fontWeight: 600, fontSize: '0.875rem' }
            }}
          />
        </ListItemButton>
      </Tooltip>
    </ListItem>
  );

  if (isMobile) {
    return (
      <MuiDrawer
        variant="temporary"
        open={open}
        onClose={handleDrawerClose}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E2E8F0',
            padding: '12px 0',
          },
        }}
      >
        <DrawerHeader
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: 1,
            minHeight: '64px !important',
          }}
        >
          <IconButton onClick={handleDrawerClose} sx={{ color: '#64748B' }}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider sx={{ borderColor: '#E2E8F0' }} />
        <List sx={{ py: 1 }}>
          {renderMenuItems(getMenuItems())}
        </List>
        <Divider sx={{ borderColor: '#E2E8F0' }} />
        <List sx={{ py: 1 }}>
          {logoutButton}
        </List>
      </MuiDrawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        display: { xs: 'none', sm: 'block' },
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: open ? drawerWidth : `calc(${theme.spacing(8)} + 1px)`,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }),
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
        },
      }}
    >
      <DrawerHeader
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: 1,
          minHeight: '64px !important',
        }}
      >
        {open && (
          <IconButton onClick={handleDrawerClose} sx={{ color: '#64748B' }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </DrawerHeader>
      <Divider sx={{ borderColor: '#E2E8F0' }} />
      <List sx={{ py: 1 }}>
        {renderMenuItems(getMenuItems())}
      </List>
      <Divider sx={{ borderColor: '#E2E8F0' }} />
      <List sx={{ py: 1 }}>
        {logoutButton}
      </List>
    </Drawer>
  );
};

export default Sidebar;
