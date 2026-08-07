import React, { useState, useMemo } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
  Download as ExcelIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as EyeIcon,
  Refresh as RefreshIcon,
  AccountBalanceWallet as BalanceIcon,
  TrendingUp as SalesIcon,
  Payment as PaymentIcon,
  People as PeopleIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import SaleInvoiceModal from '../../components/invoices/PrintInvoiceModal';

const CustomerLedger = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlCustomerId = searchParams.get('customerId') || '';
  const { activeShop } = useAuth();

  // Dialog States
  const [statementOpen, setStatementOpen] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState(null);

  // Invoice Modal States
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [selectedSourceType, setSelectedSourceType] = useState('sale');

  // Set default dates to current month so data loads immediately on first open
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const toInputDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    customerId: urlCustomerId,
    startDate: '',
    endDate: ''
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

  // Fetch all customers for the dropdown filter
  const { data: customersResponse } = useQuery(
    ['customers', activeShop?._id],
    async () => {
      const response = await api.get('/api/contacts/customers');
      return response.data?.data || [];
    },
    { staleTime: 60000 }
  );
  const customers = customersResponse || [];

  // Fetch Customer Ledger Data from backend
  const { data: ledgerResponse, isLoading, error, refetch } = useQuery(
    ['customerLedger', filters, activeShop?._id],
    async () => {
      // shopId is sent automatically via x-shop-id header by api.js interceptor
      const params = { ...filters };
      const response = await api.get('/api/reports/customer-ledger', { params });
      return response.data;
    },
    { staleTime: 5000, keepPreviousData: true }
  );

  const handleGenerateReport = () => {
    refetch();
    showToast('Report regenerated successfully!', 'info');
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
      endDate: ''
    });
    setSearchQuery('');
    showToast('Filters reset!', 'info');
  };

  // Local Customer Text Search Filtering
  const ledgerData = ledgerResponse?.data || [];
  const filteredLedgerData = useMemo(() => {
    if (!searchQuery) return ledgerData;
    const query = searchQuery.toLowerCase().trim();
    return ledgerData.filter(row => 
      (row.customer?.name && row.customer.name.toLowerCase().includes(query)) ||
      (row.customer?.contact && row.customer.contact.includes(query))
    );
  }, [ledgerData, searchQuery]);

  // Compute live metrics on current filtered data
  const metrics = useMemo(() => {
    let totalOutstanding = 0;
    let totalSales = 0;
    let totalPayments = 0;
    const activeCount = filteredLedgerData.length;

    filteredLedgerData.forEach(row => {
      totalOutstanding += row.summary?.closingBalance || 0;
      totalSales += row.summary?.totalSales || 0;
      totalPayments += row.summary?.totalPaid || 0;
    });

    return {
      totalOutstanding,
      totalSales,
      totalPayments,
      activeCount
    };
  }, [filteredLedgerData]);

  // View Customer Ledger Detailed Statement
  const handleOpenStatement = (row) => {
    setSelectedLedger(row);
    setStatementOpen(true);
  };

  // Launch Sale Invoice details
  const handleViewInvoice = (saleId, sourceType) => {
    setSelectedSaleId(saleId);
    setSelectedSourceType(sourceType || 'sale');
    setInvoiceOpen(true);
  };

  // Currency & Date Formatter
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB'); // Format DD/MM/YYYY
  };

  // Running Ledger Transactions calculation for selected customer statement
  const processedTransactions = useMemo(() => {
    if (!selectedLedger) return [];
    let runningBalance = selectedLedger.summary?.openingBalance || 0;
    return (selectedLedger.transactions || []).map(tx => {
      runningBalance += (tx.debit || 0) - (tx.credit || 0);
      return {
        ...tx,
        runningBalance
      };
    });
  }, [selectedLedger]);

  // Client-Side CSV Export (UTF-8 BOM safe)
  const handleExportCSV = () => {
    if (!filteredLedgerData.length) {
      showToast('No ledger records available to export.', 'error');
      return;
    }

    const headers = ['Customer Name', 'Contact Number', 'Address', 'Opening Balance', 'Total Sales', 'Total Payments', 'Current Balance', 'Status'];
    const rows = filteredLedgerData.map(row => [
      row.customer?.name || 'N/A',
      row.customer?.contact || 'N/A',
      row.customer?.address || 'N/A',
      row.summary?.openingBalance || 0,
      row.summary?.totalSales || 0,
      row.summary?.totalPaid || 0,
      row.summary?.closingBalance || 0,
      (row.summary?.closingBalance > 0 ? 'Due' : row.summary?.closingBalance < 0 ? 'Advance' : 'Clear')
    ]);

    const csvContent = '\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Customer_Ledger_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Customer Ledger exported successfully!', 'success');
  };

  // Client-Side detailed statement CSV export for a single customer
  const handleExportStatementCSV = () => {
    if (!selectedLedger || !processedTransactions.length) return;
    
    const headers = ['Date', 'Reference / Invoice #', 'Type', 'Debit (Sales)', 'Credit (Payments)', 'Running Balance'];
    const rows = processedTransactions.map(tx => [
      formatDate(tx.date),
      tx.reference || 'N/A',
      tx.type || 'Sale',
      tx.debit || 0,
      tx.credit || 0,
      tx.runningBalance || 0
    ]);

    const csvContent = '\uFEFF' +
      [
        [`Customer: ${selectedLedger.customer?.name}`].join(','),
        [`Contact: ${selectedLedger.customer?.contact}`].join(','),
        [`Address: ${selectedLedger.customer?.address || 'N/A'}`].join(','),
        [],
        headers.join(','),
        ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedLedger.customer?.name}_Ledger_Statement.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Detailed statement exported successfully!', 'success');
  };

  // Styled PDF Print Preview
  const handlePrintReport = () => {
    if (!filteredLedgerData.length) {
      showToast('No ledger records to print.', 'error');
      return;
    }

    let tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Customer Name</th>
            <th>Contact</th>
            <th class="text-right">Opening Balance</th>
            <th class="text-right">Total Sales</th>
            <th class="text-right">Total Payments</th>
            <th class="text-right">Current Balance</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    filteredLedgerData.forEach(row => {
      const balance = row.summary?.closingBalance || 0;
      tableHtml += `
        <tr>
          <td><strong>${row.customer?.name || 'N/A'}</strong></td>
          <td>${row.customer?.contact || 'N/A'}</td>
          <td class="text-right">৳${formatCurrency(row.summary?.openingBalance)}</td>
          <td class="text-right">৳${formatCurrency(row.summary?.totalSales)}</td>
          <td class="text-right">৳${formatCurrency(row.summary?.totalPaid)}</td>
          <td class="text-right" style="font-weight: 600; color: ${balance > 0 ? '#EF4444' : balance < 0 ? '#10B981' : '#1e293b'}">
            ৳${formatCurrency(balance)}
          </td>
          <td>
            <span style="padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; 
              background-color: ${balance > 0 ? '#FEE2E2' : balance < 0 ? '#D1FAE5' : '#F3F4F6'};
              color: ${balance > 0 ? '#991B1B' : balance < 0 ? '#065F46' : '#374151'}">
              ${balance > 0 ? 'Due' : balance < 0 ? 'Advance' : 'Clear'}
            </span>
          </td>
        </tr>
      `;
    });

    tableHtml += `
        <tr class="total-row">
          <td colspan="2">Consolidated Total</td>
          <td class="text-right">-</td>
          <td class="text-right">৳${formatCurrency(metrics.totalSales)}</td>
          <td class="text-right">৳${formatCurrency(metrics.totalPayments)}</td>
          <td class="text-right">৳${formatCurrency(metrics.totalOutstanding)}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Customer Ledger Summary Report</title>
          <style>
            body { font-family: 'Outfit', 'Segoe UI', Arial, sans-serif; padding: 25px; color: #1e293b; }
            h2 { color: #009688; margin-bottom: 5px; font-weight: 700; }
            .meta { color: #64748b; font-size: 13px; margin-top: 0; margin-bottom: 25px; border-bottom: 2px solid #009688; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 12px; }
            th { background-color: #009688; color: white; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; background-color: #f0fdfa; border-top: 2px solid #009688; }
          </style>
        </head>
        <body>
          <h2>Customer Ledger Summary Report</h2>
          <div class="meta">
            Shop: <strong>${activeShop?.name || 'Demo ERP'}</strong> | 
            Generated: <strong>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong> |
            Records: <strong>${metrics.activeCount} customers</strong>
          </div>
          ${tableHtml}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast('Generated printable PDF ledger preview!', 'success');
  };

  const handleExportReportCSV = async () => {
    if (!filteredLedgerData.length) {
      showToast('No ledger records to export.', 'error');
      return;
    }
    
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Customer Ledger Summary');

      const columns = [
        { label: 'Customer Name', key: 'name', width: 22 },
        { label: 'Contact Number', key: 'contact', width: 16 },
        { label: 'Address', key: 'address', width: 25 },
        { label: 'Opening Balance (BDT)', key: 'opening', width: 20 },
        { label: 'Total Sales (BDT)', key: 'sales', width: 18 },
        { label: 'Total Payments (BDT)', key: 'paid', width: 20 },
        { label: 'Current Balance (BDT)', key: 'balance', width: 20 },
        { label: 'Status', key: 'status', width: 12 }
      ];

      worksheet.columns = columns.map(c => ({ header: c.label, key: c.key, width: c.width }));

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF00796B' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      filteredLedgerData.forEach(row => {
        const balance = row.summary?.closingBalance || 0;
        const status = balance > 0 ? 'Due' : balance < 0 ? 'Advance' : 'Clear';
        worksheet.addRow({
          name: row.customer?.name || 'N/A',
          contact: row.customer?.contact || 'N/A',
          address: row.customer?.address || 'N/A',
          opening: row.summary?.openingBalance || 0,
          sales: row.summary?.totalSales || 0,
          paid: row.summary?.totalPaid || 0,
          balance: balance,
          status: status
        });
      });

      // Add summary row
      const totalRow = worksheet.addRow({
        name: 'Consolidated Total',
        contact: '-',
        address: '-',
        opening: 0,
        sales: metrics.totalSales,
        paid: metrics.totalPayments,
        balance: metrics.totalOutstanding,
        status: '-'
      });
      totalRow.font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Customer_Ledger_Summary_${new Date().toISOString().split('T')[0]}.xlsx`);

      showToast('Customer Ledger Summary exported successfully!', 'success');
    } catch (err) {
      console.error('Excel export error:', err);
      showToast('Failed to export Excel report', 'error');
    }
  };

  // Print individual customer statement history
  const handlePrintStatement = () => {
    if (!selectedLedger || !processedTransactions.length) return;

    let statementRowsHtml = '';
    processedTransactions.forEach(tx => {
      statementRowsHtml += `
        <tr>
          <td>${formatDate(tx.date)}</td>
          <td><strong>${tx.reference || 'N/A'}</strong></td>
          <td>${tx.type || 'Sale'}</td>
          <td class="text-right">৳${formatCurrency(tx.debit)}</td>
          <td class="text-right">৳${formatCurrency(tx.credit)}</td>
          <td class="text-right" style="font-weight: 600;">৳${formatCurrency(tx.runningBalance)}</td>
        </tr>
      `;
    });

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Customer Ledger Statement - ${selectedLedger.customer?.name}</title>
          <style>
            body { font-family: 'Outfit', 'Segoe UI', Arial, sans-serif; padding: 25px; color: #1e293b; }
            h2 { color: #009688; margin-bottom: 5px; font-weight: 700; }
            .sub-title { color: #64748b; font-size: 14px; margin-top: 0; margin-bottom: 20px; }
            .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-bottom: 25px; font-size: 13px; }
            .meta-box grid { display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 12px; }
            th { background-color: #009688; color: white; font-weight: 600; text-transform: uppercase; font-size: 11px; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <h2>Customer Ledger Statement</h2>
          <div class="sub-title">Shop: ${activeShop?.name || 'Demo ERP'}</div>
          
          <div class="meta-box">
            <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 5px;">
              ${selectedLedger.customer?.name}
            </div>
            <div>Phone: <strong>${selectedLedger.customer?.contact || 'N/A'}</strong></div>
            <div>Address: <strong>${selectedLedger.customer?.address || 'N/A'}</strong></div>
            <hr style="margin: 10px 0; border: none; border-top: 1px solid #cbd5e1;" />
            <div style="display: flex; gap: 40px; margin-top: 5px;">
              <div>Opening Balance: <strong>৳${formatCurrency(selectedLedger.summary?.openingBalance)}</strong></div>
              <div>Total Sales: <strong>৳${formatCurrency(selectedLedger.summary?.totalSales)}</strong></div>
              <div>Total Paid: <strong>৳${formatCurrency(selectedLedger.summary?.totalPaid)}</strong></div>
              <div style="color: #009688; font-weight: bold;">Closing Balance: <strong>৳${formatCurrency(selectedLedger.summary?.closingBalance)}</strong></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Type</th>
                <th class="text-right">Debit (Sales)</th>
                <th class="text-right">Credit (Payments)</th>
                <th class="text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              ${statementRowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast('Customer statement printed successfully!', 'success');
  };

  return (
    <Box sx={{
      py: { xs: 1, sm: 2 },
      backgroundColor: '#F8FAFC',
      fontFamily: '"Outfit", sans-serif'
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
        {/* Title and Top Panel */}
        {/* 4 Elegant Outfit Themed Teal Metrics Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {/* Total Balance Outstanding */}
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{
                border: '1px solid #eaeef3',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #009688 0%, #00796b 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 500, fontSize: '0.9rem', opacity: 0.9 }}>
                      Outstanding Dues
                    </Typography>
                    <BalanceIcon sx={{ opacity: 0.8, fontSize: '1.6rem' }} />
                  </Box>
                  <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '1.6rem' }}>
                    ৳{formatCurrency(metrics.totalOutstanding)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Sales Volume */}
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{
                border: '1px solid #eaeef3',
                borderRadius: '12px',
                background: 'white',
                color: '#1e293b'
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 500, fontSize: '0.9rem', color: '#64748b' }}>
                      Total Sales Volume
                    </Typography>
                    <SalesIcon sx={{ color: '#0284c7', fontSize: '1.6rem' }} />
                  </Box>
                  <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '1.6rem', color: '#0f172a' }}>
                    ৳{formatCurrency(metrics.totalSales)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Payments Collected */}
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{
                border: '1px solid #eaeef3',
                borderRadius: '12px',
                background: 'white',
                color: '#1e293b'
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 500, fontSize: '0.9rem', color: '#64748b' }}>
                      Payments Received
                    </Typography>
                    <PaymentIcon sx={{ color: '#10b981', fontSize: '1.6rem' }} />
                  </Box>
                  <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '1.6rem', color: '#0f172a' }}>
                    ৳{formatCurrency(metrics.totalPayments)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Active Customers Count */}
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{
                border: '1px solid #eaeef3',
                borderRadius: '12px',
                background: 'white',
                color: '#1e293b'
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 500, fontSize: '0.9rem', color: '#64748b' }}>
                      Active Customers
                    </Typography>
                    <PeopleIcon sx={{ color: '#6366f1', fontSize: '1.6rem' }} />
                  </Box>
                  <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '1.6rem', color: '#0f172a' }}>
                    {metrics.activeCount} Accounts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Advanced Filters Panel */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid #eaeef3',
              borderRadius: '12px',
              backgroundColor: 'white'
            }}
          >
            <Grid container spacing={2} alignItems="center">
              {/* Local Text Search */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Customer"
                  placeholder="Name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Grid>

              {/* Start Date */}
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Grid>

              {/* End Date */}
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Grid>

              {/* Customer Selector */}
              <Grid item xs={12} sm={6} md={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Customer Account</InputLabel>
                  <Select
                    name="customerId"
                    value={filters.customerId}
                    label="Customer Account"
                    onChange={handleFilterChange}
                    sx={{ borderRadius: '8px' }}
                  >
                    <MenuItem value="">All Customers</MenuItem>
                    {customers.map((cust) => (
                      <MenuItem key={cust._id} value={cust._id}>
                        {cust.contactName} ({cust.contactNumber})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Generate and Reset Buttons */}
              <Grid item xs={12} sm={6} md={2.5} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button 
                  variant="contained" 
                  onClick={handleGenerateReport}
                  disabled={isLoading}
                  fullWidth
                  sx={{
                    height: '40px',
                    backgroundColor: '#009688',
                    textTransform: 'none',
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 600,
                    borderRadius: '8px',
                    '&:hover': {
                      backgroundColor: '#00796b'
                    }
                  }}
                >
                  {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Generate'}
                </Button>
                <IconButton 
                  onClick={handleResetFilters}
                  sx={{
                    height: '40px',
                    width: '40px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#64748b',
                    '&:hover': {
                      backgroundColor: '#f1f5f9'
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
                <Tooltip title="Download PDF Report">
                  <IconButton 
                    onClick={handlePrintReport}
                    sx={{
                      height: '40px',
                      width: '40px',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: '#fef2f2'
                      }
                    }}
                  >
                    <PdfIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export Excel Report">
                  <IconButton 
                    onClick={handleExportReportCSV}
                    sx={{
                      height: '40px',
                      width: '40px',
                      border: '1px solid #10b981',
                      color: '#10b981',
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: '#ecfdf5'
                      }
                    }}
                  >
                    <ExcelIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Ledger Table Display */}
        <Grid item xs={12}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: '8px', mb: 2 }}>
              Error loading customer ledger data: {error.message}
            </Alert>
          )}

          {isLoading ? (
            <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px solid #eaeef3', borderRadius: '12px' }}>
              <CircularProgress color="primary" sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ color: '#64748b' }}>Loading customer transaction ledgers...</Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eaeef3', borderRadius: '12px', overflow: 'hidden' }}>
              <Table size="medium">
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Customer Profile</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Opening Balance</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Total Sales</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Total Payments</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Current Balance</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLedgerData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#64748b' }}>
                        No customer ledger transactions found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLedgerData.map((row) => {
                      const balance = row.summary?.closingBalance || 0;
                      return (
                        <TableRow 
                          key={row.customer?._id || row.customer?.name}
                          sx={{ '&:hover': { backgroundColor: '#f8fafc' }, transition: 'background-color 0.2s' }}
                        >
                          <TableCell sx={{ py: 1.5 }}>
                            <Typography sx={{ color: '#0f172a', fontWeight: 600, fontSize: '0.9rem', fontFamily: '"Outfit", sans-serif' }}>
                              {row.customer?.name || 'N/A'}
                            </Typography>
                            {row.customer?.contact && (
                              <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                📞 {row.customer.contact}
                              </Typography>
                            )}
                            {row.customer?.address && (
                              <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                📍 {row.customer.address}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: '"Outfit", sans-serif', color: '#334155' }}>
                            ৳{formatCurrency(row.summary?.openingBalance)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: '"Outfit", sans-serif', color: '#334155' }}>
                            ৳{formatCurrency(row.summary?.totalSales)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: '"Outfit", sans-serif', color: '#10b981', fontWeight: 500 }}>
                            ৳{formatCurrency(row.summary?.totalPaid)}
                          </TableCell>
                          <TableCell align="right" sx={{ 
                            fontFamily: '"Outfit", sans-serif', 
                            fontWeight: 600,
                            color: balance > 0 ? '#EF4444' : balance < 0 ? '#10B981' : '#334155'
                          }}>
                            ৳{formatCurrency(balance)}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              size="small" 
                              label={balance > 0 ? 'Due' : balance < 0 ? 'Advance' : 'Clear'} 
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                border: 'none',
                                backgroundColor: balance > 0 ? '#FEE2E2' : balance < 0 ? '#D1FAE5' : '#F3F4F6',
                                color: balance > 0 ? '#991B1B' : balance < 0 ? '#065F46' : '#374151'
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<EyeIcon />}
                              onClick={() => handleOpenStatement(row)}
                              sx={{
                                borderColor: '#e2e8f0',
                                color: '#475569',
                                textTransform: 'none',
                                fontFamily: '"Outfit", sans-serif',
                                fontWeight: 500,
                                borderRadius: '6px',
                                '&:hover': {
                                  borderColor: '#009688',
                                  color: '#009688',
                                  backgroundColor: '#f0fdfa'
                                }
                              }}
                            >
                              Statement
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Grid>
      </Grid>

      {/* CUSTOMER DETAILED STATEMENT MODAL */}
      <Dialog
        open={statementOpen}
        onClose={() => setStatementOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          p: 2.5, 
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#F8FAFC'
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.2rem', fontFamily: '"Outfit", sans-serif' }}>
              Customer Transaction Statement
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Detailed ledger view of debits, credits, and running balance history.
            </Typography>
          </Box>
          <IconButton onClick={() => setStatementOpen(false)} size="small" sx={{ border: '1px solid #e2e8f0' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {selectedLedger && (
            <Box>
              {/* Customer summary panel inside statement */}
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2.5, 
                  mb: 3, 
                  borderRadius: '10px', 
                  backgroundColor: '#fafafa',
                  borderColor: '#e2e8f0'
                }}
              >
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                      Customer Contact Info
                    </Typography>
                    <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
                      {selectedLedger.customer?.name}
                    </Typography>
                    <Typography sx={{ color: '#334155', fontSize: '0.85rem', mt: 0.5 }}>
                      Phone: <strong>{selectedLedger.customer?.contact || 'N/A'}</strong>
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                      Address: {selectedLedger.customer?.address || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', mb: 1 }}>
                      Account Ledger Summary
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <Box sx={{ borderLeft: '3px solid #cbd5e1', pl: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Opening Balance</Typography>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>
                            ৳{formatCurrency(selectedLedger.summary?.openingBalance)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ borderLeft: '3px solid #0284c7', pl: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Total Sales</Typography>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>
                            ৳{formatCurrency(selectedLedger.summary?.totalSales)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ borderLeft: '3px solid #10b981', pl: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Total Paid</Typography>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#10b981' }}>
                            ৳{formatCurrency(selectedLedger.summary?.totalPaid)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ borderLeft: '3px solid #009688', pl: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Closing Balance</Typography>
                          <Typography sx={{ 
                            fontWeight: 700, 
                            fontSize: '0.95rem', 
                            color: selectedLedger.summary?.closingBalance > 0 ? '#EF4444' : '#10b981'
                          }}>
                            ৳{formatCurrency(selectedLedger.summary?.closingBalance)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Paper>

              {/* Transactions Ledger Table */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1e293b' }}>
                Ledger Transaction History
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '10px', overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, py: 1.2 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Reference / Invoice #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Debit (Sales)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Credit (Payments)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Running Balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {processedTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#64748b' }}>
                          No individual ledger transactions logged for this account.
                        </TableCell>
                      </TableRow>
                    ) : (
                      processedTransactions.map((tx, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ py: 1 }}>{formatDate(tx.date)}</TableCell>
                          <TableCell>
                            {tx.id ? (
                              <Typography 
                                onClick={() => handleViewInvoice(tx.id, tx.sourceType)}
                                sx={{ 
                                  color: '#009688', 
                                  fontWeight: 600, 
                                  fontSize: '0.85rem', 
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  display: 'inline-block',
                                  '&:hover': { color: '#00796b' }
                                }}
                              >
                                {tx.reference || 'N/A'}
                              </Typography>
                            ) : (
                              <Typography sx={{ fontSize: '0.85rem', color: '#475569' }}>
                                {tx.reference || 'N/A'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={tx.type || 'Sale'} 
                              size="small" 
                              sx={{ 
                                height: '20px', 
                                fontSize: '0.7rem', 
                                fontWeight: 500,
                                backgroundColor: '#f1f5f9',
                                color: '#475569'
                              }} 
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: '"Outfit", sans-serif', color: '#0f172a' }}>
                            {tx.debit > 0 ? `৳${formatCurrency(tx.debit)}` : '-'}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: '"Outfit", sans-serif', color: '#10b981', fontWeight: 500 }}>
                            {tx.credit > 0 ? `৳${formatCurrency(tx.credit)}` : '-'}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 600, color: tx.runningBalance > 0 ? '#EF4444' : '#1e293b' }}>
                            ৳{formatCurrency(tx.runningBalance)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, backgroundColor: '#F8FAFC', borderTop: '1px solid #e2e8f0', gap: 1.5 }}>
          <Button 
            variant="outlined" 
            startIcon={<ExcelIcon />}
            onClick={handleExportStatementCSV}
            disabled={!processedTransactions.length}
            sx={{
              borderColor: '#64748b',
              color: '#475569',
              textTransform: 'none',
              borderRadius: '8px',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#475569',
                backgroundColor: '#f1f5f9'
              }
            }}
          >
            Export CSV
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<PdfIcon />}
            onClick={handlePrintStatement}
            disabled={!processedTransactions.length}
            sx={{
              borderColor: '#009688',
              color: '#009688',
              textTransform: 'none',
              borderRadius: '8px',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#00796b',
                backgroundColor: '#e0f2f1'
              }
            }}
          >
            Print Statement
          </Button>
          <Button 
            variant="contained" 
            color="inherit" 
            onClick={() => setStatementOpen(false)}
            sx={{
              backgroundColor: '#eaeef3',
              color: '#475569',
              textTransform: 'none',
              borderRadius: '8px',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#cbd5e1'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sale/Invoice detailed Modal viewer */}
      <SaleInvoiceModal 
        open={invoiceOpen} 
        onClose={() => setInvoiceOpen(false)} 
        saleId={selectedSaleId} 
        sourceType={selectedSourceType} 
      />

      {/* Notification Toast */}
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
          sx={{ borderRadius: '8px', fontFamily: '"Outfit", sans-serif', fontWeight: 500 }}
        >
          {toastMessage}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default CustomerLedger;