import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress, Typography, Fade, Paper, Button } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { isSuperAdminPlus, isPathAllowedForSuperAdminPlus, isInvestor, isPathAllowedForInvestor } from '../utils/roleUtils';

const RequireAuth = ({ children }) => {
  console.log('RequireAuth component rendered with children:', children);
  const { user, isAuthenticated, loading, error } = useAuth();
  const location = useLocation();

  console.log('RequireAuth - loading:', loading, 'isAuthenticated:', isAuthenticated, 'error:', error);

  if (loading) {
    // Show beautiful loading screen while checking authentication
    return (
      <Fade in={true} timeout={800}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: 'calc(100vh - 120px)', // adjust for layout padding
            width: '100%',
          }}
        >
          <CircularProgress
            size={45}
            thickness={4}
            sx={{
              color: 'rgb(29, 29, 28)', // Smart Plaza BD logo color
              mb: 3,
              animationDuration: '600ms',
            }}
          />
          <Typography
            variant="h6"
            sx={{
              color: '#334155',
              fontWeight: 600,
              mb: 1,
              letterSpacing: '-0.5px'
            }}
          >
            Loading Workspace
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#64748b',
              fontWeight: 400
            }}
          >
            Please wait while we set things up...
          </Typography>
        </Box>
      </Fade>
    );
  }

  // If there's a fatal authentication error (no token in storage), show login prompt
  const storedToken = localStorage.getItem('token');
  if (error && !isAuthenticated && !storedToken) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: 'red',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div>
          <h3>Authentication Error</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.href = '/admin/login'}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#1D5F99',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    console.log('Redirecting to login from RequireAuth');
    const isEcommerceRoute = location.pathname.startsWith('/shop') || 
                             location.pathname.startsWith('/account') || 
                             location.pathname.startsWith('/orders') || 
                             location.pathname.startsWith('/wishlist');
    return <Navigate to={isEcommerceRoute ? "/shop/login" : "/admin/login"} state={{ from: location }} replace />;
  }

  // Super Admin Plus: restricted to govt-audit modules only
  if (isSuperAdminPlus(user) && !isPathAllowedForSuperAdminPlus(location.pathname)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 200px)',
          p: 3,
        }}
      >
        <Paper sx={{ p: 4, maxWidth: 560, textAlign: 'center' }}>
          <WarningIcon sx={{ fontSize: 48, color: '#DC2626', mb: 2 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
            Access Restricted
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: '#64748b' }}>
            Your account is limited to stock list, retail sales, and e-commerce modules for government review purposes.
          </Typography>
          <Button
            variant="contained"
            onClick={() => { window.location.href = '/dashboard/inventory/list'; }}
            sx={{ backgroundColor: '#1D5F99' }}
          >
            Go to Stock List
          </Button>
        </Paper>
      </Box>
    );
  }

  // Investor: restricted to investors module only
  if (isInvestor(user) && !isPathAllowedForInvestor(location.pathname)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 200px)',
          p: 3,
        }}
      >
        <Paper sx={{ p: 4, maxWidth: 560, textAlign: 'center' }}>
          <WarningIcon sx={{ fontSize: 48, color: '#DC2626', mb: 2 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
            Access Restricted
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: '#64748b' }}>
            Your account is limited to the Investors module.
          </Typography>
          <Button
            variant="contained"
            onClick={() => { window.location.href = '/dashboard/investors/dashboard'; }}
            sx={{ backgroundColor: '#1D5F99' }}
          >
            Go to My Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  // If authenticated, render the children components
  console.log('User is authenticated, rendering protected content');
  return children;
};

export default RequireAuth;