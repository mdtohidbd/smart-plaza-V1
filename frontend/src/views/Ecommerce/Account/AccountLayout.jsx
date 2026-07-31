import React from 'react';
import { Box, Container, Grid, Paper, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { Person, ShoppingBag, Favorite, LocationOn, Security, Logout, CreditCard, Receipt, LocalShipping } from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import EcommerceLayout from '../../../ecommerce/layout/EcommerceLayout';
import { useAuth } from '../../../context/AuthContext';

const AccountLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); // or get from localStorage
  
  // Fallback to localStorage if auth context is not yet loaded
  const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { icon: <Person />, text: 'My Profile', path: '/shop/account/profile' },
    { icon: <ShoppingBag />, text: 'My Orders', path: '/shop/account/orders' },
    { icon: <LocalShipping />, text: 'Track Order', path: '/shop/account/track-order' },
    { icon: <Favorite />, text: 'Wishlist', path: '/shop/account/wishlist' },
    { icon: <CreditCard />, text: 'EMI Dashboard', path: '/shop/account/emi' },
    { icon: <Receipt />, text: 'Payment History', path: '/shop/account/payments' },
    { icon: <Logout />, text: 'Logout', action: 'logout' },
  ];

  const handleMenuClick = (item) => {
    if (item.action === 'logout') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
      window.location.reload();
    } else {
      navigate(item.path);
    }
  };

  return (
    <EcommerceLayout>
      <Box sx={{ py: { xs: 3, md: 4 }, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
        <Container maxWidth="lg">
          <Typography variant="h5" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, mb: { xs: 2, md: 3 }, color: '#0F172A', textAlign: { xs: 'center', md: 'left' } }}>
            My Account
          </Typography>
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {/* Sidebar Navigation */}
            <Grid item xs={12} md={3.5} lg={3}>
              <Paper sx={{ 
                borderRadius: '12px', 
                border: '1px solid #E2E8F0', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                bgcolor: '#FFFFFF',
                overflow: 'hidden',
                pb: 2
              }}>
                <Box sx={{ p: { xs: 2, md: 2.5 }, borderBottom: '1px dashed #E2E8F0', textAlign: 'center' }}>
                  <Box sx={{ 
                    width: { xs: 56, md: 64 }, height: { xs: 56, md: 64 }, 
                    borderRadius: '50%', 
                    bgcolor: '#0F172A', 
                    color: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    mx: 'auto', mb: 1.5,
                    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.2)'
                  }}>
                    <Typography variant="h5" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                      {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }} noWrap>
                    {currentUser?.name || 'User'}
                  </Typography>
                  <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#64748B' }} noWrap>
                    {currentUser?.email || 'email@example.com'}
                  </Typography>
                </Box>
                <List sx={{ pt: 1.5, px: 1.5 }}>
                  {menuItems.map((item) => {
                    const isActive = item.path && (location.pathname === item.path || (item.path !== '/shop/account/profile' && location.pathname.startsWith(item.path)));
                    return (
                      <ListItem 
                        button 
                        key={item.text}
                        onClick={() => handleMenuClick(item)}
                        sx={{
                          py: 1.2,
                          px: 2,
                          mb: 0.5,
                          borderRadius: '8px',
                          bgcolor: isActive ? '#F0FDFA' : 'transparent',
                          color: isActive ? '#0D9488' : '#475569',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: isActive ? '#F0FDFA' : '#F8FAFC',
                            color: isActive ? '#0D9488' : '#0F172A'
                          }
                        }}
                      >
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                          {React.cloneElement(item.icon, { sx: { fontSize: '1.25rem' } })}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.text} 
                          primaryTypographyProps={{ 
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: isActive ? 600 : 500,
                            fontSize: '0.9rem'
                          }} 
                        />
                      </ListItem>
                    )
                  })}
                </List>
              </Paper>
            </Grid>

            {/* Main Content Area (Outlet) */}
            <Grid item xs={12} md={8.5} lg={9}>
              <Box sx={{ animation: 'fadeIn 0.4s ease-out', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(5px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
                <Outlet />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </EcommerceLayout>
  );
};

export default AccountLayout;
