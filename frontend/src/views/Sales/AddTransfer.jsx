import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, TextField, Autocomplete, Grid, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import { Phone as PhoneIcon, Add as AddIcon, Person as PersonIcon } from '@mui/icons-material';
import { Delete as DeleteIcon, Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import TransferInvoiceModal from '../../components/TransferInvoiceModal';

const AddTransfer = () => {
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [selectedContact, setSelectedContact] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [conditions, setConditions] = useState('');
  const [note, setNote] = useState('');
  
  // Item selection state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modelName, setModelName] = useState('');
  const [selectedSerials, setSelectedSerials] = useState([]);
  const [availableSerials, setAvailableSerials] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState([]);

  // Modal State
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [completedTransfer, setCompletedTransfer] = useState(null);
  
  // Custom/New Contact Dialog State
  const [openContactDialog, setOpenContactDialog] = useState(false);
  const [newContact, setNewContact] = useState({
    businessName: '',
    contactName: '',
    contactNumber: '',
    address: ''
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { currentShop } = useAuth();

  // Preselected product passed via navigate state (e.g. from SalesOrders)
  const preselectedProduct = location.state?.preselectedProduct || null;

  useEffect(() => {
    fetchContacts();
    fetchProducts();
  }, [currentShop]);

  // Pre-fill product when navigated from SalesOrders
  useEffect(() => {
    if (preselectedProduct && preselectedProduct._id) {
      setSelectedProduct(preselectedProduct);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchContacts = async () => {
    try {
      const res = await api.get('/api/contacts/customers');
      setContacts(res.data.data || res.data); // Adjust based on your API response structure
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      // Use current-batches to get live stock and available serials
      const res = await api.get('/api/inventory/current-batches');
      setProducts(res.data.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleQuantityChange = (newQty) => {
    const stock = selectedProduct ? (selectedProduct.currentQuantity !== undefined ? selectedProduct.currentQuantity : (selectedProduct.currentStock || 0)) : 1000;
    let q = parseInt(newQty, 10) || 1;
    if (q > stock) q = stock; // Clamp to available stock

    setQuantity(q);
    let newSerials = [...selectedSerials];
    if (newSerials.length > q) {
      newSerials = newSerials.slice(0, q);
    } else if (newSerials.length < q) {
      const addedCount = q - newSerials.length;
      const availableToAdd = availableSerials.filter(s => !newSerials.includes(s));
      for (let i = 0; i < addedCount; i++) {
        newSerials.push(availableToAdd[i] || '');
      }
    }
    setSelectedSerials(newSerials);
  };

  const updateStagingSerialAtIndex = (index, value) => {
    const newSerials = [...selectedSerials];
    newSerials[index] = value;
    setSelectedSerials(newSerials);
  };

  const handleAddItem = () => {
    if (!selectedProduct) return alert('Please select a product');
    if (quantity <= 0) return alert('Quantity must be greater than 0');

    const stock = selectedProduct.currentQuantity !== undefined ? selectedProduct.currentQuantity : (selectedProduct.currentStock || 0);
    const actualProduct = selectedProduct.product || selectedProduct;
    
    const existingIndex = items.findIndex(i => i.product._id === actualProduct._id);
    const existingQty = existingIndex >= 0 ? items[existingIndex].quantityTaken : 0;
    
    if (quantity + existingQty > stock) {
        return alert(`Cannot transfer ${quantity + existingQty} items. Only ${stock} available in stock.`);
    }

    // Add as a new row to allow identical products with different serials if needed, 
    // or we just merge if same product. Let's merge for simplicity.
    if (existingIndex >= 0) {
      setItems(items.map((item, idx) => {
        if (idx !== existingIndex) return item;
        const newQty = item.quantityTaken + parseInt(quantity, 10);
        let newSerials = [...(item.selectedSerials || [])];
        const addedCount = newQty - newSerials.length;
        const availableToAdd = (item.availableSerials || []).filter(s => !newSerials.includes(s) && !selectedSerials.includes(s));
        
        // Push the ones from staging first
        newSerials.push(...selectedSerials);
        
        // Fill the rest if still needed
        const remainingToAdd = newQty - newSerials.length;
        for (let i = 0; i < remainingToAdd; i++) {
          newSerials.push(availableToAdd[i] || '');
        }

        return { 
          ...item, 
          quantityTaken: newQty,
          modelName: modelName || item.modelName,
          selectedSerials: newSerials,
          serialNumbers: newSerials.filter(Boolean)
        };
      }));
    } else {
      setItems([...items, { 
        product: actualProduct, 
        quantityTaken: parseInt(quantity, 10),
        modelName: modelName,
        price: selectedProduct.sellingPrice || actualProduct.sellingPrice || actualProduct.mrp || 0,
        availableSerials: availableSerials,
        selectedSerials: [...selectedSerials],
        serialNumbers: selectedSerials.filter(Boolean),
        trackSerials: actualProduct.trackSerials || false
      }]);
    }

    setSelectedProduct(null);
    setModelName('');
    setSelectedSerials([]);
    setAvailableSerials([]);
    setQuantity(1);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItemSerialAtIndex = (itemIndex, serialIndex, value) => {
    setItems(items.map((item, idx) => {
      if (idx !== itemIndex) return item;
      const newSerials = [...(item.selectedSerials || [])];
      newSerials[serialIndex] = value;
      return {
        ...item,
        selectedSerials: newSerials,
        serialNumbers: newSerials.filter(Boolean)
      };
    }));
  };

  const handleSubmit = async () => {
    if (!selectedContact) return alert('Please select a contact');
    if (items.length === 0) return alert('Please add at least one item');

    const payload = {
      contact: selectedContact._id,
      date,
      conditions,
      note,
      // Pass the edited phone number and contact person name if they are updated by the user
      receiverPhone: phoneNumber,
      receiverName: contactPersonName,
      items: items.map(i => ({
        product: i.product._id,
        quantityTaken: i.quantityTaken,
        modelName: i.modelName,
        serialNumbers: i.selectedSerials ? i.selectedSerials.filter(Boolean) : i.serialNumbers
      }))
    };

    try {
      const response = await api.post('/api/transfers', payload);
      setCompletedTransfer(response.data.data);
      setSuccessModalOpen(true);
    } catch (err) {
      alert('Error creating transfer: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCloseModal = () => {
    setSuccessModalOpen(false);
    navigate('/dashboard/sales/transfers');
  };

  const handleCreateContact = async () => {
    if (!newContact.businessName.trim()) return alert('Please enter Business Name');
    if (!newContact.contactName.trim()) return alert('Please enter Contact Name');
    if (!newContact.contactNumber.trim()) return alert('Please enter Contact Number');

    try {
      const payload = {
        ...newContact,
        contactType: 'Customer',
        customerType: 'Business'
      };
      const response = await api.post('/api/contacts/customers', payload);
      const created = response.data.data;
      
      // Refresh list
      await fetchContacts();
      
      // Auto select the newly created business contact
      setSelectedContact(created);
      setPhoneNumber(created.contactNumber || '');
      setContactPersonName(created.contactName || '');
      
      // Close dialog & reset
      setOpenContactDialog(false);
      setNewContact({
        businessName: '',
        contactName: '',
        contactNumber: '',
        address: ''
      });
    } catch (err) {
      alert('Error creating contact: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton onClick={() => navigate('/dashboard/sales/transfers')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Create Product Transfer</Typography>
      </Box>

      {/* Preselected product info banner (from SalesOrders navigation) */}
      {preselectedProduct && (
        <Alert severity="info" sx={{ mb: 2, fontSize: '0.9rem' }}>
          <strong>Pre-filled from Sales Order:</strong> &ldquo;{preselectedProduct.name}&rdquo; has been pre-selected in the product search below.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Transfer Details</Typography>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Autocomplete
                options={contacts.filter(c => c.customerType === 'Business')}
                getOptionLabel={(option) => option.businessName || option.contactName || ''}
                value={selectedContact}
                onChange={(e, val) => {
                  setSelectedContact(val);
                  setPhoneNumber(val?.contactNumber || '');
                  setContactPersonName(val?.contactName || '');
                }}
                renderInput={(params) => <TextField {...params} label="Select Contact (Receiver)" required margin="normal" />}
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard/contacts/customers')}
                sx={{
                  minWidth: '40px',
                  width: '40px',
                  height: '40px',
                  p: 0,
                  mt: 1,
                  borderColor: '#E2E8F0',
                  color: '#1D5F99',
                  borderRadius: '8px',
                  '&:hover': { borderColor: '#1D5F99', backgroundColor: 'rgba(29, 95, 153, 0.04)' }
                }}
              >
                <AddIcon />
              </Button>
            </Box>

            {selectedContact && (
              <>
                <TextField
                  label="Contact Person Name"
                  fullWidth
                  value={contactPersonName}
                  onChange={(e) => setContactPersonName(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
                
                <TextField
                  label="Phone Number"
                  fullWidth
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </>
            )}

            <TextField
              label="Date"
              type="date"
              fullWidth
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 3 }}
            />

            <TextField
              label="Terms & Conditions"
              multiline
              rows={4}
              fullWidth
              placeholder="e.g. Must return same product within 7 days, or equivalent replacement."
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              label="Internal Note"
              fullWidth
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: '12px' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Select Items to Transfer Out</Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Autocomplete
                  options={products}
                  getOptionLabel={(option) => {
                    const prod = option.product || option;
                    return `${prod.name || ''} (${prod.model || 'N/A'})`;
                  }}
                  isOptionEqualToValue={(option, value) => {
                    const oId = option.product?._id || option._id;
                    const vId = value.product?._id || value._id;
                    return oId === vId;
                  }}
                  value={selectedProduct}
                  onChange={(e, val) => {
                    setSelectedProduct(val);
                    const prod = val?.product || val;
                    setModelName(prod?.model || '');
                    
                    const serials = val?.batches ? val.batches.flatMap(b => b.availableSerials || []) : [];
                    setAvailableSerials(serials);
                    setSelectedSerials(serials.length > 0 ? [serials[0]] : ['']);
                    setQuantity(1);
                  }}
                  renderInput={(params) => <TextField {...params} label="Search Product" />}
                  renderOption={(props, option) => {
                    const prod = option.product || option;
                    const stock = option.currentQuantity !== undefined ? option.currentQuantity : (option.currentStock || 0);
                    const hasStock = stock > 0;
                    return (
                      <Box component="li" {...props} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span>{prod.name} ({prod.model || 'N/A'})</span>
                        <Box 
                          sx={{ 
                            ml: 2,
                            px: 1, 
                            py: 0.5, 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: 600,
                            backgroundColor: hasStock ? 'rgba(46, 125, 50, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                            color: hasStock ? '#2e7d32' : '#d32f2f'
                          }}
                        >
                          {hasStock ? `Stock: ${stock}` : 'Out of Stock'}
                        </Box>
                      </Box>
                    );
                  }}
                  sx={{ flexGrow: 1 }}
                />
                
                {selectedProduct && (
                  <Box 
                    sx={{ 
                      px: 2, 
                      py: 1.5, 
                      borderRadius: '8px', 
                      bgcolor: (selectedProduct.currentQuantity !== undefined ? selectedProduct.currentQuantity : (selectedProduct.currentStock || 0)) > 0 ? 'rgba(46, 125, 50, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                      color: (selectedProduct.currentQuantity !== undefined ? selectedProduct.currentQuantity : (selectedProduct.currentStock || 0)) > 0 ? '#2e7d32' : '#d32f2f', 
                      fontWeight: 600, 
                      minWidth: 'max-content',
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    Current Stock: {selectedProduct.currentQuantity !== undefined ? selectedProduct.currentQuantity : (selectedProduct.currentStock || 0)}
                  </Box>
                )}
              </Box>

              {selectedProduct && (
                <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #E2E8F0', borderRadius: '12px', bgcolor: '#F8FAFC' }}>
                  <Grid container spacing={3} alignItems="flex-start">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Model"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Qty"
                        type="number"
                        value={quantity}
                        onChange={(e) => handleQuantityChange(e.target.value)}
                        inputProps={{ 
                          min: 1, 
                          max: (selectedProduct.currentQuantity !== undefined ? selectedProduct.currentQuantity : (selectedProduct.currentStock || 0)) 
                        }}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Button 
                        variant="contained" 
                        onClick={handleAddItem}
                        fullWidth
                        disabled={(selectedProduct.currentQuantity !== undefined ? selectedProduct.currentQuantity : (selectedProduct.currentStock || 0)) <= 0}
                        sx={{ 
                          height: '40px', 
                          backgroundColor: '#1D5F99',
                          color: '#FFFFFF',
                          fontWeight: 600,
                          boxShadow: 'none',
                          borderRadius: '8px',
                          '&:hover': { backgroundColor: '#154A78', boxShadow: 'none' },
                          '&.Mui-disabled': { backgroundColor: '#E2E8F0', color: '#94A3B8' }
                        }}
                      >
                        Add Item
                      </Button>
                    </Grid>
                    
                    {quantity > 0 && (
                      <Grid item xs={12}>
                        <Box sx={{ pt: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 2, color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3B82F6' }} />
                            Serial Numbers
                          </Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
                            {Array.from({ length: quantity }, (_, idx) => {
                              const usedSerials = selectedSerials.filter((s, i) => i !== idx && s);
                              const suggestions = availableSerials.filter(s => !usedSerials.includes(s));
                              return (
                                <Autocomplete
                                  key={idx}
                                  freeSolo
                                  size="small"
                                  options={suggestions}
                                  value={selectedSerials[idx] || ''}
                                  onChange={(e, newVal) => updateStagingSerialAtIndex(idx, newVal || '')}
                                  onInputChange={(e, newVal, reason) => {
                                    if (reason === 'input') updateStagingSerialAtIndex(idx, newVal);
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label={`Serial #${idx + 1}`}
                                      variant="outlined"
                                      sx={{ bgcolor: '#FFFFFF' }}
                                    />
                                  )}
                                />
                              );
                            })}
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              )}
            </Box>

            {/* Mobile View: Nice Cards for Items */}
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              {items.map((item, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    p: 2, 
                    mb: 1.5, 
                    border: '1px solid #E2E8F0', 
                    borderRadius: '8px', 
                    backgroundColor: '#F8FAFC',
                    position: 'relative'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, pr: 4, color: '#1E293B' }}>
                    {item.product.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
                    Model: {item.modelName || item.product.model || 'N/A'}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%' }}>
                      {Array.from({ length: item.quantityTaken }, (_, idx) => {
                        const usedSerials = (item.selectedSerials || []).filter((s, i) => i !== idx && s);
                        const suggestions = (item.availableSerials || []).filter(s => !usedSerials.includes(s));
                        return (
                          <Autocomplete
                            key={idx}
                            freeSolo
                            size="small"
                            options={suggestions}
                            value={item.selectedSerials?.[idx] || ''}
                            onChange={(e, newVal) => updateItemSerialAtIndex(index, idx, newVal || '')}
                            onInputChange={(e, newVal, reason) => {
                              if (reason === 'input') updateItemSerialAtIndex(index, idx, newVal);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder={`Serial #${idx + 1}`}
                                variant="outlined"
                                sx={{ '& .MuiOutlinedInput-root': { fontSize: '11px', p: '2px 6px', minHeight: '28px' } }}
                              />
                            )}
                            sx={{ width: '100%' }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" sx={{ color: '#475569' }}>
                      Price: ৳{(item.price || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                      Qty: {item.quantityTaken}
                    </Typography>
                  </Box>
                  <IconButton 
                    color="error" 
                    size="small" 
                    onClick={() => handleRemoveItem(index)}
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              {items.length === 0 && (
                <Box sx={{ py: 4, textAlign: 'center', color: '#64748B', border: '1px dashed #CBD5E1', borderRadius: '8px' }}>
                  No items added yet. Search and add products above.
                </Box>
              )}
            </Box>

            {/* Desktop View: Table */}
            <TableContainer sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell>SL</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Serials</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Qty Taken</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.product.name}</TableCell>
                      <TableCell>{item.modelName || item.product.model || 'N/A'}</TableCell>
                      <TableCell>
                        <Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: '160px' }}>
                            {Array.from({ length: item.quantityTaken }, (_, idx) => {
                              const usedSerials = (item.selectedSerials || []).filter((s, i) => i !== idx && s);
                              const suggestions = (item.availableSerials || []).filter(s => !usedSerials.includes(s));
                              return (
                                <Autocomplete
                                  key={idx}
                                  freeSolo
                                  size="small"
                                  options={suggestions}
                                  value={item.selectedSerials?.[idx] || ''}
                                  onChange={(e, newVal) => updateItemSerialAtIndex(index, idx, newVal || '')}
                                  onInputChange={(e, newVal, reason) => {
                                    if (reason === 'input') updateItemSerialAtIndex(index, idx, newVal);
                                  }}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      placeholder={`Serial #${idx + 1}`}
                                      variant="outlined"
                                      sx={{ '& .MuiOutlinedInput-root': { fontSize: '11px', p: '2px 6px', minHeight: '28px' } }}
                                    />
                                  )}
                                />
                              );
                            })}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">৳{(item.price || 0).toLocaleString()}</TableCell>
                      <TableCell align="right">{item.quantityTaken}</TableCell>
                      <TableCell align="center">
                        <IconButton color="error" size="small" onClick={() => handleRemoveItem(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        No items added yet. Search and add products above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={items.length === 0 || !selectedContact}
                fullWidth={{ xs: true, sm: false }}
                sx={{
                  backgroundColor: '#1D5F99',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: '#154A78', boxShadow: 'none' }
                }}
              >
                Save Transfer Record
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <TransferInvoiceModal 
        open={successModalOpen}
        onClose={handleCloseModal}
        transfer={completedTransfer}
        isReturn={false}
      />

      {/* Add Custom Business Contact Dialog */}
      <Dialog 
        open={openContactDialog} 
        onClose={() => setOpenContactDialog(false)}
        PaperProps={{
          sx: { borderRadius: '12px', bgcolor: '#FFFFFF', color: '#1E293B' }
        }}
      >
        <DialogTitle sx={{ 
          color: '#1E293B', 
          fontWeight: 700,
          borderBottom: '1px solid #E2E8F0',
          pb: 1.5
        }}>Add New Business Contact</DialogTitle>
        <DialogContent sx={{ minWidth: '420px', bgcolor: '#FFFFFF', mt: 1.5 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Business Name *"
                value={newContact.businessName}
                onChange={(e) => setNewContact({ ...newContact, businessName: e.target.value })}
                size="small" 
                InputProps={{ sx: { borderRadius: '8px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact Name *"
                value={newContact.contactName}
                onChange={(e) => setNewContact({ ...newContact, contactName: e.target.value })}
                size="small" 
                InputProps={{ sx: { borderRadius: '8px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact Number *"
                value={newContact.contactNumber}
                onChange={(e) => setNewContact({ ...newContact, contactNumber: e.target.value })}
                size="small" 
                InputProps={{ sx: { borderRadius: '8px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={newContact.address}
                onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
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
            onClick={() => setOpenContactDialog(false)}
            sx={{
              color: '#94A3B8',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)', color: '#64748B' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateContact} 
            variant="contained"
            sx={{
              backgroundColor: '#1D5F99',
              color: '#FFFFFF',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#154A78' }
            }}
          >
            Add Contact
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddTransfer;
