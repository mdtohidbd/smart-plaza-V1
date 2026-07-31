import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Snackbar,
  Alert,
  Pagination,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Button,
  Tooltip,
  Skeleton
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  ContentCopy as ContentCopyIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  Payments as PaymentsIcon
} from '@mui/icons-material';
import api from '../../utils/api';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import ExportButtons from '../../components/ExportButtons';

const EMICollectionList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [copiedId, setCopiedId] = useState(null);

  // Filter States
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const LIMIT = 10;

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showMessage = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchCollections = async () => {
    try {
      setLoading(true);
      
      let url = `/api/emi/collections?page=${page}&limit=${LIMIT}`;
      if (searchQuery) url += `&invoiceNumber=${searchQuery}`; // Backend expects exact invoiceNumber or filter
      if (paymentMethod) url += `&status=${paymentMethod}`; // Backend getAllEMICollections uses status query key for filtering
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await api.get(url);
      if (res.data.success) {
        setCollections(res.data.data);
        setTotalRows(res.data.count || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      showMessage('Failed to load collection records', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== searchInputValue) {
        setSearchQuery(searchInputValue);
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInputValue, searchQuery]);

  useEffect(() => {
    fetchCollections();
    // eslint-disable-next-line
  }, [page, searchQuery, paymentMethod, startDate, endDate]);

  const handleClearFilters = () => {
    setSearchInputValue('');
    setSearchQuery('');
    setPaymentMethod('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getMethodChipColor = (method) => {
    switch (method?.toLowerCase()) {
      case 'cash':
        return { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' };
      case 'card':
        return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
      case 'bkash':
        return { bg: '#FDF2F8', color: '#DB2777', border: '#FBCFE8' };
      case 'nagad':
        return { bg: '#FFF7ED', color: '#EA580C', border: '#FFEDD5' };
      case 'cheque':
        return { bg: '#F5F5F7', color: '#4E4E52', border: '#E4E4E7' };
      default:
        return { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' };
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
      
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.4rem', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
            EMI Collections History
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
            Showing {totalRows} recorded collection{totalRows !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchCollections}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              borderColor: '#E2E8F0',
              color: '#64748B',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.825rem',
              fontWeight: 600,
              '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' }
            }}
          >
            Refresh
          </Button>
          <ExportButtons 
            data={collections || []}
            columns={[
              { label: "Receipt No", accessor: (row) => row.receiptNumber || "—" },
              { label: "Date", accessor: (row) => row.collectionDate ? format(new Date(row.collectionDate), 'dd MMM yyyy, hh:mm a') : '—' },
              { label: "Invoice No", accessor: (row) => row.invoiceNumber || "—" },
              { label: "Customer Name", accessor: (row) => row.customerName || "—" },
              { label: "Customer Phone", accessor: (row) => row.customerPhone || "—" },
              { label: "Instalment", accessor: (row) => row.instalmentNumber ? `#${row.instalmentNumber}` : "—" },
              { label: "Collected Amount", accessor: (row) => `৳${row.collectedAmount || 0}` },
              { label: "Late Fee", accessor: (row) => `৳${row.lateFee || 0}` },
              { label: "Method", accessor: (row) => row.paymentMethod ? row.paymentMethod.toUpperCase() : "—" },
              { label: "Collected By", accessor: (row) => row.collectedBy?.name || "System" }
            ]}
            filename="emi_collections"
            title="EMI Collections Report"
          />
        </Box>
      </Box>

      {/* ── Filter Bar ── */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Invoice No..."
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94A3B8', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#F8FAFC',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  '& fieldset': { borderColor: '#E2E8F0' },
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <Select
                value={paymentMethod}
                onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }}
                displayEmpty
                sx={{
                  bgcolor: '#F8FAFC',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                }}
              >
                <MenuItem value="">All Payment Methods</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="bkash">bKash</MenuItem>
                <MenuItem value="nagad">Nagad</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={2.5}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Collection From"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                sx: { borderRadius: '10px', bgcolor: '#F8FAFC', fontSize: '0.85rem' }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={2.5}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Collection To"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                sx: { borderRadius: '10px', bgcolor: '#F8FAFC', fontSize: '0.85rem' }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            {(searchQuery || paymentMethod || startDate || endDate) && (
              <Button
                variant="text"
                color="error"
                onClick={handleClearFilters}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' }}
              >
                Clear Filters
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* ── Table / Records ── */}
      <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1000 }}>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow sx={{ '& .MuiTableCell-head': { fontWeight: 700, fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap' } }}>
                <TableCell>Receipt / Date</TableCell>
                <TableCell>Invoice No</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="center">Instalment</TableCell>
                <TableCell align="right">Collected Amount</TableCell>
                <TableCell align="right">Late Fee</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Collected By</TableCell>
                <TableCell align="center" sx={{ minWidth: '80px' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [1, 2, 3, 4, 5].map((item) => (
                  <TableRow key={item}>
                    <TableCell sx={{ py: 1.5 }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="50%" /></TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Skeleton variant="text" width="70%" />
                      <Skeleton variant="text" width="50%" />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5 }}><Skeleton variant="rectangular" width={40} height={20} sx={{ mx: 'auto', borderRadius: 1 }} /></TableCell>
                    <TableCell align="right" sx={{ py: 1.5 }}><Skeleton variant="text" width="50%" sx={{ ml: 'auto' }} /></TableCell>
                    <TableCell align="right" sx={{ py: 1.5 }}><Skeleton variant="text" width="30%" sx={{ ml: 'auto' }} /></TableCell>
                    <TableCell sx={{ py: 1.5 }}><Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 1 }} /></TableCell>
                    <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="60%" /></TableCell>
                    <TableCell align="center" sx={{ py: 1.5 }}><Skeleton variant="circular" width={28} height={28} sx={{ mx: 'auto' }} /></TableCell>
                  </TableRow>
                ))
              ) : collections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                      No recorded EMI collections found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            {!loading && (() => {
              const sortedCollections = searchQuery.trim() ? [...collections].sort((a, b) => {
                const term = searchQuery.toLowerCase();
                const aStarts = (a.invoiceNumber || '').toLowerCase().startsWith(term) ||
                                (a.customer?.contactName || '').toLowerCase().startsWith(term) ||
                                (a.customer?.phone || '').startsWith(term);
                const bStarts = (b.invoiceNumber || '').toLowerCase().startsWith(term) ||
                                (b.customer?.contactName || '').toLowerCase().startsWith(term) ||
                                (b.customer?.phone || '').startsWith(term);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return 0;
              }) : collections;
              
              return sortedCollections.map((coll, idx) => {
                const methodStyle = getMethodChipColor(coll.paymentMethod);
                return (
                  <TableRow key={coll._id} sx={{ '&:hover': { bgcolor: '#F8FAFC' }, '& .MuiTableCell-root': { whiteSpace: 'nowrap' } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="#0F172A">
                        {coll.receiptNumber || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {coll.collectionDate ? format(new Date(coll.collectionDate), 'dd MMM yyyy, hh:mm a') : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="#1D5F99"
                        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        onClick={() => navigate(`/dashboard/emi/invoice/${coll.emiInvoice?._id || coll.emiInvoice}`)}
                      >
                        {coll.invoiceNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="#0F172A">
                        {coll.customerName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {coll.customerPhone}
                        </Typography>
                        <Tooltip title={copiedId === coll._id ? 'Copied!' : 'Copy'}>
                          <IconButton size="small" onClick={() => handleCopy(coll.customerPhone, coll._id)} sx={{ p: 0.25, color: copiedId === coll._id ? '#10B981' : '#94A3B8' }}>
                            {copiedId === coll._id ? <CheckIcon sx={{ fontSize: 11 }} /> : <ContentCopyIcon sx={{ fontSize: 11 }} />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={`#${coll.instalmentNumber}`} size="small" sx={{ fontWeight: 700, bgcolor: '#EEF2FF', color: '#4F46E5' }} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} color="#059669">
                        ৳{coll.collectedAmount?.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color={coll.lateFee > 0 ? 'error.main' : 'text.secondary'} fontWeight={coll.lateFee > 0 ? 600 : 400}>
                        ৳{coll.lateFee ? coll.lateFee.toLocaleString() : '0'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={coll.paymentMethod ? coll.paymentMethod.toUpperCase() : '—'}
                        size="small"
                        sx={{
                          bgcolor: methodStyle.bg,
                          color: methodStyle.color,
                          border: `1px solid ${methodStyle.border}`,
                          fontWeight: 700,
                          fontSize: '0.7rem'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500} color="#334155">
                        {coll.collectedBy?.name || 'System'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View EMI details">
                        <IconButton size="small" onClick={() => navigate(`/dashboard/emi/invoice/${coll.emiInvoice?._id || coll.emiInvoice}`)} sx={{ color: '#0F766E' }}>
                          <VisibilityIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              });
            })()}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Pagination ── */}
      {totalPages > 1 && !loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            shape="rounded"
            color="primary"
            sx={{ '& .MuiPaginationItem-root': { fontFamily: 'Inter, sans-serif', fontWeight: 600 } }}
          />
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar(p => ({ ...p, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(p => ({ ...p, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EMICollectionList;
