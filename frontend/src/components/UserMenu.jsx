import React, { useState } from 'react';
import {
  Box,
  Menu,
  MenuItem,
  IconButton,
  Avatar,
  Typography,
  Divider,
  Tooltip
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  Settings,
  Person,
  Dashboard,
  Store,
  ShoppingCart,
  CreditCard,
  LocalShipping,
  Payment,
  History
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserMenu = ({ user, currentShop, shops }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const open = Boolean(anchorEl);
  const isSuperAdmin = user?.role === 'Super Admin';

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const handleGeneralSettings = () => {
    handleClose();
    navigate('/dashboard/settings/general');
  };

  const handleDashboard = () => {
    handleClose();
    navigate('/dashboard');
  };


  const menuItemSx = {
    py: 1,
    px: 2,
    fontFamily: '"Outfit", sans-serif',
    '&:hover': {
      backgroundColor: '#f1f5f9'
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Tooltip title="User menu">
        <IconButton
          onClick={handleClick}
          sx={{
            p: 0.25,
            '&:hover': {
              backgroundColor: 'transparent',
            },
          }}
        >
          <Avatar
            sx={{
              width: 30,
              height: 30,
              backgroundColor: '#42A2C2',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: '"Outfit", sans-serif',
              cursor: 'pointer',
              transition: 'box-shadow 0.15s ease',
              '&:hover': {
                boxShadow: '0 0 0 2px #CBD5E1',
              }
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 4,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 6px rgba(0,0,0,0.1))',
            mt: 1,
            minWidth: 240,
            borderRadius: '6px',
            fontFamily: '"Outfit", sans-serif',
            '& .MuiAvatar-root': {
              width: 28,
              height: 28,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 8,
              height: 8,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <Box sx={{
          px: 2,
          py: 1.5,
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #eaeef3'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                backgroundColor: '#1D5F99',
                fontSize: 15,
                fontWeight: 700,
                fontFamily: '"Outfit", sans-serif',
                mr: 1.5
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Typography
                sx={{
                  fontWeight: 600,
                  color: '#1e293b',
                  fontSize: '0.875rem',
                  fontFamily: '"Outfit", sans-serif',
                  lineHeight: 1.3
                }}
              >
                {user?.name || 'User'}
              </Typography>
              <Typography
                sx={{
                  color: '#64748b',
                  textTransform: 'capitalize',
                  fontSize: '0.7rem',
                  fontFamily: '"Outfit", sans-serif',
                  lineHeight: 1.3
                }}
              >
                {user?.role || 'Role'} • {user?.email || 'Email'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 150, overflowY: 'auto' }}>
            {shops && shops.length > 0 ? (
              shops.map(shop => {
                const isCurrent = shop._id === currentShop?._id;
                return (
                  <Box key={shop._id} sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 1,
                    py: 0.5,
                    backgroundColor: isCurrent ? '#e0f2fe' : 'transparent',
                    borderRadius: '4px'
                  }}>
                    <Store sx={{ fontSize: 14, mr: 0.75, color: isCurrent ? '#0284c7' : '#64748b' }} />
                    <Typography
                      sx={{
                        color: isCurrent ? '#0284c7' : '#64748b',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        fontFamily: '"Outfit", sans-serif',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {shop.name}
                    </Typography>
                  </Box>
                );
              })
            ) : currentShop && (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1,
                py: 0.5,
                backgroundColor: '#e0f2fe',
                borderRadius: '4px'
              }}>
                <Store sx={{ fontSize: 14, mr: 0.75, color: '#0284c7' }} />
                <Typography
                  sx={{
                    color: '#0284c7',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    fontFamily: '"Outfit", sans-serif',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {currentShop.name}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Divider sx={{ m: '0 !important' }} />


        {/* Super Admin Only Items */}
        {isSuperAdmin && (
          <MenuItem onClick={handleDashboard} sx={menuItemSx}>
            <Dashboard sx={{ mr: 1.5, color: '#1D5F99', fontSize: 18 }} />
            <Box>
              <Typography sx={{ fontWeight: 500, color: '#1e293b', fontSize: '0.82rem', fontFamily: '"Outfit", sans-serif' }}>
                Dashboard
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.65rem', fontFamily: '"Outfit", sans-serif' }}>
                Go to main dashboard
              </Typography>
            </Box>
          </MenuItem>
        )}

        {isSuperAdmin && (
          <MenuItem onClick={handleGeneralSettings} sx={menuItemSx}>
            <Settings sx={{ mr: 1.5, color: '#1D5F99', fontSize: 18 }} />
            <Box>
              <Typography sx={{ fontWeight: 500, color: '#1e293b', fontSize: '0.82rem', fontFamily: '"Outfit", sans-serif' }}>
                Settings
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.65rem', fontFamily: '"Outfit", sans-serif' }}>
                Manage general settings
              </Typography>
            </Box>
          </MenuItem>
        )}

        {isSuperAdmin && <Divider sx={{ my: '4px !important' }} />}

        <MenuItem
          onClick={handleLogout}
          sx={{
            ...menuItemSx,
            color: '#ef4444',
            '&:hover': {
              backgroundColor: '#fee2e2'
            }
          }}
        >
          <Logout sx={{ mr: 1.5, fontSize: 18 }} />
          <Box>
            <Typography sx={{ fontWeight: 500, fontSize: '0.82rem', fontFamily: '"Outfit", sans-serif' }}>
              Logout
            </Typography>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.65rem', fontFamily: '"Outfit", sans-serif' }}>
              Sign out of your account
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UserMenu;