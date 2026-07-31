import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Grid, Card, CardContent, Chip, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, InputAdornment, IconButton } from '@mui/material';
import { Search as SearchIcon, Visibility as ViewIcon, Payment as PaymentIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EcommerceLayout from '../../ecommerce/layout/EcommerceLayout';

const API_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5001/api';

const EMIOutstanding = () => {
  const navigate = useNavigate();
  const [emiOrders, setEmiOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchEMIOrders();
  }, []);

  const fetchEMIOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/emi-orders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEmiOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching EMI orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMakePayment = (orderId) => {
    navigate(`/emi-orders/${orderId}/payment`);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'active': 'info',
      'completed': 'success',
      'defaulted': 'error'
    };
    return colors[status?.toLowerCase()] || 'default';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'due': 'error',
      'paid': 'success',
      'partial': 'warning',
      'upcoming': 'info'
    };
    return colors[status?.toLowerCase()] || 'default';
  };

  const formatCurrency = (amount) => {
    return `৳${amount?.toLocaleString() || '0'}`;
  };

  const filteredOrders = emiOrders.filter(order => {
    const matchesSearch = order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.emiStatus?.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <EcommerceLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" fontWeight="bold">
            EMI Outstanding
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/shop/products')}
          >
            Continue Shopping
          </Button>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent>
                <Typography variant="body2" gutterBottom>
                  Total EMI Orders
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {emiOrders.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              <CardContent>
                <Typography variant="body2" gutterBottom>
                  Pending Payments
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {emiOrders.filter(o => o.emiStatus === 'active').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
              <CardContent>
                <Typography variant="body2" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {emiOrders.filter(o => o.emiStatus === 'completed').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
              <CardContent>
                <Typography variant="body2" gutterBottom>
                  Overdue
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {emiOrders.filter(o => o.paymentStatus === 'due').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by customer name or order number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Filter by Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="defaulted">Defaulted</option>
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {/* EMI Orders Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Order #</strong></TableCell>
                <TableCell><strong>Customer</strong></TableCell>
                <TableCell><strong>Total Amount</strong></TableCell>
                <TableCell><strong>Paid</strong></TableCell>
                <TableCell><strong>Due</strong></TableCell>
                <TableCell><strong>Next Installment</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order._id} hover>
                  <TableCell>{order.orderNumber || order._id.slice(-8)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {order.customer?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.customer?.phone}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="success.main">
                      {formatCurrency(order.totalPaid)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="error.main">
                      {formatCurrency(order.dueAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {order.nextInstallmentDate ? (
                      <>
                        <Typography variant="body2">
                          {new Date(order.nextInstallmentDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(order.installmentAmount)}
                        </Typography>
                      </>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.emiStatus || 'pending'}
                      color={getStatusColor(order.emiStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/emi-orders/${order._id}`)}
                    >
                      <ViewIcon />
                    </IconButton>
                    {order.emiStatus === 'active' && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleMakePayment(order._id)}
                      >
                        <PaymentIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredOrders.length === 0 && (
          <Paper sx={{ p: 6, textAlign: 'center', mt: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No EMI orders found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'Try a different search term' : 'Start shopping with EMI to see your orders'}
            </Typography>
          </Paper>
        )}
      </Container>
    </EcommerceLayout>
  );
};

export default EMIOutstanding;
