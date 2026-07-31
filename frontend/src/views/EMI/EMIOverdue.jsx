import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button, Chip,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, IconButton, MenuItem, Divider,
  InputAdornment, Avatar, Tooltip, LinearProgress,
  Skeleton, TablePagination
} from '@mui/material';
import {
  Warning as WarningIcon, Message as MessageIcon,
  CheckCircle as CheckCircleIcon, Visibility as ViewIcon,
  PictureAsPdf as PdfIcon, AssignmentReturn as RepossessIcon,
  Search as SearchIcon, Refresh, TrendingDown, AccessTime,
  MonetizationOn as CashIcon,
  CreditCard as CardIcon,
  PhoneAndroid as MfsIcon,
  AccountBalance as BankIcon
} from '@mui/icons-material';
import axios from 'axios';
import ExportButtons from '../../components/ExportButtons';

const API_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5001/api';

const severityColor = (days) => days > 30 ? 'error' : days > 15 ? 'warning' : 'info';

const METHOD_ICONS = {
  cash: <CashIcon sx={{ fontSize: 16 }} />,
  card: <CardIcon sx={{ fontSize: 16 }} />,
  bkash: <MfsIcon sx={{ fontSize: 16 }} />,
  nagad: <MfsIcon sx={{ fontSize: 16 }} />,
  cheque: <BankIcon sx={{ fontSize: 16 }} />
};

const METHOD_COLORS = {
  cash: '#10B981',
  card: '#8B5CF6',
  bkash: '#D12C69',
  nagad: '#F97316',
  cheque: '#3B82F6'
};

const METHOD_LABELS = {
  cash: 'Cash',
  card: 'Card',
  bkash: 'bKash',
  nagad: 'Nagad',
  cheque: 'Cheque'
};

const PAYMENT_METHODS = ['cash', 'card', 'bkash', 'nagad', 'cheque'];

