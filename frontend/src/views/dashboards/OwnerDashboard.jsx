import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import useShopRefresh from '../../hooks/useShopRefresh';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Rating,
  Chip,
  Divider,
  Avatar,
  Skeleton
} from '@mui/material';
import {
  AttachMoney,
  ShoppingCart,
  LocalShipping,
  Inventory,
  People,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  ExpandMore,
  Business,
  VisibilityOff,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  OpenInNew as OpenInNewIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Store as StoreIcon,
  Assessment as AssessmentIcon,
  Payments as PaymentsIcon,
  CheckCircle as CheckCircleIcon,
  TrendingDown as TrendingDownIcon,
  Close as CloseIcon,
  Shield as ShieldIcon,
  CreditCard as CreditCardIcon,
  Refresh as RefreshIcon,
  Timer as TimerIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import QuickActions from '../../components/QuickActions';
import EMICollectionOverview from './components/EMICollectionOverview';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from 'recharts';
import { useNotifications } from '../../hooks/useNotifications';
import { BRAND_PRIMARY, BRAND_PRIMARY_HOVER } from '../../theme/brandColors';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showValues, setShowValues] = useState(true);
  
  const hasPermission = (module, action = 'read') => {
    if (!user) return false;
    if (user.role === 'Super Admin' || user.role === 'Owner') return true;
    if (!user.permissions) return false;

    const modulePermissions = user.permissions[module];
    if (!modulePermissions) return false;

    return modulePermissions[action] === true;
  };
  const {
    data: dashboardData,
    isLoading,
    isFetching,
    error,
    refetch
  } = useQuery(
    'dashboardData',
    async () => {
      console.log('[DASHBOARD] Fetching dashboard data from API...');
      const response = await api.get('/api/reports/role-dashboard');
      console.log('[DASHBOARD] Received dashboard data:', {
        todaySales: response.data.data?.todaySales,
        weekSales: response.data.data?.weekSales,
        weeklyPerformance: response.data.data?.weeklyPerformance?.length || 0,
        weeklyProfitPerformance: response.data.data?.weeklyProfitPerformance?.length || 0
      });
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error?.response?.status === 403) return false;
        return failureCount < 1;
      },
      cacheTime: 5 * 60 * 1000, // Reduced from 10 min to 5 min
      staleTime: 0, // Always refetch when invalidated
      keepPreviousData: false, // Don't keep old data while fetching
    }
  );

  useShopRefresh(refetch);

  const {
    items: notificationItems,
    markAsRead,
    markAllAsRead,
    removeNotification,
    isLoading: notificationsLoading
  } = useNotifications();

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 300000);
    return () => clearInterval(interval);
  }, [refetch]);

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

  const InfoCard = ({ title, value, color, subtitle, trend, valueFormat = 'text', icon, linkTo, isLoading = false }) => {
    const displayValue = showValues ? 
      (valueFormat === 'currency'
        ? `৳${Number(value || 0).toLocaleString()}`
        : typeof value === 'number' ? value.toLocaleString() : value)
      : '•••••';
    
    // Hex to RGBA helper for beautiful matching soft shadows
    const getShadowColor = (hex) => {
      if (!hex || !hex.startsWith('#')) return 'rgba(15, 23, 42, 0.08)';
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, 0.12)`;
    };
    
    return (
      <Card 
        onClick={() => linkTo && navigate(linkTo)}
        sx={{
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '24px',
          border: '1px solid #F1F5F9',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.02)',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: linkTo ? 'pointer' : 'default',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: `0 24px 36px -4px rgba(15, 23, 42, 0.04), 0 12px 24px -4px ${getShadowColor(color)}`,
            borderColor: `${color}40`,
            '& .icon-badge': {
              transform: 'scale(1.15) rotate(6deg)',
              backgroundColor: color,
              color: '#FFFFFF',
              boxShadow: `0 8px 20px ${getShadowColor(color)}`
            },
            '& .view-btn .MuiSvgIcon-root': {
              transform: 'translateX(2px)'
            }
          }
        }}
      >
        {/* Colorful top-bar accent */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: `linear-gradient(90deg, ${color}80, ${color})` }} />
        
        <CardContent sx={{ p: 3, pt: 3.5, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box 
                className="icon-badge"
                sx={{ 
                  p: 1.5, 
                  borderRadius: '14px', 
                  backgroundColor: `${color}12`, 
                  color: color, 
                  display: 'flex',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {icon}
              </Box>
              {trend !== undefined && trend !== 0 && (
                <Box sx={{ 
                  display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.5, borderRadius: '30px',
                  backgroundColor: trend >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  color: trend >= 0 ? '#10B981' : '#EF4444',
                  border: `1px solid ${trend >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`
                }}>
                  {trend >= 0 ? <TrendingUp sx={{ fontSize: '0.85rem' }} /> : <TrendingDown sx={{ fontSize: '0.85rem' }} />}
                  <Typography variant="caption" fontWeight="800" sx={{ fontSize: '0.75rem', fontFamily: 'Inter, sans-serif' }}>
                    {isLoading ? <Skeleton width={30} /> : (showValues ? `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%` : '••%')}
                  </Typography>
                </Box>
              )}
            </Box>
            <Typography sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.725rem', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Inter, sans-serif' }}>
              {title}
            </Typography>
            <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.85rem', lineHeight: 1.15, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
              {isLoading ? <Skeleton width="70%" sx={{ bgcolor: 'rgba(15, 23, 42, 0.05)' }} /> : displayValue}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
            {subtitle ? (
              <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500, fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mr: 1, flex: 1 }}>
                {isLoading ? <Skeleton width="80%" sx={{ bgcolor: 'rgba(148, 163, 184, 0.1)' }} /> : subtitle}
              </Typography>
            ) : <Box sx={{ flex: 1 }} />}
            {linkTo && (
              <Button
                className="view-btn"
                variant="text"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(linkTo);
                }}
                sx={{
                  color: color,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  p: 0,
                  minWidth: 'auto',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  transition: 'all 0.2s ease-in-out',
                  '& .MuiSvgIcon-root': {
                    fontSize: '0.875rem',
                    transition: 'transform 0.2s ease-in-out'
                  },
                  '&:hover': {
                    bgcolor: 'transparent',
                    opacity: 0.8,
                    '& .MuiSvgIcon-root': {
                      transform: 'translateX(2px)'
                    }
                  }
                }}
              >
                View <OpenInNewIcon />
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };


  const renderRecentSales = () => {
    const MAX_VISIBLE = 4;
    const allSales = dashboardData?.recentOrders || [];
    const visibleSales = allSales.slice(0, MAX_VISIBLE);
    const showAllFooter = allSales.length >= MAX_VISIBLE;

    const getSaleTypeStyle = (saleType) => {
      if (saleType?.includes('EMI')) return { bgcolor: '#EEF2FF', color: '#4F46E5' };
      if (saleType === 'E-Commerce') return { bgcolor: '#F5F3FF', color: '#7C3AED' };
      if (saleType === 'Wholesale') return { bgcolor: '#EFF6FF', color: '#2563EB' };
      return { bgcolor: '#ECFDF5', color: '#057857' };
    };

    const formatSaleDateTime = (dateStr) => {
      const d = new Date(dateStr);
      return {
        date: d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }),
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    };

    return (
      <Paper sx={{ p: 4, mb: 3.5, borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.03)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5 }}>
          <Box>
            <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.3rem', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>Recent Sales</Typography>
            <Typography sx={{ color: '#64748B', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Latest sales across retail, wholesale, EMI & e-commerce</Typography>
          </Box>
          <Tooltip title="Refresh sales" arrow>
            <IconButton
              onClick={() => refetch()}
              disabled={isFetching}
              sx={{
                bgcolor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                width: 38,
                height: 38,
                color: '#64748B',
                '&:hover': { bgcolor: '#F1F5F9', color: '#0F766E', borderColor: '#99F6E4' },
                '&:disabled': { opacity: 0.6 }
              }}
            >
              <RefreshIcon
                sx={{
                  fontSize: 20,
                  animation: isFetching ? 'spin 0.8s linear infinite' : 'none',
                  '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ overflowX: 'auto', ...(showAllFooter && { pb: 1 }) }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                  <th style={{ textAlign: 'left', padding: '16px 10px', color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice</th>
                  <th style={{ textAlign: 'left', padding: '16px 10px', color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</th>
                  <th style={{ textAlign: 'left', padding: '16px 10px', color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sold By</th>
                  <th style={{ textAlign: 'left', padding: '16px 10px', color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '16px 10px', color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date & Time</th>
                  <th style={{ textAlign: 'right', padding: '16px 10px', color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                  <th style={{ textAlign: 'center', padding: '16px 10px', color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from(new Array(MAX_VISIBLE)).map((_, idx) => (
                    <tr key={`skeleton-${idx}`} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '16px 10px' }}>
                        <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: '#F1F5F9' }} />
                      </td>
                      <td style={{ padding: '16px 10px' }}>
                        <Skeleton variant="text" width="80%" height={20} sx={{ bgcolor: '#F1F5F9' }} />
                      </td>
                      <td style={{ padding: '16px 10px' }}>
                        <Skeleton variant="text" width="70%" height={20} sx={{ bgcolor: '#F1F5F9' }} />
                      </td>
                      <td style={{ padding: '16px 10px' }}>
                        <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: '20px', bgcolor: '#F1F5F9' }} />
                      </td>
                      <td style={{ padding: '16px 10px' }}>
                        <Skeleton variant="text" width="50%" height={16} sx={{ bgcolor: '#F1F5F9' }} />
                        <Skeleton variant="text" width="30%" height={12} sx={{ bgcolor: '#F1F5F9' }} />
                      </td>
                      <td style={{ padding: '16px 10px', textAlign: 'right' }}>
                        <Skeleton variant="text" width="40%" height={20} sx={{ marginLeft: 'auto', bgcolor: '#F1F5F9' }} />
                      </td>
                      <td style={{ padding: '16px 10px', textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: '8px', bgcolor: '#F1F5F9' }} />
                        </Box>
                      </td>
                    </tr>
                  ))
                ) : visibleSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px 10px', textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem' }}>No recent sales found</td>
                  </tr>
                ) : visibleSales.map((sale, idx) => {
                  const typeStyle = getSaleTypeStyle(sale.saleType);
                  const { date, time } = formatSaleDateTime(sale.date);
                  return (
                  <tr key={sale._id || idx} style={{ 
                    borderBottom: '1px solid #F1F5F9',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}>
                    <td style={{ padding: '16px 10px', color: '#14B8A6', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif' }}>#{sale.invoiceNumber}</td>
                    <td style={{ padding: '16px 10px' }}>
                      <Typography sx={{ color: '#0F172A', fontSize: '0.925rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>{sale.customerName || sale.customer?.contactName || sale.customer?.name || 'N/A'}</Typography>
                    </td>
                    <td style={{ padding: '16px 10px' }}>
                      <Typography sx={{ color: '#475569', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{sale.soldBy || 'N/A'}</Typography>
                    </td>
                    <td style={{ padding: '16px 10px' }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: '20px', bgcolor: typeStyle.bgcolor, color: typeStyle.color }}>
                        {sale.saleType?.includes('EMI') ? <CreditCardIcon sx={{ fontSize: 14 }} /> : <PaymentsIcon sx={{ fontSize: 14 }} />}
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>{sale.saleType || sale.paymentMethod || 'Cash'}</Typography>
                      </Box>
                    </td>
                    <td style={{ padding: '16px 10px' }}>
                      <Typography sx={{ color: '#0F172A', fontSize: '0.85rem', fontWeight: 600 }}>{date}</Typography>
                      <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500 }}>{time}</Typography>
                    </td>
                    <td style={{ padding: '16px 10px', textAlign: 'right', color: '#0F172A', fontWeight: 800, fontSize: '1rem', fontFamily: 'Outfit, sans-serif' }}>{showValues ? `৳${(sale.total || 0).toLocaleString()}` : '•••••'}</td>
                    <td style={{ padding: '16px 10px', textAlign: 'center' }}>
                      <Chip 
                        label={sale.status || 'Completed'} 
                        size="small" 
                        sx={{ 
                          bgcolor: '#ECFDF5', 
                          color: '#10B981', 
                          fontWeight: 800,
                          fontSize: '0.725rem',
                          borderRadius: '8px',
                          border: '1px solid #A7F3D0',
                          px: 1,
                          py: 1.5
                        }} 
                      />
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </Box>
          {showAllFooter && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 100,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                pb: 1.5,
                background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 45%, #FFFFFF 100%)',
                backdropFilter: 'blur(2px)',
                pointerEvents: 'none'
              }}
            >
              <Button
                variant="contained"
                onClick={() => navigate('/dashboard/sales/all')}
                sx={{
                  pointerEvents: 'auto',
                  bgcolor: '#FFFFFF',
                  color: '#0F766E',
                  border: '1px solid #99F6E4',
                  borderRadius: '12px',
                  px: 3,
                  py: 1,
                  fontWeight: 700,
                  textTransform: 'none',
                  boxShadow: '0 4px 16px rgba(20, 184, 166, 0.15)',
                  '&:hover': {
                    bgcolor: '#14B8A6',
                    color: '#FFFFFF',
                    borderColor: '#14B8A6',
                    boxShadow: '0 6px 20px rgba(20, 184, 166, 0.25)'
                  }
                }}
              >
                Show All Sales
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    );
  };



  const renderInventoryStatus = () => {
    const stock = dashboardData?.inventoryStatus || [];
    const stockStats = dashboardData?.overallStockStats || { totalInStock: 0, lowStockCount: 0, outOfStockCount: 0 };
    
    return (
      <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 4, borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.03)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <Box>
            <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>Inventory Status</Typography>
            <Typography sx={{ color: '#64748B', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Stock levels by product</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#10B981' }}>
                <CheckCircleIcon sx={{ fontSize: 16 }} />
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif' }}>
                  {isLoading ? <Skeleton width={20} /> : stockStats.totalInStock}
                </Typography>
              </Box>
              <Typography sx={{ color: '#64748B', fontSize: '0.725rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>In Stock</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#F59E0B' }}>
                <WarningIcon sx={{ fontSize: 16 }} />
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif' }}>
                  {isLoading ? <Skeleton width={20} /> : stockStats.lowStockCount}
                </Typography>
              </Box>
              <Typography sx={{ color: '#64748B', fontSize: '0.725rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Low</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#EF4444' }}>
                <TrendingDownIcon sx={{ fontSize: 16 }} />
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif' }}>
                  {isLoading ? <Skeleton width={20} /> : stockStats.outOfStockCount}
                </Typography>
              </Box>
              <Typography sx={{ color: '#64748B', fontSize: '0.725rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Out</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '400px', overflowY: 'auto' }}>
          {isLoading ? (
            Array.from(new Array(3)).map((_, idx) => (
              <Box key={`skeleton-${idx}`} sx={{ p: 2.5, borderRadius: '18px', bgcolor: '#FFFFFF', border: '1px solid #F1F5F9' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Skeleton variant="rounded" width={40} height={40} />
                    <Box>
                      <Skeleton variant="text" width={120} height={24} />
                      <Skeleton variant="text" width={80} height={16} />
                    </Box>
                  </Box>
                  <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '8px' }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                  <Box>
                    <Skeleton variant="text" width={40} height={14} />
                    <Skeleton variant="text" width={60} height={20} />
                  </Box>
                  <Box>
                    <Skeleton variant="text" width={50} height={14} />
                    <Skeleton variant="text" width={60} height={20} />
                  </Box>
                  <Box>
                    <Skeleton variant="text" width={40} height={14} />
                    <Skeleton variant="text" width={60} height={20} />
                  </Box>
                </Box>
              </Box>
            ))
          ) : stock.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>No products in inventory</Typography>
            </Box>
          ) : stock.map((product, idx) => {
            const getStatusColor = (status) => {
              switch (status) {
                case 'In Stock': return '#10B981';
                case 'Low Stock': return '#F59E0B';
                case 'Out of Stock': return '#EF4444';
                default: return '#64748B';
              }
            };

            return (
              <Box key={idx} sx={{ 
                p: 2.5, 
                borderRadius: '18px', 
                bgcolor: '#FFFFFF', 
                border: '1px solid #F1F5F9',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.01)',
                transition: 'all 0.25s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 18px rgba(15, 23, 42, 0.03)',
                  borderColor: '#E2E8F0'
                }
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Box sx={{ p: 1.25, borderRadius: '10px', bgcolor: 'rgba(20, 184, 166, 0.08)', color: '#0F766E', display: 'flex' }}>
                      <Inventory />
                    </Box>
                    <Box>
                      <Typography sx={{ color: '#0F172A', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif' }}>{product.name}</Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mt: 0.5 }}>
                        {product.category && (
                          <Typography sx={{ color: '#64748B', fontSize: '0.75rem', fontFamily: 'Inter, sans-serif', fontWeight: 500, bgcolor: '#F1F5F9', px: 1, py: 0.25, borderRadius: '6px' }}>
                            {product.category}
                          </Typography>
                        )}
                        {product.model && (
                          <Typography sx={{ color: '#94A3B8', fontSize: '0.725rem', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                            Model: {product.model}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <Chip 
                    label={product.status}
                    size="small"
                    sx={{ 
                      bgcolor: `${getStatusColor(product.status)}15`, 
                      color: getStatusColor(product.status), 
                      fontWeight: 700, 
                      borderRadius: '8px', 
                      border: `1px solid ${getStatusColor(product.status)}30`, 
                      fontFamily: 'Inter', 
                      fontSize: '0.725rem' 
                    }} 
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography sx={{ color: '#64748B', fontSize: '0.7rem', fontFamily: 'Inter, sans-serif', fontWeight: 500, textTransform: 'uppercase' }}>Stock</Typography>
                      <Typography sx={{ color: '#0F172A', fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                        {product.currentStock}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography sx={{ color: '#64748B', fontSize: '0.7rem', fontFamily: 'Inter, sans-serif', fontWeight: 500, textTransform: 'uppercase' }}>Alert Qty</Typography>
                      <Typography sx={{ color: '#64748B', fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                        {product.alertQuantity || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography sx={{ color: '#64748B', fontSize: '0.7rem', fontFamily: 'Inter, sans-serif', fontWeight: 500, textTransform: 'uppercase' }}>Value</Typography>
                      <Typography sx={{ color: '#10B981', fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                        ৳{(product.currentValue || 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    );
  };

  const renderAlertTypeIcon = (type) => {
    switch (type) {
      case 'Stock Alert':
      case 'Low Stock':
      case 'Out of Stock':
        return <Inventory sx={{ fontSize: 20 }} />;
      case 'New Order':
        return <ShoppingCart sx={{ fontSize: 20 }} />;
      case 'System':
        return <ShieldIcon sx={{ fontSize: 20 }} />;
      case 'Payment Received':
        return <PaymentsIcon sx={{ fontSize: 20 }} />;
      default:
        return <CreditCardIcon sx={{ fontSize: 20 }} />;
    }
  };

  const renderAlertsSidebar = () => {
    const alerts = notificationItems;
    return (
      <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 4, borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.03)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <WarningIcon sx={{ color: '#EF4444', filter: 'drop-shadow(0 2px 4px rgba(239,68,68,0.2))' }} />
            <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>Alerts & Notifications</Typography>
          </Box>
          <Button
            size="small"
            onClick={() => markAllAsRead()}
            disabled={notificationsLoading || !alerts.some(a => !a.isRead && !a.computed)}
            sx={{ 
              color: '#0F766E', 
              textTransform: 'none', 
              fontSize: '0.8rem', 
              fontWeight: 700, 
              fontFamily: 'Inter',
              '&:hover': { color: '#14B8A6' }
            }}
          >
            Mark all read
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {notificationsLoading && !alerts.length ? (
            <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem', fontFamily: 'Inter', textAlign: 'center', py: 2 }}>Loading alerts…</Typography>
          ) : alerts.length > 0 ? (
            <>
              {alerts.slice(0, 3).map((alert, idx) => {
                const isHigh = alert.severity === 'high';
                const isMedium = alert.severity === 'medium';
                const themeColor = isHigh ? '#EF4444' : isMedium ? '#F59E0B' : '#6366F1';
                const themeBg = isHigh ? '#FEF2F2' : isMedium ? '#FFFBEB' : '#EEF2FF';
                const themeBorder = isHigh ? '#FEE2E2' : isMedium ? '#FEF3C7' : '#E0E7FF';

                return (
                  <Box
                    key={alert._id || `computed-${idx}`}
                    sx={{
                      p: 2.5,
                      borderRadius: '18px',
                      backgroundColor: themeBg,
                      border: '1px solid',
                      borderColor: themeBorder,
                      position: 'relative',
                      opacity: alert.isRead ? 0.75 : 1,
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: `0 8px 16px -4px rgba(15, 23, 42, 0.04), 0 4px 8px -4px ${themeColor}15`,
                        borderColor: themeColor
                      }
                    }}
                  >
                    {alert._id && !alert.computed && (
                      <IconButton
                        size="small"
                        sx={{ 
                          position: 'absolute', 
                          right: 8, 
                          top: 8, 
                          color: '#64748B',
                          '&:hover': { color: '#0F172A', bgcolor: 'rgba(0,0,0,0.03)' }
                        }}
                        onClick={() => removeNotification(alert._id)}
                        aria-label="Dismiss"
                      >
                        <CloseIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    )}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: '10px',
                          height: 'fit-content',
                          bgcolor: `${themeColor}15`,
                          color: themeColor,
                          display: 'flex'
                        }}
                      >
                        {renderAlertTypeIcon(alert.type)}
                      </Box>
                      <Box sx={{ flexGrow: 1, pr: alert._id && !alert.computed ? 4 : 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: themeColor, boxShadow: `0 0 6px ${themeColor}` }} />
                          <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '0.925rem', fontFamily: 'Outfit, sans-serif' }}>{alert.type}</Typography>
                        </Box>
                        <Typography sx={{ color: '#475569', fontSize: '0.825rem', mb: 2, fontFamily: 'Inter, sans-serif', fontWeight: 500, lineHeight: 1.4 }}>{alert.message}</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                          <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'Inter' }}>{alert.time}</Typography>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={async () => {
                              if (alert._id && !alert.isRead) await markAsRead(alert._id);
                              if (alert.actionLink) navigate(alert.actionLink);
                            }}
                            sx={{
                              bgcolor: '#FFFFFF',
                              color: '#0F172A',
                              border: '1px solid #E2E8F0',
                              textTransform: 'none',
                              fontWeight: 700,
                              borderRadius: '10px',
                              px: 2,
                              py: 0.5,
                              boxShadow: 'none',
                              fontFamily: 'Inter',
                              fontSize: '0.75rem',
                              '&:hover': { 
                                bgcolor: themeColor, 
                                color: '#FFFFFF',
                                borderColor: themeColor,
                                boxShadow: `0 4px 10px ${themeColor}30`
                              }
                            }}
                          >
                            {alert.actionLabel || 'Review'}
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
              {alerts.length > 3 && (
                <Button 
                  variant="contained" 
                  size="small" 
                  onClick={() => navigate('/dashboard/notifications')}
                  sx={{ 
                    bgcolor: '#F0FDFA', 
                    color: '#0F766E',
                    border: '1px solid #99F6E4',
                    borderRadius: '12px',
                    px: 4,
                    py: 1,
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 'none',
                    transition: 'all 0.2s',
                    width: 'fit-content',
                    mx: 'auto',
                    mt: 1,
                    '&:hover': { 
                      bgcolor: '#14B8A6', 
                      color: '#FFFFFF',
                      boxShadow: '0 4px 12px rgba(20, 184, 166, 0.2)',
                      borderColor: '#14B8A6'
                    }
                  }}
                >
                  View All
                </Button>
              )}
            </>
          ) : (
            <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem', fontFamily: 'Inter', textAlign: 'center', py: 4 }}>No new alerts</Typography>
          )}
        </Box>
      </Paper>
    );
  };

  const showInventoryStatus = hasPermission('inventory', 'read');
  const showAlertsSidebar = true; // Always show per user request

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: 'background.default', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: { xs: 1.5, md: 2 }, mb: 4 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: { xs: 1.5, md: 2 } }}>
            <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 800, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
              {user?.role ? `${user.role} Dashboard` : 'Dashboard'}
            </Typography>
            <QuickActions compact />
          </Box>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mt: 0.5 }}>Welcome back, {user?.name || 'Admin'}</Typography>
        </Box>
      </Box>

      <Tooltip title={showValues ? 'Hide values' : 'Show values'} arrow>
        <IconButton
          onClick={() => setShowValues(!showValues)}
          sx={{
            position: 'fixed',
            top: { xs: 80, sm: 90 },
            right: { xs: 16, sm: 32 },
            zIndex: 1000,
            bgcolor: showValues ? '#6366F1' : '#FFFFFF',
            color: showValues ? '#FFFFFF' : '#64748B',
            borderRadius: '12px',
            border: '1px solid',
            borderColor: showValues ? '#6366F1' : 'rgba(255,255,255,0.8)',
            width: 44,
            height: 44,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(8px)',
            '&:hover': {
              bgcolor: showValues ? '#4F46E5' : '#F8FAFC',
              borderColor: showValues ? '#4F46E5' : '#E2E8F0'
            }
          }}
        >
          {showValues ? <VisibilityIcon sx={{ fontSize: 22 }} /> : <VisibilityOff sx={{ fontSize: 22 }} />}
        </IconButton>
      </Tooltip>

      {hasPermission('sales', 'read') && (
        <Box sx={{ mb: 4 }}>{renderRecentSales()}</Box>
      )}

      {hasPermission('emi', 'read') && (
        <Box sx={{ mb: 4 }}>
          <EMICollectionOverview dashboardData={dashboardData} isLoading={isLoading} />
        </Box>
      )}

      {/* Row 1: Sales Summary */}
      {hasPermission('sales', 'read') && (
        <>
          <Typography variant="subtitle1" sx={{ color: '#1E293B', fontWeight: 700, mb: 2, opacity: 0.8, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em' }}>Sales Overview</Typography>
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}><InfoCard isLoading={isLoading} title="Today's Sales" value={dashboardData?.todaySales || 0} icon={<AttachMoney />} color="#10B981" valueFormat="currency" trend={dashboardData?.todaySalesGrowth} subtitle={`${dashboardData?.todayOrders || 0} orders today`} linkTo="/dashboard/sales/all" /></Grid>
            <Grid item xs={12} sm={6} md={3}><InfoCard isLoading={isLoading} title="Monthly Sales" value={dashboardData?.monthSales || 0} icon={<TrendingUp />} color="#6366F1" valueFormat="currency" trend={dashboardData?.monthSalesGrowth} subtitle={`${dashboardData?.monthOrders || 0} orders this month`} linkTo="/dashboard/reports/sales" /></Grid>
            <Grid item xs={12} sm={6} md={3}><InfoCard isLoading={isLoading} title="Purchase Due" value={dashboardData?.totalSupplierDue || 0} icon={<ShoppingCart />} color="#F59E0B" valueFormat="currency" subtitle="Total supplier payables" linkTo="/dashboard/reports/purchase/due" /></Grid>
            <Grid item xs={12} sm={6} md={3}><InfoCard isLoading={isLoading} title="Customer Due" value={dashboardData?.totalCustomerDue || dashboardData?.totalDues || 0} icon={<ScheduleIcon />} color="#EF4444" valueFormat="currency" subtitle="Total customer receivables" linkTo="/dashboard/reports/all-sales-reports/sales-due" /></Grid>
          </Grid>
        </>
      )}

      {/* Row 2: Business Health */}
      {(hasPermission('inventory', 'read') || hasPermission('purchase', 'read') || hasPermission('accounts', 'read')) && (
        <>
          <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700, mb: 2, opacity: 0.8, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em' }}>Inventory & Finance</Typography>
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            {hasPermission('inventory', 'read') && <Grid item xs={12} sm={6} md={hasPermission('purchase', 'read') ? 3 : 4}><InfoCard isLoading={isLoading} title="Stock Value" value={dashboardData?.stockValue || 0} icon={<Inventory />} color="#06B6D4" valueFormat="currency" subtitle={`${dashboardData?.totalProducts || 0} products in catalog`} linkTo="/dashboard/inventory/list" /></Grid>}
            {hasPermission('purchase', 'read') && <Grid item xs={12} sm={6} md={hasPermission('inventory', 'read') ? 3 : 4}><InfoCard isLoading={isLoading} title="Monthly Purchases" value={dashboardData?.monthPurchases || 0} icon={<ShoppingCart />} color="#8B5CF6" valueFormat="currency" subtitle={`Today: ৳${(dashboardData?.todayPurchases || 0).toLocaleString()}`} linkTo="/dashboard/purchase/all" /></Grid>}
            {hasPermission('accounts', 'read') && <Grid item xs={12} sm={6} md={hasPermission('inventory', 'read') && hasPermission('purchase', 'read') ? 3 : 6}><InfoCard isLoading={isLoading} title="Monthly Income" value={Math.abs(dashboardData?.monthIncome || 0)} icon={<PaymentsIcon />} color="#10B981" valueFormat="currency" subtitle={`${dashboardData?.monthIncomeCount || 0} income entries`} linkTo="/dashboard/accounts/income" /></Grid>}
            {hasPermission('accounts', 'read') && <Grid item xs={12} sm={6} md={hasPermission('inventory', 'read') && hasPermission('purchase', 'read') ? 3 : 6}><InfoCard isLoading={isLoading} title="Monthly Expenses" value={Math.abs(dashboardData?.monthExpense || 0)} icon={<AssessmentIcon />} color="#EC4899" valueFormat="currency" subtitle={`${dashboardData?.monthExpenseCount || 0} expense entries`} linkTo="/dashboard/accounts/expense" /></Grid>}
          </Grid>
        </>
      )}

      {/* Row 3: Performance & Customers */}
      {(hasPermission('products', 'read') || hasPermission('contacts', 'read') || hasPermission('accounts', 'read')) && (
        <>
          <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700, mb: 2, opacity: 0.8, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em' }}>Performance Insights</Typography>
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            {hasPermission('products', 'read') && <Grid item xs={12} sm={6} md={4}><InfoCard isLoading={isLoading} title="Top Product" value={dashboardData?.topSellingProduct || 'N/A'} icon={<StoreIcon />} color="#F97316" subtitle={`${dashboardData?.topSellingProductCount || 0} units sold`} /></Grid>}
            {hasPermission('contacts', 'read') && <Grid item xs={12} sm={6} md={4}><InfoCard isLoading={isLoading} title="Best Customer" value={dashboardData?.bestCustomer || 'N/A'} icon={<PersonIcon />} color="#6366F1" subtitle={`Spent ৳${(dashboardData?.bestCustomerSpending || 0).toLocaleString()}`} /></Grid>}
            {hasPermission('contacts', 'read') && <Grid item xs={12} sm={6} md={4}><InfoCard isLoading={isLoading} title="Total Customers" value={dashboardData?.totalCustomers || 0} icon={<People />} color="#10B981" subtitle="Total registered customers" /></Grid>}
          </Grid>
        </>
      )}

      {/* Main Grid Content */}
      <Grid container spacing={3}>
        {showAlertsSidebar && (
          <Grid item xs={12} md={6}>
            {renderAlertsSidebar()}
          </Grid>
        )}
        {showInventoryStatus && (
          <Grid item xs={12} md={6}>
            {renderInventoryStatus()}
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default OwnerDashboard;
