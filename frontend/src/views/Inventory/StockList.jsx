import React, { useState, useMemo } from 'react';
import {
  Typography, Box, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress,
  Alert, Chip, InputAdornment, TextField, Grid, Card, Divider,
  IconButton, Collapse, Button, Avatar, CardContent,
  Skeleton, TablePagination
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SellIcon from '@mui/icons-material/Sell';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CategoryIcon from '@mui/icons-material/Category';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import { useQuery } from 'react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../../utils/api';
import useShopRefresh from '../../hooks/useShopRefresh';
import ExportButtons from '../../components/ExportButtons';
import { cloudThumb } from '../../utils/cloudinaryUtils';

const getUnitStatusDetails = (status) => {
  switch (status) {
    case 'available':
      return { label: 'Available', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
    case 'sold':
      return { label: 'Sold', color: '#4b5563', bg: '#f3f4f6', border: '#e5e7eb' };
    case 'damaged':
      return { label: 'Damaged', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
    case 'returned':
      return { label: 'Returned', color: '#2563eb', bg: '#eff6ff', border: '#dbeafe' };
    case 'repossessed':
      return { label: 'Repossessed', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
    default:
      return { label: status, color: '#64748b', bg: '#f9fafb', border: '#f3f4f6' };
  }
};

const StockRow = ({ row }) => {
  const [open, setOpen] = useState(false);
  const trackSerials = row.product?.trackSerials === true;

  return (
    <>
      <TableRow
        hover
        role="checkbox"
        tabIndex={-1}
        sx={{
          ...(row.currentQuantity === 0 && {
            backgroundColor: '#fff1f2',
            '&:hover': {
              backgroundColor: '#fee2e2',
            }
          }),
          '&:last-child td, &:last-child th': { border: 0 },
          transition: 'all 0.2s',
          ...(row.currentQuantity > 0 && {
            '&:hover': {
              backgroundColor: '#f1f5f9',
              transform: 'translateY(-1px)',
              boxShadow: 1
            }
          })
        }}
      >
        <TableCell width={40} align="center">
          {trackSerials && (
            <IconButton size="small" onClick={() => setOpen(!open)}>
              {open ? <KeyboardArrowUpRoundedIcon fontSize="small" /> : <KeyboardArrowDownRoundedIcon fontSize="small" />}
            </IconButton>
          )}
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={cloudThumb(row.product?.image?.url || row.product?.images?.[0]?.url)}
              alt={row.product?.name}
              variant="rounded"
              sx={{ width: 40, height: 40, mr: 2, bgcolor: '#e0f2fe', color: '#0284c7' }}
            >
              {!row.product?.image?.url && !row.product?.images?.[0]?.url && <InventoryIcon />}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: row.currentQuantity === 0 ? '#991b1b' : '#1e293b' }}>
                {row.product?.name}
              </Typography>
              <Typography variant="body2" color={row.currentQuantity === 0 ? '#b91c1c' : '#64748b'}>
                Model: {row.product?.model || '—'}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color={row.currentQuantity === 0 ? '#b91c1c' : '#64748b'}>
            {row.product?.brand?.name || row.product?.brand || 'N/A'}
          </Typography>
          <Typography variant="caption" color={row.currentQuantity === 0 ? '#b91c1c' : '#64748b'} display="block">
            {row.product?.category?.name || row.product?.category || 'Uncategorized'}
          </Typography>
        </TableCell>
        <TableCell>
          {row.activeBatches > 1 ? (
            <Chip 
              label={`${row.activeBatches} Batches`}
              size="small"
              sx={{ 
                bgcolor: row.currentQuantity === 0 ? 'rgba(255, 255, 255, 0.5)' : '#ffffff',
                fontWeight: 500,
                border: '1px solid #e2e8f0'
              }}
            />
          ) : row.batches?.length > 0 ? (
            <Chip 
              label={row.batches[0].batchNumber}
              size="small"
              sx={{ 
                bgcolor: row.currentQuantity === 0 ? 'rgba(255, 255, 255, 0.5)' : '#ffffff',
                fontWeight: 500,
                border: '1px solid #e2e8f0'
              }}
            />
          ) : (
            <Typography variant="body2" color="textSecondary">—</Typography>
          )}
        </TableCell>
        <TableCell>
          <Typography variant="subtitle2" sx={{ 
            color: row.currentQuantity === 0 ? '#dc2626' :
                  row.isLowStock ? '#d97706' : '#16a34a',
            fontWeight: 700 
          }}>
            {row.currentQuantity} / {row.initialQuantity || row.currentQuantity}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color={row.currentQuantity === 0 ? '#b91c1c' : '#475569'}>
            ৳{row.purchasePrice?.toLocaleString()}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ fontWeight: 600, color: row.currentQuantity === 0 ? '#991b1b' : '#1e293b' }}>
            ৳{row.stockValue?.toLocaleString()}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip
            label={row.currentQuantity === 0 ? 'Sold Out' : row.isLowStock ? 'Low Stock' : 'In Stock'}
            size="small"
            sx={{
              bgcolor: row.currentQuantity === 0 ? '#dc2626' : 
                      row.isLowStock ? '#fef3c7' : '#dcfce7',
              color: row.currentQuantity === 0 ? '#ffffff' :
                     row.isLowStock ? '#92400e' : '#15803d',
              fontWeight: 600,
              px: 1
            }}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, padding: 2, backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, color: '#1e293b', mb: 1.5 }}>
                Available Serial Numbers (IMEIs)
              </Typography>
              {(!row.batches || row.batches.length === 0) ? (
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>No batches found.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {row.batches.map(batch => (
                    <Box key={batch._id}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', mb: 1, display: 'block' }}>
                        Batch: {batch.batchNumber} (Qty: {batch.remainingQty}) {batch.createdAt && `- Created: ${new Date(batch.createdAt).toLocaleDateString()}`}
                      </Typography>
                      {((batch.availableSerials && batch.availableSerials.length > 0) || (batch.soldSerials && batch.soldSerials.length > 0)) ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {batch.availableSerials?.map((serial) => (
                            <Chip
                              key={serial}
                              label={serial}
                              size="small"
                              sx={{
                                height: '24px', fontSize: '0.75rem', fontWeight: 600,
                                backgroundColor: '#f0fdf4',
                                color: '#16a34a',
                                border: '1px solid #bbf7d0',
                                fontFamily: 'monospace'
                              }}
                            />
                          ))}
                          {batch.soldSerials?.map((serial) => (
                            <Chip
                              key={`sold-${serial}`}
                              label={`${serial} (Sold)`}
                              size="small"
                              sx={{
                                height: '24px', fontSize: '0.75rem', fontWeight: 600,
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                fontFamily: 'monospace'
                              }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                          No serial numbers available for this batch.
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const StockCard = ({ item }) => {
  const [open, setOpen] = useState(false);
  const trackSerials = item.product?.trackSerials === true;

  return (
    <Card sx={{
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden',
      ...(item.currentQuantity === 0 && { backgroundColor: '#fff1f2', border: '1px solid #fecaca' })
    }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
          <Avatar
            src={cloudThumb(item.product?.image?.url || item.product?.images?.[0]?.url)}
            alt={item.product?.name}
            variant="rounded"
            sx={{ width: 48, height: 48, mr: 1.5, bgcolor: '#e0f2fe', color: '#0284c7' }}
          >
            {!item.product?.image?.url && !item.product?.images?.[0]?.url && <InventoryIcon />}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, color: item.currentQuantity === 0 ? '#991b1b' : '#1e293b' }}>
              {item.product?.name}
            </Typography>
            <Typography variant="body2" color={item.currentQuantity === 0 ? '#b91c1c' : '#64748b'} sx={{ fontSize: '0.75rem' }}>
              {item.product?.brand?.name || item.product?.brand || 'N/A'} • {item.product?.category?.name || item.product?.category || 'Uncategorized'}
            </Typography>
            <Typography variant="caption" color={item.currentQuantity === 0 ? '#b91c1c' : '#64748b'} display="block" sx={{ mt: 0.5 }}>
              {item.activeBatches > 1 ? `${item.activeBatches} Batches` : item.batches?.[0]?.batchNumber || 'No Batches'}
            </Typography>
          </Box>
        </Box>
        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
          <Grid item xs={6}>
            <Paper elevation={0} sx={{ p: 1, bgcolor: item.currentQuantity === 0 ? 'rgba(255, 255, 255, 0.5)' : '#f8fafc', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">Available Qty</Typography>
              <Typography variant="subtitle2" sx={{ 
                color: item.currentQuantity === 0 ? '#dc2626' : item.isLowStock ? '#d97706' : '#16a34a',
                fontWeight: 700 
              }}>
                {item.currentQuantity} / {item.initialQuantity || item.currentQuantity}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper elevation={0} sx={{ p: 1, bgcolor: item.currentQuantity === 0 ? 'rgba(255, 255, 255, 0.5)' : '#f8fafc', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">Stock Value</Typography>
              <Typography variant="subtitle2" color={item.currentQuantity === 0 ? '#991b1b' : '#1e293b'} sx={{ fontWeight: 600 }}>
                ৳{item.stockValue?.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        {trackSerials && (
          <>
            <Button fullWidth size="small" variant="outlined" onClick={() => setOpen(!open)} sx={{ mt: 1 }}>
              {open ? 'Hide Serials' : `Show Serials (${item.currentQuantity})`}
            </Button>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                {(!item.batches || item.batches.length === 0) ? (
                  <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>No batches found.</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {item.batches.map(batch => (
                      <Box key={batch._id}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', mb: 0.5, display: 'block' }}>
                          Batch: {batch.batchNumber} {batch.createdAt && `- Created: ${new Date(batch.createdAt).toLocaleDateString()}`}
                        </Typography>
                        {((batch.availableSerials && batch.availableSerials.length > 0) || (batch.soldSerials && batch.soldSerials.length > 0)) ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {batch.availableSerials?.map((serial) => (
                              <Chip
                                key={serial}
                                label={serial}
                                size="small"
                                sx={{
                                  height: '20px', fontSize: '0.7rem', fontWeight: 600,
                                  backgroundColor: '#f0fdf4', color: '#16a34a',
                                  border: '1px solid #bbf7d0', fontFamily: 'monospace'
                                }}
                              />
                            ))}
                            {batch.soldSerials?.map((serial) => (
                              <Chip
                                key={`sold-${serial}`}
                                label={`${serial} (Sold)`}
                                size="small"
                                sx={{
                                  height: '20px', fontSize: '0.7rem', fontWeight: 600,
                                  backgroundColor: '#fef2f2', color: '#dc2626',
                                  border: '1px solid #fecaca', fontFamily: 'monospace'
                                }}
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', fontSize: '0.7rem' }}>
                            No serial numbers available.
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Collapse>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const StockList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const { data: stockData, isLoading, error, refetch } = useQuery(
    'currentStock',
    async () => {
      const response = await api.get('/api/inventory/current-batches');
      return response.data.data;
    },
    { refetchOnWindowFocus: false }
  );
  useShopRefresh(refetch);

  const filteredItems = useMemo(() => {
    let filtered = (stockData || []).filter(item =>
      !search || item.product?.name?.toLowerCase().includes(search.toLowerCase()) || item.product?.model?.toLowerCase().includes(search.toLowerCase())
    );
    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.sort((a, b) => {
        const aStarts = (a.product?.name || '').toLowerCase().startsWith(term) ||
                        (a.product?.model || '').toLowerCase().startsWith(term);
        const bStarts = (b.product?.name || '').toLowerCase().startsWith(term) ||
                        (b.product?.model || '').toLowerCase().startsWith(term);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return 0;
      });
    }
    return filtered;
  }, [stockData, search]);

  const totalProducts = new Set(filteredItems.map(item => item.product?._id)).size;
  const totalItems = filteredItems.reduce((sum, item) => sum + (item.initialQuantity || item.currentQuantity || 0), 0);
  const totalAvailable = filteredItems.reduce((sum, item) => sum + (item.currentQuantity || 0), 0);
  const totalSold = filteredItems.reduce((sum, item) => sum + (item.soldQuantity || 0), 0);
  const stockValue = filteredItems.reduce((sum, item) => sum + (item.stockValue || 0), 0);
  const lowStock = filteredItems.filter(item => item.isLowStock).length;

  const paginatedItems = useMemo(() => {
    return filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredItems, page, rowsPerPage]);

  const statItems = [
    { title: 'Total Products', value: totalProducts, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
    { title: 'Total Items (Qty)', value: totalItems, color: '#0891b2', bg: '#e0f2fe', border: '#bae6fd' },
    { title: 'Stock Value', value: `৳${stockValue.toLocaleString()}`, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    { title: 'Low Stock', value: lowStock, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    { title: 'Total Sold', value: totalSold, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    { title: 'Total Available', value: totalAvailable, color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' }
  ];

  const columns = [
    { label: 'Product Name', accessor: (row) => row.product?.name || '—' },
    { label: 'Model', accessor: (row) => row.product?.model || '—' },
    { label: 'Batch/Inv', accessor: (row) => row.batches?.map(b => b.batchNumber).join(', ') || '—' },
    { label: 'Quantity', accessor: (row) => row.currentQuantity || 0 },
    { label: 'Alert Qty', accessor: (row) => row.alertQuantity ?? '—' },
    { label: 'Buy Price', accessor: (row) => `৳${(row.purchasePrice || row.product?.purchasePrice || 0).toLocaleString()}` },
    { label: 'Sell Price', accessor: (row) => `৳${(row.sellingPrice || row.product?.sellingPrice || 0).toLocaleString()}` },
    { label: 'Total Value', accessor: (row) => `৳${(Math.max(0, row.currentQuantity || 0) * (row.purchasePrice || row.product?.purchasePrice || 0)).toLocaleString()}` }
  ];



  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 } }}>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
        <Box sx={{
          px: 2, py: 1.25,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #f8faff 0%, #fff 100%)',
          flexWrap: 'wrap', gap: 1,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              onClick={() => navigate('/dashboard')} 
              sx={{ 
                bgcolor: '#F1F5F9', 
                '&:hover': { bgcolor: '#E2E8F0' },
                borderRadius: '8px',
                p: 0.5,
                mr: 0.5
              }}
            >
              <ArrowBackIcon sx={{ color: '#475569', fontSize: '1rem' }} />
            </IconButton>
            <InventoryRoundedIcon sx={{ color: '#3b82f6', fontSize: '1.1rem' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
              Stock List
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <ExportButtons 
              data={filteredItems} 
              columns={columns} 
              filename="stock_list" 
              title="Current Stock Report" 
            />
            <TextField
              size="small"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
              sx={{
                width: 200,
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.78rem', height: '30px', borderRadius: '6px',
                  '& fieldset': { borderColor: '#e2e8f0' },
                }
              }}
            />
          </Box>
        </Box>

        {/* Stats bar */}
        <Box sx={{
          px: 2, py: 0.75,
          display: 'flex', gap: 1, flexWrap: 'wrap',
          borderBottom: '1px solid #f1f5f9',
          backgroundColor: '#fafafa',
        }}>
          {statItems.map(s => (
            <Box key={s.title} sx={{
              display: 'flex', alignItems: 'center', gap: 0.5,
              px: 1, py: 0.3, borderRadius: '6px',
              backgroundColor: s.bg, border: `1px solid ${s.border}`,
            }}>
              <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 500 }}>{s.title}:</Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: s.color }}>{s.value}</Typography>
            </Box>
          ))}
        </Box>

        <TableContainer sx={{ display: { xs: 'none', md: 'block' }, maxHeight: 'calc(100vh - 220px)', overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead sx={{ '& .MuiTableCell-head': { bgcolor: '#f8fafc', zIndex: 2 } }}>
              <TableRow>
                <TableCell />
                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Category/Brand</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Batch</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Quantity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Buy Price</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total Value</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            {isLoading ? (
              <TableBody>
                {[1, 2, 3, 4, 5].map((item) => (
                  <TableRow key={item}>
                    <TableCell width={40}></TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Skeleton variant="circular" width={32} height={32} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Skeleton variant="text" width="60%" />
                          <Skeleton variant="text" width="45%" />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="80%" /></TableCell>
                    <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="50%" /></TableCell>
                    <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="40%" /></TableCell>
                    <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="50%" /></TableCell>
                    <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="60%" /></TableCell>
                    <TableCell sx={{ py: 1.5 }}><Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 1 }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            ) : paginatedItems.length === 0 ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={8} sx={{ py: 4, textAlign: 'center', color: '#94a3b8' }}>
                    {search ? 'No products match your search.' : 'No stock data available.'}
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              paginatedItems.map((item) => (
                <TableBody key={item._id}>
                  <StockRow row={item} />
                </TableBody>
              ))
            )}
          </Table>
        </TableContainer>

        {/* Mobile Card View */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', p: 1.5, gap: 1.5 }}>
          {isLoading ? (
            [1, 2, 3].map((item) => (
              <Card key={item} sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Skeleton variant="text" width="60%" height={20} />
                    <Skeleton variant="text" width="40%" height={16} />
                  </Box>
                </Box>
                <Skeleton variant="text" width="80%" height={16} sx={{ mb: 1 }} />
                <Grid container spacing={1}>
                  <Grid item xs={6}><Skeleton variant="text" width="70%" /></Grid>
                  <Grid item xs={6}><Skeleton variant="text" width="50%" /></Grid>
                </Grid>
              </Card>
            ))
          ) : paginatedItems.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              {search ? 'No products match your search.' : 'No stock data available.'}
            </Box>
          ) : (
            paginatedItems.map((item) => (
              <StockCard key={item._id} item={item} />
            ))
          )}
        </Box>

        {/* Pagination */}
        {!isLoading && filteredItems.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredItems.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: '1px solid #E2E8F0',
              bgcolor: '#fff',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontFamily: '"Outfit", sans-serif',
                fontSize: '0.825rem',
              }
            }}
          />
        )}
      </Paper>
    </Box>
  );
};

export default StockList;