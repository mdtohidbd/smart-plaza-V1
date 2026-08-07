import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  Autocomplete, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton, 
  Divider, 
  CircularProgress, 
  InputAdornment,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Save as SaveIcon, 
  Add as AddIcon, 
  Remove as RemoveIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const CreateQuotation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    contactName: '',
    contactNumber: '',
    email: '',
    address: '',
    contactType: 'Customer',
    customerType: 'Individual'
  });
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showAlert = (message, severity = 'error') => {
    setSnackbar({ open: true, message, severity });
  };
  
  const [formData, setFormData] = useState({
    validityDays: 15,
    note: '',
    discount: '',
    deliveryCharge: '',
    installationCost: '',
    cardCharge: '',
    otherCharges: [],
    subject: 'Price Quotation for Products.',
    vatAitInfo: 'excluding VAT and AIT',
    paymentMethod: 'Payment must be done before/after delivery of the product by cash/cheque in favor of\n(Demo ERP) Acc Number: 206914 3880001, BRAC Bank, Branch: Khulna\nRouting number: 060471545',
    relatedInformation: 'The package contains 1 indoor and 1 outdoor unit with 10 feet copper pipe, connection cable and remote.\nAdditional charge 590 Taka per feet will be applicable if extra copper pipe and connection cable required.',
    quoteGivenByName: 'Demo Admin',
    quoteGivenByDesignation: 'Branch Manager'
  });

  const [saving, setSaving] = useState(false);

  const handleCreateCustomer = async () => {
    if (!newCustomer.contactName || !newCustomer.contactNumber) {
      showAlert('Please enter both name and phone number', 'warning');
      return;
    }
    try {
      const response = await api.post('/api/contacts/customers', newCustomer);
      queryClient.invalidateQueries('customers');
      setSelectedCustomer(response.data.data);
      setOpenCustomerDialog(false);
      setNewCustomer({ contactName: '', contactNumber: '', email: '', address: '', contactType: 'Customer', customerType: 'Individual' });
      showAlert('Customer created successfully', 'success');
    } catch (err) {
      console.error(err);
      let errorMessage = err.response?.data?.message || 'Error creating customer';
      if (errorMessage.includes('duplicate key error')) {
        if (errorMessage.includes('contactNumber')) {
          errorMessage = 'A customer with this phone number already exists.';
        } else if (errorMessage.includes('email')) {
          errorMessage = 'A customer with this email already exists.';
        }
      }
      showAlert(errorMessage, 'error');
    }
  };

  // Fetch Customers
  const { data: customers = [], isLoading: loadingCustomers } = useQuery('customers', async () => {
    const res = await api.get('/api/contacts/customers');
    return res.data.data;
  });

  // Fetch Products
  const { data: products = [], isLoading: loadingProducts } = useQuery('products', async () => {
    const res = await api.get('/api/products');
    return res.data.data;
  });

  // Fetch Warranty Templates
  const { data: templatesRes } = useQuery('warranty-templates', async () => {
    const res = await api.get('/api/warranty/templates');
    return res.data;
  });
  const warrantyTemplates = templatesRes?.data || [];

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    const existingItemIndex = cart.findIndex(item => item.product._id === selectedProduct._id);
    if (existingItemIndex >= 0) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      const matchingTemplates = warrantyTemplates.filter(
        t => t.brand?._id === (selectedProduct.brand?._id || selectedProduct.brand) && 
             t.category?._id === (selectedProduct.category?._id || selectedProduct.category) && 
             t.isActive
      );

      const mrpVal = Number(selectedProduct.mrp) || Number(selectedProduct.sellingPrice) || 0;
      const sellingVal = Number(selectedProduct.sellingPrice) || 0;
      const calculatedDiscount = (mrpVal > 0 && sellingVal > 0 && mrpVal > sellingVal) ? (mrpVal - sellingVal) : 0;

      setCart([...cart, {
        product: selectedProduct,
        quantity: 1,
        unitPrice: mrpVal,
        discount: calculatedDiscount > 0 ? calculatedDiscount : '',
        tax: 0,
        warranties: matchingTemplates.map(t => ({ templateId: t._id, duration: t.durationMonths, warrantyName: t.name }))
      }]);
    }
    setSelectedProduct(null);
  };

  const toggleWarranty = (index, template) => {
    const newCart = [...cart];
    const item = newCart[index];
    const hasWarranty = item.warranties?.some(w => w.templateId === template._id);
    
    if (hasWarranty) {
      item.warranties = item.warranties.filter(w => w.templateId !== template._id);
    } else {
      item.warranties = [...(item.warranties || []), {
        templateId: template._id,
        duration: template.durationMonths,
        warrantyName: template.name
      }];
    }
    setCart(newCart);
  };

  const handleUpdateCartItem = (index, field, value) => {
    const newCart = [...cart];
    newCart[index][field] = value;
    setCart(newCart);
  };

  const handleUpdateProductModel = (index, newModel) => {
    const newCart = [...cart];
    newCart[index].product = { ...newCart[index].product, model: newModel };
    setCart(newCart);
  };

  const handleSaveProductModel = async (productId, newModel) => {
    try {
      await api.put(`/api/products/${productId}`, { model: newModel });
      queryClient.invalidateQueries('products');
      showAlert('Product model updated successfully', 'success');
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.message || 'Error updating product model', 'error');
    }
  };

  const updateQuantity = (index, newQty) => {
    if (newQty < 1) return;
    const newCart = [...cart];
    newCart[index].quantity = Number(newQty);
    setCart(newCart);
  };

  const handleRemoveFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  // Calculations
  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      const price = Number(item.unitPrice || 0);
      const discount = Number(item.discount || 0);
      const tax = Number(item.tax || 0);
      const qty = Number(item.quantity || 0);
      return total + (qty * price) - (qty * discount) + tax;
    }, 0);
  };

  const calculateTotal = () => {
    const sub = calculateSubtotal();
    const otherChargesTotal = formData.otherCharges?.reduce((sum, charge) => sum + Number(charge.amount || 0), 0) || 0;
    return sub - Number(formData.discount || 0) + Number(formData.deliveryCharge || 0) + Number(formData.installationCost || 0) + Number(formData.cardCharge || 0) + otherChargesTotal;
  };

  const generateQuotationNumber = () => {
    return `QT-${Date.now().toString().slice(-6)}`;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedCustomer) {
      showAlert("Please select a customer.", 'warning');
      return;
    }
    if (cart.length === 0) {
      showAlert("Please add at least one item to the quotation.", 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        quotationNumber: generateQuotationNumber(),
        customer: selectedCustomer._id,
        items: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice || 0),
          discount: Number(item.discount || 0),
          tax: Number(item.tax || 0),
          warranties: item.warranties || []
        })),
        validityDays: Number(formData.validityDays),
        subTotal: calculateSubtotal(),
        discount: Number(formData.discount || 0),
        tax: 0,
        deliveryCharge: Number(formData.deliveryCharge || 0),
        installationCost: Number(formData.installationCost || 0),
        cardCharge: Number(formData.cardCharge || 0),
        otherCharges: formData.otherCharges?.map(c => ({ name: c.name, amount: Number(c.amount || 0) })) || [],
        total: calculateTotal(),
        subject: formData.subject,
        vatAitInfo: formData.vatAitInfo,
        paymentMethod: formData.paymentMethod,
        relatedInformation: formData.relatedInformation,
        quoteGivenByName: formData.quoteGivenByName,
        quoteGivenByDesignation: formData.quoteGivenByDesignation
      };

      await api.post('/api/quotations', payload);
      queryClient.invalidateQueries('all-quotations');
      showAlert('Quotation created successfully', 'success');
      navigate('/dashboard/quotations');
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.message || 'Error creating quotation', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      p: 1.5,
      backgroundColor: '#F8FAFC',
      boxSizing: 'border-box',
      fontFamily: '"Outfit", sans-serif',
    }}>
      {/* Mini Title Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, height: '36px' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', fontFamily: '"Outfit", sans-serif', fontSize: '1.15rem' }}>
            Create New Quotation
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', display: { xs: 'none', sm: 'block' }, fontSize: '11px', fontFamily: '"Outfit", sans-serif' }}>
            Design and generate professional custom quotations for clients
          </Typography>
        </Box>
      </Box>

      {/* Two-Column Responsive Grid Layout */}
      <Grid container spacing={1.5} sx={{ flexGrow: 1 }}>
        
        {/* Left Column: Product Picker & Shopping Cart */}
        <Grid item xs={12} md={7.5} sx={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Product Picker Box */}
          <Paper sx={{ 
            p: 1.5, 
            mb: 1.5, 
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            border: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF'
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '12.5px', mb: 1, fontFamily: '"Outfit", sans-serif' }}>
              Add Products to Quotation
            </Typography>
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={8} sm={9}>
                <Autocomplete
                  size="small"
                  options={products}
                  getOptionLabel={(option) => {
                    const mrp = option.mrp || option.sellingPrice || 0;
                    const selling = option.sellingPrice || 0;
                    const hasDiscount = option.mrp && selling && option.mrp > selling;
                    return `${option.name} - MRP: ৳${mrp.toLocaleString()}${hasDiscount ? ` (Offer: ৳${selling.toLocaleString()})` : ''}`;
                  }}
                  value={selectedProduct}
                  onChange={(e, newValue) => setSelectedProduct(newValue)}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Search Product" 
                      InputProps={{
                        ...params.InputProps,
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  )}
                  loading={loadingProducts}
                />
              </Grid>
              <Grid item xs={4} sm={3}>
                <Button 
                  variant="contained" 
                  onClick={handleAddToCart} 
                  disabled={!selectedProduct}
                  startIcon={<AddIcon />}
                  fullWidth
                  size="small"
                  sx={{ 
                    height: '40px', 
                    borderRadius: '8px', 
                    backgroundColor: '#1D5F99',
                    textTransform: 'none',
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    '&:hover': {
                      backgroundColor: '#42A2C2'
                    }
                  }}
                >
                  Add Item
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Cart Table Container */}
          <Paper sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            p: 1.5, 
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            border: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF'
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '12.5px', mb: 1, fontFamily: '"Outfit", sans-serif' }}>
              Selected Items ({cart.length})
            </Typography>
            
            <TableContainer sx={{ flexGrow: 1, border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <Table size="small">
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
                    <TableCell align="right" width="105">MRP (৳)</TableCell>
                    <TableCell align="center" width="115">Quantity</TableCell>
                    <TableCell align="center" width="160">Warranty</TableCell>
                    <TableCell align="right" width="125">Special Discount (৳)</TableCell>
                    <TableCell align="right" width="110">Total (৳)</TableCell>
                    <TableCell align="center" width="50"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cart.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94A3B8', fontSize: '12px', fontFamily: '"Outfit", sans-serif' }}>
                        No items added to this quotation yet. Search and select products above to begin.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cart.map((item, index) => (
                      <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#F8FAFC' } }}>
                        {/* Product Title */}
                        <TableCell sx={{ py: 0.5, px: 1.5, fontFamily: '"Outfit", sans-serif', fontSize: '12px', color: '#1E293B', fontWeight: 500 }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: '#1E293B', fontSize: '12px', fontFamily: '"Outfit", sans-serif' }}>
                              {item.product.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 1 }}>
                              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '10px', fontFamily: '"Outfit", sans-serif' }}>
                                Model:
                              </Typography>
                                <TextField
                                  size="small"
                                  variant="standard"
                                  value={item.product.model || ''}
                                  onChange={(e) => handleUpdateProductModel(index, e.target.value)}
                                  onBlur={(e) => handleSaveProductModel(item.product._id, e.target.value)}
                                  InputProps={{ disableUnderline: true, style: { fontSize: '11px', fontFamily: '"Outfit", sans-serif', padding: 0 } }}
                                sx={{
                                  width: '100px',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: '4px',
                                  px: 0.5,
                                  backgroundColor: '#fff'
                                }}
                              />
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Editable Unit Price */}
                        <TableCell align="right" sx={{ py: 0.5 }}>
                          <TextField 
                            size="small" 
                            type="number" 
                            value={item.unitPrice} 
                            onChange={(e) => handleUpdateCartItem(index, 'unitPrice', e.target.value)} 
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

                        {/* Quantity with compact +/- controls */}
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

                        {/* Warranty Selector */}
                        <TableCell align="center" sx={{ py: 0.5 }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', maxWidth: '180px' }}>
                            {(() => {
                              const matchingTemplates = warrantyTemplates.filter(t => 
                                t.brand?._id === (item.product.brand?._id || item.product.brand) && 
                                t.category?._id === (item.product.category?._id || item.product.category) && 
                                t.isActive
                              );
                              if (matchingTemplates.length === 0) {
                                return <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '10px' }}>No warranties found</Typography>;
                              }
                              return matchingTemplates.map(t => {
                                const isSelected = item.warranties?.some(w => w.templateId === t._id);
                                return (
                                  <Chip
                                    key={t._id}
                                    label={`${t.name} (${t.durationMonths}m)`}
                                    size="small"
                                    color={isSelected ? "primary" : "default"}
                                    variant={isSelected ? "filled" : "outlined"}
                                    onClick={() => toggleWarranty(index, t)}
                                    onDelete={isSelected ? () => toggleWarranty(index, t) : undefined}
                                    sx={{ fontSize: '10px', height: '20px' }}
                                  />
                                );
                              });
                            })()}
                          </Box>
                        </TableCell>

                        {/* Editable Item Discount */}
                        <TableCell align="right" sx={{ py: 0.5 }}>
                          <TextField 
                            size="small" 
                            type="number" 
                            value={item.discount} 
                            onChange={(e) => handleUpdateCartItem(index, 'discount', e.target.value)} 
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

                        {/* Row Total */}
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '12px', fontFamily: '"Outfit", sans-serif', py: 0.5 }}>
                          ৳{((item.quantity * Number(item.unitPrice || 0)) - (item.quantity * Number(item.discount || 0))).toFixed(2)}
                        </TableCell>

                        {/* Delete Action */}
                        <TableCell align="center" sx={{ py: 0.5 }}>
                          <IconButton size="small" onClick={() => handleRemoveFromCart(index)} sx={{ color: '#EF4444', p: 0.5 }}>
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Right Column: Customer Details, Notes & Totals Summary */}
        <Grid item xs={12} md={4.5} sx={{ display: 'flex', flexDirection: 'column' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            
            {/* Customer & Settings Card */}
            <Paper sx={{ 
              p: 1.5, 
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '12.5px', mb: 1.25, fontFamily: '"Outfit", sans-serif' }}>
                Client Details
              </Typography>
              <Grid container spacing={1.25}>
                {/* Select Customer */}
                <Grid item xs={12} sm={8}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Autocomplete
                      fullWidth
                      size="small"
                      options={customers}
                      getOptionLabel={(option) => `${option.contactName} (${option.contactNumber})`}
                      value={selectedCustomer}
                      onChange={(e, newValue) => setSelectedCustomer(newValue)}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Select Customer *" 
                          required 
                          InputProps={{
                            ...params.InputProps,
                            sx: { borderRadius: '8px' }
                          }}
                        />
                      )}
                      loading={loadingCustomers}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => setOpenCustomerDialog(true)}
                      sx={{
                        minWidth: '40px',
                        width: '40px',
                        p: 0,
                        borderColor: '#E2E8F0',
                        color: '#1D5F99',
                        borderRadius: '8px',
                        '&:hover': { borderColor: '#1D5F99', backgroundColor: 'rgba(29, 95, 153, 0.04)' }
                      }}
                    >
                      <AddIcon sx={{ fontSize: 20 }} />
                    </Button>
                  </Box>
                </Grid>
                {/* Validity Days */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Validity (Days) *"
                    value={formData.validityDays}
                    onChange={(e) => setFormData({...formData, validityDays: e.target.value})}
                    required
                    InputProps={{
                      sx: { borderRadius: '8px' }
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Quotation Terms & Additional Info Card */}
            <Paper sx={{ 
              p: 1.5, 
              display: 'flex', 
              flexDirection: 'column', 
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              gap: 1.5
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '12.5px', fontFamily: '"Outfit", sans-serif' }}>
                Quotation Details & Terms
              </Typography>

              <TextField
                fullWidth
                size="small"
                label="Subject"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                InputProps={{ sx: { borderRadius: '8px', fontSize: '12px' } }}
              />

              <FormControl component="fieldset" size="small">
                <FormLabel component="legend" sx={{ fontSize: '11px', color: '#64748B' }}>VAT & AIT Info</FormLabel>
                <RadioGroup
                  row
                  value={formData.vatAitInfo}
                  onChange={(e) => setFormData({...formData, vatAitInfo: e.target.value})}
                  sx={{ '& .MuiFormControlLabel-label': { fontSize: '11px' } }}
                >
                  <FormControlLabel value="excluding VAT and AIT" control={<Radio size="small" />} label="Excluding Both" />
                  <FormControlLabel value="including VAT and AIT" control={<Radio size="small" />} label="Including Both" />
                  <FormControlLabel value="Including VAT and ecluding AIT" control={<Radio size="small" />} label="Incl VAT, Excl AIT" />
                </RadioGroup>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Payment Method"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                InputProps={{ sx: { borderRadius: '8px', fontSize: '12px' } }}
              />

              <TextField
                fullWidth
                multiline
                rows={6}
                label="Related Information"
                value={formData.relatedInformation}
                onChange={(e) => setFormData({...formData, relatedInformation: e.target.value})}
                InputProps={{ sx: { borderRadius: '8px', fontSize: '12px' } }}
              />

              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Quote Given By (Name)"
                    value={formData.quoteGivenByName}
                    onChange={(e) => setFormData({...formData, quoteGivenByName: e.target.value})}
                    InputProps={{ sx: { borderRadius: '8px', fontSize: '12px' } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Designation"
                    value={formData.quoteGivenByDesignation}
                    onChange={(e) => setFormData({...formData, quoteGivenByDesignation: e.target.value})}
                    InputProps={{ sx: { borderRadius: '8px', fontSize: '12px' } }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Calculations & Save Card */}
            <Paper sx={{ 
              p: 1.5, 
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '12.5px', mb: 1, fontFamily: '"Outfit", sans-serif' }}>
                Financial Summary
              </Typography>

              {/* Basic Subtotal */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.25, px: 0.5 }}>
                <Typography sx={{ color: '#64748B', fontSize: '12px', fontWeight: 500, fontFamily: '"Outfit", sans-serif' }}>
                  Subtotal
                </Typography>
                <Typography sx={{ color: '#1E293B', fontSize: '12.5px', fontWeight: 600, fontFamily: '"Outfit", sans-serif' }}>
                  ৳{calculateSubtotal().toFixed(2)}
                </Typography>
              </Box>

              {/* Adjustment Fields Grid */}
              <Grid container spacing={1.25} sx={{ mb: 1.25 }}>
                <Grid item xs={6}>
                  <TextField 
                    size="small" 
                    fullWidth 
                    label="Delivery Charge" 
                    type="number" 
                    value={formData.deliveryCharge} 
                    onChange={(e) => setFormData({...formData, deliveryCharge: e.target.value})}
                    InputProps={{ 
                      startAdornment: <InputAdornment position="start" sx={{ '& p': { fontSize: '11px' } }}>৳</InputAdornment>,
                      sx: { borderRadius: '8px', fontSize: '11.5px' } 
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    size="small" 
                    fullWidth 
                    label="Installation" 
                    type="number" 
                    value={formData.installationCost} 
                    onChange={(e) => setFormData({...formData, installationCost: e.target.value})}
                    InputProps={{ 
                      startAdornment: <InputAdornment position="start" sx={{ '& p': { fontSize: '11px' } }}>৳</InputAdornment>,
                      sx: { borderRadius: '8px', fontSize: '11.5px' } 
                    }}
                  />
                </Grid>
              </Grid>

              {/* Dynamic Other Charges */}
              <Box sx={{ mb: 1.25 }}>
                {formData.otherCharges?.map((charge, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1.25, mb: 1.25, alignItems: 'flex-start' }}>
                    <TextField 
                      size="small"
                      label="Charge Name"
                      value={charge.name}
                      onChange={(e) => {
                        const newCharges = [...formData.otherCharges];
                        newCharges[index].name = e.target.value;
                        setFormData({...formData, otherCharges: newCharges});
                      }}
                      sx={{ flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '11.5px' } }}
                    />
                    <TextField 
                      size="small"
                      type="number"
                      label="Amount"
                      value={charge.amount}
                      onChange={(e) => {
                        const newCharges = [...formData.otherCharges];
                        newCharges[index].amount = e.target.value;
                        setFormData({...formData, otherCharges: newCharges});
                      }}
                      InputProps={{ 
                        startAdornment: <InputAdornment position="start" sx={{ '& p': { fontSize: '11px' } }}>৳</InputAdornment>,
                        sx: { borderRadius: '8px', fontSize: '11.5px' } 
                      }}
                      sx={{ width: '120px' }}
                    />
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        const newCharges = formData.otherCharges.filter((_, i) => i !== index);
                        setFormData({...formData, otherCharges: newCharges});
                      }}
                      sx={{ color: '#EF4444', mt: 0.25 }}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                ))}
                <Button 
                  size="small" 
                  startIcon={<AddIcon />} 
                  onClick={() => setFormData({...formData, otherCharges: [...(formData.otherCharges || []), { name: '', amount: '' }]})}
                  sx={{ 
                    textTransform: 'none', 
                    fontFamily: '"Outfit", sans-serif', 
                    fontSize: '11.5px',
                    color: '#1D5F99',
                    '&:hover': { backgroundColor: 'rgba(29, 95, 153, 0.04)' }
                  }}
                >
                  Add Other Charge
                </Button>
              </Box>

              <Divider sx={{ my: 1.25, borderColor: '#F1F5F9' }} />
              
              {/* Grand Total */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, px: 0.5 }}>
                <Typography sx={{ variant: 'subtitle1', fontWeight: 700, color: '#1E293B', fontSize: '13px', fontFamily: '"Outfit", sans-serif' }}>
                  Total Amount
                </Typography>
                <Typography sx={{ variant: 'h6', fontWeight: 800, color: '#1D5F99', fontSize: '1.25rem', fontFamily: '"Outfit", sans-serif' }}>
                  ৳{calculateTotal().toFixed(2)}
                </Typography>
              </Box>

              {/* Action Button */}
              <Button
                variant="contained"
                fullWidth
                type="submit"
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon sx={{ fontSize: '1.1rem !important' }} />}
                disabled={saving || cart.length === 0 || !selectedCustomer}
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
                {saving ? 'Generating Quotation...' : 'Save Quotation'}
              </Button>
            </Paper>
          </form>
        </Grid>
      </Grid>

      {/* Add Customer Dialog */}
      <Dialog 
        open={openCustomerDialog} 
        onClose={() => setOpenCustomerDialog(false)}
        PaperProps={{
          sx: { borderRadius: '12px', bgcolor: '#FFFFFF', color: '#1E293B' }
        }}
      >
        <DialogTitle sx={{ 
          color: '#1E293B', 
          fontWeight: 700,
          borderBottom: '1px solid #E2E8F0',
          pb: 1.5,
          fontFamily: '"Outfit", sans-serif'
        }}>Add New Customer</DialogTitle>
        <DialogContent sx={{ minWidth: { xs: '300px', sm: '420px' }, bgcolor: '#FFFFFF', mt: 1.5 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Customer Name"
                value={newCustomer.contactName}
                onChange={(e) => setNewCustomer({ ...newCustomer, contactName: e.target.value })}
                size="small" 
                InputProps={{ sx: { borderRadius: '8px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={newCustomer.contactNumber}
                onChange={(e) => setNewCustomer({ ...newCustomer, contactNumber: e.target.value })}
                size="small" 
                InputProps={{ sx: { borderRadius: '8px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                size="small" 
                InputProps={{ sx: { borderRadius: '8px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                size="small" 
                multiline
                rows={2}
                InputProps={{ sx: { borderRadius: '8px' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0', bgcolor: '#FFFFFF', gap: 1 }}>
          <Button 
            onClick={() => setOpenCustomerDialog(false)}
            sx={{
              color: '#94A3B8',
              fontFamily: '"Outfit", sans-serif',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)', color: '#64748B' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateCustomer} 
            variant="contained"
            sx={{
              backgroundColor: '#1D5F99',
              color: '#FFFFFF',
              fontWeight: 600,
              fontFamily: '"Outfit", sans-serif',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#42A2C2', boxShadow: 'none' }
            }}
          >
            Add Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%', fontFamily: '"Outfit", sans-serif', borderRadius: '8px' }}
          elevation={6}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateQuotation;
