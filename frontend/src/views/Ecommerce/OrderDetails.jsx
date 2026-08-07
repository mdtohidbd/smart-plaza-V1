import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Grid, Card, CardContent, Button, Chip, Divider, Alert, Stepper, Step, StepLabel } from '@mui/material';
import axios from 'axios';
import EcommerceLayout from '../../ecommerce/layout/EcommerceLayout';
import { cloudThumb } from '../../utils/cloudinaryUtils';

const API_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5001/api';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const guestEmail = localStorage.getItem('guestEmail');
      const config = {};
      
      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      } else if (guestEmail) {
        config.headers = { 'x-guest-email': guestEmail };
      }
      
      const endpoint = token ? `/sales-orders/my/${id}` : `/sales-orders/${id}`;
      const response = await axios.get(`${API_URL}${endpoint}`, config);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Order not found or access denied');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const token = localStorage.getItem('token');
      const guestEmail = localStorage.getItem('guestEmail');
      const config = {};
      
      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      } else if (guestEmail) {
        config.headers = { 'x-guest-email': guestEmail };
      }

      await axios.put(`${API_URL}/sales-orders/${id}/cancel`, {}, config);
      alert('Order cancelled successfully.');
      fetchOrderDetails();
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert(err.response?.data?.message || 'Failed to cancel the order. Please try again.');
    }
  };

  const getOrderStatusStep = (status) => {
    // If order is pending approval, it is in the first step (Placed)
    if (order?.approvalStatus === 'Pending' || order?.status === 'Pending') {
      return 0; // Placed is active (step 0)
    }

    const normalized = status?.toLowerCase();
    const steps = ['pending', 'confirmed', 'processing', 'out for delivery', 'delivered'];
    
    // For backwards compatibility mapping 'shipped' to 'out for delivery'
    if (normalized === 'shipped') {
      return 3; // Out for Delivery is active (step 3)
    }
    
    if (normalized === 'delivered') {
      return 5; // All steps completed
    }
    
    const index = steps.indexOf(normalized);
    if (index >= 0) {
      return index;
    }
    
    // Fallback based on order.status
    if (order?.status === 'Approved') {
      return 1; // Confirmed is active (step 1)
    }
    
    return 0;
  };

  const formatCurrency = (amount) => {
    return `৳${amount?.toLocaleString() || '0'}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <EcommerceLayout>
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography>Loading order details...</Typography>
        </Box>
      </EcommerceLayout>
    );
  }

  if (error || !order) {
    return (
      <EcommerceLayout>
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Alert severity="error">{error || 'Order not found'}</Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/shop/orders')}
            sx={{ mt: 3 }}
          >
            Back to Orders
          </Button>
        </Container>
      </EcommerceLayout>
    );
  }

  return (
    <EcommerceLayout>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Order Header */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 1, boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Order #{order.orderNumber || order._id.slice(-8)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Placed on {formatDate(order.createdAt)}
              </Typography>
            </Box>
            <Chip
              label={
                order.status?.toLowerCase() === 'cancelled' ? 'CANCELLED' :
                order.status?.toLowerCase() === 'returned' ? 'RETURNED' :
                order.approvalStatus?.toLowerCase() === 'pending' ? 'PLACED' :
                (order.orderStatus || 'Processing').toUpperCase()
              }
              color={
                order.status?.toLowerCase() === 'cancelled' ? 'error' :
                order.status?.toLowerCase() === 'returned' ? 'error' :
                order.orderStatus?.toLowerCase() === 'delivered' ? 'success' :
                order.approvalStatus?.toLowerCase() === 'pending' ? 'warning' : 'primary'
              }
              sx={{ fontWeight: 'bold', fontSize: '1rem', px: 2, py: 1 }}
            />
          </Box>
        </Paper>

        {/* Order Status Tracker */}
        {order.orderStatus && order.orderStatus?.toLowerCase() !== 'cancelled' && order.orderStatus?.toLowerCase() !== 'returned' && (
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 1, boxShadow: 'none' }}>
            <Typography variant="h6" gutterBottom>
              Order Status
            </Typography>
            <Stepper activeStep={getOrderStatusStep(order.orderStatus)} alternativeLabel sx={{ mt: 4 }}>
              <Step><StepLabel>Placed</StepLabel></Step>
              <Step><StepLabel>Confirmed</StepLabel></Step>
              <Step><StepLabel>Processing</StepLabel></Step>
              <Step><StepLabel>Out for Delivery</StepLabel></Step>
              <Step><StepLabel>Delivered</StepLabel></Step>
            </Stepper>
          </Paper>
        )}

        <Grid container spacing={3}>
          {/* Order Items */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 1, boxShadow: 'none' }}>
              <Typography variant="h6" gutterBottom>
                Order Items ({order.items?.length || 0})
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              {order.items?.map((item, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={3}>
                      <img
                        src={cloudThumb(item.product?.image || item.product?.images?.[0] || item.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23111827"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="48" fill="%236366F1"%3E📦%3C/text%3E%3C/svg%3E')}
                        alt={item.product?.name || item.name}
                        style={{
                          width: '100%',
                          borderRadius: 8,
                          aspectRatio: '1'
                        }}
                      />
                    </Grid>
                    <Grid item xs={9}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {item.product?.name || item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Quantity: {item.quantity}
                      </Typography>
                      {item.color && (
                        <Typography variant="body2" color="text.secondary">
                          Color: {item.color}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Price: {formatCurrency(item.unitPrice || item.price)}
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                        Total: {formatCurrency((item.unitPrice || item.price) * item.quantity)}
                      </Typography>
                    </Grid>
                  </Grid>
                  {index < order.items.length - 1 && <Divider sx={{ mt: 3 }} />}
                </Box>
              ))}
            </Paper>
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 1, boxShadow: 'none' }}>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">Subtotal</Typography>
                <Typography>{formatCurrency(order.subTotal || order.subtotal)}</Typography>
              </Box>
              
              {order.deliveryCharge > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Delivery Charge</Typography>
                  <Typography>{formatCurrency(order.deliveryCharge)}</Typography>
                </Box>
              )}
              
              {order.discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Discount</Typography>
                  <Typography color="success.main">-{formatCurrency(order.discount)}</Typography>
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {formatCurrency(order.total || order.totalAmount)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Customer Information */}
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Customer Information
              </Typography>
              <Typography variant="body2">
                {order.customer?.name || order.shippingAddress?.name}
              </Typography>
              <Typography variant="body2">
                {order.customer?.email || order.shippingAddress?.email}
              </Typography>
              <Typography variant="body2">
                {order.customer?.phone || order.shippingAddress?.phone}
              </Typography>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>
                    Shipping Address
                  </Typography>
                  <Typography variant="body2">
                    {order.shippingAddress.address}
                  </Typography>
                  <Typography variant="body2">
                    {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                  </Typography>
                </>
              )}

              {/* Action Buttons */}
              <Box sx={{ mt: 3 }}>
                {order.orderStatus?.toLowerCase() === 'delivered' && (
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate(`/shop/orders/${id}/review`)}
                  >
                    Write a Review
                  </Button>
                )}
                {['pending', 'approved', 'confirmed', 'processing'].includes(order.orderStatus?.toLowerCase()) && (
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    onClick={handleCancelOrder}
                  >
                    Cancel Order
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Back Button */}
        <Button
          variant="outlined"
          onClick={() => navigate('/shop/orders')}
          sx={{ mt: 3 }}
        >
          Back to Orders
        </Button>
      </Container>
    </EcommerceLayout>
  );
};

export default OrderDetails;
