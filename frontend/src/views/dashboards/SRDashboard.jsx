import React, { useEffect } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import {
  ShoppingCart,
  Payments as PaymentsIcon,
  People as PeopleIcon,
  Map as MapIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

const SRDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useQuery(
    'srDashboardData',
    async () => {
      // SRs can fetch their specific stats or we can just use the role dashboard
      const response = await api.get('/api/reports/role-dashboard');
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
      cacheTime: 5 * 60 * 1000,
    }
  );

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 300000);
    return () => clearInterval(interval);
  }, [refetch]);

  const InfoCard = ({ title, value, color, subtitle, icon, linkTo }) => {
    const displayValue = typeof value === 'number' && title.includes('Total') || title.includes('Due') || title.includes('Sales') || title.includes('Collection')
      ? `৳${Number(value || 0).toLocaleString()}`
      : value;
    
    return (
      <Card 
        onClick={() => linkTo && navigate(linkTo)}
        sx={{
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: 'none',
          cursor: linkTo ? 'pointer' : 'default',
          '&:hover': {
            borderColor: `${color}40`,
            boxShadow: `0 10px 15px -3px rgba(0, 0, 0, 0.05)`,
            '& .icon-badge': {
              backgroundColor: color,
              color: '#FFFFFF',
            }
          }
        }}
      >
        <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box 
              className="icon-badge"
              sx={{ 
                p: 1.5, 
                borderRadius: '12px', 
                backgroundColor: `${color}15`, 
                color: color, 
                display: 'flex',
                transition: 'all 0.2s'
              }}
            >
              {icon}
            </Box>
            {linkTo && (
              <OpenInNewIcon sx={{ fontSize: '1rem', color: '#CBD5E1' }} />
            )}
          </Box>
          <Typography sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.85rem', mb: 0.5 }}>
            {title}
          </Typography>
          <Typography sx={{ color: '#0F172A', fontWeight: 700, fontSize: '1.75rem', mb: 1 }}>
            {displayValue || '0'}
          </Typography>
          {subtitle && (
            <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', mt: 'auto' }}>
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load dashboard data. Please try again.</Alert>
      </Box>
    );
  }

  // Fallbacks if data is missing
  const todaySales = dashboardData?.sales?.today || 0;
  const monthSales = dashboardData?.sales?.thisMonth || 0;
  const todayDue = dashboardData?.dues?.today || 0;
  const activeCustomers = dashboardData?.customers?.total || 0;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* Welcome Banner */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <Typography variant="h4" fontWeight={700} color="#1E293B" gutterBottom>
              Welcome back, {user?.name}! 👋
            </Typography>
            <Typography variant="body1" color="#64748B">
              Here's your sales and collection overview for today.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, gap: 1 }}>
            <Button
              variant="contained"
              onClick={() => navigate('/dashboard/sales/wholesale')}
              startIcon={<ShoppingCart />}
              sx={{ backgroundColor: '#14B8A6', '&:hover': { backgroundColor: '#0D9488' }, borderRadius: '8px', textTransform: 'none' }}
            >
              New Sale
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard/sales/due-collection')}
              startIcon={<PaymentsIcon />}
              sx={{ borderRadius: '8px', textTransform: 'none', color: '#3B82F6', borderColor: '#3B82F6' }}
            >
              Collect Due
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <InfoCard 
            title="Today's Sales" 
            value={todaySales} 
            color="#3B82F6" 
            icon={<ShoppingCart />} 
            subtitle="Total sales completed today"
            linkTo="/dashboard/sales/wholesale-records"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <InfoCard 
            title="This Month's Sales" 
            value={monthSales} 
            color="#10B981" 
            icon={<ShoppingCart />} 
            subtitle="Total sales this month"
            linkTo="/dashboard/sales/wholesale-records"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <InfoCard 
            title="Due Collections Needed" 
            value={todayDue} 
            color="#F59E0B" 
            icon={<PaymentsIcon />} 
            subtitle="Total outstanding dues"
            linkTo="/dashboard/sales/due-collection"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <InfoCard 
            title="My Customers" 
            value={activeCustomers} 
            color="#8B5CF6" 
            icon={<PeopleIcon />} 
            subtitle="Total active customers"
            linkTo="/dashboard/contacts/customers"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default SRDashboard;

