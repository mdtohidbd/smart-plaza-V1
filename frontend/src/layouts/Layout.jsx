import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { isSuperAdminPlus, isInvestor } from '../utils/roleUtils';

import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MainContent from './MainContent';

// Use public folder logo directly (more reliable than Vite imports)
const logoSrc = '/website-logo.png';

// Preload logo to ensure it's available
if (typeof window !== 'undefined') {
  const preloadLogo = new Image();
  preloadLogo.src = logoSrc;
  preloadLogo.onload = () => console.log('Logo preloaded successfully');
  preloadLogo.onerror = () => console.error('Logo preload failed, file may not exist at:', logoSrc);
}

const Layout = () => {
  console.log('Layout component rendered');
  const theme = useTheme();
  const [open, setOpen] = useState(true); // Start with drawer open on desktop
  const [modules, setModules] = useState([]);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Sync drawer state based on mobile/desktop viewport
  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  // Fetch modules to check if retail is enabled
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await api.get('/api/settings/modules');
        setModules(response.data.data);
      } catch (error) {
        console.error('Error fetching modules:', error);
      }
    };

    fetchModules();
  }, []);

  useEffect(() => {
    if (user) {
      if (isSuperAdminPlus(user) && (location.pathname === '/dashboard' || location.pathname === '/dashboard/')) {
        navigate('/dashboard/inventory/list');
        return;
      }

      // Redirect investors to their dashboard
      if (isInvestor(user) && (location.pathname === '/dashboard' || location.pathname === '/dashboard/')) {
        navigate('/dashboard/investors/dashboard');
        return;
      }
    }
  }, [user, location.pathname, navigate]);

  // Log route changes
  useEffect(() => {
    console.log('Layout - Current location:', location.pathname);
  }, [location.pathname]);

  return (
    <Box sx={{ display: 'flex', flexGrow: 1, width: '100%', backgroundColor: '#F5F7FA', minHeight: '100vh' }}>
      <CssBaseline />
      <TopBar open={open} setOpen={setOpen} />
      <Sidebar open={open} setOpen={setOpen} isMobile={isMobile} />
      <MainContent />
    </Box>
  );
};

export default Layout;