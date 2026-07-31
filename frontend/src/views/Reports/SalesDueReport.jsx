import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
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
  TextField,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert as MuiAlert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
  Download as ExcelIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as EyeIcon,
  AccountBalanceWallet as BalanceIcon,
  TrendingUp as SalesIcon,
  Payment as PaymentIcon,
  CalendarMonth as OverdueIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import SaleInvoiceModal from '../../components/invoices/PrintInvoiceModal';

const SalesDueReport = () => {
  const navigate = useNavigate();
  const { activeShop } = useAuth();

  // Invoice Modal states
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [selectedSourceType, setSelectedSourceType] = useState('order');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    customerId: '',
    startDate: '',
    endDate: '',
    minDue: ''
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

  // Fetch all customers for the filter dropdown
  const { data: customersResponse } = useQuery(
    ['customers', activeShop?._id],
    async () => {
      const response = await api.get('/api/contacts/customers');
      return response.data?.data || [];
    },
    {
      enabled: true,
      staleTime: 60000
    }
  );
  const customers = customersResponse || [];

  // Fetch sales due report from backend
  const { data: reportResponse, isLoading, error, refetch } = useQuery(
    ['salesDueReport', filters, activeShop?._id],
    async () => {
      const params = { ...filters, shopId: activeShop?._id };
      const response = await api.get('/api/reports/sales-due-report', { params });
      return response.data;
    },
    {
      enabled: true,
      staleTime: 5000
    }
  );

  const handleGenerateReport = () => {
    refetch();
    showToast('Report updated with active criteria!', 'info');
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleResetFilters = () => {
    setFilters({
      customerId: '',
      startDate: '',
      endDate: '',
      minDue: ''
    });
    setSearchQuery('');
    showToast('Filters reset successfully!', 'info');
  };

  // Local text search filter
  const reportData = reportResponse?.data || [];
  const filteredData = useMemo(() => {
    if (!searchQuery) return reportData;
    const query = searchQuery.toLowerCase().trim();
    return reportData.filter(row => 
      (row.invoiceNumber && row.invoiceNumber.toLowerCase().includes(query)) ||
      (row.orderNumber && row.orderNumber.toLowerCase().includes(query)) ||
      (row.customer?.name && row.customer.name.toLowerCase().includes(query)) ||
      (row.customer?.contact && row.customer.contact.includes(query))
    );
  }, [reportData, searchQuery]);

  // Compute live Outfit KPI metrics on active filtered data
  const activeSummary = useMemo(() => {
    let totalDues = 0;
    let totalOrders = filteredData.length;
    let averageDue = 0;
    let above90 = 0;

    filteredData.forEach(row => {
      totalDues += row.dueAmount || 0;
      if ((row.daysOverdue || 0) > 90) {
        above90++;
      }
    });

    averageDue = totalDues / (totalOrders || 1);

    return {
      totalDues,
      totalOrders,
      averageDue,
      above90
    };
  }, [filteredData]);

  // Currency & Date Formatter
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Open Invoice Modal Helper
  const handleViewInvoice = (saleId, type) => {
    setSelectedSaleId(saleId);
    setSelectedSourceType(type === 'retail' ? 'sale' : 'order');
    setInvoiceOpen(true);
  };

  const getCustomerName = (row) => {
    if (!row) return 'N/A';
    return (
      row.customer?.contactName ||
      row.customer?.name ||
      row.customer?.businessName ||
      row.customerName ||
      'N/A'
    );
  };

  const getCustomerPhone = (row) => {
    if (!row) return '';
    return (
      row.customer?.contactNumber ||
      row.customer?.phone ||
      row.customer?.contact ||
      row.customerPhone ||
      ''
    );
  };

  const getCustomerAddress = (row) => {
    if (!row) return 'N/A';
    return (
      row.customer?.address ||
      row.customerAddress ||
      row.shippingAddress?.address ||
      (typeof row.shippingAddress === 'string' ? row.shippingAddress : '') ||
      'N/A'
    );
  };

  const getProductNames = (row) => {
    if (!row) return 'N/A';
    if (!row.items || !Array.isArray(row.items) || row.items.length === 0) {
      return row.productName || 'N/A';
    }
    return row.items
      .map(item => {
        const name = item.productName || item.product?.name || item.name || 'Product';
        const qty = item.quantity ? ` (x${item.quantity})` : '';
        return `${name}${qty}`;
      })
      .join(', ');
  };

  const getProductCategory = (row) => {
    if (!row) return 'N/A';
    if (!row.items || !Array.isArray(row.items) || row.items.length === 0) {
      return row.category || row.productCategory || 'N/A';
    }
    const categories = row.items
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
    return uniqueCategories.length > 0 ? uniqueCategories.join(', ') : (row.category || 'N/A');
  };

  const handleExportCSV = async () => {
    if (!filteredData.length) {
      showToast('No sales due records available to export.', 'error');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Due Report');

      const columns = [
        { label: 'Invoice / Order #', key: 'inv', width: 22 },
        { label: 'Customer Name', key: 'name', width: 20 },
        { label: 'Customer Phone', key: 'phone', width: 16 },
        { label: 'Customer Address', key: 'address', width: 25 },
        { label: 'Products', key: 'products', width: 28 },
        { label: 'Product Category', key: 'category', width: 18 },
        { label: 'Order Date', key: 'date', width: 14 },
        { label: 'Total Amount (BDT)', key: 'total', width: 18 },
        { label: 'Paid Amount (BDT)', key: 'paid', width: 18 },
        { label: 'Outstanding Due (BDT)', key: 'due', width: 20 },
        { label: 'Days Overdue', key: 'overdue', width: 14 },
        { label: 'Status', key: 'status', width: 14 }
      ];

      worksheet.columns = columns.map(c => ({ header: c.label, key: c.key, width: c.width }));

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE65100' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      filteredData.forEach(row => {
        worksheet.addRow({
          inv: row.invoiceNumber || row.orderNumber || 'N/A',
          name: getCustomerName(row),
          phone: getCustomerPhone(row) || 'N/A',
          address: getCustomerAddress(row),
          products: getProductNames(row),
          category: getProductCategory(row),
          date: new Date(row.date).toLocaleDateString('en-GB'),
          total: row.total || 0,
          paid: row.paidAmount || 0,
          due: row.dueAmount || 0,
          overdue: row.daysOverdue || 0,
          status: row.status || 'Approved'
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Sales_Due_Report_${new Date().toISOString().slice(0,10)}.xlsx`);

      showToast('Sales Due report exported successfully!', 'success');
    } catch (err) {
      console.error('Excel export error:', err);
      showToast('Failed to export Excel report', 'error');
    }
  };

  // Styled PDF Print Preview
  const handlePrintReport = () => {
    if (!filteredData.length) {
      showToast('No sales due records to print.', 'error');
      return;
    }

    let tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Customer Name</th>
            <th>Contact</th>
            <th>Date</th>
            <th class="text-right">Total</th>
            <th class="text-right">Paid</th>
            <th class="text-right">Due Amount</th>
            <th>Days Overdue</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    filteredData.forEach(row => {
      tableHtml += `
        <tr>
          <td><strong>${row.invoiceNumber || row.orderNumber || 'N/A'}</strong></td>
          <td>${row.customer?.name || 'N/A'}</td>
          <td>${row.customer?.contact || 'N/A'}</td>
          <td>${new Date(row.date).toLocaleDateString('en-GB')}</td>
          <td class="text-right">৳${formatCurrency(row.total)}</td>
          <td class="text-right">৳${formatCurrency(row.paidAmount)}</td>
          <td class="text-right" style="font-weight: 600; color: #EF4444;">
            ৳${formatCurrency(row.dueAmount)}
          </td>
          <td>
            <span style="padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; 
              background-color: ${row.daysOverdue > 90 ? '#FEE2E2' : row.daysOverdue > 30 ? '#FEF3C7' : '#D1FAE5'};
              color: ${row.daysOverdue > 90 ? '#991B1B' : row.daysOverdue > 30 ? '#92400E' : '#065F46'}">
              ${row.daysOverdue || 0} days
            </span>
          </td>
          <td>${row.status || 'Approved'}</td>
        </tr>
      `;
    });

    tableHtml += `
        <tr class="total-row">
          <td colspan="4">Total Dues Summary</td>
          <td class="text-right">-</td>
          <td class="text-right">-</td>
          <td class="text-right">৳${formatCurrency(activeSummary.totalDues)}</td>
          <td colspan="2"></td>
        </tr>
      </tbody>
    </table>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Outstanding Sales Due Report</title>
          <style>
            body { font-family: 'Outfit', 'Segoe UI', Arial, sans-serif; padding: 25px; color: #1e293b; }
            h2 { color: #FF9800; margin-bottom: 5px; font-weight: 700; }
            .meta { color: #64748b; font-size: 13px; margin-top: 0; margin-bottom: 25px; border-bottom: 2px solid #FF9800; padding-bottom: 10px; }
            .summary-box { display: flex; gap: 20px; margin-bottom: 25px; background: #fff8e1; border: 1px solid #ffe082; border-radius: 6px; padding: 15px; }
            .summary-card { flex: 1; text-align: center; }
            .summary-card h4 { margin: 0; font-size: 11px; text-transform: uppercase; color: #795548; letter-spacing: 0.5px; }
            .summary-card p { margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #e65100; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 12px; }
            th { background-color: #FF9800; color: white; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; background-color: #fffde7; border-top: 2px solid #FF9800; }
          </style>
        </head>
        <body>
          <h2>Outstanding Sales Due Report</h2>
          <div class="meta">
            Shop: <strong>${activeShop?.name || 'Smart Plaza'}</strong> | 
            Generated: <strong>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong> |
            Records: <strong>${activeSummary.totalOrders} invoices</strong>
          </div>
          
          <div class="summary-box">
            <div class="summary-card">
              <h4>Total Outstanding</h4>
              <p>৳${formatCurrency(activeSummary.totalDues)}</p>
            </div>
            <div class="summary-card">
              <h4>Invoices Count</h4>
              <p>${activeSummary.totalOrders}</p>
            </div>
            <div class="summary-card">
              <h4>Average Due</h4>
              <p>৳${formatCurrency(activeSummary.averageDue)}</p>
            </div>
            <div class="summary-card">
              <h4>Critical Overdue (>90d)</h4>
              <p>${activeSummary.above90 || 0}</p>
            </div>
          </div>

          ${tableHtml}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast('Generated printable Sales Due report!', 'success');
  };

  return (
    <Box sx={{ py: { xs: 1, sm: 2 }, backgroundColor: '#F8FAFC', minHeight: '90vh' }}>
      
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
        {/* Header Section */}
        {/* Filter Section */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid #eaeef3',
              borderRadius: '12px',
              backgroundColor: '#ffffff'
            }}
          >
            <Grid container spacing={2} alignItems="center">
              {/* Customer Search Dropdown */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="customer-select-label" sx={{ fontFamily: '"Outfit", sans-serif' }}>Customer Account</InputLabel>
                  <Select
                    labelId="customer-select-label"
                    name="customerId"
                    value={filters.customerId}
                    label="Customer Account"
                    onChange={handleFilterChange}
                    sx={{ fontFamily: '"Outfit", sans-serif', borderRadius: '8px' }}
                  >
                    <MenuItem value="" sx={{ fontFamily: '"Outfit", sans-serif' }}>All Customers</MenuItem>
                    {customers.map((cust) => (
                      <MenuItem key={cust._id} value={cust._id} sx={{ fontFamily: '"Outfit", sans-serif' }}>
                        {cust.contactName} ({cust.contactNumber})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Start Date */}
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="From Date"
                  name="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ style: { fontFamily: '"Outfit", sans-serif' } }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Grid>

              {/* End Date */}
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="To Date"
                  name="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ style: { fontFamily: '"Outfit", sans-serif' } }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Grid>

              {/* Minimum Due */}
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Min Due Amount (৳)"
                  name="minDue"
                  type="number"
                  placeholder="e.g. 5000"
                  value={filters.minDue}
                  onChange={handleFilterChange}
                  inputProps={{ style: { fontFamily: '"Outfit", sans-serif' } }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Grid>

              {/* Trigger Button & Reset */}
              <Grid item xs={12} md={3} sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleGenerateReport}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
                  sx={{
                    backgroundColor: '#FF9800',
                    '&:hover': { backgroundColor: '#F57C00' },
                    textTransform: 'none',
                    fontWeight: 600,
                    fontFamily: '"Outfit", sans-serif',
                    borderRadius: '8px',
                    py: 1
                  }}
                >
                  {isLoading ? 'Updating...' : 'Apply Filters'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleResetFilters}
                  sx={{
                    borderColor: '#cbd5e1',
                    color: '#64748b',
                    textTransform: 'none',
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 500,
                    borderRadius: '8px',
                    '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' }
                  }}
                >
                  Reset
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Dynamic Premium KPI Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {/* Total Outstanding Dues */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                borderRadius: '16px',
                border: '1px solid #ffe082',
                background: 'linear-gradient(135deg, #FFF8E1 0%, #FFF3E0 100%)',
                boxShadow: '0 4px 20px rgba(255, 152, 0, 0.05)',
                transition: 'transform 0.25s ease-in-out',
                '&:hover': { transform: 'translateY(-2px)' }
              }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', p: '20px !important' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#b26a00', textTransform: 'uppercase', tracking: 1, fontFamily: '"Outfit", sans-serif', mb: 0.5 }}>
                      Total Dues
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#e65100', fontFamily: '"Outfit", sans-serif' }}>
                      ৳{formatCurrency(activeSummary.totalDues)}
                    </Typography>
                  </Box>
                  <Box sx={{ backgroundColor: 'rgba(255, 152, 0, 0.15)', borderRadius: '12px', p: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BalanceIcon sx={{ color: '#FF9800', fontSize: '1.75rem' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Orders with Outstanding Dues */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                borderRadius: '16px',
                border: '1px solid #bbdefb',
                background: 'linear-gradient(135deg, #E3F2FD 0%, #E8F5E9 100%)',
                boxShadow: '0 4px 20px rgba(33, 150, 243, 0.05)',
                transition: 'transform 0.25s ease-in-out',
                '&:hover': { transform: 'translateY(-2px)' }
              }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', p: '20px !important' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0d47a1', textTransform: 'uppercase', tracking: 1, fontFamily: '"Outfit", sans-serif', mb: 0.5 }}>
                      Active Invoices
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0d47a1', fontFamily: '"Outfit", sans-serif' }}>
                      {activeSummary.totalOrders}
                    </Typography>
                  </Box>
                  <Box sx={{ backgroundColor: 'rgba(33, 150, 243, 0.15)', borderRadius: '12px', p: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SalesIcon sx={{ color: '#2196F3', fontSize: '1.75rem' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Average Outstanding Due */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                borderRadius: '16px',
                border: '1px solid #e1bee7',
                background: 'linear-gradient(135deg, #F3E5F5 0%, #EDE7F6 100%)',
                boxShadow: '0 4px 20px rgba(156, 39, 176, 0.05)',
                transition: 'transform 0.25s ease-in-out',
                '&:hover': { transform: 'translateY(-2px)' }
              }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', p: '20px !important' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#4a148c', textTransform: 'uppercase', tracking: 1, fontFamily: '"Outfit", sans-serif', mb: 0.5 }}>
                      Average Due
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#4a148c', fontFamily: '"Outfit", sans-serif' }}>
                      ৳{formatCurrency(activeSummary.averageDue)}
                    </Typography>
                  </Box>
                  <Box sx={{ backgroundColor: 'rgba(156, 39, 176, 0.15)', borderRadius: '12px', p: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PaymentIcon sx={{ color: '#9C27B0', fontSize: '1.75rem' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Critical Overdue (>90 Days) */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                borderRadius: '16px',
                border: '1px solid #ffcdd2',
                background: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)',
                boxShadow: '0 4px 20px rgba(244, 67, 54, 0.05)',
                transition: 'transform 0.25s ease-in-out',
                '&:hover': { transform: 'translateY(-2px)' }
              }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', p: '20px !important' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#b71c1c', textTransform: 'uppercase', tracking: 1, fontFamily: '"Outfit", sans-serif', mb: 0.5 }}>
                      Critical Overdue (&gt;90d)
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#b71c1c', fontFamily: '"Outfit", sans-serif' }}>
                      {activeSummary.above90}
                    </Typography>
                  </Box>
                  <Box sx={{ backgroundColor: 'rgba(244, 67, 54, 0.15)', borderRadius: '12px', p: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <OverdueIcon sx={{ color: '#F44336', fontSize: '1.75rem' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Main Data Table */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid #eaeef3',
              borderRadius: '12px',
              backgroundColor: '#ffffff'
            }}
          >
            {/* Table Header Filter (Search Box) */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
              <TextField
                size="small"
                placeholder="Search by Invoice # or Customer details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  width: { xs: '100%', sm: '320px' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    fontFamily: '"Outfit", sans-serif',
                    backgroundColor: '#f8fafc'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <ClearIcon sx={{ fontSize: '16px' }} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  onClick={handlePrintReport}
                  disabled={isLoading || !filteredData.length}
                  startIcon={<PdfIcon />}
                  sx={{
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontFamily: '"Outfit", sans-serif',
                    borderRadius: '8px',
                    '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' }
                  }}
                >
                  Print PDF
                </Button>
                <Button
                  variant="contained"
                  onClick={handleExportCSV}
                  disabled={isLoading || !filteredData.length}
                  startIcon={<ExcelIcon />}
                  sx={{
                    backgroundColor: '#009688',
                    '&:hover': { backgroundColor: '#00796b' },
                    color: '#ffffff',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontFamily: '"Outfit", sans-serif',
                    borderRadius: '8px'
                  }}
                >
                  Export CSV
                </Button>
              </Box>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2, fontFamily: '"Outfit", sans-serif' }}>
                Failed to fetch Sales Due data: {error.message || 'Server error. Please try again.'}
              </Alert>
            )}

            {/* Data Table Element */}
            {isLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
                <CircularProgress color="primary" />
                <Typography sx={{ color: '#64748b', fontSize: '0.9rem', fontFamily: '"Outfit", sans-serif' }}>
                  Loading outstanding wholesale transactions...
                </Typography>
              </Box>
            ) : filteredData.length > 0 ? (
              <TableContainer sx={{ border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', color: '#334155' }}>Invoice / Order #</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', color: '#334155' }}>Customer Profile</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', color: '#334155' }}>Products & Category</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', color: '#334155' }}>Due Date / Order Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', color: '#334155', textAlign: 'right' }}>Total Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', color: '#334155', textAlign: 'right' }}>Paid Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', color: '#334155', textAlign: 'right' }}>Outstanding Due</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', color: '#334155' }}>Days Overdue</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', color: '#334155' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', color: '#334155', textAlign: 'center' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData.map((order, index) => {
                      const days = order.daysOverdue || 0;
                      return (
                        <TableRow key={order._id || index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          {/* Interactive clickable Invoice ID */}
                          <TableCell sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 600 }}>
                            <Button
                              onClick={() => handleViewInvoice(order._id, order.type)}
                              sx={{
                                p: 0,
                                minWidth: 0,
                                textTransform: 'none',
                                color: '#009688',
                                fontWeight: 600,
                                textDecoration: 'underline',
                                fontFamily: '"Outfit", sans-serif',
                                fontSize: '0.875rem',
                                '&:hover': {
                                  color: '#00796b',
                                  textDecoration: 'underline',
                                  backgroundColor: 'transparent'
                                }
                              }}
                            >
                              {order.invoiceNumber || order.orderNumber || 'N/A'}
                            </Button>
                          </TableCell>

                          {/* Customer Name and Contact & Address */}
                          <TableCell sx={{ fontFamily: '"Outfit", sans-serif' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontFamily: '"Outfit", sans-serif' }}>
                              {getCustomerName(order)}
                            </Typography>
                            {getCustomerPhone(order) && (
                              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontFamily: '"Outfit", sans-serif' }}>
                                📞 {getCustomerPhone(order)}
                              </Typography>
                            )}
                            {getCustomerAddress(order) !== 'N/A' && (
                              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', fontFamily: '"Outfit", sans-serif' }}>
                                📍 {getCustomerAddress(order)}
                              </Typography>
                            )}
                          </TableCell>

                          {/* Products and Category */}
                          <TableCell sx={{ fontFamily: '"Outfit", sans-serif' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#0f172a', fontFamily: '"Outfit", sans-serif' }}>
                              {getProductNames(order)}
                            </Typography>
                            {getProductCategory(order) !== 'N/A' && (
                              <Typography variant="caption" sx={{ color: '#E65100', fontWeight: 600, display: 'block', mt: 0.2, fontFamily: '"Outfit", sans-serif' }}>
                                🏷️ {getProductCategory(order)}
                              </Typography>
                            )}
                          </TableCell>

                          {/* Date */}
                          <TableCell sx={{ fontFamily: '"Outfit", sans-serif', color: '#475569' }}>
                            {new Date(order.date).toLocaleDateString('en-GB')}
                          </TableCell>

                          {/* Total */}
                          <TableCell sx={{ fontFamily: '"Outfit", sans-serif', color: '#475569', fontWeight: 500 }} align="right">
                            ৳{formatCurrency(order.total)}
                          </TableCell>

                          {/* Paid */}
                          <TableCell sx={{ fontFamily: '"Outfit", sans-serif', color: '#10b981', fontWeight: 500 }} align="right">
                            ৳{formatCurrency(order.paidAmount)}
                          </TableCell>

                          {/* Due */}
                          <TableCell sx={{ fontFamily: '"Outfit", sans-serif', color: '#ef4444', fontWeight: 700 }} align="right">
                            ৳{formatCurrency(order.dueAmount)}
                          </TableCell>

                          {/* Dynamic Color Days Overdue Chips */}
                          <TableCell sx={{ fontFamily: '"Outfit", sans-serif' }}>
                            <Chip 
                              label={`${days} days`} 
                              size="small"
                              sx={{
                                fontFamily: '"Outfit", sans-serif',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                backgroundColor: days > 90 ? '#fee2e2' : days > 30 ? '#fef3c7' : '#d1fae5',
                                color: days > 90 ? '#991b1b' : days > 30 ? '#92400e' : '#065f46',
                                borderRadius: '6px'
                              }}
                            />
                          </TableCell>

                          {/* Status */}
                          <TableCell sx={{ fontFamily: '"Outfit", sans-serif' }}>
                            <Chip 
                              label={order.status || 'Approved'} 
                              size="small"
                              variant="outlined"
                              sx={{
                                fontFamily: '"Outfit", sans-serif',
                                fontWeight: 500,
                                fontSize: '0.725rem',
                                borderColor: order.status === 'Delivered' || order.status === 'Approved' ? '#10b981' : '#f59e0b',
                                color: order.status === 'Delivered' || order.status === 'Approved' ? '#10b981' : '#f59e0b',
                                backgroundColor: 'transparent',
                                borderRadius: '6px'
                              }}
                            />
                          </TableCell>

                          {/* Action Column containing View Icon Button */}
                          <TableCell sx={{ fontFamily: '"Outfit", sans-serif' }} align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleViewInvoice(order._id, order.type)}
                              sx={{
                                color: '#FF9800',
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 152, 0, 0.08)'
                                }
                              }}
                              title="View Invoice Detail"
                            >
                              <EyeIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 4 }}>
                <Alert severity="info" sx={{ fontFamily: '"Outfit", sans-serif', borderRadius: '8px' }}>
                  No outstanding sales dues matching the filters and search term.
                </Alert>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <SaleInvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        saleId={selectedSaleId}
        sourceType={selectedSourceType}
      />

      {/* Toast Notification Feed */}
      <Snackbar 
        open={toastOpen} 
        autoHideDuration={4000} 
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          onClose={handleCloseToast}
          severity={toastSeverity}
          elevation={6}
          variant="filled"
          sx={{ fontFamily: '"Outfit", sans-serif', borderRadius: '8px' }}
        >
          {toastMessage}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default SalesDueReport;