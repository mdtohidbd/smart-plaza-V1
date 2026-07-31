import React, { useState } from 'react';
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
  IconButton,
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
  InputAdornment,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import SaleInvoiceModal from '../../components/invoices/PrintInvoiceModal';
import { Snackbar } from '@mui/material';
import SplitPaymentPanel from './components/SplitPaymentPanel';
import LoadQuotationModal from '../../components/LoadQuotationModal';

const WholesaleSales = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    customer: '',
    date: new Date().toISOString().split('T')[0],
    shippingAddress: '',
    assignedSR: '',
    deliveredBy: '',
    route: '',
    invoiceType: 'Cash',
    paymentMethod: 'Cash',
    items: [{ product: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 }],
    note: ''
  });

  const [calculation, setCalculation] = useState({
    subTotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    paidAmount: '',
    dueAmount: 0
  });

  const [payments, setPayments] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stockAlertOpen, setStockAlertOpen] = useState(false);
  const [stockAlertMessage, setStockAlertMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState(null);
  const [openLoadQuotation, setOpenLoadQuotation] = useState(false);
  const [loadedQuoteId, setLoadedQuoteId] = useState(null);

  const handleSelectQuotation = (q) => {
    if (!q) return;
    setLoadedQuoteId(q._id);
    if (q.customer?._id) {
      setFormData(prev => ({ ...prev, customer: q.customer._id }));
    }
    if (q.note) {
      setFormData(prev => ({ ...prev, note: q.note }));
    }
    if (q.items && products) {
      const newItems = q.items.map(item => {
        const prod = products.find(p => p._id === (item.product?._id || item.product));
        return {
          product: prod ? prod._id : '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || (prod ? prod.wholesalePrice || prod.price : 0),
          discount: item.discount || 0,
          tax: item.tax || 0
        };
      });
      if (newItems.length > 0) {
        setFormData(prev => ({ ...prev, items: newItems }));
      }
    }
    setSuccess(`Loaded Quotation #${q.quotationNumber}`);
  };


  // Fetch customers
  const { data: customers } = useQuery('customers', async () => {
    const response = await api.get('/api/contacts/customers');
    return response.data.data;
  });

  // Fetch products
  const { data: products } = useQuery('products', async () => {
    const response = await api.get('/api/products');
    return response.data.data;
  });

  // Fetch routes
  const { data: routes } = useQuery('routes', async () => {
    const response = await api.get('/api/routes');
    return response.data.data;
  });

  // Fetch users (for SR and delivery)
  const { data: users } = useQuery('users', async () => {
    const response = await api.get('/api/users');
    return response.data.data;
  });


  const queryClient = useQueryClient();

  const createSaleMutation = useMutation(
    (data) => api.post('/api/sales', data),
    {
      onSuccess: async (response) => {
        setIsSubmitting(false);
        if (loadedQuoteId) {
          try {
            await api.post(`/api/quotations/${loadedQuoteId}/convert`);
            queryClient.invalidateQueries('all-quotations');
          } catch (convertError) {
            console.error('Failed to mark quotation as converted:', convertError);
          }
        }
        queryClient.invalidateQueries('sales');
        queryClient.invalidateQueries('wholesale-records');
        queryClient.invalidateQueries('dashboardData');
        // Reset form
        setFormData({
          customer: '',
          date: new Date().toISOString().split('T')[0],
          shippingAddress: '',
          assignedSR: '',
          deliveredBy: '',
          route: '',
          invoiceType: 'Cash',
          paymentMethod: 'Cash',
          items: [{ product: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 }],
          note: ''
        });
        setCalculation({
          subTotal: 0,
          discount: 0,
          tax: 0,
          total: 0,
          paidAmount: '',
          dueAmount: 0
        });

        setSuccess('Sale created successfully!');
        setTimeout(() => setSuccess(''), 3000);

        // Show invoice modal with the completed sale ID
        const saleId = response.data.data._id;
        setCompletedSaleId(saleId);
        setShowInvoiceModal(true);
      },
      onError: (error) => {
        setIsSubmitting(false);
        console.error('Error creating sale:', error);
        const errorMessage = error.response && error.response.data ? error.response.data.message : error.message;
        setError(errorMessage);
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

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // Check stock when product is selected
    if (field === 'product' && value) {
      const selectedProduct = products.find(p => p._id === value);
      if (selectedProduct) {
        const currentStock = selectedProduct.currentStock || 0;
        if (currentStock <= 0) {
          setStockAlertMessage(`⚠️ Product "${selectedProduct.name}" is OUT OF STOCK! Current quantity: ${currentStock}`);
          setStockAlertOpen(true);
          // Reset the selection
          newItems[index].product = '';
          setFormData({
            ...formData,
            items: newItems
          });
          return;
        }
        
        // Optional: Warn if selected quantity exceeds available stock
        if (value && newItems[index].quantity > currentStock) {
          setStockAlertMessage(`⚠️ Selected quantity (${newItems[index].quantity}) exceeds available stock (${currentStock}) for "${selectedProduct.name}"`);
          setStockAlertOpen(true);
        }
        
        // Auto-populate unit price when product is selected
        if (newItems[index].unitPrice === 0 || newItems[index].unitPrice === '') {
          newItems[index].unitPrice = selectedProduct.sellingPrice || 0;
        }
      }
    }

    // Calculate line total
    const lineTotal = (value * newItems[index].quantity) - newItems[index].discount + newItems[index].tax;
    newItems[index].lineTotal = lineTotal;

    setFormData({
      ...formData,
      items: newItems
    });

    calculateTotals(newItems);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return; // Don't remove the last item

    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({
      ...formData,
      items: newItems
    });
    calculateTotals(newItems);
  };

  const calculateTotals = (items = formData.items) => {
    const subTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
    const totalTax = items.reduce((sum, item) => sum + item.tax, 0);
    const total = subTotal - totalDiscount + totalTax;
    
    setCalculation(prev => ({
      ...prev,
      subTotal,
      discount: totalDiscount,
      tax: totalTax,
      total,
      dueAmount: total - (parseFloat(prev.paidAmount) || 0)
    }));
  };

  const handlePaidAmountChange = (e) => {
    const val = e.target.value;
    const paidAmount = val === '' ? '' : parseFloat(val);
    const numericPaid = parseFloat(val) || 0;
    setCalculation(prev => ({
      ...prev,
      paidAmount,
      dueAmount: prev.total - numericPaid
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.customer) {
      setError('Please select a customer.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (!formData.assignedSR) {
      setError('Please select a Sales Rep (Sold By) before completing the sale');
      setTimeout(() => setError(''), 5000);
      return;
    }

    const validItems = formData.items
      .filter(item => item.product !== '')
      .map(item => {
        const prod = products.find(p => p._id === item.product);
        return {
          ...item,
          productName: prod ? prod.name : 'Unknown Product',
          model: prod ? prod.model : '',
          warranty: 'N/A' // Wholesale currently doesn't map UI warranties
        };
      });

    if (validItems.length === 0) {
      setError('Please add at least one valid product.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    const resolvedPaymentMethod = payments.length > 1
      ? 'Split'
      : (payments[0]?.method || formData.paymentMethod || 'Cash');

    const saleData = {
      ...formData,
      items: validItems,
      assignedSR: formData.assignedSR || undefined,
      deliveredBy: formData.deliveredBy || undefined,
      route: formData.route || undefined,
      invoiceNumber: `INV-${Date.now()}`, // Generate a simple invoice number
      subTotal: calculation.subTotal,
      discount: calculation.discount,
      tax: calculation.tax,
      total: calculation.total,
      paidAmount: parseFloat(calculation.paidAmount) || 0,
      dueAmount: calculation.dueAmount,
      paymentMethod: resolvedPaymentMethod,
      payments: payments, // Send the split payments array
      invoiceType: formData.invoiceType,
      status: 'Pending' // Always start as pending for approval
    };

    setIsSubmitting(true);
    createSaleMutation.mutate(saleData);
  };

  return (
    <Box sx={{
      height: { xs: 'auto', md: 'calc(100vh - 64px)' },
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto',
      p: 1.5,
      backgroundColor: '#F8FAFC',
      boxSizing: 'border-box',
    }}>
      <Grid container spacing={1.5} sx={{ flexGrow: 1, height: { xs: 'auto', md: '100%' }, minHeight: 0 }}>
        {/* Left Column: Sale Items & Remarks */}
        <Grid item xs={12} md={7.5} sx={{ height: { xs: 'auto', md: '100%' }, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Paper sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: 0, 
            mb: 1.5,
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            overflow: 'hidden'
          }}>
            <Box sx={{
              px: 2,
              py: 1.25,
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#FFFFFF'
            }}>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E293B' }}>
                  Sale Items
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Add and adjust products for this wholesale order
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  color="info"
                  onClick={() => setOpenLoadQuotation(true)}
                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderRadius: '6px' }}
                >
                  Load Quote
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addItem}
                  sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  borderColor: '#6366F1',
                  color: '#6366F1',
                  '&:hover': {
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(99, 102, 241, 0.04)'
                  }
                }}
              >
                Add Item
              </Button>
            </Box>
            </Box>

            {/* Desktop Table View */}
            <TableContainer sx={{ display: { xs: 'none', md: 'block' }, flexGrow: 1, overflowY: 'auto', overflowX: 'auto', minHeight: 0 }}>
              <Table size="small" stickyHeader sx={{ minWidth: { xs: 750, md: '100%' } }}>
                <TableHead>
                  <TableRow sx={{
                    '& .MuiTableCell-head': {
                      backgroundColor: '#F8FAFC',
                      color: '#64748B',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      py: 1,
                      px: 1,
                      borderBottom: '1px solid #E2E8F0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }
                  }}>
                    <TableCell style={{ width: 40 }}>Img</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell style={{ width: 75 }}>Qty</TableCell>
                    <TableCell style={{ width: 95 }}>Price</TableCell>
                    <TableCell style={{ width: 75 }}>Disc</TableCell>
                    <TableCell style={{ width: 75 }}>Tax</TableCell>
                    <TableCell style={{ width: 95 }}>Total</TableCell>
                    <TableCell style={{ width: 40 }} align="center">Act</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((item, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        '&:nth-of-type(odd)': { backgroundColor: '#F8FAFC' },
                        '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.02)' },
                        '& .MuiTableCell-root': {
                          padding: '6px 8px',
                          borderBottom: '1px solid #F1F5F9'
                        }
                      }}
                    >
                      <TableCell sx={{ py: 0.75, px: 1 }}>
                        {(() => {
                          const selectedProduct = products?.find(p => p._id === item.product);
                          return selectedProduct?.image ? (
                            <img
                              src={selectedProduct.image}
                              alt={selectedProduct.name}
                              style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4, border: '1px solid #E2E8F0', backgroundColor: 'white' }}
                            />
                          ) : (
                            <Box sx={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F1F5F9', borderRadius: 1, border: '1px solid #E2E8F0' }}>
                              <Typography variant="caption" sx={{ fontSize: 8, color: '#94A3B8' }}>N/A</Typography>
                            </Box>
                          );
                        })()}
                      </TableCell>
                      <TableCell sx={{ py: 0.75, px: 1 }}>
                        <FormControl fullWidth size="small">
                          <Select
                            value={item.product}
                            onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                            size="small"
                            displayEmpty
                            renderValue={(selected) => {
                              if (!selected) {
                                return <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Select Product</span>;
                              }
                              const prod = products?.find(p => p._id === selected);
                              return prod ? <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{prod.name}</span> : '';
                            }}
                            sx={{ 
                              borderRadius: '6px',
                              color: '#1E293B',
                              backgroundColor: '#FFFFFF',
                              fontSize: '0.8rem',
                              height: '32px',
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366F1' }
                            }}
                          >
                            {products?.map((product) => (
                              <MenuItem key={product._id} value={product._id} sx={{ py: 0.5, px: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {product.image ? (
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 2 }}
                                    />
                                  ) : (
                                    <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F1F5F9', borderRadius: 0.5 }}>
                                      <Typography variant="caption" sx={{ fontSize: 6, color: '#94A3B8' }}>N/A</Typography>
                                    </Box>
                                  )}
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#1E293B' }}>{product.name}</Typography>
                                    <Typography variant="caption" sx={{ color: '#10B981', display: 'block', fontSize: '0.65rem' }}>৳{product.sellingPrice} | Stock: {product.currentStock || 0}</Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell sx={{ py: 0.75, px: 1 }}>
                        <TextField
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          inputProps={{ min: 1, style: { fontSize: '0.8rem', padding: '6px 8px', height: '18px' } }}
                          size="small"
                          sx={{ 
                            width: '100%',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '6px',
                              color: '#1E293B',
                              backgroundColor: '#FFFFFF',
                              '& fieldset': { borderColor: '#E2E8F0' },
                              '&:hover fieldset': { borderColor: '#CBD5E1' },
                              '&.Mui-focused fieldset': { borderColor: '#6366F1' }
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 0.75, px: 1 }}>
                        <TextField
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          inputProps={{ style: { fontSize: '0.8rem', padding: '6px 8px', height: '18px' } }}
                          size="small"
                          sx={{ 
                            width: '100%',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '6px',
                              color: '#1E293B',
                              backgroundColor: '#FFFFFF',
                              '& fieldset': { borderColor: '#E2E8F0' },
                              '&:hover fieldset': { borderColor: '#CBD5E1' },
                              '&.Mui-focused fieldset': { borderColor: '#6366F1' }
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 0.75, px: 1 }}>
                        <TextField
                          type="number"
                          value={item.discount}
                          onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                          inputProps={{ style: { fontSize: '0.8rem', padding: '6px 8px', height: '18px' } }}
                          size="small"
                          sx={{ 
                            width: '100%',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '6px',
                              color: '#1E293B',
                              backgroundColor: '#FFFFFF',
                              '& fieldset': { borderColor: '#E2E8F0' },
                              '&:hover fieldset': { borderColor: '#CBD5E1' },
                              '&.Mui-focused fieldset': { borderColor: '#6366F1' }
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 0.75, px: 1 }}>
                        <TextField
                          type="number"
                          value={item.tax}
                          onChange={(e) => handleItemChange(index, 'tax', parseFloat(e.target.value) || 0)}
                          inputProps={{ style: { fontSize: '0.8rem', padding: '6px 8px', height: '18px' } }}
                          size="small"
                          sx={{ 
                            width: '100%',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '6px',
                              color: '#1E293B',
                              backgroundColor: '#FFFFFF',
                              '& fieldset': { borderColor: '#E2E8F0' },
                              '&:hover fieldset': { borderColor: '#CBD5E1' },
                              '&.Mui-focused fieldset': { borderColor: '#6366F1' }
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 0.75, px: 1, fontWeight: 700, color: '#0F766E', fontSize: '0.8rem' }}>
                        ৳{(item.quantity * item.unitPrice - item.discount + item.tax).toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ py: 0.75, px: 1 }} align="center">
                        <IconButton
                          color="error"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1}
                          size="small"
                          sx={{
                            p: 0.5,
                            backgroundColor: 'rgba(239, 68, 68, 0.05)',
                            color: '#EF4444',
                            '&:hover': {
                              backgroundColor: 'rgba(239, 68, 68, 0.1)'
                            },
                            '&.Mui-disabled': {
                              opacity: 0.25
                            }
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Mobile Card View */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, p: 2, flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
              {formData.items.map((item, index) => (
                <Card key={`mobile-item-${index}`} variant="outlined" sx={{ borderRadius: '8px', borderColor: '#E2E8F0', overflow: 'visible' }}>
                  <Box sx={{ p: 1.5, borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#64748B' }}>Item {index + 1}</Typography>
                    <IconButton
                      color="error"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                      size="small"
                      sx={{ p: 0.5, backgroundColor: 'rgba(239, 68, 68, 0.05)', color: '#EF4444', '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' }, '&.Mui-disabled': { opacity: 0.25 } }}
                    >
                      <DeleteIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <Select
                        value={item.product}
                        onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                        size="small"
                        displayEmpty
                        renderValue={(selected) => {
                          if (!selected) return <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Select Product</span>;
                          const prod = products?.find(p => p._id === selected);
                          return prod ? <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{prod.name}</span> : '';
                        }}
                        sx={{ borderRadius: '6px', backgroundColor: '#FFFFFF', fontSize: '0.8rem', height: '36px' }}
                      >
                        {products?.map((product) => (
                          <MenuItem key={product._id} value={product._id} sx={{ py: 0.5, px: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {product.image ? (
                                <img src={product.image} alt={product.name} style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 2 }} />
                              ) : (
                                <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F1F5F9' }}>
                                  <Typography variant="caption" sx={{ fontSize: 6 }}>N/A</Typography>
                                </Box>
                              )}
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{product.name}</Typography>
                                <Typography variant="caption" sx={{ color: '#10B981', display: 'block', fontSize: '0.65rem' }}>৳{product.sellingPrice} | Stock: {product.quantity}</Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <TextField fullWidth label="Qty" type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)} size="small" InputLabelProps={{ shrink: true, sx: { fontSize: '0.8rem' } }} inputProps={{ min: 1 }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }} />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField fullWidth label="Price" type="number" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)} size="small" InputLabelProps={{ shrink: true, sx: { fontSize: '0.8rem' } }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }} />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField fullWidth label="Disc" type="number" value={item.discount} onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)} size="small" InputLabelProps={{ shrink: true, sx: { fontSize: '0.8rem' } }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }} />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField fullWidth label="Tax" type="number" value={item.tax} onChange={(e) => handleItemChange(index, 'tax', parseFloat(e.target.value) || 0)} size="small" InputLabelProps={{ shrink: true, sx: { fontSize: '0.8rem' } }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }} />
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '0.8rem', color: '#64748B' }}>Line Total</Typography>
                      <Typography sx={{ fontWeight: 700, color: '#0F766E', fontSize: '1rem' }}>
                        ৳{(item.quantity * item.unitPrice - item.discount + item.tax).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          </Paper>

          {/* Remarks/Note Card */}
          <Paper sx={{ p: 1.5, borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <TextField
              fullWidth
              label="Order Note / Remarks"
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              multiline
              rows={2}
              size="small"
              placeholder="Enter additional remarks or order notes here..."
              InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  backgroundColor: '#FFFFFF',
                  '& fieldset': { borderColor: '#E2E8F0' },
                  '&:hover fieldset': { borderColor: '#CBD5E1' },
                  '&.Mui-focused fieldset': { borderColor: '#6366F1' },
                }
              }}
            />
          </Paper>
        </Grid>

        {/* Right Column: Transaction Details & Payments Stack */}
        <Grid item xs={12} md={4.5} sx={{ height: { xs: 'auto', md: '100%' }, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <form onSubmit={handleSubmit} style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, gap: 12, overflowY: 'auto', paddingRight: '4px' }}>
            {/* Sale Details Card */}
            <Paper sx={{ p: 2, borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B', mb: 1.5 }}>
                Sale Details
              </Typography>
              <Grid container spacing={1.25}>
                {/* Customer */}
                <Grid item xs={12}>
                  <FormControl fullWidth required size="small" sx={{ position: 'relative' }}>
                    <InputLabel sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>Customer</InputLabel>
                    <Select
                      name="customer"
                      value={formData.customer}
                      onChange={handleInputChange}
                      label="Customer"
                      sx={{ 
                        borderRadius: '8px',
                        backgroundColor: '#FFFFFF',
                        color: '#1E293B',
                        fontSize: '0.8rem',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366F1' },
                      }}
                    >
                      {customers?.map((customer) => (
                        <MenuItem key={customer._id} value={customer._id} sx={{ fontSize: '0.8rem' }}>
                          {customer.contactName} ({customer.contactNumber})
                        </MenuItem>
                      ))}
                    </Select>
                    <IconButton
                      onClick={() => navigate('/contacts/customers')}
                      size="small"
                      sx={{ 
                        position: 'absolute',
                        right: 28,
                        top: 4,
                        color: '#6366F1'
                      }}
                    >
                      <AddIcon sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                  </FormControl>
                </Grid>

                {/* Date */}
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                      sx: { color: '#94A3B8', fontSize: '0.85rem' }
                    }}
                    inputProps={{ style: { fontSize: '0.8rem' } }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        backgroundColor: '#FFFFFF',
                        color: '#1E293B',
                        '& fieldset': { borderColor: '#E2E8F0' },
                        '&:hover fieldset': { borderColor: '#CBD5E1' },
                        '&.Mui-focused fieldset': { borderColor: '#6366F1' },
                      }
                    }}
                  />
                </Grid>

                {/* Route */}
                <Grid item xs={6}>
                  <FormControl fullWidth size="small" sx={{ position: 'relative' }}>
                    <InputLabel sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>Route</InputLabel>
                    <Select
                      name="route"
                      value={formData.route}
                      onChange={handleInputChange}
                      label="Route"
                      sx={{ 
                        borderRadius: '8px',
                        backgroundColor: '#FFFFFF',
                        color: '#1E293B',
                        fontSize: '0.8rem',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366F1' },
                      }}
                    >
                      <MenuItem value="" sx={{ fontSize: '0.8rem' }}><em>None</em></MenuItem>
                      {routes?.map((route) => (
                        <MenuItem key={route._id} value={route._id} sx={{ fontSize: '0.8rem' }}>
                          {route.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <IconButton
                      onClick={() => navigate('/routes')}
                      size="small"
                      sx={{ 
                        position: 'absolute',
                        right: 28,
                        top: 4,
                        color: '#6366F1'
                      }}
                    >
                      <AddIcon sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                  </FormControl>
                </Grid>



                {/* Invoice Type */}
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>Invoice Type</InputLabel>
                    <Select
                      name="invoiceType"
                      value={formData.invoiceType}
                      onChange={handleInputChange}
                      label="Invoice Type"
                      sx={{ 
                        borderRadius: '8px',
                        backgroundColor: '#FFFFFF',
                        color: '#1E293B',
                        fontSize: '0.8rem',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366F1' },
                      }}
                    >
                      <MenuItem value="Cash" sx={{ fontSize: '0.8rem' }}>Cash</MenuItem>
                      <MenuItem value="EMI" sx={{ fontSize: '0.8rem' }}>EMI</MenuItem>
                      <MenuItem value="Delivery" sx={{ fontSize: '0.8rem' }}>Delivery</MenuItem>
                      <MenuItem value="Tax" sx={{ fontSize: '0.8rem' }}>Tax</MenuItem>
                      <MenuItem value="VAT Adjustment" sx={{ fontSize: '0.8rem' }}>VAT Adjustment</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Shipping Address */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Shipping Address"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleInputChange}
                    size="small"
                    InputLabelProps={{ sx: { color: '#94A3B8', fontSize: '0.85rem' } }}
                    inputProps={{ style: { fontSize: '0.8rem' } }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        backgroundColor: '#FFFFFF',
                        color: '#1E293B',
                        '& fieldset': { borderColor: '#E2E8F0' },
                        '&:hover fieldset': { borderColor: '#CBD5E1' },
                        '&.Mui-focused fieldset': { borderColor: '#6366F1' },
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Payment Summary Card */}
            <Paper sx={{ p: 2, borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B', mb: 0.5 }}>
                  Payment Summary
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <Typography sx={{ color: '#64748B' }}>Sub Total:</Typography>
                  <Typography sx={{ color: '#1E293B', fontWeight: 600 }}>৳{calculation.subTotal.toFixed(2)}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <Typography sx={{ color: '#64748B' }}>Discount:</Typography>
                  <Typography sx={{ color: '#EF4444', fontWeight: 600 }}>-৳{calculation.discount.toFixed(2)}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <Typography sx={{ color: '#64748B' }}>Tax:</Typography>
                  <Typography sx={{ color: '#6366F1', fontWeight: 600 }}>+৳{calculation.tax.toFixed(2)}</Typography>
                </Box>
                
                <Divider sx={{ my: 0.5 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.85rem' }}>Total Amount:</Typography>
                  <Typography sx={{ fontWeight: 800, color: '#0F766E', fontSize: '1.25rem' }}>৳{calculation.total.toFixed(2)}</Typography>
                </Box>

                <Box sx={{ mt: 1, mb: 1 }}>
                  <SplitPaymentPanel
                    grandTotal={calculation.total || 0}
                    onPaymentsChange={(p, paid) => {
                      setPayments(p);
                      setCalculation(prev => ({
                        ...prev,
                        paidAmount: paid,
                        dueAmount: Math.max(0, prev.total - paid)
                      }));
                    }}
                  />
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mt: 1, 
                  px: 1.5, 
                  py: 1, 
                  borderRadius: '8px', 
                  backgroundColor: calculation.dueAmount > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid',
                  borderColor: calculation.dueAmount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'
                }}>
                  <Typography sx={{ fontWeight: 700, color: calculation.dueAmount > 0 ? '#EF4444' : '#10B981', fontSize: '0.8rem' }}>
                    Due Balance:
                  </Typography>
                  <Typography sx={{ fontWeight: 800, color: calculation.dueAmount > 0 ? '#EF4444' : '#10B981', fontSize: '0.95rem' }}>
                    ৳{calculation.dueAmount.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 1.5 }}>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={isSubmitting}
                  fullWidth
                  sx={{
                    py: 1.25,
                    borderRadius: '8px',
                    backgroundColor: '#6366F1',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
                    '&:hover': {
                      backgroundColor: '#4F46E5',
                      boxShadow: '0 6px 16px rgba(99, 102, 241, 0.25)',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease',
                    fontWeight: 700,
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '0.9rem',
                    textTransform: 'none'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1, color: 'white' }} />
                      Creating Transaction...
                    </>
                  ) : 'Create Wholesale Sale'}
                </Button>
              </Box>
            </Paper>
          </form>
        </Grid>
      </Grid>


      {/* Floating System Success/Error Snackbars */}
      <Snackbar
        open={Boolean(success)}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccess('')} 
          severity="success" 
          sx={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          {success}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={5000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError('')} 
          severity="error" 
          sx={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Stock Alert Snackbar */}
      <Snackbar
        open={stockAlertOpen}
        autoHideDuration={6000}
        onClose={() => setStockAlertOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setStockAlertOpen(false)} 
          severity="warning"
          sx={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          {stockAlertMessage}
        </Alert>
      </Snackbar>

      {/* Sale Invoice Modal */}
      <SaleInvoiceModal 
        open={showInvoiceModal} 
        onClose={() => setShowInvoiceModal(false)} 
        saleId={completedSaleId} 
      />

      <LoadQuotationModal
        open={openLoadQuotation}
        onClose={() => setOpenLoadQuotation(false)}
        onSelectQuotation={handleSelectQuotation}
      />
    </Box>
  );
};

export default WholesaleSales;