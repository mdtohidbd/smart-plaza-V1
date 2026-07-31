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
  Chip,
  Avatar,
  Skeleton
} from '@mui/material';
import {
  AttachMoney,
  ShoppingCart,
  Inventory,
  TrendingUp,
  TrendingDown,
  OpenInNew as OpenInNewIcon,
  Payments as PaymentsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
  Close as CloseIcon,
  Shield as ShieldIcon,
  CreditCard as CreditCardIcon,
  VisibilityOff,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import QuickActions from '../../components/QuickActions';
import EMICollectionOverview from './components/EMICollectionOverview';
import { useNotifications } from '../../hooks/useNotifications';

const StaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showValues, setShowValues] = useState(false);

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
    'staffDashboardData',
    async () => {
      // Reusing the same endpoint, but the component will render only operational parts
      const response = await api.get('/api/reports/role-dashboard');
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error?.response?.status === 403) return false;
        return failureCount < 1;
      },
      cacheTime: 5 * 60 * 1000,
      staleTime: 0,
      keepPreviousData: false,
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

  const InfoCard = ({ title, value, color, subtitle, trend, valueFormat = 'text', icon, linkTo }) => {
    const displayValue = showValues ? 
      (valueFormat === 'currency'
        ? `৳${Number(value || 0).toLocaleString()}`
        : typeof value === 'number' ? value.toLocaleString() : value)
      : '•••••';
    
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
                    {showValues ? `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%` : '••%'}
                  </Typography>
                </Box>
              )}
            </Box>
            <Typography sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.725rem', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Inter, sans-serif' }}>
              {title}
            </Typography>
            <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.85rem', lineHeight: 1.15, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
              {displayValue}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
            {subtitle ? (
              <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500, fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mr: 1 }}>
                {subtitle}
              </Typography>
            ) : <Box />}
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
                    <td style={{ padding: '16px 10px', textAlign: 'right', color: '#0F172A', fontWeight: 800, fontSize: '1rem', fontFamily: 'Outfit, sans-serif' }}>{showValues ? `৳${sale.total.toLocaleString()}` : '•••••'}</td>
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
      <Paper sx={{ p: 4, mb: 3.5, borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.03)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <Box>
            <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>Inventory Status</Typography>
            <Typography sx={{ color: '#64748B', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Stock levels by product</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#10B981' }}>
                <CheckCircleIcon sx={{ fontSize: 16 }} />
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif' }}>{stockStats.totalInStock}</Typography>
              </Box>
              <Typography sx={{ color: '#64748B', fontSize: '0.725rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>In Stock</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#F59E0B' }}>
                <WarningIcon sx={{ fontSize: 16 }} />
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif' }}>{stockStats.lowStockCount}</Typography>
              </Box>
              <Typography sx={{ color: '#64748B', fontSize: '0.725rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Low</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#EF4444' }}>
                <TrendingDownIcon sx={{ fontSize: 16 }} />
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif' }}>{stockStats.outOfStockCount}</Typography>
              </Box>
              <Typography sx={{ color: '#64748B', fontSize: '0.725rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Out</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '400px', overflowY: 'auto' }}>
          {stock.map((product, idx) => {
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
          {stock.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>No products in inventory</Typography>
            </Box>
          )}
        </Box>
      </Paper>
    );
  };

  const renderAlertTypeIcon = (type) => {
    switch (type) {
      case 'Stock Alert':
      case 'Low Stock':
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
      <Paper sx={{ p: 4, borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.03)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <WarningIcon sx={{ color: '#EF4444', filter: 'drop-shadow(0 2px 4px rgba(239,68,68,0.2))' }} />
            <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>Alerts & Notifications</Typography>
          </Box>
          <Button
            size="small"
            onClick={() => markAllAsRead()}
            disabled={notificationsLoading || !alerts.length}
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
  const showAlertsSidebar = notificationItems && notificationItems.length > 0;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load dashboard data.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: 'background.default', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: { xs: 1.5, md: 2 }, mb: 4 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: { xs: 1.5, md: 2 } }}>
            <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 800, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
              Staff Dashboard
            </Typography>
            <QuickActions compact />
          </Box>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mt: 0.5 }}>Welcome back, {user?.name || 'Staff'}</Typography>
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
            <Grid item xs={12} sm={6} md={6}><InfoCard title="Today's Sales" value={dashboardData?.todaySales || 0} icon={<AttachMoney />} color="#10B981" valueFormat="currency" trend={dashboardData?.todaySalesGrowth} subtitle={`${dashboardData?.todayOrders || 0} orders today`} linkTo="/dashboard/sales/all" /></Grid>
            <Grid item xs={12} sm={6} md={6}><InfoCard title="Monthly Sales" value={dashboardData?.monthSales || 0} icon={<TrendingUp />} color="#6366F1" valueFormat="currency" trend={dashboardData?.monthSalesGrowth} subtitle={`${dashboardData?.monthOrders || 0} orders this month`} linkTo="/dashboard/reports/sales" /></Grid>
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

export default StaffDashboard;
