import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Tabs, Tab, TextField, IconButton, CircularProgress,
  Alert, Grid, Paper, Divider, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other} style={{ minHeight: '300px' }}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function EcommerceDetailsModal({ open, onClose, product }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [formData, setFormData] = useState({
    metaTitle: '',
    metaDescription: '',
    highlights: [],
    highlightImages: [],
    features: [],
    specifications: []
  });
  
  const [error, setError] = useState('');

  // Fetch full product details when opened
  const { isLoading: isFetching } = useQuery(
    ['product-ecommerce-details', product?._id],
    async () => {
      const response = await api.get(`/api/products/${product._id}`);
      return response.data.data;
    },
    {
      enabled: !!product?._id && open,
      onSuccess: (data) => {
        setFormData({
          metaTitle: data.metaTitle || '',
          metaDescription: data.metaDescription || '',
          highlights: data.highlights || [],
          highlightImages: data.highlightImages || [],
          features: data.features || [],
          specifications: data.specifications || []
        });
      },
      refetchOnWindowFocus: false
    }
  );

  // Helper for Cloudinary Upload
  const uploadToCloudinary = async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    try {
      const response = await api.post('/api/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.success ? response.data.url : null;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      return null;
    }
  };

  const updateMutation = useMutation(
    async (updatedData) => {
      return await api.put(`/api/products/${product._id}`, updatedData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ecommerce-all-products');
        onClose();
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to update ecommerce details');
      }
    }
  );

  const handleSave = () => {
    setError('');
    updateMutation.mutate(formData);
  };

  // SEO Handlers
  const handleSeoChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Highlights Handlers
  const addHighlight = () => setFormData({ ...formData, highlights: [...formData.highlights, ''] });
  const updateHighlight = (i, val) => {
    const newHL = [...formData.highlights];
    newHL[i] = val;
    setFormData({ ...formData, highlights: newHL });
  };
  const removeHighlight = (i) => setFormData({ ...formData, highlights: formData.highlights.filter((_, idx) => idx !== i) });

  const handleHighlightImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadToCloudinary(file);
    if (url) {
      setFormData(prev => ({ ...prev, highlightImages: [...prev.highlightImages, url] }));
    }
  };

  // Features Handlers
  const addFeature = () => setFormData({
    ...formData,
    features: [...formData.features, { title: '', description: '', image: '', layout: 'left' }]
  });
  const updateFeature = (i, field, val) => {
    const newF = [...formData.features];
    newF[i][field] = val;
    setFormData({ ...formData, features: newF });
  };
  const removeFeature = (i) => setFormData({ ...formData, features: formData.features.filter((_, idx) => idx !== i) });
  
  const handleFeatureImageUpload = async (i, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadToCloudinary(file);
    if (url) {
      updateFeature(i, 'image', url);
    }
  };

  // Specs Handlers
  const addSpecCategory = () => setFormData({
    ...formData,
    specifications: [...formData.specifications, { category: '', items: [] }]
  });
  const updateSpecCategory = (i, val) => {
    const newS = [...formData.specifications];
    newS[i].category = val;
    setFormData({ ...formData, specifications: newS });
  };
  const removeSpecCategory = (i) => setFormData({ ...formData, specifications: formData.specifications.filter((_, idx) => idx !== i) });

  const addSpecItem = (catIndex) => {
    const newS = [...formData.specifications];
    newS[catIndex].items.push({ label: '', value: '' });
    setFormData({ ...formData, specifications: newS });
  };
  const updateSpecItem = (catIndex, itemIndex, field, val) => {
    const newS = [...formData.specifications];
    newS[catIndex].items[itemIndex][field] = val;
    setFormData({ ...formData, specifications: newS });
  };
  const removeSpecItem = (catIndex, itemIndex) => {
    const newS = [...formData.specifications];
    newS[catIndex].items = newS[catIndex].items.filter((_, idx) => idx !== itemIndex);
    setFormData({ ...formData, specifications: newS });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Ecommerce Details</Typography>
        <Typography variant="body2" color="text.secondary">{product?.name}</Typography>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {isFetching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable">
                <Tab label="SEO" />
                <Tab label="Highlights" />
                <Tab label="Features" />
                <Tab label="Specifications" />
              </Tabs>
            </Box>

            <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              {/* SEO TAB */}
              <TabPanel value={tab} index={0}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth size="small" label="Meta Title" name="metaTitle"
                      value={formData.metaTitle} onChange={handleSeoChange}
                      helperText="Max 70 characters for best SEO"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth size="small" label="Meta Description" name="metaDescription"
                      multiline rows={3} value={formData.metaDescription} onChange={handleSeoChange}
                      helperText="Max 160 characters"
                    />
                  </Grid>
                </Grid>
              </TabPanel>

              {/* HIGHLIGHTS TAB */}
              <TabPanel value={tab} index={1}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Highlight Points</Typography>
                  {formData.highlights.map((hl, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <TextField fullWidth size="small" placeholder={`Highlight ${i+1}`}
                        value={hl} onChange={e => updateHighlight(i, e.target.value)} />
                      <IconButton color="error" onClick={() => removeHighlight(i)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button startIcon={<AddIcon />} size="small" onClick={addHighlight} sx={{ mt: 1 }}>
                    Add Highlight
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Highlight Images (Gallery)</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                    {formData.highlightImages.map((img, i) => (
                      <Box key={i} sx={{ position: 'relative', width: 80, height: 80, border: '1px solid #ddd', borderRadius: 1 }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <IconButton size="small" color="error"
                          onClick={() => setFormData(p => ({ ...p, highlightImages: p.highlightImages.filter((_, idx) => idx !== i)}))}
                          sx={{ position: 'absolute', top: -10, right: -10, background: '#fff', boxShadow: 1 }}>
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    ))}
                    <Button variant="outlined" component="label" sx={{ width: 80, height: 80, display: 'flex', flexDirection: 'column' }}>
                      <CloudUploadIcon fontSize="small" />
                      <Typography sx={{ fontSize: '0.6rem', mt: 1 }}>Upload</Typography>
                      <input type="file" hidden accept="image/*" onChange={handleHighlightImageUpload} />
                    </Button>
                  </Box>
                </Box>
              </TabPanel>

              {/* FEATURES TAB */}
              <TabPanel value={tab} index={2}>
                {formData.features.map((f, i) => (
                  <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2, position: 'relative' }}>
                    <IconButton size="small" color="error" onClick={() => removeFeature(i)}
                      sx={{ position: 'absolute', top: 5, right: 5 }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={8}>
                        <TextField fullWidth size="small" label="Feature Title" value={f.title}
                          onChange={e => updateFeature(i, 'title', e.target.value)} sx={{ mb: 1.5 }} />
                        <TextField fullWidth size="small" label="Feature Description" value={f.description}
                          multiline rows={2} onChange={e => updateFeature(i, 'description', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                          <InputLabel>Layout Position</InputLabel>
                          <Select value={f.layout} label="Layout Position" onChange={e => updateFeature(i, 'layout', e.target.value)}>
                            <MenuItem value="left">Image Left</MenuItem>
                            <MenuItem value="right">Image Right</MenuItem>
                          </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {f.image && <img src={f.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />}
                          <Button variant="outlined" component="label" size="small" startIcon={<CloudUploadIcon />}>
                            {f.image ? 'Change Image' : 'Upload Image'}
                            <input type="file" hidden accept="image/*" onChange={(e) => handleFeatureImageUpload(i, e)} />
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
                <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={addFeature}>
                  Add Feature Block
                </Button>
              </TabPanel>

              {/* SPECS TAB */}
              <TabPanel value={tab} index={3}>
                {formData.specifications.map((cat, i) => (
                  <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2, position: 'relative' }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField size="small" label="Category Name (e.g. Display)" value={cat.category}
                        onChange={e => updateSpecCategory(i, e.target.value)} sx={{ flexGrow: 1, maxWidth: 300 }} />
                      <IconButton color="error" onClick={() => removeSpecCategory(i)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                    <Box sx={{ pl: 2, borderLeft: '2px solid #f1f5f9' }}>
                      {cat.items.map((item, j) => (
                        <Box key={j} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <TextField size="small" placeholder="Label (e.g. Size)" value={item.label}
                            onChange={e => updateSpecItem(i, j, 'label', e.target.value)} sx={{ width: 150 }} />
                          <TextField size="small" placeholder="Value (e.g. 6.5 inches)" value={item.value}
                            onChange={e => updateSpecItem(i, j, 'value', e.target.value)} sx={{ flexGrow: 1 }} />
                          <IconButton size="small" color="error" onClick={() => removeSpecItem(i, j)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                      <Button startIcon={<AddIcon />} size="small" onClick={() => addSpecItem(i)} sx={{ mt: 1 }}>
                        Add Item
                      </Button>
                    </Box>
                  </Paper>
                ))}
                <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={addSpecCategory}>
                  Add Spec Category
                </Button>
              </TabPanel>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ borderTop: '1px solid #e2e8f0', p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleSave} 
          disabled={updateMutation.isLoading || isFetching}
          sx={{ background: '#6366f1', '&:hover': { background: '#4f46e5' } }}
        >
          {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
