import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  Divider,
  TablePagination,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Done as DoneIcon,
  LocalShipping as LocalShippingIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  Security as SecurityIcon,
  Send as SendIcon,
  KeyboardReturn as ReturnIcon,
  Cancel as CancelIcon,
  Inventory as InventoryIcon,
  SwapHoriz as SwapHorizIcon
} from '@mui/icons-material';
import { InputAdornment } from '@mui/material';
import api from '../../utils/api';
import { formatDate } from '../../utils/dateUtils';

const SalesOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const navigate = useNavigate();

  const statusColors = {
    Pending: 'warning',
    Approved: 'info',
    'Out for Delivery': 'secondary',
    Delivered: 'success',
    Returned: 'error',
    Cancelled: 'error'
  };

  const approvalStatusColors = {
    Pending: 'warning',
    Approved: 'success',
    Rejected: 'error'
  };

  // Reset page when search term or tab changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm, activeTab]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [page, rowsPerPage, searchTerm, activeTab]);

  // Fetch static lookups (customers and products) only once on mount
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [customersRes, productsRes] = await Promise.all([
          api.get('/api/contacts/customers'),
          api.get('/api/products')
        ]);
        setCustomers(customersRes.data.data);
        setProducts(productsRes.data.data);
      } catch (error) {
        console.error('Error fetching lookup data:', error);
      }
    };
    fetchLookups();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let queryParams = `?page=${page + 1}&limit=${rowsPerPage}`;
      if (searchTerm) {
        queryParams += `&search=${encodeURIComponent(searchTerm)}`;
      }
      switch (activeTab) {
        case 1:
          queryParams += '&approvalStatus=Pending';
          break;
        case 2:
          queryParams += '&approvalStatus=Approved&status=Approved';
          break;
        case 3:
          queryParams += '&status=Out for Delivery';
          break;
        case 4:
          queryParams += '&status=Delivered';
          break;
        case 5:
          queryParams += '&status=Returned';
          break;
        case 6:
          queryParams += '&status=Cancelled';
          break;
        default:
          break;
      }

      const ordersRes = await api.get(`/api/sales-orders${queryParams}`);

      setOrders(ordersRes.data.data);
      setTotalRecords(ordersRes.data.total || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (order) => {
    navigate(`/dashboard/sales-orders/${order._id}`);
  };

  const handleApprove = async (orderId) => {
    try {
      await api.put(`/api/sales-orders/${orderId}/approve`);
      fetchData();
    } catch (error) {
      console.error('Error approving order:', error);
    }
  };

  const handleDeliver = async (orderId) => {
    try {
      await api.put(`/api/sales-orders/${orderId}/deliver`);
      fetchData();
    } catch (error) {
      console.error('Error delivering order:', error);
    }
  };

  const handleOutForDelivery = async (orderId) => {
    try {
      await api.put(`/api/sales-orders/${orderId}/out-for-delivery`);
      fetchData();
    } catch (error) {
      console.error('Error marking out for delivery:', error);
    }
  };

  const handleReturn = async (orderId) => {
    try {
      await api.put(`/api/sales-orders/${orderId}/return`);
      fetchData();
    } catch (error) {
      console.error('Error returning order:', error);
    }
  };

  const handleCancel = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this online order?')) {
      try {
        await api.put(`/api/sales-orders/${orderId}/cancel`);
        fetchData();
      } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Error cancelling order: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handlePrintInvoice = (orderId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No authorization token found. Please log in again.');
      return;
    }
    const printUrl = `${api.defaults.baseURL}/api/sales-orders/${orderId}/invoice?format=print&token=${encodeURIComponent(token)}`;
    window.open(printUrl, '_blank');
  };

  const getProductStock = (productId) => {
    const product = products.find(p => p._id === productId);
    return product ? product.currentStock : 0;
  };

  const getStatusChip = (status, approvalStatus) => {
    if (['Delivered', 'Cancelled', 'Returned', 'Out for Delivery'].includes(status)) {
      return <Chip label={status} color={statusColors[status]} size="small" />;
    }

    if (approvalStatus === 'Pending') {
      return <Chip label={`Approval ${approvalStatus}`} color={approvalStatusColors[approvalStatus]} size="small" />;
    }

    if (approvalStatus === 'Approved') {
      return <Chip label={status} color={statusColors[status]} size="small" />;
    }

    return <Chip label={approvalStatus} color={approvalStatusColors[approvalStatus]} size="small" />;
  };

  const getRiskChip = (fraudCheck) => {
    if (!fraudCheck || !fraudCheck.riskLevel) return null;
    
    const riskColors = {
      HIGH: 'error',
      MEDIUM: 'warning',
      LOW: 'success',
      NEW: 'info'
    };
    
    return (
      <Tooltip title={`Success Ratio: ${fraudCheck.successRatio}%`}>
        <Chip 
          icon={<SecurityIcon style={{ fontSize: 14 }} />} 
          label={fraudCheck.riskLevel} 
          color={riskColors[fraudCheck.riskLevel] || 'default'} 
          size="small" 
          variant="outlined"
          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
        />
      </Tooltip>
    );
  };

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 }, backgroundColor: '#F8FAFC' }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              mb: 2,
              border: '1px solid #eaeef3',
              borderRadius: '12px',
              fontFamily: '"Outfit", sans-serif',
              boxShadow: '0 1px 3px rgba(0,0,0,0.01)'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1.5, sm: 0 }, alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2, justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 700, fontFamily: '"Outfit", sans-serif', fontSize: '1.25rem', mb: 0.5 }}>
                  Online Orders
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', fontSize: '0.85rem' }}>
                  View and manage all online orders.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon sx={{ fontSize: '1.1rem !important' }} />}
                  onClick={fetchData}
                  size="small"
                  fullWidth
                  sx={{
                    textTransform: 'none',
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    color: '#1e293b',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    py: 0.75,
                    '&:hover': {
                      backgroundColor: '#F8FAFC',
                      borderColor: '#cbd5e1'
                    }
                  }}
                >
                  Refresh
                </Button>
              </Box>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: '#eaeef3', mt: 1.5 }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 36,
                  '& .MuiTab-root': {
                    fontFamily: '"Outfit", sans-serif',
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    minWidth: 100,
                    minHeight: 36,
                    padding: '6px 16px',
                    color: '#64748b',
                    '&.Mui-selected': {
                      color: '#1D5F99',
                      fontWeight: 600,
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#1D5F99',
                    height: 2,
                    borderRadius: '2px 2px 0 0'
                  }
                }}
              >
                <Tab label={`All Orders`} />
                <Tab label={`Pending`} />
                <Tab label={`Approved`} />
                <Tab label={`Out for Delivery`} />
                <Tab label={`Delivered`} />
                <Tab label={`Returned`} />
                <Tab label={`Cancelled`} />
              </Tabs>
            </Box>

            <Grid container spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search by order number, customer, SR, phone, amount, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#64748b' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '8px', fontSize: '0.85rem' }
                  }}
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Mobile View: Render list of cards instead of table */}
        <Grid item xs={12} sx={{ display: { xs: 'block', md: 'none' } }}>
          {loading ? (
            <Box>
              {[1, 2, 3].map((item) => (
                <Paper
                  key={item}
                  sx={{
                    p: 2,
                    mb: 1.5,
                    borderRadius: '12px',
                    border: '1px solid #eaeef3',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Skeleton variant="text" width="50%" height={24} />
                    <Skeleton variant="rectangular" width="25%" height={24} sx={{ borderRadius: '4px' }} />
                  </Box>
                  <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                    <Grid item xs={6}>
                      <Skeleton variant="text" width="40%" height={14} />
                      <Skeleton variant="text" width="80%" height={20} />
                    </Grid>
                    <Grid item xs={6}>
                      <Skeleton variant="text" width="40%" height={14} />
                      <Skeleton variant="text" width="85%" height={20} />
                    </Grid>
                    <Grid item xs={6}>
                      <Skeleton variant="text" width="40%" height={14} />
                      <Skeleton variant="text" width="70%" height={20} />
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 1, borderColor: '#f1f5f9' }} />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 0.5 }}>
                    <Skeleton variant="rectangular" width={75} height={28} sx={{ borderRadius: '6px' }} />
                    <Skeleton variant="rectangular" width={75} height={28} sx={{ borderRadius: '6px' }} />
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : orders.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', border: '1px solid #eaeef3', borderRadius: '12px' }}>
              <Typography sx={{ fontFamily: '"Outfit", sans-serif', color: '#94a3b8', fontSize: '0.9rem' }}>
                No orders found for the selected filter
              </Typography>
            </Paper>
          ) : (
            <Box>
            {orders.map((order) => (
              <Paper
                key={order._id}
                sx={{
                  p: 2,
                  mb: 1.5,
                  borderRadius: '12px',
                  border: '1px solid #eaeef3',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
                  fontFamily: '"Outfit", sans-serif',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 700, color: '#1D5F99', fontSize: '0.95rem', display: 'flex', alignItems: 'center' }}>
                    {order.orderNumber}
                    {getRiskChip(order.fraudCheck)}
                  </Typography>
                  {getStatusChip(order.status, order.approvalStatus)}
                </Box>

                <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Customer</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>
                      {order.customer?.contactName || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Order Date</Typography>
                    <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.85rem' }}>
                      {formatDate(order.date, true)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Total Amount</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.85rem' }}>
                      ৳{order.total?.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1, borderColor: '#f1f5f9' }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 0.5 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<VisibilityIcon sx={{ fontSize: '14px !important' }} />}
                    onClick={() => handleView(order)}
                    sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', px: 1.5, py: 0.5, color: '#475569', borderColor: '#cbd5e1' }}
                  >
                    Details
                  </Button>

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PrintIcon sx={{ fontSize: '14px !important' }} />}
                    onClick={() => handlePrintInvoice(order._id)}
                    sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', px: 1.5, py: 0.5, color: '#2196F3', borderColor: '#90CAF9' }}
                  >
                    Print
                  </Button>

                  {/* Quick fulfillment actions for online orders */}
                  {order.type?.toLowerCase() === 'online' && order.items?.[0]?.product && !['Delivered', 'Out for Delivery', 'Returned', 'Cancelled'].includes(order.status) && (
                    <>
                      <Chip 
                        label={`Stock: ${getProductStock(order.items[0].product._id)}`}
                        size="small"
                        color={getProductStock(order.items[0].product._id) > 0 ? "success" : "error"}
                        variant="outlined"
                        sx={{ height: 26, fontSize: '0.75rem', mr: 'auto' }}
                      />
                      {getProductStock(order.items[0].product._id) === 0 && (
                        <>
                          <Tooltip title="Stock In — add inventory for first product in this order">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<InventoryIcon sx={{ fontSize: '14px !important' }} />}
                              onClick={() => navigate('/dashboard/inventory/stock-in', {
                                state: { preselectedProduct: order.items[0].product }
                              })}
                              sx={{
                                textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', px: 1.5, py: 0.5,
                                color: '#16a34a', borderColor: '#86efac'
                              }}
                            >
                              Stock In
                            </Button>
                          </Tooltip>
                          <Tooltip title="Transfer — create product transfer for first product in this order">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<SwapHorizIcon sx={{ fontSize: '14px !important' }} />}
                              onClick={() => navigate('/dashboard/sales/transfers/add', {
                                state: { preselectedProduct: order.items[0].product }
                              })}
                              sx={{
                                textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', px: 1.5, py: 0.5,
                                color: '#6366f1', borderColor: '#c4b5fd'
                              }}
                            >
                              Transfer
                            </Button>
                          </Tooltip>
                        </>
                      )}
                    </>
                  )}

                  {order.approvalStatus === 'Pending' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<DoneIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={() => handleApprove(order._id)}
                      sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', px: 1.5, py: 0.5, boxShadow: 'none' }}
                    >
                      Approve
                    </Button>
                  )}

                  {order.type?.toLowerCase() === 'online' && 
                    (order.approvalStatus === 'Pending' || (order.approvalStatus === 'Approved' && order.status === 'Approved')) && (
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      startIcon={<CancelIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={() => handleCancel(order._id)}
                      sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', px: 1.5, py: 0.5, boxShadow: 'none' }}
                    >
                      Cancel
                    </Button>
                  )}

                  {order.type?.toLowerCase() !== 'online' && order.approvalStatus === 'Approved' && order.status === 'Approved' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      startIcon={<LocalShippingIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={() => handleDeliver(order._id)}
                      sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', px: 1.5, py: 0.5, boxShadow: 'none' }}
                    >
                      Deliver
                    </Button>
                  )}

                  {order.type?.toLowerCase() === 'online' && order.approvalStatus === 'Approved' && order.status === 'Approved' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      startIcon={<SendIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={() => handleOutForDelivery(order._id)}
                      sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', px: 1.5, py: 0.5, boxShadow: 'none' }}
                    >
                      Out for Delivery
                    </Button>
                  )}

                  {order.type?.toLowerCase() === 'online' && order.status === 'Out for Delivery' && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<LocalShippingIcon sx={{ fontSize: '14px !important' }} />}
                        onClick={() => handleDeliver(order._id)}
                        sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', px: 1.5, py: 0.5, boxShadow: 'none' }}
                      >
                        Deliver
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<ReturnIcon sx={{ fontSize: '14px !important' }} />}
                        onClick={() => handleReturn(order._id)}
                        sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', px: 1.5, py: 0.5, boxShadow: 'none' }}
                      >
                        Return
                      </Button>
                    </>
                  )}
                </Box>
              </Paper>
            ))}
            <TablePagination
              component="div"
              count={totalRecords}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '0.85rem'
                }
              }}
            />
            </Box>
          )}
        </Grid>

        {/* Desktop View: Render table on tablet/desktop displays */}
        <Grid item xs={12} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.01)'
            }}
          >
            <TableContainer sx={{ overflowX: 'auto', minHeight: 400 }}>
              {loading ? (
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: '#F8FAFC',
                        '& .MuiTableCell-head': {
                          color: '#475569',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          fontFamily: '"Outfit", sans-serif',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderBottom: '1px solid #eaeef3',
                          padding: '12px 16px',
                        }
                      }}
                    >
                      <TableCell>Order #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[1, 2, 3, 4, 5].map((item) => (
                      <TableRow
                        key={item}
                        sx={{
                          '& .MuiTableCell-root': {
                            borderBottom: '1px solid #eaeef3',
                            padding: '12px 16px',
                          }
                        }}
                      >
                        <TableCell><Skeleton variant="text" width="90%" height={20} /></TableCell>
                        <TableCell><Skeleton variant="text" width="70%" height={20} /></TableCell>
                        <TableCell><Skeleton variant="text" width="80%" height={20} /></TableCell>
                        <TableCell><Skeleton variant="text" width="60%" height={20} /></TableCell>
                        <TableCell><Skeleton variant="text" width="50%" height={20} /></TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Skeleton variant="rectangular" width={65} height={28} sx={{ borderRadius: '6px' }} />
                            <Skeleton variant="rectangular" width={65} height={28} sx={{ borderRadius: '6px' }} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: '#F8FAFC',
                        '& .MuiTableCell-head': {
                          color: '#475569',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          fontFamily: '"Outfit", sans-serif',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderBottom: '1px solid #eaeef3',
                          padding: '12px 16px',
                        }
                      }}
                    >
                      <TableCell>Order #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6, borderBottom: 0 }}>
                          <Typography sx={{ fontFamily: '"Outfit", sans-serif', color: '#94a3b8', fontSize: '0.9rem' }}>
                            No orders found for the selected filter
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow
                          key={order._id}
                          sx={{
                            '&:hover': { backgroundColor: '#F8FAFC' },
                            '& .MuiTableCell-root': {
                              fontFamily: '"Outfit", sans-serif',
                              fontSize: '0.85rem',
                              color: '#334155',
                              borderBottom: '1px solid #eaeef3',
                              padding: '12px 16px',
                            }
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600, color: '#1D5F99' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {order.orderNumber}
                              {getRiskChip(order.fraudCheck)}
                            </Box>
                          </TableCell>
                          <TableCell>{order.customer?.contactName || 'N/A'}</TableCell>
                          <TableCell sx={{ color: '#64748b !important' }}>
                            {formatDate(order.date, true)}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>৳{order.total?.toFixed(2)}</TableCell>
                          <TableCell>
                            {getStatusChip(order.status, order.approvalStatus)}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Details">
                              <IconButton onClick={() => handleView(order)} size="small">
                                <VisibilityIcon sx={{ fontSize: 20 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Print Invoice">
                              <IconButton
                                onClick={() => handlePrintInvoice(order._id)}
                                size="small"
                                sx={{ color: '#2196F3' }}
                              >
                                <PrintIcon sx={{ fontSize: 20 }} />
                              </IconButton>
                            </Tooltip>

                            {/* Quick fulfillment: Stock In + Transfer for online orders */}
                            {order.type?.toLowerCase() === 'online' && order.items?.[0]?.product && !['Delivered', 'Out for Delivery', 'Returned', 'Cancelled'].includes(order.status) && (
                              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mr: 1, backgroundColor: '#f1f5f9', p: '2px 4px', borderRadius: '8px' }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: getProductStock(order.items[0].product._id) > 0 ? '#16a34a' : '#ef4444', px: 1 }}>
                                  Stock: {getProductStock(order.items[0].product._id)}
                                </Typography>
                                {getProductStock(order.items[0].product._id) === 0 && (
                                  <>
                                    <Tooltip title="Stock In — add inventory for first product in this order">
                                      <IconButton
                                        onClick={() => navigate('/dashboard/inventory/stock-in', {
                                          state: { preselectedProduct: order.items[0].product }
                                        })}
                                        size="small"
                                        sx={{ color: '#16a34a', p: 0.5 }}
                                      >
                                        <InventoryIcon sx={{ fontSize: 18 }} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Transfer — create product transfer for first product in this order">
                                      <IconButton
                                        onClick={() => navigate('/dashboard/sales/transfers/add', {
                                          state: { preselectedProduct: order.items[0].product }
                                        })}
                                        size="small"
                                        sx={{ color: '#6366f1', p: 0.5 }}
                                      >
                                        <SwapHorizIcon sx={{ fontSize: 18 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                )}
                              </Box>
                            )}

                            {order.approvalStatus === 'Pending' && (
                              <Tooltip title="Approve Order">
                                <IconButton
                                  onClick={() => handleApprove(order._id)}
                                  size="small"
                                  color="success"
                                >
                                  <DoneIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                              </Tooltip>
                            )}

                            {order.type?.toLowerCase() === 'online' && 
                              (order.approvalStatus === 'Pending' || (order.approvalStatus === 'Approved' && order.status === 'Approved')) && (
                              <Tooltip title="Cancel Order">
                                <IconButton
                                  onClick={() => handleCancel(order._id)}
                                  size="small"
                                  color="error"
                                >
                                  <CancelIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                              </Tooltip>
                            )}

                            {order.type?.toLowerCase() !== 'online' && order.approvalStatus === 'Approved' && order.status === 'Approved' && (
                              <Tooltip title="Mark as Delivered">
                                <IconButton
                                  onClick={() => handleDeliver(order._id)}
                                  size="small"
                                  color="primary"
                                >
                                  <LocalShippingIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                              </Tooltip>
                            )}

                            {order.type?.toLowerCase() === 'online' && order.approvalStatus === 'Approved' && order.status === 'Approved' && (
                              <Tooltip title="Mark Out for Delivery">
                                <IconButton
                                  onClick={() => handleOutForDelivery(order._id)}
                                  size="small"
                                  color="secondary"
                                >
                                  <SendIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                              </Tooltip>
                            )}

                            {order.type?.toLowerCase() === 'online' && order.status === 'Out for Delivery' && (
                              <>
                                <Tooltip title="Mark as Delivered">
                                  <IconButton
                                    onClick={() => handleDeliver(order._id)}
                                    size="small"
                                    color="primary"
                                  >
                                    <LocalShippingIcon sx={{ fontSize: 20 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Mark Returned">
                                  <IconButton
                                    onClick={() => handleReturn(order._id)}
                                    size="small"
                                    color="error"
                                  >
                                    <ReturnIcon sx={{ fontSize: 20 }} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      )))}
                  </TableBody>
                </Table>
              )}
            </TableContainer>
            <TablePagination
              component="div"
              count={totalRecords}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              sx={{
                borderTop: '1px solid #eaeef3',
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '0.85rem'
                }
              }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesOrders;