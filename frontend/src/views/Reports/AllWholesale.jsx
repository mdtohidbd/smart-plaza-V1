import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  TextField,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert as MuiAlert,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  PictureAsPdf as PdfIcon, 
  Download as ExcelIcon, 
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import useShopRefresh from '../../hooks/useShopRefresh';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import ExportButtons from '../../components/ExportButtons';

import SaleInvoiceModal from '../../components/invoices/PrintInvoiceModal';

const AllWholesale = () => {
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');
  const [searchTerm, setSearchTerm] = useState('');

  // Sale invoice modal states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState(null);
  const [completedSaleSourceType, setCompletedSaleSourceType] = useState('sale');

  // Fetch wholesale sales data
  const { data: wholesaleSales, isLoading, error, refetch } = useQuery(
    'wholesale-sales',
    async () => {
      const [salesRes, ordersRes] = await Promise.all([
        api.get('/api/sales', { params: { type: 'wholesale' } }),
        api.get('/api/sales-orders', { params: { type: 'wholesale' } })
      ]);
      
      const salesData = salesRes.data.data.map(sale => ({
        ...sale,
        sourceType: 'sale'
      }));
      
      const ordersData = ordersRes.data.data
        .filter(order => order.status !== 'Converted')
        .map(order => ({
          ...order,
          sourceType: 'order',
          invoiceNumber: order.invoiceNumber || order.orderNumber,
          status: order.status === 'Delivered' ? 'Completed' : `Order ${order.approvalStatus}`
        }));
      
      return [...salesData, ...ordersData].sort((a, b) => 
        new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
      );
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  // Automatically refresh data when shop changes
  useShopRefresh(refetch);

  // Helper functions to get customer & SR info safely from various data shapes
  const getCustomerName = (sale) => {
    if (!sale) return 'N/A';
    if (typeof sale.customer === 'string' && sale.customer.trim() && !sale.customer.match(/^[0-9a-fA-F]{24}$/)) {
      return sale.customer;
    }
    return (
      sale.customer?.contactName ||
      sale.customer?.name ||
      sale.customer?.businessName ||
      sale.customerName ||
      sale.customerDetails?.contactName ||
      sale.customerDetails?.name ||
      sale.shippingAddress?.name ||
      sale.billingAddress?.name ||
      'N/A'
    );
  };

  const getCustomerPhone = (sale) => {
    if (!sale) return '';
    return (
      sale.customer?.contactNumber ||
      sale.customer?.phone ||
      sale.customer?.mobile ||
      sale.customerPhone ||
      sale.customerDetails?.contactNumber ||
      sale.customerDetails?.phone ||
      sale.shippingAddress?.phone ||
      ''
    );
  };

  const getSRName = (sale) => {
    if (!sale) return 'N/A';
    return (
      sale.assignedSR?.name ||
      sale.assignedSR?.contactName ||
      sale.srName ||
      sale.salesPerson ||
      sale.createdBy?.name ||
      'N/A'
    );
  };

  const getCustomerAddress = (sale) => {
    if (!sale) return 'N/A';
    return (
      sale.customer?.address ||
      sale.customerAddress ||
      sale.shippingAddress?.address ||
      (typeof sale.shippingAddress === 'string' ? sale.shippingAddress : '') ||
      sale.billingAddress?.address ||
      'N/A'
    );
  };

  const getProductNames = (sale) => {
    if (!sale) return 'N/A';
    if (!sale.items || !Array.isArray(sale.items) || sale.items.length === 0) {
      return sale.productName || 'N/A';
    }
    return sale.items
      .map(item => {
        const name = item.productName || item.product?.name || item.name || 'Product';
        const qty = item.quantity ? ` (x${item.quantity})` : '';
        return `${name}${qty}`;
      })
      .join(', ');
  };

  const getProductCategory = (sale) => {
    if (!sale) return 'N/A';
    if (!sale.items || !Array.isArray(sale.items) || sale.items.length === 0) {
      return sale.category || sale.productCategory || 'N/A';
    }
    const categories = sale.items
      .map((item) => {
        if (item.product?.category?.name) return item.product.category.name;
        if (typeof item.product?.category === 'string' && item.product.category) return item.product.category;
        if (item.category?.name) return item.category.name;
        if (typeof item.category === 'string' && item.category) return item.category;
        if (item.productCategory) return item.productCategory;
        if (item.categoryName) return item.categoryName;
        return null;
      })
      .filter(Boolean);

    const uniqueCategories = [...new Set(categories)];
    return uniqueCategories.length > 0 ? uniqueCategories.join(', ') : (sale.category || 'N/A');
  };

  const exportColumns = [
    { label: 'Invoice No', accessor: (row) => row.invoiceNumber || 'N/A' },
    { label: 'Customer Name', accessor: (row) => getCustomerName(row) },
    { label: 'Customer Phone', accessor: (row) => getCustomerPhone(row) || 'N/A' },
    { label: 'Customer Address', accessor: (row) => getCustomerAddress(row) },
    { label: 'Products', accessor: (row) => getProductNames(row) },
    { label: 'Product Category', accessor: (row) => getProductCategory(row) },
    { label: 'Total Items Sold', accessor: (row) => row.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0 },
    { label: 'Sold By (SR)', accessor: (row) => getSRName(row) },
    { label: 'Date', accessor: (row) => new Date(row.date || row.createdAt).toLocaleDateString() },
    { label: 'Total Amount', accessor: (row) => row.total || 0 },
    { label: 'Paid Amount', accessor: (row) => row.paidAmount || 0 },
    { label: 'Due Amount', accessor: (row) => row.dueAmount || 0 },
    { label: 'Status', accessor: (row) => row.status || 'Pending' }
  ];

  // Filter data based on search term
  const filteredSales = wholesaleSales?.filter(sale => {
    const term = searchTerm.toLowerCase();
    const inv = (sale.invoiceNumber || sale.orderNumber || '').toLowerCase();
    const custName = getCustomerName(sale).toLowerCase();
    const custPhone = getCustomerPhone(sale);
    const srName = getSRName(sale).toLowerCase();
    const prodNames = getProductNames(sale).toLowerCase();
    const prodCat = getProductCategory(sale).toLowerCase();
    return inv.includes(term) || custName.includes(term) || custPhone.includes(term) || srName.includes(term) || prodNames.includes(term) || prodCat.includes(term);
  }) || [];

  // Calculate summary statistics
  const totalSales = filteredSales?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
  const totalQuantity = filteredSales?.reduce((sum, sale) => sum + (sale.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0), 0) || 0;
  const avgOrderValue = filteredSales?.length > 0 ? totalSales / filteredSales.length : 0;

  const handlePreviewClick = (tabIndex) => {
    setActiveTab(tabIndex);
    setPreviewOpen(true);
  };

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const firstSale = wholesaleSales?.[0];
      if (!firstSale) {
        showToast('No wholesale transactions available to export PDF.', 'error');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        showToast('No authorization token found. Please log in again.', 'error');
        return;
      }

      const endpoint = firstSale.sourceType === 'order'
        ? `/api/sales-orders/${firstSale._id}/invoice`
        : `/api/sales/${firstSale._id}/invoice`;

      const response = await api.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wholesale-invoice-preview-${firstSale.invoiceNumber}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      showToast('PDF invoice downloaded successfully!', 'success');
    } catch (error) {
      console.error('PDF download error:', error);
      showToast('Failed to download PDF invoice. Please try again.', 'error');
    } finally {
      setLoading(false);
      setPreviewOpen(false);
    }
  };

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      if (!filteredSales || filteredSales.length === 0) {
        showToast('No wholesale transactions available to export.', 'error');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Wholesale Sales Report');

      worksheet.columns = exportColumns.map(col => ({
        header: col.label,
        key: col.label,
        width: Math.max(col.label.length, 18)
      }));

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1D5F99' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      filteredSales.forEach(row => {
        const rowData = {};
        exportColumns.forEach(col => {
          const val = col.accessor(row);
          rowData[col.label] = val === null || val === undefined ? '' : val;
        });
        worksheet.addRow(rowData);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `wholesale-sales-report-${new Date().toISOString().split('T')[0]}.xlsx`);

      showToast('Excel report downloaded successfully!', 'success');
    } catch (error) {
      console.error('Excel download error:', error);
      showToast('Failed to download Excel report. Please try again.', 'error');
    } finally {
      setLoading(false);
      setPreviewOpen(false);
    }
  };

  const handleCloseToast = () => {
    setToastOpen(false);
  };
  return (
    <>
      
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
      <Grid container spacing={1.5} >
        {/* Wholesale Sales Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', fontWeight: 500, fontSize: '0.85rem', mb: 0.5 }}>
                    Total Sales
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1D5F99', fontFamily: '"Outfit", sans-serif' }}>
                    {isLoading ? <CircularProgress size={20} /> : `৳${totalSales.toFixed(2)}`}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', fontWeight: 500, fontSize: '0.85rem', mb: 0.5 }}>
                    Total Items Sold
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#42A2C2', fontFamily: '"Outfit", sans-serif' }}>
                    {isLoading ? <CircularProgress size={20} /> : totalQuantity}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', fontWeight: 500, fontSize: '0.85rem', mb: 0.5 }}>
                    Avg. Order Value
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#E57141', fontFamily: '"Outfit", sans-serif' }}>
                    {isLoading ? <CircularProgress size={20} /> : `৳${avgOrderValue.toFixed(2)}`}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card
            sx={{
              p: 1.5,
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              borderRadius: 1,
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1D5F99', mb: 1 }}>
                    Wholesale Sales Overview
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    This report shows all wholesale sales transactions with detailed analytics.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Search invoices, customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PdfIcon />}
                    onClick={() => handlePreviewClick(0)}
                  >
                    PDF
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<ExcelIcon />}
                    onClick={() => handlePreviewClick(1)}
                  >
                    Excel
                  </Button>
                  <ExportButtons
                    data={filteredSales}
                    columns={exportColumns}
                    filename="wholesale_sales_report"
                    title="Wholesale Sales Report"
                  />
                </Box>
              </Box>

              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error">Error loading data: {error.message}</Alert>
              ) : (
                <TableContainer>
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
                          padding: '10px 16px',
                        }
                      }}
                    >
                        <TableCell>Invoice</TableCell>
                        <TableCell>Customer Details</TableCell>
                        <TableCell>Products & Category</TableCell>
                        <TableCell>SR</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Paid</TableCell>
                        <TableCell align="right">Due</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredSales.map((sale) => (
                        <TableRow
                          key={sale._id}
                          sx={{
                            '&:nth-of-type(odd)': { backgroundColor: '#f9fbfd' },
                            '&:hover': { backgroundColor: '#f0f7ff' },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600 }}>{sale.invoiceNumber || 'N/A'}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                {getCustomerName(sale)}
                              </Typography>
                              {getCustomerPhone(sale) && (
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                  📞 {getCustomerPhone(sale)}
                                </Typography>
                              )}
                              {getCustomerAddress(sale) !== 'N/A' && (
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                  📍 {getCustomerAddress(sale)}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: '#0f172a' }}>
                                {getProductNames(sale)}
                              </Typography>
                              {getProductCategory(sale) !== 'N/A' && (
                                <Typography variant="caption" sx={{ color: '#1D5F99', fontWeight: 600, display: 'block', mt: 0.2 }}>
                                  🏷️ {getProductCategory(sale)}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>{getSRName(sale)}</TableCell>
                          <TableCell>{new Date(sale.date || sale.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell align="right">৳{sale.total?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell align="right">৳{sale.paidAmount?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell align="right">৳{sale.dueAmount?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>
                            <Box
                              component="span"
                              sx={{
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                backgroundColor: sale.status === 'Completed' ? '#e8f5e8' :
                                  sale.status === 'Partial' ? '#fff3e0' :
                                    '#ffebee',
                                color: sale.status === 'Completed' ? '#4caf50' :
                                  sale.status === 'Partial' ? '#ff9800' :
                                    '#f44336',
                              }}
                            >
                              {sale.status || 'Pending'}
                            </Box>
                          </TableCell>

                          {/* Action Column */}
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="View Invoice">
                                <IconButton onClick={() => {
                                  setCompletedSaleId(sale._id);
                                  setCompletedSaleSourceType(sale.sourceType || 'sale');
                                  setShowInvoiceModal(true);
                                }}>
                                  <VisibilityIcon color="primary" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Print Invoice">
                                <IconButton onClick={async () => {
                                  try {
                                    const token = localStorage.getItem('token');
                                    if (!token) {
                                      showToast('No authorization token found. Please log in again.', 'error');
                                      return;
                                    }

                                    // Use appropriate endpoint based on source type
                                    const endpoint = sale.sourceType === 'order'
                                      ? `/api/sales-orders/${sale._id}/invoice`
                                      : `/api/sales/${sale._id}/invoice`;

                                    // Open print view with proper authorization
                                    const printUrl = `${api.defaults.baseURL}${endpoint}?format=print&token=${encodeURIComponent(token)}`;
                                    window.open(printUrl, '_blank');
                                  } catch (error) {
                                    console.error('Error opening print view:', error);
                                    showToast('Error opening print view: ' + error.message, 'error');
                                  }
                                }}>
                                  <PrintIcon sx={{ color: '#42A2C2' }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredSales.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                            <Typography color="textSecondary">
                              No wholesale sales found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Preview Dialog */}
        <Dialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              minHeight: '60vh',
              maxHeight: '80vh',
            }
          }}
        >
          <DialogTitle sx={{ bgcolor: '#F8FAFC', color: '#1e293b', fontWeight: 600, fontSize: '1.2rem', p: 2, borderBottom: '1px solid #eaeef3' }}>
            Report Preview
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ mt: 1 }}
            >
              <Tab label="PDF Preview" />
              <Tab label="Excel Preview" />
            </Tabs>
          </DialogTitle>
          <DialogContent dividers>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                {activeTab === 0 ? (
                  <Box sx={{ p: 1.5, border: '1px solid #ccc', borderRadius: 1, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="h6" gutterBottom>PDF Preview Content</Typography>
                    <Paper elevation={2} sx={{ p: 1.5, mb: 2 }}>
                      <Typography variant="h5" align="center" gutterBottom>Demo Electronics ERP</Typography>
                      <Typography variant="subtitle1" align="center" gutterBottom>All Wholesale Report</Typography>
                      <Typography variant="body2" align="center" sx={{ mb: 2 }}>Generated on: {new Date().toLocaleDateString()}</Typography>

                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Invoice</TableCell>
                              <TableCell>Customer</TableCell>
                              <TableCell align="right">Total</TableCell>
                              <TableCell align="right">Paid</TableCell>
                              <TableCell align="right">Due</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {[1, 2, 3, 4, 5].map((row, index) => (
                              <TableRow key={row}>
                                <TableCell>INV-001</TableCell>
                                <TableCell>ABC Customer Ltd.</TableCell>
                                <TableCell align="right">৳2,50,000</TableCell>
                                <TableCell align="right">৳2,00,000</TableCell>
                                <TableCell align="right">৳50,000</TableCell>
                                <TableCell>Partial</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                    <Typography variant="caption" color="textSecondary">
                      This is a preview of how the PDF report will look. Actual report may vary slightly.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ p: 1.5, border: '1px solid #ccc', borderRadius: 1, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="h6" gutterBottom>Excel Preview Content</Typography>
                    <Paper elevation={2} sx={{ p: 2 }}>
                      <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, color: '#1D5F99' }}>Sheet: Wholesale Sales Report</Typography>
                      <TableContainer sx={{ maxHeight: '400px' }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              {exportColumns.map((col, idx) => (
                                <TableCell key={idx} sx={{ fontWeight: 'bold', fontSize: '0.75rem', bgcolor: '#1D5F99', color: '#fff' }}>
                                  {col.label}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(filteredSales.length > 0 ? filteredSales.slice(0, 10) : []).map((row, index) => (
                              <TableRow key={row._id || index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f8fafc' } }}>
                                {exportColumns.map((col, idx) => (
                                  <TableCell key={idx} sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                    {col.accessor(row)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                            {filteredSales.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={exportColumns.length} align="center">
                                  No transactions found for preview
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      Showing preview of top 10 records with all product and customer columns. Full report will include all {filteredSales.length} records.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #eaeef3', bgcolor: '#F8FAFC' }}>
            <Button onClick={() => setPreviewOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color={activeTab === 0 ? "primary" : "secondary"}
              startIcon={activeTab === 0 ? <PdfIcon /> : <ExcelIcon />}
              onClick={() => {
                if (activeTab === 0) {
                  handleExportPDF();
                } else {
                  handleExportExcel();
                }
              }}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Download ${activeTab === 0 ? 'PDF' : 'Excel'}`}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Toast Notification */}
        <Snackbar
          open={toastOpen}
          autoHideDuration={6000}
          onClose={handleCloseToast}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <MuiAlert
            onClose={handleCloseToast}
            severity={toastSeverity}
            elevation={6}
            variant="filled"
          >
            {toastMessage}
          </MuiAlert>
        </Snackbar>
      </Grid>
      {/* </Box> */}
      <SaleInvoiceModal 
        open={showInvoiceModal} 
        onClose={() => setShowInvoiceModal(false)} 
        saleId={completedSaleId} 
        sourceType={completedSaleSourceType}
      />
    </>
  );
};

export default AllWholesale;