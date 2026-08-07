import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  Alert,
  TextField,
  Autocomplete
} from '@mui/material';
import {
  Print as PrintIcon,
  ArrowBack as ArrowBackIcon,
  Done as DoneIcon,
  LocalShipping as LocalShippingIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorOutlineIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  InfoOutlined as InfoOutlinedIcon,
  Refresh as RefreshIcon,
  Undo as UndoIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import api from '../../utils/api';
import { formatDate } from '../../utils/dateUtils';

const SaleOrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [outForDeliveryDialogOpen, setOutForDeliveryDialogOpen] = useState(false);
  const [serialNumbers, setSerialNumbers] = useState({});
  const [availableSerialsMap, setAvailableSerialsMap] = useState({});

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (outForDeliveryDialogOpen) {
      fetchAvailableSerials();
    }
  }, [outForDeliveryDialogOpen]);

  const fetchAvailableSerials = async () => {
    try {
      const response = await api.get('/api/inventory/current-batches');
      const inventory = response.data.data;
      const serialsMap = {};
      inventory.forEach(item => {
        let serials = [];
        if (item.batches) {
          item.batches.forEach(b => {
            if (b.availableSerials) {
              serials = [...serials, ...b.availableSerials];
            }
          });
        }
        const prodId = item._id?.toString() || item.product?._id?.toString() || item.product?.toString();
        if (prodId) {
          serialsMap[prodId] = serials;
        }
      });
      setAvailableSerialsMap(serialsMap);
    } catch (error) {
      console.error('Error fetching available serials:', error);
    }
  };

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/api/sales-orders/${id}`);
      const orderData = response.data.data;
      setOrder(orderData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order:', error);
      setLoading(false);
    }
  };

  const [checkingFraud, setCheckingFraud] = useState(false);
  const [hasAutoChecked, setHasAutoChecked] = useState(false);

  useEffect(() => {
    if (order && !order.fraudCheck?.checkedAt && !hasAutoChecked && !checkingFraud) {
      setHasAutoChecked(true);
      handleCheckFraud();
    }
  }, [order, hasAutoChecked, checkingFraud]);

  const handleCheckFraud = async () => {
    setCheckingFraud(true);
    try {
      await api.post(`/api/v1/fraud-checker/order/${id}/check`);
      fetchOrder(); // Refetch to get updated fraud data
    } catch (error) {
      console.error('Error checking fraud:', error);
      alert('Error performing fraud check: ' + (error.response?.data?.message || error.message));
    } finally {
      setCheckingFraud(false);
    }
  };

  const handleApprove = async () => {
    try {
      await api.put(`/api/sales-orders/${id}/approve`);
      fetchOrder();
    } catch (error) {
      console.error('Error approving order:', error);
    }
  };

  const handleDeliver = async () => {
    try {
      await api.put(`/api/sales-orders/${id}/deliver`);
      fetchOrder();
    } catch (error) {
      console.error('Error delivering order:', error);
      alert('Error delivering order: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleOutForDelivery = async () => {
    try {
      await api.put(`/api/sales-orders/${id}/out-for-delivery`, { serialNumbers });
      setOutForDeliveryDialogOpen(false);
      fetchOrder();
    } catch (error) {
      console.error('Error marking out for delivery:', error);
      alert('Error marking out for delivery: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReturn = async () => {
    if (window.confirm('Are you sure you want to mark this online order as returned? This will replenish the stock.')) {
      try {
        await api.put(`/api/sales-orders/${id}/return`);
        fetchOrder();
      } catch (error) {
        console.error('Error returning order:', error);
        alert('Error returning order: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this online order?')) {
      try {
        await api.put(`/api/sales-orders/${id}/cancel`);
        fetchOrder();
      } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Error cancelling order: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleSerialNumberChange = (itemId, index, value) => {
    setSerialNumbers(prev => {
      const item = order.items.find(i => i._id === itemId);
      const itemSerials = [...(prev[itemId] || Array(item ? item.quantity : 1).fill(''))];
      itemSerials[index] = value;
      return { ...prev, [itemId]: itemSerials };
    });
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="xl">
        <Typography>Order not found</Typography>
      </Container>
    );
  }

  const statusColors = {
    Pending: 'warning',
    Approved: 'info',
    'Out for Delivery': 'warning',
    Delivered: 'success',
    Returned: 'error',
    Cancelled: 'error'
  };

  const approvalStatusColors = {
    Pending: 'warning',
    Approved: 'success',
    Rejected: 'error'
  };

  const getRiskColor = (level) => {
    switch(level) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      case 'NEW': return 'info';
      default: return 'default';
    }
  };

  const getRiskIcon = (level) => {
    switch(level) {
      case 'HIGH': return <ErrorOutlineIcon fontSize="small" />;
      case 'MEDIUM': return <WarningIcon fontSize="small" />;
      case 'LOW': return <CheckCircleOutlineIcon fontSize="small" />;
      case 'NEW': return <InfoOutlinedIcon fontSize="small" />;
      default: return <SecurityIcon fontSize="small" />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          gap: 2, 
          mb: 3, 
          justifyContent: 'space-between',
          bgcolor: '#ffffff',
          p: 3,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'rgba(0,0,0,0.03)', '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' } }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1" fontWeight="800" sx={{ color: '#1e293b', letterSpacing: '-0.5px' }}>
              Order #{order.orderNumber}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {order.status === 'Delivered' ? (
                <Chip label={order.status} color={statusColors[order.status]} size="medium" sx={{ fontWeight: 700, px: 1 }} />
              ) : (
                <Chip label={`Approval: ${order.approvalStatus}`} color={approvalStatusColors[order.approvalStatus]} size="medium" sx={{ fontWeight: 700, px: 1 }} />
              )}
            </Box>
            {order.fraudCheck && order.fraudCheck.checkedAt && (
              <Chip
                icon={getRiskIcon(order.fraudCheck.riskLevel)}
                label={`Risk: ${order.fraudCheck.riskLevel}`}
                color={getRiskColor(order.fraudCheck.riskLevel)}
                size="medium"
                variant="outlined"
                sx={{ fontWeight: 700, borderWidth: 2, px: 1 }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-start', sm: 'flex-end' }, alignItems: 'center', flexWrap: 'wrap' }}>
            
            {order.approvalStatus === 'Pending' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<DoneIcon />}
                onClick={handleApprove}
                sx={{ 
                  fontWeight: 700, 
                  textTransform: 'none', 
                  borderRadius: 2,
                  px: 3,
                  boxShadow: '0 4px 14px 0 rgba(76, 175, 80, 0.39)',
                }}
              >
                Approve Order
              </Button>
            )}

            {order.type === 'online' && (order.approvalStatus === 'Pending' || (order.approvalStatus === 'Approved' && order.status === 'Approved')) && (
              <Button
                variant="contained"
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                sx={{ 
                  fontWeight: 700, 
                  textTransform: 'none', 
                  borderRadius: 2,
                  px: 3,
                  boxShadow: '0 4px 14px 0 rgba(244, 67, 54, 0.39)',
                }}
              >
                Cancel Order
              </Button>
            )}

            {/* For Traditional Orders */}
            {order.type !== 'online' && order.approvalStatus === 'Approved' && order.status === 'Approved' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<LocalShippingIcon />}
                onClick={handleDeliver}
                sx={{ 
                  fontWeight: 700, 
                  textTransform: 'none', 
                  borderRadius: 2,
                  px: 3,
                  boxShadow: '0 4px 14px 0 rgba(33, 150, 243, 0.39)',
                }}
              >
                Mark Delivered
              </Button>
            )}

            {/* For Online Orders */}
            {order.type === 'online' && order.status === 'Approved' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<LocalShippingIcon />}
                onClick={() => setOutForDeliveryDialogOpen(true)}
                sx={{ 
                  fontWeight: 700, 
                  textTransform: 'none', 
                  borderRadius: 2,
                  px: 3,
                  backgroundColor: '#f59e0b',
                  '&:hover': { backgroundColor: '#d97706' },
                  boxShadow: '0 4px 14px 0 rgba(245, 158, 11, 0.39)',
                }}
              >
                Mark Out for Delivery
              </Button>
            )}

            {order.type === 'online' && order.status === 'Out for Delivery' && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<DoneIcon />}
                  onClick={handleDeliver}
                  sx={{ 
                    fontWeight: 700, 
                    textTransform: 'none', 
                    borderRadius: 2,
                    px: 3,
                    boxShadow: '0 4px 14px 0 rgba(76, 175, 80, 0.39)',
                  }}
                >
                  Mark Delivered
                </Button>
                
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<UndoIcon />}
                  onClick={handleReturn}
                  sx={{ 
                    fontWeight: 700, 
                    textTransform: 'none', 
                    borderRadius: 2,
                    px: 3,
                    ml: 2,
                    boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)',
                  }}
                >
                  Mark Returned
                </Button>
              </>
            )}

            <Tooltip title="Print Invoice">
              <Button 
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => {
                  const token = localStorage.getItem('token');
                  if (!token) {
                    alert('No authorization token found. Please log in again.');
                    return;
                  }
                  const printUrl = `${api.defaults.baseURL}/api/sales-orders/${id}/invoice?format=print&token=${encodeURIComponent(token)}`;
                  window.open(printUrl, '_blank');
                }}
                sx={{ 
                  fontWeight: 600, 
                  textTransform: 'none',
                  borderRadius: 2,
                  borderWidth: 2,
                  borderColor: '#e2e8f0',
                  color: '#475569',
                  '&:hover': {
                    borderWidth: 2,
                    borderColor: '#cbd5e1',
                    backgroundColor: '#f8fafc'
                  }
                }}
              >
                Print
              </Button>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="700" color="#1e293b" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoOutlinedIcon color="primary" /> Customer Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="text.secondary">Name:</Typography><Typography fontWeight="600">{order.customer?.contactName}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="text.secondary">Contact:</Typography><Typography fontWeight="600">{order.customer?.contactNumber}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="text.secondary">Address:</Typography><Typography fontWeight="600" textAlign="right" maxWidth="60%">{order.customer?.address}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}><Typography color="text.secondary" fontWeight="600">Total Due:</Typography><Typography fontWeight="700" color="error.main">৳{order.customer?.totalDue?.toFixed(2)}</Typography></Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="700" color="#1e293b" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalShippingIcon color="primary" /> Order Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">Date:</Typography>
                    <Typography fontWeight="600">
                      {formatDate(order.date, true)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="text.secondary">Type:</Typography><Typography fontWeight="600">{order.type}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="text.secondary">Assigned SR:</Typography><Typography fontWeight="600">{order.assignedSR?.name}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="text.secondary">Route:</Typography><Typography fontWeight="600">{order.route?.name || 'N/A'}</Typography></Box>
                  {order.shippingAddress && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="text.secondary">Shipping Address:</Typography><Typography fontWeight="600" textAlign="right" maxWidth="60%">{order.shippingAddress}</Typography></Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)', 
            border: '1px solid rgba(0,0,0,0.05)',
            borderLeft: order.fraudCheck?.checkedAt ? `6px solid ${
              order.fraudCheck.riskLevel === 'HIGH' ? '#f44336' : 
              order.fraudCheck.riskLevel === 'MEDIUM' ? '#ff9800' : 
              order.fraudCheck.riskLevel === 'LOW' ? '#4caf50' : '#2196f3'
            }` : '6px solid #e2e8f0' 
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="700" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#1e293b' }}>
                  <SecurityIcon color="primary" sx={{ fontSize: 28 }} />
                  Fraud Assessment
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={handleCheckFraud}
                  disabled={checkingFraud}
                  sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
                >
                  {checkingFraud ? 'Checking...' : (order.fraudCheck?.checkedAt ? 'Re-check Fraud Risk' : 'Run Fraud Check')}
                </Button>
              </Box>
              
              {!order.fraudCheck?.checkedAt ? (
                <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Typography variant="body1" color="text.secondary" fontWeight="500">
                    No fraud assessment has been performed for this order yet. Run a check to view risk details.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ bgcolor: '#f8fafc', p: 3, borderRadius: 2 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary" fontWeight="600" textTransform="uppercase" letterSpacing="0.5px">Risk Level</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        {getRiskIcon(order.fraudCheck.riskLevel)}
                        <Typography variant="h6" fontWeight="800" color={`${getRiskColor(order.fraudCheck.riskLevel)}.main`}>
                          {order.fraudCheck.riskLevel}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary" fontWeight="600" textTransform="uppercase" letterSpacing="0.5px">Success Ratio</Typography>
                      <Typography variant="h6" fontWeight="800" sx={{ mt: 1, color: '#1e293b' }}>
                        {order.fraudCheck.successRatio}%
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary" fontWeight="600" textTransform="uppercase" letterSpacing="0.5px">Last Checked</Typography>
                      <Typography variant="subtitle1" fontWeight="600" sx={{ mt: 1, color: '#334155' }}>
                        {order.fraudCheck.checkedAt ? new Date(order.fraudCheck.checkedAt).toLocaleString() : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary" fontWeight="600" textTransform="uppercase" letterSpacing="0.5px">Recommendation</Typography>
                      <Typography variant="subtitle1" fontWeight="600" sx={{ mt: 1, color: '#334155' }}>
                        {order.fraudCheck.recommendation || 'Proceed with normal workflow.'}
                      </Typography>
                    </Grid>
                    {order.fraudCheck.couriers && order.fraudCheck.couriers.length > 0 && (
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" gutterBottom fontWeight="700" color="#475569">COURIER DETAILS</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                          {order.fraudCheck.couriers.map((courier, idx) => (
                            <Box key={idx} sx={{ bgcolor: '#ffffff', p: 2, borderRadius: 2, minWidth: 160, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
                              <Typography variant="subtitle2" fontWeight="700" color="#1e293b" gutterBottom>{courier.name}</Typography>
                              <Typography variant="body2" fontWeight="700" color={courier.successRatio >= 80 ? 'success.main' : courier.successRatio >= 50 ? 'warning.main' : 'error.main'}>
                                Success: {courier.successRatio}%
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">Delivered: <b>{courier.delivered || 0}</b></Typography>
                                <Typography variant="caption" color="text.secondary">Cancelled: <b>{courier.cancelled || 0}</b></Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" fontWeight="700" color="#1e293b">
                  Order Items
                </Typography>
              </Box>
              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Product</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', textAlign: 'center' }}>Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', textAlign: 'right' }}>Unit Price</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', textAlign: 'right' }}>Discount</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', textAlign: 'right' }}>Tax</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', textAlign: 'right' }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item, index) => (
                      <TableRow key={index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ fontWeight: 500, color: '#1e293b' }}>
                          {item.product?.name || 'N/A'}
                          {item.color && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.75rem' }}>
                              Color: {item.color}
                            </Typography>
                          )}
                          {item.serialNumbers && item.serialNumbers.length > 0 && item.serialNumbers.some(sn => sn) && (
                            <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {item.serialNumbers.filter(sn => sn).map((sn, i) => (
                                <Chip key={i} label={`SN: ${sn}`} size="small" variant="outlined" color="primary" sx={{ fontSize: '0.7rem', height: 20 }} />
                              ))}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip label={item.quantity} size="small" sx={{ fontWeight: 600, bgcolor: '#e2e8f0' }} />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right', fontWeight: 500 }}>৳{item.unitPrice?.toFixed(2)}</TableCell>
                        <TableCell sx={{ textAlign: 'right', color: 'error.main' }}>-৳{item.discount?.toFixed(2)}</TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>৳{item.tax?.toFixed(2)}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                          ৳{(item.quantity * item.unitPrice - item.discount + item.tax)?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ mt: 3, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight="700" color="#1e293b">
                    Financial Summary
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="text.secondary">Sub Total:</Typography><Typography fontWeight="600">৳{order.subTotal?.toFixed(2)}</Typography></Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="text.secondary">Discount:</Typography><Typography color="error.main" fontWeight="600">-৳{order.discount?.toFixed(2)}</Typography></Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="text.secondary">Tax:</Typography><Typography fontWeight="600">৳{order.tax?.toFixed(2)}</Typography></Box>
                    <Divider sx={{ my: 0.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="#1e293b" fontWeight="700">Total:</Typography><Typography fontWeight="800" color="primary.main" fontSize="1.1rem">৳{order.total?.toFixed(2)}</Typography></Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}><Typography color="text.secondary">Paid Amount:</Typography><Typography fontWeight="600" color="success.main">৳{order.paidAmount?.toFixed(2)}</Typography></Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: '#fef2f2', borderRadius: 2, mt: 1 }}><Typography color="error.main" fontWeight="700">Due Amount:</Typography><Typography fontWeight="800" color="error.main">৳{order.dueAmount?.toFixed(2)}</Typography></Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}><Typography color="text.secondary">Payment Method:</Typography><Chip label={order.paymentMethod} size="small" sx={{ fontWeight: 600 }} /></Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight="700" color="#1e293b">
                    Approval Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Status</Typography>
                      <Chip label={order.approvalStatus} color={approvalStatusColors[order.approvalStatus]} sx={{ fontWeight: 700 }} />
                    </Box>
                    {order.approvedBy && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Approved By</Typography>
                        <Typography fontWeight="600" color="#1e293b">{order.approvedBy.name}</Typography>
                      </Box>
                    )}
                    {order.approvedAt && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Approved At</Typography>
                        <Typography fontWeight="500" color="#475569">{new Date(order.approvedAt).toLocaleString()}</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight="700" color="#1e293b">
                    Delivery Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Status</Typography>
                      <Chip label={order.status} color={statusColors[order.status]} sx={{ fontWeight: 700 }} />
                    </Box>
                    {order.deliveredBy && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Delivered By</Typography>
                        <Typography fontWeight="600" color="#1e293b">{order.deliveredBy.name}</Typography>
                      </Box>
                    )}
                    {order.deliveredAt && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Delivered At</Typography>
                        <Typography fontWeight="500" color="#475569">{new Date(order.deliveredAt).toLocaleString()}</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Verification Dialog for Out for Delivery */}
      <Dialog open={outForDeliveryDialogOpen} onClose={() => setOutForDeliveryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShippingIcon color="primary" /> Verify Order for Delivery
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
            Please verify the customer and delivery details before marking this order as out for delivery.
          </Typography>

          {order.dueAmount > 0 && (
            <Alert severity="warning" sx={{ mb: 2, fontWeight: 600 }}>
              Cash Collection Required! Instruct the delivery person to collect ৳{order.dueAmount?.toFixed(2)} from the customer.
            </Alert>
          )}

          {order.fraudCheck?.riskLevel === 'HIGH' && (
            <Alert severity="error" sx={{ mb: 2, fontWeight: 600 }}>
              High Fraud Risk! Review customer history carefully before dispatching.
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, bgcolor: '#f8fafc', p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary" fontWeight="600">Customer Name:</Typography>
              <Typography fontWeight="700">{order.customer?.contactName}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary" fontWeight="600">Contact Number:</Typography>
              <Typography fontWeight="700">{order.customer?.contactNumber}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary" fontWeight="600">Shipping Address:</Typography>
              <Typography fontWeight="700" textAlign="right" maxWidth="60%">{order.shippingAddress || order.customer?.address}</Typography>
            </Box>
            
            {order.note && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary" fontWeight="600">Order Note:</Typography>
                <Typography fontWeight="700" textAlign="right" maxWidth="60%" color="warning.main">{order.note}</Typography>
              </Box>
            )}

            <Divider sx={{ my: 1 }} />
            
            <Box>
              <Typography color="text.secondary" fontWeight="600" mb={1}>Items to Deliver & Serial Numbers:</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pl: 1, borderLeft: '3px solid #e2e8f0' }}>
                {order.items?.map((item, idx) => (
                  <Box key={item._id || idx} sx={{ pl: 1 }}>
                    <Typography variant="body2" fontWeight="700" color="#334155" mb={1}>
                      {item.quantity} x {item.product?.name} {item.color && <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>(Color: {item.color})</span>}
                    </Typography>
                    <Grid container spacing={1}>
                      {Array.from({ length: item.quantity }).map((_, i) => {
                        const usedSerials = (serialNumbers[item._id] || []).filter((val, idx) => idx !== i && val);
                        const prodIdStr = item.product?._id?.toString();
                        const suggestions = (availableSerialsMap[prodIdStr] || []).filter(s => !usedSerials.includes(s));
                        
                        return (
                          <Grid item xs={12} sm={6} key={i}>
                            <Autocomplete
                              size="small"
                              fullWidth
                              freeSolo
                              openOnFocus
                              forcePopupIcon
                              options={suggestions}
                              value={serialNumbers[item._id]?.[i] || null}
                              onChange={(e, newValue) => handleSerialNumberChange(item._id, i, newValue || '')}
                              onInputChange={(e, newInputValue) => handleSerialNumberChange(item._id, i, newInputValue || '')}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder={`Serial Number ${i + 1}`}
                                  sx={{ 
                                    bgcolor: '#ffffff',
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '8px',
                                    }
                                  }}
                                />
                              )}
                            />
                            <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {suggestions.length > 0 ? (
                                <>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                                    Available Serials (Click to select):
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {suggestions.map((serial) => (
                                      <Chip
                                        key={serial}
                                        label={serial}
                                        size="small"
                                        onClick={() => handleSerialNumberChange(item._id, i, serial)}
                                        sx={{ 
                                          cursor: 'pointer',
                                          borderRadius: '6px',
                                          bgcolor: '#e2f0fd',
                                          color: '#0284c7',
                                          border: '1px solid #b3e0ff',
                                          '&:hover': { bgcolor: '#d0e8ff' },
                                          fontSize: '0.72rem',
                                          height: '20px',
                                          fontWeight: 600
                                        }}
                                      />
                                    ))}
                                  </Box>
                                </>
                              ) : (
                                <Typography variant="caption" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500, fontSize: '0.72rem' }}>
                                  ⚠️ No serials in stock (Type manually)
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                        );

                      })}
                    </Grid>
                  </Box>
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 1 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary" fontWeight="600">Total Order Amount:</Typography>
              <Typography fontWeight="700" color="primary.main">৳{order.total?.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: order.dueAmount > 0 ? '#fffbeb' : 'transparent', borderRadius: 1 }}>
              <Typography color="text.secondary" fontWeight="600">Due Amount (To Collect):</Typography>
              <Typography fontWeight="900" color={order.dueAmount > 0 ? 'warning.dark' : 'success.main'}>৳{order.dueAmount?.toFixed(2)}</Typography>
            </Box>
            
            {order.fraudCheck?.checkedAt && (
              <>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography color="text.secondary" fontWeight="600">Fraud Risk Level:</Typography>
                  <Chip 
                    size="small"
                    icon={getRiskIcon(order.fraudCheck.riskLevel)}
                    label={order.fraudCheck.riskLevel}
                    color={getRiskColor(order.fraudCheck.riskLevel)}
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Recommendation: {order.fraudCheck.recommendation}
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={() => setOutForDeliveryDialogOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleOutForDelivery} 
            variant="contained" 
            color="primary"
            sx={{ fontWeight: 700, bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
            startIcon={<LocalShippingIcon />}
          >
            Confirm & Mark Out
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SaleOrderDetail;