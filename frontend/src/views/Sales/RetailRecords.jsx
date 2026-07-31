import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Card,
  CardHeader,
  CardContent,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  TablePagination
} from '@mui/material';
import { 
  Search as SearchIcon, 
  PictureAsPdf as PictureAsPdfIcon, 
  Print as PrintIcon,
  Payment as PaymentIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link as RouterLink } from 'react-router-dom';
import api from '../../utils/api';
import useShopRefresh from '../../hooks/useShopRefresh';
import PrintInvoiceModal from '../../components/invoices/PrintInvoiceModal';
import ExportButtons from '../../components/ExportButtons';
import { formatDate } from '../../utils/dateUtils';

const RetailRecords = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Payment states
  const [selectedRecordForPayment, setSelectedRecordForPayment] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentMethod: 'Cash',
    date: new Date().toISOString().split('T')[0],
  });
  const [paymentError, setPaymentError] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const { data: retailRecordsData, isLoading: retailRecordsLoading, refetch } = useQuery(
    ['retail-records', page, rowsPerPage, searchTerm],
    async () => {
      const response = await api.get('/api/sales', {
        params: {
          type: 'retail',
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm
        }
      });
      return response.data;
    },
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  const retailRecords = retailRecordsData?.data || [];
  const totalRecords = retailRecordsData?.total || 0;

  // Automatically refresh data when shop changes
  useShopRefresh(refetch);

  // Payment mutation
  const paymentMutation = useMutation(
    async (data) => {
      const response = await api.put(`/api/sales/${selectedRecordForPayment._id}/payment`, {
        paidAmount: selectedRecordForPayment.paidAmount + Number(data.amount),
        dueAmount: selectedRecordForPayment.dueAmount - Number(data.amount),
        paymentMethod: data.paymentMethod
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('retail-records');
        queryClient.invalidateQueries('sales-with-dues');
        queryClient.invalidateQueries('dashboardData');
        refetch(); // Refetch the records
        
        // Show updated invoice modal immediately
        const saleId = selectedRecordForPayment._id;
        setCompletedSaleId(saleId);
        setShowInvoiceModal(true);

        handleClosePaymentModal();
      },
      onError: (error) => {
        console.error('Error collecting payment:', error);
        setPaymentError(error.response?.data?.message || 'Error collecting payment');
      }
    }
  );

  const handleOpenPaymentModal = (record) => {
    setSelectedRecordForPayment(record);
    setPaymentFormData({
      amount: record.dueAmount.toString(),
      paymentMethod: 'Cash',
      date: new Date().toISOString().split('T')[0],
    });
    setPaymentError('');
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedRecordForPayment(null);
    setPaymentError('');
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!paymentFormData.amount || Number(paymentFormData.amount) <= 0) {
      setPaymentError('Please enter a valid payment amount.');
      return;
    }
    if (Number(paymentFormData.amount) > selectedRecordForPayment.dueAmount) {
      setPaymentError(`Payment amount cannot exceed remaining due of ৳${selectedRecordForPayment.dueAmount}.`);
      return;
    }
    setPaymentError('');
    paymentMutation.mutate(paymentFormData);
  };

  // Client-side filtering replaced by backend search
  const filteredRecords = retailRecords;


  const printInvoice = (saleId) => {
    setCompletedSaleId(saleId);
    setShowInvoiceModal(true);
  };

  const getPaymentBreakdown = (sale) => {
    let cash = 0;
    let card = 0;
    let bank = 0;
    let mfs = 0;

    if (sale.payments && sale.payments.length > 0) {
      sale.payments.forEach(p => {
        const amt = parseFloat(p.amount) || 0;
        if (p.method === 'Cash') cash += amt;
        else if (p.method === 'Card') card += amt;
        else if (p.method === 'Bank') bank += amt;
        else if (p.method === 'MFS') mfs += amt;
      });
    } else if (sale.paidAmount > 0) {
      const amt = parseFloat(sale.paidAmount) || 0;
      const method = sale.paymentMethod || 'Cash';
      if (method === 'Cash') cash += amt;
      else if (method === 'Card') card += amt;
      else if (method === 'Bank') bank += amt;
      else if (['MFS', 'bKash', 'Nagad', 'Mobile Banking'].includes(method)) mfs += amt;
      else cash += amt;
    }

    return { cash, card, bank, mfs };
  };

  const columns = [
    {
      label: 'Date',
      accessor: (row) => formatDate(row.date, true),
    },
    { label: 'Invoice No', accessor: (row) => row.invoiceNumber || '—' },
    { label: 'Customer', accessor: (row) => row.customer?.contactName || 'Unknown' },
    { label: 'Total', accessor: (row) => `৳${row.total}` },
    { label: 'Paid', accessor: (row) => `৳${row.paidAmount}` },
    {
      label: 'Cash Paid',
      accessor: (row) => `৳${getPaymentBreakdown(row).cash.toFixed(2)}`,
    },
    {
      label: 'Card Paid',
      accessor: (row) => {
        const bd = getPaymentBreakdown(row);
        const cardPayments = (row.payments || []).filter(p => p.method === 'Card');
        const details = cardPayments.map(p => p.posMachineName).filter(Boolean).join(', ');
        return `৳${bd.card.toFixed(2)}${details ? ` (${details})` : ''}`;
      },
    },
    {
      label: 'Bank Paid',
      accessor: (row) => {
        const bd = getPaymentBreakdown(row);
        const bankPayments = (row.payments || []).filter(p => p.method === 'Bank');
        const details = bankPayments.map(p => p.bankName).filter(Boolean).join(', ');
        return `৳${bd.bank.toFixed(2)}${details ? ` (${details})` : ''}`;
      },
    },
    {
      label: 'MFS Paid',
      accessor: (row) => {
        const bd = getPaymentBreakdown(row);
        const mfsPayments = (row.payments || []).filter(p => p.method === 'MFS');
        const details = mfsPayments.map(p => p.mfsProviderName).filter(Boolean).join(', ');
        return `৳${bd.mfs.toFixed(2)}${details ? ` (${details})` : ''}`;
      },
    },
    { label: 'Due', accessor: (row) => `৳${row.dueAmount}` },
    { label: 'Payment', accessor: (row) => {
      if (row.payments && row.payments.length > 0) {
        return row.payments.length === 1 ? row.payments[0].method : `Split (${row.payments.map(p => p.method).join(', ')})`;
      }
      return row.paymentMethod || 'Cash';
    }},
    { label: 'Status', accessor: (row) => row.status }
  ];

  return (
    <Box sx={{ py: { xs: 1, sm: 2 } }}>
      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#1D5F99', fontWeight: 600, mb: 0.25, fontFamily: '"Outfit", sans-serif' }}>
                  Retail Records
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: '"Outfit", sans-serif' }}>
                  View and manage recent retail sales transactions.
                </Typography>
              </Box>
              <ExportButtons
                data={filteredRecords || []}
                columns={columns}
                filename="retail_sales_records"
                title="Retail Sales Report"
              />
            </Box>

            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Search retail records..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#94A3B8' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '8px' }
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              backgroundColor: '#fff',
            }}>
            <CardHeader
              title="Retail Records"
              subheader="Recent retail sales"
              sx={{
                background: 'linear-gradient(135deg, #1D5F99 0%, #42A2C2 100%)',
                borderBottom: '1px solid #e0e0e0',
                py: 2,
                px: 2.5,
                '& .MuiCardHeader-title': {
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  fontFamily: '"Outfit", sans-serif'
                },
                '& .MuiCardHeader-subheader': {
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: '0.8rem',
                  fontFamily: '"Outfit", sans-serif'
                }
              }}
            />
            <CardContent sx={{ p: 0 }}>
              {/* Desktop View - Table */}
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <TableContainer sx={{ overflowX: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
                  <Table stickyHeader size="small" sx={{ minWidth: 800 }}>
                    <TableHead>
                      <TableRow sx={{
                        '& .MuiTableCell-head': {
                          backgroundColor: '#F8FAFC',
                          color: '#475569',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          fontFamily: '"Outfit", sans-serif',
                          textTransform: 'uppercase',
                          borderBottom: '1px solid #eaeef3',
                          padding: '10px 16px',
                        }
                      }}>
                         <TableCell>Date</TableCell>
                         <TableCell>Invoice</TableCell>
                         <TableCell>Customer</TableCell>
                         <TableCell>Total</TableCell>
                         <TableCell>Paid</TableCell>
                         <TableCell>Cash Paid</TableCell>
                         <TableCell>Card Paid</TableCell>
                         <TableCell>Bank Paid</TableCell>
                         <TableCell>MFS Paid</TableCell>
                         <TableCell>Due</TableCell>
                         <TableCell>Payment</TableCell>
                         <TableCell>Status</TableCell>
                         <TableCell align="center">Actions & Invoices</TableCell>
                       </TableRow>
                     </TableHead>
                    <TableBody>
                      {retailRecordsLoading ? (
                        <TableRow>
                           <TableCell colSpan={13} align="center" sx={{ py: 3 }}>
                             <CircularProgress size={24} />
                           </TableCell>
                         </TableRow>
                      ) : filteredRecords && filteredRecords.length > 0 ? (
                        filteredRecords.map((record) => (
                          <TableRow key={record._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ fontFamily: '"Outfit", sans-serif' }}>
                              {formatDate(record.date, true)}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#334155', fontFamily: '"Outfit", sans-serif' }}>
                              <RouterLink
                                to={`/dashboard/sales/${record._id}`}
                                style={{ textDecoration: 'none', color: '#1D5F99', fontWeight: 'bold' }}
                              >
                                {record.invoiceNumber}
                              </RouterLink>
                            </TableCell>
                            <TableCell sx={{ fontFamily: '"Outfit", sans-serif' }}>
                              {record.customer?.contactName || 'Unknown'}
                            </TableCell>
                             <TableCell sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>৳{record.total}</TableCell>
                             <TableCell sx={{ color: '#10B981', fontWeight: 600, fontFamily: '"Outfit", sans-serif' }}>৳{record.paidAmount}</TableCell>
                             <TableCell sx={{ fontFamily: '"Outfit", sans-serif' }}>৳{getPaymentBreakdown(record).cash.toFixed(2)}</TableCell>
                             <TableCell sx={{ fontFamily: '"Outfit", sans-serif' }}>
                               ৳{getPaymentBreakdown(record).card.toFixed(2)}
                               {(() => {
                                 const cardPayments = (record.payments || []).filter(p => p.method === 'Card');
                                 const details = cardPayments.map(p => p.posMachineName).filter(Boolean).join(', ');
                                 return details ? ` (${details})` : '';
                               })()}
                             </TableCell>
                             <TableCell sx={{ fontFamily: '"Outfit", sans-serif' }}>
                               ৳{getPaymentBreakdown(record).bank.toFixed(2)}
                               {(() => {
                                 const bankPayments = (record.payments || []).filter(p => p.method === 'Bank');
                                 const details = bankPayments.map(p => p.bankName).filter(Boolean).join(', ');
                                 return details ? ` (${details})` : '';
                               })()}
                             </TableCell>
                             <TableCell sx={{ fontFamily: '"Outfit", sans-serif' }}>
                               ৳{getPaymentBreakdown(record).mfs.toFixed(2)}
                               {(() => {
                                 const mfsPayments = (record.payments || []).filter(p => p.method === 'MFS');
                                 const details = mfsPayments.map(p => p.mfsProviderName).filter(Boolean).join(', ');
                                 return details ? ` (${details})` : '';
                               })()}
                             </TableCell>
                            <TableCell sx={{ color: record.dueAmount > 0 ? '#EF4444' : '#64748B', fontWeight: 600, fontFamily: '"Outfit", sans-serif' }}>
                              ৳{record.dueAmount}
                            </TableCell>
                            <TableCell sx={{ fontFamily: '"Outfit", sans-serif' }}>
                              {record.payments && record.payments.length > 0 ? (
                                record.payments.length === 1 
                                  ? record.payments[0].method 
                                  : `Split (${record.payments.map(p => p.method).join(', ')})`
                              ) : (record.paymentMethod || 'Cash')}
                            </TableCell>
                            <TableCell sx={{ fontFamily: '"Outfit", sans-serif' }}>
                              <Box sx={{
                                display: 'inline-block',
                                px: 1,
                                py: 0.25,
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                backgroundColor: record.status === 'Completed' ? '#D1FAE5' : (record.status === 'Pending' ? '#FEF3C7' : '#F1F5F9'),
                                color: record.status === 'Completed' ? '#065F46' : (record.status === 'Pending' ? '#92400E' : '#475569')
                              }}>
                                {record.status}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                {record.dueAmount > 0 && (
                                  <Tooltip title="Collect Due Payment">
                                    <IconButton 
                                      onClick={() => handleOpenPaymentModal(record)}
                                      size="small"
                                      sx={{
                                        backgroundColor: 'rgba(217, 119, 6, 0.1)',
                                        '&:hover': {
                                          backgroundColor: 'rgba(217, 119, 6, 0.2)'
                                        }
                                      }}
                                    >
                                      <PaymentIcon sx={{ color: '#D97706', fontSize: 18 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="View All Invoices">
                                  <IconButton 
                                    onClick={() => printInvoice(record._id)}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                      '&:hover': {
                                        backgroundColor: 'rgba(33, 150, 243, 0.2)'
                                      }
                                    }}
                                  >
                                    <VisibilityIcon sx={{ color: '#2196F3', fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 3, color: '#64748B', fontFamily: '"Outfit", sans-serif' }}>
                            No retail records found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Mobile View - Cards */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, p: 2 }}>
                {retailRecordsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : filteredRecords && filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <Card 
                      key={record._id} 
                      elevation={0}
                      sx={{
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        backgroundColor: '#FFFFFF',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                        }
                      }}
                    >
                      <Box sx={{ p: 2 }}>
                        {/* Header: Invoice and Status */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
                          <RouterLink
                            to={`/dashboard/sales/${record._id}`}
                            style={{ textDecoration: 'none', color: '#1D5F99', fontWeight: 700, fontSize: '0.95rem', fontFamily: '"Outfit", sans-serif' }}
                          >
                            {record.invoiceNumber}
                          </RouterLink>
                          <Box sx={{
                            display: 'inline-block',
                            px: 1,
                            py: 0.25,
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            backgroundColor: record.status === 'Completed' ? '#D1FAE5' : (record.status === 'Pending' ? '#FEF3C7' : '#F1F5F9'),
                            color: record.status === 'Completed' ? '#065F46' : (record.status === 'Pending' ? '#92400E' : '#475569')
                          }}>
                            {record.status}
                          </Box>
                        </Box>

                        {/* Info: Customer & Date */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>Customer</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1E293B', fontFamily: '"Outfit", sans-serif' }}>
                              {record.customer?.contactName || 'Unknown'}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>Date</Typography>
                            <Typography variant="body2" sx={{ color: '#64748B', fontFamily: '"Outfit", sans-serif' }}>
                              {formatDate(record.date, true)}
                            </Typography>
                          </Box>
                        </Box>

                        <Divider sx={{ borderStyle: 'dashed', mb: 2 }} />

                        {/* Amounts: Total, Paid, Due */}
                        <Grid container spacing={1} sx={{ mb: 2 }}>
                          <Grid item xs={4}>
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>Total</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', fontFamily: '"Outfit", sans-serif' }}>৳{record.total}</Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>Paid</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#10B981', fontFamily: '"Outfit", sans-serif' }}>৳{record.paidAmount}</Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>Due</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: record.dueAmount > 0 ? '#EF4444' : '#64748B', fontFamily: '"Outfit", sans-serif' }}>৳{record.dueAmount}</Typography>
                          </Grid>
                          <Grid item xs={12} sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', textTransform: 'uppercase', fontWeight: 600, fontSize: '0.65rem' }}>Payment</Typography>
                            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem', fontFamily: '"Outfit", sans-serif' }}>
                              {record.payments && record.payments.length > 0 ? (
                                record.payments.length === 1 
                                  ? record.payments[0].method 
                                  : `Split (${record.payments.map(p => p.method).join(', ')})`
                              ) : (record.paymentMethod || 'Cash')}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Divider sx={{ mb: 1.5 }} />

                        {/* Actions Footer */}
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {record.dueAmount > 0 && (
                            <Button
                              variant="outlined"
                              color="warning"
                              size="small"
                              startIcon={<PaymentIcon sx={{ fontSize: '1rem !important' }} />}
                              onClick={() => handleOpenPaymentModal(record)}
                              sx={{
                                borderRadius: '6px',
                                textTransform: 'none',
                                fontSize: '0.75rem',
                                py: 0.5,
                                px: 1.5,
                                borderColor: '#D97706',
                                color: '#D97706',
                                '&:hover': {
                                  borderColor: '#B45309',
                                  backgroundColor: 'rgba(217, 119, 6, 0.04)'
                                }
                              }}
                            >
                              Pay Due
                            </Button>
                          )}
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            startIcon={<VisibilityIcon sx={{ fontSize: '1rem !important' }} />}
                            onClick={() => printInvoice(record._id)}
                            sx={{
                              borderRadius: '6px',
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              py: 0.5,
                              px: 1.5,
                              borderColor: '#2196F3',
                              color: '#2196F3',
                              '&:hover': {
                                borderColor: '#1976D2',
                                backgroundColor: 'rgba(33, 150, 243, 0.04)'
                              }
                            }}
                          >
                            View All Invoices
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  ))
                ) : (
                  <Box sx={{ py: 3, textAlign: 'center', color: '#64748B', fontFamily: '"Outfit", sans-serif' }}>
                    No records found
                  </Box>
                )}
              </Box>
              <TablePagination
                component="div"
                count={totalRecords}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 20, 50, 100]}
                sx={{ borderTop: '1px solid #eaeef3' }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Due Payment Modal */}
      <Dialog 
        open={isPaymentModalOpen} 
        onClose={handleClosePaymentModal}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px', p: 1 }
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: '"Outfit", sans-serif', 
          fontWeight: 600, 
          color: '#1D5F99',
          pb: 1
        }}>
          Collect Due Payment
        </DialogTitle>
        <DialogContent>
          {selectedRecordForPayment && (
            <Box sx={{ mt: 1 }}>
              {paymentError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPaymentError('')}>
                  {paymentError}
                </Alert>
              )}

              {/* Invoice Detail Box */}
              <Box sx={{
                p: 1.5,
                borderRadius: '8px',
                backgroundColor: '#F8FAFC',
                border: '1px dashed #CBD5E1',
                mb: 2
              }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.75rem', fontFamily: '"Outfit", sans-serif' }}>
                      INVOICE NO:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.85rem', fontFamily: '"Outfit", sans-serif' }}>
                      {selectedRecordForPayment.invoiceNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.75rem', fontFamily: '"Outfit", sans-serif' }}>
                      CUSTOMER:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.85rem', fontFamily: '"Outfit", sans-serif' }}>
                      {selectedRecordForPayment.customer?.contactName || 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.75rem', fontFamily: '"Outfit", sans-serif' }}>
                      TOTAL:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.85rem', fontFamily: '"Outfit", sans-serif' }}>
                      ৳{selectedRecordForPayment.total}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.75rem', fontFamily: '"Outfit", sans-serif' }}>
                      PAID:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#10B981', fontSize: '0.85rem', fontFamily: '"Outfit", sans-serif' }}>
                      ৳{selectedRecordForPayment.paidAmount}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.75rem', fontFamily: '"Outfit", sans-serif' }}>
                      DUE:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#EF4444', fontSize: '0.85rem', fontFamily: '"Outfit", sans-serif' }}>
                      ৳{selectedRecordForPayment.dueAmount}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Grid container spacing={1.5}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Collection Date"
                    type="date"
                    name="date"
                    size="small"
                    value={paymentFormData.date}
                    onChange={handlePaymentInputChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      sx: { borderRadius: '8px' }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      name="paymentMethod"
                      value={paymentFormData.paymentMethod}
                      onChange={handlePaymentInputChange}
                      label="Payment Method"
                      sx={{ borderRadius: '8px' }}
                    >
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="Bank">Bank</MenuItem>
                      <MenuItem value="Mobile Banking">Mobile Banking</MenuItem>
                      <MenuItem value="bKash">bKash</MenuItem>
                      <MenuItem value="Nagad">Nagad</MenuItem>
                      <MenuItem value="Card">Card</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Amount to Pay"
                    type="number"
                    name="amount"
                    size="small"
                    value={paymentFormData.amount}
                    onChange={handlePaymentInputChange}
                    InputProps={{
                      sx: { borderRadius: '8px' }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button 
            onClick={handleClosePaymentModal}
            variant="outlined"
            size="small"
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontFamily: '"Outfit", sans-serif'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePaymentSubmit}
            variant="contained"
            size="small"
            disabled={paymentMutation.isLoading}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              backgroundColor: '#1D5F99',
              fontFamily: '"Outfit", sans-serif',
              '&:hover': {
                backgroundColor: '#1D5F99'
              }
            }}
          >
            {paymentMutation.isLoading ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print Invoice Modal */}
      <PrintInvoiceModal 
        open={showInvoiceModal} 
        onClose={() => setShowInvoiceModal(false)} 
        saleId={completedSaleId} 
      />
    </Box>
  );
};

export default RetailRecords;
