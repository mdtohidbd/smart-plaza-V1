import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardHeader,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress,
  IconButton
} from '@mui/material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Add as AddIcon, PictureAsPdf as PdfIcon, Download as ExcelIcon, Visibility as EyeIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import api from '../../utils/api';
import useShopRefresh from '../../hooks/useShopRefresh';
import { useAuth } from '../../context/AuthContext';
import SaleInvoiceModal from '../../components/invoices/PrintInvoiceModal';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import ExportButtons from '../../components/ExportButtons';

const RetailReports = () => {
  const { user } = useAuth();
  const isSalesStaff = user?.role === 'Sales Staff';
  const navigate = useNavigate();
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Helper function to calculate profit correctly
  const calculateProfit = (sale) => {
    const netRevenue = (sale.total || 0) - (sale.tax || 0);
    const costOfGoodsSold = sale.items?.reduce((sum, item) => {
      let cost = 0;
      if (item.product?.computedPurchasePrice && item.product.computedPurchasePrice > 0) {
        cost = item.product.computedPurchasePrice;
      } else if (item.product?.purchasePrice && item.product.purchasePrice > 0) {
        cost = item.product.purchasePrice;
      } else if (item.product?.mrp && item.product.mrp > 0) {
        cost = item.product.mrp * 0.7;
      } else {
        cost = (item.unitPrice || 0) * 0.7;
      }
      return sum + (cost * (item.quantity || 1));
    }, 0) || 0;
    return netRevenue - costOfGoodsSold;
  };
  
  // Helper function to get default start date (30 days ago)
  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }

  // Fetch retail sales data
  const { data: retailSales, isLoading: salesLoading, refetch } = useQuery(
    ['retail-sales-report', startDate, endDate],
    async () => {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await api.get('/api/sales/retail', { params });
      return response.data.data;
    },
    {
      enabled: true // Always enabled since we want to show all retail sales by default
    }
  );

  // Automatically refresh data when shop changes
  useShopRefresh(refetch);

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
    { label: 'Date', accessor: (row) => new Date(row.createdAt || row.date).toLocaleDateString() },
    { label: 'Subtotal (BDT)', accessor: (row) => row.subTotal || 0 },
    { label: 'Discount (BDT)', accessor: (row) => row.discount || 0 },
    { label: 'Tax (BDT)', accessor: (row) => row.tax || 0 },
    { label: 'Total Amount (BDT)', accessor: (row) => row.total || 0 },
    ...(!isSalesStaff ? [{ label: 'Profit (BDT)', accessor: (row) => calculateProfit(row) }] : []),
    { label: 'Status', accessor: (row) => row.status || 'Completed' }
  ];

  const downloadExcel = async () => {
    if (!retailSales || retailSales.length === 0) return;
    setLoading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Retail Sales Report');

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
        fgColor: { argb: 'FF9C27B0' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      retailSales.forEach(row => {
        const rowData = {};
        exportColumns.forEach(col => {
          const val = col.accessor(row);
          rowData[col.label] = val === null || val === undefined ? '' : val;
        });
        worksheet.addRow(rowData);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Retail_Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Excel download error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate retail sales summary
  const retailSummary = retailSales?.reduce((acc, sale) => {
    acc.totalSales += sale.total || 0;
    acc.totalItems += sale.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    if (!isSalesStaff) {
      acc.totalProfit += calculateProfit(sale);
    }
    return acc;
  }, { totalSales: 0, totalItems: 0, totalProfit: 0 }) || { totalSales: 0, totalItems: 0, totalProfit: 0 };

  return (
    <Box sx={{ py: { xs: 1, sm: 2 }, 
      backgroundColor: '#F8FAFC',
      
    }}>
      
      {/* Page Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            '&:hover': { bgcolor: '#f1f5f9' },
            borderRadius: '10px',
            p: 1
          }}
        >
          <ArrowBackIcon sx={{ color: '#475569', fontSize: '1.2rem' }} />
        </IconButton>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#1e293b',
              fontFamily: '"Outfit", sans-serif',
              fontSize: { xs: '1.3rem', sm: '1.6rem' },
              letterSpacing: '-0.3px',
            }}
          >
            Retail Reports
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.2, fontFamily: '"Outfit", sans-serif' }}>
            Overview of all retail report categories
          </Typography>
        </Box>
      </Box>
      <Grid container spacing={1.5} >
        <Grid item xs={12}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}>
            <CardHeader 
              title="Report Filters" 
              subheader="Set date range to filter reports"
              sx={{ 
                backgroundColor: '#f5f9ff',
                borderBottom: '1px solid #e0e0e0',
                '& .MuiCardHeader-title': {
                  color: '#1D5F99',
                  fontWeight: '600',
                  fontSize: '1.2rem'
                },
                '& .MuiCardHeader-subheader': {
                  color: '#666'
                }
              }}
            />
            <CardContent>
              <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      sx: { borderRadius: '8px' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      sx: { borderRadius: '8px' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      backgroundColor: '#1D5F99',
                      '&:hover': {
                        backgroundColor: '#42A2C2'
                      },
                      height: '100%',
                      borderRadius: '8px',
                      px: 3,
                      minWidth: 140
                    }}
                    onClick={() => {
                      // This will trigger a refetch with the new date parameters
                      // The useQuery hook will automatically refetch when startDate or endDate changes
                    }}
                  >
                    Apply Filters
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Retail Sales Summary Cards */}
        <Grid item xs={12}>
          <Grid container spacing={1.5} sx={{ maxWidth: '100%' }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ 
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'visible',
                height: '100%'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" color="textSecondary" sx={{ fontSize: '0.9rem', mb: 0.5 }}>Total Retail Sales</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1D5F99', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                        ৳{retailSummary.totalSales.toFixed(2)}
                      </Typography>
                    </Box>
                    
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3} md={4}>
              <Card sx={{ 
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'visible',
                height: '100%'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" color="textSecondary" sx={{ fontSize: '0.9rem', mb: 0.5 }}>Items Sold</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#42A2C2', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                        {retailSummary.totalItems}
                      </Typography>
                    </Box>
                    
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            {!isSalesStaff && (
              <Grid item xs={6} sm={3} md={4}>
                <Card sx={{ 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  overflow: 'visible',
                  height: '100%'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h6" color="textSecondary" sx={{ fontSize: '0.9rem', mb: 0.5 }}>Total Profit</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#E57141', fontSize: { xs: '1.1rem', sm: '1.4rem' } }}>
                          ৳{retailSummary.totalProfit.toFixed(2)}
                        </Typography>
                      </Box>
                      
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>
        
        {/* Retail Sales Table */}
        <Grid item xs={12}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}>
             <CardHeader 
              title="Retail Sales Details" 
              subheader="Detailed view of retail sales transactions"
              action={
                retailSales && retailSales.length > 0 && (
                  <Box sx={{ pr: 2, pt: 1, display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ExcelIcon />}
                      onClick={downloadExcel}
                      disabled={loading}
                      sx={{ 
                        backgroundColor: '#10b981',
                        '&:hover': { backgroundColor: '#059669' },
                        textTransform: 'none', 
                        borderRadius: '8px', 
                        fontWeight: 600,
                        px: 2
                      }}
                    >
                      {loading ? 'Processing...' : 'Excel'}
                    </Button>
                    <ExportButtons
                      data={retailSales || []}
                      columns={exportColumns}
                      filename="retail_sales_report"
                      title="Retail Sales Report"
                    />
                  </Box>
                )
              }
              sx={{ 
                backgroundColor: '#f5f9ff',
                borderBottom: '1px solid #e0e0e0',
                '& .MuiCardHeader-title': {
                  color: '#1D5F99',
                  fontWeight: '600',
                  fontSize: '1.2rem'
                },
                '& .MuiCardHeader-subheader': {
                  color: '#666'
                }
              }}
            />
            <CardContent>
              {salesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : retailSales && retailSales.length > 0 ? (
                <>
                  {/* Desktop view */}
                  <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Table>
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
                          <TableCell sx={{ fontWeight: 'bold', color: '#1D5F99', minWidth: 130 }}>Invoice</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1D5F99', minWidth: 160 }}>Customer Details</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1D5F99', minWidth: 180 }}>Products & Category</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1D5F99', minWidth: 110 }}>Date</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1D5F99', minWidth: 80 }}>Items</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1D5F99', minWidth: 100 }}>Subtotal</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1D5F99', minWidth: 100 }}>Discount</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1D5F99', minWidth: 110 }}>Total</TableCell>
                          {!isSalesStaff && (
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1D5F99', minWidth: 100 }}>Profit</TableCell>
                          )}
                          <TableCell align="center" sx={{ fontWeight: 'bold', color: '#1D5F99', minWidth: 90 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {retailSales.map((sale) => (
                          <TableRow 
                            key={sale._id}
                            sx={{
                              '&:nth-of-type(even)': { backgroundColor: '#f9fbfd' },
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
                            <TableCell>
                              {new Date(sale.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="right">
                              {sale.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                            </TableCell>
                            <TableCell align="right">
                              ৳{sale.subTotal?.toFixed(2) || '0.00'}
                            </TableCell>
                            <TableCell align="right">
                              ৳{sale.discount?.toFixed(2) || '0.00'}
                            </TableCell>
                            <TableCell align="right">
                              ৳{sale.tax?.toFixed(2) || '0.00'}
                            </TableCell>
                            <TableCell align="right">
                              ৳{sale.total?.toFixed(2) || '0.00'}
                            </TableCell>
                            {!isSalesStaff && (
                              <TableCell align="right">
                                ৳{calculateProfit(sale).toFixed(2)}
                              </TableCell>
                            )}
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedSaleId(sale._id);
                                  setInvoiceOpen(true);
                                }}
                                sx={{
                                  color: '#1D5F99',
                                  '&:hover': {
                                    backgroundColor: 'rgba(29, 95, 153, 0.08)'
                                  }
                                }}
                                title="View Invoice Detail"
                              >
                                <EyeIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Mobile View Cards */}
                  <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, p: 1.5, backgroundColor: '#F8FAFC' }}>
                    {retailSales.map((sale) => (
                      <Paper key={sale._id} elevation={0} sx={{ p: 2, border: '1px solid #eaeef3', borderRadius: '12px', backgroundColor: '#fff', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                            {sale.customer?.contactName || 'N/A'}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>

                        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Items</Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>{sale.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Subtotal</Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>৳{sale.subTotal?.toFixed(2) || '0.00'}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Discount</Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>৳{sale.discount?.toFixed(2) || '0.00'}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Tax</Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>৳{sale.tax?.toFixed(2) || '0.00'}</Typography>
                          </Grid>
                        </Grid>

                        <Box sx={{ display: 'flex', gap: 1.5, p: 1, backgroundColor: '#F8FAFC', borderRadius: '8px', mb: 1.5, justifyContent: 'space-around', textAlign: 'center' }}>
                          <Box>
                            <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>TOTAL</Typography>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#1D5F99' }}>৳{sale.total?.toFixed(2) || '0.00'}</Typography>
                          </Box>
                          {!isSalesStaff && (
                            <Box>
                              <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>PROFIT</Typography>
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#E57141' }}>৳{calculateProfit(sale).toFixed(2)}</Typography>
                            </Box>
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', pt: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedSaleId(sale._id);
                              setInvoiceOpen(true);
                            }}
                            sx={{ color: '#1D5F99', '&:hover': { backgroundColor: 'rgba(29, 95, 153, 0.08)' } }}
                            title="View Invoice Detail"
                          >
                            <EyeIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </>
              ) : (
                <Alert severity="info">No retail sales found for the selected date range.</Alert>
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
                      <Typography variant="subtitle1" align="center" gutterBottom>Retail Sales Report</Typography>
                      <Typography variant="body2" align="center" sx={{ mb: 2 }}>Generated on: {new Date().toLocaleDateString()}</Typography>
                      
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Customer</TableCell>
                              <TableCell align="right">Date</TableCell>
                              <TableCell align="right">Items</TableCell>
                              <TableCell align="right">Total</TableCell>
                              {!isSalesStaff && <TableCell align="right">Profit</TableCell>}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {retailSales?.slice(0, 5)?.map((sale) => (
                              <TableRow key={sale._id}>
                                <TableCell>{sale.customer?.contactName || 'N/A'}</TableCell>
                                <TableCell align="right">{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell align="right">{sale.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}</TableCell>
                                <TableCell align="right">৳{sale.total?.toFixed(2) || '0.00'}</TableCell>
                                {!isSalesStaff && (
                                  <TableCell align="right">৳{calculateProfit(sale).toFixed(2)}</TableCell>
                                )}
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
                      <Typography variant="body2" gutterBottom>Sheet: Retail Sales Report</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Customer</TableCell>
                              <TableCell align="right">Date</TableCell>
                              <TableCell align="right">Items</TableCell>
                              <TableCell align="right">Total</TableCell>
                              {!isSalesStaff && <TableCell align="right">Profit</TableCell>}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {retailSales?.slice(0, 5)?.map((sale) => (
                              <TableRow key={sale._id}>
                                <TableCell>{sale.customer?.contactName || 'N/A'}</TableCell>
                                <TableCell align="right">{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell align="right">{sale.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}</TableCell>
                                <TableCell align="right">{sale.total?.toFixed(2) || '0.00'}</TableCell>
                                {!isSalesStaff && (
                                  <TableCell align="right">{calculateProfit(sale).toFixed(2)}</TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      This is a preview of how the Excel report will look. Actual report may vary slightly.
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
                setLoading(true);
                // Simulate download process
                setTimeout(() => {
                  setLoading(false);
                  setPreviewOpen(false);
                  alert(`Downloading ${activeTab === 0 ? 'PDF' : 'Excel'} report...`);
                }, 1500);
              }}
            >
              {loading ? 'Processing...' : `Download ${activeTab === 0 ? 'PDF' : 'Excel'}`}
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>

      {/* Sale Invoice Modal for Interactive View/Share */}
      <SaleInvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        saleId={selectedSaleId}
        sourceType="sale"
      />
    </Box>
  );
};

export default RetailReports;