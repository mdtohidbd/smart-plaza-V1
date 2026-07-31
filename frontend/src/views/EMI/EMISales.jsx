import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  CircularProgress, Alert, Chip, TextField, InputAdornment,
  TablePagination, IconButton, Tooltip, Button, Skeleton
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { calcEMI, fmt } from '../../utils/emiCalculations';
import ExportButtons from '../../components/ExportButtons';

const API_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5001/api';

const EMISales = () => {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [error, setError] = useState(null);
  
  // Pagination & Search
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSales();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [page, rowsPerPage, search, startDate, endDate]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/emi/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search,
          startDate,
          endDate
        }
      });
      setSales(response.data.data || []);
      setTotalRows(response.data.total || response.data.count || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching EMI sales:', err);
      setError(err.response?.data?.message || 'Failed to load EMI sales');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'primary';
      case 'Completed': return 'success';
      case 'Defaulted': return 'error';
      case 'Cancelled': return 'default';
      default: return 'default';
    }
  };

  const exportColumns = [
    { label: "Date", accessor: (row) => new Date(row.invoiceDate || row.createdAt).toLocaleDateString() },
    { label: "Invoice No", accessor: (row) => row.invoiceNumber || "—" },
    { label: "Customer Name", accessor: (row) => row.customerName || row.customer?.name || "—" },
    { label: "Customer Phone", accessor: (row) => row.customerPhone || row.customer?.phone || "—" },
    { label: "Total Payment", accessor: (row) => fmt(calcEMI(row).totalPayment) },
    { label: "Down Payment", accessor: (row) => fmt(calcEMI(row).downPayment) },
    { label: "Total Payable", accessor: (row) => fmt(calcEMI(row).totalPayable) },
    { label: "EMI Paid", accessor: (row) => fmt(calcEMI(row).emiPaid) },
    { label: "Total Outstanding", accessor: (row) => fmt(calcEMI(row).totalOutstanding) },
  ];

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ 
        mb: 3, p: { xs: 2, sm: 3 }, borderRadius: 3, 
        background: 'linear-gradient(135deg,#134e4a 0%,#0f766e 60%,#0d9488 100%)', 
        color: '#fff', position: 'relative', overflow: 'hidden' 
      }}>
        <Box sx={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, position: 'relative' }}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.7, letterSpacing: 2, fontSize: '0.7rem' }}>
              EMI MODULE — SALES
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ fontFamily: '"Outfit", sans-serif' }}>
              All EMI Sales
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>
              Track all EMI invoices, due dates, and progress.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchSales} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ 
              '& button': { 
                bgcolor: 'rgba(255,255,255,0.9)', 
                color: '#0f766e',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                '&:hover': { bgcolor: '#ffffff', transform: 'translateY(-1px)' }
              } 
            }}>
              <ExportButtons 
                data={sales || []}
                columns={exportColumns}
                filename="emi_sales"
                title="EMI Sales Report"
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Controls */}
      <Card sx={{ borderRadius: 3, mb: 3, border: '1px solid #edf0f4' }}>
        <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search by Invoice #, Customer Name or Phone..."
            value={search}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, maxWidth: { xs: '100%', sm: '400px' } }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94A3B8' }}/></InputAdornment>
            }}
          />
          <TextField
            size="small"
            type="date"
            label="From Date"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
          />
          <TextField
            size="small"
            type="date"
            label="To Date"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
          />
          {(startDate || endDate || search) && (
            <Button 
              variant="text" 
              color="error" 
              size="small"
              onClick={() => { setStartDate(''); setEndDate(''); setSearch(''); setPage(0); }}
            >
              Clear
            </Button>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* Table */}
      <Card sx={{ borderRadius: 3, border: '1px solid #edf0f4', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc', color: '#475569' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc', color: '#475569' }}>Invoice #</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc', color: '#475569' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc', color: '#475569' }} align="right">Total Payment</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc', color: '#475569' }} align="right">Down Payment</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc', color: '#475569' }} align="right">Total Payable</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc', color: '#475569' }} align="right">EMI Paid</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc', color: '#475569' }} align="right">Total Outstanding</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc', color: '#475569' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && sales.length === 0 ? (
                [1, 2, 3, 4, 5].map((item) => (
                  <TableRow key={item}>
                    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width="50%" /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width="50%" /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width="50%" /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width="50%" /></TableCell>
                    <TableCell align="right"><Skeleton variant="text" width="50%" /></TableCell>
                    <TableCell align="center">
                      <Skeleton variant="circular" width={28} height={28} sx={{ mx: 'auto' }} />
                    </TableCell>
                  </TableRow>
                ))
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#64748b' }}>
                    No EMI sales found.
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                    <TableRow key={sale._id} hover>
                    <TableCell sx={{ color: '#1e293b' }}>
                      {new Date(sale.invoiceDate || sale.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#0d9488' }}>
                      {sale.invoiceNumber}
                    </TableCell>
                    <TableCell sx={{ color: '#1e293b' }}>
                      {sale.customerName || sale.customer?.name}
                      <Typography variant="caption" display="block" color="text.secondary">
                        {sale.customerPhone || sale.customer?.phone}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#1e293b' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {fmt(calcEMI(sale).totalPayment)}
                        </Typography>
                        {calcEMI(sale).interestRate > 0 && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                            ({calcEMI(sale).interestRate}% interest)
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#1e293b' }}>
                      {fmt(calcEMI(sale).downPayment)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#1e293b', fontWeight: 600 }}>
                      {fmt(calcEMI(sale).totalPayable)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#10b981', fontWeight: 500 }}>
                      {fmt(calcEMI(sale).emiPaid)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#ef4444', fontWeight: 600 }}>
                      {fmt(calcEMI(sale).totalOutstanding)}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/dashboard/emi/invoice/${sale._id}`)}
                          sx={{ color: '#3b82f6', bgcolor: 'rgba(59,130,246,0.1)', mr: 1, '&:hover': { bgcolor: 'rgba(59,130,246,0.2)' } }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalRows}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{ borderTop: '1px solid #edf0f4' }}
        />
      </Card>
    </Box>
  );
};

export default EMISales;
