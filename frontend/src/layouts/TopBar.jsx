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

const TopBar = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const { user, shops, activeShop, switchShop, fetchShops } = useAuth();

  const [anchorElShop, setAnchorElShop] = useState(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);

  const handleOpenShopMenu = (event) => {
    setAnchorElShop(event.currentTarget);
  };

  const handleCloseShopMenu = () => {
    setAnchorElShop(null);
  };

  const handleSelectShop = async (shop) => {
    handleCloseShopMenu();
    if (activeShop?._id !== shop._id) {
      await switchShop(shop);
    }
  };

  const handleOpenCreateModal = () => {
    handleCloseShopMenu();
    setOpenCreateModal(true);
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

          {/* TopBar Multi-Shop Switcher Dropdown */}
          {!isInvestor(user) && (
            <Box sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
              <Button
                onClick={handleOpenShopMenu}
                startIcon={<StorefrontIcon sx={{ color: '#14B8A6' }} />}
                endIcon={<KeyboardArrowDownIcon sx={{ color: '#64748B' }} />}
                sx={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  px: 2,
                  py: 0.75,
                  textTransform: 'none',
                  color: '#1E293B',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  '&:hover': {
                    backgroundColor: '#F1F5F9',
                    borderColor: '#CBD5E1'
                  }
                }}
              >
                {activeShop ? activeShop.name : 'Select Shop'}
              </Button>

              <Menu
                anchorEl={anchorElShop}
                open={Boolean(anchorElShop)}
                onClose={handleCloseShopMenu}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    mt: 1,
                    minWidth: 220,
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    py: 0.5
                  }
                }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="caption" fontWeight={700} color="#94A3B8" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Select Active Shop
                  </Typography>
                </Box>

                {shops && shops.length > 0 ? (
                  shops.map((shop) => {
                    const isSelected = activeShop?._id === shop._id;
                    return (
                      <MenuItem
                        key={shop._id}
                        onClick={() => handleSelectShop(shop)}
                        selected={isSelected}
                        sx={{
                          py: 1,
                          px: 2,
                          mx: 0.5,
                          borderRadius: '8px',
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(20, 184, 166, 0.08)',
                            color: '#14B8A6',
                            fontWeight: 600
                          }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 32, color: isSelected ? '#14B8A6' : '#64748B' }}>
                          <StorefrontIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={shop.name} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isSelected ? 600 : 500 }} />
                        {isSelected && <CheckIcon fontSize="small" sx={{ color: '#14B8A6', ml: 1 }} />}
                      </MenuItem>
                    );
                  })
                ) : (
                  <MenuItem disabled>
                    <ListItemText primary="No shops available" />
                  </MenuItem>
                )}

                <Divider sx={{ my: 1 }} />

                <MenuItem
                  onClick={handleOpenCreateModal}
                  sx={{
                    py: 1,
                    px: 2,
                    mx: 0.5,
                    borderRadius: '8px',
                    color: '#14B8A6',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'rgba(20, 184, 166, 0.08)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: '#14B8A6' }}>
                    <AddIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Create New Shop" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} />
                </MenuItem>
              </Menu>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, ml: 'auto' }}>
            {!isInvestor(user) && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ShoppingCartIcon />}
                  onClick={() => navigate('/shop/products')}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    borderColor: '#14B8A6',
                    color: '#14B8A6',
                    px: 2,
                    py: 0.5,
                    '&:hover': {
                      borderColor: '#0D9488',
                      backgroundColor: 'rgba(20, 184, 166, 0.04)',
                    },
                    display: { xs: 'none', md: 'inline-flex' }
                  }}
                >
                  Go Back to E-commerce
                </Button>
                <Tooltip title="Go Back to E-commerce">
                  <IconButton
                    color="primary"
                    onClick={() => navigate('/shop/products')}
                    sx={{
                      color: '#14B8A6',
                      display: { xs: 'inline-flex', md: 'none' },
                      border: '1px solid rgba(20, 184, 166, 0.5)',
                      borderRadius: '8px',
                      p: 1
                    }}
                  >
                    <ShoppingCartIcon sx={{ fontSize: '1.2rem' }} />
                  </IconButton>
                </Tooltip>
              </>
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
    </>
  );
};

export default TopBar;
