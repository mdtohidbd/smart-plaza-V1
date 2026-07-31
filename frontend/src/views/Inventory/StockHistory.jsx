import React, { useState, useMemo } from 'react';
import {
  Typography, Box, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress,
  Alert, Chip, TextField, Grid, Card, useTheme, useMediaQuery,
  MenuItem, Select, FormControl, InputLabel, InputAdornment, Button, Divider,
  TablePagination, Skeleton
} from '@mui/material';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import useShopRefresh from '../../hooks/useShopRefresh';
import ExportButtons from '../../components/ExportButtons';

const mapTransactionType = (type, quantity) => {
  if (type === 'Transfer In') return 'Transfer In';
  if (type === 'Transfer Out') return 'Transfer Out';
  
  const isNegative = quantity < 0 || ['Sale', 'Purchase Return', 'Damage', 'Free Product'].includes(type);
  return isNegative ? 'Stock Out' : 'Stock In';
};

const getTransactionTypeDetails = (mappedType) => {
  switch (mappedType) {
    case 'Stock In':
      return { label: 'Stock In', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
    case 'Stock Out':
      return { label: 'Stock Out', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
    case 'Transfer In':
      return { label: 'Transfer In', color: '#059669', bg: '#ecfdf5', border: '#d1fae5' };
    case 'Transfer Out':
      return { label: 'Transfer Out', color: '#ea580c', bg: '#fff7ed', border: '#ffedd5' };
    default:
      return { label: mappedType, color: '#64748b', bg: '#f9fafb', border: '#f3f4f6' };
  }
};

const StockHistory = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState(''); // For debouncing or explicit search
  const [typeFilter, setTypeFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const { data: responseData, isLoading, error, refetch } = useQuery(
    ['inventoryHistory', page, rowsPerPage, search, typeFilter],
    async () => {
      const response = await api.get('/api/inventory', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: search,
          type: typeFilter
        }
      });
      return response.data;
    },
    { refetchOnWindowFocus: false, keepPreviousData: true }
  );

  useShopRefresh(refetch);

  const historyData = responseData?.data || [];
  const totalCount = responseData?.total || 0;

  // Expand transactions into individual rows for each unit (quantity +/- 1)
  const expandedItems = [];
  (historyData || []).forEach(item => {
    const mappedType = mapTransactionType(item.type, item.quantity);
    const absQty = Math.abs(item.quantity);
    const singleQty = item.quantity < 0 ? -1 : 1;
    
    if (item.product?.trackSerials && item.serials && item.serials.length > 0) {
      // Map each serial number
      item.serials.forEach(serial => {
        expandedItems.push({
          ...item,
          mappedType,
          quantity: singleQty,
          serialNumber: serial
        });
      });
      // Pad remaining quantity if absQty is larger than populated serials
      if (absQty > item.serials.length) {
        const diff = absQty - item.serials.length;
        for (let i = 0; i < diff; i++) {
          expandedItems.push({
            ...item,
            mappedType,
            quantity: singleQty,
            serialNumber: '—'
          });
        }
      }
    } else if (absQty > 1) {
      // Split into single rows even if no serial numbers are recorded
      for (let i = 0; i < absQty; i++) {
        expandedItems.push({
          ...item,
          mappedType,
          quantity: singleQty,
          serialNumber: '—'
        });
      }
    } else {
      expandedItems.push({
        ...item,
        mappedType,
        serialNumber: item.serials?.[0] || '—'
      });
    }
  });

  // Sort filteredItems so startsWith matches come first
  const filteredItems = useMemo(() => {
    let result = [...expandedItems];
    
    // Filter by search
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(item => 
        (item.product?.name || '').toLowerCase().includes(term) ||
        (item.product?.model || '').toLowerCase().includes(term) ||
        (item.serialNumber || '').toLowerCase().includes(term) ||
        (item.note || '').toLowerCase().includes(term)
      );
    }
    
    // Filter by date range
    if (startDate || endDate) {
      result = result.filter(item => {
        const itemDateStr = item.date || item.createdAt;
        if (!itemDateStr) return false;
        
        const itemDate = new Date(itemDateStr);
        itemDate.setHours(0, 0, 0, 0);
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (itemDate < start) return false;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(0, 0, 0, 0);
          if (itemDate > end) return false;
        }
        
        return true;
      });
    }
    
    // Sort startsWith matches first
    if (search.trim()) {
      const term = search.toLowerCase();
      result.sort((a, b) => {
        const aStarts = (a.product?.name || '').toLowerCase().startsWith(term) ||
                        (a.product?.model || '').toLowerCase().startsWith(term) ||
                        (a.serialNumber || '').toLowerCase().startsWith(term);
        const bStarts = (b.product?.name || '').toLowerCase().startsWith(term) ||
                        (b.product?.model || '').toLowerCase().startsWith(term) ||
                        (b.serialNumber || '').toLowerCase().startsWith(term);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return 0;
      });
    }
    
    return result;
  }, [expandedItems, search, startDate, endDate]);

  const columns = [
    { label: 'SL', accessor: (row) => filteredItems.indexOf(row) + 1 },
    { label: 'Date', accessor: (row) => new Date(row.date || row.createdAt).toLocaleString() },
    { label: 'Product Name', accessor: (row) => row.product?.name || '—' },
    { label: 'Serial Number', accessor: (row) => row.serialNumber || '—' },
    { label: 'Type', accessor: (row) => row.mappedType || '—' },
    { label: 'Quantity', accessor: (row) => row.quantity },
    { label: 'Unit Price', accessor: (row) => `৳${row.unitPrice?.toLocaleString()}` },
    { label: 'Total Value', accessor: (row) => `৳${(Math.abs(row.quantity) * (row.unitPrice || 0)).toLocaleString()}` },
    { label: 'Note', accessor: (row) => row.note || '—' }
  ];

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      setSearch(searchInput);
      setPage(0);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSearchInput('');
    setTypeFilter('All');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatQuantity = (qty, mappedType) => {
    const isNegative = qty < 0 || mappedType === 'Stock Out' || mappedType === 'Transfer Out';
    const absoluteQty = Math.abs(qty);
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: isNegative ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
        {isNegative ? <TrendingDownIcon fontSize="small" /> : <TrendingUpIcon fontSize="small" />}
        <span>{isNegative ? '-' : '+'}{absoluteQty}</span>
      </Box>
    );
  };

  const transactionTypes = [
    'All',
    'Stock In',
    'Stock Out',
    'Transfer In',
    'Transfer Out'
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 } }}>
      {/* Filters section */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search product name, model, serial, note (Press Enter)..."
                value={searchInput}
                onChange={handleSearchChange}
                onKeyDown={handleSearchSubmit}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: "8px",
                    height: "40px",
                    fontSize: "13px",
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="type-filter-label">Transaction Type</InputLabel>
                <Select
                  labelId="type-filter-label"
                  id="type-filter"
                  value={typeFilter}
                  label="Transaction Type"
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(0);
                  }}
                  sx={{ borderRadius: '8px', height: '40px', fontSize: '13px' }}
                >
                {transactionTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              type="date"
              label="From Date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                sx: {
                  borderRadius: "8px",
                  height: "40px",
                  fontSize: "13px",
                },
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              type="date"
              label="To Date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                sx: {
                  borderRadius: "8px",
                  height: "40px",
                  fontSize: "13px",
                },
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={2} sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            {(startDate || endDate) && (
              <Button
                variant="text"
                color="error"
                onClick={() => { setStartDate(""); setEndDate(""); setPage(0); }}
                sx={{ textTransform: "none", fontSize: "12px", fontWeight: 600 }}
              >
                Clear Dates
              </Button>
            )}
            <Button
              variant="outlined"
              size="medium"
              startIcon={<RestartAltRoundedIcon />}
              onClick={handleResetFilters}
              sx={{ borderRadius: '8px', textTransform: 'none' }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Main content table */}
      <Paper
        elevation={0}
        sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}
      >
        <Box sx={{
          px: 2, py: 1.5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #f8fafc 0%, #fff 100%)',
          flexWrap: 'wrap',
          gap: 1.5
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryRoundedIcon sx={{ color: '#0284c7', fontSize: '1.2rem' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', fontFamily: '"Outfit", sans-serif' }}>
              Stock History
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <ExportButtons 
              data={filteredItems} 
              columns={columns} 
              filename="stock_history" 
              title="Stock History Report" 
            />
          </Box>
        </Box>

        {isMobile ? (
          <Box sx={{ p: 1.5 }}>
            {isLoading ? (
              [1, 2, 3].map((item) => (
                <Card key={item} sx={{ mb: 1.5, p: 1.5, borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Skeleton variant="text" width="60%" height={18} />
                    <Skeleton variant="rectangular" width={50} height={18} sx={{ borderRadius: 1 }} />
                  </Box>
                  <Skeleton variant="text" width="40%" height={14} sx={{ mb: 1.5 }} />
                  <Divider sx={{ borderStyle: 'dashed', mb: 1.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box><Skeleton variant="text" width={50} /><Skeleton variant="text" width={30} /></Box>
                    <Box sx={{ textAlign: 'right' }}><Skeleton variant="text" width={50} /><Skeleton variant="text" width={30} /></Box>
                  </Box>
                </Card>
              ))
            ) : filteredItems.length === 0 ? (
              <Alert severity="info" sx={{ fontSize: '0.8rem' }}>No history records found matching your filters.</Alert>
            ) : (
              filteredItems.map((row, index) => {
                const details = getTransactionTypeDetails(row.mappedType);
                return (
                  <Card key={`${row._id}-${row.serialNumber}-${index}`} sx={{ mb: 1.5, p: 1.5, borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {row.product?.name || '—'}
                        </Typography>
                        {row.serialNumber !== '—' && (
                          <Typography variant="caption" color="textSecondary" display="block">
                            SN: {row.serialNumber}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={details.label}
                        size="small"
                        sx={{
                          height: '20px', fontSize: '0.65rem', fontWeight: 600,
                          color: details.color, bgcolor: details.bg, border: `1px solid ${details.border}`
                        }}
                      />
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Qty Change</Typography>
                        {formatQuantity(row.quantity, row.mappedType)}
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">Unit Price</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ৳{row.unitPrice?.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">Total Value</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          ৳{(Math.abs(row.quantity) * (row.unitPrice || 0)).toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">Date</Typography>
                        <Typography variant="caption" sx={{ color: '#475569' }}>
                          {new Date(row.date || row.createdAt).toLocaleString()}
                        </Typography>
                      </Grid>
                      {row.note && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="textSecondary" display="block">Note</Typography>
                          <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.75rem', fontStyle: 'italic' }}>
                            {row.note}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Card>
                );
              })
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, py: 1.25 }}>SL</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.25 }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.25 }}>Product Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.25 }}>Serial Number</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.25 }}>Type</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, py: 1.25 }}>Qty Change</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, py: 1.25 }}>Unit Price</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, py: 1.25 }}>Total Value</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.25 }}>Note</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3, 4, 5].map((item) => (
                    <TableRow key={item}>
                      <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width={20} /></TableCell>
                      <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="80%" /></TableCell>
                      <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="40%" /></TableCell>
                      <TableCell sx={{ py: 1.5 }}><Skeleton variant="rectangular" width={60} height={18} sx={{ borderRadius: 1 }} /></TableCell>
                      <TableCell align="right" sx={{ py: 1.5 }}><Skeleton variant="text" width="40%" /></TableCell>
                      <TableCell align="right" sx={{ py: 1.5 }}><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell align="right" sx={{ py: 1.5 }}><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="70%" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                      <Alert severity="info" sx={{ display: 'inline-flex', fontSize: '0.8rem' }}>
                        No history records found matching your filters.
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((row, index) => {
                    const details = getTransactionTypeDetails(row.mappedType);
                    return (
                      <TableRow key={`${row._id}-${row.serialNumber}-${index}`} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ py: 1.25, fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                          {index + 1}
                        </TableCell>
                        <TableCell sx={{ py: 1.25, fontSize: '0.8rem', color: '#475569' }}>
                          {new Date(row.date || row.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ py: 1.25, fontWeight: 500, color: '#1e293b' }}>
                          {row.product?.name || '—'}
                        </TableCell>
                        <TableCell sx={{ py: 1.25, fontSize: '0.85rem', fontWeight: 600, color: row.serialNumber !== '—' ? '#0f766e' : '#64748b' }}>
                          {row.serialNumber}
                        </TableCell>
                        <TableCell sx={{ py: 1.25 }}>
                          <Chip
                            label={details.label}
                            size="small"
                            sx={{
                              height: '20px', fontSize: '0.7rem', fontWeight: 600,
                              color: details.color, bgcolor: details.bg, border: `1px solid ${details.border}`
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.25 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            {formatQuantity(row.quantity, row.mappedType)}
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.25, color: '#475569' }}>
                          ৳{row.unitPrice?.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1.25, fontWeight: 600, color: '#1e293b' }}>
                          ৳{(Math.abs(row.quantity) * (row.unitPrice || 0)).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ py: 1.25, fontSize: '0.8rem', color: '#64748b' }}>
          {row.note || '—'}
        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{ borderTop: '1px solid #e2e8f0' }}
        />
      </Paper>
    </Box>
  );
};

export default StockHistory;
