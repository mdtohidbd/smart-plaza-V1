import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import SplitPaymentPanel from '../views/Sales/components/SplitPaymentPanel';

const EditInvoiceModal = ({ open, onClose, saleId, userRole, sourceType }) => {
  const queryClient = useQueryClient();
  
  // State for form data
  const [formData, setFormData] = useState({
    customer: '',
    items: [],
    subTotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    paidAmount: 0,
    dueAmount: 0,
    additionalExpense: 0,
    isOperatingExpense: false,
    deliveryCharge: 0,
    isOperatingDelivery: false,
    installationCost: 0,
    isOperatingInstallation: false,
    date: '',
    shippingAddress: '',
    assignedSR: '',
    deliveredBy: '',
    route: '',
    status: 'Completed',
    note: '',
    paymentMethod: 'Cash',
    payments: []
  });

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch sale data for editing
  useEffect(() => {
    if (open && saleId) {
      fetchSaleData();
      fetchCustomers();
      fetchProducts();
    }
  }, [open, saleId]);

  const fetchSaleData = async () => {
    try {
      setLoading(true);
      const url = sourceType === 'order' ? `/api/sales-orders/${saleId}` : `/api/sales/${saleId}`;
      const response = await api.get(url);
      const sale = response.data.data;
      
      setFormData({
        customer: sale.customer?._id || '',
        items: sale.items || [],
        subTotal: sale.subTotal || 0,
        discount: sale.discount || 0,
        tax: sale.tax || 0,
        total: sale.total || 0,
        paidAmount: sale.paidAmount || 0,
        dueAmount: sale.dueAmount || 0,
        additionalExpense: Number(sale.additionalExpense) || 0,
        isOperatingExpense: Boolean(sale.isOperatingExpense),
        deliveryCharge: Number(sale.deliveryCharge) || 0,
        isOperatingDelivery: Boolean(sale.isOperatingDelivery),
        installationCost: Number(sale.installationCost) || 0,
        isOperatingInstallation: Boolean(sale.isOperatingInstallation),
        date: sale.date ? new Date(sale.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        shippingAddress: sale.shippingAddress || '',
        assignedSR: sale.assignedSR?._id || '',
        deliveredBy: sale.deliveredBy?._id || '',
        route: sale.route?._id || '',
        status: sale.status || 'Completed',
        note: sale.note || '',
        paymentMethod: sale.paymentMethod || 'Cash',
        payments: sale.payments && sale.payments.length > 0 ? sale.payments : [{ method: sale.paymentMethod || 'Cash', amount: sale.paidAmount || 0 }]
      });
    } catch (err) {
      setError('Failed to load sale data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/api/contacts/customers');
      setCustomers(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/inventory/current');
      setProducts(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  // Update mutation
  const updateMutation = useMutation(
    (data) => {
      const url = sourceType === 'order' ? `/api/sales-orders/${saleId}/edit` : `/api/sales/${saleId}/edit`;
      return api.put(url, data);
    },
    {
      onSuccess: (response) => {
        setSuccess('Invoice updated successfully! Opening updated invoice...');
        queryClient.invalidateQueries('sales');
        queryClient.invalidateQueries('all-sales-and-orders');
        queryClient.invalidateQueries('sales-orders');
        queryClient.invalidateQueries(['sale', saleId]);
        queryClient.invalidateQueries(['sale-with-invoices', saleId, sourceType]);
        
        setTimeout(() => {
          onClose(true, saleId, sourceType);
        }, 500);
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to update invoice');
      }
    }
  );

  // Handle item changes
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Auto-calculate line total
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount' || field === 'tax') {
      const item = newItems[index];
      const quantity = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(item.quantity) || 0;
      const unitPrice = field === 'unitPrice' ? parseFloat(value) || 0 : parseFloat(item.unitPrice) || 0;
      const discount = field === 'discount' ? parseFloat(value) || 0 : parseFloat(item.discount) || 0;
      const tax = field === 'tax' ? parseFloat(value) || 0 : parseFloat(item.tax) || 0;
      
      newItems[index].lineTotal = (quantity * unitPrice) - discount + tax;
    }
    
    setFormData({ ...formData, items: newItems });
    calculateTotals(newItems);
  };

  // Add new item
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0, lineTotal: 0 }]
    });
  };

  // Remove item
  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
    calculateTotals(newItems);
  };

  // Calculate totals
  const calculateTotals = (
    items,
    additionalExpense = formData.additionalExpense,
    deliveryCharge = formData.deliveryCharge,
    installationCost = formData.installationCost,
    isOpExpense = formData.isOperatingExpense,
    isOpDelivery = formData.isOperatingDelivery,
    isOpInstallation = formData.isOperatingInstallation
  ) => {
    const subTotal = items.reduce((sum, item) => sum + ((item.quantity * item.unitPrice) - item.discount + item.tax), 0);
    const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
    const totalTax = items.reduce((sum, item) => sum + item.tax, 0);
    const extraCharges = 
      (isOpExpense ? 0 : (Number(additionalExpense) || 0)) + 
      (isOpDelivery ? 0 : (Number(deliveryCharge) || 0)) + 
      (isOpInstallation ? 0 : (Number(installationCost) || 0));
    const total = subTotal + extraCharges;
    
    setFormData(prev => ({
      ...prev,
      subTotal,
      discount: totalDiscount,
      tax: totalTax,
      additionalExpense: additionalExpense === '' ? '' : (Number(additionalExpense) || 0),
      deliveryCharge: deliveryCharge === '' ? '' : (Number(deliveryCharge) || 0),
      installationCost: installationCost === '' ? '' : (Number(installationCost) || 0),
      isOperatingExpense: isOpExpense,
      isOperatingDelivery: isOpDelivery,
      isOperatingInstallation: isOpInstallation,
      total,
      dueAmount: total - prev.paidAmount
    }));
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customer) {
      setError('Please select a customer');
      return;
    }
    
    if (!formData.items || formData.items.length === 0) {
      setError('Please add at least one item');
      return;
    }
    
    setError('');
    const payload = {
      ...formData,
      additionalExpense: Number(formData.additionalExpense) || 0,
      isOperatingExpense: Boolean(formData.isOperatingExpense),
      deliveryCharge: Number(formData.deliveryCharge) || 0,
      isOperatingDelivery: Boolean(formData.isOperatingDelivery),
      installationCost: Number(formData.installationCost) || 0,
      isOperatingInstallation: Boolean(formData.isOperatingInstallation)
    };
    updateMutation.mutate(payload);
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1D5F99' }}>
            Edit Invoice
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Customer */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Customer</InputLabel>
                <Select
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  label="Customer"
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer._id} value={customer._id}>
                      {customer.contactName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                margin="normal"
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Partial">Partial</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Split Payment Panel */}
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <SplitPaymentPanel 
                  grandTotal={formData.total}
                  initialPayments={formData.payments}
                  autoSyncGrandTotal={false}
                  onPaymentsChange={(payments, totalPaid) => {
                    setFormData(prev => {
                      if (
                        prev.paidAmount === totalPaid &&
                        JSON.stringify(prev.payments) === JSON.stringify(payments) &&
                        prev.dueAmount === prev.total - totalPaid
                      ) {
                        return prev;
                      }
                      return {
                        ...prev,
                        payments,
                        paidAmount: totalPaid,
                        dueAmount: prev.total - totalPaid,
                        paymentMethod: payments.length > 0 ? payments[0].method : 'Cash'
                      };
                    });
                  }}
                  disabled={loading}
                />
              </Box>
            </Grid>

            {/* Items Table */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, mt: 2, backgroundColor: '#F8FAFC' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Invoice Items
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addItem}
                    size="small"
                    sx={{ color: '#1D5F99' }}
                  >
                    Add Item
                  </Button>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Discount</TableCell>
                        <TableCell align="right">Tax</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              fullWidth
                              size="small"
                              value={typeof item.product === 'string' ? item.product : item.product?._id}
                              onChange={(e) => {
                                const productId = e.target.value;
                                const selectedProduct = products.find(p => p.product._id === productId);
                                const newItem = {
                                  ...item,
                                  product: productId,
                                  unitPrice: selectedProduct?.product.sellingPrice || item.unitPrice
                                };
                                handleItemChange(index, 'product', productId);
                                handleItemChange(index, 'unitPrice', newItem.unitPrice);
                              }}
                            >
                              {products.map((p) => (
                                <MenuItem key={p.product._id} value={p.product._id}>
                                  {p.product.name} (Stock: {p.currentQuantity})
                                </MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                              inputProps={{ min: 1 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={item.discount}
                              onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                              InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={item.tax}
                              onChange={(e) => handleItemChange(index, 'tax', parseFloat(e.target.value) || 0)}
                              InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ৳{((item.quantity * item.unitPrice) - item.discount + item.tax).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => removeItem(index)} color="error">
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Additional Charges (Expense, Delivery, Installation) */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569' }}>
                    Additional Charges & Expenses (৳)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic', bgcolor: '#F1F5F9', px: 1, py: 0.25, borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                    ℹ️ Operating ON: Store bears cost (excluded from customer bill) | OFF: Charged to customer
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Expense (৳)"
                      type="number"
                      value={formData.additionalExpense}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                        calculateTotals(formData.items, val, formData.deliveryCharge, formData.installationCost);
                      }}
                      size="small"
                      inputProps={{ min: 0, step: "any" }}
                      InputProps={{ sx: { borderRadius: '8px', bgcolor: '#fff' } }}
                    />
                    {Number(formData.additionalExpense) > 0 && (
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 1,
                        px: 1,
                        py: 0.5,
                        bgcolor: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                            Expense
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>
                            Operating
                          </Typography>
                        </Box>
                        <Switch
                          checked={formData.isOperatingExpense}
                          onChange={(e) => {
                            calculateTotals(
                              formData.items,
                              formData.additionalExpense,
                              formData.deliveryCharge,
                              formData.installationCost,
                              e.target.checked,
                              formData.isOperatingDelivery,
                              formData.isOperatingInstallation
                            );
                          }}
                          size="small"
                          sx={{
                            width: 34, height: 18, padding: '2px',
                            '& .MuiSwitch-switchBase': { padding: '2px', '&.Mui-checked': { transform: 'translateX(16px)', color: '#fff', '& + .MuiSwitch-track': { backgroundColor: '#6366F1', opacity: 1 } } },
                            '& .MuiSwitch-thumb': { width: 14, height: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' },
                            '& .MuiSwitch-track': { borderRadius: 9, backgroundColor: '#CBD5E1', opacity: 1 }
                          }}
                        />
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Delivery (৳)"
                      type="number"
                      value={formData.deliveryCharge}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                        calculateTotals(formData.items, formData.additionalExpense, val, formData.installationCost);
                      }}
                      size="small"
                      inputProps={{ min: 0, step: "any" }}
                      InputProps={{ sx: { borderRadius: '8px', bgcolor: '#fff' } }}
                    />
                    {Number(formData.deliveryCharge) > 0 && (
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 1,
                        px: 1,
                        py: 0.5,
                        bgcolor: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                            Delivery
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>
                            Operating
                          </Typography>
                        </Box>
                        <Switch
                          checked={formData.isOperatingDelivery}
                          onChange={(e) => {
                            calculateTotals(
                              formData.items,
                              formData.additionalExpense,
                              formData.deliveryCharge,
                              formData.installationCost,
                              formData.isOperatingExpense,
                              e.target.checked,
                              formData.isOperatingInstallation
                            );
                          }}
                          size="small"
                          sx={{
                            width: 34, height: 18, padding: '2px',
                            '& .MuiSwitch-switchBase': { padding: '2px', '&.Mui-checked': { transform: 'translateX(16px)', color: '#fff', '& + .MuiSwitch-track': { backgroundColor: '#6366F1', opacity: 1 } } },
                            '& .MuiSwitch-thumb': { width: 14, height: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' },
                            '& .MuiSwitch-track': { borderRadius: 9, backgroundColor: '#CBD5E1', opacity: 1 }
                          }}
                        />
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Installation (৳)"
                      type="number"
                      value={formData.installationCost}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                        calculateTotals(formData.items, formData.additionalExpense, formData.deliveryCharge, val);
                      }}
                      size="small"
                      inputProps={{ min: 0, step: "any" }}
                      InputProps={{ sx: { borderRadius: '8px', bgcolor: '#fff' } }}
                    />
                    {Number(formData.installationCost) > 0 && (
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 1,
                        px: 1,
                        py: 0.5,
                        bgcolor: '#fff',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                            Installation
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>
                            Operating
                          </Typography>
                        </Box>
                        <Switch
                          checked={formData.isOperatingInstallation}
                          onChange={(e) => {
                            calculateTotals(
                              formData.items,
                              formData.additionalExpense,
                              formData.deliveryCharge,
                              formData.installationCost,
                              formData.isOperatingExpense,
                              formData.isOperatingDelivery,
                              e.target.checked
                            );
                          }}
                          size="small"
                          sx={{
                            width: 34, height: 18, padding: '2px',
                            '& .MuiSwitch-switchBase': { padding: '2px', '&.Mui-checked': { transform: 'translateX(16px)', color: '#fff', '& + .MuiSwitch-track': { backgroundColor: '#6366F1', opacity: 1 } } },
                            '& .MuiSwitch-thumb': { width: 14, height: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' },
                            '& .MuiSwitch-track': { borderRadius: 9, backgroundColor: '#CBD5E1', opacity: 1 }
                          }}
                        />
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Totals */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: '#f0f9ff' }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2">Subtotal:</Typography>
                  </Grid>
                  <Grid item xs={6} align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>৳{formData.subTotal.toFixed(2)}</Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2">Discount:</Typography>
                  </Grid>
                  <Grid item xs={6} align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#ef4444' }}>-৳{formData.discount.toFixed(2)}</Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2">Tax:</Typography>
                  </Grid>
                  <Grid item xs={6} align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#22c55e' }}>+৳{formData.tax.toFixed(2)}</Typography>
                  </Grid>
                  
                  {(formData.additionalExpense > 0 || formData.deliveryCharge > 0 || formData.installationCost > 0) && (
                    <>
                      {formData.additionalExpense > 0 && (
                        <>
                          <Grid item xs={6}>
                            <Typography variant="body2">Expense{formData.isOperatingExpense ? ' (Operating)' : ''}:</Typography>
                          </Grid>
                          <Grid item xs={6} align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>+৳{Number(formData.additionalExpense).toFixed(2)}</Typography>
                          </Grid>
                        </>
                      )}
                      {formData.deliveryCharge > 0 && (
                        <>
                          <Grid item xs={6}>
                            <Typography variant="body2">Delivery{formData.isOperatingDelivery ? ' (Operating)' : ''}:</Typography>
                          </Grid>
                          <Grid item xs={6} align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>+৳{Number(formData.deliveryCharge).toFixed(2)}</Typography>
                          </Grid>
                        </>
                      )}
                      {formData.installationCost > 0 && (
                        <>
                          <Grid item xs={6}>
                            <Typography variant="body2">Installation{formData.isOperatingInstallation ? ' (Operating)' : ''}:</Typography>
                          </Grid>
                          <Grid item xs={6} align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>+৳{Number(formData.installationCost).toFixed(2)}</Typography>
                          </Grid>
                        </>
                      )}
                    </>
                  )}
                  
                  <Grid item xs={12}>
                    <Box sx={{ my: 1, borderTop: '2px solid #1D5F99' }} />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Total:</Typography>
                  </Grid>
                  <Grid item xs={6} align="right">
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1D5F99' }}>৳{formData.total.toFixed(2)}</Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2">Paid:</Typography>
                  </Grid>
                  <Grid item xs={6} align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>৳{formData.paidAmount.toFixed(2)}</Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Due:</Typography>
                  </Grid>
                  <Grid item xs={6} align="right">
                    <Typography variant="h6" sx={{ fontWeight: 700, color: formData.dueAmount > 0 ? '#ef4444' : '#22c55e' }}>
                      ৳{formData.dueAmount.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Additional Info */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Shipping Address"
                value={formData.shippingAddress}
                onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                multiline
                rows={2}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                multiline
                rows={3}
                margin="normal"
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={updateMutation.isLoading}
          startIcon={updateMutation.isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
          sx={{
            backgroundColor: '#1D5F99',
            '&:hover': { backgroundColor: '#42A2C2' }
          }}
        >
          {updateMutation.isLoading ? 'Updating...' : 'Update Invoice'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditInvoiceModal;
