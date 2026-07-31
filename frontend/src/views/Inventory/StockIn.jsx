import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper,
  TextField, Button, Autocomplete, Grid,
  CircularProgress, Alert, Collapse,
  Tabs, Tab, InputAdornment, IconButton
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';

const sx = {
  section: {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    p: 2,
    mb: 2,
    background: '#fff',
  },
  label: { fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mb: 0.5 },
  field: {
    '& .MuiOutlinedInput-root': { fontSize: '0.82rem', borderRadius: '7px' },
    '& .MuiInputLabel-root': { fontSize: '0.82rem' },
  },
};

export default function StockIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0); // 0 = Purchase Stock-In, 1 = Direct Stock-In
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Preselected product passed via navigate state (e.g. from SalesOrders)
  const preselectedProduct = location.state?.preselectedProduct || null;

  // Note for both flows
  const [note, setNote] = useState('');


  // 1. Purchase-based Stock-In States
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [items, setItems] = useState([]);

  // Fetch pending purchases
  const { data: purchases = [], isLoading: purchasesLoading } = useQuery('purchases-pending-stock', async () => {
    const r = await api.get('/api/purchases');
    return (r.data.data || []).filter(p => !p.updateStock);
  }, { refetchOnWindowFocus: false });

  // Details fetched for selected purchase
  const { data: purchaseDetail, isFetching: fetchingPurchase } = useQuery(
    ['purchase', selectedPurchase?._id],
    async () => {
      const r = await api.get(`/api/purchases/${selectedPurchase._id}`);
      return r.data.data;
    },
    {
      enabled: !!selectedPurchase?._id && activeTab === 0,
      onSuccess: (data) => {
        if (data && data.items) {
          setItems(data.items.map(pi => ({
            product: pi.product,
            quantity: pi.quantity,
            serials: Array(pi.quantity).fill(''),
          })));
        }
      }
    }
  );

  const mutation = useMutation(async (payload) => {
    const r = await api.post('/api/stock-in', payload);
    return r.data;
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries('currentStock');
      queryClient.invalidateQueries('stockBatches');
      queryClient.invalidateQueries('purchases-pending-stock');
      navigate('/dashboard/inventory/list');
    },
    onError: (err) => setError(err.response?.data?.message || 'Stock-In failed'),
  });

  const updateSerial = (itemIdx, serialIdx, value) => {
    setItems(prev => prev.map((it, i) =>
      i === itemIdx
        ? { ...it, serials: it.serials.map((s, j) => j === serialIdx ? value : s) }
        : it
    ));
  };

  const validateAndSubmit = () => {
    setError('');
    if (!selectedPurchase) return setError('Please select a purchase invoice');
    
    for (const [i, item] of items.entries()) {
      if (item.product?.trackSerials && item.serials.filter(s => s.trim()).length !== Number(item.quantity)) {
        return setError(`Item ${i + 1} (${item.product.name}): please enter all ${item.quantity} serial number(s)`);
      }
    }

    const payload = {
      purchaseId: selectedPurchase._id,
      note,
      items: items.map(it => ({
        product: it.product._id,
        quantity: Number(it.quantity),
        serials: it.serials.filter(s => s.trim()),
      })),
    };
    mutation.mutate(payload);
  };


  // 2. Direct Stock-In States
  const [directSupplier, setDirectSupplier] = useState(null);
  const [directItems, setDirectItems] = useState([
    { product: null, quantity: 1, purchasePrice: '', sellingPrice: '', emiPrice: '', serials: [] }
  ]);
  const [directNote, setDirectNote] = useState('');

  // Auto-switch to Direct tab and prefill product when navigated from SalesOrders
  useEffect(() => {
    if (preselectedProduct && preselectedProduct._id) {
      setActiveTab(1); // Switch to Direct Stock-In tab
      setDirectItems([{
        product: preselectedProduct,
        quantity: 1,
        purchasePrice: preselectedProduct.purchasePrice !== undefined ? preselectedProduct.purchasePrice : '',
        sellingPrice: preselectedProduct.sellingPrice !== undefined ? preselectedProduct.sellingPrice : '',
        emiPrice: preselectedProduct.emiPrice !== undefined ? preselectedProduct.emiPrice : '',
        serials: preselectedProduct.trackSerials ? [''] : []
      }]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Suppliers & Products for Direct Stock-In
  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery(
    'suppliers-direct-stock',
    async () => {
      const r = await api.get('/api/suppliers');
      return r.data.data || [];
    },
    { enabled: activeTab === 1, refetchOnWindowFocus: false }
  );

  const { data: products = [], isLoading: productsLoading } = useQuery(
    'products-direct-stock',
    async () => {
      const [rProducts, rStock] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/stock-batches/summary')
      ]);
      const prods = rProducts.data.data || [];
      const stockSummaries = rStock.data.data || [];
      
      const stockMap = {};
      stockSummaries.forEach(s => {
        const prodId = s.product?._id || s._id;
        stockMap[prodId] = s.totalRemaining || 0;
      });

      return prods.map(p => ({
        ...p,
        currentStock: stockMap[p._id] || 0
      }));
    },
    { enabled: activeTab === 1, refetchOnWindowFocus: false }
  );

  const directMutation = useMutation(async (payload) => {
    const r = await api.post('/api/stock-in/direct', payload);
    return r.data;
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries('currentStock');
      queryClient.invalidateQueries('stockBatches');
      navigate('/dashboard/inventory/list');
    },
    onError: (err) => setError(err.response?.data?.message || 'Direct Stock-In failed'),
  });

  const handleAddDirectItem = () => {
    setDirectItems(prev => [
      ...prev,
      { product: null, quantity: 1, purchasePrice: '', sellingPrice: '', emiPrice: '', serials: [] }
    ]);
  };

  const handleRemoveDirectItem = (idx) => {
    if (directItems.length === 1) return;
    setDirectItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDirectItemChange = (idx, field, val) => {
    setDirectItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;

      if (field === 'product') {
        const prod = val; // product object from Autocomplete
        if (!prod) {
          return { product: null, quantity: 1, purchasePrice: '', sellingPrice: '', emiPrice: '', serials: [] };
        }
        return {
          product: prod,
          quantity: 1,
          purchasePrice: prod.purchasePrice !== undefined ? prod.purchasePrice : '',
          sellingPrice: prod.sellingPrice !== undefined ? prod.sellingPrice : '',
          emiPrice: prod.emiPrice !== undefined ? prod.emiPrice : '',
          serials: prod.trackSerials ? [''] : []
        };
      }

      if (field === 'quantity') {
        const qty = Math.max(1, parseInt(val) || 1);
        let newSerials = [...item.serials];
        if (item.product?.trackSerials) {
          if (newSerials.length < qty) {
            newSerials = [...newSerials, ...Array(qty - newSerials.length).fill('')];
          } else if (newSerials.length > qty) {
            newSerials = newSerials.slice(0, qty);
          }
        }
        return { ...item, quantity: qty, serials: newSerials };
      }

      return { ...item, [field]: val };
    }));
  };

  const handleDirectSerialChange = (itemIdx, serialIdx, val) => {
    setDirectItems(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item;
      const newSerials = [...item.serials];
      newSerials[serialIdx] = val;
      return { ...item, serials: newSerials };
    }));
  };

  const handleBulkBoxChange = (val, itemIdx, isDirect = false) => {
    if (!val.trim()) return;
    const pastedSerials = val.split(/[\r\n\t, ]+/).map(s => s.trim()).filter(Boolean);
    
    if (pastedSerials.length > 0) {
      const updateState = isDirect ? setDirectItems : setItems;
      updateState(prev => prev.map((item, i) => {
        if (i !== itemIdx) return item;
        const newSerials = [...item.serials];
        let pIdx = 0;
        for (let j = 0; j < newSerials.length && pIdx < pastedSerials.length; j++) {
          newSerials[j] = pastedSerials[pIdx++];
        }
        return { ...item, serials: newSerials };
      }));
    }
  };

  const handleBulkPaste = (e, itemIdx, startSerialIdx, isDirect = false) => {
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;
    
    // Split by newlines, tabs, or commas and remove empty items
    const pastedSerials = pasteData.split(/[\r\n\t,]+/).map(s => s.trim()).filter(Boolean);
    
    if (pastedSerials.length > 1) {
      e.preventDefault();
      
      const updateState = isDirect ? setDirectItems : setItems;
      
      updateState(prev => prev.map((item, i) => {
        if (i !== itemIdx) return item;
        const newSerials = [...item.serials];
        let pasteIdx = 0;
        for (let j = startSerialIdx; j < newSerials.length && pasteIdx < pastedSerials.length; j++) {
          newSerials[j] = pastedSerials[pasteIdx++];
        }
        return { ...item, serials: newSerials };
      }));
    }
  };

  const validateAndSubmitDirect = () => {
    setError('');

    for (const [i, item] of directItems.entries()) {
      if (!item.product) {
        return setError(`Item ${i + 1}: Please select a product`);
      }
      if (item.purchasePrice === '' || Number(item.purchasePrice) < 0) {
        return setError(`Item ${i + 1} (${item.product.name}): Purchase price must be >= 0`);
      }
      if (item.sellingPrice === '' || Number(item.sellingPrice) < 0) {
        return setError(`Item ${i + 1} (${item.product.name}): Selling price must be >= 0`);
      }
      if (item.product.trackSerials && item.serials.filter(s => s.trim()).length !== item.quantity) {
        return setError(`Item ${i + 1} (${item.product.name}): Please enter all ${item.quantity} serial number(s)`);
      }
    }

    const payload = {
      supplier: directSupplier?._id || null,
      note: directNote,
      items: directItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        purchasePrice: Number(item.purchasePrice),
        sellingPrice: Number(item.sellingPrice),
        emiPrice: item.emiPrice !== '' && item.emiPrice !== null ? Number(item.emiPrice) : null,
        serials: item.product.trackSerials ? item.serials.map(s => s.trim()) : []
      }))
    };

    directMutation.mutate(payload);
  };

  const totalItemsCount = activeTab === 0 ? items.length : directItems.length;


  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
        <Box sx={{ p: 0.8, borderRadius: '8px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex' }}>
          <InventoryIcon sx={{ color: '#fff', fontSize: '1.3rem' }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b', fontFamily: '"Outfit",sans-serif' }}>
            Stock In Management
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
            Add inventory either from purchase invoice or direct entry
          </Typography>
        </Box>
      </Box>

      {/* Tabs to switch modes */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, val) => {
            setActiveTab(val);
            setError('');
            setSuccess(false);
          }} 
          aria-label="stock-in tabs"
          sx={{
            '& .MuiTab-root': {
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'none',
              fontFamily: '"Outfit",sans-serif',
              minWidth: 120,
            },
            '& .Mui-selected': {
              color: '#3b82f6 !important',
            }
          }}
        >
          <Tab label="Purchase Invoice Stock-In" />
          <Tab label="Direct Stock-In" />
        </Tabs>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }} onClose={() => setError('')}>{error}</Alert>}

      {/* Preselected product info banner (from SalesOrders navigation) */}
      {preselectedProduct && (
        <Alert severity="info" sx={{ mb: 2, fontSize: '0.8rem' }}>
          <strong>Pre-filled from Sales Order:</strong> &ldquo;{preselectedProduct.name}&rdquo; has been pre-selected in the <strong>Direct Stock-In</strong> tab below.
        </Alert>
      )}

      {/* TAB 0: Purchase Invoice Stock-In */}
      {activeTab === 0 && (
        <>
          <Paper elevation={0} sx={sx.section}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', mb: 2 }}>
              1. Select Purchase Invoice
            </Typography>
            {purchasesLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: '#6366f1' }}>
                <CircularProgress size={20} />
                <Typography fontSize="0.8rem">Loading pending purchases...</Typography>
              </Box>
            ) : purchases.length === 0 ? (
              <Typography fontSize="0.85rem" color="#64748b">No pending purchases found.</Typography>
            ) : (
              <Grid container spacing={2}>
                {purchases.map(purchase => (
                  <Grid item xs={12} sm={6} md={4} key={purchase._id}>
                    <Box
                      onClick={() => setSelectedPurchase(purchase)}
                      sx={{
                        border: '1px solid',
                        borderColor: selectedPurchase?._id === purchase._id ? '#6366f1' : '#e2e8f0',
                        borderRadius: '8px',
                        p: 2,
                        cursor: 'pointer',
                        bgcolor: selectedPurchase?._id === purchase._id ? '#f0f4ff' : '#fff',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#6366f1',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        }
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', mb: 0.5 }}>
                        {purchase.purchaseNumber}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mb: 1 }}>
                        {purchase.supplier?.name || purchase.supplier?.businessName || 'Unknown Supplier'} • {new Date(purchase.date).toLocaleDateString()}
                      </Typography>
                      <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #e2e8f0' }}>
                        {purchase.items?.slice(0, 3).map((item, idx) => (
                          <Typography key={idx} sx={{ fontSize: '0.75rem', color: '#475569', display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                              {item.product?.name || 'Unknown Product'}
                            </span>
                            <span style={{ fontWeight: 600, flexShrink: 0 }}>x{item.quantity}</span>
                          </Typography>
                        ))}
                        {purchase.items?.length > 3 && (
                          <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mt: 0.5, fontStyle: 'italic' }}>
                            + {purchase.items.length - 3} more items...
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
            
            {fetchingPurchase && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3, color: '#6366f1' }}>
                <CircularProgress size={20} />
                <Typography fontSize="0.8rem">Loading purchase details...</Typography>
              </Box>
            )}
          </Paper>

          {selectedPurchase && !fetchingPurchase && items.length > 0 && (
            <Paper elevation={0} sx={sx.section}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', mb: 2 }}>
                2. Products & Serial Numbers
              </Typography>

              {items.map((item, idx) => (
                <Box key={idx} sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', p: 1.5, mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>
                      {item.product?.name} {item.product?.model ? `(${item.product.model})` : ''}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                      Qty: {item.quantity}
                    </Typography>
                  </Box>
                  
                  {item.product?.trackSerials ? (
                    <Box sx={{ mt: 1.5, p: 1.5, background: '#fafafa', borderRadius: '6px', border: '1px dashed #c7d2fe' }}>
                      <Typography sx={{ fontSize: '0.75rem', color: '#6366f1', mb: 1, fontWeight: 600 }}>
                        Scan, enter, or paste {item.quantity} unique serial number(s)
                      </Typography>
                      {item.quantity > 1 && (
                        <Box sx={{ mb: 2 }}>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            size="small"
                            placeholder={`Bulk paste up to ${item.quantity} serial numbers here...`}
                            onChange={e => {
                              handleBulkBoxChange(e.target.value, idx, false);
                              e.target.value = '';
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.78rem', bgcolor: '#fff' } }}
                          />
                        </Box>
                      )}
                      <Grid container spacing={1}>
                        {item.serials.map((serial, si) => (
                          <Grid item xs={12} sm={6} md={4} key={si}>
                            <TextField 
                              size="small" 
                              placeholder={`Serial #${si + 1}`} 
                              fullWidth
                              value={serial} 
                              onChange={e => updateSerial(idx, si, e.target.value)}
                              onPaste={e => handleBulkPaste(e, idx, si, false)}
                              sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.78rem', height: 32 } }} 
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ) : (
                    <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mt: 0.5 }}>
                      Serial tracking disabled for this product.
                    </Typography>
                  )}
                </Box>
              ))}

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography sx={sx.label}>Stock-In Note (optional)</Typography>
                <TextField 
                  multiline 
                  rows={2} 
                  size="small" 
                  fullWidth 
                  value={note}
                  onChange={e => setNote(e.target.value)} 
                  placeholder="Any additional notes..."
                  sx={sx.field} 
                />
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={validateAndSubmit}
                  disabled={mutation.isLoading} 
                  sx={{ borderRadius: '8px', fontWeight: 700, px: 4 }}
                  startIcon={mutation.isLoading ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
                >
                  {mutation.isLoading ? 'Saving...' : 'Confirm Stock-In'}
                </Button>
              </Box>
            </Paper>
          )}
        </>
      )}

      {/* TAB 1: Direct Stock-In */}
      {activeTab === 1 && (
        <>
          {/* Supplier Selection */}
          <Paper elevation={0} sx={sx.section}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', mb: 2 }}>
              1. Select Supplier
            </Typography>
            {suppliersLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: '#6366f1' }}>
                <CircularProgress size={20} />
                <Typography fontSize="0.8rem">Loading suppliers...</Typography>
              </Box>
            ) : (
              <Autocomplete
                size="small"
                options={suppliers}
                getOptionLabel={(option) => option.name || option.companyName || 'Unknown Supplier'}
                value={directSupplier}
                onChange={(e, val) => setDirectSupplier(val)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Supplier (Optional)"
                    placeholder="Type supplier name..."
                    sx={sx.field}
                  />
                )}
                sx={{ maxWidth: 450 }}
              />
            )}
          </Paper>

          {/* Products & Pricing */}
          <Paper elevation={0} sx={sx.section}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                2. Products & Pricing
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddDirectItem}
                sx={{ borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'none' }}
              >
                Add Product
              </Button>
            </Box>

            {directItems.map((item, idx) => (
              <Box key={idx} sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', p: 2, mb: 2, position: 'relative', bgcolor: '#fbfcfd' }}>
                {directItems.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveDirectItem(idx)}
                    sx={{ position: 'absolute', top: 8, right: 8, color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Typography sx={sx.label}>Product</Typography>
                    {productsLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <Autocomplete
                        size="small"
                        options={products}
                        getOptionLabel={(option) => `${option.name} ${option.model ? `(${option.model})` : ''}`}
                        isOptionEqualToValue={(option, value) => option._id === value._id}
                        value={item.product}
                        onChange={(e, val) => handleDirectItemChange(idx, 'product', val)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Search product..."
                            sx={sx.field}
                            required
                          />
                        )}
                      />
                    )}
                    {item.product && (
                      <Typography sx={{ fontSize: '0.7rem', color: '#6366f1', mt: 0.5, fontWeight: 600 }}>
                        Current Stock: {products.find(p => p._id === item.product._id)?.currentStock || 0}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={6} sm={3} md={2}>
                    <Typography sx={sx.label}>Quantity</Typography>
                    <TextField
                      type="number"
                      size="small"
                      fullWidth
                      value={item.quantity}
                      onChange={e => handleDirectItemChange(idx, 'quantity', e.target.value)}
                      disabled={!item.product}
                      InputProps={{ inputProps: { min: 1 } }}
                      sx={sx.field}
                      required
                    />
                  </Grid>

                  <Grid item xs={6} sm={3} md={2}>
                    <Typography sx={sx.label}>Purchase Price</Typography>
                    <TextField
                      type="number"
                      size="small"
                      fullWidth
                      value={item.purchasePrice}
                      onChange={e => handleDirectItemChange(idx, 'purchasePrice', e.target.value)}
                      disabled={!item.product}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                        inputProps: { min: 0 }
                      }}
                      sx={sx.field}
                      required
                    />
                  </Grid>

                  <Grid item xs={6} sm={6} md={2}>
                    <Typography sx={sx.label}>Selling Price</Typography>
                    <TextField
                      type="number"
                      size="small"
                      fullWidth
                      value={item.sellingPrice}
                      onChange={e => handleDirectItemChange(idx, 'sellingPrice', e.target.value)}
                      disabled={!item.product}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                        inputProps: { min: 0 }
                      }}
                      sx={sx.field}
                      required
                    />
                  </Grid>

                  <Grid item xs={6} sm={6} md={2}>
                    <Typography sx={sx.label}>EMI Price (Optional)</Typography>
                    <TextField
                      type="number"
                      size="small"
                      fullWidth
                      value={item.emiPrice}
                      onChange={e => handleDirectItemChange(idx, 'emiPrice', e.target.value)}
                      disabled={!item.product}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                        inputProps: { min: 0 }
                      }}
                      sx={sx.field}
                    />
                  </Grid>
                </Grid>

                {/* Serials entry if product tracks serials */}
                {item.product?.trackSerials && (
                  <Box sx={{ mt: 2, p: 1.5, background: '#fafafa', borderRadius: '6px', border: '1px dashed #c7d2fe' }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#6366f1', mb: 1, fontWeight: 600 }}>
                      Scan, enter, or paste {item.quantity} unique serial number(s)
                    </Typography>
                    {item.quantity > 1 && (
                      <Box sx={{ mb: 2 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          size="small"
                          placeholder={`Bulk paste up to ${item.quantity} serial numbers here...`}
                          onChange={e => {
                            handleBulkBoxChange(e.target.value, idx, true);
                            e.target.value = '';
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.78rem', bgcolor: '#fff' } }}
                        />
                      </Box>
                    )}
                    <Grid container spacing={1}>
                      {item.serials.map((serial, si) => (
                        <Grid item xs={12} sm={6} md={4} key={si}>
                          <TextField
                            size="small"
                            placeholder={`Serial #${si + 1}`}
                            fullWidth
                            value={serial}
                            onChange={e => handleDirectSerialChange(idx, si, e.target.value)}
                            onPaste={e => handleBulkPaste(e, idx, si, true)}
                            sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.78rem', height: 32 } }}
                            required
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            ))}

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography sx={sx.label}>Stock-In Note (optional)</Typography>
              <TextField
                multiline
                rows={2}
                size="small"
                fullWidth
                value={directNote}
                onChange={e => setDirectNote(e.target.value)}
                placeholder="Any additional notes..."
                sx={sx.field}
              />
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={validateAndSubmitDirect}
                disabled={directMutation.isLoading}
                sx={{ borderRadius: '8px', fontWeight: 700, px: 4 }}
                startIcon={directMutation.isLoading ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
              >
                {directMutation.isLoading ? 'Saving...' : 'Confirm Direct Stock-In'}
              </Button>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}