const EMIOverdue = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overdueData, setOverdueData] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstalment, setSelectedInstalment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [collectionData, setCollectionData] = useState({ collectedAmount: '', lateFee: '', paymentMethod: 'cash', notes: '', transactionId: '' });
  const [repossessionOpen, setRepossessionOpen] = useState(false);
  const [repossessionInvoice, setRepossessionInvoice] = useState(null);
  const [repossessionData, setRepossessionData] = useState({ productId: '', quantity: 1, notes: '' });

  useEffect(() => { fetchOverdueData(); }, []);

  const fetchOverdueData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('🔄 Fetching overdue EMI data from:', `${API_URL}/emi/collections/installments?filter=overdue&limit=1000`);
      const response = await axios.get(`${API_URL}/emi/collections/installments?filter=overdue&limit=1000`, { headers: { Authorization: `Bearer ${token}` } });
      console.log('✅ EMI API Response:', response.data);
      const data = response.data.data || [];
      setOverdueData(data);
      setError(null);
      
      if (data.length === 0) {
        console.log('⚠️  No overdue data found. Response was:', response.data);
      }
    } catch (err) {
      console.error('❌ Error loading overdue data:', err);
      setError(`Failed to load overdue EMI data: ${err.response?.data?.message || err.message}`);
    } finally { setLoading(false); }
  };

  const handleCollectPayment = (instalment) => {
    setSelectedInstalment(instalment);
    setCollectionData({ collectedAmount: Math.round(instalment.amount - (instalment.paidAmount || 0)).toString(), lateFee: Math.round(instalment.recommendedLateFee || 0).toString(), paymentMethod: 'cash', notes: '', transactionId: '' });
    setDialogOpen(true);
  };

  const handleSubmitCollection = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/emi/collections`, {
        emiInvoice: selectedInstalment.invoice, invoiceNumber: selectedInstalment.invoiceNumber,
        customer: selectedInstalment.customer?._id || selectedInstalment.customer,
        customerName: selectedInstalment.customerName, customerPhone: selectedInstalment.customerPhone,
        instalmentNumber: selectedInstalment.instalmentNumber, dueDate: selectedInstalment.dueDate,
        scheduledAmount: selectedInstalment.amount,
        collectedAmount: parseFloat(collectionData.collectedAmount) + parseFloat(collectionData.lateFee || 0),
        lateFee: parseFloat(collectionData.lateFee || 0), paymentMethod: collectionData.paymentMethod,
        transactionId: collectionData.transactionId, notes: collectionData.notes
      }, { headers: { Authorization: `Bearer ${token}` } });
      setDialogOpen(false);
      fetchOverdueData();
      navigate('/dashboard/emi/collections-list');
    } catch (err) { alert('Failed to record payment. Please try again.'); }
  };

  const sendReminder = (customer) => {
    const msg = `Dear ${customer.customerName}, your EMI payment of ৳${customer.amount} is ${customer.daysOverdue} days overdue. Please pay at your earliest convenience. - Smart Plaza BD`;
    window.open(`https://wa.me/${customer.customerPhone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const downloadLegalNotice = async (invoiceId, invoiceNumber) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/emi/invoices/${invoiceId}/legal-notice`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `legal-notice-${invoiceNumber}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch { alert('Failed to download legal notice PDF.'); }
  };

  const handleOpenRepossession = async (instalment) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/emi/invoices/${instalment.invoice}`, { headers: { Authorization: `Bearer ${token}` } });
      const invoice = response.data.data;
      setRepossessionInvoice(invoice);
      setRepossessionData({ productId: invoice.products?.[0]?.product?._id || '', quantity: 1, notes: '' });
      setRepossessionOpen(true);
    } catch { alert('Failed to load invoice for repossession.'); }
  };

  const handleSubmitRepossession = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/emi/invoices/${repossessionInvoice._id}/repossess`,
        { productId: repossessionData.productId, quantity: parseInt(repossessionData.quantity), notes: repossessionData.notes },
        { headers: { Authorization: `Bearer ${token}` } });
      setRepossessionOpen(false); fetchOverdueData();
    } catch (err) { alert(err.response?.data?.message || 'Failed to submit repossession.'); }
  };

  const filteredData = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return overdueData.filter(i =>
      (i.invoiceNumber?.toLowerCase().includes(t)) ||
      (i.customerName?.toLowerCase().includes(t)) ||
      (i.customerPhone?.toLowerCase().includes(t))
    );
  }, [overdueData, searchTerm]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedData = useMemo(() => {
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const totalAmountOverdue = overdueData.reduce((s, i) => s + (i.amount - (i.paidAmount || 0)), 0);
  const avgDays = overdueData.length > 0 ? Math.round(overdueData.reduce((s, i) => s + i.daysOverdue, 0) / overdueData.length) : 0;

  const columns = [
    { label: 'Invoice #', accessor: (r) => r.invoiceNumber || '—' },
    { label: 'Customer', accessor: (r) => r.customerName || 'Unknown' },
    { label: 'Contact', accessor: (r) => r.customerPhone || '—' },
    { label: 'Due Date', accessor: (r) => r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—' },
    { label: 'Amount Due', accessor: (r) => `৳${r.amount - (r.paidAmount || 0)}` },
    { label: 'Late Fee', accessor: (r) => `৳${r.recommendedLateFee || 0}` },
    { label: 'Days Overdue', accessor: (r) => `${r.daysOverdue} days` },
  ];

  if (error) return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchOverdueData} startIcon={<Refresh />}>Retry</Button>}>{error}</Alert>
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 }, maxWidth: 1400, mx: 'auto' }}>

      {/* Header */}
      <Box sx={{ mb: 3, p: { xs: 2, sm: 3 }, borderRadius: 3, background: 'linear-gradient(135deg,#7f1d1d 0%,#b91c1c 50%,#dc2626 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, position: 'relative' }}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.7, letterSpacing: 2, fontSize: '0.7rem' }}>EMI MODULE — OVERDUE</Typography>
            <Typography variant="h5" fontWeight={700} sx={{ fontFamily: '"Outfit", sans-serif' }}>Overdue EMI Collections</Typography>
            <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>Track defaults, issue legal notices & process repossessions</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <ExportButtons data={filteredData} columns={columns} filename="overdue_emi" title="Overdue EMI Report" />
            <Tooltip title="Refresh"><IconButton onClick={fetchOverdueData} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}><Refresh /></IconButton></Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        {[
          { label: 'Total Overdue Cases', value: overdueData.length, icon: <WarningIcon />, color: '#b91c1c', bg: '#fef2f2' },
          { label: 'Total Amount Overdue', value: `৳${totalAmountOverdue.toLocaleString()}`, icon: <TrendingDown />, color: '#d97706', bg: '#fffbeb' },
          { label: 'Avg. Days Overdue', value: `${avgDays} days`, icon: <AccessTime />, color: '#1a73e8', bg: '#eff6ff' },
        ].map((s) => (
          <Grid item xs={12} sm={4} key={s.label}>
            <Card sx={{ borderRadius: 3, border: `1px solid ${s.bg}`, boxShadow: 'none', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: s.bg, width: 48, height: 48 }}>{React.cloneElement(s.icon, { sx: { color: s.color, fontSize: 24 } })}</Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.67rem' }}>{s.label}</Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color: s.color, fontFamily: '"Outfit",sans-serif', lineHeight: 1.1 }}>{s.value}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search */}
      <Box sx={{ mb: 2 }}>
        <TextField placeholder="Search invoice, customer or phone…" variant="outlined" size="small"
          value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
          sx={{ width: { xs: '100%', sm: 320 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
        />
      </Box>

      {/* Table */}
      <Card sx={{ borderRadius: 3, border: '1px solid #edf0f4', overflow: 'hidden' }}>
        <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#fef2f2', fontWeight: 700, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 } }}>
                <TableCell>Invoice #</TableCell><TableCell>Customer</TableCell><TableCell>Contact</TableCell>
                <TableCell>Due Date</TableCell><TableCell>Amount Due</TableCell><TableCell>Late Fee</TableCell>
                <TableCell>Days Overdue</TableCell><TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [1, 2, 3, 4, 5].map((item) => (
                  <TableRow key={item} sx={{ '& td': { py: 1.2 } }}>
                    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Skeleton variant="circular" width={28} height={28} />
                        <Box sx={{ flexGrow: 1 }}><Skeleton variant="text" width="60%" /><Skeleton variant="text" width="40%" /></Box>
                      </Box>
                    </TableCell>
                    <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="30%" /></TableCell>
                    <TableCell><Skeleton variant="rectangular" width={40} height={22} sx={{ borderRadius: 1 }} /></TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Skeleton variant="circular" width={24} height={24} />
                        <Skeleton variant="circular" width={24} height={24} />
                        <Skeleton variant="circular" width={24} height={24} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedData.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  {searchTerm ? 'No results found.' : '🎉 No overdue payments! Excellent collection performance.'}
                </TableCell></TableRow>
              ) : paginatedData.map((item) => (
                <TableRow key={`${item.invoice}-${item.instalmentNumber}`} hover sx={{ '& td': { py: 1.2 } }}>
                  <TableCell><Typography variant="body2" fontWeight={700} color="primary">{item.invoiceNumber}</Typography></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: '#fef2f2', fontSize: '0.75rem', color: '#b91c1c' }}>{(item.customerName || 'U')[0]}</Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{item.customerName}</Typography>
                        {item.customerAddress && <Typography variant="caption" color="text.secondary">{item.customerAddress}</Typography>}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2">{item.customerPhone}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{new Date(item.dueDate).toLocaleDateString()}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={700} color="error.main">৳{(item.amount - (item.paidAmount || 0)).toLocaleString()}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600} color="warning.main">৳{(item.recommendedLateFee || 0).toLocaleString()}</Typography></TableCell>
                  <TableCell>
                    <Chip label={`${item.daysOverdue}d`} color={severityColor(item.daysOverdue)} size="small" sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="WhatsApp Reminder"><IconButton size="small" onClick={() => sendReminder(item)} color="primary" sx={{ bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}><MessageIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                      <Tooltip title="Collect Payment"><IconButton size="small" onClick={() => handleCollectPayment(item)} color="success" sx={{ bgcolor: '#f0fdf4', '&:hover': { bgcolor: '#dcfce7' } }}><CheckCircleIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                      <Tooltip title="Legal Notice PDF"><IconButton size="small" onClick={() => downloadLegalNotice(item.invoice, item.invoiceNumber)} color="warning" sx={{ bgcolor: '#fffbeb', '&:hover': { bgcolor: '#fef3c7' } }}><PdfIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                      <Tooltip title="Repossess Product"><IconButton size="small" onClick={() => handleOpenRepossession(item)} color="error" sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}><RepossessIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                      <Tooltip title="View Invoice"><IconButton size="small" onClick={() => navigate(`/dashboard/emi/invoice/${item.invoice}`)} sx={{ bgcolor: '#f8fafc', '&:hover': { bgcolor: '#f1f5f9' } }}><ViewIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Mobile Cards */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, p: 1.5 }}>
          {loading ? (
            [1, 2, 3].map((item) => (
              <Paper key={item} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, borderLeft: '4px solid #eaeef3' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 1 }} />
                </Box>
                <Divider sx={{ mb: 1.5 }} />
                <Skeleton variant="text" width="80%" height={16} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="60%" height={16} sx={{ mb: 1.5 }} />
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton variant="circular" width={24} height={24} />
                </Box>
              </Paper>
            ))
          ) : paginatedData.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>No overdue payments found.</Typography>
          ) : paginatedData.map((item) => (
            <Paper key={`${item.invoice}-${item.instalmentNumber}`} elevation={0} sx={{ p: 2, border: '1px solid #fecaca', borderRadius: 2, borderLeft: '4px solid #dc2626' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={700} color="primary">{item.invoiceNumber}</Typography>
                <Chip label={`${item.daysOverdue}d overdue`} color={severityColor(item.daysOverdue)} size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
              </Box>
              <Divider sx={{ mb: 1.5 }} />
              <Grid container spacing={1} sx={{ mb: 1.5 }}>
                <Grid item xs={12}><Typography variant="caption" color="text.secondary">Customer</Typography><Typography variant="body2" fontWeight={600}>{item.customerName}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Amount Due</Typography><Typography variant="body2" fontWeight={700} color="error.main">৳{(item.amount - (item.paidAmount || 0)).toLocaleString()}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Late Fee</Typography><Typography variant="body2" fontWeight={600} color="warning.main">৳{(item.recommendedLateFee || 0).toLocaleString()}</Typography></Grid>
                <Grid item xs={12}><Typography variant="caption" color="text.secondary">Phone: {item.customerPhone}</Typography></Grid>
              </Grid>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <IconButton size="small" onClick={() => sendReminder(item)} color="primary" sx={{ bgcolor: '#eff6ff' }}><MessageIcon sx={{ fontSize: 16 }} /></IconButton>
                <IconButton size="small" onClick={() => handleCollectPayment(item)} color="success" sx={{ bgcolor: '#f0fdf4' }}><CheckCircleIcon sx={{ fontSize: 16 }} /></IconButton>
                <IconButton size="small" onClick={() => downloadLegalNotice(item.invoice, item.invoiceNumber)} color="warning" sx={{ bgcolor: '#fffbeb' }}><PdfIcon sx={{ fontSize: 16 }} /></IconButton>
                <IconButton size="small" onClick={() => handleOpenRepossession(item)} color="error" sx={{ bgcolor: '#fef2f2' }}><RepossessIcon sx={{ fontSize: 16 }} /></IconButton>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Pagination */}
        {!loading && filteredData.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ borderTop: '1px solid #edf0f4' }}
          />
        )}
      </Card>

      {/* Collect Payment Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Record Overdue Payment</DialogTitle>
        <DialogContent dividers>
          {selectedInstalment && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">INVOICE</Typography><Typography fontWeight={700}>{selectedInstalment.invoiceNumber}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">CUSTOMER</Typography><Typography fontWeight={700}>{selectedInstalment.customerName}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">INSTALMENT #</Typography><Typography fontWeight={700}>#{selectedInstalment.instalmentNumber}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">OVERDUE</Typography><Typography fontWeight={700} color="error.main">{selectedInstalment.daysOverdue} days</Typography></Grid>
              </Grid>
              <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>Recommended late fee: <strong>৳{selectedInstalment.recommendedLateFee}</strong> (1% per month overdue cumulative)</Alert>
              <TextField fullWidth label="Principal Amount" value={collectionData.collectedAmount} onChange={(e) => setCollectionData({ ...collectionData, collectedAmount: e.target.value })} type="number" size="small" margin="dense" required />
              <TextField fullWidth label="Late Fee Applied" value={collectionData.lateFee} onChange={(e) => setCollectionData({ ...collectionData, lateFee: e.target.value })} type="number" size="small" margin="dense" />
              {/* Payment Method Selector */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1.5, mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Payment Method
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {PAYMENT_METHODS.map(m => (
                    <Box
                      key={m}
                      onClick={() => setCollectionData(prev => ({ ...prev, paymentMethod: m }))}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 0.5,
                        cursor: 'pointer',
                        px: 1, py: 0.6, borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                        border: `1.5px solid ${collectionData.paymentMethod === m ? METHOD_COLORS[m] : '#E2E8F0'}`,
                        backgroundColor: collectionData.paymentMethod === m ? METHOD_COLORS[m] + '18' : 'transparent',
                        color: collectionData.paymentMethod === m ? METHOD_COLORS[m] : '#64748B',
                        transition: 'all .15s',
                        '&:hover': { borderColor: METHOD_COLORS[m], color: METHOD_COLORS[m] }
                      }}
                    >
                      {METHOD_ICONS[m]}
                      <span>{METHOD_LABELS[m]}</span>
                    </Box>
                  ))}
                </Box>
              </Box>
              <TextField fullWidth label="Transaction ID (optional)" value={collectionData.transactionId} onChange={(e) => setCollectionData({ ...collectionData, transactionId: e.target.value })} size="small" margin="dense" />
              <TextField fullWidth multiline rows={2} label="Notes" value={collectionData.notes} onChange={(e) => setCollectionData({ ...collectionData, notes: e.target.value })} size="small" margin="dense" />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleSubmitCollection} variant="contained" color="success" disabled={!collectionData.collectedAmount} sx={{ borderRadius: 2, fontWeight: 700 }}>Record Payment</Button>
        </DialogActions>
      </Dialog>

      {/* Repossession Dialog */}
      <Dialog open={repossessionOpen} onClose={() => setRepossessionOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main', pb: 1 }}>Repossess Retail Asset</DialogTitle>
        <DialogContent dividers>
          {repossessionInvoice && (
            <Box sx={{ pt: 1 }}>
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                Initiating repossession on <strong>{repossessionInvoice.invoiceNumber}</strong>. This logs a Sale Return and routes stock back to inventory.
              </Alert>
              <TextField fullWidth select label="Select Product" value={repossessionData.productId} onChange={(e) => setRepossessionData({ ...repossessionData, productId: e.target.value })} size="small" margin="dense" required>
                {repossessionInvoice.products?.map((item) => <MenuItem key={item.product?._id} value={item.product?._id}>{item.product?.name} (Qty: {item.quantity})</MenuItem>)}
              </TextField>
              <TextField fullWidth label="Repossession Quantity" value={repossessionData.quantity} onChange={(e) => setRepossessionData({ ...repossessionData, quantity: e.target.value })} type="number" size="small" margin="dense" required inputProps={{ min: 1 }} />
              <TextField fullWidth multiline rows={3} label="Asset Condition / Notes" placeholder="Serial numbers, IMEIs, visual condition…" value={repossessionData.notes} onChange={(e) => setRepossessionData({ ...repossessionData, notes: e.target.value })} size="small" margin="dense" />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setRepossessionOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleSubmitRepossession} variant="contained" color="error" disabled={!repossessionData.productId || !repossessionData.quantity} sx={{ borderRadius: 2, fontWeight: 700 }}>Confirm Repossession</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EMIOverdue;
