import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Chip,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  AddPhotoAlternate as AddPhotoIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const ProductImagesManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!selectedProduct) {
      setSelectedImages(files);
      return;
    }
    const currentTotal = selectedProduct.images?.length > 0 ? selectedProduct.images.length : (selectedProduct.image ? 1 : 0);
    const availableSlots = Math.max(0, 5 - currentTotal);
    
    if (files.length > availableSlots) {
      setSnackbar({
        open: true,
        message: `You can only upload up to ${availableSlots} more images. (Max 5 total)`,
        severity: 'error'
      });
      setSelectedImages(files.slice(0, availableSlots));
    } else {
      setSelectedImages(files);
    }
  };

  const handleUpload = async () => {
    if (!selectedProduct || selectedImages.length === 0) return;

    const formData = new FormData();
    selectedImages.forEach((file, index) => {
      formData.append('images', file);
    });

    try {
      await api.post(`/api/products/${selectedProduct._id}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSnackbar({
        open: true,
        message: `${selectedImages.length} image(s) uploaded successfully`,
        severity: 'success'
      });

      setOpenUploadDialog(false);
      setSelectedImages([]);
      fetchProducts(); // Refresh the product data
    } catch (error) {
      console.error('Error uploading images:', error);
      setSnackbar({
        open: true,
        message: 'Error uploading images',
        severity: 'error'
      });
    }
  };

  const handleDeleteImage = async (productId, imageUrl) => {
    try {
      await api.delete(`/api/products/${productId}/images`, {
        data: { imageUrl }
      });

      setSnackbar({
        open: true,
        message: 'Image deleted successfully',
        severity: 'success'
      });

      fetchProducts(); // Refresh the product data
    } catch (error) {
      console.error('Error deleting image:', error);
      setSnackbar({
        open: true,
        message: 'Error deleting image',
        severity: 'error'
      });
    }
  };

  const handleSetPrimaryImage = async (productId, imageUrl) => {
    try {
      await api.put(`/api/products/${productId}/primary-image`, { imageUrl });

      setSnackbar({
        open: true,
        message: 'Primary image updated successfully',
        severity: 'success'
      });

      fetchProducts(); // Refresh the product data
    } catch (error) {
      console.error('Error setting primary image:', error);
      setSnackbar({
        open: true,
        message: 'Error setting primary image',
        severity: 'error'
      });
    }
  };

  const handleViewImages = (product) => {
    navigate(`/products/images/${product._id}`);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Typography>Loading products...</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ py: { xs: 1.5, sm: 3 }, px: { xs: 1.5, sm: 0 }, backgroundColor: '#F8FAFC' }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ mb: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontFamily: '"Outfit", sans-serif' }}>
              Product Images Management
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              Total: {products.length} Products
            </Typography>
          </Box>
          
          {isMobile ? (
            <Grid container spacing={2}>
              {products.map((product) => {
                const totalImages = product.images?.length > 0 ? product.images.length : (product.image ? 1 : 0);
                return (
                  <Grid item xs={12} key={product._id}>
                    <Card
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                        '&:hover': {
                          borderColor: '#6366F1',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {product.image ? (
                          <Box
                            component="img"
                            src={product.image}
                            alt={product.name}
                            sx={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid #F1F5F9'
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 80,
                              height: 80,
                              backgroundColor: '#F8FAFC',
                              borderRadius: '8px',
                              border: '1px dashed #CBD5E1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#94A3B8'
                            }}
                          >
                            No Image
                          </Box>
                        )}
                        
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.5, lineHeight: 1.3 }}>
                            {product.name}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: '#94A3B8', mb: 0.5 }}>
                            Model: {product.model || 'N/A'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip 
                              label={`Category: ${product.category?.name || 'N/A'}`} 
                              size="small" 
                              sx={{ bgcolor: '#F1F5F9', color: '#475569', fontSize: '11px', height: '22px' }} 
                            />
                            <Chip 
                              label={`Supplier: ${product.supplier?.name || 'N/A'}`} 
                              size="small" 
                              sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontSize: '11px', height: '22px' }} 
                            />
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box sx={{
                        mt: 2,
                        pt: 1.5,
                        borderTop: '1px dashed #E2E8F0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip 
                            label={product.image ? 'Primary Image Set' : 'No Primary Image'} 
                            color={product.image ? 'success' : 'default'} 
                            size="small" 
                            sx={{ fontWeight: 600, fontSize: '11px', height: '22px' }}
                          />
                          <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                            {totalImages}/5 Images
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Manage Images">
                            <IconButton 
                              onClick={() => handleViewImages(product)} 
                              sx={{ 
                                color: '#6366F1', 
                                bgcolor: '#EEF2FF',
                                '&:hover': { bgcolor: '#E0E7FF' },
                                borderRadius: '8px'
                              }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Upload Images">
                            <IconButton
                              onClick={() => {
                                setSelectedProduct(product);
                                setOpenUploadDialog(true);
                              }}
                              sx={{ 
                                color: '#10B981', 
                                bgcolor: '#ECFDF5',
                                '&:hover': { bgcolor: '#D1FAE5' },
                                borderRadius: '8px'
                              }}
                            >
                              <AddPhotoIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #eaeef3', boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontFamily: '"Outfit", sans-serif' }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontFamily: '"Outfit", sans-serif' }}>Supplier</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontFamily: '"Outfit", sans-serif' }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontFamily: '"Outfit", sans-serif' }}>Primary Image</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontFamily: '"Outfit", sans-serif' }}>Images Count</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', fontFamily: '"Outfit", sans-serif' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => {
                    const totalImages = product.images?.length > 0 ? product.images.length : (product.image ? 1 : 0);
                    return (
                      <TableRow key={product._id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {product.image ? (
                              <Box
                                component="img"
                                src={product.image}
                                alt={product.name}
                                sx={{ width: 50, height: 50, objectFit: 'cover', mr: 2, borderRadius: 1 }}
                              />
                            ) : (
                              <Box sx={{ width: 50, height: 50, bgcolor: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 1, mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '10px' }}>
                                No Image
                              </Box>
                            )}
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1E293B' }}>{product.name}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                Model: {product.model || 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{product.supplier?.name || 'N/A'}</TableCell>
                        <TableCell>{product.category?.name || 'N/A'}</TableCell>
                        <TableCell>
                          {product.image ? (
                            <Chip label="Has Image" color="success" size="small" sx={{ fontWeight: 600 }} />
                          ) : (
                            <Chip label="No Image" color="default" size="small" sx={{ fontWeight: 600 }} />
                          )}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{totalImages}/5</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Manage Images">
                            <IconButton onClick={() => handleViewImages(product)} color="primary">
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Upload Images">
                            <IconButton
                              onClick={() => {
                                setSelectedProduct(product);
                                setOpenUploadDialog(true);
                              }}
                              color="success"
                            >
                              <AddPhotoIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <Dialog
        open={openUploadDialog}
        onClose={() => {
          setOpenUploadDialog(false);
          setSelectedProduct(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#F8FAFC', color: '#1e293b', fontWeight: 600, fontSize: '1.2rem', p: 2, borderBottom: '1px solid #eaeef3' }}>
          Upload Images for {selectedProduct?.name || ''}
        </DialogTitle>
        <DialogContent>
          <input
            accept="image/*"
            multiple
            type="file"
            id="image-upload"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <label htmlFor="image-upload">
            <Button variant="outlined" component="span" fullWidth sx={{ mt: 2, py: 4 }}>
              <AddPhotoIcon sx={{ mr: 1 }} />
              Select Images (Multiple)
            </Button>
          </label>

          {selectedImages.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">{selectedImages.length} image(s) selected</Typography>
              <Grid container spacing={1} sx={{ mt: 1 }}>
                {selectedImages.map((file, index) => (
                  <Grid item xs={4} key={index}>
                    <Box
                      component="img"
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      sx={{ height: '80px', objectFit: 'cover', borderRadius: 1 }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eaeef3', bgcolor: '#F8FAFC' }}>
          <Button
            onClick={() => {
              setOpenUploadDialog(false);
              setSelectedProduct(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedProduct || selectedImages.length === 0}
          >
            Upload Images
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}

        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductImagesManagement;