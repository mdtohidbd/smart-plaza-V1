import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardHeader,
  CardContent,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Search as SearchIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import SaleInvoiceModal from '../../components/invoices/PrintInvoiceModal';
import ExportButtons from '../../components/ExportButtons';

const SalesDueCollection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedSale, setSelectedSale] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    amount: '',
    description: ''
  });

  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState(null);

  // Fetch sales to find outstanding invoices
  const { data: sales, isLoading: salesLoading, error: salesError, refetch: refetchSales } = useQuery('sales-with-dues', async () => {
    const response = await api.get('/api/sales');
    return response.data.data;
  }, {
    refetchOnWindowFocus: false,
  });

  // Fetch recent due collections (Income logs)
  const { data: dueCollections, isLoading: collectionsLoading, refetch: refetchCollections } = useQuery('due-collections', async () => {
    const response = await api.get('/api/sales/due-collection');
    return response.data.data;
  }, {
    refetchOnWindowFocus: false,
  });

  // Mutation for due collection
  const dueCollectionMutation = useMutation(
    async (data) => {
      const response = await api.put(`/api/sales/${selectedSale._id}/payment`, {
        paidAmount: selectedSale.paidAmount + Number(data.amount),
        dueAmount: selectedSale.dueAmount - Number(data.amount),
        paymentMethod: data.paymentMethod
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sales-with-dues');
        queryClient.invalidateQueries('wholesale-records');
        queryClient.invalidateQueries('retail-records');
        queryClient.invalidateQueries('dashboardData');
        queryClient.invalidateQueries('due-collections');
        refetchSales();
        refetchCollections();
        
        // Show updated invoice modal immediately
        const saleId = selectedSale._id;
        setCompletedSaleId(saleId);
        setShowInvoiceModal(true);

        // Reset state
        setSelectedSale(null);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'Cash',
          amount: '',
          description: ''
        });
        setError('');
      },
      onError: (error) => {
        console.error('Error recording due collection:', error);
        setError(error.response?.data?.message || 'Error recording due collection');
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
    if (!selectedSale) {
      setError('Please select an outstanding invoice first.');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }
    if (Number(formData.amount) > selectedSale.dueAmount) {
      setError(`Payment amount cannot exceed the remaining due of ৳${selectedSale.dueAmount}.`);
      return;
    }

    setError('');
    dueCollectionMutation.mutate(formData);
  };

  const outstandingInvoices = useMemo(() => {
    let filtered = (sales || []).filter(sale => {
      const hasDue = Number(sale.dueAmount || 0) > 0;
      if (!hasDue) return false;
      
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        (sale.invoiceNumber || '').toLowerCase().includes(query) ||
        (sale.customer?.contactName || '').toLowerCase().includes(query) ||
        (sale.customer?.contactNumber || '').includes(query)
      );
    });

    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      filtered = filtered.sort((a, b) => {
        const aStarts = (a.invoiceNumber || '').toLowerCase().startsWith(term) ||
                        (a.customer?.contactName || '').toLowerCase().startsWith(term) ||
                        (a.customer?.contactNumber || '').startsWith(term);
        const bStarts = (b.invoiceNumber || '').toLowerCase().startsWith(term) ||
                        (b.customer?.contactName || '').toLowerCase().startsWith(term) ||
                        (b.customer?.contactNumber || '').startsWith(term);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return 0;
      });
    }
    return filtered;
  }, [sales, searchQuery]);

  const handleSelectInvoice = (sale) => {
    setSelectedSale(sale);
    setFormData(prev => ({
      ...prev,
      amount: sale.dueAmount.toString()
    }));
  };

  const columns = [
    { label: 'Invoice No', accessor: (row) => row.invoiceNumber || '—' },
    { label: 'Customer', accessor: (row) => row.customer?.contactName || 'Unknown' },
    { label: 'Phone', accessor: (row) => row.customer?.contactNumber || '—' },
    { label: 'Type', accessor: (row) => row.type },
    { label: 'Total', accessor: (row) => `৳${row.total}` },
    { label: 'Paid', accessor: (row) => `৳${row.paidAmount}` },
    { label: 'Due', accessor: (row) => `৳${row.dueAmount}` }
  ];

  return (
    <Box sx={{
      px: { xs: 1.5, sm: 3 },
      py: { xs: 2, sm: 3 },
      backgroundColor: '#F8FAFC',
      fontFamily: '"Outfit", sans-serif',
      boxSizing: 'border-box'
    }}>
      <Grid container spacing={2}>
        {/* Top Header Card */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              fontFamily: '"Outfit", sans-serif',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, fontFamily: '"Outfit", sans-serif', fontSize: '1.2rem', mb: 0.25 }}>
                  Sales Due Collection
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem' }}>
                  Record payments for outstanding invoice dues.
                </Typography>
              </Box>
              <ExportButtons
                data={outstandingInvoices || []}
                columns={columns}
                filename="outstanding_invoices"
                title="Outstanding Invoices Report"
              />
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {salesError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Error loading outstanding invoices: {salesError.message}
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Left Column: Outstanding Invoices List */}
        <Grid item xs={12} md={7.5}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: 'column'
            }}>
            <CardHeader
              title="Outstanding Invoices List"
              subheader="Invoices with pending outstanding dues"
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
            <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by invoice, customer or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: '1.2rem' }} />
                    ),
                    sx: { borderRadius: '8px' }
                  }}
                />
              </Box>
              
              {/* Desktop View: Outstanding Invoices Table */}
              <TableContainer sx={{ display: { xs: 'none', sm: 'block' }, maxHeight: 320, overflowY: 'auto', overflowX: 'auto' }}>
                <Table stickyHeader size="small" sx={{ minWidth: '100%' }}>
                  <TableHead>
                    <TableRow
                      sx={{
                        '& .MuiTableCell-head': {
                          color: '#475569',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          fontFamily: '"Outfit", sans-serif',
                          textTransform: 'uppercase',
                          borderBottom: '1px solid #eaeef3',
                          backgroundColor: '#F8FAFC',
                          padding: '10px 16px',
                        }
                      }}
                    >
                      <TableCell>Invoice</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Due Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salesLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : outstandingInvoices.length > 0 ? (
                      outstandingInvoices.map((sale) => (
                        <TableRow
                          key={sale._id}
                          onClick={() => handleSelectInvoice(sale)}
                          sx={{
                            cursor: 'pointer',
                            backgroundColor: selectedSale?._id === sale._id ? '#F0F9FF' : 'inherit',
                            '&:hover': {
                              backgroundColor: selectedSale?._id === sale._id ? '#E0F2FE' : '#F8FAFC',
                            },
                            transition: 'background-color 0.2s',
                          }}
                        >
                          <TableCell sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 600, color: '#1D5F99' }}>
                            {sale.invoiceNumber}
                          </TableCell>
                          <TableCell sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 500 }}>
                            {sale.customer?.contactName || 'Unknown'}
                          </TableCell>
                          <TableCell sx={{ fontFamily: '"Outfit", sans-serif' }}>
                            <Box sx={{
                              display: 'inline-block',
                              px: 1,
                              py: 0.25,
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              backgroundColor: sale.type === 'wholesale' ? '#E0F2FE' : '#FEE2E2',
                              color: sale.type === 'wholesale' ? '#0369A1' : '#B91C1C'
                            }}>
                              {sale.type}
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 600, color: '#D97706' }}>
                            ৳{Number(sale.dueAmount || 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#64748b', fontFamily: '"Outfit", sans-serif' }}>
                          No outstanding dues found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Mobile View: Outstanding Invoices Cards */}
              <Box sx={{ display: { xs: 'block', sm: 'none' }, maxHeight: 320, overflowY: 'auto', px: 2, pb: 2 }}>
                {salesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : outstandingInvoices.length > 0 ? (
                  outstandingInvoices.map((sale) => {
                    const isSelected = selectedSale?._id === sale._id;
                    return (
                      <Paper
                        key={sale._id}
                        onClick={() => handleSelectInvoice(sale)}
                        sx={{
                          p: 1.5,
                          mb: 1.5,
                          cursor: 'pointer',
                          borderRadius: '8px',
                          border: isSelected ? '1px solid #1D5F99' : '1px solid #E2E8F0',
                          borderLeft: isSelected ? '4px solid #1D5F99' : '1px solid #E2E8F0',
                          backgroundColor: isSelected ? '#F0F9FF' : '#FFFFFF',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: isSelected ? '#E0F2FE' : '#F8FAFC',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#1D5F99', fontSize: '0.9rem' }}>
                            {sale.invoiceNumber}
                          </Typography>
                          <Box sx={{
                            display: 'inline-block',
                            px: 1,
                            py: 0.25,
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            backgroundColor: sale.type === 'wholesale' ? '#E0F2FE' : '#FEE2E2',
                            color: sale.type === 'wholesale' ? '#0369A1' : '#B91C1C'
                          }}>
                            {sale.type}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 500, fontSize: '0.8rem', color: '#475569' }}>
                            {sale.customer?.contactName || 'Unknown'}
                          </Typography>
                          <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#D97706', fontSize: '0.9rem' }}>
                            ৳{Number(sale.dueAmount || 0).toLocaleString()}
                          </Typography>
                        </Box>
                      </Paper>
                    );
                  })
                ) : (
                  <Typography align="center" sx={{ py: 4, color: '#64748b', fontSize: '0.85rem', fontFamily: '"Outfit", sans-serif' }}>
                    No outstanding dues found
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Due Collection Form */}
        <Grid item xs={12} md={4.5}>
          {user?.permissions?.sales?.update && (
            <Card elevation={0}
              sx={{
                border: '1px solid #eaeef3',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#fff',
                height: '100%'
              }}>
              <CardHeader
                title="Due Collection Form"
                subheader="Record the payment details below"
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
              <CardContent>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <FormControl fullWidth margin="dense">
                      <InputLabel>Select Outstanding Invoice</InputLabel>
                      <Select
                        name="invoice"
                        value={selectedSale ? selectedSale._id : ''}
                        onChange={(e) => {
                          const sale = outstandingInvoices.find(s => s._id === e.target.value);
                          if (sale) {
                            handleSelectInvoice(sale);
                          } else {
                            setSelectedSale(null);
                          }
                        }}
                        disabled={salesLoading}
                        label="Select Outstanding Invoice"
                        sx={{ borderRadius: '8px' }}
                      >
                        {salesLoading ? (
                          <MenuItem disabled>Loading invoices...</MenuItem>
                        ) : outstandingInvoices.length > 0 ? (
                          outstandingInvoices.map((sale) => (
                            <MenuItem key={sale._id} value={sale._id}>
                              {sale.invoiceNumber} - {sale.customer?.contactName || 'Unknown'} (Due: ৳{sale.dueAmount})
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled>No outstanding invoices</MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>

                  {selectedSale && (
                    <Grid item xs={12}>
                      <Box sx={{
                        p: 1.5,
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC',
                        border: '1px dashed #CBD5E1',
                        my: 1
                      }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1, fontWeight: 700, fontFamily: '"Outfit", sans-serif', letterSpacing: '0.05em' }}>
                          INVOICE DETAILS
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem', fontFamily: '"Outfit", sans-serif' }}>
                              <strong>Customer:</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.8rem', fontFamily: '"Outfit", sans-serif' }}>
                              {selectedSale.customer?.contactName || 'Unknown'}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem', fontFamily: '"Outfit", sans-serif' }}>
                              <strong>Type:</strong>
                            </Typography>
                            <Box sx={{
                              px: 1,
                              py: 0.25,
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              backgroundColor: selectedSale.type === 'wholesale' ? '#E0F2FE' : '#FEE2E2',
                              color: selectedSale.type === 'wholesale' ? '#0369A1' : '#B91C1C'
                            }}>
                              {selectedSale.type}
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem', fontFamily: '"Outfit", sans-serif' }}>
                              <strong>Total Amount:</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.8rem', fontFamily: '"Outfit", sans-serif' }}>
                              ৳{selectedSale.total}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem', fontFamily: '"Outfit", sans-serif' }}>
                              <strong>Already Paid:</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 600, fontSize: '0.8rem', fontFamily: '"Outfit", sans-serif' }}>
                              ৳{selectedSale.paidAmount}
                            </Typography>
                          </Box>

                          <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#D97706', fontSize: '0.85rem', fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
                              Outstanding Due:
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#D97706', fontSize: '0.9rem', fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>
                              ৳{selectedSale.dueAmount}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Date"
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      margin="dense"
                      InputProps={{
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth margin="dense">
                      <InputLabel>Payment Method</InputLabel>
                      <Select
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleInputChange}
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
                      label="Amount"
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      margin="dense"
                      InputProps={{
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      multiline
                      rows={2.5}
                      margin="dense"
                      InputProps={{
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleSubmit}
                    disabled={dueCollectionMutation.isLoading || !selectedSale}
                    sx={{
                      py: 1.25,
                      borderRadius: '8px',
                      backgroundColor: '#1D5F99',
                      '&:hover': {
                        backgroundColor: '#42A2C2',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                      },
                      transition: 'all 0.3s ease',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      textTransform: 'none'
                    }}
                  >
                    {dueCollectionMutation.isLoading ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />
                        Processing...
                      </>
                    ) : 'Record Payment'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Bottom Section: Recent Due Collections */}
        <Grid item xs={12}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}>
            <CardHeader
              title="Recent Due Collections"
              subheader="View recent due collection records"
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
            <CardContent sx={{ p: { xs: 0.5, sm: 2 } }}>
              {/* Desktop View: Recent Due Collections Table */}
              <TableContainer sx={{ display: { xs: 'none', sm: 'block' }, overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: '100%' }}>
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: '#F8FAFC',
                        '& .MuiTableCell-head': {
                          color: '#475569',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          fontFamily: '"Outfit", sans-serif',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderBottom: '1px solid #eaeef3',
                          padding: '10px 16px',
                        }
                      }}
                    >
                      <TableCell>Date</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Payment Method</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {collectionsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : dueCollections && dueCollections.length > 0 ? (
                      dueCollections.map((collection) => (
                        <TableRow key={collection._id}>
                          <TableCell>{new Date(collection.date).toLocaleDateString()}</TableCell>
                          <TableCell>{collection.customer?.contactName || 'N/A'}</TableCell>
                          <TableCell sx={{ color: '#1D5F99', fontWeight: '600' }}>
                            ৳{collection.amount}
                          </TableCell>
                          <TableCell>{collection.paymentMethod}</TableCell>
                          <TableCell>{collection.description || '-'}</TableCell>
                          <TableCell align="right">
                            {collection.saleId ? (
                              <Tooltip title="View Invoice">
                                <IconButton
                                  onClick={() => {
                                    setCompletedSaleId(collection.saleId);
                                    setShowInvoiceModal(true);
                                  }}
                                  size="small"
                                  sx={{
                                    backgroundColor: 'rgba(29, 95, 153, 0.1)',
                                    '&:hover': {
                                      backgroundColor: 'rgba(29, 95, 153, 0.2)'
                                    }
                                  }}
                                >
                                  <VisibilityIcon sx={{ color: '#1D5F99', fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No due collections found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Mobile View: Recent Due Collections Cards */}
              <Box sx={{ display: { xs: 'block', sm: 'none' }, px: 1, py: 1 }}>
                {collectionsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : dueCollections && dueCollections.length > 0 ? (
                  dueCollections.map((collection) => (
                    <Paper
                      key={collection._id}
                      sx={{
                        p: 1.5,
                        mb: 1.5,
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#FFFFFF',
                        boxShadow: 'none'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.75rem', color: '#64748B' }}>
                          {new Date(collection.date).toLocaleDateString()}
                        </Typography>
                        <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.85rem', color: '#1D5F99', fontWeight: 700 }}>
                          ৳{collection.amount}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 600, fontSize: '0.85rem', color: '#1E293B' }}>
                          {collection.customer?.contactName || 'N/A'}
                        </Typography>
                        <Box sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          backgroundColor: '#F1F5F9',
                          color: '#475569'
                        }}>
                          {collection.paymentMethod}
                        </Box>
                      </Box>
                      {collection.description && (
                        <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.75rem', color: '#64748B', mb: 1, fontStyle: 'italic' }}>
                          {collection.description}
                        </Typography>
                      )}
                      {collection.saleId && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px dashed #E2E8F0', pt: 1 }}>
                          <Button
                            onClick={() => {
                              setCompletedSaleId(collection.saleId);
                              setShowInvoiceModal(true);
                            }}
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityIcon sx={{ fontSize: '1rem !important' }} />}
                            sx={{
                              py: 0.25,
                              px: 1.5,
                              borderRadius: '6px',
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              borderColor: '#1D5F99',
                              color: '#1D5F99',
                              '&:hover': {
                                backgroundColor: 'rgba(29, 95, 153, 0.08)',
                                borderColor: '#1D5F99'
                              }
                            }}
                          >
                            View Invoice
                          </Button>
                        </Box>
                      )}
                    </Paper>
                  ))
                ) : (
                  <Typography align="center" sx={{ py: 4, color: '#64748b', fontSize: '0.85rem', fontFamily: '"Outfit", sans-serif' }}>
                    No due collections found
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sale Invoice Modal */}
      <SaleInvoiceModal 
        open={showInvoiceModal} 
        onClose={() => setShowInvoiceModal(false)} 
        saleId={completedSaleId} 
      />
    </Box>
  );
};

export default SalesDueCollection;