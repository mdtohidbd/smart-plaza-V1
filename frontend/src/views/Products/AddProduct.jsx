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
  Card,
  CardContent,
  CardHeader,
  Divider,
  InputAdornment,
  Stack,
  IconButton,
  Switch,
  FormControlLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  useTheme,
  useMediaQuery,
  Autocomplete
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

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
    const saved = localStorage.getItem('smartplaza_custom_colors');
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

const AddProduct = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Basic Details State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    unit: '',
    category: '',
    brand: '',
    supplier: '',
    description: '',
    costPrice: '',
    price: '',
    wholesalePrice: '',
    minimumPrice: '',
    sellingPrice: '',
    mrp: '',
    model: '',
    alertQuantity: '',
    purchasePrice: '',
    additionalInfo: '',
    metaTitle: '',
    metaDescription: ''
  });
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
        localStorage.setItem('smartplaza_custom_colors', JSON.stringify(customOnly));
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
  
  // Specifications states
  const [specifications, setSpecifications] = useState([]);
  const [activeBulkCategoryIndex, setActiveBulkCategoryIndex] = useState(null);
  const [bulkText, setBulkText] = useState('');
  
  // Features states
  const [features, setFeatures] = useState([]);
  
  // Highlights states
  const [highlights, setHighlights] = useState([]);
  const [newHighlight, setNewHighlight] = useState('');

  // Modals for adding items inline
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);

  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const [newUnit, setNewUnit] = useState({ name: '', symbol: '', description: '' });
  const [newCategory, setNewCategory] = useState({ name: '', description: '', icon: 'Computer', parent: '' });
  const [newSupplier, setNewSupplier] = useState({ name: '', contactNumber: '', contactName: '', email: '', openingBalance: '', address: '', note: '' });
  const [newBrand, setNewBrand] = useState({ name: '', logo: '', description: '', website: '', country: '', isActive: true, displayOrder: 0 });
  
  // Image upload state
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  
  // Highlight Images state
  const [selectedHighlightImages, setSelectedHighlightImages] = useState([]);
  const [highlightImagePreviewUrls, setHighlightImagePreviewUrls] = useState([]);

  // Image compression helper function
  const compressImage = (file) => {
    return new Promise((resolve) => {
      // If it's not an image file, resolve with original file
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 1024px for web optimized images
          const maxDimension = 1024;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(file); // Fallback to original file
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.7); // 70% quality compression
        };
      };
      reader.onerror = () => resolve(file);
    });
  };

  // Fetch suppliers with caching (stale for 5 mins)
  const { data: suppliers } = useQuery('suppliers', async () => {
    const response = await api.get('/api/suppliers');
    return response.data.data;
  }, {
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  });

  // Fetch brands with caching
  const { data: brands } = useQuery('brands', async () => {
    const response = await api.get('/api/brands?limit=1000');
    return response.data;
  }, {
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  });

  // Fetch categories with caching
  const { data: categories } = useQuery('categories', async () => {
    const response = await api.get('/api/categories');
    return response.data.data;
  }, {
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  });

  // Fetch units with caching
  const { data: units } = useQuery('units', async () => {
    const response = await api.get('/api/units');
    return response.data.data;
  }, {
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  });

  const suppliersList = Array.isArray(suppliers) ? suppliers : (suppliers?.data || []);
  const brandsList = Array.isArray(brands) ? brands : (brands?.data || []);
  const categoriesList = Array.isArray(categories) ? categories : (categories?.data || []);
  const unitsList = Array.isArray(units) ? units : (units?.data || []);

  // Mutation for creating product
  const createProductMutation = useMutation(
    (productData) => api.post('/api/products', productData),
    {
      onSuccess: (response) => {
        const productId = response.data.data._id;
        
        const uploadToImgBB = async (file) => {
          try {
            // Compress the image before uploading
            const compressedFile = await compressImage(file);
            const formData = new FormData();
            formData.append('image', compressedFile);
            
            const response = await fetch('https://api.imgbb.com/1/upload?key=a0d1c7f2693c806b61ca26899e0a1a29', {
              method: 'POST',
              body: formData
            });
            const result = await response.json();
            return result.success ? result.data.url : null;
          } catch (error) {
            console.error('ImgBB upload error:', error);
            return null;
          }
        };

        const processUploads = async () => {
          const updateData = {};
          const uploadPromises = [];
          
          // 1. Queue main images
          const mainImageIndices = [];
          if (selectedImages.length > 0) {
            selectedImages.forEach((file) => {
              mainImageIndices.push(uploadPromises.length);
              uploadPromises.push(uploadToImgBB(file));
            });
          }
          
          // 2. Queue feature images
          const updatedFeatures = [...features];
          const featureIndices = [];
          updatedFeatures.forEach((feat, index) => {
            if (feat.file) {
              featureIndices.push({
                featIndex: index,
                promiseIndex: uploadPromises.length
              });
              uploadPromises.push(uploadToImgBB(feat.file));
            }
          });
          
          // 3. Queue highlight images
          const highlightIndices = [];
          if (selectedHighlightImages.length > 0) {
            selectedHighlightImages.forEach((file) => {
              highlightIndices.push(uploadPromises.length);
              uploadPromises.push(uploadToImgBB(file));
            });
          }
          
          // Wait for all uploads to complete concurrently
          const uploadResults = await Promise.all(uploadPromises);
          
          // 1. Process main images
          if (mainImageIndices.length > 0) {
            const imageUrls = mainImageIndices
              .map(idx => uploadResults[idx])
              .filter(Boolean);
            if (imageUrls.length > 0) {
              updateData.image = imageUrls[0];
              updateData.images = imageUrls;
            }
          }
          
          // 2. Process feature images
          let featuresChanged = false;
          featureIndices.forEach(({ featIndex, promiseIndex }) => {
            const url = uploadResults[promiseIndex];
            if (url) {
              updatedFeatures[featIndex].image = url;
              delete updatedFeatures[featIndex].file;
              delete updatedFeatures[featIndex].preview;
              featuresChanged = true;
            }
          });
          if (featuresChanged) updateData.features = updatedFeatures;
          
          // 3. Process highlight images
          if (highlightIndices.length > 0) {
            const highlightUrls = highlightIndices
              .map(idx => uploadResults[idx])
              .filter(Boolean);
            if (highlightUrls.length > 0) {
              updateData.highlightImages = highlightUrls;
            }
          }
          
          // Update product if there are any new image URLs
          if (Object.keys(updateData).length > 0) {
            try {
              await api.put(`/api/products/${productId}`, updateData);
            } catch (error) {
              console.error('Error updating product with images:', error);
            }
          }
          
          queryClient.invalidateQueries('products');
          queryClient.invalidateQueries('retailInventoryProducts');
          queryClient.invalidateQueries('inventory');
          queryClient.invalidateQueries('currentBatches');
          alert('Product created successfully!');
          navigate('/products');
        };
        
        processUploads();
        
        // Reset everything
        setFormData({
          name: '',
          supplier: '',
          brand: '',
          sku: '',
          category: '',
          unit: '',
          alertQuantity: '',
          additionalInfo: '',
          metaTitle: '',
          metaDescription: '',
          purchasePrice: '',
          sellingPrice: '',
          mrp: '',
          model: ''
        });
        setSpecifications([]);
        setFeatures([]);
        setHighlights([]);
        setSelectedImages([]);
        setImagePreviewUrls([]);
        setSelectedHighlightImages([]);
        setHighlightImagePreviewUrls([]);
      },
      onError: (error) => {
        console.error('Error creating product:', error);
        alert('Error creating product: ' + (error.response?.data?.message || error.message));
      }
    }
  );

  // Inline creation handlers
  const handleOpenUnitModal = () => {
    setNewUnit({ name: '', symbol: '', description: '' });
    setModalError('');
    setUnitModalOpen(true);
  };

  const handleOpenCategoryModal = () => {
    setNewCategory({ name: '', description: '', icon: 'Computer', parent: '' });
    setModalError('');
    setCategoryModalOpen(true);
  };

  const handleOpenSupplierModal = () => {
    setNewSupplier({ name: '', contactNumber: '', contactName: '', email: '', openingBalance: '', address: '', note: '' });
    setModalError('');
    setSupplierModalOpen(true);
  };

  const handleOpenBrandModal = () => {
    setNewBrand({ name: '', logo: '', description: '', website: '', country: '', isActive: true, displayOrder: 0 });
    setModalError('');
    setBrandModalOpen(true);
  };

  const handleCreateUnitInline = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const response = await api.post('/api/units', newUnit);
      const created = response.data.data;
      await queryClient.invalidateQueries('units');
      setFormData(prev => ({ ...prev, unit: created._id }));
      setUnitModalOpen(false);
    } catch (err) {
      let msg = err.response?.data?.message || err.message || 'Error creating unit';
      if (msg.includes('Duplicate') || msg.includes('E11000') || msg.includes('already exists')) {
        msg = `Unit "${newUnit.name}" already exists! Please select it directly from the Unit search box.`;
      }
      setModalError(msg);
    }
  };

  const handleCreateCategoryInline = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const response = await api.post('/api/categories', {
        name: newCategory.name,
        description: newCategory.description || '',
        icon: newCategory.icon || 'Computer',
        parent: newCategory.parent || undefined
      });
      const created = response.data.data;
      await queryClient.invalidateQueries('categories');
      setFormData(prev => ({ ...prev, category: created._id }));
      setCategoryModalOpen(false);
    } catch (err) {
      let msg = err.response?.data?.message || err.message || 'Error creating category';
      if (msg.includes('Duplicate') || msg.includes('E11000') || msg.includes('already exists')) {
        msg = `Category "${newCategory.name}" already exists! Please select it directly from the Category search box.`;
      }
      setModalError(msg);
    }
  };

  const handleCreateSupplierInline = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const response = await api.post('/api/suppliers', newSupplier);
      const created = response.data.data;
      await queryClient.invalidateQueries('suppliers');
      setFormData(prev => ({ ...prev, supplier: created._id }));
      setSupplierModalOpen(false);
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Error creating supplier');
    }
  };

  const handleCreateBrandInline = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const response = await api.post('/api/brands', newBrand);
      const created = response.data.data;
      await queryClient.invalidateQueries('brands');
      setFormData(prev => ({ ...prev, brand: created._id }));
      setBrandModalOpen(false);
    } catch (err) {
      let msg = err.response?.data?.message || err.message || 'Error creating brand';
      if (msg.includes('Duplicate') || msg.includes('E11000') || msg.includes('already exists')) {
        msg = `Brand "${newBrand.name}" already exists! Please select it directly from the Brand search box.`;
      }
      setModalError(msg);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Specifications State Handlers
  const handleAddCategory = () => {
    setSpecifications([...specifications, { category: '', items: [] }]);
  };

  const handleRemoveCategory = (catIndex) => {
    const updated = [...specifications];
    updated.splice(catIndex, 1);
    setSpecifications(updated);
  };

  const handleCategoryNameChange = (catIndex, val) => {
    const updated = [...specifications];
    updated[catIndex].category = val;
    setSpecifications(updated);
  };

  const handleAddItem = (catIndex) => {
    const updated = [...specifications];
    updated[catIndex].items.push({ label: '', value: '' });
    setSpecifications(updated);
  };

  const handleRemoveItem = (catIndex, itemIndex) => {
    const updated = [...specifications];
    updated[catIndex].items.splice(itemIndex, 1);
    setSpecifications(updated);
  };

  const handleItemFieldChange = (catIndex, itemIndex, field, val) => {
    const updated = [...specifications];
    updated[catIndex].items[itemIndex][field] = val;
    setSpecifications(updated);
  };

  const handleProcessBulkPaste = (catIndex) => {
    if (!bulkText.trim()) return;
    
    const lines = bulkText.split('\n');
    const newItems = [];
    
    lines.forEach(line => {
      let parts = [];
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes(':')) {
        parts = line.split(':');
      } else if (line.includes(' - ')) {
        parts = line.split(' - ');
      } else if (line.includes(' – ')) {
        parts = line.split(' – ');
      } else {
        const spaceSplit = line.split(/\s{2,}/);
        if (spaceSplit.length >= 2) {
          parts = spaceSplit;
        }
      }
      
      if (parts.length >= 2) {
        const label = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        if (label && value) {
          newItems.push({ label, value });
        }
      }
    });

    const updated = [...specifications];
    updated[catIndex].items = [...updated[catIndex].items, ...newItems];
    setSpecifications(updated);
    setBulkText('');
    setActiveBulkCategoryIndex(null);
  };

  // Features Handlers
  const handleAddFeature = () => {
    setFeatures([...features, { title: '', description: '', image: '', layout: 'left', file: null, preview: '' }]);
  };

  const handleRemoveFeature = (index) => {
    const updated = [...features];
    updated.splice(index, 1);
    setFeatures(updated);
  };

  const handleFeatureChange = (index, field, value) => {
    const updated = [...features];
    updated[index][field] = value;
    setFeatures(updated);
  };

  const handleFeatureImageSelect = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = [...features];
        updated[index].file = file;
        updated[index].preview = reader.result;
        setFeatures(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  // Highlights Handlers
  const handleAddHighlight = () => {
    if (newHighlight.trim()) {
      setHighlights([...highlights, newHighlight.trim()]);
      setNewHighlight('');
    }
  };

  const handleRemoveHighlight = (index) => {
    const updated = [...highlights];
    updated.splice(index, 1);
    setHighlights(updated);
  };

  const handleHighlightImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedHighlightImages([...selectedHighlightImages, ...files]);
    
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setHighlightImagePreviewUrls([...highlightImagePreviewUrls, ...newPreviewUrls]);
  };

  const handleRemoveHighlightImage = (index) => {
    const updatedFiles = [...selectedHighlightImages];
    updatedFiles.splice(index, 1);
    setSelectedHighlightImages(updatedFiles);

    const updatedPreviews = [...highlightImagePreviewUrls];
    updatedPreviews.splice(index, 1);
    setHighlightImagePreviewUrls(updatedPreviews);
  };



  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFilesOrUrls = useCallback((items) => {
    if (items.length === 0) return;
    
    setSelectedImages(prevSelected => {
      const currentTotal = prevSelected.length;
      const newTotal = currentTotal + items.length;
      let allowedItems = items;
      
      if (newTotal > 5) {
        alert(`You can only upload up to 5 images per product. You can add ${5 - currentTotal} more.`);
        allowedItems = items.slice(0, 5 - currentTotal);
      }
      
      if (allowedItems.length === 0) return prevSelected;

      const newUrls = allowedItems.map(item => typeof item === 'string' ? item : URL.createObjectURL(item));
      
      setImagePreviewUrls(prevUrls => [...prevUrls, ...newUrls]);
      return [...prevSelected, ...allowedItems];
    });
  }, []);

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

  // Remove an image
  const handleRemoveImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newUrls = imagePreviewUrls.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviewUrls(newUrls);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Filter out features that have no title and description
    const validFeatures = features.filter(f => f.title.trim() || f.description.trim());
    
    const colorString = productColors.map(c => c.name).join(', ');
    const colorsPayload = productColors.map(c => ({ name: c.name, code: c.code }));

    const productData = {
      ...formData,
      color: colorString,
      colors: colorsPayload,
      trackSerials: true,
      isListedOnEcommerce,
      specifications,
      features: validFeatures,
      highlights
    };
    if (!productData.supplier) {
      productData.supplier = null;
    }
    createProductMutation.mutate(productData);
  };

  return (
    <Box sx={{ 
      py: { xs: 1, sm: 2 },
      backgroundColor: '#FFFFFF', // Dark background matching wholesale
      minHeight: '100vh',
      color: '#1E293B'
    }}>
      <Grid container spacing={1.5} sx={{ px: { xs: 1, sm: 2 } }}>
        <Grid item xs={12}>
          <Card elevation={0}
            sx={{
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
            }}>
            <Box sx={{
              px: 3,
              py: 2,
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <IconButton 
                onClick={() => navigate(-1)} 
                sx={{ 
                  bgcolor: '#F1F5F9', 
                  '&:hover': { bgcolor: '#E2E8F0' },
                  borderRadius: '8px',
                  p: 0.75,
                }}
              >
                <ArrowBackIcon sx={{ color: '#475569', fontSize: '1.1rem' }} />
              </IconButton>
              <Box>
                <Typography sx={{ color: '#1E293B', fontWeight: 700, fontSize: '1rem', fontFamily: '"Outfit", sans-serif', lineHeight: 1.2 }}>
                  Product Information
                </Typography>
                <Typography sx={{ color: '#94A3B8', fontSize: '0.8rem', fontFamily: '"Outfit", sans-serif', mt: 0.25 }}>
                  Fill in the product details below
                </Typography>
              </Box>
            </Box>
            <CardContent sx={{ p: 2 }}>
              <form onSubmit={handleSubmit}>
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
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: '#F8FAFC',
                          color: '#1E293B',
                          '& fieldset': { borderColor: '#E2E8F0' },
                          '&:hover fieldset': { borderColor: '#E2E8F0' },
                          '&.Mui-focused fieldset': { borderColor: '#6366F1' },
                        },
                        '& .MuiInputLabel-root': { color: '#94A3B8' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#6366F1' }
                      }}
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
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: '#F8FAFC',
                          color: '#1E293B',
                          '& fieldset': { borderColor: '#E2E8F0' },
                          '&:hover fieldset': { borderColor: '#E2E8F0' },
                          '&.Mui-focused fieldset': { borderColor: '#6366F1' },
                        },
                        '& .MuiInputLabel-root': { color: '#94A3B8' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#6366F1' }
                      }}
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
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: '#F8FAFC',
                          color: '#1E293B',
                          '& fieldset': { borderColor: '#E2E8F0' },
                          '&:hover fieldset': { borderColor: '#E2E8F0' },
                          '&.Mui-focused fieldset': { borderColor: '#6366F1' },
                        },
                        '& .MuiInputLabel-root': { color: '#94A3B8' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#6366F1' }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ color: '#94A3B8' }}>Product Colors (Optional)</InputLabel>
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
                          sx={{ 
                            borderRadius: '8px',
                            backgroundColor: '#F8FAFC',
                            color: '#1E293B',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366F1' },
                          }}
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
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Autocomplete
                        fullWidth
                        size="small"
                        options={unitsList}
                        getOptionLabel={(option) => typeof option === 'string' ? option : `${option.name || ''}${option.symbol ? ` (${option.symbol})` : ''}`}
                        value={unitsList.find(u => u._id === formData.unit) || null}
                        onChange={(event, newValue) => {
                          setFormData({
                            ...formData,
                            unit: newValue ? newValue._id : ''
                          });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Unit *"
                            required={!formData.unit}
                            InputLabelProps={{ sx: { color: '#94A3B8' } }}
                          />
                        )}
                        sx={{
                          flexGrow: 1,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: '#F8FAFC',
                            color: '#1E293B',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366F1' },
                          }
                        }}
                      />
                      <IconButton
                        onClick={handleOpenUnitModal}
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
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Autocomplete
                        fullWidth
                        size="small"
                        options={categoriesList}
                        getOptionLabel={(option) => typeof option === 'string' ? option : option.name || ''}
                        value={categoriesList.find(c => c._id === formData.category) || null}
                        onChange={(event, newValue) => {
                          setFormData({
                            ...formData,
                            category: newValue ? newValue._id : ''
                          });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Category *"
                            required={!formData.category}
                            InputLabelProps={{ sx: { color: '#94A3B8' } }}
                          />
                        )}
                        sx={{
                          flexGrow: 1,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: '#F8FAFC',
                            color: '#1E293B',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366F1' },
                          }
                        }}
                      />
                      <IconButton
                        onClick={handleOpenCategoryModal}
                        sx={{ 
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          backgroundColor: '#F8FAFC',
                          p: '8px',
                          color: '#1D5F99',
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
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Autocomplete
                        fullWidth
                        size="small"
                        options={suppliersList}
                        getOptionLabel={(option) => typeof option === 'string' ? option : `${option.name || ''}${option.companyName ? ` (${option.companyName})` : ''}`}
                        value={suppliersList.find(s => s._id === formData.supplier) || null}
                        onChange={(event, newValue) => {
                          setFormData({
                            ...formData,
                            supplier: newValue ? newValue._id : ''
                          });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Supplier (Optional)"
                            InputLabelProps={{ sx: { color: '#94A3B8' } }}
                          />
                        )}
                        sx={{
                          flexGrow: 1,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: '#F8FAFC',
                            color: '#1E293B',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366F1' },
                          }
                        }}
                      />
                      <IconButton
                        onClick={handleOpenSupplierModal}
                        sx={{ 
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          backgroundColor: '#F8FAFC',
                          p: '8px',
                          color: '#1D5F99',
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
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Autocomplete
                        fullWidth
                        size="small"
                        options={brandsList}
                        getOptionLabel={(option) => typeof option === 'string' ? option : option.name || ''}
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
                            InputLabelProps={{ sx: { color: '#94A3B8' } }}
                          />
                        )}
                        sx={{
                          flexGrow: 1,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: '#F8FAFC',
                            color: '#1E293B',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366F1' },
                          }
                        }}
                      />
                      <IconButton
                        onClick={handleOpenBrandModal}
                        sx={{ 
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          backgroundColor: '#F8FAFC',
                          p: '8px',
                          color: '#1D5F99',
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
                    <TextField
                      fullWidth
                      size="small"
                      label="Alert Quantity"
                      type="number"
                      name="alertQuantity"
                      value={formData.alertQuantity}
                      onChange={handleInputChange}
                      InputProps={{
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Default Purchase Price"
                      type="number"
                      name="purchasePrice"
                      value={formData.purchasePrice}
                      onChange={handleInputChange}
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
                      label="Default Selling Price"
                      type="number"
                      name="sellingPrice"
                      value={formData.sellingPrice}
                      onChange={handleInputChange}
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
                      label="MRP (Maximum Retail Price) *"
                      type="number"
                      name="mrp"
                      value={formData.mrp}
                      onChange={handleInputChange}
                      required
                      helperText="Used as base MRP in Quotations & Invoices"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isListedOnEcommerce}
                          onChange={(e) => setIsListedOnEcommerce(e.target.checked)}
                          color="success"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>Ecommerce</Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>List on online store</Typography>
                        </Box>
                      }
                    />
                  </Grid>



                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Additional Information"
                      name="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={handleInputChange}
                      multiline
                      rows={2}
                      InputProps={{
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                </Grid>

                {/* SEO Metadata Card */}
                <Card sx={{ mt: 3, p: 1, borderRadius: '12px', border: '1px solid #eaeef3', boxShadow: 'none' }}>
                  <CardHeader 
                    title="SEO Metadata" 
                    subheader="Optimize search engines visibility for this product (optional)"
                    titleTypographyProps={{ variant: 'subtitle1', fontWeight: '600', color: '#1e293b', fontFamily: '"Outfit", sans-serif' }}
                    subheaderTypographyProps={{ variant: 'caption', color: '#64748b', fontFamily: '"Outfit", sans-serif' }}
                    sx={{ pb: 1 }}
                  />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Meta Title"
                          name="metaTitle"
                          value={formData.metaTitle || ''}
                          onChange={handleInputChange}
                          placeholder="e.g. Samsung Galaxy S24 Ultra"
                          helperText={`${(formData.metaTitle || '').length}/70 characters`}
                          InputProps={{ sx: { borderRadius: '8px' } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Meta Description"
                          name="metaDescription"
                          value={formData.metaDescription || ''}
                          onChange={handleInputChange}
                          multiline
                          rows={2}
                          placeholder="e.g. Buy Samsung Galaxy S24 Ultra..."
                          helperText={`${(formData.metaDescription || '').length}/160 characters`}
                          InputProps={{ sx: { borderRadius: '8px' } }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Structured Specifications Section */}
                <Card sx={{ mt: 3, p: 1, borderRadius: '12px', border: '1px solid #eaeef3', boxShadow: 'none' }}>
                  <Box sx={{
                    p: { xs: 2, sm: 3 },
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', sm: 'center' },
                    gap: 2
                  }}>
                    <Box>
                      <Typography sx={{ fontWeight: '600', color: '#1e293b', fontFamily: '"Outfit", sans-serif', fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                        Product Specifications
                      </Typography>
                      <Typography sx={{ color: '#64748b', fontSize: '0.8rem', fontFamily: '"Outfit", sans-serif', mt: 0.5 }}>
                        Define structured specifications like Processors, Cameras, Memory, etc. Supports manual items or quick copy-paste bulk importer!
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleAddCategory}
                      sx={{ 
                        borderRadius: '8px', 
                        textTransform: 'none',
                        alignSelf: { xs: 'stretch', sm: 'center' },
                        py: { xs: 1, sm: 1.2 },
                        px: 2,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Add Category Group
                    </Button>
                  </Box>
                  <Divider />
                  <CardContent>
                    {specifications.length === 0 ? (
                      <Box sx={{ py: 3, textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                          No specifications added yet. Add a category group to start.
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleAddCategory}
                          sx={{ borderRadius: '8px', textTransform: 'none', backgroundColor: '#1D5F99' }}
                        >
                          Add First Category
                        </Button>
                      </Box>
                    ) : (
                      <Stack spacing={3}>
                        {specifications.map((cat, catIndex) => (
                          <Paper 
                            key={catIndex} 
                            variant="outlined" 
                            sx={{ p: 2, borderRadius: '8px', backgroundColor: '#fcfcfc', border: '1px solid #eaeef3' }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <TextField
                                label="Specification Category Group Title"
                                placeholder="e.g. Memory, Camera, General"
                                value={cat.category}
                                onChange={(e) => handleCategoryNameChange(catIndex, e.target.value)}
                                sx={{ width: '60%', '& .MuiInputBase-root': { height: 45 } }}
                                size="small"
                                required
                              />
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  variant="outlined"
                                  color="secondary"
                                  size="small"
                                  onClick={() => {
                                    setActiveBulkCategoryIndex(activeBulkCategoryIndex === catIndex ? null : catIndex);
                                    setBulkText('');
                                  }}
                                  sx={{ borderRadius: '6px', textTransform: 'none' }}
                                >
                                  {activeBulkCategoryIndex === catIndex ? 'Cancel Bulk Paste' : 'Bulk Paste Specs'}
                                </Button>
                                <IconButton 
                                  color="error" 
                                  onClick={() => handleRemoveCategory(catIndex)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </Box>

                            {/* Bulk Paste Area */}
                            {activeBulkCategoryIndex === catIndex && (
                              <Box sx={{ my: 2, p: 2, backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#334155', mb: 1 }}>
                                  Bulk Copy-Paste Spec Importer
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
                                  Paste raw multiline key-values. Supported formats: "RAM: 8GB", "Storage - 256GB", or tabular clipboard data. We'll parse it instantly!
                                </Typography>
                                <TextField
                                  fullWidth
                                  multiline
                                  rows={4}
                                  placeholder={`Brand: HP\nProcessor: Intel Core i7\nRAM: 16 GB\nOS: Windows 11`}
                                  value={bulkText}
                                  onChange={(e) => setBulkText(e.target.value)}
                                  sx={{ backgroundColor: '#fff', mb: 1.5 }}
                                />
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => handleProcessBulkPaste(catIndex)}
                                    sx={{ borderRadius: '6px', textTransform: 'none', backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}
                                  >
                                    Process & Add Specs
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                      setActiveBulkCategoryIndex(null);
                                      setBulkText('');
                                    }}
                                    sx={{ borderRadius: '6px', textTransform: 'none' }}
                                  >
                                    Close
                                  </Button>
                                </Box>
                              </Box>
                            )}

                            {/* Specification Key Value Items */}
                            {cat.items && cat.items.length > 0 && (
                              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                                {cat.items.map((item, itemIndex) => (
                                  <Grid container spacing={1.5} key={itemIndex} alignItems="center" sx={{ borderBottom: { xs: '1px dashed #e2e8f0', sm: 'none' }, pb: { xs: 1.5, sm: 0 } }}>
                                    <Grid item xs={12} sm={5}>
                                      <TextField
                                        fullWidth
                                        label="Label (Key)"
                                        placeholder="e.g. RAM, Battery, Brand"
                                        value={item.label}
                                        onChange={(e) => handleItemFieldChange(catIndex, itemIndex, 'label', e.target.value)}
                                        size="small"
                                        required
                                      />
                                    </Grid>
                                    <Grid item xs={10} sm={6}>
                                      <TextField
                                        fullWidth
                                        label="Value"
                                        placeholder="e.g. 8 GB, 5000 mAh, Intel Core i5"
                                        value={item.value}
                                        onChange={(e) => handleItemFieldChange(catIndex, itemIndex, 'value', e.target.value)}
                                        size="small"
                                        required
                                      />
                                    </Grid>
                                    <Grid item xs={2} sm={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                                      <IconButton 
                                        color="error" 
                                        size="medium"
                                        onClick={() => handleRemoveItem(catIndex, itemIndex)}
                                        sx={{ bgcolor: '#FEE2E2', '&:hover': { bgcolor: '#FECACA' } }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Grid>
                                  </Grid>
                                ))}
                              </Stack>
                            )}

                            <Button
                              variant="text"
                              startIcon={<AddIcon />}
                              onClick={() => handleAddItem(catIndex)}
                              sx={{ mt: 2, textTransform: 'none' }}
                            >
                              Add Row
                            </Button>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>

                {/* Product Features Section (Banners with Text) */}
                <Card sx={{ mt: 3, p: 1, borderRadius: '16px', border: '2px solid #6366F1', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.1)' }}>
                  <Box sx={{
                    p: { xs: 2, sm: 3 },
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', sm: 'center' },
                    gap: 2
                  }}>
                    <Box>
                      <Typography sx={{ fontWeight: '700', color: '#1e293b', fontSize: { xs: '1.1rem', sm: '1.25rem' }, fontFamily: '"Outfit", sans-serif' }}>
                        Product Features (Banners with Text)
                      </Typography>
                      <Typography sx={{ color: '#64748b', fontSize: '0.8rem', mt: 0.5, fontFamily: '"Outfit", sans-serif' }}>
                        এখানে প্রতিটি কার্ডের জন্য আলাদা বড় ব্যানার ইমেজ এবং লেখা আপলোড করুন। এটি আপনার প্রোডাক্ট পেজের মাঝখানে সুন্দরভাবে দেখাবে।
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddFeature}
                      sx={{ 
                        borderRadius: '8px', 
                        textTransform: 'none', 
                        bgcolor: '#6366F1',
                        '&:hover': { bgcolor: '#4f46e5' },
                        py: { xs: 1, sm: 1.5 },
                        px: 3,
                        whiteSpace: 'nowrap',
                        alignSelf: { xs: 'stretch', sm: 'center' }
                      }}
                    >
                      নতুন ফিচার যোগ করুন
                    </Button>
                  </Box>
                  <Divider />
                  <CardContent>
                    {features.length === 0 ? (
                      <Box sx={{ py: 5, textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '2px dashed #CBD5E1' }}>
                        <Typography variant="body1" sx={{ color: '#64748b', mb: 2 }}>
                          এখনও কোনো ফিচার যোগ করা হয়নি। উপরের বাটনে ক্লিক করে শুরু করুন।
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={3}>
                        {features.map((feature, index) => (
                          <Paper 
                            key={index} 
                            elevation={0}
                            sx={{ p: 3, borderRadius: '12px', backgroundColor: '#fff', border: '1px solid #E2E8F0', position: 'relative' }}
                          >
                            <IconButton 
                              onClick={() => handleRemoveFeature(index)}
                              sx={{ position: 'absolute', top: 10, right: 10, color: '#EF4444', bgcolor: '#FEE2E2', '&:hover': { bgcolor: '#FECACA' } }}
                            >
                              <DeleteIcon />
                            </IconButton>
                            
                            <Grid container spacing={3}>
                              <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>ফিচার ব্যানার ইমেজ</Typography>
                                <Box sx={{ textAlign: 'center' }}>
                                  {feature.preview ? (
                                    <Box sx={{ position: 'relative', width: '100%', pt: '75%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                                      <img src={feature.preview} alt="Feature" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                      <Button
                                        size="small"
                                        variant="contained"
                                        component="label"
                                        sx={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', bgcolor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}
                                      >
                                        পরিবর্তন করুন
                                        <input type="file" hidden accept="image/*" onChange={(e) => handleFeatureImageSelect(index, e)} />
                                      </Button>
                                    </Box>
                                  ) : (
                                    <Button
                                      variant="outlined"
                                      component="label"
                                      fullWidth
                                      sx={{ height: 180, borderStyle: 'dashed', borderRadius: '12px', flexDirection: 'column', gap: 1 }}
                                    >
                                      <CloudUploadIcon sx={{ fontSize: 40, color: '#6366F1' }} />
                                      <Typography variant="caption">ইমেজ আপলোড করুন</Typography>
                                      <input type="file" hidden accept="image/*" onChange={(e) => handleFeatureImageSelect(index, e)} />
                                    </Button>
                                  )}
                                </Box>
                              </Grid>
                              <Grid item xs={12} md={8}>
                                <Stack spacing={2}>
                                  <TextField
                                    fullWidth
                                    label="ফিচার টাইটেল (যেমন: PCM INNER LINER)"
                                    value={feature.title}
                                    onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
                                    variant="outlined"
                                    required
                                  />
                                  <TextField
                                    fullWidth
                                    label="ফিচার ডেসক্রিপশন"
                                    value={feature.description}
                                    onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                                    multiline
                                    rows={4}
                                    variant="outlined"
                                    required
                                  />
                                  <FormControl fullWidth>
                                    <InputLabel>লেআউট পজিশন</InputLabel>
                                    <Select
                                      value={feature.layout}
                                      label="লেআউট পজিশন"
                                      onChange={(e) => handleFeatureChange(index, 'layout', e.target.value)}
                                    >
                                      <MenuItem value="left">লেখা বামে, ইমেজ ডানে</MenuItem>
                                      <MenuItem value="right">লেখা ডানে, ইমেজ বামে</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Stack>
                              </Grid>
                            </Grid>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>

                {/* Highlights Section */}
                <Card sx={{ mt: 3, p: 1, borderRadius: '12px', border: '1px solid #eaeef3', boxShadow: 'none' }}>
                  <CardHeader 
                    title="Product Highlights (Dark Section)" 
                    subheader="Add highlight points and 4-5 images for the premium dark background section."
                    titleTypographyProps={{ variant: 'subtitle1', fontWeight: '600', color: '#1e293b', fontFamily: '"Outfit", sans-serif' }}
                    subheaderTypographyProps={{ variant: 'caption', color: '#64748b', fontFamily: '"Outfit", sans-serif' }}
                    sx={{ pb: 1 }}
                  />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Highlight Points</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Add a highlight point..."
                            value={newHighlight}
                            onChange={(e) => setNewHighlight(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHighlight())}
                          />
                          <Button variant="contained" onClick={handleAddHighlight} sx={{ bgcolor: '#1D5F99' }}>Add</Button>
                        </Box>
                        <Stack spacing={1}>
                          {highlights.map((h, i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, bgcolor: '#f8fafc', borderRadius: '6px' }}>
                              <Typography variant="body2">{h}</Typography>
                              <IconButton size="small" color="error" onClick={() => handleRemoveHighlight(i)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        </Stack>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Highlight Images (4-5 recommended)</Typography>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<CloudUploadIcon />}
                          fullWidth
                          sx={{ mb: 2, borderStyle: 'dashed' }}
                        >
                          Select Highlight Images
                          <input type="file" hidden multiple accept="image/*" onChange={handleHighlightImageSelect} />
                        </Button>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {highlightImagePreviewUrls.map((url, i) => (
                            <Box key={i} sx={{ position: 'relative', width: 80, height: 80 }}>
                              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => handleRemoveHighlightImage(i)}
                                sx={{ position: 'absolute', top: -5, right: -5, bgcolor: 'white', p: 0.2 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Product Images Section */}
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, fontSize: '1.1rem', mb: 1.5 }}>
                    Product Images
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                    Drag & Drop, Paste images/URLs, or click to browse. Max 5 images.
                  </Typography>
                  
                  <Box
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      mb: 2,
                      p: 3,
                      border: '2px dashed',
                      borderColor: isDragging ? '#6366F1' : '#CBD5E1',
                      borderRadius: '12px',
                      backgroundColor: isDragging ? '#EEF2FF' : '#F8FAFC',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#6366F1',
                        backgroundColor: '#F1F5F9'
                      }
                    }}
                  >
                    <CloudUploadIcon sx={{ fontSize: 40, color: isDragging ? '#6366F1' : '#94A3B8', mb: 1 }} />
                    <Typography sx={{ color: '#475569', fontWeight: 500 }}>
                      Click or drag and drop images here
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      Supports JPEG, PNG, WEBP. You can also paste images directly!
                    </Typography>
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </Box>
                  
                  {imagePreviewUrls.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
                      {imagePreviewUrls.map((url, index) => (
                        <Box 
                          key={index} 
                          sx={{ 
                            position: 'relative', 
                            width: 120, 
                            height: 120,
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



                <Divider sx={{ my: 3 }} />
                
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={1.5} 
                  justifyContent="flex-end"
                  sx={{ mt: 2 }}
                >
                  <Button 
                    variant="outlined" 
                    size="large" 
                    type="button"
                    onClick={() => setFormData({
                      name: '',
                      company: '',
                      sku: '',
                      category: '',
                      unit: '',
                      alertQuantity: 10,
                      purchasePrice: 0,
                      sellingPrice: 0,
                      mrp: 0,
                      taxPercentage: 0,
                      additionalInfo: ''
                    })}
                    sx={{ 
                      px: 4,
                      py: 1,
                      borderRadius: '8px',
                      borderColor: '#1D5F99',
                      color: '#1D5F99',
                      '&:hover': {
                        backgroundColor: '#1D5F99',
                        color: 'white',
                        borderColor: '#1D5F99'
                      }
                    }}
                  >
                    Reset Form
                  </Button>
                  <Button 
                    variant="contained" 
                    size="large" 
                    type="submit"
                    disabled={createProductMutation.isLoading}
                    sx={{ 
                      px: 4,
                      py: 1,
                      borderRadius: '8px',
                      backgroundColor: '#1D5F99',
                      '&:hover': {
                        backgroundColor: '#42A2C2'
                      }
                    }}
                  >
                    {createProductMutation.isLoading ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Creating Product...
                      </>
                    ) : 'Create Product'}
                  </Button>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Unit Modal */}
      <Dialog open={unitModalOpen} onClose={() => setUnitModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add New Unit</DialogTitle>
        <form onSubmit={handleCreateUnitInline}>
          <DialogContent dividers>
            {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Unit Name"
                  required
                  value={newUnit.name}
                  onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Symbol"
                  required
                  value={newUnit.symbol}
                  onChange={(e) => setNewUnit({ ...newUnit, symbol: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Description"
                  multiline
                  rows={2}
                  value={newUnit.description}
                  onChange={(e) => setNewUnit({ ...newUnit, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUnitModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add New Category</DialogTitle>
        <form onSubmit={handleCreateCategoryInline}>
          <DialogContent dividers>
            {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Category Name"
                  required
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Description"
                  multiline
                  rows={2}
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Parent Category</InputLabel>
                  <Select
                    value={newCategory.parent}
                    onChange={(e) => setNewCategory({ ...newCategory, parent: e.target.value })}
                    label="Parent Category"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {Array.isArray(categories) && categories.map((cat) => (
                      <MenuItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCategoryModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Supplier Modal */}
      <Dialog open={supplierModalOpen} onClose={() => setSupplierModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Supplier</DialogTitle>
        <form onSubmit={handleCreateSupplierInline}>
          <DialogContent dividers>
            {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Supplier Name"
                  required
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Contact Number"
                  value={newSupplier.contactNumber}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contactNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Contact Person Name"
                  value={newSupplier.contactName}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contactName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email"
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Opening Balance"
                  type="number"
                  value={newSupplier.openingBalance}
                  onChange={(e) => setNewSupplier({ ...newSupplier, openingBalance: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Address"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Note"
                  multiline
                  rows={2}
                  value={newSupplier.note}
                  onChange={(e) => setNewSupplier({ ...newSupplier, note: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSupplierModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Brand Modal */}
      <Dialog open={brandModalOpen} onClose={() => setBrandModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add New Brand</DialogTitle>
        <form onSubmit={handleCreateBrandInline}>
          <DialogContent dividers>
            {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Brand Name"
                  required
                  value={newBrand.name}
                  onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Country"
                  value={newBrand.country}
                  onChange={(e) => setNewBrand({ ...newBrand, country: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Website"
                  value={newBrand.website}
                  onChange={(e) => setNewBrand({ ...newBrand, website: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Description"
                  multiline
                  rows={2}
                  value={newBrand.description}
                  onChange={(e) => setNewBrand({ ...newBrand, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBrandModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>

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
    </Box>
  );
};

export default AddProduct;