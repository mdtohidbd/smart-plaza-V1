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
  Divider,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const AddPurchase = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    supplier: '',
    challanNumber: '',
    date: new Date().toISOString().split('T')[0],
    shippingAddress: '',
    items: [{ product: '', quantity: 1, unitPrice: '', sellingPrice: '', emiPrice: '', discount: '', tax: 15 }],
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

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Supplier modal states
  const [openAddSupplierModal, setOpenAddSupplierModal] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contactNumber: '',
    contactName: '',
    email: '',
    openingBalance: '',
    address: '',
    note: ''
  });
  const [supplierError, setSupplierError] = useState('');
  const [supplierSuccess, setSupplierSuccess] = useState('');

  const queryClient = useQueryClient();

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery('suppliers', async () => {
    const response = await api.get('/api/suppliers');
    return response.data.data;
  });

  // Fetch products
  const { data: products = [] } = useQuery('products', async () => {
    const response = await api.get('/api/products');
    return response.data.data;
  });

  // Mutation for creating purchase
  const createPurchaseMutation = useMutation(
    (purchaseData) => api.post('/api/purchases', purchaseData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('purchases');
        queryClient.invalidateQueries('dashboardData');
        setFormData({
          supplier: '',
          challanNumber: '',
          date: new Date().toISOString().split('T')[0],
          shippingAddress: '',
          items: [{ product: '', quantity: 1, unitPrice: '', sellingPrice: '', emiPrice: '', discount: '', tax: 15 }],
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
        setSuccess('Purchase created successfully! Redirecting...');
        setTimeout(() => {
          setSuccess('');
          navigate('/dashboard/purchase/all');
        }, 1500);
      },
      onError: (error) => {
        setError(error.response?.data?.message || error.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  );

  // Mutation for creating supplier (company)
  const createSupplierMutation = useMutation(
    (supplierData) => api.post('/api/suppliers', supplierData),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('suppliers');
        queryClient.invalidateQueries('companies');
        const createdSupplier = response.data.data;
        setFormData((prev) => ({
          ...prev,
          supplier: createdSupplier._id
        }));
        setSupplierFormData({
          name: '',
          contactNumber: '',
          contactName: '',
          email: '',
          openingBalance: '',
          address: '',
          note: ''
        });
        setSupplierSuccess('Supplier created successfully!');
        setTimeout(() => {
          setSupplierSuccess('');
          setOpenAddSupplierModal(false);
        }, 1500);
      },
      onError: (err) => {
        setSupplierError(err.response?.data?.message || err.message);
        setTimeout(() => setSupplierError(''), 5000);
      }
    }
  );

  const handleSupplierChange = (e) => {
    const { name, value } = e.target;
    setSupplierFormData({
      ...supplierFormData,
      [name]: value
    });
  };

  const handleSupplierSubmit = (e) => {
    e.preventDefault();
    createSupplierMutation.mutate(supplierFormData);
  };

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

    // Auto-populate unit price when product is selected
    if (field === 'product' && value) {
      const selectedProduct = (products || []).find(p => p._id === value);
      if (selectedProduct) {
        if (newItems[index].unitPrice === 0 || newItems[index].unitPrice === '') {
          newItems[index].unitPrice = selectedProduct.purchasePrice || '';
        }
        if (newItems[index].sellingPrice === undefined || newItems[index].sellingPrice === '') {
          newItems[index].sellingPrice = selectedProduct.sellingPrice || '';
        }
        if (newItems[index].emiPrice === undefined || newItems[index].emiPrice === '') {
          newItems[index].emiPrice = selectedProduct.emiPrice || '';
        }
        if (newItems[index].tax === undefined || newItems[index].tax === '') {
          newItems[index].tax = 15; // default to 15%
        }
      }
    }

    setFormData({
      ...formData,
      items: newItems
    });

    calculateTotals(newItems);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: 1, unitPrice: '', sellingPrice: '', emiPrice: '', discount: '', tax: 15 }]
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
    const subTotal = items.reduce((sum, item) => {
      const price = parseFloat(item.unitPrice) || 0;
      const qty = parseInt(item.quantity) || 0;
      return sum + (qty * price);
    }, 0);
    const totalDiscount = items.reduce((sum, item) => sum + (parseFloat(item.discount) || 0), 0);
    const totalTax = items.reduce((sum, item) => {
      const price = parseFloat(item.unitPrice) || 0;
      const qty = parseInt(item.quantity) || 0;
      const discount = parseFloat(item.discount) || 0;
      const taxPercent = parseFloat(item.tax) || 0;
      const itemTaxAmount = ((qty * price) - discount) * (taxPercent / 100);
      return sum + itemTaxAmount;
    }, 0);
    const total = subTotal - totalDiscount + totalTax;
    const paid = parseFloat(calculation.paidAmount) || 0;
    const dueAmount = total - paid;

    setCalculation({
      ...calculation,
      subTotal,
      discount: totalDiscount,
      tax: totalTax,
      total,
      dueAmount
    });
  };

  const handlePaidAmountChange = (e) => {
    const val = e.target.value;
    const paidAmount = val === '' ? '' : parseFloat(val);
    const numericPaid = parseFloat(val) || 0;
    setCalculation({
      ...calculation,
      paidAmount,
      dueAmount: calculation.total - numericPaid
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formattedItems = formData.items.map(item => {
      const price = parseFloat(item.unitPrice) || 0;
      const qty = parseInt(item.quantity) || 1;
      const discount = parseFloat(item.discount) || 0;
      const taxPercent = parseFloat(item.tax) || 0;

      return {
        product: item.product,
        quantity: qty,
        unitPrice: price,
        sellingPrice: parseFloat(item.sellingPrice) || 0,
        emiPrice: item.emiPrice === '' ? null : parseFloat(item.emiPrice),
        discount: discount,
        tax: taxPercent
      };
    });

    const purchaseData = {
      ...formData,
      items: formattedItems,
      purchaseNumber: `PUR-${Date.now()}`, // Generate a simple purchase number
      subTotal: calculation.subTotal,
      discount: calculation.discount,
      tax: calculation.tax,
      total: calculation.total,
      paidAmount: parseFloat(calculation.paidAmount) || 0,
      dueAmount: calculation.dueAmount,
      paymentMethod: 'Cash', // Default payment method
      status: calculation.dueAmount > 0 ? 'Partial' : 'Completed'
    };

    createPurchaseMutation.mutate(purchaseData);
  };

  return (
    <Box sx={{ py: { xs: 1, sm: 1.5 }, backgroundColor: '#F8FAFC' }}>
      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              backgroundColor: '#fff',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={() => navigate(-1)} sx={{ color: '#64748b', mr: 1 }}>
                  <ArrowBackIcon />
                </IconButton>
                <Box>
                  <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                    Add Purchase
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                    Create a new purchase order with products from suppliers.
                  </Typography>
                </Box>
              </Box>
            </Box>

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
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Supplier</InputLabel>
                      <Select
                        name="supplier"
                        value={formData.supplier}
                        onChange={handleInputChange}
                        label="Supplier"
                        sx={{ borderRadius: '6px' }}
                      >
                        {suppliers?.map((supplier) => (
                          <MenuItem key={supplier._id} value={supplier._id}>
                            {supplier.name} ({supplier.contactNumber})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <IconButton
                      onClick={() => setOpenAddSupplierModal(true)}
                      sx={{
                        bgcolor: '#1D5F99',
                        color: 'white',
                        borderRadius: '6px',
                        width: 40,
                        height: 40,
                        '&:hover': {
                          bgcolor: '#42A2C2'
                        }
                      }}
                      title="Add New Supplier"
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Challan Number"
                    name="challanNumber"
                    value={formData.challanNumber}
                    onChange={handleInputChange}
                    InputProps={{
                      sx: { borderRadius: '6px' }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Date"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      sx: { borderRadius: '6px' }
                    }}
                  />
                </Grid>

              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ color: '#1e293b', fontWeight: 600 }}>Items</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addItem}
                    sx={{
                      borderColor: '#1D5F99',
                      color: '#1D5F99',
                      borderRadius: '6px',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: '#1D5F99',
                        color: 'white',
                        borderColor: '#1D5F99'
                      }
                    }}
                  >
                    Add Item
                  </Button>
                </Box>

                {isMobile ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {formData.items.map((item, index) => (
                      <Paper key={index} variant="outlined" sx={{ p: 1.5, borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>Item {index + 1}</Typography>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => removeItem(index)}
                            disabled={formData.items.length === 1}
                            sx={{ p: 0.5 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Grid container spacing={1.5}>
                          <Grid item xs={12}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Product *</InputLabel>
                              <Select
                                value={item.product}
                                onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                                label="Product *"
                                sx={{ borderRadius: '6px' }}
                              >
                                {products?.map((product) => (
                                  <MenuItem key={product._id} value={product._id}>
                                    {product.name} - ৳{product.purchasePrice}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="Qty *"
                              fullWidth
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || '')}
                              inputProps={{ min: 1 }}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="Unit Price *"
                              fullWidth
                              type="number"
                              size="small"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="Selling Price *"
                              fullWidth
                              type="number"
                              size="small"
                              value={item.sellingPrice}
                              onChange={(e) => handleItemChange(index, 'sellingPrice', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="EMI Price"
                              fullWidth
                              type="number"
                              size="small"
                              value={item.emiPrice}
                              onChange={(e) => handleItemChange(index, 'emiPrice', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="Discount"
                              fullWidth
                              type="number"
                              size="small"
                              value={item.discount}
                              onChange={(e) => handleItemChange(index, 'discount', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="Tax (%)"
                              fullWidth
                              type="number"
                              size="small"
                              value={item.tax}
                              onChange={(e) => handleItemChange(index, 'tax', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, pt: 1.5, borderTop: '1px dashed #eaeef3' }}>
                              <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>Total Price:</Typography>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1D5F99' }}>
                                ৳{(((parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0) - (parseFloat(item.discount) || 0)) * (1 + (parseFloat(item.tax) || 0) / 100)).toFixed(2)}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <TableContainer sx={{ overflow: 'auto', border: '1px solid #eaeef3', borderRadius: '8px' }}>
                  <Table
                    sx={{
                      minWidth: 800,
                      tableLayout: 'auto'
                    }}
                  >
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                        <TableCell sx={{ color: '#475569', fontWeight: 600, fontSize: '13px', py: 1, minWidth: 200 }}>Product *</TableCell>
                        <TableCell sx={{ color: '#475569', fontWeight: 600, fontSize: '13px', py: 1, minWidth: 100 }}>Quantity *</TableCell>
                        <TableCell align="right" sx={{ color: '#475569', fontWeight: 600, fontSize: '13px', py: 1, minWidth: 120 }}>Unit Price (৳) *</TableCell>
                        <TableCell align="right" sx={{ color: '#475569', fontWeight: 600, fontSize: '13px', py: 1, minWidth: 120 }}>Selling Price (৳) *</TableCell>
                        <TableCell align="right" sx={{ color: '#475569', fontWeight: 600, fontSize: '13px', py: 1, minWidth: 120 }}>EMI Price (৳)</TableCell>
                        <TableCell align="right" sx={{ color: '#475569', fontWeight: 600, fontSize: '13px', py: 1, minWidth: 120 }}>Discount (৳)</TableCell>
                        <TableCell align="right" sx={{ color: '#475569', fontWeight: 600, fontSize: '13px', py: 1, minWidth: 100 }}>Tax (%)</TableCell>
                        <TableCell align="right" sx={{ color: '#475569', fontWeight: 600, fontSize: '13px', py: 1, minWidth: 120 }}>Total (৳)</TableCell>
                        <TableCell sx={{ color: '#475569', fontWeight: 600, fontSize: '13px', py: 1, minWidth: 80 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            '&:hover': {
                              backgroundColor: '#f8fafc',
                            }
                          }}
                        >
                          <TableCell sx={{ py: 1 }}>
                            <FormControl fullWidth size="small">
                              <Select
                                value={item.product}
                                onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                                sx={{ borderRadius: '6px' }}
                              >
                                {products?.map((product) => (
                                  <MenuItem key={product._id} value={product._id}>
                                    {product.name} - ৳{product.purchasePrice}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || '')}
                              inputProps={{ min: 1 }}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1 }}>
                            <TextField
                              type="number"
                              size="small"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1 }}>
                            <TextField
                              type="number"
                              size="small"
                              value={item.sellingPrice}
                              onChange={(e) => handleItemChange(index, 'sellingPrice', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1 }}>
                            <TextField
                              type="number"
                              size="small"
                              value={item.emiPrice}
                              onChange={(e) => handleItemChange(index, 'emiPrice', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1 }}>
                            <TextField
                              type="number"
                              size="small"
                              value={item.discount}
                              onChange={(e) => handleItemChange(index, 'discount', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1 }}>
                            <TextField
                              type="number"
                              size="small"
                              value={item.tax}
                              onChange={(e) => handleItemChange(index, 'tax', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#1e293b', fontWeight: 600, py: 1 }}>
                            ৳{(((parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0) - (parseFloat(item.discount) || 0)) * (1 + (parseFloat(item.tax) || 0) / 100)).toFixed(2)}
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => removeItem(index)}
                              disabled={formData.items.length === 1}
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'rgba(244, 67, 54, 0.1)'
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                )}
              </Box>

              <Grid container spacing={1.5}>
                <Grid item xs={12} md={7}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Note"
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    multiline
                    rows={4}
                    InputProps={{
                      sx: { borderRadius: '6px' }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={5}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      backgroundColor: '#f8fafc',
                      border: '1px solid #eaeef3',
                      borderRadius: '8px',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: '#1e293b', fontWeight: 600, mb: 1 }}>Summary</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">Sub Total:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>৳{calculation.subTotal.toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">Discount:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }} color="error">-৳{calculation.discount.toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">Tax:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>+৳{calculation.tax.toFixed(2)}</Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1e293b' }}>Total:</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1e293b' }}>৳{calculation.total.toFixed(2)}</Typography>
                      </Box>
                      <TextField
                        fullWidth
                        size="small"
                        label="Paid Amount"
                        type="number"
                        value={calculation.paidAmount}
                        onChange={handlePaidAmountChange}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                          sx: { borderRadius: '6px' }
                        }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }} color={calculation.dueAmount > 0 ? 'error' : 'success'}>
                          Due Amount:
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }} color={calculation.dueAmount > 0 ? 'error' : 'success'}>
                          ৳{calculation.dueAmount.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  size="small"
                  type="submit"
                  disabled={createPurchaseMutation.isLoading}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: '6px',
                    backgroundColor: '#1D5F99',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#42A2C2'
                    }
                  }}
                >
                  {createPurchaseMutation.isLoading ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1, color: 'white' }} />
                      Creating...
                    </>
                  ) : 'Create Purchase'}
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>
      </Grid>

      {/* Add Supplier Dialog */}
      <Dialog
        open={openAddSupplierModal}
        onClose={() => setOpenAddSupplierModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #1D5F99 0%, #42A2C2 100%)',
            color: 'white',
            fontWeight: 600,
            fontSize: '1.1rem',
            py: 2,
            px: 3
          }}
        >
          Add New Supplier
        </DialogTitle>
        <form onSubmit={handleSupplierSubmit}>
          <DialogContent sx={{ px: 3, py: 3 }}>
            {supplierError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {supplierError}
              </Alert>
            )}
            {supplierSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {supplierSuccess}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Supplier / Company Name *"
                  name="name"
                  value={supplierFormData.name}
                  onChange={handleSupplierChange}
                  required
                  InputProps={{ sx: { borderRadius: '6px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Contact Number *"
                  name="contactNumber"
                  value={supplierFormData.contactNumber}
                  onChange={handleSupplierChange}
                  required
                  InputProps={{ sx: { borderRadius: '6px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Contact Person Name *"
                  name="contactName"
                  value={supplierFormData.contactName}
                  onChange={handleSupplierChange}
                  required
                  InputProps={{ sx: { borderRadius: '6px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email"
                  type="email"
                  name="email"
                  value={supplierFormData.email}
                  onChange={handleSupplierChange}
                  InputProps={{ sx: { borderRadius: '6px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Opening Balance"
                  type="number"
                  name="openingBalance"
                  value={supplierFormData.openingBalance}
                  onChange={handleSupplierChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                    sx: { borderRadius: '6px' }
                  }}
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Address"
                  name="address"
                  value={supplierFormData.address}
                  onChange={handleSupplierChange}
                  multiline
                  rows={2}
                  InputProps={{ sx: { borderRadius: '6px' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Note"
                  name="note"
                  value={supplierFormData.note}
                  onChange={handleSupplierChange}
                  multiline
                  rows={2}
                  InputProps={{ sx: { borderRadius: '6px' } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #eaeef3', bgcolor: '#F8FAFC' }}>
            <Button
              onClick={() => setOpenAddSupplierModal(false)}
              sx={{
                color: '#64748b',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={createSupplierMutation.isLoading}
              sx={{
                bgcolor: '#1D5F99',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '6px',
                '&:hover': {
                  bgcolor: '#42A2C2'
                }
              }}
            >
              {createSupplierMutation.isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                'Save Supplier'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AddPurchase;