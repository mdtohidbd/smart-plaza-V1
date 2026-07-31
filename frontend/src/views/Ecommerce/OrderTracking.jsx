import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Grid,
  CircularProgress,
  TextField,
  Button
} from '@mui/material';
import {
  LocalShipping as ShippingIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import api from '../../utils/api';
import EcommerceLayout from '../../ecommerce/layout/EcommerceLayout';
import { useAuth } from '../../context/AuthContext';
import { BRAND_PRIMARY } from '../../theme/brandColors';

const steps = [
  { label: 'Order Placed', description: 'Your order has been confirmed' },
  { label: 'Processing', description: 'We are preparing your items' },
  { label: 'Out for Delivery', description: 'Delivery partner has your package' },
  { label: 'Delivered', description: 'Package delivered successfully' }
];

const OrderTracking = ({ noLayout = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');

  useEffect(() => {
    // If authenticated, we don't need email input
    // If coming from order success page with email state
    if (location.state?.email) {
      setEmailInput(location.state.email);
      setSubmittedEmail(location.state.email);
    }
  }, [location.state]);

  const { data: orders, isLoading, error } = useQuery(
    ['trackingOrders', isAuthenticated ? 'auth' : submittedEmail],
    async () => {
      if (isAuthenticated) {
        const response = await api.get('/api/sales-orders/my');
        return response.data.data;
      } else {
        const response = await api.post('/api/sales-orders/guest-lookup', { email: submittedEmail });
        return response.data.orders;
      }
    },
    {
      enabled: !authLoading && (isAuthenticated || !!submittedEmail),
      refetchOnWindowFocus: false,
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubmittedEmail(emailInput.trim());
    }
  };

  const getStatusStep = (status) => {
    const normalized = status?.toLowerCase();
    const statusMap = {
      'pending': 0,
      'processing': 1,
      'approved': 1,
      'shipped': 2,
      'out-for-delivery': 2,
      'out for delivery': 2,
      'delivered': 3
    };
    return statusMap[normalized] !== undefined ? statusMap[normalized] : 0;
  };

  const content = (
      <Box sx={{ py: noLayout ? 0 : 6, bgcolor: noLayout ? 'transparent' : '#f8fafc', minHeight: noLayout ? 'auto' : '100vh' }}>
        <Container maxWidth={noLayout ? false : "lg"} disableGutters={noLayout}>
          {/* Header */}
      <Paper
        sx={{
          p: { xs: 2.5, md: 4 },
          mb: 3,
          bgcolor: 'background.paper',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          boxShadow: 'none'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ShippingIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Box>
            <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
              Order Tracking
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track your deliveries in real-time
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Lookup Form and CTA */}
      {!isAuthenticated && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: { xs: 2.5, md: 4 }, height: '100%', borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>Track Guest Order</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter the email address you used during checkout to track your orders.
              </Typography>
              <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email Address"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: BRAND_PRIMARY,
                      },
                    },
                  }}
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  disableElevation
                  startIcon={<SearchIcon />}
                  sx={{ 
                    bgcolor: BRAND_PRIMARY, 
                    '&:hover': { bgcolor: '#0f9c8d' }, 
                    whiteSpace: 'nowrap',
                    width: { xs: '100%', sm: 'auto' },
                    py: { xs: 1.2, sm: 'auto' }
                  }}
                >
                  Track
                </Button>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: { xs: 2.5, md: 4 }, height: '100%', borderRadius: 2, bgcolor: '#F0FDFA', border: '1px solid #CCFBF1', boxShadow: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#0F766E', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>Want more features?</Typography>
              <Typography variant="body2" sx={{ mb: 3, color: '#0F766E' }}>
                Login to enjoy your full order history, EMI payment dashboard, saved wishlists, and exclusive offers!
              </Typography>
              <Button 
                variant="outlined" 
                fullWidth
                onClick={() => navigate('/shop/login')}
                sx={{ 
                  color: '#0F766E', 
                  borderColor: '#0F766E', 
                  fontWeight: 600,
                  '&:hover': { borderColor: '#0F766E', bgcolor: 'rgba(15, 118, 110, 0.05)' } 
                }}
              >
                Login or Create Account
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress sx={{ color: BRAND_PRIMARY }} />
        </Box>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Paper sx={{ p: 4, mb: 4, borderRadius: 2, textAlign: 'center', color: 'error.main' }}>
          An error occurred while fetching your orders. Please check your email and try again.
        </Paper>
      )}

      {/* Empty State */}
      {!isLoading && (submittedEmail || isAuthenticated) && (!orders || orders.length === 0) && (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            bgcolor: 'background.paper',
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            boxShadow: 'none'
          }}
        >
          <ShippingIcon color="action" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No orders found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start shopping to see your orders here
          </Typography>
        </Paper>
      )}
      
      {!isLoading && orders && orders.length > 0 && (
        <Grid container spacing={3}>
          {orders.map((order) => {
            const activeStep = getStatusStep(order.status);
            return (
              <Grid item xs={12} key={order._id}>
                <Card sx={{ bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 1 }}>
                  <CardContent>
                    {/* Order Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box>
                        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Order #{order.orderNumber || order._id.slice(-6)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip
                        label={order.status?.replace('-', ' ').toUpperCase()}
                        color={
                          order.status === 'delivered' ? 'success' :
                          order.status === 'cancelled' ? 'error' :
                          'primary'
                        }
                      />
                    </Box>

                    {/* Tracking Stepper */}
                    {order.status?.toLowerCase() !== 'cancelled' && order.status?.toLowerCase() !== 'returned' && (
                      <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 3 }}>
                        {steps.map((step, index) => (
                          <Step key={step.label}>
                            <StepLabel
                              StepIconComponent={() => (
                                index <= activeStep ? (
                                  <CheckIcon color="success" />
                                ) : (
                                  <PendingIcon color="action" />
                                )
                              )}
                            >
                              <Typography color="text.primary" sx={{ fontWeight: 600 }}>
                                {step.label}
                              </Typography>
                            </StepLabel>
                            <StepContent>
                              <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                {step.description}
                              </Typography>
                            </StepContent>
                          </Step>
                        ))}
                      </Stepper>
                    )}

                    {/* Order Summary */}
                    <Box sx={{ mt: 3, pt: 3, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Total Amount
                          </Typography>
                          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
                            ৳{order.total?.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Items
                          </Typography>
                          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
                            {order.items?.length || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Payment
                          </Typography>
                          <Typography variant="body2" color="text.primary" sx={{ textTransform: 'capitalize' }}>
                            {order.paymentMethod || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Delivery
                          </Typography>
                          <Typography variant="body2" color="text.primary">
                            {order.deliveryMode || 'Standard'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
        </Container>
      </Box>
  );

  return noLayout ? content : <EcommerceLayout>{content}</EcommerceLayout>;
};

export default OrderTracking;
