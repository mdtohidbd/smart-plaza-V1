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
  Alert
} from '@mui/material';
import {
  AddPhotoAlternate as AddPhotoIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import api from '../../utils/api';

const ProductImages = ({ productId }) => {
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/api/products/${productId}`);
      const productData = response.data.data;
      setProduct(productData);
      
      // Combine primary image and additional images
      const allImages = [];
      if (productData.image) {
        allImages.push({ url: productData.image, isPrimary: true });
      }
      if (productData.images && productData.images.length > 0) {
        productData.images.forEach(img => {
          if (img !== productData.image) {
            allImages.push({ url: img, isPrimary: false });
          }
        });
      }
      setImages(allImages);
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const availableSlots = Math.max(0, 5 - images.length);
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
    if (selectedImages.length === 0) return;

    const formData = new FormData();
    selectedImages.forEach((file, index) => {
      formData.append('images', file);
    });

    try {
      await api.post(`/api/products/${productId}/images`, formData, {
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
      fetchProduct(); // Refresh the product data
    } catch (error) {
      console.error('Error uploading images:', error);
      setSnackbar({
        open: true,
        message: 'Error uploading images',
        severity: 'error'
      });
    }
  };

  const handleDeleteImage = async (imageUrl) => {
    try {
      await api.delete(`/api/products/${productId}/images`, {
        data: { imageUrl }
      });

      setSnackbar({
        open: true,
        message: 'Image deleted successfully',
        severity: 'success'
      });

      fetchProduct(); // Refresh the product data
    } catch (error) {
      console.error('Error deleting image:', error);
      setSnackbar({
        open: true,
        message: 'Error deleting image',
        severity: 'error'
      });
    }
  };

  const handleSetPrimaryImage = async (imageUrl) => {
    try {
      await api.put(`/api/products/${productId}/primary-image`, { imageUrl });

      setSnackbar({
        open: true,
        message: 'Primary image updated successfully',
        severity: 'success'
      });

      fetchProduct(); // Refresh the product data
    } catch (error) {
      console.error('Error setting primary image:', error);
      setSnackbar({
        open: true,
        message: 'Error setting primary image',
        severity: 'error'
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            Product Images - {product?.name || 'Loading...'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddPhotoIcon />}
            onClick={() => setOpenUploadDialog(true)}
          >
            Add Images
          </Button>
        </Box>

        <Grid container spacing={1.5}>
          {images.map((image, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={image.url}
                  alt={`Product image ${index + 1}`}
                  sx={{ objectFit: 'contain', padding: 1 }}
                />
                <CardContent>
                  <Typography variant="body2" noWrap>
                    {image.url.split('/').pop()}
                  </Typography>
                  {image.isPrimary && (
                    <Chip 
                      label="Primary" 
                      color="primary" 
                      size="small" 
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
                <CardActions>
                  {!image.isPrimary && (
                    <IconButton 
                      onClick={() => handleSetPrimaryImage(image.url)}
                      color={image.isPrimary ? "warning" : "default"}
                      title="Set as Primary"
                    >
                      {image.isPrimary ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                  )}
                  <IconButton 
                    onClick={() => handleDeleteImage(image.url)}
                    color="error"
                    title="Delete Image"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {images.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="textSecondary">
              No images uploaded for this product
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddPhotoIcon />}
              onClick={() => setOpenUploadDialog(true)}
              sx={{ mt: 2 }}
            >
              Add Images
            </Button>
          </Box>
        )}
      </Box>

      {/* Upload Dialog */}
      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#F8FAFC', color: '#1e293b', fontWeight: 600, fontSize: '1.2rem', p: 2, borderBottom: '1px solid #eaeef3' }}>Upload Product Images</DialogTitle>
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
          <Button onClick={() => setOpenUploadDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpload} 
            variant="contained" 
            disabled={selectedImages.length === 0}
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
    </Container>
  );
};

export default ProductImages;