import React from 'react';
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
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import UserMenu from '../components/UserMenu';
import NotificationsBell from '../components/NotificationsBell';
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
  const { user } = useAuth();

  return (
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
  );
};

export default TopBar;
