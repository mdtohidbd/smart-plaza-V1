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
  Alert as MuiAlert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
  Download as ExcelIcon,
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

const AllPurchase = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { activeShop } = useAuth();
  
  // States
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Set default dates to current month to avoid loading too much data on initial load
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [filters, setFilters] = useState({
    supplierId: '',
    status: '',
    startDate: formatDateForInput(firstDay),
    endDate: formatDateForInput(today)
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
      enabled: !!activeShop?._id,
      staleTime: 60000
    }
  );
  const suppliers = suppliersResponse || [];

  // Fetch Purchase Reports Data
  const { data: reportResponse, isLoading, refetch } = useQuery(
    ['allPurchaseReports', filters, activeShop?._id],
    async () => {
      const params = { ...filters };
      const response = await api.get('/api/reports/purchase-reports', { params });
      return response.data;
    },
    {
      staleTime: 5000
    }
  );

  // Auto-refresh when shop changes
  useShopRefresh(refetch);

  const purchaseData = reportResponse?.data || [];

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleResetFilters = () => {
    setFilters({
      supplierId: '',
      status: '',
      startDate: formatDateForInput(firstDay),
      endDate: formatDateForInput(today)
    });
    setSearchQuery('');
    showToast('Filters reset successfully!', 'info');
  };

  // Client-Side Searching & Row Matching
  const filteredData = useMemo(() => {
    if (!searchQuery) return purchaseData;
    const query = searchQuery.toLowerCase().trim();
    return purchaseData.filter(purchase => 
      (purchase.purchaseNumber && purchase.purchaseNumber.toLowerCase().includes(query)) ||
      (purchase.supplier?.name && purchase.supplier.name.toLowerCase().includes(query)) ||
      (purchase.items && purchase.items.some(item => item.product?.name?.toLowerCase().includes(query)))
    );
  }, [purchaseData, searchQuery]);

  // Compute dynamic KPI metrics on active list
  const activeMetrics = useMemo(() => {
    const uniqueIds = new Set();
    let totalPurchasesValue = 0;
    let totalAmountPaid = 0;
    let totalOutstandingDue = 0;

    filteredData.forEach(purchase => {
      if (!uniqueIds.has(purchase._id)) {
        uniqueIds.add(purchase._id);
        totalPurchasesValue += purchase.total || 0;
        totalAmountPaid += purchase.paidAmount || 0;
        totalOutstandingDue += purchase.dueAmount || 0;
      }
    });

    return {
      invoiceCount: uniqueIds.size,
      totalPurchasesValue,
      totalAmountPaid,
      totalOutstandingDue
    };
  }, [filteredData]);

  // Format currency
  const formatCurrency = (amount) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
    return `${formatted}৳`;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB'); // Format as DD/MM/YYYY
  };

  // Client-Side CSV Export
  const handleExportCSV = () => {
    if (!filteredData.length) {
      showToast('No data available to export.', 'error');
      return;
    }
    
    // Define headers
    const headers = ['Date', 'Invoice Number', 'Supplier Name', 'Contact Number', 'Product Name', 'Quantity', 'Rate', 'Total Value', 'Paid Amount', 'Due Amount', 'Status'];
    
    // Map rows
    const rows = [];
    filteredData.forEach(purchase => {
      purchase.items?.forEach(item => {
        rows.push([
          formatDate(purchase.date),
          purchase.purchaseNumber || 'N/A',
          purchase.supplier?.name || 'N/A',
          purchase.supplier?.contactNumber || 'N/A',
          item.product?.name || 'N/A',
          item.quantity || 0,
          item.unitPrice || 0,
          item.quantity * item.unitPrice,
          purchase.paidAmount || 0,
          purchase.dueAmount || 0,
          purchase.status || 'N/A'
        ]);
      });
    });

    // Build CSV string with UTF-8 BOM for Microsoft Excel compatibility
    const csvContent = '\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `All_Purchase_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV report exported successfully!', 'success');
  };

  // PDF Preview Print Function
  const handlePrintReport = () => {
    if (!filteredData.length) {
      showToast('No data to print.', 'error');
      return;
    }
    
    let tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Invoice Number</th>
            <th>Supplier</th>
            <th>Product</th>
            <th class="text-right">Quantity</th>
            <th class="text-right">Rate</th>
            <th class="text-right">Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    filteredData.forEach(purchase => {
      purchase.items?.forEach((item, idx) => {
        tableHtml += `
          <tr>
            <td>${idx === 0 ? formatDate(purchase.date) : ''}</td>
            <td>${idx === 0 ? (purchase.purchaseNumber || 'N/A') : ''}</td>
            <td>${idx === 0 ? (purchase.supplier?.name || 'N/A') : ''}</td>
            <td>${item.product?.name || 'N/A'}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">৳${item.unitPrice?.toLocaleString('en-IN')}</td>
            <td class="text-right">৳${(item.quantity * item.unitPrice)?.toLocaleString('en-IN')}</td>
            <td>${idx === 0 ? purchase.status : ''}</td>
          </tr>
        `;
      });
    });

    tableHtml += `
        <tr class="total-row">
          <td colspan="4">Total Summary</td>
          <td class="text-right">-</td>
          <td class="text-right">-</td>
          <td class="text-right">৳${activeMetrics.totalPurchasesValue?.toLocaleString('en-IN')}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>All Purchase Reports</title>
          <style>
            body { font-family: 'Outfit', 'Segoe UI', Arial, sans-serif; padding: 25px; color: #1e293b; }
            h2 { color: #1D5F99; margin-bottom: 5px; font-weight: 700; }
            .meta { color: #64748b; font-size: 13px; margin-top: 0; margin-bottom: 25px; border-bottom: 2px solid #1D5F99; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 12px; }
            th { background-color: #1D5F99; color: white; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; background-color: #f0f9ff; border-top: 2px solid #1D5F99; }
          </style>
        </head>
        <body>
          <h2>All Purchase Reports</h2>
          <div class="meta">
            Shop: <strong>${activeShop?.name || 'Smart Plaza'}</strong> | 
            Generated: <strong>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong> |
            Invoices: <strong>${activeMetrics.invoiceCount} invoices loaded</strong>
          </div>
          ${tableHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleViewInvoice = (purchaseId) => {
    setSelectedPurchaseId(purchaseId);
    setModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return { bg: '#E8F5E9', text: '#2E7D32', border: '#C8E6C9' };
      case 'Partial': return { bg: '#FFF3E0', text: '#ED6C02', border: '#FFE0B2' };
      case 'Pending': return { bg: '#FFFDE7', text: '#FBC02D', border: '#FFF9C4' };
      default: return { bg: '#FFEBEE', text: '#D32F2F', border: '#FFCDD2' };
    }
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
        {/* Header and title */}
        {/* Filters */}
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
              <Grid item xs={12} sm={6} md={3}>
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

              {/* Status Filter */}
              <Grid item xs={12} sm={6} md={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Purchase Status</InputLabel>
                  <Select
                    name="status"
                    value={filters.status}
                    label="Purchase Status"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Partial">Partial</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Start Date */}
              <Grid item xs={12} sm={6} md={2.5}>
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
              <Grid item xs={12} sm={6} md={2.5}>
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
              <Grid item xs={12} md={1.5}>
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

        {/* Dynamic Outfit KPIs */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {/* Purchase Volume */}
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
                  Total Purchases Volume
                </Typography>
                <Typography variant="h4" sx={{ color: '#1D5F99', fontWeight: 800, mt: 1, fontFamily: '"Outfit", sans-serif' }}>
                  {formatCurrency(activeMetrics.totalPurchasesValue)}
                </Typography>
              </Paper>
            </Grid>

            {/* Paid amount */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: '1px solid #d1fae5',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  textAlign: 'center'
                }}
              >
                <Typography variant="caption" sx={{ color: '#065f46', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Total Paid Amount
                </Typography>
                <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 800, mt: 1, fontFamily: '"Outfit", sans-serif' }}>
                  {formatCurrency(activeMetrics.totalAmountPaid)}
                </Typography>
              </Paper>
            </Grid>

            {/* Outstanding balances */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: '1px solid #ffe4e6',
                  background: 'linear-gradient(135deg, #fef2f2 0%, #ffe4e6 100%)',
                  textAlign: 'center'
                }}
              >
                <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Total Balances Due
                </Typography>
                <Typography variant="h4" sx={{ color: '#ef4444', fontWeight: 800, mt: 1, fontFamily: '"Outfit", sans-serif' }}>
                  {formatCurrency(activeMetrics.totalOutstandingDue)}
                </Typography>
              </Paper>
            </Grid>

            {/* Invoices Count */}
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
                  Total Bills / Invoices
                </Typography>
                <Typography variant="h4" sx={{ color: '#8b5cf6', fontWeight: 800, mt: 1, fontFamily: '"Outfit", sans-serif' }}>
                  {activeMetrics.invoiceCount}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Data Table section */}
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
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<PdfIcon />}
                  onClick={handlePrintReport}
                  disabled={isLoading || !filteredData.length}
                  sx={{ borderRadius: '6px', textTransform: 'none' }}
                >
                  Preview PDF
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ExcelIcon />}
                  onClick={handleExportCSV}
                  disabled={isLoading || !filteredData.length}
                  sx={{ 
                    borderRadius: '6px', 
                    textTransform: 'none', 
                    bgcolor: '#1D5F99', 
                    '&:hover': { bgcolor: '#164d7c' } 
                  }}
                >
                  Export CSV
                </Button>
              </Grid>
            </Grid>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress color="info" />
              </Box>
            ) : isMobile ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {filteredData.map((purchase, index) => (
                  purchase.items?.map((item, itemIndex) => {
                    const statusColors = getStatusColor(purchase.status);
                    return (
                      <Card
                        key={`${purchase._id}-${itemIndex}`}
                        elevation={0}
                        sx={{
                          p: 2,
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            borderColor: '#1D5F99',
                            boxShadow: '0 4px 12px rgba(29, 95, 153, 0.08)'
                          }
                        }}
                      >
                        {/* Header: Invoice and Date */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box>
                            <Button
                              variant="text"
                              onClick={() => handleViewInvoice(purchase._id)}
                              sx={{
                                color: '#1D5F99',
                                fontWeight: 700,
                                textTransform: 'none',
                                p: 0,
                                minWidth: 0,
                                fontSize: '0.9rem',
                                fontFamily: '"Outfit", sans-serif',
                                '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' }
                              }}
                            >
                              {purchase.purchaseNumber}
                            </Button>
                            <Typography sx={{ color: '#64748B', fontSize: '0.725rem', mt: 0.25 }}>
                              {formatDate(purchase.date)}
                            </Typography>
                          </Box>
                          <Chip 
                            label={purchase.status || 'N/A'} 
                            size="small"
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              borderRadius: '6px',
                              bgcolor: statusColors.bg,
                              color: statusColors.text,
                              border: `1px solid ${statusColors.border}`,
                              height: 20
                            }}
                          />
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

                        {/* Supplier Info */}
                        <Box sx={{ mb: 1.5 }}>
                          <Typography sx={{ color: '#64748B', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Supplier</Typography>
                          <Typography sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.85rem', mt: 0.25 }}>
                            {purchase.supplier?.name || 'N/A'}
                          </Typography>
                          {purchase.supplier?.contactNumber && (
                            <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', mt: 0.25 }}>
                              <a href={`tel:${purchase.supplier.contactNumber}`} style={{ textDecoration: 'none', color: '#1D5F99', fontWeight: 500 }}>
                                {purchase.supplier.contactNumber}
                              </a>
                            </Typography>
                          )}
                        </Box>

                        {/* Product & Qty */}
                        <Box sx={{ p: 1.25, bgcolor: '#F8FAFC', borderRadius: '8px', mb: 1.5 }}>
                          <Typography sx={{ color: '#64748B', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Product</Typography>
                          <Typography sx={{ color: '#1E293B', fontWeight: 700, fontSize: '0.875rem', mt: 0.25 }}>
                            {item.product?.name || 'N/A'}
                          </Typography>
                          <Grid container spacing={1} sx={{ mt: 1 }}>
                            <Grid item xs={4}>
                              <Typography sx={{ color: '#64748B', fontSize: '0.7rem' }}>Quantity</Typography>
                              <Typography sx={{ color: '#334155', fontWeight: 600, fontSize: '0.8rem', mt: 0.25 }}>{item.quantity || 0}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography sx={{ color: '#64748B', fontSize: '0.7rem' }}>Rate</Typography>
                              <Typography sx={{ color: '#334155', fontWeight: 600, fontSize: '0.8rem', mt: 0.25 }}>{formatCurrency(item.unitPrice || 0)}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography sx={{ color: '#1D5F99', fontSize: '0.7rem', fontWeight: 600 }}>Total</Typography>
                              <Typography sx={{ color: '#1D5F99', fontWeight: 700, fontSize: '0.825rem', mt: 0.25 }}>
                                {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>

                        {/* Actions */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EyeIcon fontSize="small" />}
                            onClick={() => handleViewInvoice(purchase._id)}
                            sx={{
                              color: '#1D5F99',
                              borderColor: 'rgba(29, 95, 153, 0.3)',
                              textTransform: 'none',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              borderRadius: '6px',
                              px: 1.5,
                              py: 0.5,
                              '&:hover': {
                                borderColor: '#1D5F99',
                                bgcolor: 'rgba(29, 95, 153, 0.04)'
                              }
                            }}
                          >
                            Details
                          </Button>
                        </Box>
                      </Card>
                    );
                  })
                ))}
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: '#F0F9FF', 
                        '& .MuiTableCell-head': {
                          color: '#1D5F99 !important',
                          fontWeight: 700,
                          fontSize: '13px',
                          borderBottom: '2px solid #e0f2fe',
                          whiteSpace: 'nowrap',
                          padding: '12px 14px',
                          fontFamily: '"Outfit", sans-serif',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }
                      }}
                    >
                      <TableCell>Date</TableCell>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Supplier</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Rate</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center" className="no-print">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData.map((purchase, index) => (
                      purchase.items?.map((item, itemIndex) => {
                        const statusColors = getStatusColor(purchase.status);
                        return (
                          <TableRow 
                            key={`${purchase._id}-${itemIndex}`}
                            sx={{
                              backgroundColor: index % 2 === 0 ? 'transparent' : '#fcfdfe',
                              borderBottom: '1px solid #f1f5f9',
                              transition: 'all 0.2s',
                              '&:hover': {
                                backgroundColor: '#f0f9ff', 
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
                            <TableCell>{itemIndex === 0 ? formatDate(purchase.date) : ''}</TableCell>
                            <TableCell>
                              {itemIndex === 0 && (
                                <Button
                                  variant="text"
                                  onClick={() => handleViewInvoice(purchase._id)}
                                  sx={{
                                    color: '#1D5F99',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    p: 0,
                                    minWidth: 0,
                                    fontFamily: '"Outfit", sans-serif',
                                    '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' }
                                  }}
                                >
                                  {purchase.purchaseNumber}
                                </Button>
                              )}
                            </TableCell>
                            <TableCell>
                              {itemIndex === 0 && (
                                <>
                                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569', fontSize: '13px' }}>
                                    {purchase.supplier?.name || 'N/A'}
                                  </Typography>
                                  {purchase.supplier?.contactNumber && (
                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontSize: '11px' }}>
                                      {purchase.supplier.contactNumber}
                                    </Typography>
                                  )}
                                </>
                              )}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1e293b !important' }}>
                              {item.product?.name || 'N/A'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>{item.quantity || 0}</TableCell>
                            <TableCell align="right">{formatCurrency(item.unitPrice || 0)}</TableCell>
                            <TableCell align="right" sx={{ color: '#1D5F99 !important', fontWeight: 700 }}>
                              {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                            </TableCell>
                            <TableCell>
                              {itemIndex === 0 && (
                                <Chip 
                                  label={purchase.status || 'N/A'} 
                                  size="small"
                                  sx={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    bgcolor: statusColors.bg,
                                    color: statusColors.text,
                                    border: `1px solid ${statusColors.border}`
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell align="center" className="no-print">
                              {itemIndex === 0 && (
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleViewInvoice(purchase._id)}
                                  sx={{ color: '#1D5F99', '&:hover': { bgcolor: '#f0f9ff' } }}
                                  title="View Purchase Details"
                                >
                                  <EyeIcon fontSize="small" />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
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

export default AllPurchase;