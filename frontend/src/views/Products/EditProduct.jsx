import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  InputAdornment,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  IconButton,
  Switch,
  FormControlLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete
} from '@mui/material';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const PRESET_COLORS = [
  { name: 'Black', code: '#000000' },
  { name: 'White', code: '#FFFFFF' },
  { name: 'Silver', code: '#C0C0C0' },
  { name: 'Space Gray', code: '#4B5563' },
  { name: 'Gold', code: '#D97706' },
  { name: 'Rose Gold', code: '#E11D48' },
  { name: 'Midnight Blue', code: '#1E3A8A' },
  { name: 'Red', code: '#EF4444' },
  { name: 'Blue', code: '#3B82F6' },
  { name: 'Green', code: '#10B981' },
  { name: 'Purple', code: '#8B5CF6' },
  { name: 'Yellow', code: '#F59E0B' }
];

const getInitialColors = () => {
  try {
    const saved = localStorage.getItem('DemoERP_custom_colors');
    if (saved) {
      const parsed = JSON.parse(saved);
      const combined = [...PRESET_COLORS];
      parsed.forEach(c => {
        if (!combined.some(p => p.name.toLowerCase() === c.name.toLowerCase())) {
          combined.push(c);
        }
      });
      return combined;
    }
  } catch (e) {
    console.error('Error loading custom colors:', e);
  }
  return PRESET_COLORS;
};

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unit: '',
    purchasePrice: '',
    sellingPrice: '',
    mrp: '',
    supplier: '',
    brand: '',
    description: '',
    openingStock: 0,
    alertQuantity: 10,
    reorderLevel: 5,
    model: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [isListedOnEcommerce, setIsListedOnEcommerce] = useState(false);
  
  // Product Colors State
  const [availableColors, setAvailableColors] = useState(getInitialColors());
  const [productColors, setProductColors] = useState([]);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorCode, setCustomColorCode] = useState('#14B8A6');
  const [colorModalOpen, setColorModalOpen] = useState(false);

  const handleTogglePresetColor = (preset) => {
    setProductColors(prev => {
      const exists = prev.some(c => c.name.toLowerCase() === preset.name.toLowerCase());
      if (exists) {
        return prev.filter(c => c.name.toLowerCase() !== preset.name.toLowerCase());
      } else {
        return [...prev, preset];
      }
    });
  };

  const handleColorSelectChange = (event) => {
    const { value } = event.target;
    const selectedNames = typeof value === 'string' ? value.split(',') : value;
    const newProductColors = selectedNames.map(name => {
      const found = availableColors.find(c => c.name.toLowerCase() === name.toLowerCase());
      return found || { name, code: '#14B8A6' };
    });
    setProductColors(newProductColors);
  };

  const handleAddCustomColor = () => {
    const textToUse = customColorName.trim() || 'Color';
    const rawNames = textToUse.split(',').map(n => n.trim()).filter(Boolean);
    
    let newlyCreated = [];
    rawNames.forEach(name => {
      const lower = name.toLowerCase();
      const preset = PRESET_COLORS.find(p => p.name.toLowerCase() === lower);
      const code = preset ? preset.code : (customColorCode || '#14B8A6');
      newlyCreated.push({ name, code });
    });

    setAvailableColors(prev => {
      let updated = [...prev];
      newlyCreated.forEach(nc => {
        if (!updated.some(c => c.name.toLowerCase() === nc.name.toLowerCase())) {
          updated.push(nc);
        }
      });
      try {
        const customOnly = updated.filter(u => !PRESET_COLORS.some(p => p.name.toLowerCase() === u.name.toLowerCase()));
        localStorage.setItem('DemoERP_custom_colors', JSON.stringify(customOnly));
      } catch (e) {}
      return updated;
    });

    setProductColors(prev => {
      let updated = [...prev];
      newlyCreated.forEach(nc => {
        if (!updated.some(c => c.name.toLowerCase() === nc.name.toLowerCase())) {
          updated.push(nc);
        }
      });
      return updated;
    });

    setCustomColorName('');
  };

  const handleRemoveColor = (index) => {
    setProductColors(prev => prev.filter((_, i) => i !== index));
  };
  
  // Image upload state
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  // Fetch product data
  const { data: product, isLoading, isError } = useQuery(
    ['product', id],
    async () => {
      const response = await api.get(`/api/products/${id}`);
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        setFormData({
          name: data.name || '',
          sku: data.sku || '',
          category: data.category?._id || '',
          unit: data.unit?._id || '',
          purchasePrice: data.purchasePrice || '',
          sellingPrice: data.sellingPrice || '',
          mrp: data.mrp || '',
          supplier: data.supplier?._id || '',
          brand: data.brand?._id || '',
          description: data.description || '',
          openingStock: data.openingStock || 0,
          alertQuantity: data.alertQuantity || 10,
          reorderLevel: data.reorderLevel || 5,
          model: data.model || '',
        });

        setIsListedOnEcommerce(data.isListedOnEcommerce || false);
        if (data.images && data.images.length > 0) setExistingImages(data.images);

        let loadedColors = [];
        if (data.colors && data.colors.length > 0) {
          loadedColors = data.colors;
        } else if (data.color) {
          const names = data.color.split(',').map(s => s.trim()).filter(Boolean);
          loadedColors = names.map(n => {
            const preset = PRESET_COLORS.find(p => p.name.toLowerCase() === n.toLowerCase());
            return preset || { name: n, code: '#14B8A6' };
          });
        }
        setProductColors(loadedColors);
        if (loadedColors.length > 0) {
          setAvailableColors(prev => {
            let updated = [...prev];
            loadedColors.forEach(lc => {
              if (!updated.some(c => c.name.toLowerCase() === lc.name.toLowerCase())) {
                updated.push(lc);
              }
            });
            try {
              const customOnly = updated.filter(u => !PRESET_COLORS.some(p => p.name.toLowerCase() === u.name.toLowerCase()));
              localStorage.setItem('DemoERP_custom_colors', JSON.stringify(customOnly));
            } catch (e) {}
            return updated;
          });
        }
      },
      refetchOnWindowFocus: false,
    }
  );

  // Fetch categories
  const { data: categories } = useQuery('categories', async () => {
    const response = await api.get('/api/categories');
    return response.data.data;
  });

  // Fetch units
  const { data: units } = useQuery('units', async () => {
    const response = await api.get('/api/units');
    return response.data.data;
  });

  // Fetch suppliers
  const { data: suppliers } = useQuery('suppliers', async () => {
    const response = await api.get('/api/suppliers');
    return response.data.data;
  });

  // Fetch brands
  const { data: brands } = useQuery('brands', async () => {
    const response = await api.get('/api/brands?limit=1000');
    return response.data;
  });

  const brandsList = Array.isArray(brands) ? brands : (brands?.data || []);

  // Fetch product batches
  const { data: batchesResponse } = useQuery(
    ['productBatches', id],
    async () => {
      const response = await api.get(`/api/stock-batches/product/${id}`);
      return response.data;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  const [batchesData, setBatchesData] = useState([]);

  useEffect(() => {
    if (batchesResponse?.data) {
      setBatchesData(batchesResponse.data.map(b => ({
        _id: b._id,
        batchNumber: b.batchNumber,
        supplierName: b.supplier?.name || b.supplier?.companyName || '—',
        purchaseDate: b.purchaseDate,
        remainingQty: b.remainingQty,
        quantity: b.quantity,
        purchasePrice: b.purchasePrice !== undefined && b.purchasePrice !== null ? b.purchasePrice : '',
        sellingPrice: b.sellingPrice !== undefined && b.sellingPrice !== null ? b.sellingPrice : '',
        emiPrice: b.emiPrice !== undefined && b.emiPrice !== null ? b.emiPrice : '',
        ecommercePriceOverride: b.ecommercePriceOverride !== undefined && b.ecommercePriceOverride !== null ? b.ecommercePriceOverride : '',
      })));
    }
  }, [batchesResponse]);

  const handleBatchPriceChange = (batchId, field, val) => {
    setBatchesData(prev => prev.map(b => {
      if (b._id === batchId) {
        return { ...b, [field]: val };
      }
      return b;
    }));
  };

  const updateProductMutation = useMutation(
    async (data) => {
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

      const finalData = { ...data };
      
      // Handle main images
      const newMainImageUrls = [];
      if (selectedImages.length > 0) {
        for (const file of selectedImages) {
          const url = await uploadToCloudinary(file);
          if (url) newMainImageUrls.push(url);
        }
      }
      const allMainImages = [...existingImages, ...newMainImageUrls];
      finalData.images = allMainImages;
      finalData.image = allMainImages[0] || '';

      const productRes = await api.put(`/api/products/${id}`, finalData);

      if (batchesData && batchesData.length > 0 && batchesResponse?.data) {
        for (const bData of batchesData) {
          const original = batchesResponse.data.find(o => o._id === bData._id);
          if (original) {
            const hasChanged =
              parseFloat(bData.purchasePrice) !== parseFloat(original.purchasePrice) ||
              parseFloat(bData.sellingPrice) !== parseFloat(original.sellingPrice) ||
              parseFloat(bData.emiPrice || 0) !== parseFloat(original.emiPrice || 0) ||
              parseFloat(bData.ecommercePriceOverride || 0) !== parseFloat(original.ecommercePriceOverride || 0);

            if (hasChanged) {
              await api.put(`/api/stock-batches/${bData._id}`, {
                purchasePrice: parseFloat(bData.purchasePrice) || 0,
                sellingPrice: parseFloat(bData.sellingPrice) || 0,
                emiPrice: bData.emiPrice !== '' && bData.emiPrice !== null ? parseFloat(bData.emiPrice) : null,
                ecommercePriceOverride: bData.ecommercePriceOverride !== '' && bData.ecommercePriceOverride !== null ? parseFloat(bData.ecommercePriceOverride) : null
              });
            }
          }
        }
      }

      return productRes;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        queryClient.invalidateQueries(['product', id]);
        queryClient.invalidateQueries(['productBatches', id]);
        queryClient.invalidateQueries('stock-batches');
        queryClient.invalidateQueries('retailInventoryProducts');
        queryClient.invalidateQueries('inventory');
        setSuccess('Product updated successfully!');
        setTimeout(() => {
          navigate('/products/all');
        }, 1500);
      },
      onError: (error) => {
        console.error('Error updating product:', error);
        
        // Extract detailed error message
        let errorMessage = 'Failed to update product';
        
        if (error.response?.data?.message) {
          // Handle Mongoose validation errors
          if (error.response.data.message.includes('Validation failed')) {
            // Extract field name from validation error
            const match = error.response.data.message.match(/Validation failed: ([\w]+):/);
            if (match && match[1]) {
              const fieldName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
              errorMessage = `${fieldName} is required or invalid`;
            } else {
              errorMessage = error.response.data.message;
            }
          } else {
            errorMessage = error.response.data.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
        // Scroll to top to show error
        window.scrollTo({ top: 0, behavior: 'smooth' });
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



  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFilesOrUrls = useCallback((items) => {
    if (items.length === 0) return;
    
    setSelectedImages(prevSelected => {
      const currentTotal = existingImages.length + prevSelected.length;
      const newTotal = currentTotal + items.length;
      let allowedItems = items;
      
      if (newTotal > 5) {
        alert(`You can only have up to 5 images per product. You can add ${5 - currentTotal} more.`);
        allowedItems = items.slice(0, Math.max(0, 5 - currentTotal));
      }
      
      if (allowedItems.length === 0) return prevSelected;

      const newUrls = allowedItems.map(item => typeof item === 'string' ? item : URL.createObjectURL(item));
      
      setImagePreviewUrls(prevUrls => [...prevUrls, ...newUrls]);
      return [...prevSelected, ...allowedItems];
    });
  }, [existingImages]);

  useEffect(() => {
    const handlePaste = (e) => {
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      const items = Array.from(e.clipboardData.items);
      const files = items.filter(item => item.type.indexOf('image') !== -1).map(item => item.getAsFile());
      
      if (files.length > 0) {
        e.preventDefault();
        processFilesOrUrls(files);
        return;
      }
      
      if (!isInput) {
        const text = e.clipboardData.getData('text');
        if (text && (text.startsWith('http://') || text.startsWith('https://')) && text.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
          e.preventDefault();
          processFilesOrUrls([text]);
        }
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [processFilesOrUrls]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      processFilesOrUrls(files);
      return;
    }
    
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      processFilesOrUrls([url]);
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    processFilesOrUrls(files);
    if (e.target) e.target.value = null;
  };

  // Remove an image from new selections
  const handleRemoveImage = (index) => {
    const newImages = selectedImages.filter((i, idx) => idx !== index);
    const newUrls = imagePreviewUrls.filter((i, idx) => idx !== index);
    setSelectedImages(newImages);
    setImagePreviewUrls(newUrls);
  };

  // Remove an existing image
  const handleRemoveExistingImage = (index) => {
    const newExistingImages = existingImages.filter((i, idx) => idx !== index);
    setExistingImages(newExistingImages);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }

    if (!formData.model || !formData.model.trim()) {
      setError('Model is required');
      return;
    }

    if (!formData.category) {
      setError('Category is required');
      return;
    }

    if (!formData.unit) {
      setError('Unit is required');
      return;
    }

    if (formData.purchasePrice && (isNaN(parseFloat(formData.purchasePrice)) || parseFloat(formData.purchasePrice) < 0)) {
      setError('Purchase price must be a non-negative number');
      return;
    }

    if (formData.sellingPrice && (isNaN(parseFloat(formData.sellingPrice)) || parseFloat(formData.sellingPrice) < 0)) {
      setError('Selling price must be a non-negative number');
      return;
    }

    if (!formData.mrp || isNaN(parseFloat(formData.mrp)) || parseFloat(formData.mrp) < 0) {
      setError('MRP is required and must be a non-negative number');
      return;
    }

    if (formData.purchasePrice && formData.sellingPrice && parseFloat(formData.sellingPrice) < parseFloat(formData.purchasePrice)) {
      setError('Selling price should not be less than purchase price');
      return;
    }

    // Validation for batches
    if (batchesData && batchesData.length > 0) {
      for (const batch of batchesData) {
        if (batch.purchasePrice === '' || isNaN(parseFloat(batch.purchasePrice)) || parseFloat(batch.purchasePrice) < 0) {
          setError(`Batch ${batch.batchNumber} purchase price must be a non-negative number`);
          return;
        }
        if (batch.sellingPrice === '' || isNaN(parseFloat(batch.sellingPrice)) || parseFloat(batch.sellingPrice) < 0) {
          setError(`Batch ${batch.batchNumber} selling price must be a non-negative number`);
          return;
        }
        if (batch.emiPrice !== '' && batch.emiPrice !== null && (isNaN(parseFloat(batch.emiPrice)) || parseFloat(batch.emiPrice) < 0)) {
          setError(`Batch ${batch.batchNumber} EMI price must be a non-negative number`);
          return;
        }
        if (batch.ecommercePriceOverride !== '' && batch.ecommercePriceOverride !== null && (isNaN(parseFloat(batch.ecommercePriceOverride)) || parseFloat(batch.ecommercePriceOverride) < 0)) {
          setError(`Batch ${batch.batchNumber} Ecommerce price override must be a non-negative number`);
          return;
        }
      }
    }

    const colorString = productColors.map(c => c.name).join(', ');
    const colorsPayload = productColors.map(c => ({ name: c.name, code: c.code }));

    const updatePayload = {
      ...formData,
      color: colorString,
      colors: colorsPayload,
      trackSerials: true,
      isListedOnEcommerce,
    };
    if (!updatePayload.supplier) {
      updatePayload.supplier = null;
    }

    updateProductMutation.mutate(updatePayload);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Error loading product data</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 1, sm: 2 }, 
      backgroundColor: '#F8FAFC',
      
    }}>
      <Grid container spacing={1.5} >
        <Grid item xs={12}>
          <form onSubmit={handleSubmit}>
            <Paper 
              elevation={0}
              sx={{
                p: 1.5,
                px: 2,
                mb: 2,
                border: '1px solid #eaeef3',
                borderRadius: '8px',
                fontFamily: '"Outfit", sans-serif',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                gap: 2
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, fontFamily: '"Outfit", sans-serif', fontSize: '1.1rem', mb: 0.25 }}>
                  Edit Product
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem' }}>
                  Update product information and pricing details.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isListedOnEcommerce}
                      onChange={(e) => setIsListedOnEcommerce(e.target.checked)}
                      color="success"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.85rem' }}>Ecommerce</Typography>
                  }
                  sx={{ mr: 1, ml: 0 }}
                />

                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => navigate('/dashboard/products/all')}
                  sx={{ borderRadius: '6px' }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  size="small" 
                  type="submit"
                  disabled={updateProductMutation.isLoading}
                  sx={{ 
                    borderRadius: '6px',
                    backgroundColor: '#1D5F99',
                    '&:hover': { backgroundColor: '#154A78' },
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 'none'
                  }}
                >
                  {updateProductMutation.isLoading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                  Update Product
                </Button>
              </Box>
            </Paper>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>
                {success}
              </Alert>
            )}

            {/* Section 2: General Information */}
            <Paper 
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                mb: 2,
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1E293B', mb: 1.5, fontSize: '0.9rem' }}>
                General Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Product Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    InputProps={{ sx: { borderRadius: '8px' } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="SKU"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    InputProps={{ sx: { borderRadius: '8px' } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Model"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    required
                    InputProps={{ sx: { borderRadius: '8px' } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Product Colors (Optional)</InputLabel>
                      <Select
                        multiple
                        name="productColors"
                        value={productColors.map(c => c.name)}
                        onChange={handleColorSelectChange}
                        label="Product Colors (Optional)"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => {
                              const col = availableColors.find(c => c.name.toLowerCase() === value.toLowerCase()) || { name: value, code: '#14B8A6' };
                              return (
                                <Chip
                                  key={value}
                                  label={value}
                                  size="small"
                                  avatar={
                                    <Box sx={{ 
                                      width: 10, 
                                      height: 10, 
                                      borderRadius: '50%', 
                                      bgcolor: col.code,
                                      border: col.code === '#FFFFFF' || col.code === '#ffffff' ? '1px solid #CBD5E1' : 'none'
                                    }} />
                                  }
                                  sx={{ height: 22, fontSize: '11px', fontWeight: 600, bgcolor: '#F1F5F9' }}
                                />
                              );
                            })}
                          </Box>
                        )}
                        sx={{ borderRadius: '8px' }}
                      >
                        {availableColors.map((color) => {
                          const isSelected = productColors.some(c => c.name.toLowerCase() === color.name.toLowerCase());
                          return (
                            <MenuItem 
                              key={color.name} 
                              value={color.name}
                              sx={{ color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1, fontWeight: isSelected ? 700 : 400 }}
                            >
                              <Box sx={{ 
                                width: 14, 
                                height: 14, 
                                borderRadius: '50%', 
                                bgcolor: color.code, 
                                border: color.code === '#FFFFFF' || color.code === '#ffffff' ? '1px solid #CBD5E1' : 'none',
                                flexShrink: 0 
                              }} />
                              <Typography variant="body2">{color.name}</Typography>
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                    <IconButton
                      onClick={() => setColorModalOpen(true)}
                      sx={{ 
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC',
                        p: '8px',
                        color: '#6366F1',
                        flexShrink: 0,
                        '&:hover': {
                          backgroundColor: '#eaeef3',
                        }
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      label="Category"
                      sx={{ borderRadius: '8px' }}
                    >
                      {Array.isArray(categories) && categories.map((category) => (
                        <MenuItem key={category._id} value={category._id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    fullWidth
                    size="small"
                    options={brandsList}
                    getOptionLabel={(option) => option.name || ''}
                    value={brandsList.find(b => b._id === formData.brand) || null}
                    onChange={(event, newValue) => {
                      setFormData({
                        ...formData,
                        brand: newValue ? newValue._id : ''
                      });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Brand *"
                        required={!formData.brand}
                      />
                    )}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Unit</InputLabel>
                    <Select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      label="Unit"
                      sx={{ borderRadius: '8px' }}
                    >
                      {Array.isArray(units) && units.map((unit) => (
                        <MenuItem key={unit._id} value={unit._id}>
                          {unit.name} ({unit.symbol})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    InputProps={{ sx: { borderRadius: '8px' } }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Section 3: Pricing & Inventory */}
            <Paper 
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                mb: 2,
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1E293B', mb: 1.5, fontSize: '0.9rem' }}>
                Pricing & Inventory
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Purchase Price"
                    name="purchasePrice"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                      sx: { borderRadius: '8px' }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Selling Price"
                    name="sellingPrice"
                    type="number"
                    value={formData.sellingPrice}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                      sx: { borderRadius: '8px' }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="MRP *"
                    name="mrp"
                    type="number"
                    value={formData.mrp}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                      sx: { borderRadius: '8px' }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Supplier (Optional)</InputLabel>
                      <Select
                        name="supplier"
                        value={formData.supplier}
                        onChange={handleInputChange}
                        label="Supplier (Optional)"
                        sx={{ borderRadius: '8px' }}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {Array.isArray(suppliers) && suppliers.map((supplier) => (
                          <MenuItem key={supplier._id} value={supplier._id}>
                            {supplier.name} {supplier.companyName ? `(${supplier.companyName})` : ''}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <IconButton
                      onClick={() => navigate('/dashboard/contacts/add?type=supplier')}
                      sx={{ 
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC',
                        p: '7px',
                        color: '#1D5F99',
                        flexShrink: 0,
                        height: 40,
                        width: 40,
                        '&:hover': {
                          backgroundColor: '#eaeef3',
                        }
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Opening Stock (Quantity)"
                    name="openingStock"
                    type="number"
                    value={formData.openingStock}
                    onChange={handleInputChange}
                    InputProps={{ sx: { borderRadius: '8px' } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Alert Quantity"
                    name="alertQuantity"
                    type="number"
                    value={formData.alertQuantity}
                    onChange={handleInputChange}
                    InputProps={{ sx: { borderRadius: '8px' } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Reorder Level"
                    name="reorderLevel"
                    type="number"
                    value={formData.reorderLevel}
                    onChange={handleInputChange}
                    InputProps={{ sx: { borderRadius: '8px' } }}
                  />
                </Grid>


                </Grid>
              </Paper>

            {/* Batch Pricing Card */}
            {batchesData && batchesData.length > 0 && (
              <Card sx={{ mt: 2, borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                <CardHeader 
                  title="Batch Pricing & Adjustments" 
                  subheader="Adjust pricing parameters for individual inventory batches."
                  titleTypographyProps={{ variant: 'subtitle2', fontWeight: '700', color: '#1E293B', fontFamily: '"Outfit", sans-serif' }}
                  subheaderTypographyProps={{ variant: 'caption', color: '#64748b', fontFamily: '"Outfit", sans-serif' }}
                  sx={{ pb: 1 }}
                />
                <Divider />
                <CardContent sx={{ p: { xs: 2, sm: 0 } }}>
                  {/* Mobile View: Batch Pricing Cards */}
                  <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 2 }}>
                    {batchesData.map((batch) => (
                      <Box 
                        key={batch._id} 
                        sx={{ 
                          p: 2, 
                          border: '1px solid #E2E8F0', 
                          borderRadius: '8px', 
                          backgroundColor: '#F8FAFC' 
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.5 }}>
                          Batch #{batch.batchNumber}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
                          Supplier: {batch.supplierName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1.5 }}>
                          Date: {batch.purchaseDate ? new Date(batch.purchaseDate).toLocaleDateString() : '—'} | Stock: {batch.remainingQty} / {batch.quantity}
                        </Typography>
                        <Grid container spacing={1.5}>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Purchase Price (৳)"
                              type="number"
                              value={batch.purchasePrice}
                              onChange={(e) => handleBatchPriceChange(batch._id, 'purchasePrice', e.target.value)}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Selling Price (৳)"
                              type="number"
                              value={batch.sellingPrice}
                              onChange={(e) => handleBatchPriceChange(batch._id, 'sellingPrice', e.target.value)}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="EMI Price (৳)"
                              type="number"
                              value={batch.emiPrice}
                              placeholder="Inherit"
                              onChange={(e) => handleBatchPriceChange(batch._id, 'emiPrice', e.target.value)}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Ecommerce Price (৳)"
                              type="number"
                              value={batch.ecommercePriceOverride}
                              placeholder="Inherit"
                              onChange={(e) => handleBatchPriceChange(batch._id, 'ecommercePriceOverride', e.target.value)}
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Box>

                  {/* Desktop View: Table */}
                  <TableContainer sx={{ display: { xs: 'none', sm: 'block' }, overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Batch No.</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Supplier & Date</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Stock</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Purchase Price (৳)</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Selling Price (৳)</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>EMI Price (৳)</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Ecommerce Price (৳)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {batchesData.map((batch) => (
                          <TableRow key={batch._id} hover>
                            <TableCell sx={{ fontWeight: 500, color: '#1e293b' }}>
                              #{batch.batchNumber}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>
                                {batch.supplierName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                {batch.purchaseDate ? new Date(batch.purchaseDate).toLocaleDateString() : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ color: '#334155' }}>
                              {batch.remainingQty} / {batch.quantity}
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={batch.purchasePrice}
                                onChange={(e) => handleBatchPriceChange(batch._id, 'purchasePrice', e.target.value)}
                                sx={{ width: 110 }}
                                InputProps={{
                                  sx: { borderRadius: '6px', fontSize: '0.85rem' }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={batch.sellingPrice}
                                onChange={(e) => handleBatchPriceChange(batch._id, 'sellingPrice', e.target.value)}
                                sx={{ width: 110 }}
                                InputProps={{
                                  sx: { borderRadius: '6px', fontSize: '0.85rem' }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={batch.emiPrice}
                                onChange={(e) => handleBatchPriceChange(batch._id, 'emiPrice', e.target.value)}
                                placeholder="Inherit"
                                sx={{ width: 110 }}
                                InputProps={{
                                  sx: { borderRadius: '6px', fontSize: '0.85rem' }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={batch.ecommercePriceOverride}
                                onChange={(e) => handleBatchPriceChange(batch._id, 'ecommercePriceOverride', e.target.value)}
                                placeholder="Inherit"
                                sx={{ width: 120 }}
                                InputProps={{
                                  sx: { borderRadius: '6px', fontSize: '0.85rem' }
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}

            {/* Note for eCommerce fields */}
            <Box sx={{ mt: 3, p: 1.5, bgcolor: '#f0f7ff', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '0.8rem', color: '#1d4ed8' }}>
                💡 SEO metadata, product features, highlights, and specifications can be managed from the <strong>Ecommerce Products</strong> page using the edit button.
              </Typography>
            </Box>

            {/* Product Images Section */}
            <Box sx={{ mt: 4, mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, fontSize: '1.1rem', mb: 1.5 }}>
                Product Images
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                Manage product images. Upload new images or remove existing ones.
              </Typography>
              
              {/* Existing Images Display */}
              {existingImages.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>
                    Existing Images:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {existingImages.map((url, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          position: 'relative', 
                          width: { xs: 90, sm: 120 }, 
                          height: { xs: 90, sm: 120 },
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}
                      >
                        <img
                          src={url}
                          alt={`Existing ${index}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveExistingImage(index)}
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 1)'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              
              {/* Upload New Images */}
              <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragging ? 'primary.main' : '#ccc',
                  borderRadius: '8px',
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  bgcolor: isDragging ? 'primary.50' : '#fafafa',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: '#f0f7ff',
                    borderColor: 'primary.main'
                  }
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 32, color: isDragging ? 'primary.main' : 'text.secondary' }} />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                    Click or drag and drop images here
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Max 5 images per product (JPG, PNG, WEBP)
                  </Typography>
                </Box>
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  ref={fileInputRef}
                />
              </Box>
              
              {/* New Image Previews */}
              {imagePreviewUrls.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
                  {imagePreviewUrls.map((url, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        position: 'relative', 
                        width: { xs: 90, sm: 120 }, 
                        height: { xs: 90, sm: 120 },
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}
                    >
                      <img
                        src={url}
                        alt={`Preview ${index}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveImage(index)}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 1)'
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
            

          </form>
        </Grid>
      {/* Product Colors Modal */}
      <Dialog open={colorModalOpen} onClose={() => setColorModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
          🎨 Product Colors (পণ্য কালার অপশন)
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            পণ্যটির কোনো কালার অপশন থাকলে সিলেক্ট করুন অথবা নতুন কালার যুক্ত করুন।
          </Typography>

          {/* Quick Presets */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B', display: 'block', mb: 1 }}>
              Quick Select Presets:
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {PRESET_COLORS.map((preset) => {
                const isSelected = productColors.some(c => c.name.toLowerCase() === preset.name.toLowerCase());
                return (
                  <Chip
                    key={preset.name}
                    onClick={() => handleTogglePresetColor(preset)}
                    avatar={
                      <Box sx={{ 
                        width: 14, 
                        height: 14, 
                        borderRadius: '50%', 
                        bgcolor: preset.code, 
                        border: preset.code === '#FFFFFF' ? '1px solid #CBD5E1' : 'none',
                        ml: 0.5
                      }} />
                    }
                    label={preset.name}
                    variant={isSelected ? "filled" : "outlined"}
                    sx={{
                      borderRadius: '20px',
                      fontWeight: isSelected ? 700 : 500,
                      borderColor: isSelected ? '#6366F1' : '#CBD5E1',
                      bgcolor: isSelected ? '#EEF2FF' : 'white',
                      color: isSelected ? '#4F46E5' : '#475569',
                      '&:hover': { bgcolor: isSelected ? '#E0E7FF' : '#F1F5F9' }
                    }}
                  />
                );
              })}
            </Stack>
          </Box>

          {/* Custom Color Input */}
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', mb: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B', display: 'block', mb: 1 }}>
              Add Custom Color:
            </Typography>
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. Navy Blue or Cyan, Lime"
                  value={customColorName}
                  onChange={(e) => setCustomColorName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomColor();
                    }
                  }}
                  sx={{ 
                    bgcolor: 'white', 
                    '& .MuiOutlinedInput-root': { 
                      borderRadius: '8px',
                      '& fieldset': { borderColor: '#CBD5E1' } 
                    } 
                  }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  bgcolor: 'white', 
                  px: 1.5, 
                  py: 0.6, 
                  borderRadius: '8px', 
                  border: '1px solid #CBD5E1',
                  height: '40px'
                }}>
                  <input
                    type="color"
                    value={customColorCode}
                    onChange={(e) => setCustomColorCode(e.target.value)}
                    style={{ 
                      width: 24, 
                      height: 24, 
                      border: 'none', 
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: 0,
                      backgroundColor: 'transparent'
                    }}
                  />
                  <TextField
                    variant="standard"
                    size="small"
                    value={customColorCode}
                    onChange={(e) => setCustomColorCode(e.target.value)}
                    InputProps={{ disableUnderline: true, style: { fontSize: '12px', fontFamily: 'monospace', fontWeight: 600 } }}
                    sx={{ width: 75 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Button
                  type="button"
                  fullWidth
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddCustomColor}
                  sx={{ 
                    height: '40px',
                    borderRadius: '8px', 
                    textTransform: 'none', 
                    fontWeight: 700,
                    backgroundColor: '#6366F1',
                    '&:hover': { backgroundColor: '#4F46E5' } 
                  }}
                >
                  Add
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Currently Selected */}
          {productColors.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B', display: 'block', mb: 1 }}>
                Selected Colors ({productColors.length}):
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {productColors.map((col, idx) => (
                  <Chip
                    key={idx}
                    onDelete={() => handleRemoveColor(idx)}
                    avatar={
                      <Box sx={{ 
                        width: 14, 
                        height: 14, 
                        borderRadius: '50%', 
                        bgcolor: col.code, 
                        border: col.code === '#FFFFFF' ? '1px solid #94A3B8' : 'none',
                        ml: 0.5
                      }} />
                    }
                    label={`${col.name}`}
                    sx={{
                      borderRadius: '16px',
                      fontWeight: 600,
                      bgcolor: '#F1F5F9',
                      color: '#1E293B',
                      border: '1px solid #CBD5E1'
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button 
            onClick={() => setColorModalOpen(false)} 
            variant="outlined" 
            sx={{ 
              borderRadius: '8px', 
              px: 2.5,
              borderColor: '#CBD5E1',
              color: '#64748B',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                borderColor: '#94A3B8',
                backgroundColor: '#F8FAFC'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => setColorModalOpen(false)} 
            variant="contained" 
            sx={{ 
              borderRadius: '8px', 
              px: 3,
              fontWeight: 700,
              textTransform: 'none'
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
      </Grid>
    </Box>
  );
};

export default EditProduct;