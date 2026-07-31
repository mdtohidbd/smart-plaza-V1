import React, { useState, useMemo } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  CircularProgress, 
  Alert, 
  TextField, 
  InputAdornment, 
  Grid, 
  IconButton, 
  Tooltip, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle, 
  Button,
  Card,
  Divider,
  Avatar,
  Chip,
  Skeleton,
  TablePagination
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { 
  Search as SearchIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  LocationOn as AddressIcon,
  Map as RouteIcon,
  Description as NoteIcon,
  AccountBalanceWallet as WalletIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

const Customers = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerIdToDelete, setCustomerIdToDelete] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const { data: customers, isLoading, error } = useQuery(
    'customers',
    async () => {
      const response = await api.get('/api/contacts/customers');
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  const deleteCustomerMutation = useMutation(
    (id) => api.delete(`/api/contacts/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        setDeleteDialogOpen(false);
      },
      onError: (error) => {
        console.error('Error deleting customer:', error);
      }
    }
  );

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (!customers || !searchTerm) return customers || [];

    const term = searchTerm.toLowerCase();
    const filtered = customers.filter(customer =>
      customer.contactName.toLowerCase().includes(term) ||
      customer.contactNumber.includes(term) ||
      customer.customerType.toLowerCase().includes(term) ||
      (customer.businessName && customer.businessName.toLowerCase().includes(term)) ||
      customer.openingBalance.toString().includes(term) ||
      customer.creditLimit.toString().includes(term) ||
      customer.totalDue.toString().includes(term)
    );
    return filtered.sort((a, b) => {
      const matchWord = (str) => (str || '').toLowerCase().split(/\s+/).some(w => w.startsWith(term));
      const aStarts = matchWord(a.contactName) || matchWord(a.contactNumber) || matchWord(a.businessName);
      const bStarts = matchWord(b.contactName) || matchWord(b.contactNumber) || matchWord(b.businessName);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
  }, [customers, searchTerm]);

  const paginatedCustomers = useMemo(() => {
    return filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredCustomers, page, rowsPerPage]);

  if (error) {
    return (
      <Box sx={{ p: 2, bgcolor: '#F8FAFC', minHeight: '80vh' }}>
        <Alert severity="error" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          Error loading customers: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, backgroundColor: '#F8FAFC', minHeight: '85vh' }}>
      {/* Compact Header Section */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton 
            onClick={() => navigate('/dashboard')} 
            sx={{ 
              bgcolor: '#F1F5F9', 
              '&:hover': { bgcolor: '#E2E8F0' },
              borderRadius: '12px',
              p: 1
            }}
          >
            <ArrowBackIcon sx={{ color: '#475569', fontSize: '1.25rem' }} />
          </IconButton>
          <Box>
            <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 700, fontSize: '1.15rem', lineHeight: 1.2 }}>
              Customers
            </Typography>
            <Typography sx={{ color: '#64748B', fontSize: '0.8rem' }}>
              Manage your customer contacts and information
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => navigate('/dashboard/contacts/add')}
          sx={{
            bgcolor: '#1D5F99',
            color: '#fff',
            px: 2,
            py: 0.75,
            borderRadius: '6px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.825rem',
            '&:hover': { bgcolor: '#42A2C2' }
          }}
        >
          Add Customer
        </Button>
      </Box>

      {/* Search and Filters */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 1.5, 
          mb: 2, 
          backgroundColor: '#FFFFFF', 
          border: '1px solid #E2E8F0', 
          borderRadius: '8px' 
        }}
      >
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} sm={8} md={9}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Search customers by name, number, type, or business..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#64748B', fontSize: 18 }} />
                  </InputAdornment>
                ),
                sx: { 
                  borderRadius: '6px', 
                  bgcolor: '#F8FAFC',
                  color: '#1E293B',
                  fontSize: '0.875rem',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1D5F99' }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem', textAlign: { sm: 'right' } }}>
              Showing {filteredCustomers?.length || 0} of {customers?.length || 0} customers
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Customers Table (Desktop View) */}
      <TableContainer component={Paper} elevation={0} sx={{ 
        display: { xs: 'none', md: 'block' },
        backgroundColor: '#FFFFFF', 
        border: '1px solid #E2E8F0', 
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <Table sx={{ minWidth: 800 }} size="small">
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ py: 1, color: '#475569', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>Contact Name</TableCell>
              <TableCell sx={{ py: 1, color: '#475569', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>Contact Number</TableCell>
              <TableCell sx={{ py: 1, color: '#475569', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>Type</TableCell>
              <TableCell sx={{ py: 1, color: '#475569', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>Business Name</TableCell>
              <TableCell align="right" sx={{ py: 1, color: '#475569', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>Opening Bal.</TableCell>
              <TableCell align="right" sx={{ py: 1, color: '#475569', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>Total Sales</TableCell>
              <TableCell align="right" sx={{ py: 1, color: '#475569', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>Total Payments</TableCell>
              <TableCell align="right" sx={{ py: 1, color: '#475569', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>Current Bal.</TableCell>
              <TableCell align="right" sx={{ py: 1, color: '#475569', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>Credit Limit</TableCell>
              <TableCell align="right" sx={{ py: 1, color: '#475569', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>Total Due</TableCell>
              <TableCell align="center" sx={{ py: 1, color: '#475569', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map((item) => (
                <TableRow key={item}>
                  <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="60%" height={20} /></TableCell>
                  <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="80%" height={20} /></TableCell>
                  <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="50%" height={20} /></TableCell>
                  <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="70%" height={20} /></TableCell>
                  <TableCell align="right" sx={{ py: 1.5 }}><Skeleton variant="text" width="60%" height={20} /></TableCell>
                  <TableCell align="right" sx={{ py: 1.5 }}><Skeleton variant="text" width="60%" height={20} /></TableCell>
                  <TableCell align="right" sx={{ py: 1.5 }}><Skeleton variant="text" width="60%" height={20} /></TableCell>
                  <TableCell align="right" sx={{ py: 1.5 }}><Skeleton variant="text" width="65%" height={20} /></TableCell>
                  <TableCell align="right" sx={{ py: 1.5 }}><Skeleton variant="text" width="60%" height={20} /></TableCell>
                  <TableCell align="right" sx={{ py: 1.5 }}><Skeleton variant="text" width="60%" height={20} /></TableCell>
                  <TableCell align="center" sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Skeleton variant="circular" width={28} height={28} />
                      <Skeleton variant="circular" width={28} height={28} />
                      <Skeleton variant="circular" width={28} height={28} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedCustomers.length > 0 ? (
              paginatedCustomers.map((customer) => (
                <TableRow key={customer._id} sx={{ '&:hover': { bgcolor: '#F8FAFC' }, '& td': { borderBottom: '1px solid #F1F5F9' } }}>
                  <TableCell sx={{ py: 0.75, color: '#1E293B', fontWeight: 600, fontSize: '0.825rem' }}>{customer.contactName}</TableCell>
                  <TableCell sx={{ py: 0.75, color: '#475569', fontSize: '0.825rem' }}>{customer.contactNumber}</TableCell>
                  <TableCell sx={{ py: 0.75, color: '#475569', fontSize: '0.825rem' }}>{customer.customerType}</TableCell>
                  <TableCell sx={{ py: 0.75, color: '#475569', fontSize: '0.825rem' }}>{customer.businessName || 'N/A'}</TableCell>
                  <TableCell align="right" sx={{ py: 0.75, color: '#059669', fontWeight: 500, fontSize: '0.825rem' }}>
                    ৳{customer.openingBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.75, color: '#2563EB', fontWeight: 500, fontSize: '0.825rem' }}>
                    ৳{customer.totalSales?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.75, color: '#059669', fontWeight: 500, fontSize: '0.825rem' }}>
                    ৳{customer.totalPayments?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    py: 0.75,
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    color: customer.currentBalance > 0 ? '#DC2626' : customer.currentBalance < 0 ? '#059669' : '#64748B'
                  }}>
                    ৳{customer.currentBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.75, color: '#475569', fontWeight: 500, fontSize: '0.825rem' }}>
                    ৳{customer.creditLimit?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.75, color: '#DC2626', fontWeight: 600, fontSize: '0.825rem' }}>
                    ৳{customer.totalDue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 0.75 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setViewDialogOpen(true);
                          }}
                          sx={{ color: '#059669', bgcolor: 'rgba(5, 150, 105, 0.06)', '&:hover': { bgcolor: 'rgba(5, 150, 105, 0.12)' }, p: 0.5 }}
                        >
                          <ViewIcon fontSize="small" sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      {user?.permissions?.contacts?.update && (
                        <Tooltip title="Edit Customer">
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/dashboard/contacts/edit/${customer._id}`)}
                            sx={{ color: '#1D5F99', bgcolor: 'rgba(29, 95, 153, 0.06)', '&:hover': { bgcolor: 'rgba(29, 95, 153, 0.12)' }, p: 0.5 }}
                          >
                            <EditIcon fontSize="small" sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {user?.permissions?.contacts?.delete && (
                        <Tooltip title="Delete Customer">
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              setCustomerIdToDelete(customer._id);
                              setDeleteDialogOpen(true);
                            }}
                            sx={{ color: '#EF4444', bgcolor: 'rgba(239, 68, 68, 0.06)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.12)' }, p: 0.5 }}
                          >
                            <DeleteIcon fontSize="small" sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 3, color: '#64748B' }}>
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Customers Mobile Cards View */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        {isLoading ? (
          [1, 2, 3].map((item) => (
            <Card key={item} sx={{ p: 2, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Skeleton variant="circular" width={36} height={36} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="60%" height={20} />
                  <Skeleton variant="text" width="40%" height={16} />
                </Box>
              </Box>
              <Skeleton variant="text" width="80%" height={16} sx={{ mb: 1 }} />
              <Grid container spacing={1} sx={{ mb: 1.5 }}>
                <Grid item xs={6}><Skeleton variant="text" width="70%" /></Grid>
                <Grid item xs={6}><Skeleton variant="text" width="50%" /></Grid>
              </Grid>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="rectangular" width={60} height={28} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" width={60} height={28} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" width={60} height={28} sx={{ borderRadius: 1 }} />
              </Box>
            </Card>
          ))
        ) : paginatedCustomers.length > 0 ? (
          paginatedCustomers.map((customer) => (
            <Card 
              key={customer._id}
              elevation={0}
              sx={{ 
                p: 2, 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #E2E8F0', 
                borderRadius: '10px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: '#1D5F99',
                  boxShadow: '0 4px 12px rgba(29, 95, 153, 0.08)'
                }
              }}
            >
              {/* Header: Name, Type and Business */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(29, 95, 153, 0.1)', color: '#1D5F99', fontWeight: 600, fontSize: '0.9rem' }}>
                  {customer.contactName ? customer.contactName[0].toUpperCase() : 'C'}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography sx={{ color: '#1E293B', fontWeight: 700, fontSize: '0.925rem', fontFamily: '"Outfit", sans-serif' }}>
                      {customer.contactName}
                    </Typography>
                    <Chip 
                      label={customer.customerType || 'Individual'} 
                      size="small" 
                      sx={{ 
                        height: 18, 
                        fontSize: '0.675rem', 
                        bgcolor: customer.customerType === 'Wholesale' ? 'rgba(13, 148, 136, 0.1)' : 'rgba(29, 95, 153, 0.1)', 
                        color: customer.customerType === 'Wholesale' ? '#0D9488' : '#1D5F99',
                        fontWeight: 700
                      }} 
                    />
                  </Box>
                  <Typography sx={{ color: '#64748B', fontSize: '0.725rem', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                    <BusinessIcon sx={{ color: '#94A3B8', fontSize: 13 }} /> {customer.businessName || 'No Business Name'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

              {/* Contact Number */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, my: 0.5 }}>
                <PhoneIcon sx={{ color: '#94A3B8', fontSize: 15 }} />
                <Typography sx={{ fontSize: '0.8rem' }}>
                  <a href={`tel:${customer.contactNumber}`} style={{ textDecoration: 'none', color: '#1D5F99', fontWeight: 600 }}>
                    {customer.contactNumber}
                  </a>
                </Typography>
              </Box>

              <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

              {/* Financial Key Highlights */}
              <Grid container spacing={1.5} sx={{ my: 0.5 }}>
                <Grid item xs={6}>
                  <Typography sx={{ color: '#64748B', fontSize: '0.725rem' }}>Current Bal.</Typography>
                  <Typography sx={{ 
                    fontWeight: 700, 
                    fontSize: '0.825rem', 
                    mt: 0.25,
                    color: customer.currentBalance > 0 ? '#DC2626' : customer.currentBalance < 0 ? '#059669' : '#64748B'
                  }}>
                    ৳{customer.currentBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography sx={{ color: '#64748B', fontSize: '0.725rem' }}>Total Due</Typography>
                  <Typography sx={{ color: '#DC2626', fontWeight: 700, fontSize: '0.825rem', mt: 0.25 }}>
                    ৳{customer.totalDue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

              {/* Micro-summaries Grid */}
              <Grid container spacing={1} sx={{ my: 0.5, bgcolor: '#F8FAFC', p: 1, borderRadius: '6px' }}>
                <Grid item xs={6}>
                  <Typography sx={{ color: '#64748B', fontSize: '0.675rem' }}>Opening Bal.</Typography>
                  <Typography sx={{ color: '#334155', fontWeight: 500, fontSize: '0.75rem' }}>
                    ৳{customer.openingBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography sx={{ color: '#64748B', fontSize: '0.675rem' }}>Credit Limit</Typography>
                  <Typography sx={{ color: '#334155', fontWeight: 500, fontSize: '0.75rem' }}>
                    ৳{customer.creditLimit?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Typography>
                </Grid>
                <Grid item xs={6} sx={{ mt: 0.5 }}>
                  <Typography sx={{ color: '#64748B', fontSize: '0.675rem' }}>Total Sales</Typography>
                  <Typography sx={{ color: '#2563EB', fontWeight: 600, fontSize: '0.75rem' }}>
                    ৳{customer.totalSales?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Typography>
                </Grid>
                <Grid item xs={6} sx={{ mt: 0.5 }}>
                  <Typography sx={{ color: '#64748B', fontSize: '0.675rem' }}>Total Payments</Typography>
                  <Typography sx={{ color: '#059669', fontWeight: 600, fontSize: '0.75rem' }}>
                    ৳{customer.totalPayments?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ borderStyle: 'dashed', my: 1.5 }} />

              {/* Actions Footer */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ViewIcon fontSize="small" />}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setViewDialogOpen(true);
                  }}
                  sx={{
                    color: '#059669',
                    borderColor: 'rgba(5, 150, 105, 0.3)',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    px: 1.5,
                    py: 0.5,
                    '&:hover': {
                      borderColor: '#059669',
                      bgcolor: 'rgba(5, 150, 105, 0.04)'
                    }
                  }}
                >
                  Details
                </Button>
                {user?.permissions?.contacts?.update && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon fontSize="small" />}
                    onClick={() => navigate(`/dashboard/contacts/edit/${customer._id}`)}
                    sx={{
                      color: '#1D5F99',
                      borderColor: 'rgba(29, 95, 153, 0.3)',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      px: 1.5,
                      py: 0.5,
                      '&:hover': {
                        borderColor: '#1D5F99',
                        bgcolor: 'rgba(29, 95, 153, 0.04)'
                      }
                    }}
                  >
                    Edit
                  </Button>
                )}
                {user?.permissions?.contacts?.delete && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon fontSize="small" />}
                    onClick={() => {
                      setCustomerIdToDelete(customer._id);
                      setDeleteDialogOpen(true);
                    }}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      px: 1.5,
                      py: 0.5
                    }}
                  >
                    Delete
                  </Button>
                )}
              </Box>
            </Card>
          ))
        ) : (
          <Paper elevation={0} sx={{ p: 3, textAlign: 'center', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#64748B' }}>
            No customers found.
          </Paper>
        )}
      </Box>

      {/* Pagination */}
      {!isLoading && filteredCustomers.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            mt: 2,
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            bgcolor: '#fff',
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontFamily: '"Outfit", sans-serif',
              fontSize: '0.825rem',
            }
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: { bgcolor: '#FFFFFF', color: '#1E293B', borderRadius: '8px', border: '1px solid #E2E8F0' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem', py: 1.5 }}>Confirm Delete</DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <DialogContentText sx={{ color: '#64748B', fontSize: '0.875rem' }}>
            Are you sure you want to delete this customer? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5, pt: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} size="small" sx={{ color: '#64748B', textTransform: 'none', fontSize: '0.8rem' }}>Cancel</Button>
          <Button
            onClick={() => deleteCustomerMutation.mutate(customerIdToDelete)}
            variant="contained"
            color="error"
            size="small"
            disabled={deleteCustomerMutation.isLoading}
            sx={{ borderRadius: '4px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
          >
            {deleteCustomerMutation.isLoading ? 'Deleting...' : 'Delete Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { 
            bgcolor: '#FFFFFF', 
            color: '#1E293B', 
            borderRadius: '12px', 
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }
        }}
      >
        {selectedCustomer && (
          <>
            {/* Modal Header with Gradient */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              px: 3, 
              py: 2.5, 
              background: 'linear-gradient(135deg, #1D5F99 0%, #42A2C2 100%)', 
              color: '#FFFFFF'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PersonIcon sx={{ fontSize: 24, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', fontFamily: '"Outfit", sans-serif', lineHeight: 1.2 }}>
                    {selectedCustomer.contactName}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', opacity: 0.85, fontFamily: '"Outfit", sans-serif' }}>
                    Customer Details Profile
                  </Typography>
                </Box>
              </Box>
              <IconButton 
                size="small" 
                onClick={() => setViewDialogOpen(false)}
                sx={{ color: '#FFFFFF', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.15)' } }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* Left side: Basic Profile Card */}
                <Grid item xs={12} md={7}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Contact & Business Info */}
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '8px', bgcolor: '#F8FAFC' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D5F99', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 18 }} /> Basic Information
                      </Typography>
                      <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                          <Typography sx={{ color: '#64748B', fontSize: '0.75rem' }}>Customer Type</Typography>
                          <Typography sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.85rem' }}>{selectedCustomer.customerType || 'Individual'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography sx={{ color: '#64748B', fontSize: '0.75rem' }}>Contact Number</Typography>
                          <Typography sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 14, color: '#64748B' }} /> {selectedCustomer.contactNumber}
                          </Typography>
                        </Grid>
                        {selectedCustomer.nidPassportNumber && (
                          <Grid item xs={6}>
                            <Typography sx={{ color: '#64748B', fontSize: '0.75rem' }}>NID / Passport</Typography>
                            <Typography sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.85rem' }}>{selectedCustomer.nidPassportNumber}</Typography>
                          </Grid>
                        )}
                        {selectedCustomer.guarantor && (
                          <Grid item xs={6}>
                            <Typography sx={{ color: '#64748B', fontSize: '0.75rem' }}>Guarantor</Typography>
                            <Typography sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.85rem' }}>{selectedCustomer.guarantor}</Typography>
                          </Grid>
                        )}
                        {selectedCustomer.alternativeContactNumber && (
                          <Grid item xs={6}>
                            <Typography sx={{ color: '#64748B', fontSize: '0.75rem' }}>Alt. Contact</Typography>
                            <Typography sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PhoneIcon sx={{ fontSize: 14, color: '#64748B' }} /> {selectedCustomer.alternativeContactNumber}
                            </Typography>
                          </Grid>
                        )}
                        {selectedCustomer.businessName && (
                          <Grid item xs={12}>
                            <Typography sx={{ color: '#64748B', fontSize: '0.75rem', mt: 0.5 }}>Business Name</Typography>
                            <Typography sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <BusinessIcon sx={{ fontSize: 14, color: '#64748B' }} /> {selectedCustomer.businessName}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>

                    {/* Employment Info */}
                    {(selectedCustomer.workplace || selectedCustomer.salary > 0) && (
                      <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '8px', bgcolor: '#F8FAFC' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D5F99', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BusinessIcon sx={{ fontSize: 18 }} /> Employment Details
                        </Typography>
                        <Grid container spacing={1.5}>
                          {selectedCustomer.workplace && (
                            <Grid item xs={12}>
                              <Typography sx={{ color: '#64748B', fontSize: '0.75rem' }}>Workplace</Typography>
                              <Typography sx={{ color: '#334155', fontWeight: 500, fontSize: '0.825rem', mt: 0.25 }}>
                                {selectedCustomer.workplace}
                              </Typography>
                            </Grid>
                          )}
                          {selectedCustomer.salary > 0 && (
                            <Grid item xs={12}>
                              <Typography sx={{ color: '#64748B', fontSize: '0.75rem', mt: 0.5 }}>Monthly Salary</Typography>
                              <Typography sx={{ color: '#334155', fontWeight: 500, fontSize: '0.825rem', mt: 0.25 }}>
                                ৳{selectedCustomer.salary?.toLocaleString('en-US')}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Paper>
                    )}

                    {/* Address & Route Info */}
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '8px', bgcolor: '#F8FAFC' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D5F99', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AddressIcon sx={{ fontSize: 18 }} /> Location & Logistics
                      </Typography>
                      <Grid container spacing={1.5}>
                        <Grid item xs={12}>
                          <Typography sx={{ color: '#64748B', fontSize: '0.75rem' }}>Billing / Shipping Address</Typography>
                          <Typography sx={{ color: '#334155', fontWeight: 500, fontSize: '0.825rem', mt: 0.25 }}>
                            {selectedCustomer.address || 'No address specified'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography sx={{ color: '#64748B', fontSize: '0.75rem', mt: 0.5 }}>Assigned Route / Territory</Typography>
                          <Typography sx={{ color: '#334155', fontWeight: 500, fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                            <RouteIcon sx={{ fontSize: 14, color: '#64748B' }} /> {selectedCustomer.route || 'No route assigned'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Internal Notes */}
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '8px', bgcolor: '#F8FAFC' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1D5F99', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NoteIcon sx={{ fontSize: 18 }} /> Internal Notes
                      </Typography>
                      <Typography sx={{ color: '#475569', fontSize: '0.8rem', fontStyle: selectedCustomer.note ? 'normal' : 'italic' }}>
                        {selectedCustomer.note || 'No notes or special instructions for this customer.'}
                      </Typography>
                    </Paper>
                  </Box>
                </Grid>

                {/* Right side: Premium Financial Summary */}
                <Grid item xs={12} md={5}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B', px: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WalletIcon sx={{ fontSize: 18, color: '#1D5F99' }} /> Financial Summary
                    </Typography>

                    {/* Card: Current Outstanding Balance */}
                    <Paper elevation={0} sx={{ 
                      p: 2, 
                      borderRadius: '8px', 
                      bgcolor: selectedCustomer.currentBalance > 0 ? 'rgba(239, 68, 68, 0.05)' : selectedCustomer.currentBalance < 0 ? 'rgba(16, 185, 129, 0.05)' : '#F8FAFC',
                      border: '1px solid',
                      borderColor: selectedCustomer.currentBalance > 0 ? 'rgba(239, 68, 68, 0.2)' : selectedCustomer.currentBalance < 0 ? 'rgba(16, 185, 129, 0.2)' : '#E2E8F0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Box>
                        <Typography sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 500 }}>Current Balance</Typography>
                        <Typography sx={{ 
                          fontSize: '1.25rem', 
                          fontWeight: 700, 
                          color: selectedCustomer.currentBalance > 0 ? '#DC2626' : selectedCustomer.currentBalance < 0 ? '#059669' : '#64748B',
                          fontFamily: '"Outfit", sans-serif'
                        }}>
                          ৳{selectedCustomer.currentBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                      <Box sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        bgcolor: selectedCustomer.currentBalance > 0 ? '#FEE2E2' : selectedCustomer.currentBalance < 0 ? '#D1FAE5' : '#E2E8F0',
                        color: selectedCustomer.currentBalance > 0 ? '#DC2626' : selectedCustomer.currentBalance < 0 ? '#059669' : '#64748B'
                      }}>
                        {selectedCustomer.currentBalance > 0 ? 'Due / Receivable' : selectedCustomer.currentBalance < 0 ? 'Advance Credit' : 'Balanced'}
                      </Box>
                    </Paper>

                    {/* Small grid of financial details */}
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <Paper elevation={0} sx={{ p: 1.5, border: '1px solid #E2E8F0', borderRadius: '8px', textAlign: 'center' }}>
                          <Typography sx={{ color: '#64748B', fontSize: '0.7rem' }}>Opening Balance</Typography>
                          <Typography sx={{ color: '#059669', fontWeight: 600, fontSize: '0.85rem', mt: 0.25 }}>
                            ৳{selectedCustomer.openingBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper elevation={0} sx={{ p: 1.5, border: '1px solid #E2E8F0', borderRadius: '8px', textAlign: 'center' }}>
                          <Typography sx={{ color: '#64748B', fontSize: '0.7rem' }}>Credit Limit</Typography>
                          <Typography sx={{ color: '#475569', fontWeight: 600, fontSize: '0.85rem', mt: 0.25 }}>
                            ৳{selectedCustomer.creditLimit?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 1.5, border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ color: '#64748B', fontSize: '0.75rem' }}>Total Purchased Sales</Typography>
                          <Typography sx={{ color: '#2563EB', fontWeight: 600, fontSize: '0.9rem' }}>
                            ৳{selectedCustomer.totalSales?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 1.5, border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ color: '#64748B', fontSize: '0.75rem' }}>Total Payments Received</Typography>
                          <Typography sx={{ color: '#059669', fontWeight: 600, fontSize: '0.9rem' }}>
                            ৳{selectedCustomer.totalPayments?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 1.5, border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(220, 38, 38, 0.02)' }}>
                          <Typography sx={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: 600 }}>Total Unpaid / Outstanding Due</Typography>
                          <Typography sx={{ color: '#DC2626', fontWeight: 700, fontSize: '0.9rem' }}>
                            ৳{selectedCustomer.totalDue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #E2E8F0', bgcolor: '#F8FAFC', display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                onClick={() => {
                  setViewDialogOpen(false);
                  navigate(`/dashboard/reports/all-sales-reports/customer-ledger?customerId=${selectedCustomer._id}`);
                }}
                variant="outlined"
                color="primary"
                size="small"
                sx={{ 
                  borderRadius: '6px', 
                  textTransform: 'none', 
                  fontWeight: 600, 
                  fontSize: '0.8rem',
                  borderColor: '#1D5F99',
                  color: '#1D5F99',
                  '&:hover': {
                    borderColor: '#42A2C2',
                    bgcolor: 'rgba(29, 95, 153, 0.04)'
                  }
                }}
              >
                View Account Ledger Statement
              </Button>
              <Button 
                onClick={() => setViewDialogOpen(false)} 
                variant="contained" 
                size="small"
                sx={{ 
                  bgcolor: '#64748B', 
                  '&:hover': { bgcolor: '#475569' }, 
                  borderRadius: '6px', 
                  textTransform: 'none', 
                  fontWeight: 600, 
                  fontSize: '0.8rem' 
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Customers;