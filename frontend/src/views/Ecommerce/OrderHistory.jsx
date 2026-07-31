import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Paper, Grid, Card, CardContent, 
  Chip, Button, Divider, TextField, Alert, Skeleton, Fade, Zoom,
  IconButton, Tooltip, useTheme, alpha
} from '@mui/material';
import { 
  ShoppingBagOutlined, 
  LocalShippingOutlined,
  CheckCircleOutline,
  AccessTime,
  ArrowForward,
  Inventory2Outlined,
  ReceiptLongOutlined,
  SearchOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EcommerceLayout from '../../ecommerce/layout/EcommerceLayout';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cloudCard } from '../../utils/cloudinaryUtils';

const API_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5001/api';

const MotionCard = motion(Card);
const MotionBox = motion(Box);

const OrderHistory = ({ noLayout = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guestEmail, setGuestEmail] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    checkAuth();
  }, [isAuthenticated, authLoading]);

  const checkAuth = () => {
    if (isAuthenticated) {
      fetchUserOrders();
    } else {
      const guestEmailSaved = localStorage.getItem('guestEmail');
      if (guestEmailSaved) {
        setGuestEmail(guestEmailSaved);
        fetchGuestOrders(guestEmailSaved);
      } else {
        setShowGuestForm(true);
        setLoading(false);
      }
    }
  };

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/sales-orders/my`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load your stunning orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuestOrders = async (email) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${API_URL}/sales-orders/guest-lookup`, {
        email: email
      });
      
      if (response.data.success) {
        setOrders(response.data.orders || []);
        setShowGuestForm(false);
      } else {
        setError('No orders found with this email address.');
        setShowGuestForm(true);
      }
    } catch (error) {
      console.error('Guest order lookup error:', error);
      setError(error.response?.data?.message || 'Failed to fetch guest orders');
      setShowGuestForm(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestOrderLookup = async () => {
    if (!guestEmail.trim()) {
      setError('Please enter a valid email address');
      return;
    }
    await fetchGuestOrders(guestEmail);
  };

  const getOrderStatusConfig = (status, approvalStatus) => {
    if (approvalStatus?.toLowerCase() === 'pending') {
      return { 
        color: '#f59e0b', 
        bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', 
        icon: <AccessTime sx={{ fontSize: 16 }} />,
        glow: 'rgba(245, 158, 11, 0.4)'
      };
    }
    const s = status?.toLowerCase() || 'pending';
    switch (s) {
      case 'processing':
        return { 
          color: '#3b82f6', 
          bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', 
          icon: <AccessTime sx={{ fontSize: 16 }} />,
          glow: 'rgba(59, 130, 246, 0.4)'
        };
      case 'confirmed':
        return { 
          color: '#8b5cf6', 
          bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', 
          icon: <CheckCircleOutline sx={{ fontSize: 16 }} />,
          glow: 'rgba(139, 92, 246, 0.4)'
        };
      case 'shipped':
      case 'out for delivery':
        return { 
          color: '#f59e0b', 
          bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', 
          icon: <LocalShippingOutlined sx={{ fontSize: 16 }} />,
          glow: 'rgba(245, 158, 11, 0.4)'
        };
      case 'delivered':
        return { 
          color: '#10b981', 
          bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', 
          icon: <CheckCircleOutline sx={{ fontSize: 16 }} />,
          glow: 'rgba(16, 185, 129, 0.4)'
        };
      case 'cancelled':
      case 'returned':
        return { 
          color: '#ef4444', 
          bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', 
          icon: <CheckCircleOutline sx={{ fontSize: 16 }} />,
          glow: 'rgba(239, 68, 68, 0.4)'
        };
      default:
        return { 
          color: '#64748b', 
          bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
          icon: <AccessTime sx={{ fontSize: 16 }} />,
          glow: 'rgba(100, 116, 139, 0.4)'
        };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `৳${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  if (loading && orders.length === 0) {
    const loadingContent = (
      <Box sx={{ py: noLayout ? 4 : 10, px: 2, minHeight: '80vh', background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)' }}>
        <Container maxWidth="lg">
          <Skeleton variant="text" width={300} height={80} sx={{ mb: 6, borderRadius: 2 }} />
          {[1, 2].map((item) => (
            <Skeleton key={item} variant="rectangular" height={280} sx={{ mb: 4, borderRadius: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }} />
          ))}
        </Container>
      </Box>
    );
    return noLayout ? loadingContent : <EcommerceLayout>{loadingContent}</EcommerceLayout>;
  }

  const content = (
    <Box sx={{ 
      pt: noLayout ? 2 : 4, 
      pb: noLayout ? 4 : 8,
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background elements */}
      <Box sx={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, rgba(59,130,246,0) 70%)', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: -150, left: -50, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.03) 0%, rgba(16,185,129,0) 70%)', zIndex: 0 }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <MotionBox 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          sx={{ mb: 6, display: 'flex', alignItems: 'center', gap: 2.5 }}
        >
          <Box sx={{ 
            p: 2, 
            borderRadius: '20px', 
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.8)'
          }}>
            <ShoppingBagOutlined sx={{ fontSize: 36, color: 'primary.main' }} />
          </Box>
          <Box>
            <Typography variant="h3" fontWeight="900" sx={{ 
              fontFamily: '"Outfit", sans-serif', 
              background: 'linear-gradient(90deg, #0f172a 0%, #334155 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-1px'
            }}>
              Order Journey
            </Typography>
            <Typography variant="subtitle1" color="#64748b" sx={{ mt: 0.5, fontWeight: 500 }}>
              Track and manage your premium purchases
            </Typography>
          </Box>
        </MotionBox>

        <AnimatePresence>
          {error && (
            <MotionBox
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Alert severity="error" sx={{ mb: 5, borderRadius: 3, boxShadow: '0 8px 24px rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)', '& .MuiAlert-icon': { color: '#ef4444' } }}>
                <Typography fontWeight="600">{error}</Typography>
              </Alert>
            </MotionBox>
          )}
        </AnimatePresence>

        {!isAuthenticated && showGuestForm && (
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <Paper sx={{ 
              p: 6, 
              mb: 5, 
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)',
              border: '1px solid rgba(255,255,255,0.5)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6)' }} />
              
              <Typography variant="h4" fontWeight="800" gutterBottom color="#0f172a" sx={{ fontFamily: '"Outfit", sans-serif' }}>
                Guest Tracker
              </Typography>
              <Typography variant="body1" color="#64748b" paragraph sx={{ mb: 4, fontSize: '1.1rem' }}>
                Enter the email address you used during your luxurious checkout experience.
              </Typography>
              
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="E.g. elegance@example.com"
                    InputProps={{
                      startAdornment: <SearchOutlined sx={{ color: '#94a3b8', mr: 1 }} />,
                      sx: { 
                        borderRadius: 3, 
                        bgcolor: 'rgba(255,255,255,0.9)', 
                        height: '60px',
                        fontSize: '1.1rem',
                        transition: 'all 0.3s ease',
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 4px rgba(59,130,246,0.15)',
                          bgcolor: '#ffffff'
                        }
                      }
                    }}
                    sx={{ '& fieldset': { border: '1px solid #e2e8f0' } }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleGuestOrderLookup}
                    sx={{ 
                      height: '60px', 
                      borderRadius: 3,
                      fontWeight: 800,
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                      boxShadow: '0 10px 25px rgba(37, 99, 235, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)',
                        boxShadow: '0 15px 35px rgba(37, 99, 235, 0.4)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Track Order
                  </Button>
                </Grid>
              </Grid>

              <Divider sx={{ my: 5, borderColor: 'rgba(0,0,0,0.06)' }} />
              
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/shop/login')}
                  sx={{ 
                    borderRadius: 3, 
                    textTransform: 'none', 
                    fontWeight: 700, 
                    px: 4, 
                    py: 1.5,
                    borderWidth: '2px',
                    '&:hover': { borderWidth: '2px', bgcolor: 'rgba(59,130,246,0.05)' }
                  }}
                >
                  Sign In for Full Experience
                </Button>
                <Typography variant="body2" color="#94a3b8">or</Typography>
                <Button
                  variant="text"
                  onClick={() => navigate('/shop/products')}
                  sx={{ 
                    borderRadius: 3, 
                    textTransform: 'none', 
                    fontWeight: 700,
                    px: 3,
                    color: '#64748b',
                    '&:hover': { color: '#0f172a', bgcolor: 'transparent' }
                  }}
                >
                  Continue Exploring →
                </Button>
              </Box>
            </Paper>
          </MotionBox>
        )}

        {!showGuestForm && orders.length === 0 && !loading && (
          <MotionBox
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
          >
            <Paper sx={{ 
              p: 8, 
              textAlign: 'center', 
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              borderRadius: '32px', 
              boxShadow: '0 20px 60px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,1)',
              border: '1px solid rgba(255,255,255,0.6)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '500px'
            }}>
              <Box sx={{ 
                width: 140, 
                height: 140, 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 4,
                boxShadow: 'inset 0 4px 10px rgba(255,255,255,0.8), 0 10px 20px rgba(0,0,0,0.05)'
              }}>
                <ReceiptLongOutlined sx={{ fontSize: 60, color: '#94a3b8' }} />
              </Box>
              <Typography variant="h3" fontWeight="900" gutterBottom color="#0f172a" sx={{ fontFamily: '"Outfit", sans-serif', letterSpacing: '-1px' }}>
                Your canvas is empty
              </Typography>
              <Typography variant="body1" color="#64748b" paragraph sx={{ mb: 5, maxWidth: 500, fontSize: '1.1rem', lineHeight: 1.7 }}>
                You haven't painted your order history yet. Discover our exclusive collections and place your first premium order today.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/shop/products')}
                size="large"
                sx={{ 
                  borderRadius: '50px',
                  px: 6,
                  py: 2,
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 15px 40px rgba(15, 23, 42, 0.4)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                Explore Collection
              </Button>
            </Paper>
          </MotionBox>
        )}

        {!showGuestForm && orders.length > 0 && (
          <MotionBox 
            initial="hidden" 
            animate="visible" 
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
            }}
          >
            <Grid container spacing={4}>
              {orders.map((order) => {
                const statusConfig = getOrderStatusConfig(order.orderStatus, order.approvalStatus);
                const orderTotal = order.total || order.totalAmount || 0;
                
                return (
                  <Grid item xs={12} key={order._id}>
                    <MotionCard 
                      variants={{
                        hidden: { y: 30, opacity: 0, scale: 0.98 },
                        visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.5, type: 'spring', bounce: 0.4 } }
                      }}
                      sx={{ 
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px', 
                        boxShadow: '0 10px 40px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)',
                        border: '1px solid rgba(255,255,255,0.7)',
                        overflow: 'hidden',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-6px)',
                          boxShadow: `0 20px 50px rgba(0,0,0,0.06), 0 0 40px ${statusConfig.glow}`,
                          borderColor: statusConfig.color
                        }
                      }}
                    >
                      <Box sx={{ 
                        px: { xs: 3, sm: 4 }, 
                        py: 2.5, 
                        background: 'rgba(248, 250, 252, 0.6)',
                        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 3
                      }}>
                        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <Box>
                            <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.1em', display: 'block', mb: 0 }}>
                              ORDER NO.
                            </Typography>
                            <Typography variant="h6" fontWeight="800" color="#0f172a" sx={{ fontFamily: '"Outfit", sans-serif' }}>
                              #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                            </Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.1em', display: 'block', mb: 0 }}>
                              PURCHASED ON
                            </Typography>
                            <Typography variant="subtitle1" fontWeight="700" color="#334155">
                              {formatDate(order.createdAt)}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip
                            icon={statusConfig.icon}
                            label={
                              order.approvalStatus?.toLowerCase() === 'pending'
                                ? 'PLACED'
                                : (order.orderStatus || 'Pending').toUpperCase()
                            }
                            sx={{ 
                              fontWeight: 800, 
                              fontSize: '0.75rem',
                              letterSpacing: '0.05em',
                              height: 34,
                              borderRadius: '10px',
                              background: statusConfig.bg,
                              color: statusConfig.color,
                              border: `1px solid ${statusConfig.color}40`,
                              boxShadow: `0 4px 12px ${statusConfig.glow}`,
                              px: 1,
                              '& .MuiChip-icon': { color: statusConfig.color }
                            }}
                          />
                        </Box>
                      </Box>

                      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                        {order.items && order.items.length > 0 && (
                          <Box sx={{ mb: 4 }}>
                            <Grid container spacing={3}>
                              {order.items.slice(0, 3).map((item, idx) => (
                                <Grid item xs={12} sm={4} key={idx}>
                                  <MotionBox 
                                    whileHover={{ scale: 1.02 }}
                                    sx={{ 
                                      display: 'flex', 
                                      gap: 2.5, 
                                      p: 2,
                                      borderRadius: '16px',
                                      background: '#ffffff',
                                      border: '1px solid #f1f5f9',
                                      boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                                      cursor: 'default',
                                      height: '100%'
                                    }}
                                  >
                                    <Box sx={{
                                      width: 90,
                                      height: 90,
                                      borderRadius: '12px',
                                      overflow: 'hidden',
                                      flexShrink: 0,
                                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: '1px solid #e2e8f0',
                                      position: 'relative'
                                    }}>
                                      <Box 
                                        component="img"
                                        src={cloudCard(item.product?.image || item.product?.images?.[0] || item.image || 'https://via.placeholder.com/100?text=No+Image')}
                                        alt={item.product?.name || item.name}
                                        sx={{ 
                                          width: '100%', 
                                          height: '100%', 
                                          objectFit: 'cover',
                                          transition: 'transform 0.5s ease',
                                          '&:hover': { transform: 'scale(1.1)' }
                                        }}
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=No+Image'; }}
                                      />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                                      <Typography variant="subtitle2" fontWeight="700" color="#0f172a" sx={{ mb: 1, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {item.product?.name || item.name}
                                      </Typography>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                                        <Typography variant="body2" fontWeight="600" color="#64748b" sx={{ bgcolor: '#f1f5f9', px: 1, py: 0.2, borderRadius: 1 }}>
                                          Qty: {item.quantity}
                                        </Typography>
                                        <Typography variant="subtitle2" fontWeight="800" color="#3b82f6">
                                          {formatCurrency(item.price || item.unitPrice)}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </MotionBox>
                                </Grid>
                              ))}
                              {order.items.length > 3 && (
                                <Grid item xs={12} sm={4}>
                                  <Box sx={{ 
                                    height: '100%',
                                    p: 2, 
                                    borderRadius: '16px', 
                                    background: 'rgba(241, 245, 249, 0.5)', 
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px dashed #cbd5e1',
                                    transition: 'all 0.3s',
                                    '&:hover': { bgcolor: '#f1f5f9', borderColor: '#94a3b8' }
                                  }}>
                                    <Typography variant="h4" fontWeight="800" color="#64748b">
                                      +{order.items.length - 3}
                                    </Typography>
                                    <Typography variant="body2" fontWeight="700" color="#94a3b8" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                                      More Items
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        )}

                        <Divider sx={{ my: 3, borderColor: 'rgba(226, 232, 240, 0.8)', borderStyle: 'dashed' }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 3 }}>
                          <Box>
                            <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.1em', display: 'block', mb: 0 }}>
                              TOTAL INVESTMENT
                            </Typography>
                            <Typography variant="h4" fontWeight="900" sx={{ 
                              fontFamily: '"Outfit", sans-serif',
                              background: 'linear-gradient(90deg, #0f172a 0%, #3b82f6 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              letterSpacing: '-1px'
                            }}>
                              {formatCurrency(orderTotal)}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                              variant="outlined"
                              endIcon={<ArrowForward sx={{ ml: 1 }} />}
                              onClick={() => navigate(`/shop/orders/${order._id}`)}
                              sx={{ 
                                borderRadius: '12px', 
                                textTransform: 'none', 
                                fontWeight: 700,
                                px: 4,
                                py: 1.2,
                                borderWidth: '2px',
                                borderColor: '#e2e8f0',
                                color: '#0f172a',
                                '&:hover': {
                                  borderWidth: '2px',
                                  borderColor: '#3b82f6',
                                  background: 'rgba(59,130,246,0.05)'
                                }
                              }}
                            >
                              View Details
                            </Button>
                            {order.orderStatus?.toLowerCase() === 'delivered' && (
                              <Button
                                variant="contained"
                                onClick={() => navigate(`/shop/orders/${order._id}/review`)}
                                sx={{ 
                                  borderRadius: '12px', 
                                  textTransform: 'none', 
                                  fontWeight: 700,
                                  px: 4,
                                  py: 1.2,
                                  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.2)',
                                  background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                                  '&:hover': {
                                    boxShadow: '0 12px 25px rgba(15, 23, 42, 0.3)',
                                    transform: 'translateY(-2px)'
                                  }
                                }}
                              >
                                Write Review
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </MotionCard>
                  </Grid>
                );
              })}
            </Grid>
          </MotionBox>
        )}
      </Container>
    </Box>
  );

  return noLayout ? content : <EcommerceLayout>{content}</EcommerceLayout>;
};

export default OrderHistory;
