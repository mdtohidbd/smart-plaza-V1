import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import UserMenu from '../components/UserMenu';
import NotificationsBell from '../components/NotificationsBell';
import CreateShopModal from '../components/CreateShopModal';
import { useAuth } from '../context/AuthContext';
import { isInvestor, isSalesStaff } from '../utils/roleUtils';

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.leavingScreen,
  }),
  backgroundColor: '#FFFFFF',
  color: theme.palette.text.primary,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiToolbar-root': {
    minHeight: '64px !important',
    height: 64,
    paddingLeft: 24,
    paddingRight: 24,
  },
}));

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const TopBar = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const { user, shops, activeShop, switchShop, fetchShops } = useAuth();

  const [anchorElShop, setAnchorElShop] = useState(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);

  // Toast notification state for shop switch feedback
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const handleOpenShopMenu = (event) => {
    setAnchorElShop(event.currentTarget);
  };

  const handleCloseShopMenu = () => {
    setAnchorElShop(null);
  };

  const handleSelectShop = async (shop) => {
    handleCloseShopMenu();
    if (activeShop?._id !== shop._id) {
      const res = await switchShop(shop);
      if (res?.success) {
        setToast({
          open: true,
          message: `Switched active shop to "${shop.name}"`,
          severity: 'success'
        });
      }
    }
  };

  const handleOpenCreateModal = () => {
    handleCloseShopMenu();
    setOpenCreateModal(true);
  };

  const handleManageShops = () => {
    handleCloseShopMenu();
    navigate('/dashboard/settings/shops');
  };

  return (
    <>
      <AppBar position="fixed" open={open}>
        <Toolbar sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={() => setOpen(!open)}
            edge="start"
            sx={{
              mr: { xs: 1, sm: 2 },
              color: '#64748B',
              p: 1,
              '& .MuiSvgIcon-root': { fontSize: '1.4rem' }
            }}
          >
            <MenuIcon />
          </IconButton>
          <Logo 
            variant="admin"
            height={38}
            fontSize="1.1rem"
            color="#1E293B"
            sx={{ mr: 2 }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, ml: 'auto' }}>
            {/* TopBar Multi-Shop Switcher Dropdown */}
            {!isInvestor(user) && (
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Button
                  onClick={handleOpenShopMenu}
                  startIcon={<StorefrontIcon sx={{ color: '#0F766E' }} />}
                  endIcon={<KeyboardArrowDownIcon sx={{ color: '#64748B', transition: 'transform 0.3s ease', transform: Boolean(anchorElShop) ? 'rotate(180deg)' : 'rotate(0deg)' }} />}
                  sx={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    px: 2.5,
                    py: 1,
                    textTransform: 'none',
                    color: '#1E293B',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: '#F8FAFC',
                      borderColor: '#CBD5E1',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  {activeShop ? activeShop.name : 'Select Branch'}
                </Button>

                <Menu
                  anchorEl={anchorElShop}
                  open={Boolean(anchorElShop)}
                  onClose={handleCloseShopMenu}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      mt: 2,
                      minWidth: 280,
                      borderRadius: '20px',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      py: 0,
                      overflow: 'hidden',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    }
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(241, 245, 249, 0.8)' }}>
                    <Typography variant="caption" fontWeight={700} color="#64748B" sx={{ textTransform: 'uppercase', letterSpacing: 1.2, fontSize: '0.7rem' }}>
                      Select a branch
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Create New Branch" placement="top" arrow>
                        <IconButton
                          onClick={handleOpenCreateModal}
                          size="small"
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: '#F0FDFA',
                            color: '#0D9488',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': { bgcolor: '#CCFBF1', transform: 'scale(1.1)' }
                          }}
                        >
                          <AddIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Manage Branches" placement="top" arrow>
                        <IconButton
                          onClick={handleManageShops}
                          size="small"
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: '#EEF2FF',
                            color: '#4338CA',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': { bgcolor: '#E0E7FF', transform: 'scale(1.1)' }
                          }}
                        >
                          <SettingsIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <Box sx={{ p: 1, maxHeight: 300, overflowY: 'auto' }}>
                    {shops && shops.length > 0 ? (
                      shops.map((shop) => {
                        const isSelected = activeShop?._id === shop._id;
                        return (
                          <MenuItem
                            key={shop._id}
                            onClick={() => handleSelectShop(shop)}
                            selected={isSelected}
                            sx={{
                              py: 1.5,
                              px: 2,
                              mb: 0.5,
                              borderRadius: '12px',
                              transition: 'all 0.2s ease-in-out',
                              '&.Mui-selected': {
                                backgroundColor: '#F0FDFA',
                                '&:hover': {
                                  backgroundColor: '#CCFBF1',
                                }
                              },
                              '&:hover': {
                                backgroundColor: '#F8FAFC',
                                transform: 'translateX(4px)'
                              },
                              '&:last-child': {
                                mb: 0
                              }
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 40, color: isSelected ? '#0D9488' : '#94A3B8' }}>
                              <StorefrontIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={shop.name} 
                              primaryTypographyProps={{ 
                                fontSize: '0.875rem', 
                                fontWeight: isSelected ? 600 : 500,
                                color: isSelected ? '#0F766E' : '#334155' 
                              }} 
                            />
                            {isSelected && <CheckIcon fontSize="small" sx={{ color: '#0D9488', ml: 1 }} />}
                          </MenuItem>
                        );
                      })
                    ) : (
                      <MenuItem disabled sx={{ py: 2, justifyContent: 'center' }}>
                        <ListItemText primary="No branches available" primaryTypographyProps={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem' }} />
                      </MenuItem>
                    )}
                  </Box>
                </Menu>
              </Box>
            )}

            {user && !isSalesStaff(user) && <NotificationsBell />}
            <UserMenu user={user} />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Create Shop Modal */}
      <CreateShopModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onSuccess={async (newShop) => {
          await fetchShops();
          if (newShop) {
            await switchShop(newShop);
          }
        }}
      />

      {/* Active Shop Switch Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%', fontWeight: 600, borderRadius: '10px' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TopBar;
