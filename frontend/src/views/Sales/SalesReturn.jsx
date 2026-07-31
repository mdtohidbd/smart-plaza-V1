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
  Card,
  CardContent
} from '@mui/material';
import { 
  Add as AddIcon, 
  Remove as RemoveIcon, 
  Delete as DeleteIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';

const SalesReturn = () => {
  console.log('SalesReturn component rendered');
  
  const [formData, setFormData] = useState({
    sale: '',
    customer: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ product: '', quantity: 1, unitPrice: '', reason: '' }],
    note: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const queryClient = useQueryClient();

  // Fetch sales
  const { data: sales = [] } = useQuery('sales', async () => {
    const response = await api.get('/api/sales');
    return response.data.data;
  });

  // Fetch products
  const { data: products = [] } = useQuery('products', async () => {
    const response = await api.get('/api/products');
    return response.data.data;
  });

  // Mutation for creating sales return
  const createReturnMutation = useMutation(
    (returnData) => api.post('/api/sales/returns', returnData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sales-returns');
        queryClient.invalidateQueries('dashboardData');
        setFormData({
          sale: '',
          customer: '',
          date: new Date().toISOString().split('T')[0],
          items: [{ product: '', quantity: 1, unitPrice: '', reason: '' }],
          note: ''
        });
        setSuccess('Sales return processed successfully!');
        setTimeout(() => setSuccess(''), 4000);
      },
      onError: (error) => {
        setError(error.response?.data?.message || error.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  );

  const getProductId = (product) => {
    if (!product) return '';
    return typeof product === 'object' ? product._id : product;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'sale') {
      const selectedSale = sales.find(sale => sale._id === value);
      
      if (selectedSale && selectedSale.items && selectedSale.items.length > 0) {
        const returnItems = selectedSale.items.map(item => ({
          product: item.product,
          quantity: 1, 
          unitPrice: item.unitPrice, 
          reason: ''
        }));
        
        setFormData({
          ...formData,
          sale: value,
          customer: selectedSale.customer?._id || selectedSale.customer || '',
          items: returnItems
        });
      } else {
        setFormData({
          ...formData,
          sale: value,
          customer: selectedSale?.customer?._id || selectedSale?.customer || '',
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // Auto-populate unit price when product is selected
    if (field === 'product' && value) {
      const selectedProduct = products.find(p => p._id === value);
      if (selectedProduct) {
        if (!newItems[index].unitPrice || Number(newItems[index].unitPrice) === 0) {
          newItems[index].unitPrice = selectedProduct.sellingPrice || 0;
        }
      }
    }

    setFormData({
      ...formData,
      items: newItems
    });
  };

  const updateQuantity = (index, newQty) => {
    if (newQty < 1) return;
    const newItems = [...formData.items];
    newItems[index].quantity = Number(newQty);
    setFormData({
      ...formData,
      items: newItems
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: 1, unitPrice: '', reason: '' }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({
      ...formData,
      items: newItems
    });
  };

  const calculateTotalRefund = () => {
    return formData.items.reduce((sum, item) => {
      const price = Number(item.unitPrice || 0);
      const qty = Number(item.quantity || 0);
      return sum + (price * qty);
    }, 0);
  };

  const getSelectedSaleCustomer = () => {
    if (!formData.sale || !sales) return null;
    const selectedSale = sales.find(sale => sale._id === formData.sale);
    return selectedSale?.customer || null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.items.some(item => !item.product || !item.quantity || Number(item.quantity) <= 0)) {
      setError('Please select products and specify return quantity.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    // Coerce raw items to numeric payloads
    const payload = {
      ...formData,
      items: formData.items.map(item => ({
        product: getProductId(item.product),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice || 0),
        reason: item.reason
      }))
    };

    createReturnMutation.mutate(payload);
  };

  const customerObj = getSelectedSaleCustomer();

  return (
    <Box sx={{
      height: { xs: 'auto', md: 'calc(100vh - 64px)' },
      display: 'flex',
      flexDirection: 'column',
      overflow: { xs: 'auto', md: 'hidden' },
      px: { xs: 1.5, sm: 3 },
      py: { xs: 2, sm: 3 },
      backgroundColor: '#F8FAFC',
      boxSizing: 'border-box',
      fontFamily: '"Outfit", sans-serif',
    }}>
      {/* Header Panel */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 1, sm: 0 }, justifyContent: 'space-between', mb: { xs: 2, sm: 1.5 }, minHeight: { xs: 'auto', sm: '36px' } }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', fontFamily: '"Outfit", sans-serif', fontSize: '1.25rem' }}>
            Sales Return
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', display: { xs: 'none', sm: 'block' }, fontSize: '11px', fontFamily: '"Outfit", sans-serif' }}>
            Process customer product returns, track refund calculations and update stock levels
          </Typography>
        </Box>
        
        {/* Success/Error Toast Overlay */}
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, flexWrap: 'wrap' }}>
          {error && <Alert severity="error" variant="filled" sx={{ py: 0, px: 2, borderRadius: '8px', fontSize: '11.5px', minHeight: '32px', display: 'flex', alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>{error}</Alert>}
          {success && <Alert severity="success" variant="filled" sx={{ py: 0, px: 2, borderRadius: '8px', fontSize: '11.5px', minHeight: '32px', display: 'flex', alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>{success}</Alert>}
        </Box>
      </Box>

      {/* Two Column Layout Grid */}
      <Grid container spacing={2} sx={{ flexGrow: 1, height: { xs: 'auto', md: 'calc(100% - 36px)' }, minHeight: 0 }}>
        
        {/* Left Column: Return Products Table / Cards */}
        <Grid item xs={12} md={7.5} sx={{ height: { xs: 'auto', md: '100%' }, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Paper sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: 0, 
            p: { xs: 1.5, sm: 2 }, 
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            border: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            mb: { xs: 2, md: 0 }
          }}>
            {/* Table Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '12.5px', fontFamily: '"Outfit", sans-serif' }}>
                Items to Return ({formData.items.length})
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addItem}
                size="small"
                sx={{
                  borderColor: '#1D5F99',
                  color: '#1D5F99',
                  borderRadius: '6px',
                  textTransform: 'none',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  fontFamily: '"Outfit", sans-serif',
                  py: 0.5,
                  px: 1.5,
                  '&:hover': {
                    backgroundColor: 'rgba(29, 95, 153, 0.08)',
                    borderColor: '#1D5F99'
                  }
                }}
              >
                Add Item
              </Button>
            </Box>

            {/* Desktop View: Return Items Table */}
            <TableContainer sx={{ display: { xs: 'none', sm: 'block' }, flexGrow: 1, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{
                    '& .MuiTableCell-head': {
                      backgroundColor: '#F8FAFC',
                      color: '#64748B',
                      fontWeight: 700,
                      fontSize: '10.5px',
                      textTransform: 'uppercase',
                      padding: '8px 12px',
                      borderBottom: '1px solid #E2E8F0',
                      fontFamily: '"Outfit", sans-serif',
                    }
                  }}>
                    <TableCell>Product Description</TableCell>
                    <TableCell align="center" width="115">Qty to Return</TableCell>
                    <TableCell align="right" width="105">Unit Price (৳)</TableCell>
                    <TableCell align="left" width="180">Reason for Return</TableCell>
                    <TableCell align="right" width="110">Refund Total</TableCell>
                    <TableCell align="center" width="50"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#94A3B8', fontSize: '12px', fontFamily: '"Outfit", sans-serif' }}>
                        No items added to this return yet. Select an invoice or add items above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    formData.items.map((item, index) => {
                      const prodId = getProductId(item.product);
                      return (
                        <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#F8FAFC' } }}>
                          
                          {/* Product Selector Dropdown */}
                          <TableCell sx={{ py: 0.5, px: 1.5 }}>
                            <FormControl fullWidth size="small">
                              <Select
                                value={prodId}
                                onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                                size="small"
                                displayEmpty
                                renderValue={(selected) => {
                                  if (!selected) {
                                    return <Typography sx={{ color: '#94A3B8', fontSize: '12px', fontFamily: '"Outfit", sans-serif' }}>Choose Product...</Typography>;
                                  }
                                  const prod = products.find(p => p._id === selected);
                                  return (
                                    <Typography sx={{ fontWeight: 600, color: '#1E293B', fontSize: '12px', fontFamily: '"Outfit", sans-serif' }}>
                                      {prod ? prod.name : 'Unknown Product'}
                                    </Typography>
                                  );
                                }}
                                sx={{ 
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  backgroundColor: '#F8FAFC',
                                  '& .MuiSelect-select': { py: '4px', px: '6px' }
                                }}
                              >
                                {products?.map((product) => (
                                  <MenuItem key={product._id} value={product._id} sx={{ fontSize: '12px', fontFamily: '"Outfit", sans-serif' }}>
                                    {product.name} — ৳{product.sellingPrice}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>

                          {/* Editable Qty with Compact +/- Controls */}
                          <TableCell align="center" sx={{ py: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <IconButton 
                                size="small"
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                sx={{
                                  p: 0.25,
                                  color: '#1D5F99',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: '4px',
                                  '&:hover': { backgroundColor: 'rgba(29, 95, 153, 0.08)' }
                                }}
                              >
                                <RemoveIcon sx={{ fontSize: 11 }} />
                              </IconButton>
                              <Typography sx={{ mx: 1.25, minWidth: '16px', textAlign: 'center', fontSize: '12.5px', fontWeight: 600, fontFamily: '"Outfit", sans-serif', color: '#1E293B' }}>
                                {item.quantity}
                              </Typography>
                              <IconButton 
                                size="small"
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                sx={{
                                  p: 0.25,
                                  color: '#1D5F99',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: '4px',
                                  '&:hover': { backgroundColor: 'rgba(29, 95, 153, 0.08)' }
                                }}
                              >
                                <AddIcon sx={{ fontSize: 11 }} />
                              </IconButton>
                            </Box>
                          </TableCell>

                          {/* Editable Unit Price */}
                          <TableCell align="right" sx={{ py: 0.5 }}>
                            <TextField 
                              size="small" 
                              type="number" 
                              value={item.unitPrice} 
                              onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} 
                              inputProps={{ style: { textAlign: 'right', fontSize: '12px', padding: '4px 6px', fontFamily: '"Outfit", sans-serif' } }}
                              sx={{
                                width: '90px',
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '6px',
                                  backgroundColor: '#F8FAFC'
                                }
                              }}
                            />
                          </TableCell>

                          {/* Reason for Return */}
                          <TableCell align="left" sx={{ py: 0.5 }}>
                            <TextField 
                              size="small"
                              value={item.reason || ''} 
                              onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                              placeholder="e.g. Defective, Damage"
                              inputProps={{ style: { fontSize: '12px', padding: '4px 8px', fontFamily: '"Outfit", sans-serif' } }}
                              sx={{
                                width: '100%',
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '6px',
                                  backgroundColor: '#F8FAFC'
                                }
                              }}
                            />
                          </TableCell>

                          {/* Refund Row Subtotal */}
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '12px', fontFamily: '"Outfit", sans-serif', py: 0.5 }}>
                            ৳{(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2)}
                          </TableCell>

                          {/* Delete Item Action */}
                          <TableCell align="center" sx={{ py: 0.5 }}>
                            <IconButton size="small" onClick={() => removeItem(index)} sx={{ color: '#EF4444', p: 0.5 }}>
                              <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Mobile View: Render Return Items as Card Forms */}
            <Box sx={{ display: { xs: 'block', sm: 'none' }, maxHeight: { xs: '450px', md: 'none' }, overflowY: 'auto' }}>
              {formData.items.length === 0 ? (
                <Box sx={{ py: 4, color: '#94A3B8', fontSize: '12px', fontFamily: '"Outfit", sans-serif', textAlign: 'center' }}>
                  No items added to this return yet. Select an invoice or add items above.
                </Box>
              ) : (
                formData.items.map((item, index) => {
                  const prodId = getProductId(item.product);
                  return (
                    <Paper
                      key={index}
                      sx={{
                        p: 1.5,
                        mb: 1.5,
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#F8FAFC',
                        fontFamily: '"Outfit", sans-serif',
                        boxShadow: 'none'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1D5F99', fontSize: '12px' }}>
                          Item #{index + 1}
                        </Typography>
                        <IconButton size="small" onClick={() => removeItem(index)} sx={{ color: '#EF4444', p: 0.5 }}>
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>

                      {/* Product Dropdown Selector */}
                      <Box sx={{ mb: 1.5 }}>
                        <FormControl fullWidth size="small">
                          <Select
                            value={prodId}
                            onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                            size="small"
                            displayEmpty
                            renderValue={(selected) => {
                              if (!selected) {
                                return <Typography sx={{ color: '#94A3B8', fontSize: '12px', fontFamily: '"Outfit", sans-serif' }}>Choose Product...</Typography>;
                              }
                              const prod = products.find(p => p._id === selected);
                              return (
                                <Typography sx={{ fontWeight: 600, color: '#1E293B', fontSize: '12px', fontFamily: '"Outfit", sans-serif' }}>
                                  {prod ? prod.name : 'Unknown Product'}
                                </Typography>
                              );
                            }}
                            sx={{ 
                              borderRadius: '6px',
                              fontSize: '12px',
                              backgroundColor: '#FFFFFF',
                              '& .MuiSelect-select': { py: '6px', px: '8px' }
                            }}
                          >
                            {products?.map((product) => (
                              <MenuItem key={product._id} value={product._id} sx={{ fontSize: '12px', fontFamily: '"Outfit", sans-serif' }}>
                                {product.name} — ৳{product.sellingPrice}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>

                      {/* Quantity counter and Unit Price */}
                      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5, fontSize: '0.7rem' }}>Qty to Return</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', py: 0.25, px: 0.5 }}>
                            <IconButton 
                              size="small"
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              sx={{
                                p: 0.25,
                                color: '#1D5F99',
                                '&:hover': { backgroundColor: 'rgba(29, 95, 153, 0.08)' }
                              }}
                            >
                              <RemoveIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                            <Typography sx={{ mx: 'auto', minWidth: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>
                              {item.quantity}
                            </Typography>
                            <IconButton 
                              size="small"
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              sx={{
                                p: 0.25,
                                color: '#1D5F99',
                                '&:hover': { backgroundColor: 'rgba(29, 95, 153, 0.08)' }
                              }}
                            >
                              <AddIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Box>
                        </Grid>

                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5, fontSize: '0.7rem' }}>Unit Price (৳)</Typography>
                          <TextField 
                            size="small" 
                            type="number" 
                            value={item.unitPrice} 
                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} 
                            inputProps={{ style: { textAlign: 'right', fontSize: '12px', padding: '6px 8px', fontFamily: '"Outfit", sans-serif' } }}
                            sx={{
                              width: '100%',
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '6px',
                                backgroundColor: '#FFFFFF'
                              }
                            }}
                          />
                        </Grid>
                      </Grid>

                      {/* Return Reason Field */}
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5, fontSize: '0.7rem' }}>Reason for Return</Typography>
                        <TextField 
                          size="small"
                          value={item.reason || ''} 
                          onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                          placeholder="e.g. Defective, Damage"
                          inputProps={{ style: { fontSize: '12px', padding: '6px 8px', fontFamily: '"Outfit", sans-serif' } }}
                          sx={{
                            width: '100%',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '6px',
                              backgroundColor: '#FFFFFF'
                            }
                          }}
                        />
                      </Box>

                      {/* Refund Total */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', p: 1, borderRadius: '6px', border: '1px dashed #CBD5E1' }}>
                        <Typography sx={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Refund Total:</Typography>
                        <Typography sx={{ color: '#1E293B', fontSize: '12.5px', fontWeight: 700 }}>
                          ৳{(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2)}
                        </Typography>
                      </Box>
                    </Paper>
                  );
                })
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Transaction Details, Notes & Return Summary */}
        <Grid item xs={12} md={4.5} sx={{ height: { xs: 'auto', md: '100%' }, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <form onSubmit={handleSubmit} style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, gap: 12 }}>
            
            {/* Return Information Details Card */}
            <Paper sx={{ 
              p: 1.5, 
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '12.5px', mb: 1.25, fontFamily: '"Outfit", sans-serif' }}>
                Return Information
              </Typography>
              <Grid container spacing={1.25}>
                
                {/* Select Invoice dropdown */}
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel id="sale-select-label" sx={{ fontSize: '12.5px', fontFamily: '"Outfit", sans-serif' }}>Select Invoice *</InputLabel>
                    <Select
                      labelId="sale-select-label"
                      name="sale"
                      value={formData.sale}
                      onChange={handleInputChange}
                      label="Select Invoice *"
                      sx={{ borderRadius: '8px', fontSize: '12.5px', fontFamily: '"Outfit", sans-serif' }}
                    >
                      {sales?.map((sale) => (
                        <MenuItem key={sale._id} value={sale._id} sx={{ fontSize: '12.5px', fontFamily: '"Outfit", sans-serif' }}>
                          {sale.invoiceNumber} — {sale.customer?.contactName || 'Walk-in Customer'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Return Date picker */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Return Date *"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      sx: { borderRadius: '8px', fontSize: '12px', fontFamily: '"Outfit", sans-serif' }
                    }}
                  />
                </Grid>

                {/* Auto-populated Customer display field */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Client"
                    value={customerObj ? `${customerObj.contactName} (${customerObj.contactNumber})` : 'Walk-in Customer'}
                    disabled
                    InputProps={{
                      sx: { borderRadius: '8px', fontSize: '12px', fontFamily: '"Outfit", sans-serif', backgroundColor: '#F1F5F9' }
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Notes & Reason Details Card */}
            <Paper sx={{ 
              p: 1.5, 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              minHeight: 0,
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              mb: { xs: 1.5, md: 0 }
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '12.5px', mb: 1, fontFamily: '"Outfit", sans-serif' }}>
                Return Notes / Remarks
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4.5}
                placeholder="Enter return remarks, credit note instructions or reason details..."
                value={formData.note}
                onChange={handleInputChange}
                name="note"
                sx={{
                  flexGrow: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: '"Outfit", sans-serif',
                    alignItems: 'flex-start',
                    height: '100%'
                  }
                }}
              />
            </Paper>

            {/* Calculations & Submit Action Card */}
            <Paper sx={{ 
              p: 1.5, 
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '12.5px', mb: 1.25, fontFamily: '"Outfit", sans-serif' }}>
                Summary
              </Typography>

              {/* Subtotal Display */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.25, px: 0.5 }}>
                <Typography sx={{ color: '#64748B', fontSize: '12px', fontWeight: 500, fontFamily: '"Outfit", sans-serif' }}>
                  Return Subtotal
                </Typography>
                <Typography sx={{ color: '#1E293B', fontSize: '12.5px', fontWeight: 600, fontFamily: '"Outfit", sans-serif' }}>
                  ৳{calculateTotalRefund().toFixed(2)}
                </Typography>
              </Box>

              <Divider sx={{ my: 1.25, borderColor: '#F1F5F9' }} />
              
              {/* Refund Grand Total */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, px: 0.5 }}>
                <Typography sx={{ variant: 'subtitle1', fontWeight: 700, color: '#1E293B', fontSize: '13px', fontFamily: '"Outfit", sans-serif' }}>
                  Total Refund Amount
                </Typography>
                <Typography sx={{ variant: 'h6', fontWeight: 800, color: '#1D5F99', fontSize: '1.25rem', fontFamily: '"Outfit", sans-serif' }}>
                  ৳{calculateTotalRefund().toFixed(2)}
                </Typography>
              </Box>

              {/* Full Width Submit Button */}
              <Button
                variant="contained"
                fullWidth
                type="submit"
                startIcon={createReturnMutation.isLoading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon sx={{ fontSize: '1.1rem !important' }} />}
                disabled={createReturnMutation.isLoading || formData.items.length === 0}
                sx={{ 
                  py: 1.25, 
                  borderRadius: '8px', 
                  backgroundColor: '#1D5F99',
                  textTransform: 'none',
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 600,
                  fontSize: '13px',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#42A2C2',
                    boxShadow: 'none'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: '#E2E8F0',
                    color: '#94A3B8'
                  }
                }}
              >
                {createReturnMutation.isLoading ? 'Processing Return...' : 'Confirm Sales Return'}
              </Button>
            </Paper>
          </form>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesReturn;