import React, { useState, useMemo } from 'react';
import {
  Typography, Box, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress,
  Alert, Chip, Divider, Card, useTheme, useMediaQuery,
  Skeleton, TablePagination
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import useShopRefresh from '../../hooks/useShopRefresh';
import ExportButtons from '../../components/ExportButtons';

const StockAlert = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const { data: lowStockItems, isLoading, error, refetch } = useQuery(
    'lowStockItems',
    async () => {
      const response = await api.get('/api/inventory/low-stock');
      return response.data.data;
    },
    { refetchOnWindowFocus: false }
  );

  useShopRefresh(refetch);

  const paginatedItems = useMemo(() => {
    return (lowStockItems || []).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [lowStockItems, page, rowsPerPage]);

  const columns = [
    { label: 'Product Name', accessor: (row) => row.product?.name || '—' },
    { label: 'Model', accessor: (row) => row.product?.model || '—' },
    { label: 'Current Quantity', accessor: 'currentQuantity' },
    { label: 'Alert Quantity', accessor: 'alertQuantity' },
    { label: 'Status', accessor: (row) => row.isOutOfStock ? 'Out of Stock' : 'Low Stock' }
  ];



  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ fontSize: '0.8rem' }}>Error loading stock alerts: {error.message}</Alert>
      </Box>
    );
  }

  const outOfStockCount = lowStockItems?.filter(i => i.isOutOfStock).length || 0;
  const lowCount = (lowStockItems?.length || 0) - outOfStockCount;

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 } }}>
      <Paper
        elevation={0}
        sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}
      >
        {/* Compact Header */}
        <Box sx={{
          px: 2, py: 1.25,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #fff8f8 0%, #fff 100%)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmberRoundedIcon sx={{ color: '#ef4444', fontSize: '1.1rem' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', fontFamily: '"Outfit", sans-serif' }}>
              Stock Alert
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <ExportButtons 
              data={lowStockItems || []} 
              columns={columns} 
              filename="stock_alerts" 
              title="Stock Alert Report" 
            />
            {outOfStockCount > 0 && (
              <Chip
                icon={<ErrorOutlineRoundedIcon sx={{ fontSize: '0.75rem !important' }} />}
                label={`${outOfStockCount} Out of Stock`}
                size="small"
                sx={{
                  height: '22px', fontSize: '0.7rem', fontWeight: 600,
                  backgroundColor: '#fef2f2', color: '#dc2626',
                  border: '1px solid #fecaca',
                  '& .MuiChip-icon': { color: '#dc2626' }
                }}
              />
            )}
            {lowCount > 0 && (
              <Chip
                icon={<WarningAmberRoundedIcon sx={{ fontSize: '0.75rem !important' }} />}
                label={`${lowCount} Low Stock`}
                size="small"
                sx={{
                  height: '22px', fontSize: '0.7rem', fontWeight: 600,
                  backgroundColor: '#fffbeb', color: '#d97706',
                  border: '1px solid #fde68a',
                  '& .MuiChip-icon': { color: '#d97706' }
                }}
              />
            )}
            {(lowStockItems?.length || 0) === 0 && (
              <Chip
                label="All Good"
                size="small"
                sx={{
                  height: '22px', fontSize: '0.7rem', fontWeight: 600,
                  backgroundColor: '#f0fdf4', color: '#16a34a',
                  border: '1px solid #bbf7d0'
                }}
              />
            )}
          </Box>
        </Box>

        {/* Desktop View - Table */}
        {!isMobile && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                  {['Product', 'Model', 'Current Qty', 'Alert Qty', 'Status'].map(col => (
                    <TableCell
                      key={col}
                      align={['Current Qty', 'Alert Qty'].includes(col) ? 'right' : 'left'}
                      sx={{
                        fontSize: '0.68rem', fontWeight: 700, color: '#64748b',
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                        py: 0.75, px: 1.5, borderBottom: '1px solid #e2e8f0',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3, 4, 5].map((item) => (
                    <TableRow key={item}>
                      <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="40%" /></TableCell>
                      <TableCell align="right" sx={{ py: 1.5 }}><Skeleton variant="text" width="30%" /></TableCell>
                      <TableCell align="right" sx={{ py: 1.5 }}><Skeleton variant="text" width="30%" /></TableCell>
                      <TableCell sx={{ py: 1.5 }}><Skeleton variant="rectangular" width={60} height={18} sx={{ borderRadius: 1 }} /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: '#94a3b8', fontSize: '0.8rem', fontFamily: '"Outfit", sans-serif' }}>
                      No low stock items. All products are sufficiently stocked.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item) => {
                    const isOut = item.isOutOfStock;
                    return (
                      <TableRow
                        key={item.product._id}
                        sx={{
                          '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                          '&:hover': { backgroundColor: '#fef9f9' },
                          '& .MuiTableCell-root': { py: 0.6, px: 1.5, fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9' }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 500, color: '#1e293b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: '"Outfit", sans-serif' }}>
                          {item.product.name}
                        </TableCell>
                        <TableCell sx={{ color: '#64748b', fontFamily: 'monospace', fontSize: '0.75rem !important' }}>
                          {item.product?.model || '—'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: isOut ? '#dc2626' : '#d97706', fontFamily: '"Outfit", sans-serif' }}>
                          {item.currentQuantity}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif' }}>
                          {item.alertQuantity}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={isOut ? 'Out of Stock' : 'Low Stock'}
                            size="small"
                            sx={{
                              height: '18px', fontSize: '0.65rem', fontWeight: 700,
                              backgroundColor: isOut ? '#fef2f2' : '#fffbeb',
                              color: isOut ? '#dc2626' : '#d97706',
                              border: `1px solid ${isOut ? '#fecaca' : '#fde68a'}`,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Mobile View - Cards */}
        {isMobile && (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {isLoading ? (
              [1, 2, 3].map((item) => (
                <Card key={item} sx={{ p: 1.75, border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Skeleton variant="text" width="50%" height={18} />
                    <Skeleton variant="rectangular" width={60} height={18} sx={{ borderRadius: 1 }} />
                  </Box>
                  <Skeleton variant="text" width="40%" height={14} sx={{ mb: 1.5 }} />
                  <Divider sx={{ borderStyle: 'dashed', mb: 1.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box><Skeleton variant="text" width={50} /><Skeleton variant="text" width={30} /></Box>
                    <Box sx={{ textAlign: 'right' }}><Skeleton variant="text" width={50} /><Skeleton variant="text" width={30} /></Box>
                  </Box>
                </Card>
              ))
            ) : paginatedItems.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, px: 2, textAlign: 'center' }}>
                <Box sx={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0fdf4', borderRadius: '50%', mb: 1.5, border: '1px solid #bbf7d0' }}>
                  <span style={{ color: '#16a34a', fontSize: '1.25rem', fontWeight: 'bold' }}>✓</span>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5, fontFamily: '"Outfit", sans-serif' }}>
                  Stock Status: Excellent
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', maxWidth: 260 }}>
                  All products are sufficiently stocked. No low-stock alerts at this time.
                </Typography>
              </Box>
            ) : (
              paginatedItems.map((item) => {
                const isOut = item.isOutOfStock;
                return (
                  <Card 
                    key={item.product._id} 
                    elevation={0}
                    sx={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      backgroundColor: '#FFFFFF',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                      }
                    }}
                  >
                    <Box sx={{ p: 1.75 }}>
                      {/* Name & Status Chip */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', fontFamily: '"Outfit", sans-serif', lineHeight: 1.3 }}>
                          {item.product.name}
                        </Typography>
                        <Chip
                          label={isOut ? 'Out of Stock' : 'Low Stock'}
                          size="small"
                          sx={{
                            height: '18px', fontSize: '0.625rem', fontWeight: 700,
                            backgroundColor: isOut ? '#fef2f2' : '#fffbeb',
                            color: isOut ? '#dc2626' : '#d97706',
                            border: `1px solid ${isOut ? '#fecaca' : '#fde68a'}`,
                            flexShrink: 0
                          }}
                        />
                      </Box>

                      {/* Model */}
                      <Typography sx={{ color: '#64748b', fontFamily: 'monospace', fontSize: '0.7rem', mb: 1.5 }}>
                        Model: {item.product?.model || '—'}
                      </Typography>

                      <Divider sx={{ borderStyle: 'dashed', mb: 1.5 }} />

                      {/* Quantities */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.6rem', mb: 0.25 }}>
                            Current Qty
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: isOut ? '#dc2626' : '#d97706', fontFamily: '"Outfit", sans-serif' }}>
                            {item.currentQuantity}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.6rem', mb: 0.25 }}>
                            Alert Qty
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, fontFamily: '"Outfit", sans-serif' }}>
                            {item.alertQuantity}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                );
              })
            )}
          </Box>
        )}

        {/* Pagination */}
        {!isLoading && (lowStockItems?.length || 0) > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={lowStockItems.length}
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

export default StockAlert;