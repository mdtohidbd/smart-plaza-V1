import React, { useState, useMemo } from 'react';
import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, TextField, InputAdornment, Grid, Button, IconButton, Tooltip, Chip, Divider, TablePagination, Skeleton } from '@mui/material';
import { useQuery } from 'react-query';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Search as SearchIcon, Add as AddIcon, Visibility as VisibilityIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon, ArrowForward as ArrowForwardIcon, Edit as EditIcon } from '@mui/icons-material';
import ExportButtons from '../../components/ExportButtons';
import useShopRefresh from '../../hooks/useShopRefresh';

const QuotationList = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const navigate = useNavigate();

  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin';
  const canUpdateStatus = isAdmin || user?.permissions?.sales?.update;

  const { data: quotations, isLoading, error, refetch } = useQuery(
    'all-quotations',
    async () => {
      const response = await api.get('/api/quotations');
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  // Automatically refresh data when shop changes
  useShopRefresh(refetch);

  const filteredQuotations = useMemo(() => {
    if (!quotations || !searchTerm) return quotations || [];

    const term = searchTerm.toLowerCase();
    const filtered = quotations.filter(q =>
      (q.quotationNumber && q.quotationNumber.toLowerCase().includes(term)) ||
      (q.customer?.contactName && q.customer.contactName.toLowerCase().includes(term)) ||
      (q.customer?.contactNumber && q.customer.contactNumber.includes(term)) ||
      (q.customer?.businessName && q.customer.businessName.toLowerCase().includes(term)) ||
      (q.customer?.email && q.customer.email.toLowerCase().includes(term)) ||
      (q.total && q.total.toString().includes(term)) ||
      (q.status && q.status.toLowerCase().includes(term)) ||
      (q.items && q.items.some(i => (i.productName || i.name || i.product?.name || '').toLowerCase().includes(term)))
    );

    return filtered.sort((a, b) => {
      const aStarts = a.quotationNumber.toLowerCase().startsWith(term) ||
                      (a.customer?.contactName && a.customer.contactName.toLowerCase().startsWith(term)) ||
                      (a.customer?.contactNumber && a.customer.contactNumber.startsWith(term));
      const bStarts = b.quotationNumber.toLowerCase().startsWith(term) ||
                      (b.customer?.contactName && b.customer.contactName.toLowerCase().startsWith(term)) ||
                      (b.customer?.contactNumber && b.customer.contactNumber.startsWith(term));
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
  }, [quotations, searchTerm]);

    React.useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedQuotations = useMemo(() => {
    if (!filteredQuotations) return [];
    return filteredQuotations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredQuotations, page, rowsPerPage]);

  const exportColumns = [
    { label: 'Quote #', accessor: 'quotationNumber' },
    { label: 'Date', accessor: (row) => new Date(row.date).toLocaleDateString() },
    { label: 'Customer', accessor: (row) => row.customer?.contactName || 'N/A' },
    { label: 'Created By', accessor: (row) => row.createdBy?.name || 'Unknown' },
    { label: 'Total', accessor: (row) => `৳${row.total}` },
    { label: 'Valid Until', accessor: (row) => new Date(row.validUntil).toLocaleDateString() },
    { label: 'Status', accessor: 'status' }
  ];

  const handleStatusChange = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this quotation as ${status}?`)) return;
    
    try {
      await api.put(`/api/quotations/${id}/status`, { status });
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Draft': return 'default';
      case 'Pending': return 'warning';
      case 'Approved': return 'success';
      case 'Rejected': return 'error';
      case 'Converted': return 'info';
      default: return 'default';
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Error loading quotations: {error.message}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2, border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
              <Box>
                <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '1.25rem', mb: 0.5, fontFamily: '"Outfit", sans-serif' }}>
                  Quotations
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: '"Outfit", sans-serif' }}>
                  Manage customer quotations and estimates.
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search by quote #, customer, amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '8px', fontSize: '0.875rem' }
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={5} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', justifyContent: { xs: 'stretch', sm: 'flex-start' } }}>
                <ExportButtons
                  data={filteredQuotations || []}
                  columns={exportColumns}
                  filename="quotations"
                  title="Quotations Report"
                />
                {user?.permissions?.sales?.create && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/dashboard/quotations/create')}
                    fullWidth
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontFamily: '"Outfit", sans-serif',
                      fontWeight: 600,
                      backgroundColor: '#1D5F99',
                      py: 1,
                      '&:hover': {
                        backgroundColor: '#144d7d',
                      },
                      width: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    Create Quotation
                  </Button>
                )}
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{
                    textAlign: { xs: 'left', md: 'right' },
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '0.85rem',
                    color: 'text.secondary'
                  }}
                >
                  Showing {filteredQuotations?.length || 0} of {quotations?.length || 0} quotes
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Mobile View: Render list of cards instead of table */}
        <Grid item xs={12} sx={{ display: { xs: 'block', sm: 'none' } }}>
          {isLoading ? (
            [1, 2, 3, 4, 5].map((idx) => (
              <Paper key={idx} sx={{ p: 2, mb: 1.5, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Skeleton width="40%" height={24} />
                  <Skeleton width="20%" height={24} />
                </Box>
                <Skeleton width="60%" height={20} sx={{ mb: 1 }} />
                <Skeleton width="80%" height={20} />
              </Paper>
            ))
          ) : paginatedQuotations?.length > 0 ? (
            paginatedQuotations.map((quote) => (
              <Paper
                key={quote._id}
                sx={{
                  p: 2,
                  mb: 1.5,
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  fontFamily: '"Outfit", sans-serif',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <RouterLink
                    to={`/dashboard/quotations/${quote._id}`}
                    style={{ textDecoration: 'none', color: '#1D5F99', fontWeight: 700, fontSize: '0.95rem' }}
                  >
                    {quote.quotationNumber}
                  </RouterLink>
                  <Chip
                    label={quote.status}
                    color={getStatusColor(quote.status)}
                    size="small"
                    sx={{ fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                  />
                </Box>

                <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>Customer</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.85rem' }}>
                      {quote.customer?.contactName || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>Total Amount</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1D5F99', fontSize: '0.85rem' }}>
                      ৳{quote.total}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>Date</Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.85rem' }}>
                      {new Date(quote.date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>Valid Until</Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: new Date(quote.validUntil) < new Date() && quote.status === 'Pending' ? 'error.main' : 'text.primary',
                        fontSize: '0.85rem'
                      }}
                    >
                      {new Date(quote.validUntil).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>Created By</Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.85rem' }}>
                      {quote.createdBy?.name || 'Unknown'}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1, borderColor: '#F1F5F9' }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 0.5 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<VisibilityIcon sx={{ fontSize: '14px !important' }} />}
                    onClick={() => navigate(`/dashboard/quotations/${quote._id}`)}
                    sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', px: 1.5, py: 0.5 }}
                  >
                    Details
                  </Button>

                  {(quote.status === 'Pending' || quote.status === 'Draft') && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      startIcon={<EditIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={() => navigate(`/dashboard/quotations/edit/${quote._id}`)}
                      sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', px: 1.5, py: 0.5 }}
                    >
                      Edit
                    </Button>
                  )}

                  {canUpdateStatus && quote.status === 'Pending' && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                        onClick={() => handleStatusChange(quote._id, 'Approved')}
                        sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', px: 1.5, py: 0.5, boxShadow: 'none' }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<CancelIcon sx={{ fontSize: '14px !important' }} />}
                        onClick={() => handleStatusChange(quote._id, 'Rejected')}
                        sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', px: 1.5, py: 0.5, boxShadow: 'none' }}
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {quote.status === 'Approved' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="info"
                      endIcon={<ArrowForwardIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={() => navigate(`/dashboard/sales/retail?quoteId=${quote._id}`)}
                      sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', px: 1.5, py: 0.5, color: '#fff', boxShadow: 'none' }}
                    >
                      Convert to Invoice
                    </Button>
                  )}
                </Box>
              </Paper>
            ))
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <Typography color="textSecondary" sx={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.9rem' }}>No quotations found.</Typography>
            </Paper>
          )}
        </Grid>

        {/* Desktop View: Render table on tablet/desktop displays */}
        <Grid item xs={12} sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Paper sx={{ overflow: 'hidden', p: 0, border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow sx={{
                    backgroundColor: '#F8FAFC',
                    '& .MuiTableCell-head': {
                      color: 'text.secondary',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      fontFamily: '"Outfit", sans-serif',
                      borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                      py: 1.5
                    }
                  }}>
                    <TableCell>Quote #</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Created By</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Valid Until</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    [1, 2, 3, 4, 5].map((item) => (
                      <TableRow key={item}>
                        <TableCell><Skeleton variant="text" width="80%" height={24} /></TableCell>
                        <TableCell><Skeleton variant="text" width="60%" height={24} /></TableCell>
                        <TableCell><Skeleton variant="text" width="70%" height={24} /></TableCell>
                        <TableCell><Skeleton variant="text" width="50%" height={24} /></TableCell>
                        <TableCell align="right"><Skeleton variant="text" width="60%" height={24} /></TableCell>
                        <TableCell><Skeleton variant="text" width="65%" height={24} /></TableCell>
                        <TableCell><Skeleton variant="text" width="50%" height={24} /></TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                            <Skeleton variant="circular" width={28} height={28} />
                            <Skeleton variant="circular" width={28} height={28} />
                            <Skeleton variant="circular" width={28} height={28} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : paginatedQuotations?.length > 0 ? (
                    paginatedQuotations.map((quote) => (
                      <TableRow key={quote._id} hover sx={{ '& .MuiTableCell-body': { py: 1.5, fontFamily: '"Outfit", sans-serif' } }}>
                        <TableCell>
                          <RouterLink
                            to={`/dashboard/quotations/${quote._id}`}
                            style={{ textDecoration: 'none', color: '#1D5F99', fontWeight: 'bold' }}
                          >
                            {quote.quotationNumber}
                          </RouterLink>
                        </TableCell>
                        <TableCell>{new Date(quote.date).toLocaleDateString()}</TableCell>
                        <TableCell>{quote.customer?.contactName || 'N/A'}</TableCell>
                        <TableCell>{quote.createdBy?.name || 'Unknown'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: '600' }}>৳{quote.total}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem', color: new Date(quote.validUntil) < new Date() && quote.status === 'Pending' ? 'error.main' : 'inherit' }}>
                            {new Date(quote.validUntil).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={quote.status} color={getStatusColor(quote.status)} size="small" sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton onClick={() => navigate(`/dashboard/quotations/${quote._id}`)} size="small" color="primary">
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>

                          {(quote.status === 'Pending' || quote.status === 'Draft') && (
                            <Tooltip title="Edit">
                              <IconButton onClick={() => navigate(`/dashboard/quotations/edit/${quote._id}`)} size="small" color="secondary">
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {canUpdateStatus && quote.status === 'Pending' && (
                            <>
                              <Tooltip title="Approve">
                                <IconButton onClick={() => handleStatusChange(quote._id, 'Approved')} size="small" color="success">
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton onClick={() => handleStatusChange(quote._id, 'Rejected')} size="small" color="error">
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}

                          {quote.status === 'Approved' && (
                            <Tooltip title="Convert this quotation into a retail sale invoice">
                              <Button
                                onClick={() => navigate(`/dashboard/sales/retail?quoteId=${quote._id}`)}
                                size="small"
                                variant="contained"
                                color="info"
                                endIcon={<ArrowForwardIcon sx={{ fontSize: '14px !important' }} />}
                                sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem', ml: 1, boxShadow: 'none' }}
                              >
                                Convert to Invoice
                              </Button>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary" sx={{ fontFamily: '"Outfit", sans-serif' }}>No quotations found.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredQuotations?.length || 0}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                borderTop: '1px solid #E2E8F0',
                fontFamily: '"Outfit", sans-serif'
              }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QuotationList;
