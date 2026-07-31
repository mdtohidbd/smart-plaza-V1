import React, { useState, useEffect } from 'react';
import { useMutation } from 'react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Rating,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  IconButton,
  Autocomplete
} from '@mui/material';
import { Star as StarIcon, Send as SendIcon, CloudUpload as UploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../utils/api';

const SubmitTestimonial = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rating: 5,
    message: '',
    designation: '',
    company: '',
    location: '',
    product: '',
    productRef: '',
    purchasedDate: ''
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (open) {
      api.get('/api/public/products?limit=200')
        .then(res => {
          if (res.data.success) {
            setProducts(res.data.data);
          }
        })
        .catch(err => console.error('Error fetching products:', err));
    }
  }, [open]);

  const mutation = useMutation(
    async (data) => {
      // If there's an image, upload it to ImgBB first
      let imageUrl = null;
      if (selectedImage) {
        setUploading(true);
        
        try {
          const formData = new FormData();
          formData.append('image', selectedImage);
          
          // Upload directly to ImgBB (same as other components)
          const response = await fetch('https://api.imgbb.com/1/upload?key=a0d1c7f2693c806b61ca26899e0a1a29', {
            method: 'POST',
            body: formData
          });
          
          const result = await response.json();
          if (result.success) {
            console.log('[TESTIMONIAL IMAGE] Uploaded to ImgBB:', result.data.url);
            imageUrl = result.data.url;
          } else {
            throw new Error('Failed to upload image to ImgBB');
          }
        } catch (error) {
          console.error('[TESTIMONIAL IMAGE] Upload error:', error);
          throw new Error('Failed to upload image. Please try again.');
        } finally {
          setUploading(false);
        }
      }

      // Submit testimonial with image URL
      return api.post('/api/testimonials', { ...data, image: imageUrl });
    },
    {
      onSuccess: () => {
        setSnackbar({ open: true, message: 'Thank you! Your testimonial will be reviewed shortly.', severity: 'success' });
        resetForm();
        if (onClose) onClose();
      },
      onError: (error) => {
        setSnackbar({ 
          open: true, 
          message: error.response?.data?.message || error.message || 'Failed to submit testimonial', 
          severity: 'error' 
        });
        setUploading(false);
      }
    }
  );

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      rating: 5,
      message: '',
      designation: '',
      company: '',
      location: '',
      product: '',
      productRef: '',
      purchasedDate: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSnackbar({ open: true, message: 'Please select an image file', severity: 'error' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({ open: true, message: 'Image size should be less than 5MB', severity: 'error' });
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ bgcolor: '#1D5F99', color: 'white' }}>
            Share Your Experience
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <StarIcon sx={{ fontSize: 48, color: '#FFC107', mb: 1 }} />
              <Typography variant="h6">We value your feedback!</Typography>
              <Typography variant="body2" color="textSecondary">
                Help us serve you better by sharing your experience
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Your Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address *"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>Your Rating *</Typography>
                  <Rating
                    value={formData.rating}
                    onChange={(e, newValue) => setFormData({ ...formData, rating: newValue })}
                    size="large"
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#94A3B8', mb: 1 }}>
                    Your Photo (Optional)
                  </Typography>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="testimonial-image-upload"
                    type="file"
                    onChange={handleImageChange}
                  />
                  <label htmlFor="testimonial-image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadIcon />}
                      disabled={uploading}
                      sx={{
                        borderColor: '#E2E8F0',
                        color: '#1E293B',
                        '&:hover': {
                          borderColor: '#6366F1',
                          backgroundColor: 'rgba(99, 102, 241, 0.05)'
                        },
                        textTransform: 'none'
                      }}
                    >
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </Button>
                  </label>
                  <Typography variant="caption" sx={{ color: '#64748B', ml: 2 }}>
                    Max 5MB • JPG, PNG, GIF
                  </Typography>
                </Box>

                {/* Image Preview */}
                {imagePreview && (
                  <Box sx={{ 
                    position: 'relative', 
                    display: 'inline-block',
                    mt: 2,
                    border: '2px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    <Avatar
                      src={imagePreview}
                      alt="Preview"
                      sx={{ 
                        width: 120, 
                        height: 120,
                        borderRadius: '10px'
                      }}
                    />
                    <IconButton
                      onClick={removeImage}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: '#fff',
                        '&:hover': {
                          backgroundColor: 'rgba(239, 68, 68, 0.8)'
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Your Message *"
                  multiline
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your experience with Smart Plaza BD..."
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Designation/Title"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company/Organization"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Khulna, Dhaka, etc."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={products}
                  getOptionLabel={(option) => option.name || ''}
                  onChange={(e, newValue) => {
                    setFormData({ 
                      ...formData, 
                      productRef: newValue ? newValue._id : '',
                      product: newValue ? newValue.name : ''
                    });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Which product did you buy?" placeholder="Search product..." fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Purchase"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.purchasedDate}
                  onChange={(e) => setFormData({ ...formData, purchasedDate: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={onClose} color="inherit">Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              endIcon={mutation.isLoading || uploading ? <CircularProgress size={20} /> : <SendIcon />}
              disabled={mutation.isLoading || uploading}
              sx={{ bgcolor: '#1D5F99', '&:hover': { bgcolor: '#1a5285' } }}
            >
              {uploading ? 'Uploading Image...' : mutation.isLoading ? 'Submitting...' : 'Submit Testimonial'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SubmitTestimonial;
