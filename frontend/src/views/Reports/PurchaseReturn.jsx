import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as EyeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import useShopRefresh from '../../hooks/useShopRefresh';


import PurchaseInvoiceDetailsModal from '../../components/PurchaseInvoiceDetailsModal';
import ExportButtons from '../../components/ExportButtons';

const PurchaseReturn = () => {
  const exportColumns = [
    { label: 'Return Date', accessor: (row) => row.date ? new Date(row.date).toLocaleDateString() : 'N/A' },
    { label: 'Invoice #', accessor: 'purchaseNumber' },
    { label: 'Product Name', accessor: (row) => row.product?.name || 'N/A' },
    { label: 'Supplier Name', accessor: (row) => row.supplier?.name || 'N/A' },
    { label: 'Contact Number', accessor: (row) => row.supplier?.contactNumber || 'N/A' },
    { label: 'Quantity', accessor: (row) => row.quantity || 0 },
    { label: 'Rate', accessor: (row) => `৳${row.rate?.toFixed(2) || '0.00'}` },
    { label: 'Total Value', accessor: (row) => `৳${row.total?.toFixed(2) || '0.00'}` },
    { label: 'Reason', accessor: (row) => row.reason || 'N/A' }
  ];

  const navigate = useNavigate();
  const { activeShop } = useAuth();
  
  // States
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filters, setFilters] = useState({
    supplierId: '',
    productId: '',
    startDate: '',
    endDate: '',
    returnReason: ''
  });
  
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const handleCloseToast = () => {
    setToastOpen(false);
  };

  // Fetch Suppliers / Suppliers
  const { data: suppliersResponse } = useQuery(
    ['contacts-suppliers', activeShop?._id],
    async () => {
      const response = await api.get('/api/suppliers');
      return response.data.data || [];
    },
    {
      enabled: true,
      staleTime: 60000
    }
  );
  const suppliers = suppliersResponse || [];

  // Fetch Products
  const { data: productsResponse } = useQuery(
    ['all-products', activeShop?._id],
    async () => {
      const response = await api.get('/api/products');
      return response.data.data || [];
    },
    {
      enabled: true,
      staleTime: 60000
    }
  );
  const products = productsResponse || [];

  // Fetch Purchase Return Report Data
  const { data: reportResponse, isLoading, refetch } = useQuery(
    ['purchaseReturnReport', filters, activeShop?._id],
    async () => {
      const params = { ...filters, shopId: activeShop?._id };
      const response = await api.get('/api/reports/purchase-returns', { params });
      return response.data;
    },
    {
      enabled: true,
      staleTime: 5000
    }
  );

  // Auto-refresh when shop changes
  useShopRefresh(refetch);

  const reportData = reportResponse?.data || [];
  const summary = reportResponse?.summary || {
    totalValue: 0,
    totalQuantity: 0,
    averageRate: 0,
    mostReturnedProduct: 'N/A',
    returnCount: 0
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleResetFilters = () => {
    setFilters({
      supplierId: '',
      productId: '',
      startDate: '',
      endDate: '',
      returnReason: ''
    });
    setSearchQuery('');
    showToast('Filters reset successfully!', 'info');
  };

  // Client-Side Searching
  const filteredData = useMemo(() => {
    if (!searchQuery) return reportData;
    const query = searchQuery.toLowerCase().trim();
    return reportData.filter(item => 
      (item.purchaseNumber && item.purchaseNumber.toLowerCase().includes(query)) ||
      (item.product?.name && item.product.name.toLowerCase().includes(query)) ||
      (item.supplier?.name && item.supplier.name.toLowerCase().includes(query))
    );
  }, [reportData, searchQuery]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };



  const handleViewInvoice = (purchaseId) => {
    setSelectedPurchaseId(purchaseId);
    setModalOpen(true);
  };

  return (
    <Box sx={{ py: { xs: 1, sm: 2 }, 
      backgroundColor: '#F8FAFC',
      minHeight: '100vh'
    }}>
      
      {/* Slick Back Button */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Box
          onClick={() => navigate(-1)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            px: 1.5,
            py: 0.75,
            borderRadius: '8px',
            border: '1px solid rgba(0,0,0,0.08)',
            bgcolor: 'white',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            transition: 'all 0.18s ease',
            '&:hover': {
              boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
              transform: 'translateX(-2px)',
              borderColor: 'rgba(0,0,0,0.18)',
            },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 16, color: '#64748b' }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.82rem', fontFamily: '"Outfit", sans-serif' }}>
            Back
          </Typography>
        </Box>
      </Box>
      <Grid container spacing={2}>
        {/* Header Action bar */}
        {/* Advanced Filters */}
        <Grid item xs={12}>
          <Card 
            elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              p: 2.5
            }}
          >
            <Typography variant="subtitle2" sx={{ color: '#1e293b', fontWeight: 600, mb: 2, fontFamily: '"Outfit", sans-serif' }}>
              Advanced Search Filters
            </Typography>

            <Grid container spacing={2} alignItems="center">
              {/* Supplier Filter */}
              <Grid item xs={12} sm={6} md={2.4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Supplier / Supplier</InputLabel>
                  <Select
                    name="supplierId"
                    value={filters.supplierId}
                    label="Supplier / Supplier"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">All Suppliers</MenuItem>
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Product Filter */}
              <Grid item xs={12} sm={6} md={2.4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Product</InputLabel>
                  <Select
                    name="productId"
                    value={filters.productId}
                    label="Product"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">All Products</MenuItem>
                    {products.map((product) => (
                      <MenuItem key={product._id} value={product._id}>
                        {product.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Reason Filter */}
              <Grid item xs={12} sm={6} md={2.4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Return Reason</InputLabel>
                  <Select
                    name="returnReason"
                    value={filters.returnReason}
                    label="Return Reason"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">All Reasons</MenuItem>
                    <MenuItem value="Defective / Cancelled">Defective / Cancelled</MenuItem>
                    <MenuItem value="Partial Return / Shortage">Partial Return / Shortage</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Start Date */}
              <Grid item xs={12} sm={6} md={1.6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* End Date */}
              <Grid item xs={12} sm={6} md={1.6}>
                <TextField
                  fullWidth
                  size="small"
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Reset Controls */}
              <Grid item xs={12} md={1.6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleResetFilters}
                  sx={{
                    borderRadius: '6px',
                    textTransform: 'none',
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    height: '40px'
                  }}
                >
                  Reset
                </Button>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Premium KPI Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {/* Total Value */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: '1px solid #fff7ed',
                  background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                  textAlign: 'center'
                }}
              >
                <Typography variant="caption" sx={{ color: '#c2410c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Total Returned Value
                </Typography>
                <Typography variant="h4" sx={{ color: '#fd7e14', fontWeight: 800, mt: 1, fontFamily: '"Outfit", sans-serif' }}>
                  ৳{summary.totalValue?.toLocaleString() || 0}
                </Typography>
              </Paper>
            </Grid>

            {/* Total Items */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: '1px solid #e0f2fe',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  textAlign: 'center'
                }}
              >
                <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Returned Quantity (Units)
                </Typography>
                <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 800, mt: 1, fontFamily: '"Outfit", sans-serif' }}>
                  {summary.totalQuantity || 0}
                </Typography>
              </Paper>
            </Grid>

            {/* Average Rate */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: '1px solid #f3e8ff',
                  background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                  textAlign: 'center'
                }}
              >
                <Typography variant="caption" sx={{ color: '#6b21a8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Average Item Price
                </Typography>
                <Typography variant="h4" sx={{ color: '#8b5cf6', fontWeight: 800, mt: 1, fontFamily: '"Outfit", sans-serif' }}>
                  ৳{Math.round(summary.averageRate || 0).toLocaleString()}
                </Typography>
              </Paper>
            </Grid>

            {/* Most Returned Item */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: '1px solid #fee2e2',
                  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                  textAlign: 'center'
                }}
              >
                <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Most Returned Product
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#ef4444', 
                    fontWeight: 700, 
                    mt: 1.5, 
                    fontFamily: '"Outfit", sans-serif',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    px: 1
                  }}
                  title={summary.mostReturnedProduct}
                >
                  {summary.mostReturnedProduct || 'N/A'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Data List and Main table */}
        <Grid item xs={12}>
          <Paper 
            elevation={0}
            sx={{
              p: 2.5,
              mb: 2,
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              fontFamily: '"Outfit", sans-serif',
            }}
          >
            {/* Search and Action Bar */}
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search invoice number, supplier name, product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'center', md: 'flex-end' } }}>
                <ExportButtons
                  data={filteredData || []}
                  columns={exportColumns}
                  filename="purchase_returns"
                  title="Purchase Returns Report"
                />
              </Grid>
            </Grid>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress color="warning" />
              </Box>
            ) : filteredData.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: '8px' }}>
                No purchase return report records found matching your filters.
              </Alert>
            ) : (
              <TableContainer>
                <Table id="purchase-return-report-table">
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: '#FFF7ED', 
                        '& .MuiTableCell-head': {
                          color: '#fd7e14 !important',
                          fontWeight: 700,
                          fontSize: '13px',
                          borderBottom: '2px solid #ffedd5',
                          whiteSpace: 'nowrap',
                          padding: '12px 14px',
                          fontFamily: '"Outfit", sans-serif',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }
                      }}
                    >
                      <TableCell>Return Date</TableCell>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Product Name</TableCell>
                      <TableCell>Supplier</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Rate</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell align="center" className="no-print">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData.map((row, index) => (
                      <TableRow 
                        key={row._id}
                        sx={{
                          backgroundColor: index % 2 === 0 ? 'transparent' : '#fcfdfe',
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: '#fffbeb', 
                          },
                          '& .MuiTableCell-root': {
                            whiteSpace: 'nowrap',
                            padding: '10px 14px',
                            fontSize: '14px',
                            color: '#334155',
                            fontFamily: '"Outfit", sans-serif'
                          }
                        }}
                      >
                        <TableCell>{formatDate(row.date)}</TableCell>
                        <TableCell>
                          <Button
                            variant="text"
                            onClick={() => handleViewInvoice(row.purchaseId)}
                            sx={{
                              color: '#fd7e14',
                              fontWeight: 700,
                              textTransform: 'none',
                              p: 0,
                              minWidth: 0,
                              fontFamily: '"Outfit", sans-serif',
                              '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' }
                            }}
                          >
                            {row.purchaseNumber}
                          </Button>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#1e293b !important' }}>
                          {row.product?.name}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569', fontSize: '13px' }}>
                            {row.supplier?.name}
                          </Typography>
                          {row.supplier?.contactNumber && (
                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontSize: '11px' }}>
                              {row.supplier.contactNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{row.quantity}</TableCell>
                        <TableCell align="right">৳{row.rate?.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ color: '#fd7e14 !important', fontWeight: 700 }}>
                          ৳{row.total?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={row.reason} 
                            size="small"
                            sx={{
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              bgcolor: row.reason?.includes('Defective') ? '#fee2e2' : '#ffedd5',
                              color: row.reason?.includes('Defective') ? '#ef4444' : '#fd7e14',
                              border: `1px solid ${row.reason?.includes('Defective') ? '#fecaca' : '#fed7aa'}`
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" className="no-print">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewInvoice(row.purchaseId)}
                            sx={{ color: '#fd7e14', '&:hover': { bgcolor: '#fff7ed' } }}
                            title="View Purchase Details"
                          >
                            <EyeIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Invoice Viewer Modal */}
      <PurchaseInvoiceDetailsModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        purchaseId={selectedPurchaseId} 
      />

      {/* Toast Notification */}
      <Snackbar 
        open={toastOpen} 
        autoHideDuration={4000} 
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert 
          onClose={handleCloseToast} 
          severity={toastSeverity} 
          variant="filled"
          sx={{ width: '100%', fontFamily: '"Outfit", sans-serif', borderRadius: '8px' }}
        >
          {toastMessage}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default PurchaseReturn;