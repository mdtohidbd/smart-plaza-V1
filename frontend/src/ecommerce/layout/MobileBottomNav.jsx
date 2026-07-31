import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Badge, ButtonBase } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HomeOutlined as HomeIcon,
  StorefrontOutlined as StoreIcon,
  CategoryOutlined as CategoryIcon,
  ShoppingCartOutlined as CartIcon,
  PersonOutlineOutlined as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    updateCartCount();
    const handleStorageChange = () => updateCartCount();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('ecommerceCart') || '[]');
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  };

  const handleToggleDrawer = () => {
    window.dispatchEvent(new CustomEvent('toggle-mobile-drawer'));
  };

  const handleOpenCart = () => {
    window.dispatchEvent(new CustomEvent('open-cart-drawer'));
  };

  const isStaffUser = ['Super Admin', 'Admin', 'Manager', 'SR', 'DSR', 'Investor'].includes(user?.role);

  const handleProfileClick = () => {
    if (isAuthenticated) {
      if (isStaffUser) {
        window.location.href = '/dashboard';
      } else {
        navigate('/shop/account/profile');
      }
    } else {
      navigate('/shop/login');
    }
  };

  const navItems = [
    {
      label: 'Home',
      icon: <HomeIcon />,
      active: location.pathname === '/' || location.pathname === '/shop',
      onClick: () => navigate('/')
    },
    {
      label: 'Shop',
      icon: <StoreIcon />,
      active: location.pathname.startsWith('/shop/products'),
      onClick: () => navigate('/shop/products')
    },
    {
      label: 'Categories',
      icon: <CategoryIcon />,
      active: false,
      isCenterpiece: true,
      onClick: handleToggleDrawer
    },
    {
      label: 'Cart',
      icon: (
        <Badge
          badgeContent={cartCount}
          sx={{
            '& .MuiBadge-badge': {
              bgcolor: '#14B8A6',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 800,
              minWidth: 16,
              height: 16,
              border: '1.5px solid #fff'
            }
          }}
        >
          <CartIcon />
        </Badge>
      ),
      active: false,
      onClick: handleOpenCart
    },
    {
      label: 'Profile',
      icon: <PersonIcon />,
      active: location.pathname.startsWith('/shop/account') || location.pathname.startsWith('/shop/login'),
      onClick: handleProfileClick
    }
  ];

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        display: { xs: 'flex', md: 'none' },
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 64,
        bgcolor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(226, 232, 240, 0.8)',
        borderRadius: 0,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.04)',
        pb: 'env(safe-area-inset-bottom)' // support iPhone safe area bottom notch
      }}
    >
      {navItems.map((item, index) => {
        if (item.isCenterpiece) {
          return (
            <Box
              key={index}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                flex: 1,
                height: '100%',
                position: 'relative',
                pb: 1 // Padding to push text slightly up from bottom
              }}
            >
              <ButtonBase
                onClick={item.onClick}
                disableRipple
                sx={{
                  position: 'absolute',
                  top: -24, // Pop out of the nav bar
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #14B8A6 0%, #0ea5e9 100%)', // Vibrant gradient
                  color: '#fff',
                  boxShadow: '0 8px 24px rgba(20, 184, 166, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  zIndex: 2,
                  '&:active': {
                    transform: 'translateX(-50%) scale(0.92)',
                    boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)',
                  },
                  '& svg': {
                    fontSize: '1.8rem',
                    color: '#fff'
                  }
                }}
              >
                {item.icon}
              </ButtonBase>
              <Typography
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  fontFamily: 'Inter, sans-serif',
                  color: '#0d9488',
                  letterSpacing: '0.01em',
                  mt: 'auto',
                }}
              >
                {item.label}
              </Typography>
            </Box>
          );
        }

        return (
          <ButtonBase
            key={index}
            onClick={item.onClick}
            disableRipple
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: '100%',
              color: item.active ? '#14B8A6' : '#64748B',
              transition: 'color 0.2s ease',
              '&:active': {
                transform: 'scale(0.96)'
              }
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 0.4,
                transition: 'transform 0.2s ease',
                transform: item.active ? 'translateY(-2px)' : 'none',
                '& svg': {
                  fontSize: '1.45rem',
                  color: item.active ? '#14B8A6' : '#64748B'
                }
              }}
            >
              {item.icon}
            </Box>
            <Typography
              sx={{
                fontSize: '0.68rem',
                fontWeight: item.active ? 700 : 500,
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.01em',
                transition: 'font-weight 0.2s ease'
              }}
            >
              {item.label}
            </Typography>
          </ButtonBase>
        );
      })}
    </Paper>
  );
};

export default MobileBottomNav;
