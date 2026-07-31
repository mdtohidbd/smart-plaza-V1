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
  Person as PersonIcon,
  Phone as PhoneIcon,
  Visibility as ViewIcon,
  LocationOn as AddressIcon,
  Description as NoteIcon,
  AccountBalanceWallet as WalletIcon,
  Business as BusinessIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const Companies = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyIdToDelete, setCompanyIdToDelete] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
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

  const { data: companies, isLoading, error } = useQuery(
    'companies',
    async () => {
      const response = await api.get('/api/suppliers');
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  const deleteCompanyMutation = useMutation(
    (id) => api.delete(`/api/suppliers/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('companies');
        queryClient.invalidateQueries('customers');
        setDeleteDialogOpen(false);
      },
      onError: (error) => {
        console.error('Error deleting company:', error);
      }
    }
  );

  // Filter companies based on search term
  const filteredCompanies = useMemo(() => {
    if (!companies || !searchTerm) return companies || [];

    const term = searchTerm.toLowerCase();
    const filtered = companies.filter(company =>
      (company.name?.toLowerCase().includes(term)) ||
      company.contactNumber?.includes(term) ||
      (company.contactName?.toLowerCase().includes(term)) ||
      (company.email && company.email.toLowerCase().includes(term)) ||
      company.openingBalance.toString().includes(term) ||
      company.totalDue.toString().includes(term)
    );
    return filtered.sort((a, b) => {
      const matchWord = (str) => (str || '').toLowerCase().split(/\s+/).some(w => w.startsWith(term));
      const aStarts = matchWord(a.name) || matchWord(a.contactName) || matchWord(a.contactNumber);
      const bStarts = matchWord(b.name) || matchWord(b.contactName) || matchWord(b.contactNumber);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
  }, [companies, searchTerm]);

  const paginatedCompanies = useMemo(() => {
    return filteredCompanies.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredCompanies, page, rowsPerPage]);

  if (error) {
    return (
      <Box sx={{ p: 2, bgcolor: '#F8FAFC', minHeight: '80vh' }}>
        <Alert severity="error" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          Error loading companies: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, backgroundColor: '#F8FAFC', minHeight: '85vh' }}>
      {/* Compact Header Section */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 700, fontSize: '1.15rem', lineHeight: 1.2 }}>
            Companies & Suppliers
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: '0.8rem' }}>
            Manage your partner companies and supplier details
          </Typography>
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
          Add Company/Supplier
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
              placeholder="Search by company name, contact person or number..."
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
              Total Companies: <span style={{ color: '#1E293B', fontWeight: 600 }}>{filteredCompanies.length}</span>
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Companies Table */}
      <TableContainer component={Paper} elevation={0} sx={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <Table sx={{ minWidth: 800 }} size="small">
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ py: 1, color: '#475569', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>Company/Supplier Details</TableCell>
              <TableCell sx={{ py: 1, color: '#475569', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>Contact Person</TableCell>
              <TableCell sx={{ py: 1, color: '#475569', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>Contact Info</TableCell>
              <TableCell align="right" sx={{ py: 1, color: '#475569', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>Opening Bal.</TableCell>
              <TableCell align="right" sx={{ py: 1, color: '#475569', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>Total Due</TableCell>
              <TableCell align="center" sx={{ py: 1, color: '#475569', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map((item) => (
                <TableRow key={item}>
                  <TableCell sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Skeleton variant="circular" width={30} height={30} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="40%" />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="70%" /></TableCell>
                  <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="80%" /></TableCell>
                  <TableCell align="right" sx={{ py: 1.5 }}><Skeleton variant="text" width="50%" /></TableCell>
                  <TableCell align="right" sx={{ py: 1.5 }}><Skeleton variant="text" width="60%" /></TableCell>
                  <TableCell align="center" sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Skeleton variant="circular" width={28} height={28} />
                      <Skeleton variant="circular" width={28} height={28} />
                      <Skeleton variant="circular" width={28} height={28} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedCompanies.length > 0 ? (
              paginatedCompanies.map((company) => (
                <TableRow key={company._id} sx={{ '&:hover': { bgcolor: '#F8FAFC' }, '& td': { borderBottom: '1px solid #F1F5F9' } }}>
                  <TableCell sx={{ py: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 30, height: 30, bgcolor: 'rgba(29, 95, 153, 0.1)', color: '#1D5F99', fontWeight: 600, fontSize: '0.875rem' }}>
                        {company.name ? company.name[0].toUpperCase() : 'S'}
                      </Avatar>
                      <Box>
                        <Typography sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.875rem' }}>{company.name}</Typography>
                        <Typography sx={{ color: '#64748B', fontSize: '0.7rem' }}>Email: {company.email || 'N/A'}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon sx={{ color: '#94A3B8', fontSize: 15 }} />
                      <Typography sx={{ color: '#334155', fontSize: '0.825rem' }}>{company.contactName}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon sx={{ color: '#94A3B8', fontSize: 15 }} />
                      <Typography sx={{ color: '#334155', fontSize: '0.825rem' }}>{company.contactNumber}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.75 }}>
                    <Typography sx={{ color: '#1E293B', fontWeight: 500, fontSize: '0.825rem' }}>৳{company.openingBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.75 }}>
                    <Chip
                      label={`৳${company.totalDue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.75rem',
                        bgcolor: company.totalDue > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: company.totalDue > 0 ? '#EF4444' : '#10B981',
                        fontWeight: 600,
                        borderRadius: '4px'
                      }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ py: 0.75 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedCompany(company);
                            setViewDialogOpen(true);
                          }}
                          sx={{ color: '#059669', bgcolor: 'rgba(5, 150, 105, 0.06)', '&:hover': { bgcolor: 'rgba(5, 150, 105, 0.12)' }, p: 0.5 }}
                        >
                          <ViewIcon fontSize="small" sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      {user?.permissions?.contacts?.update && (
                        <Tooltip title="Edit Company/Supplier">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/dashboard/contacts/edit/${company._id}`)}
                            sx={{ color: '#1D5F99', bgcolor: 'rgba(29, 95, 153, 0.06)', '&:hover': { bgcolor: 'rgba(29, 95, 153, 0.12)' }, p: 0.5 }}
                          >
                            <EditIcon fontSize="small" sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {user?.permissions?.contacts?.delete && (
                        <Tooltip title="Delete Company/Supplier">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setCompanyIdToDelete(company._id);
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
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#64748B' }}>
                  No companies or suppliers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {!isLoading && filteredCompanies.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredCompanies.length}
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
            Are you sure you want to delete this company/supplier? This action cannot be undone and may affect related transactions.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5, pt: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} size="small" sx={{ color: '#64748B', textTransform: 'none', fontSize: '0.8rem' }}>Cancel</Button>
          <Button
            onClick={() => deleteCompanyMutation.mutate(companyIdToDelete)}
            variant="contained"
            color="error"
            size="small"
            disabled={deleteCompanyMutation.isLoading}
            sx={{ borderRadius: '4px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
          >
            {deleteCompanyMutation.isLoading ? 'Deleting...' : 'Delete Company/Supplier'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Company / Supplier Details Dialog */}
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
        {selectedCompany && (
          <>
            {/* Modal Header with Gradient */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 3,
              py: 2.5,
              background: 'linear-gradient(135deg, #0D9488 0%, #059669 100%)',
              color: '#FFFFFF'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <BusinessIcon sx={{ fontSize: 24, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', fontFamily: '"Outfit", sans-serif', lineHeight: 1.2 }}>
                    {selectedCompany.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', opacity: 0.85, fontFamily: '"Outfit", sans-serif' }}>
                    Company / Supplier Details Profile
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
                    {/* Company Details Info */}
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '8px', bgcolor: '#F8FAFC' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0D9488', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon sx={{ fontSize: 18 }} /> Business Registry Information
                      </Typography>
                      <Grid container spacing={1.5}>
                        <Grid item xs={12}>
                          <Typography sx={{ color: '#64748B', fontSize: '0.75rem' }}>Supplier / Company Name</Typography>
                          <Typography sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.85rem' }}>{selectedCompany.name}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography sx={{ color: '#64748B', fontSize: '0.75rem', mt: 0.5 }}>Email Address</Typography>
                          <Typography sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.85rem' }}>
                            {selectedCompany.email || 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Contact Person Details */}
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '8px', bgcolor: '#F8FAFC' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0D9488', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 18 }} /> Primary Contact Representative
                      </Typography>
                      <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                          <Typography sx={{ color: '#64748B', fontSize: '0.75rem' }}>Contact Person Name</Typography>
                          <Typography sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.85rem' }}>{selectedCompany.contactName || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography sx={{ color: '#64748B', fontSize: '0.75rem' }}>Representative Contact Number</Typography>
                          <Typography sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 14, color: '#64748B' }} /> {selectedCompany.contactNumber}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Location Address */}
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '8px', bgcolor: '#F8FAFC' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0D9488', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AddressIcon sx={{ fontSize: 18 }} /> Location Address
                      </Typography>
                      <Typography sx={{ color: '#334155', fontWeight: 500, fontSize: '0.825rem', mt: 0.25 }}>
                        {selectedCompany.address || 'No location or postal address specified for this company.'}
                      </Typography>
                    </Paper>

                    {/* Internal Notes */}
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '8px', bgcolor: '#F8FAFC' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0D9488', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NoteIcon sx={{ fontSize: 18 }} /> Supplier / Corporate Notes
                      </Typography>
                      <Typography sx={{ color: '#475569', fontSize: '0.8rem', fontStyle: selectedCompany.note ? 'normal' : 'italic' }}>
                        {selectedCompany.note || 'No internal remarks or shipping/credit terms noted.'}
                      </Typography>
                    </Paper>
                  </Box>
                </Grid>

                {/* Right side: Financial Summary */}
                <Grid item xs={12} md={5}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B', px: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WalletIcon sx={{ fontSize: 18, color: '#0D9488' }} /> Accounts Payable Snapshot
                    </Typography>

                    {/* Card: Outstanding Due to Supplier */}
                    <Paper elevation={0} sx={{
                      p: 2.5,
                      borderRadius: '8px',
                      bgcolor: selectedCompany.totalDue > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                      border: '1px solid',
                      borderColor: selectedCompany.totalDue > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1
                    }}>
                      <Typography sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 500 }}>Total Outstanding Due (Payable)</Typography>
                      <Typography sx={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: selectedCompany.totalDue > 0 ? '#DC2626' : '#059669',
                        fontFamily: '"Outfit", sans-serif'
                      }}>
                        ৳{selectedCompany.totalDue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </Typography>
                      <Box sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        alignSelf: 'flex-start',
                        bgcolor: selectedCompany.totalDue > 0 ? '#FEE2E2' : '#D1FAE5',
                        color: selectedCompany.totalDue > 0 ? '#DC2626' : '#059669'
                      }}>
                        {selectedCompany.totalDue > 0 ? 'Outstanding Payable' : 'Accounts Clear'}
                      </Box>
                    </Paper>

                    {/* Opening Balance card */}
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ color: '#64748B', fontSize: '0.75rem' }}>Opening Balance</Typography>
                        <Typography sx={{ color: '#334155', fontWeight: 600, fontSize: '0.9rem', mt: 0.25 }}>
                          ৳{selectedCompany.openingBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: 'rgba(71, 85, 105, 0.05)', p: 1, borderRadius: '6px' }}>
                        <WalletIcon sx={{ fontSize: 20, color: '#64748B' }} />
                      </Box>
                    </Paper>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #E2E8F0', bgcolor: '#F8FAFC', display: 'flex', justifyContent: 'space-between' }}>
              <Button
                onClick={() => {
                  setViewDialogOpen(false);
                  navigate(`/dashboard/reports/purchase/supplier-ledger?companyId=${selectedCompany._id}`);
                }}
                variant="outlined"
                color="primary"
                size="small"
                sx={{
                  borderRadius: '6px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  borderColor: '#0D9488',
                  color: '#0D9488',
                  '&:hover': {
                    borderColor: '#059669',
                    bgcolor: 'rgba(13, 148, 136, 0.04)'
                  }
                }}
              >
                View Supplier Ledger Statement
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

export default Companies;