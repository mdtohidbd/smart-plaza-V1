import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Switch,
  FormControlLabel, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Snackbar, Alert, Autocomplete, CircularProgress
} from '@mui/material';
import { Add, Edit, Delete, Upload as UploadIcon } from '@mui/icons-material';
import api from '../../utils/api';

const OffersManagement = () => {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    type: 'campaign',
    title: '',
    subtitle: '',
    description: '',
    image: '',
    code: '',
    color: '#003A82',
    tag: '',
    product: null,
    discountType: 'percentage',
    discountPercentage: 0,
    discountAmount: 0,
    isActive: true
  });

  const fetchOffers = async () => {
    try {
      const res = await api.get('/api/offers');
      setOffers(res.data);
    } catch (error) {
      setToast({ open: true, message: 'Failed to fetch offers', severity: 'error' });
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products');
      setProducts(res.data.data || res.data || []);
    } catch (error) {
      console.error('Failed to fetch products for offers', error);
    }
  };

  useEffect(() => {
    fetchOffers();
    fetchProducts();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('image', file);

    setUploading(true);
    try {
      const response = await api.post('/api/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, image: response.data.url }));
      setToast({ open: true, message: 'Image uploaded successfully', severity: 'success' });
    } catch (error) {
      console.error('Upload Error:', error);
      let errorDesc = error.message;
      if (error.response) {
        const dataStr = typeof error.response.data === 'string' ? error.response.data.substring(0, 50) : JSON.stringify(error.response.data);
        errorDesc = `Server ${error.response.status}: ${error.response.data?.message || dataStr}`;
      }
      setToast({ 
        open: true, 
        message: `Error: ${errorDesc}`, 
        severity: 'error' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleOpen = (offer = null) => {
    if (offer) {
      setEditingId(offer._id);
      setFormData({
        type: offer.type,
        title: offer.title || '',
        subtitle: offer.subtitle || '',
        description: offer.description || '',
        image: offer.image || '',
        code: offer.code || '',
        color: offer.color || '#003A82',
        tag: offer.tag || '',
        product: offer.product?._id || offer.product || null,
        discountType: offer.discountType || 'percentage',
        discountPercentage: offer.discountPercentage || 0,
        discountAmount: offer.discountAmount || 0,
        isActive: offer.isActive !== undefined ? offer.isActive : true
      });
    } else {
      setEditingId(null);
      setFormData({
        type: 'campaign',
        title: '',
        subtitle: '',
        description: '',
        image: '',
        code: '',
        color: '#003A82',
        tag: '',
        product: null,
        discountType: 'percentage',
        discountPercentage: 0,
        discountAmount: 0,
        isActive: true
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'isActive' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.product) {
        payload.product = null;
      }
      if (editingId) {
        await api.put(`/api/offers/${editingId}`, payload);
        setToast({ open: true, message: 'Offer updated successfully', severity: 'success' });
      } else {
        await api.post('/api/offers', payload);
        setToast({ open: true, message: 'Offer created successfully', severity: 'success' });
      }
      handleClose();
      fetchOffers();
    } catch (error) {
      setToast({ open: true, message: error.response?.data?.message || 'Error saving offer', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      try {
        await api.delete(`/api/offers/${id}`);
        setToast({ open: true, message: 'Offer deleted', severity: 'success' });
        fetchOffers();
      } catch (error) {
        setToast({ open: true, message: 'Failed to delete offer', severity: 'error' });
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Offers Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Add Offer
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Title / Bank</TableCell>
              <TableCell>Subtitle / Discount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {offers.map((offer) => (
              <TableRow key={offer._id}>
                <TableCell>
                  <Chip 
                    label={offer.type === 'campaign' ? 'Campaign' : 'Bank Offer'} 
                    color={offer.type === 'campaign' ? 'primary' : 'secondary'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>{offer.title}</TableCell>
                <TableCell>
                  <Typography variant="body2">{offer.subtitle}</Typography>
                  {offer.type === 'campaign' && (
                    <Typography variant="caption" color="text.secondary">
                      {offer.discountType === 'flat' ? `৳${offer.discountAmount} Off` : `${offer.discountPercentage}% Off`}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={offer.isActive ? 'Active' : 'Inactive'} 
                    color={offer.isActive ? 'success' : 'default'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpen(offer)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(offer._id)} color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {offers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">No offers found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Offer' : 'Add Offer'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              select
              fullWidth
              margin="normal"
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <MenuItem value="campaign">Campaign</MenuItem>
              <MenuItem value="bank">Bank / Payment Offer</MenuItem>
            </TextField>

            <TextField
              fullWidth
              margin="normal"
              label={formData.type === 'campaign' ? 'Campaign Title' : 'Bank Name'}
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />

            <TextField
              fullWidth
              margin="normal"
              label={formData.type === 'campaign' ? 'Discount (e.g. Up to 50% Off)' : 'Short Name (e.g. Amex)'}
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              margin="normal"
              label={formData.type === 'campaign' ? 'End Text (e.g. Ends in 2 days)' : 'Offer Details (e.g. 10% Cashback)'}
              name="description"
              value={formData.description}
              onChange={handleChange}
            />

            {formData.type === 'campaign' && (
              <>
                <Autocomplete
                  options={products}
                  getOptionLabel={(option) => option.name || ''}
                  value={products.find(p => p._id === formData.product) || null}
                  onChange={(e, newValue) => {
                    setFormData(prev => ({ ...prev, product: newValue ? newValue._id : null }));
                  }}
                  ListboxProps={{ style: { maxHeight: 300, overflow: 'auto' } }}
                  renderInput={(params) => <TextField {...params} label="Linked Product (Optional)" margin="normal" />}
                />
                <TextField
                  select
                  fullWidth
                  margin="normal"
                  label="Discount Type"
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                >
                  <MenuItem value="percentage">Percentage (%)</MenuItem>
                  <MenuItem value="flat">Flat Amount (৳ / Taka)</MenuItem>
                </TextField>

                {formData.discountType === 'flat' ? (
                  <TextField
                    fullWidth
                    margin="normal"
                    type="number"
                    label="Discount Amount (৳)"
                    name="discountAmount"
                    value={formData.discountAmount}
                    onChange={handleChange}
                    inputProps={{ min: 0 }}
                  />
                ) : (
                  <TextField
                    fullWidth
                    margin="normal"
                    type="number"
                    label="Discount Percentage (%)"
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handleChange}
                    inputProps={{ min: 0, max: 100 }}
                  />
                )}
                
                {/* Dynamic Price Preview */}
                {(() => {
                  const selectedProduct = products.find(p => p._id === formData.product);
                  if (!formData.product || !selectedProduct) return null;
                  
                  const originalPrice = parseFloat(selectedProduct.sellingPrice) || 0;
                  let discountVal = 0;
                  let label = '';
                  if (formData.discountType === 'flat') {
                    discountVal = parseFloat(formData.discountAmount) || 0;
                    label = `Discount (Flat)`;
                  } else {
                    const discountPercent = parseFloat(formData.discountPercentage) || 0;
                    discountVal = (originalPrice * discountPercent) / 100;
                    label = `Discount (${discountPercent}%)`;
                  }
                  const offerPrice = originalPrice - discountVal;

                  return (
                    <Box sx={{ mt: 1, mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1, fontWeight: 700 }}>Price Calculation Preview</Typography>
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Original Price</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                             ৳{originalPrice.toFixed(2)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#EF4444' }}>
                             -৳{discountVal.toFixed(2)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Offer Price</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: '#10B981', fontSize: '1.1rem' }}>
                             ৳{Math.max(0, offerPrice).toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })()}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Image URL"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="Paste URL here..."
                  />
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>OR</Typography>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
                    disabled={uploading}
                    sx={{ height: 56, mt: 1, whiteSpace: 'nowrap' }}
                  >
                    {uploading ? 'Uploading...' : 'Upload File'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </Button>
                </Box>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Tag (e.g. Flash Sale)"
                  name="tag"
                  value={formData.tag}
                  onChange={handleChange}
                />
              </>
            )}

            {formData.type === 'bank' && (
              <>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Promo Code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  type="color"
                  label="Brand Color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  sx={{ mt: 2 }}
                />
              </>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleChange}
                  name="isActive"
                  color="primary"
                />
              }
              label="Is Active"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
      
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setToast(prev => ({ ...prev, open: false }))} 
          severity={toast.severity} 
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OffersManagement;
