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
  Grid,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Chip,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment,
  Skeleton
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Search as SearchIcon, Visibility as VisibilityIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import ExportButtons from '../../components/ExportButtons';
import PurchaseInvoiceDetailsModal from '../../components/PurchaseInvoiceDetailsModal';

const AllPurchases = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { user } = useAuth();
  const navigate = useNavigate();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);
  const [viewPurchaseId, setViewPurchaseId] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    (id) => api.delete(`/api/purchases/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('purchases');
        setOpenDeleteDialog(false);
        setPurchaseToDelete(null);
      },
      onError: (error) => {
        console.error('Error deleting purchase:', error);
      }
    }
  );

  const { data: purchases, isLoading, error } = useQuery(
    'purchases',
    async () => {
      const response = await api.get('/api/purchases');
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  const filteredPurchases = useMemo(() => {
    if (!purchases || !searchTerm) return purchases || [];
    const term = searchTerm.toLowerCase();
    const filtered = purchases.filter(p =>
      p.purchaseNumber?.toLowerCase().includes(term) ||
      (p.supplier?.name && p.supplier.name.toLowerCase().includes(term)) ||
      p.status?.toLowerCase().includes(term) ||
      p.total?.toString().includes(term) ||
      p.dueAmount?.toString().includes(term)
    );
    return filtered.sort((a, b) => {
      const aStarts = (a.purchaseNumber || '').toLowerCase().startsWith(term) ||
                      (a.supplier?.name || '').toLowerCase().startsWith(term);
      const bStarts = (b.purchaseNumber || '').toLowerCase().startsWith(term) ||
                      (b.supplier?.name || '').toLowerCase().startsWith(term);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
  }, [purchases, searchTerm]);

  const exportColumns = [
    { label: 'Purchase #', accessor: 'purchaseNumber' },
    { label: 'Supplier', accessor: (row) => row.supplier?.name || 'N/A' },
    { label: 'Date', accessor: (row) => new Date(row.date).toLocaleDateString() },
    { label: 'Total', accessor: (row) => `৳${row.total?.toFixed(2)}` },
    { label: 'Paid', accessor: (row) => `৳${row.paidAmount?.toFixed(2)}` },
    { label: 'Due', accessor: (row) => `৳${row.dueAmount?.toFixed(2)}` },
    { label: 'Status', accessor: 'status' }
  ];

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="rectangular" width={300} height={40} sx={{ borderRadius: 1 }} />
        </Box>
        <Paper elevation={0} sx={{ border: '1px solid #eaeef3', borderRadius: '8px', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                  <TableCell><Skeleton variant="text" width={100} /></TableCell>
                  <TableCell><Skeleton variant="text" width={120} /></TableCell>
                  <TableCell><Skeleton variant="text" width={80} /></TableCell>
                  <TableCell><Skeleton variant="text" width={80} /></TableCell>
                  <TableCell><Skeleton variant="text" width={80} /></TableCell>
                  <TableCell><Skeleton variant="text" width={80} /></TableCell>
                  <TableCell><Skeleton variant="text" width={80} /></TableCell>
                  <TableCell><Skeleton variant="text" width={80} /></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                  <TableRow key={item}>
                    <TableCell><Skeleton variant="text" width={120} /></TableCell>
                    <TableCell><Skeleton variant="text" width={150} /></TableCell>
                    <TableCell><Skeleton variant="text" width={90} /></TableCell>
                    <TableCell><Skeleton variant="text" width={70} /></TableCell>
                    <TableCell><Skeleton variant="text" width={70} /></TableCell>
                    <TableCell><Skeleton variant="text" width={70} /></TableCell>
                    <TableCell><Skeleton variant="text" width={90} /></TableCell>
                    <TableCell><Skeleton variant="rectangular" width={80} height={30} sx={{ borderRadius: 1 }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Error loading purchases: {error.message}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 1, sm: 1.5 }, backgroundColor: '#F8FAFC' }}>
      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              mb: 1.5,
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              fontFamily: '"Outfit", sans-serif',
            }}
          >
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} sm={3} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconButton 
                  onClick={() => navigate('/dashboard')} 
                  sx={{ 
                    bgcolor: '#F1F5F9', 
                    '&:hover': { bgcolor: '#E2E8F0' },
                    borderRadius: '12px',
                    p: 1
                  }}
                >
                  <ArrowBackIcon sx={{ color: '#475569', fontSize: '1.1rem' }} />
                </IconButton>
                <Box>
                  <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, fontSize: '1.1rem' }}>
                    All Purchases
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                    Total purchase records: {filteredPurchases?.length || 0}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search by purchase #, supplier, status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '6px', fontSize: '0.85rem' }
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={5} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
                <ExportButtons
                  data={filteredPurchases || []}
                  columns={exportColumns}
                  filename="purchases"
                  title="Purchases Report"
                />
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/dashboard/purchase/add')}
                  sx={{
                    backgroundColor: '#1D5F99',
                    '&:hover': {
                      backgroundColor: '#42A2C2'
                    },
                    borderRadius: '6px',
                    fontWeight: 600,
                    textTransform: 'none',
                    py: 0.75
                  }}
                >
                  New Purchase
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              p: 0
            }}
          >
            {isMobile ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1.5, backgroundColor: '#F8FAFC' }}>
                {filteredPurchases?.map((purchase) => (
                  <Paper 
                    key={purchase._id} 
                    elevation={0}
                    sx={{ 
                      p: 2.5, 
                      borderRadius: '12px', 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1D5F99', mb: 0.5, fontSize: '0.95rem', fontFamily: '"Outfit", sans-serif' }}>
                          {purchase.purchaseNumber}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500, fontFamily: '"Outfit", sans-serif' }}>
                          {new Date(purchase.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip
                        label={purchase.status}
                        size="small"
                        sx={{
                          backgroundColor: purchase.status === 'Completed' ? '#ecfdf5' : purchase.status === 'Partial' ? '#fffbeb' : '#fef2f2',
                          color: purchase.status === 'Completed' ? '#059669' : purchase.status === 'Partial' ? '#d97706' : '#dc2626',
                          fontWeight: 700,
                          borderRadius: '8px',
                          fontSize: '11px',
                          height: '26px',
                          px: 1,
                          fontFamily: '"Outfit", sans-serif',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}
                      />
                    </Box>
                    <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Outfit", sans-serif' }}>
                        Supplier
                      </Typography>
                      <Typography variant="subtitle2" sx={{ color: '#0f172a', fontWeight: 700, fontSize: '0.9rem', fontFamily: '"Outfit", sans-serif' }}>
                        {purchase.supplier?.name || 'N/A'}
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                      <Grid item xs={4}>
                        <Box sx={{ backgroundColor: '#f8fafc', py: 1, px: 0.5, borderRadius: '8px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5, fontWeight: 500, fontFamily: '"Outfit", sans-serif' }}>Total</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', fontFamily: '"Outfit", sans-serif' }}>৳{purchase.total?.toFixed(2)}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ backgroundColor: '#ecfdf5', py: 1, px: 0.5, borderRadius: '8px', textAlign: 'center', border: '1px solid #d1fae5' }}>
                          <Typography variant="caption" sx={{ color: '#047857', display: 'block', mb: 0.5, fontWeight: 500, fontFamily: '"Outfit", sans-serif' }}>Paid</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#059669', fontFamily: '"Outfit", sans-serif' }}>৳{purchase.paidAmount?.toFixed(2)}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ backgroundColor: '#fef2f2', py: 1, px: 0.5, borderRadius: '8px', textAlign: 'center', border: '1px solid #fee2e2' }}>
                          <Typography variant="caption" sx={{ color: '#b91c1c', display: 'block', mb: 0.5, fontWeight: 500, fontFamily: '"Outfit", sans-serif' }}>Due</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#dc2626', fontFamily: '"Outfit", sans-serif' }}>৳{purchase.dueAmount?.toFixed(2)}</Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px dashed #e2e8f0', pt: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon fontSize="small" />}
                        onClick={() => {
                          setViewPurchaseId(purchase._id);
                          setOpenViewDialog(true);
                        }}
                        sx={{ 
                          borderRadius: '8px', 
                          textTransform: 'none', 
                          borderColor: '#bbf7d0', 
                          color: '#166534',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          fontFamily: '"Outfit", sans-serif',
                          px: 2,
                          '&:hover': {
                            backgroundColor: '#f0fdf4',
                            borderColor: '#86efac'
                          }
                        }}
                      >
                        View
                      </Button>
                      {user?.permissions?.purchase?.update && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditIcon fontSize="small" />}
                            onClick={() => {
                              alert('Edit functionality would redirect to purchase edit form for ID: ' + purchase._id);
                            }}
                            sx={{ 
                              borderRadius: '8px', 
                              textTransform: 'none', 
                              borderColor: '#dbeafe', 
                              color: '#1D5F99',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              fontFamily: '"Outfit", sans-serif',
                              px: 2,
                              '&:hover': {
                                backgroundColor: '#eff6ff',
                                borderColor: '#bfdbfe'
                              }
                            }}
                          >
                            Edit
                          </Button>
                        )}
                        {user?.permissions?.purchase?.delete && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon fontSize="small" />}
                            onClick={() => {
                              setPurchaseToDelete(purchase._id);
                              setOpenDeleteDialog(true);
                            }}
                            sx={{ 
                              borderRadius: '8px', 
                              textTransform: 'none', 
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              fontFamily: '"Outfit", sans-serif',
                              px: 2,
                              borderColor: '#fee2e2',
                              color: '#ef4444',
                              '&:hover': {
                                backgroundColor: '#fef2f2',
                                borderColor: '#fca5a5'
                              }
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <TableContainer sx={{ overflow: 'auto' }}>
                <Table
                  sx={{
                    minWidth: 800,
                    tableLayout: 'auto'
                  }}
                >
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: '#F8FAFC',
                        '& .MuiTableCell-head': {
                          color: '#475569',
                          fontWeight: '600',
                          fontSize: '13px',
                          py: 1,
                          borderBottom: '1px solid #eaeef3'
                        }
                      }}
                    >
                      <TableCell>Purchase Number</TableCell>
                      <TableCell>Supplier</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Paid</TableCell>
                      <TableCell align="right">Due</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPurchases?.map((purchase) => (
                      <TableRow
                        key={purchase._id}
                        sx={{
                          '&:hover': {
                            backgroundColor: '#f8fafc',
                          }
                        }}
                      >
                        <TableCell sx={{ py: 1, color: '#475569', fontSize: '13px' }}>
                          {purchase.purchaseNumber}
                          <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem' }}>
                            Challan: {purchase.challanNumber || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1, color: '#1e293b', fontWeight: 500, fontSize: '13px' }}>{purchase.supplier?.name || 'N/A'}</TableCell>
                        <TableCell sx={{ py: 1, color: '#475569', fontSize: '13px' }}>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                        <TableCell align="right" sx={{ py: 1, color: '#1e293b', fontWeight: '600', fontSize: '13px' }}>৳{purchase.total?.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ py: 1, color: '#059669', fontWeight: '600', fontSize: '13px' }}>৳{purchase.paidAmount?.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ py: 1, color: '#dc2626', fontWeight: '600', fontSize: '13px' }}>৳{purchase.dueAmount?.toFixed(2)}</TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <Chip
                            label={purchase.status}
                            size="small"
                            sx={{
                              backgroundColor: purchase.status === 'Completed' ? '#ecfdf5' : purchase.status === 'Partial' ? '#fffbeb' : '#fef2f2',
                              color: purchase.status === 'Completed' ? '#059669' : purchase.status === 'Partial' ? '#d97706' : '#dc2626',
                              fontWeight: 600,
                              borderRadius: '4px',
                              fontSize: '11px'
                            }}
                          />
                        </TableCell>
                          <TableCell align="center" sx={{ py: 1 }}>
                            <IconButton
                              color="info"
                              size="small"
                              onClick={() => {
                                setViewPurchaseId(purchase._id);
                                setOpenViewDialog(true);
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            {user?.permissions?.purchase?.update && (
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => {
                                  alert('Edit functionality would redirect to purchase edit form for ID: ' + purchase._id);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                            {user?.permissions?.purchase?.delete && (
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => {
                                  setPurchaseToDelete(purchase._id);
                                  setOpenDeleteDialog(true);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            Confirm Delete
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to delete this purchase record? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #eaeef3', bgcolor: '#F8FAFC' }}>
            <Button size="small" onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                deleteMutation.mutate(purchaseToDelete);
              }}
              color="error"
              autoFocus
              size="small"
              variant="contained"
              disabled={deleteMutation.isLoading}
              sx={{ textTransform: 'none' }}
            >
              {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Details Modal */}
        <PurchaseInvoiceDetailsModal 
          open={openViewDialog} 
          onClose={() => {
            setOpenViewDialog(false);
            setViewPurchaseId(null);
          }} 
          purchaseId={viewPurchaseId} 
        />
      </Grid>
    </Box>
  );
};

export default AllPurchases;