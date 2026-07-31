import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import useShopRefresh from '../../hooks/useShopRefresh';
import { Search as SearchIcon, Close as CloseIcon, CheckCircleOutline as CheckCircleOutlineIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import ExportButtons from '../../components/ExportButtons';
import PurchaseInvoiceDetailsModal from '../../components/PurchaseInvoiceDetailsModal';

const getLocalDateTimeString = () => {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now - tzOffset).toISOString().slice(0, 16);
};

const PurchaseDuePayment = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { activeShop } = useAuth();
  
  const [formData, setFormData] = useState({
    supplier: '',
    date: getLocalDateTimeString(),
    amount: '',
    description: ''
  });

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);
  const [openInvoiceDetailsModal, setOpenInvoiceDetailsModal] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch all suppliers for list and dropdown
  const { data: allSuppliers, isLoading: suppliersLoading, error: suppliersError, refetch } = useQuery(
    ['suppliers', activeShop?._id], 
    async () => {
      const response = await api.get('/api/suppliers');
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  const sortedSuppliers = useMemo(() => {
    if (!allSuppliers) return [];
    return [...allSuppliers].sort((a, b) => {
      // Primary sort: has due > 0 vs no due
      const aHasDue = (a.totalDue || 0) > 0;
      const bHasDue = (b.totalDue || 0) > 0;
      if (aHasDue && !bHasDue) return -1;
      if (!aHasDue && bHasDue) return 1;
      
      // Secondary sort: amount of due (descending)
      if (aHasDue && bHasDue) {
         return (b.totalDue || 0) - (a.totalDue || 0);
      }
      
      // Tertiary sort: name (alphabetical) for those without due
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [allSuppliers]);

  // Fetch persistent due payments from backend
  const { data: persistentDuePayments, isLoading: paymentsLoading, refetch: refetchPayments } = useQuery(
    ['duePayments', activeShop?._id],
    async () => {
      const response = await api.get('/api/purchases/due-payments');
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  // Automatically refresh data when shop changes
  useShopRefresh(() => {
    refetch();
    refetchPayments();
  });

  const [paymentSearchTerm, setPaymentSearchTerm] = useState('');

  const filteredDuePayments = useMemo(() => {
    if (!persistentDuePayments || !paymentSearchTerm) return persistentDuePayments || [];
    const term = paymentSearchTerm.toLowerCase();
    return persistentDuePayments.filter(log =>
      log.reference?.toLowerCase().includes(term) ||
      log.paymentMethod?.toLowerCase().includes(term) ||
      log.amount?.toString().includes(term) ||
      (log.description && log.description.toLowerCase().includes(term))
    );
  }, [persistentDuePayments, paymentSearchTerm]);

  const exportColumns = [
    { label: 'Reference / Supplier', accessor: 'reference' },
    { label: 'Payment Method', accessor: 'paymentMethod' },
    { label: 'Amount Paid', accessor: (row) => `৳${row.amount?.toFixed(2)}` },
    { label: 'Payment Date', accessor: (row) => new Date(row.date).toLocaleDateString() },
    { label: 'Logged Time', accessor: (row) => `${new Date(row.date).toLocaleDateString()} ${new Date(row.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}` },
    { label: 'Description', accessor: (row) => row.description || '' }
  ];

  // Mutation for due payment
  const duePaymentMutation = useMutation(
    (data) => api.post('/api/purchases/due-payment', data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('purchases');
        queryClient.invalidateQueries('dashboardData');
        queryClient.invalidateQueries('suppliersWithDues');
        queryClient.invalidateQueries('suppliers');
        queryClient.invalidateQueries('duePayments');
        
        // Save success data
        setPaymentSuccessData(response.data.data);
        
        // Reset form
        setFormData({
          supplier: '',
          date: getLocalDateTimeString(),
          amount: '',
          description: ''
        });
        
        refetch();
        refetchPayments();
      },
      onError: (error) => {
        console.error('Error recording due payment:', error);
        setError(error.response?.data?.message || 'Error recording due payment');
        setTimeout(() => setError(''), 5000);
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    duePaymentMutation.mutate({
      supplier: formData.supplier,
      amount: Number(formData.amount),
      date: formData.date,
      description: formData.description,
      paymentMethod: 'Cash'
    });
  };

  return (
    <Box sx={{ py: { xs: 1, sm: 1.5 }, backgroundColor: '#F8FAFC' }}>
      <Grid container spacing={1.5}>
        
        {/* Suppliers with Outstanding Dues */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              backgroundColor: '#fff',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#1e293b' }}>
              Supplier Due Status
            </Typography>

            {suppliersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : sortedSuppliers && sortedSuppliers.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: '500px', overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '4px' } }}>
                <Grid container spacing={2}>
                  {sortedSuppliers.map((supplier) => {
                    const hasDue = (supplier.totalDue || 0) > 0;
                    return (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={supplier._id}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            border: '1px solid #eaeef3',
                            borderRadius: '8px',
                            backgroundColor: hasDue ? '#fff' : '#f8fafc',
                            opacity: hasDue ? 1 : 0.6,
                            boxShadow: hasDue ? '0 1px 3px rgba(0,0,0,0.02)' : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: hasDue ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                              borderColor: hasDue ? '#cbd5e1' : '#eaeef3'
                            }
                          }}
                        >
                          <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: hasDue ? '#1e293b' : '#64748b', lineHeight: 1.2 }}>
                                {supplier.name}
                              </Typography>
                              {hasDue && (
                                <Box sx={{ 
                                  backgroundColor: '#fee2e2', 
                                  color: '#dc2626', 
                                  px: 1, 
                                  py: 0.25, 
                                  borderRadius: '12px', 
                                  fontSize: '11px', 
                                  fontWeight: 600 
                                }}>
                                  Due
                                </Box>
                              )}
                            </Box>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                              <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                👤 {supplier.contactName || 'N/A'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                📞 {supplier.contactNumber || 'N/A'}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ backgroundColor: hasDue ? '#fff1f2' : '#f1f5f9', p: 1.5, borderRadius: '6px', mb: 2 }}>
                              <Typography variant="caption" sx={{ color: hasDue ? '#e11d48' : '#94a3b8', fontWeight: 600, display: 'block' }}>
                                OUTSTANDING DUE
                              </Typography>
                              <Typography variant="h6" sx={{ color: hasDue ? '#dc2626' : '#94a3b8', fontWeight: 700, mt: 0.2, lineHeight: 1 }}>
                                ৳{(supplier.totalDue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </Typography>
                            </Box>
                          </Box>

                          <Button
                            fullWidth
                            variant={hasDue ? "contained" : "outlined"}
                            disabled={!hasDue}
                            onClick={() => {
                              if (hasDue) {
                                setSelectedSupplier(supplier);
                                setFormData({
                                  supplier: supplier._id,
                                  date: getLocalDateTimeString(),
                                  amount: '',
                                  description: ''
                                });
                                setPaymentSuccessData(null);
                                setOpenPaymentModal(true);
                              }
                            }}
                            sx={{
                              backgroundColor: hasDue ? '#1D5F99' : 'transparent',
                              borderColor: hasDue ? 'transparent' : '#cbd5e1',
                              color: hasDue ? '#fff' : '#94a3b8',
                              borderRadius: '6px',
                              fontWeight: 600,
                              textTransform: 'none',
                              py: 0.75,
                              boxShadow: hasDue ? '0 2px 4px rgba(29, 95, 153, 0.2)' : 'none',
                              '&:hover': {
                                backgroundColor: hasDue ? '#154a7b' : 'transparent',
                                boxShadow: hasDue ? '0 4px 8px rgba(29, 95, 153, 0.3)' : 'none',
                              },
                            }}
                          >
                            {hasDue ? 'Pay Due' : 'Cleared'}
                          </Button>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            ) : (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  textAlign: 'center', 
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #eaeef3',
                  borderRadius: '8px'
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  No suppliers found.
                </Typography>
              </Paper>
            )}
          </Paper>
        </Grid>

        {/* Payment Modal Dialog */}
        <Dialog
          open={openPaymentModal}
          onClose={() => {
            if (!duePaymentMutation.isLoading) {
              setOpenPaymentModal(false);
              setPaymentSuccessData(null);
            }
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '12px',
              fontFamily: '"Outfit", sans-serif'
            }
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              py: 2,
              px: 3
            }}
          >
            <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, fontSize: '1.1rem', fontFamily: '"Outfit", sans-serif' }}>
              {paymentSuccessData ? 'Payment Receipt' : 'Record Due Payment'}
            </Typography>
            <IconButton
              onClick={() => {
                setOpenPaymentModal(false);
                setPaymentSuccessData(null);
              }}
              disabled={duePaymentMutation.isLoading}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
                {error}
              </Alert>
            )}

            {!paymentSuccessData ? (
              // Form View
              <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 2.5, p: 2, bgcolor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FEE2E2' }}>
                  <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 700, letterSpacing: '0.5px' }}>
                    SUPPLIER DETAILS
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mt: 0.5 }}>
                    {selectedSupplier?.name}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                      Outstanding Due:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#EF4444' }}>
                      ৳{selectedSupplier?.totalDue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Date & Time"
                      type="datetime-local"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      InputProps={{
                        sx: { borderRadius: '8px' }
                      }}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Payment Amount"
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      inputProps={{
                        min: 1,
                        max: selectedSupplier?.totalDue,
                        step: "any"
                      }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                        sx: { borderRadius: '8px' }
                      }}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Description / Notes"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      multiline
                      rows={2}
                      placeholder="Enter any reference, receipt numbers, etc."
                      InputProps={{
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setOpenPaymentModal(false)}
                    sx={{ textTransform: 'none', borderRadius: '8px' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={duePaymentMutation.isLoading}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '8px',
                      bgcolor: '#1D5F99',
                      px: 3,
                      '&:hover': { bgcolor: '#154a7b' }
                    }}
                  >
                    {duePaymentMutation.isLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : 'Confirm Payment'}
                  </Button>
                </Box>
              </form>
            ) : (
              // Success Receipt View
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 2 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: '4.5rem', color: '#10B981', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B', mb: 1 }}>
                  Payment Successful
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                  The payment has been successfully recorded and synced with the supplier ledger.
                </Typography>

                <Paper variant="outlined" sx={{ width: '100%', p: 2.5, borderRadius: '10px', bgcolor: '#F8FAFC', mb: 3, border: '1px dashed #CBD5E1' }}>
                  <Grid container spacing={1.5} sx={{ textAlign: 'left' }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>SUPPLIER</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{paymentSuccessData.supplier?.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>PAYMENT DATE & TIME</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                        {new Date(paymentSuccessData.expense?.date).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>AMOUNT PAID</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#10B981' }}>
                        ৳{paymentSuccessData.expense?.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>REMAINING DUE</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: paymentSuccessData.supplier?.totalDue > 0 ? '#EF4444' : '#10B981' }}>
                        ৳{paymentSuccessData.supplier?.totalDue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {paymentSuccessData.updatedPurchases && paymentSuccessData.updatedPurchases.length > 0 && (
                  <Box sx={{ width: '100%', textAlign: 'left', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ReceiptIcon fontSize="small" /> Allocated Purchase Invoices
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {paymentSuccessData.updatedPurchases.map((purchase) => (
                        <Paper
                          key={purchase._id}
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: '#1D5F99',
                              bgcolor: '#F0F9FF'
                            }
                          }}
                        >
                          <Box>
                            <Typography
                              variant="subtitle2"
                              onClick={() => {
                                setSelectedPurchaseId(purchase._id);
                                setOpenInvoiceDetailsModal(true);
                              }}
                              sx={{
                                fontWeight: 700,
                                color: '#1D5F99',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                display: 'inline-block'
                              }}
                            >
                              {purchase.purchaseNumber}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', color: '#64748B' }}>
                              Remaining Bill Due: ৳{purchase.dueAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: purchase.status === 'Completed' ? '#E8F5E9' : '#FFF3E0',
                              color: purchase.status === 'Completed' ? '#2E7D32' : '#ED6C02'
                            }}>
                              {purchase.status}
                            </span>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}

                <Box sx={{ mt: 3, width: '100%' }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      setOpenPaymentModal(false);
                      setPaymentSuccessData(null);
                    }}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '8px',
                      bgcolor: '#1D5F99',
                      py: 1,
                      fontWeight: 600,
                      '&:hover': { bgcolor: '#154a7b' }
                    }}
                  >
                    Done
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Invoice details modal */}
        <PurchaseInvoiceDetailsModal
          open={openInvoiceDetailsModal}
          onClose={() => {
            setOpenInvoiceDetailsModal(false);
            setSelectedPurchaseId(null);
          }}
          purchaseId={selectedPurchaseId}
        />

        {/* Recently Logged Payments (Now below the form!) */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              backgroundColor: '#fff',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1.5, mb: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                Logged Payments History
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
                <TextField
                  size="small"
                  variant="outlined"
                  placeholder="Search payments..."
                  value={paymentSearchTerm}
                  onChange={(e) => setPaymentSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '6px', fontSize: '0.8rem', width: { xs: '100%', sm: '200px' } }
                  }}
                />
                <ExportButtons
                  data={filteredDuePayments || []}
                  columns={exportColumns}
                  filename="logged_due_payments"
                  title="Logged Due Payments History"
                />
              </Box>
            </Box>

            {paymentsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : filteredDuePayments && filteredDuePayments.length > 0 ? (
              isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {filteredDuePayments.map((log) => (
                    <Paper
                      key={log._id}
                      elevation={0}
                      sx={{
                        p: 1.5,
                        border: '1px solid #eaeef3',
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {log.reference || 'N/A'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              fontWeight: 500
                            }}>
                              💳 {log.paymentMethod}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              fontWeight: 500
                            }}>
                              📅 {new Date(log.date).toLocaleDateString()}
                            </span>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, display: 'block' }}>
                            AMOUNT PAID
                          </Typography>
                          <Typography variant="subtitle2" sx={{ color: '#059669', fontWeight: 700, mt: 0.2 }}>
                            ৳{log.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {log.description && (
                        <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #eaeef3' }}>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                            Description:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#475569', fontStyle: 'italic', fontSize: '12px' }}>
                            {log.description}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '10px' }}>
                          Logged: {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <TableContainer sx={{ border: '1px solid #eaeef3', borderRadius: '8px' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                        <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '13px', py: 1 }}>Reference / Supplier</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '13px', py: 1 }}>Payment Method</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', fontSize: '13px', py: 1 }}>Amount Paid</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '13px', py: 1 }}>Payment Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '13px', py: 1 }}>Logged Time</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '13px', py: 1 }}>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredDuePayments.map((log) => (
                        <TableRow
                          key={log._id}
                          sx={{
                            '&:hover': {
                              backgroundColor: '#f8fafc',
                            },
                          }}
                        >
                          <TableCell sx={{ color: '#1e293b', fontWeight: 500, py: 1 }}>{log.reference || 'N/A'}</TableCell>
                          <TableCell sx={{ color: '#475569', py: 1 }}>{log.paymentMethod}</TableCell>
                          <TableCell align="right" sx={{ color: '#059669', fontWeight: 600, py: 1 }}>
                            ৳{log.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell sx={{ color: '#475569', py: 1 }}>{new Date(log.date).toLocaleDateString()}</TableCell>
                          <TableCell sx={{ color: '#64748b', py: 1, fontSize: '12px' }}>
                            {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                          </TableCell>
                          <TableCell sx={{ color: '#64748b', py: 1 }}>{log.description || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
            ) : (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  textAlign: 'center', 
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #eaeef3',
                  borderRadius: '8px'
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  No payments logged yet.
                </Typography>
              </Paper>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PurchaseDuePayment;