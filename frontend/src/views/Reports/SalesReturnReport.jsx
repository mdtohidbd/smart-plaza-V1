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
  MenuItem,
  Chip,
  Skeleton,
  TablePagination,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  AssignmentReturn as ReturnIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  ErrorOutline as ErrorIcon,
  FilterAlt as FilterIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import useShopRefresh from '../../hooks/useShopRefresh';

import ExportButtons from '../../components/ExportButtons';

// ── helpers ──────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('en-BD', { minimumFractionDigits: 2 }).format(n || 0);

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-BD', {
    year: 'numeric', month: 'short', day: '2-digit'
  });
};

const toInputDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const today = new Date();
const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

// ── reason badge color ────────────────────────────────────────────────────
const reasonColor = (r = '') => {
  if (!r) return 'default';
  const l = r.toLowerCase();
  if (l.includes('damage')) return 'error';
  if (l.includes('defect')) return 'warning';
  if (l.includes('wrong')) return 'info';
  if (l.includes('dissatisf')) return 'secondary';
  return 'default';
};

// ── stat card ─────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, accent, loading }) => (
  <Card
    elevation={0}
    sx={{
      border: `1.5px solid ${accent}22`,
      borderRadius: '12px',
      background: `linear-gradient(135deg, #fff 60%, ${accent}11)`,
      p: 0,
      height: '100%'
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Box
          sx={{
            width: 40, height: 40, borderRadius: '10px',
            background: `${accent}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {React.cloneElement(icon, { sx: { color: accent, fontSize: 20 } })}
        </Box>
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontFamily: '"Outfit", sans-serif' }}>
          {label}
        </Typography>
      </Box>
      {loading
        ? <Skeleton width="60%" height={32} />
        : (
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontFamily: '"Outfit", sans-serif', lineHeight: 1 }}>
            {value}
          </Typography>
        )}
    </CardContent>
  </Card>
);

// ═══════════════════════════════════════════════════════════════════════════
const SalesReturnReport = () => {
  const navigate = useNavigate();
  const { activeShop } = useAuth();

  // ── default: current month ──────────────────────────────────────────────
  const [filters, setFilters] = useState({
    startDate: toInputDate(firstOfMonth),
    endDate: toInputDate(today),
    customerId: '',
    productId: '',
    returnReason: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // ── export columns ────────────────────────────────────────────────────
  const exportColumns = [
    { label: 'Return Date', accessor: (r) => fmtDate(r.returnDate || r.date) },
    { label: 'Order #', accessor: (r) => r.orderNumber || r.invoiceNumber || '—' },
    { label: 'Customer', accessor: (r) => r.customer?.name || '—' },
    { label: 'Product', accessor: (r) => r.product?.name || '—' },
    { label: 'Qty', accessor: (r) => r.quantity || 0 },
    { label: 'Rate', accessor: (r) => `৳${fmt(r.unitPrice)}` },
    { label: 'Total', accessor: (r) => `৳${fmt(r.totalValue)}` },
    { label: 'Reason', accessor: (r) => r.returnReason || '—' }
  ];

  // ── fetch customers ───────────────────────────────────────────────────
  const { data: customersResp } = useQuery('customers-for-return', async () => {
    const res = await api.get('/api/contacts/customers');
    return res.data;
  }, { staleTime: 300000 });
  const customers = customersResp?.data || [];

  // ── fetch products ────────────────────────────────────────────────────
  const { data: productsResp } = useQuery('products-for-return', async () => {
    const res = await api.get('/api/products');
    return res.data;
  }, { staleTime: 300000 });
  const products = productsResp?.data || [];

  // ── fetch report data (auto-loads with default dates) ─────────────────
  const { data: returnData, isLoading, error, refetch } = useQuery(
    ['salesReturnReport', filters, activeShop?._id],
    async () => {
      const params = { ...filters };
      const res = await api.get('/api/reports/sales-return-report', { params });
      return res.data;
    },
    { staleTime: 30000, keepPreviousData: true }
  );

  useShopRefresh(refetch);

  // ── handlers ──────────────────────────────────────────────────────────
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(0);
  };

  const handleReset = () => {
    setFilters({
      startDate: toInputDate(firstOfMonth),
      endDate: toInputDate(today),
      customerId: '',
      productId: '',
      returnReason: ''
    });
    setSearchQuery('');
    setPage(0);
  };

  // ── client-side search ────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    const rows = returnData?.data || [];
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(item =>
      (item.orderNumber || '').toLowerCase().includes(q) ||
      (item.invoiceNumber || '').toLowerCase().includes(q) ||
      (item.customer?.name || '').toLowerCase().includes(q) ||
      (item.product?.name || '').toLowerCase().includes(q) ||
      (item.returnReason || '').toLowerCase().includes(q)
    );
  }, [returnData?.data, searchQuery]);

  // ── paginated rows ─────────────────────────────────────────────────────
  const paginatedRows = useMemo(() =>
    filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredData, page, rowsPerPage]
  );

  // ── summary ───────────────────────────────────────────────────────────
  const summary = useMemo(() =>
    filteredData.reduce(
      (acc, item) => ({
        count: acc.count + 1,
        qty: acc.qty + (item.quantity || 0),
        value: acc.value + (item.totalValue || 0)
      }),
      { count: 0, qty: 0, value: 0 }
    ), [filteredData]
  );

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <Box sx={{ py: { xs: 1, sm: 2 }, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* ── Page Header ── */}
      <Paper
        elevation={0}
        sx={{ p: 2, mb: 2, border: '1px solid #eaeef3', borderRadius: '8px' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined" size="small"
            onClick={() => navigate('/dashboard/reports/all-sales-reports')}
            startIcon={<ArrowBackIcon />}
            sx={{
              borderColor: '#cbd5e1', color: '#475569',
              textTransform: 'none', fontFamily: '"Outfit", sans-serif',
              fontWeight: 500, borderRadius: '6px',
              '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' }
            }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 700, fontFamily: '"Outfit", sans-serif', fontSize: '1.15rem', mb: 0.25 }}>
              Sales Return Report
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem' }}>
              All sales return transactions — quantities, values &amp; reasons
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* ── Stat Cards ── */}
      
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
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<ReturnIcon />} label="Total Returns"
            value={isLoading ? '…' : summary.count}
            accent="#ef4444" loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<InventoryIcon />} label="Total Qty Returned"
            value={isLoading ? '…' : summary.qty}
            accent="#f59e0b" loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<MoneyIcon />} label="Total Return Value"
            value={isLoading ? '…' : `৳${fmt(summary.value)}`}
            accent="#10b981" loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* ── Filter Card ── */}
      <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', mb: 2 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterIcon sx={{ color: '#64748b', fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569', fontFamily: '"Outfit", sans-serif' }}>
              Filters
            </Typography>
          </Box>

          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth size="small" label="Start Date"
                name="startDate" type="date"
                value={filters.startDate}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth size="small" label="End Date"
                name="endDate" type="date"
                value={filters.endDate}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth size="small" label="Customer"
                name="customerId" value={filters.customerId}
                onChange={handleFilterChange} select
              >
                <MenuItem value="">All Customers</MenuItem>
                {customers.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.contactName} {c.contactNumber ? `(${c.contactNumber})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth size="small" label="Product"
                name="productId" value={filters.productId}
                onChange={handleFilterChange} select
              >
                <MenuItem value="">All Products</MenuItem>
                {products.map((p) => (
                  <MenuItem key={p._id} value={p._id}>
                    {p.name}{p.model ? ` (${p.model})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth size="small" label="Return Reason"
                name="returnReason" value={filters.returnReason}
                onChange={handleFilterChange} select
              >
                <MenuItem value="">All Reasons</MenuItem>
                <MenuItem value="Damaged">Damaged</MenuItem>
                <MenuItem value="Defective">Defective</MenuItem>
                <MenuItem value="Wrong Item">Wrong Item</MenuItem>
                <MenuItem value="Customer Dissatisfaction">Customer Dissatisfaction</MenuItem>
                <MenuItem value="Sales Return">Sales Return</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained" size="small"
              onClick={() => refetch()}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : <FilterIcon />}
              sx={{
                textTransform: 'none', fontFamily: '"Outfit", sans-serif',
                fontWeight: 600, borderRadius: '7px',
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)'
              }}
            >
              {isLoading ? 'Loading…' : 'Generate Report'}
            </Button>
            <Button
              variant="outlined" size="small"
              startIcon={<RefreshIcon />}
              onClick={handleReset}
              sx={{
                textTransform: 'none', fontFamily: '"Outfit", sans-serif',
                borderRadius: '7px', borderColor: '#cbd5e1', color: '#475569'
              }}
            >
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ── Error ── */}
      {error && (
        <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2, borderRadius: '8px' }}>
          ডাটা লোড করতে সমস্যা হয়েছে: {error.message}
        </Alert>
      )}

      {/* ── Table Card ── */}
      <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '10px' }}>
        <CardContent sx={{ pb: '16px !important' }}>

          {/* search + export row */}
          <Grid container spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth size="small"
                placeholder="Search by order #, customer, product, reason…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'flex-start', md: 'flex-end' }, flexWrap: 'wrap' }}>
              <ExportButtons
                data={filteredData}
                columns={exportColumns}
                filename="sales_returns"
                title="Sales Return Report"
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          {/* summary badge */}
          {!isLoading && (
            <Typography variant="body2" sx={{ mb: 1.5, color: '#475569', fontFamily: '"Outfit", sans-serif' }}>
              Showing <strong>{filteredData.length}</strong> return{filteredData.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
            </Typography>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <Box>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={44} sx={{ mb: 0.5, borderRadius: '4px' }} />
              ))}
            </Box>
          )}

          {/* Empty state */}
          {!isLoading && !error && filteredData.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <ReturnIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#94a3b8', fontFamily: '"Outfit", sans-serif', fontWeight: 600 }}>
                কোনো রিটার্ন রেকর্ড পাওয়া যায়নি
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', fontFamily: '"Outfit", sans-serif', mt: 0.5 }}>
                ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন
              </Typography>
            </Box>
          )}

          {/* Table */}
          {!isLoading && filteredData.length > 0 && (
            <>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontFamily: '"Outfit", sans-serif', fontSize: '0.78rem' }}>Return Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontFamily: '"Outfit", sans-serif', fontSize: '0.78rem' }}>Order #</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontFamily: '"Outfit", sans-serif', fontSize: '0.78rem' }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontFamily: '"Outfit", sans-serif', fontSize: '0.78rem' }}>Product</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontFamily: '"Outfit", sans-serif', fontSize: '0.78rem' }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontFamily: '"Outfit", sans-serif', fontSize: '0.78rem' }}>Rate</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontFamily: '"Outfit", sans-serif', fontSize: '0.78rem' }}>Total</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontFamily: '"Outfit", sans-serif', fontSize: '0.78rem' }}>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedRows.map((item, idx) => (
                      <TableRow
                        key={item._id || idx}
                        sx={{
                          backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fbfd',
                          '&:hover': { backgroundColor: '#f0f9ff' }
                        }}
                      >
                        <TableCell sx={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.82rem', color: '#374151' }}>
                          {fmtDate(item.returnDate || item.date)}
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.82rem', fontWeight: 600, color: '#0284c7' }}>
                          {item.orderNumber || item.invoiceNumber || '—'}
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.82rem', color: '#374151' }}>
                          {item.customer?.name || '—'}
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.82rem', color: '#374151' }}>
                          {item.product?.name || '—'}
                          {item.product?.model && (
                            <Typography component="span" sx={{ fontSize: '0.7rem', color: '#94a3b8', ml: 0.5 }}>
                              [{item.product.model}]
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.82rem', fontWeight: 600 }}>
                          {item.quantity || 0}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.82rem', color: '#374151' }}>
                          ৳{fmt(item.unitPrice)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.82rem', fontWeight: 700, color: '#dc2626' }}>
                          ৳{fmt(item.totalValue)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.returnReason || '—'}
                            size="small"
                            color={reasonColor(item.returnReason)}
                            variant="outlined"
                            sx={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.72rem', fontWeight: 600 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Summary row */}
                    <TableRow sx={{ backgroundColor: '#fef2f2', borderTop: '2px solid #fca5a5' }}>
                      <TableCell colSpan={4} sx={{ fontWeight: 700, color: '#991b1b', fontFamily: '"Outfit", sans-serif' }}>
                        Grand Total
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#991b1b', fontFamily: '"Outfit", sans-serif' }}>
                        {summary.qty}
                      </TableCell>
                      <TableCell />
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#991b1b', fontFamily: '"Outfit", sans-serif' }}>
                        ৳{fmt(summary.value)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={filteredData.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                sx={{ fontFamily: '"Outfit", sans-serif', mt: 1 }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SalesReturnReport;