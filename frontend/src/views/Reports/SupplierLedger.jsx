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
  TrendingUp as PurchaseIcon,
  Payment as PaymentIcon,
  People as PeopleIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import useShopRefresh from '../../hooks/useShopRefresh';

import PurchaseInvoiceDetailsModal from '../../components/PurchaseInvoiceDetailsModal';

const SupplierLedger = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlSupplierId = searchParams.get('supplierId') || '';
  const { activeShop } = useAuth();

  // Dialog States
  const [statementOpen, setStatementOpen] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState(null);

  // Invoice Modal States
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    supplierId: urlSupplierId,
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

  // Fetch all suppliers/suppliers for the dropdown filter
  const { data: suppliersResponse, refetch: refetchSuppliers } = useQuery(
    ['contacts-suppliers', activeShop?._id],
    async () => {
      const response = await api.get('/api/suppliers');
      return response.data?.data || [];
    },
    {
      enabled: true,
      staleTime: 60000
    }
  );
  const suppliers = suppliersResponse || [];

  // Fetch Supplier Ledger Data from backend
  const { data: ledgerResponse, isLoading, error, refetch } = useQuery(
    ['supplierLedger', filters, activeShop?._id],
    async () => {
      const params = { ...filters, shopId: activeShop?._id };
      const response = await api.get('/api/reports/supplier-ledger', { params });
      return response.data;
    },
    {
      enabled: true,
      staleTime: 5000
    }
  );

  // Automatically refresh data when shop changes
  useShopRefresh(() => {
    refetchSuppliers();
    refetch();
  });

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
      supplierId: '',
      startDate: '',
      endDate: ''
    });
    setSearchQuery('');
    showToast('Filters reset successfully!', 'info');
  };

  // Local Supplier Text Search Filtering
  const suppliersList = ledgerResponse?.data?.suppliers || [];
  const filteredLedgerData = useMemo(() => {
    if (!searchQuery) return suppliersList;
    const query = searchQuery.toLowerCase().trim();
    return suppliersList.filter(row => 
      (row.supplier?.businessName && row.supplier.businessName.toLowerCase().includes(query)) ||
      (row.supplier?.contactNumber && row.supplier.contactNumber.includes(query))
    );
  }, [suppliersList, searchQuery]);

  // Compute live metrics on current filtered data
  const metrics = useMemo(() => {
    let totalOutstanding = 0;
    let totalPurchases = 0;
    let totalPayments = 0;
    const activeCount = filteredLedgerData.length;

    filteredLedgerData.forEach(row => {
      totalOutstanding += row.summary?.closingBalance || 0;
      totalPurchases += row.summary?.totalPurchase || 0;
      totalPayments += row.summary?.totalPaid || 0;
    });

    return {
      totalOutstanding,
      totalPurchases,
      totalPayments,
      activeCount
    };
  }, [filteredLedgerData]);

  // View Supplier Ledger Detailed Statement
  const handleOpenStatement = (row) => {
    setSelectedLedger(row);
    setStatementOpen(true);
  };

  // Launch Purchase Invoice details
  const handleViewInvoice = (purchaseId) => {
    setSelectedPurchaseId(purchaseId);
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

  // Running Ledger Transactions calculation for selected supplier statement
  const processedTransactions = useMemo(() => {
    if (!selectedLedger) return [];
    let runningBalance = selectedLedger.summary?.openingBalance || 0;
    
    // Sort transactions chronologically (ascending date) to calculate running balance correctly
    const txs = [...(selectedLedger.transactions || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return txs.map(tx => {
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

    const headers = ['Supplier Name', 'Contact Number', 'Address', 'Opening Balance', 'Total Purchases', 'Total Payments', 'Current Balance', 'Status'];
    const rows = filteredLedgerData.map(row => [
      row.supplier?.businessName || 'N/A',
      row.supplier?.contactNumber || 'N/A',
      row.supplier?.address || 'N/A',
      row.summary?.openingBalance || 0,
      row.summary?.totalPurchase || 0,
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
    link.setAttribute('download', `Supplier_Ledger_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Supplier Ledger exported successfully!', 'success');
  };

  // Client-Side detailed statement CSV export for a single supplier
  const handleExportStatementCSV = () => {
    if (!selectedLedger || !processedTransactions.length) return;
    
    const headers = ['Date', 'Reference / Purchase Invoice #', 'Type', 'Debit (Purchases)', 'Credit (Payments)', 'Running Balance'];
    const rows = processedTransactions.map(tx => [
      formatDate(tx.date),
      tx.reference || 'N/A',
      tx.type || 'Purchase',
      tx.debit || 0,
      tx.credit || 0,
      tx.runningBalance || 0
    ]);

    const csvContent = '\uFEFF' +
      [
        [`Supplier: ${selectedLedger.supplier?.businessName}`].join(','),
        [`Contact: ${selectedLedger.supplier?.contactNumber}`].join(','),
        [`Address: ${selectedLedger.supplier?.address || 'N/A'}`].join(','),
        [],
        headers.join(','),
        ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedLedger.supplier?.businessName}_Ledger_Statement.csv`);
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
            <th>Supplier Name</th>
            <th>Contact</th>
            <th class="text-right">Opening Balance</th>
            <th class="text-right">Total Purchases</th>
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
          <td><strong>${row.supplier?.businessName || 'N/A'}</strong></td>
          <td>${row.supplier?.contactNumber || 'N/A'}</td>
          <td class="text-right">৳${formatCurrency(row.summary?.openingBalance)}</td>
          <td class="text-right">৳${formatCurrency(row.summary?.totalPurchase)}</td>
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
          <td class="text-right">৳${formatCurrency(metrics.totalPurchases)}</td>
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
          <title>Supplier Ledger Summary Report</title>
          <style>
            body { font-family: 'Outfit', 'Segoe UI', Arial, sans-serif; padding: 25px; color: #1e293b; }
            h2 { color: #28A745; margin-bottom: 5px; font-weight: 700; }
            .meta { color: #64748b; font-size: 13px; margin-top: 0; margin-bottom: 25px; border-bottom: 2px solid #28A745; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 12px; }
            th { background-color: #28A745; color: white; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; background-color: #f0fdfa; border-top: 2px solid #28A745; }
          </style>
        </head>
        <body>
          <h2>Supplier Ledger Summary Report</h2>
          <div class="meta">
            Shop: <strong>${activeShop?.name || 'Smart Plaza'}</strong> | 
            Generated: <strong>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong> |
            Records: <strong>${metrics.activeCount} suppliers</strong>
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

  // Print individual supplier statement history
  const handlePrintStatement = () => {
    if (!selectedLedger || !processedTransactions.length) return;

    let statementRowsHtml = '';
    processedTransactions.forEach(tx => {
      statementRowsHtml += `
        <tr>
          <td>${formatDate(tx.date)}</td>
          <td><strong>${tx.reference || 'N/A'}</strong></td>
          <td>${tx.type || 'Purchase'}</td>
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
          <title>Supplier Ledger Statement - ${selectedLedger.supplier?.businessName}</title>
          <style>
            body { font-family: 'Outfit', 'Segoe UI', Arial, sans-serif; padding: 25px; color: #1e293b; }
            h2 { color: #28A745; margin-bottom: 5px; font-weight: 700; }
            .sub-title { color: #64748b; font-size: 14px; margin-top: 0; margin-bottom: 20px; }
            .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-bottom: 25px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 12px; }
            th { background-color: #28A745; color: white; font-weight: 600; text-transform: uppercase; font-size: 11px; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <h2>Supplier Ledger Statement</h2>
          <div class="sub-title">Shop: ${activeShop?.name || 'Smart Plaza'}</div>
          
          <div class="meta-box">
            <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 5px;">
              ${selectedLedger.supplier?.businessName}
            </div>
            <div>Phone: <strong>${selectedLedger.supplier?.contactNumber || 'N/A'}</strong></div>
            <div>Address: <strong>${selectedLedger.supplier?.address || 'N/A'}</strong></div>
            <hr style="margin: 10px 0; border: none; border-top: 1px solid #cbd5e1;" />
            <div style="display: flex; gap: 40px; margin-top: 5px;">
              <div>Opening Balance: <strong>৳${formatCurrency(selectedLedger.summary?.openingBalance)}</strong></div>
              <div>Total Purchases: <strong>৳${formatCurrency(selectedLedger.summary?.totalPurchase)}</strong></div>
              <div>Total Paid: <strong>৳${formatCurrency(selectedLedger.summary?.totalPaid)}</strong></div>
              <div style="color: #28A745; font-weight: bold;">Closing Balance: <strong>৳${formatCurrency(selectedLedger.summary?.closingBalance)}</strong></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Type</th>
                <th class="text-right">Debit (Purchases)</th>
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
    showToast('Supplier statement printed successfully!', 'success');
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
        {/* 4 Elegant Outfit Themed Green Metrics Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {/* Total Balance Outstanding */}
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{
                border: '1px solid #eaeef3',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #28A745 0%, #1e7e34 100%)',
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

            {/* Total Purchases Volume */}
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
                      Total Purchases Volume
                    </Typography>
                    <PurchaseIcon sx={{ color: '#0284c7', fontSize: '1.6rem' }} />
                  </Box>
                  <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '1.6rem', color: '#0f172a' }}>
                    ৳{formatCurrency(metrics.totalPurchases)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Payments Made */}
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
                      Payments Made
                    </Typography>
                    <PaymentIcon sx={{ color: '#10b981', fontSize: '1.6rem' }} />
                  </Box>
                  <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '1.6rem', color: '#0f172a' }}>
                    ৳{formatCurrency(metrics.totalPayments)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Active Suppliers Count */}
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
                      Active Suppliers
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
                  label="Search Supplier"
                  placeholder="Business name or phone..."
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

              {/* Supplier Selector */}
              <Grid item xs={12} sm={6} md={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Supplier Account</InputLabel>
                  <Select
                    name="supplierId"
                    value={filters.supplierId}
                    label="Supplier Account"
                    onChange={handleFilterChange}
                    sx={{ borderRadius: '8px' }}
                  >
                    <MenuItem value="">All Suppliers</MenuItem>
                    {suppliers.map((comp) => (
                      <MenuItem key={comp._id} value={comp._id}>
                        {comp.businessName} ({comp.contactNumber})
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
                    backgroundColor: '#28A745',
                    color: 'white',
                    textTransform: 'none',
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 600,
                    borderRadius: '8px',
                    '&:hover': {
                      backgroundColor: '#1e7e34'
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
                    onClick={handleExportCSV}
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
              Error loading supplier ledger data: {error.message}
            </Alert>
          )}

          {isLoading ? (
            <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px solid #eaeef3', borderRadius: '12px' }}>
              <CircularProgress color="success" sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ color: '#64748b' }}>Loading supplier transaction ledgers...</Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eaeef3', borderRadius: '12px', overflow: 'hidden' }}>
              <Table size="medium">
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Supplier Profile</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Opening Balance</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Total Purchases</TableCell>
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
                        No supplier ledger transactions found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLedgerData.map((row) => {
                      const balance = row.summary?.closingBalance || 0;
                      return (
                        <TableRow 
                          key={row.supplier?._id}
                          sx={{ 
                            '&:hover': { backgroundColor: '#f8fafc' },
                            '&:last-child td, &:last-child th': { border: 0 }
                          }}
                        >
                          <TableCell>
                            <Box>
                              <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                                {row.supplier?.businessName || 'N/A'}
                              </Typography>
                              <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                                Phone: {row.supplier?.contactNumber || 'N/A'}
                              </Typography>
                              {row.supplier?.address && (
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', mt: 0.25 }}>
                                  {row.supplier.address}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">৳{formatCurrency(row.summary?.openingBalance)}</TableCell>
                          <TableCell align="right">৳{formatCurrency(row.summary?.totalPurchase)}</TableCell>
                          <TableCell align="right" sx={{ color: '#10b981', fontWeight: 500 }}>
                            ৳{formatCurrency(row.summary?.totalPaid)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: balance > 0 ? '#ef4444' : balance < 0 ? '#10b981' : '#1e293b' }}>
                            ৳{formatCurrency(balance)}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={balance > 0 ? 'Due' : balance < 0 ? 'Advance' : 'Clear'}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: '22px',
                                backgroundColor: balance > 0 ? '#fee2e2' : balance < 0 ? '#d1fae5' : '#f3f4f6',
                                color: balance > 0 ? '#991b1b' : balance < 0 ? '#065f46' : '#374151'
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
                                borderColor: '#28A745',
                                color: '#28A745',
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                py: 0.5,
                                '&:hover': {
                                  borderColor: '#1e7e34',
                                  backgroundColor: '#eafaf1'
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

      {/* Supplier Ledger Statement Details Dialog */}
      <Dialog
        open={statementOpen}
        onClose={() => setStatementOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            fontFamily: '"Outfit", sans-serif',
            maxHeight: '90vh'
          }
        }}
      >
        {selectedLedger && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderBottom: '1px solid #f1f5f9',
              py: 2,
              px: 3 
            }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 700, fontSize: '1.2rem', fontFamily: '"Outfit", sans-serif' }}>
                  Supplier Statement Details
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem', fontFamily: '"Outfit", sans-serif' }}>
                  Detailed history of purchases and payments for {selectedLedger.supplier?.name}.
                </Typography>
              </Box>
              <IconButton onClick={() => setStatementOpen(false)} size="small" sx={{ color: '#94a3b8' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
              {/* Supplier Meta Details Box */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2.5, 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #eaeef3', 
                  borderRadius: '12px',
                  mb: 3
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={5}>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', tracking: '0.5px', mb: 0.5 }}>
                      Supplier Details
                    </Typography>
                    <Typography sx={{ color: '#0f172a', fontWeight: 700, fontSize: '1.1rem' }}>
                      {selectedLedger.supplier?.name}
                    </Typography>
                    <Typography sx={{ color: '#475569', fontSize: '0.85rem', mt: 0.5 }}>
                      Phone: <strong>{selectedLedger.supplier?.contactNumber || 'N/A'}</strong>
                    </Typography>
                    {selectedLedger.supplier?.address && (
                      <Typography sx={{ color: '#64748b', fontSize: '0.8rem', mt: 0.25 }}>
                        Address: {selectedLedger.supplier.address}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} md={7}>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', tracking: '0.5px', mb: 1 }}>
                      Account Ledger Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 1.5, backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                          <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>Opening Bal.</Typography>
                          <Typography sx={{ color: '#1e293b', fontWeight: 700, fontSize: '0.9rem', mt: 0.25 }}>
                            ৳{formatCurrency(selectedLedger.summary?.openingBalance)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 1.5, backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                          <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>Total Purchases</Typography>
                          <Typography sx={{ color: '#1e293b', fontWeight: 700, fontSize: '0.9rem', mt: 0.25 }}>
                            ৳{formatCurrency(selectedLedger.summary?.totalPurchase)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 1.5, backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                          <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>Total Paid</Typography>
                          <Typography sx={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem', mt: 0.25 }}>
                            ৳{formatCurrency(selectedLedger.summary?.totalPaid)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ 
                          p: 1.5, 
                          backgroundColor: selectedLedger.summary?.closingBalance > 0 ? '#fef2f2' : selectedLedger.summary?.closingBalance < 0 ? '#ecfdf5' : 'white', 
                          border: '1px solid',
                          borderColor: selectedLedger.summary?.closingBalance > 0 ? '#fee2e2' : selectedLedger.summary?.closingBalance < 0 ? '#d1fae5' : '#f1f5f9',
                          borderRadius: '8px' 
                        }}>
                          <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>Closing Bal.</Typography>
                          <Typography sx={{ 
                            fontWeight: 800, 
                            fontSize: '0.95rem', 
                            mt: 0.25,
                            color: selectedLedger.summary?.closingBalance > 0 ? '#ef4444' : selectedLedger.summary?.closingBalance < 0 ? '#10b981' : '#1e293b' 
                          }}>
                            ৳{formatCurrency(selectedLedger.summary?.closingBalance)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Paper>

              {/* Transactions Statement List */}
              <Typography sx={{ color: '#475569', fontWeight: 600, fontSize: '0.9rem', mb: 1.5 }}>
                Transaction Ledger Statement
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eaeef3', borderRadius: '12px' }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.2 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.2 }}>Reference / Invoice</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.2 }}>Type</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', py: 1.2 }}>Debit (Purchases)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', py: 1.2 }}>Credit (Payments)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', py: 1.2 }}>Running Balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {processedTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#64748b' }}>
                          No transactions posted to this ledger yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      processedTransactions.map((tx) => (
                        <TableRow key={tx.id || tx.reference} sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                          <TableCell sx={{ py: 1.2 }}>{formatDate(tx.date)}</TableCell>
                          <TableCell sx={{ py: 1.2 }}>
                            {tx.id ? (
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => handleViewInvoice(tx.id)}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  p: 0,
                                  minWidth: 0,
                                  color: '#28A745',
                                  fontSize: '0.85rem',
                                  textAlign: 'left',
                                  '&:hover': { textDecoration: 'underline', backgroundColor: 'transparent' }
                                }}
                              >
                                {tx.reference || 'N/A'}
                              </Button>
                            ) : (
                              <strong>{tx.reference || 'N/A'}</strong>
                            )}
                          </TableCell>
                          <TableCell sx={{ py: 1.2 }}>
                            <Chip 
                              label={tx.type || 'Purchase'} 
                              size="small" 
                              sx={{ 
                                fontSize: '0.7rem', 
                                height: '18px', 
                                backgroundColor: tx.type === 'Payment' ? '#e0f2f1' : '#f0fdf4',
                                color: tx.type === 'Payment' ? '#00796b' : '#1e7e34'
                              }} 
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1.2 }}>
                            {tx.debit > 0 ? `৳${formatCurrency(tx.debit)}` : '-'}
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1.2, color: '#10b981' }}>
                            {tx.credit > 0 ? `৳${formatCurrency(tx.credit)}` : '-'}
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1.2, fontWeight: 600 }}>
                            ৳{formatCurrency(tx.runningBalance)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, borderTop: '1px solid #f1f5f9', backgroundColor: '#f8fafc', display: 'flex', gap: 1.5 }}>
              <Button 
                variant="outlined" 
                startIcon={<PdfIcon />} 
                onClick={handlePrintStatement}
                sx={{ 
                  textTransform: 'none', 
                  borderColor: '#28A745', 
                  color: '#28A745', 
                  fontWeight: 600,
                  borderRadius: '8px',
                  '&:hover': { borderColor: '#1e7e34', backgroundColor: '#eafaf1' }
                }}
              >
                Print Statement
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<ExcelIcon />} 
                onClick={handleExportStatementCSV}
                sx={{ 
                  textTransform: 'none', 
                  borderColor: '#475569', 
                  color: '#475569', 
                  fontWeight: 600,
                  borderRadius: '8px',
                  '&:hover': { borderColor: '#1e293b', backgroundColor: '#f1f5f9' }
                }}
              >
                Export CSV
              </Button>
              <Box sx={{ flexGrow: 1 }} />
              <Button 
                variant="contained" 
                onClick={() => setStatementOpen(false)}
                sx={{ 
                  textTransform: 'none', 
                  backgroundColor: '#64748b', 
                  color: 'white', 
                  fontWeight: 600,
                  borderRadius: '8px',
                  '&:hover': { backgroundColor: '#475569' }
                }}
              >
                Close Statement
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Clickable Purchase Invoice Details Viewer Modal */}
      <PurchaseInvoiceDetailsModal
        open={invoiceOpen}
        onClose={() => {
          setSelectedPurchaseId(null);
          setInvoiceOpen(false);
        }}
        purchaseId={selectedPurchaseId}
      />

      {/* Success/Error Toast Notifications */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert onClose={handleCloseToast} severity={toastSeverity} sx={{ width: '100%', borderRadius: '8px', fontWeight: 500 }}>
          {toastMessage}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default SupplierLedger;