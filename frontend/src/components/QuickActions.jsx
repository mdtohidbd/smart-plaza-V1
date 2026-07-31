import React from 'react';
import { Box, Button, Grid, Typography, Paper, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import PaymentsIcon from '@mui/icons-material/Payments';
import InventoryIcon from '@mui/icons-material/Inventory';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useAuth } from '../context/AuthContext';

const QuickActions = ({ compact = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const hasPermission = (module, action = 'create') => {
    if (!user) return false;
    if (user.role === 'Super Admin' || user.role === 'Owner') return true;
    if (!user.permissions) return false;

    const modulePermissions = user.permissions[module];
    if (!modulePermissions) return false;

    return modulePermissions[action] === true;
  };

  const allActions = [
    { title: 'Add Sale', icon: <AddShoppingCartIcon />, path: '/dashboard/sales/retail', color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', module: 'sales', action: 'create' },
    { title: 'Stock In', icon: <MoveToInboxIcon />, path: '/dashboard/inventory/stock-in', color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE', module: 'inventory', action: 'create' },
    { title: 'Collect EMI', icon: <PaymentsIcon />, path: '/dashboard/emi/collections', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', module: 'emi', action: 'create' },
    { title: 'Add Product', icon: <InventoryIcon />, path: '/dashboard/products/add', color: '#06B6D4', bg: '#ECFEFF', border: '#A5F3FC', module: 'products', action: 'create' },
    { title: 'Add Expense', icon: <AccountBalanceIcon />, path: '/dashboard/accounts/expense', color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8', module: 'accounts', action: 'create' },
    { title: 'Add Purchase', icon: <ReceiptIcon />, path: '/dashboard/purchase/add', color: '#F97316', bg: '#FFF7ED', border: '#FFEDD5', module: 'purchase', action: 'create' }
  ];

  const allowedActions = allActions.filter(action => hasPermission(action.module, action.action));

  if (allowedActions.length === 0) {
    return null;
  }

  const handleActionClick = (path) => {
    navigate(path);
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        {allowedActions.map((action, index) => (
          <Tooltip key={index} title={action.title} arrow>
            <IconButton
              onClick={() => handleActionClick(action.path)}
              sx={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                border: `1px solid ${action.border}`,
                bgcolor: action.bg,
                color: action.color,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: action.color,
                  color: '#FFFFFF',
                  borderColor: action.color,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${action.color}35`
                }
              }}
            >
              {React.cloneElement(action.icon, { sx: { fontSize: 20 } })}
            </IconButton>
          </Tooltip>
        ))}
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mb: 4,
        borderRadius: '24px',
        border: '1px solid #F1F5F9',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 8px 30px rgba(15, 23, 42, 0.03)'
      }}
    >
      <Box sx={{ mb: 3.5 }}>
        <Typography
          variant="h6"
          sx={{
            color: '#0F172A',
            fontWeight: 800,
            fontSize: '1.25rem',
            fontFamily: 'Outfit, sans-serif',
            letterSpacing: '-0.02em',
            mb: 0.5
          }}
        >
          Quick Actions
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#64748B',
            fontSize: '0.85rem',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500
          }}
        >
          Frequently used actions to manage your business
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {allowedActions.map((action, index) => (
          <Grid item xs={6} sm={4} md={2} key={index}>
            <Button
              fullWidth
              onClick={() => handleActionClick(action.path)}
              sx={{
                py: 2.5,
                px: 1.5,
                minHeight: '110px',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                borderRadius: '20px',
                border: '1.5px solid #F1F5F9',
                boxShadow: '0 4px 10px rgba(15, 23, 42, 0.015)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#FFFFFF',
                  borderColor: action.color,
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 20px -4px ${action.color}15, 0 4px 8px -4px ${action.color}10`,
                  '& .icon-box': {
                    backgroundColor: action.color,
                    color: '#FFFFFF',
                    transform: 'scale(1.1) rotate(4deg)',
                    boxShadow: `0 8px 16px ${action.color}25`
                  }
                }
              }}
            >
              <Box
                className="icon-box"
                sx={{
                  p: 1.5,
                  borderRadius: '14px',
                  bgcolor: action.bg,
                  color: action.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: `1px solid ${action.border}`
                }}
              >
                {action.icon}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#0F172A',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  fontFamily: 'Outfit, sans-serif',
                  lineHeight: 1.2,
                  textAlign: 'center'
                }}
              >
                {action.title}
              </Typography>
            </Button>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default QuickActions;
