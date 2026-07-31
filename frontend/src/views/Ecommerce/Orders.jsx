import React from 'react';
import { useQuery } from 'react-query';
import { Box, Container, Typography, Paper, CircularProgress, Chip, Grid, Button, Divider } from '@mui/material';
import { ShoppingBag, LocalShipping, CheckCircle, Description } from '@mui/icons-material';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import EcommerceLayout from '../../ecommerce/layout/EcommerceLayout';
import { BRAND_PRIMARY } from '../../theme/brandColors';
import { cloudThumb } from '../../utils/cloudinaryUtils';

const Orders = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: orders, isLoading, error } = useQuery(
    ['userOrders', user?._id],
    async () => {
      const response = await api.get('/api/sale-orders/my');
      return response.data.data;
    },
    {
      enabled: isAuthenticated,
      refetchOnWindowFocus: false,
    }
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Delivered': return 'info';
      case 'Partial': return 'warning';
      case 'Pending': return 'error';
      default: return 'default';
    }
  };

  if (!isAuthenticated) {
    return (
      <EcommerceLayout>
        <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>Please log in to view your orders</Typography>
          <Button variant="contained" onClick={() => navigate('/shop/login')} sx={{ bgcolor: BRAND_PRIMARY }}>
            Login Now
          </Button>
        </Container>
      </EcommerceLayout>
    );
  }

  return (
    <EcommerceLayout>
      <Box sx={{ py: 6, bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight="800" sx={{ mb: 4, fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>
            My Orders
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress sx={{ color: BRAND_PRIMARY }} />
            </Box>
          ) : error ? (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '12px' }}>
              <Typography color="error">Error loading orders. Please try again.</Typography>
            </Paper>
          ) : !orders || orders.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <ShoppingBag sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                No orders yet. Start shopping to see your orders here!
              </Typography>
              <Button variant="contained" onClick={() => navigate('/shop/products')} sx={{ bgcolor: BRAND_PRIMARY }}>
                Browse Products
              </Button>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {orders.map((order) => (
                <Paper key={order._id} sx={{ p: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <Box sx={{ bgcolor: '#f1f5f9', p: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>ORDER PLACED</Typography>
                      <Typography sx={{ fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>TOTAL</Typography>
                      <Typography sx={{ fontSize: '0.95rem', color: '#334155', fontWeight: 700 }}>
                        ৳{order.total?.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>ORDER #</Typography>
                      <Typography sx={{ fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                        {order.orderNumber}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          Status: <Chip label={order.status} color={getStatusColor(order.status)} size="small" sx={{ fontWeight: 600 }} />
                        </Typography>
                        <Typography sx={{ color: '#475569', fontSize: '0.9rem' }}>
                          Payment: <strong>{order.paymentMethod}</strong> (Due: ৳{order.dueAmount?.toLocaleString()})
                        </Typography>
                      </Box>
                      <Button variant="outlined" size="small" startIcon={<Description />} sx={{ borderColor: BRAND_PRIMARY, color: BRAND_PRIMARY }}>
                        View Invoice
                      </Button>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {order.items?.map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                        <Box
                          component="img"
                          src={cloudThumb(item.product?.image || item.product?.images?.[0] || 'https://via.placeholder.com/80')}
                          alt={item.product?.name || 'Product Image'}
                          sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0', mr: 3 }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1.05rem' }}>
                            {item.product?.name || 'Unknown Product'}
                          </Typography>
                          <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                            Qty: {item.quantity} × ৳{item.price?.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
                            ৳{(item.quantity * item.price).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Container>
      </Box>
    </EcommerceLayout>
  );
};

export default Orders;
