import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Paper, Button } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { isSuperAdminPlus, isPathAllowedForSuperAdminPlus, hasSuperAdminPlusPermission, isInvestor, isPathAllowedForInvestor, hasInvestorPermission } from '../utils/roleUtils';

/**
 * RequirePermission Component
 * 
 * Restricts access to routes based on user role and permissions.
 * 
 * @param {React.ReactNode} children - Child components to render if authorized
 * @param {string[]} allowedRoles - Array of roles that can access this route
 * @param {string} module - Permission module name (e.g., 'users', 'reports')
 * @param {string} action - Permission action (e.g., 'read', 'create', 'update', 'delete')
 */
const RequirePermission = ({ 
  children, 
  allowedRoles = [], 
  module = null, 
  action = 'read' 
}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Check if user is authenticated first
  if (!isAuthenticated) {
    const isEcommerceRoute = location.pathname.startsWith('/shop') || 
                             location.pathname.startsWith('/account') || 
                             location.pathname.startsWith('/orders') || 
                             location.pathname.startsWith('/wishlist');
    return <Navigate to={isEcommerceRoute ? "/shop/login" : "/admin/login"} state={{ from: location }} replace />;
  }

  // Check if user role is in allowed roles
  if (allowedRoles && allowedRoles.length > 0) {
    // Super Admin has access to everything
    if (user?.role === 'Super Admin') {
      return children;
    }
    
    if (!allowedRoles.includes(user?.role)) {
      return (
        <AccessDenied 
          title="Access Denied"
          message={`You don't have permission to access this page. This feature is restricted to ${allowedRoles.join(', ')} roles.`}
          userRole={user?.role}
          allowedRoles={allowedRoles}
        />
      );
    }
  }

  // Check permissions if module and action are provided
  if (module && action) {
    // Super Admin has all permissions automatically
    if (user?.role === 'Super Admin') {
      return children;
    }

    // Super Admin Plus: full access within allowed modules on allowed routes
    if (
      isSuperAdminPlus(user) &&
      isPathAllowedForSuperAdminPlus(location.pathname) &&
      hasSuperAdminPlusPermission(module)
    ) {
      return children;
    }

    // Investor: read access within allowed modules on allowed routes
    if (
      isInvestor(user) &&
      isPathAllowedForInvestor(location.pathname) &&
      hasInvestorPermission(module)
    ) {
      return children;
    }
    
    const hasPermission = user?.permissions?.[module]?.[action];
    
    if (!hasPermission) {
      return (
        <AccessDenied 
          title="Permission Required"
          message={`You need "${action}" permission for "${module}" to access this feature. Please contact your administrator.`}
          userRole={user?.role}
          requiredPermission={`${module}.${action}`}
        />
      );
    }
  }

  // User has proper authorization, render the protected content
  return children;
};

/**
 * AccessDenied Component
 * 
 * Displays a friendly error message when users try to access restricted areas.
 */
const AccessDenied = ({ title, message, userRole, allowedRoles, requiredPermission }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 200px)',
        p: 3,
        backgroundColor: '#F8FAFC'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
          border: '1px solid #e0e0e0',
          borderRadius: 2
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            width: 80,
            height: 80,
            mx: 'auto',
            mb: 2,
            backgroundColor: '#FEF2F2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <WarningIcon sx={{ fontSize: 48, color: '#DC2626' }} />
        </Box>

        {/* Title */}
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: '#1D5F99' }}>
          {title}
        </Typography>

        {/* Message */}
        <Typography variant="body1" sx={{ mb: 3, color: '#64748b', lineHeight: 1.6 }}>
          {message}
        </Typography>

        {/* User Info */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: '#F8FAFC',
            borderColor: '#E2E8F0'
          }}
        >
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#475569' }}>
            Your Current Access:
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Role: <strong sx={{ color: '#1D5F99' }}>{userRole || 'Unknown'}</strong>
          </Typography>
          {allowedRoles && (
            <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
              Required Role(s): <strong sx={{ color: '#1D5F99' }}>{allowedRoles.join(', ')}</strong>
            </Typography>
          )}
          {requiredPermission && (
            <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
              Required Permission: <strong sx={{ color: '#1D5F99' }}>{requiredPermission}</strong>
            </Typography>
          )}
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={() => window.history.back()}
            sx={{
              borderColor: '#1D5F99',
              color: '#1D5F99',
              '&:hover': {
                borderColor: '#0d47a1',
                backgroundColor: 'rgba(29, 95, 153, 0.04)'
              }
            }}
          >
            Go Back
          </Button>
          
          <Button
            variant="contained"
            onClick={() => {
              window.location.href = userRole === 'Super Admin Plus'
                ? '/dashboard/inventory/list'
                : userRole === 'Investor'
                  ? '/dashboard/investors/dashboard'
                  : '/dashboard';
            }}
            sx={{
              backgroundColor: '#1D5F99',
              '&:hover': { backgroundColor: '#0d47a1' }
            }}
          >
            {userRole === 'Super Admin Plus'
              ? 'Go to Stock List'
              : userRole === 'Investor'
                ? 'Go to My Dashboard'
                : 'Go to Dashboard'}
          </Button>
        </Box>

        {/* Contact Info */}
        <Typography variant="caption" sx={{ display: 'block', mt: 3, color: '#94A3B8' }}>
          Need access? Contact your system administrator or Super Admin to review your account permissions.
        </Typography>
      </Paper>
    </Box>
  );
};

/**
 * Convenience wrapper components for common permission patterns
 */

// Read permission checker
export const RequireReadPermission = ({ children, module, allowedRoles }) => (
  <RequirePermission 
    allowedRoles={allowedRoles} 
    module={module} 
    action="read"
  >
    {children}
  </RequirePermission>
);

// Create permission checker
export const RequireCreatePermission = ({ children, module, allowedRoles }) => (
  <RequirePermission 
    allowedRoles={allowedRoles} 
    module={module} 
    action="create"
  >
    {children}
  </RequirePermission>
);

// Update permission checker
export const RequireUpdatePermission = ({ children, module, allowedRoles }) => (
  <RequirePermission 
    allowedRoles={allowedRoles} 
    module={module} 
    action="update"
  >
    {children}
  </RequirePermission>
);

// Delete permission checker
export const RequireDeletePermission = ({ children, module, allowedRoles }) => (
  <RequirePermission 
    allowedRoles={allowedRoles} 
    module={module} 
    action="delete"
  >
    {children}
  </RequirePermission>
);

export default RequirePermission;
