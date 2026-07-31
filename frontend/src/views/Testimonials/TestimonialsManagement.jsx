import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Avatar,
  Rating,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tab,
  Tabs,
  Alert,
  Snackbar,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  CloudUpload as UploadIcon,
  Star as StarIcon
} from '@mui/icons-material';
import api from '../../utils/api';

const TestimonialsManagement = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Form state
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
    imageUrl: '',
    status: 'pending'
  });
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Fetch testimonials
  const { data: testimonialsData, isLoading } = useQuery(
    ['testimonials', activeTab],
    () => api.get(`/api/testimonials/admin?status=${activeTab === 1 ? 'approved' : activeTab === 2 ? 'pending' : ''}&limit=50`).then(res => res.data),
    {
      refetchOnWindowFocus: false
    }
  );

  // Fetch stats
  const { data: statsData } = useQuery(
    'testimonialStats',
    () => api.get('/api/testimonials/admin/stats').then(res => res.data),
    {
      refetchOnWindowFocus: false
    }
  );

  // Mutation for creating/updating
  const createMutation = useMutation(
    (data) => api.post('/api/testimonials/admin', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('testimonials');
        queryClient.invalidateQueries('testimonialStats');
        setOpenDialog(false);
        setSnackbar({ open: true, message: 'Testimonial created successfully!', severity: 'success' });
        resetForm();
      },
      onError: (error) => {
        setSnackbar({ 
          open: true, 
          message: error.response?.data?.message || 'Failed to create testimonial', 
          severity: 'error' 
        });
      }
    }
  );

  // Mutation for updating status
  const updateStatusMutation = useMutation(
    ({ id, status }) => api.put(`/api/testimonials/admin/${id}/status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('testimonials');
        queryClient.invalidateQueries('testimonialStats');
        setSnackbar({ open: true, message: 'Status updated successfully!', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ 
          open: true, 
          message: error.response?.data?.message || 'Failed to update status', 
          severity: 'error' 
        });
      }
    }
  );

  // Mutation for deleting
  const deleteMutation = useMutation(
    (id) => api.delete(`/api/testimonials/admin/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('testimonials');
        queryClient.invalidateQueries('testimonialStats');
        setSnackbar({ open: true, message: 'Testimonial deleted successfully!', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({ 
          open: true, 
          message: error.response?.data?.message || 'Failed to delete testimonial', 
          severity: 'error' 
        });
      }
    }
  );

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let imageUrl = formData.imageUrl;
    
    // Upload image if a new file is selected
    if (selectedImage) {
      const uploadedUrl = await uploadImageToImgBB(selectedImage);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        return; // Stop if upload failed
      }
    }
    
    const testimonialData = {
      ...formData,
      imageUrl: imageUrl
    };
    
    createMutation.mutate(testimonialData);
  };

  // Reset form
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
      imageUrl: '',
      status: 'pending'
    });
    setSelectedImage(null);
    setImagePreviewUrl('');
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSnackbar({ open: true, message: 'Please select a valid image file', severity: 'error' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({ open: true, message: 'Image size should be less than 5MB', severity: 'error' });
      return;
    }

    setSelectedImage(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
    setSnackbar({ open: true, message: 'Image selected! It will be uploaded when you submit.', severity: 'success' });
  };
  
  // Upload image to ImgBB
  const uploadImageToImgBB = async (file) => {
    setIsUploadingImage(true);
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    
    try {
      const response = await fetch('https://api.imgbb.com/1/upload?key=a0d1c7f2693c806b61ca26899e0a1a29', {
        method: 'POST',
        body: formDataUpload
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('[TESTIMONIAL IMAGE] Uploaded to ImgBB:', result.data.url);
        return result.data.url;
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('[TESTIMONIAL IMAGE] Upload error:', error);
      setSnackbar({ open: true, message: 'Failed to upload image. Please try again.', severity: 'error' });
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl('');
    setFormData({ ...formData, imageUrl: '' });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const testimonials = testimonialsData?.data || [];
  const stats = statsData?.data || {};

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Testimonials Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ bgcolor: '#1D5F99', '&:hover': { bgcolor: '#1a5285' }, height: { xs: 45, sm: 'auto' } }}
        >
          Add Testimonial
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: '#E3F2FD', height: '100%', borderRadius: '10px' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Typography color="textSecondary" sx={{ fontSize: '0.85rem' }} gutterBottom>Total</Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{stats.total || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: '#E8F5E9', height: '100%', borderRadius: '10px' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Typography color="textSecondary" sx={{ fontSize: '0.85rem' }} gutterBottom>Approved</Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{stats.approved || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: '#FFF3E0', height: '100%', borderRadius: '10px' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Typography color="textSecondary" sx={{ fontSize: '0.85rem' }} gutterBottom>Pending</Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{stats.pending || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: '#FFEBEE', height: '100%', borderRadius: '10px' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Typography color="textSecondary" sx={{ fontSize: '0.85rem' }} gutterBottom>Avg Rating</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{stats.averageRating || '0'}</Typography>
                <StarIcon sx={{ color: '#FFC107', fontSize: { xs: 20, sm: 24 } }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3, overflowX: 'auto' }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All" />
          <Tab label={`Approved (${stats.approved || 0})`} />
          <Tab label={`Pending (${stats.pending || 0})`} />
          <Tab label={`Rejected (${stats.rejected || 0})`} />
        </Tabs>
      </Paper>

      {/* Loading */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Testimonials Table */}
      {!isLoading && testimonials.length === 0 && (
        <Alert severity="info">No testimonials found</Alert>
      )}

      {!isLoading && testimonials.length > 0 && (
        <>
          {/* Desktop Table View */}
          <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Company/Product</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {testimonials.map((testimonial) => (
                  <TableRow key={testimonial._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {testimonial.imageUrl && (
                          <Avatar src={testimonial.imageUrl} alt={testimonial.name} />
                        )}
                        <Box>
                          <Typography variant="body2" fontWeight="bold">{testimonial.name}</Typography>
                          <Typography variant="caption" color="textSecondary">{testimonial.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Rating value={testimonial.rating} readOnly size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {testimonial.message}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{testimonial.company || '-'}</Typography>
                      <Typography variant="caption" color="textSecondary">{testimonial.product || ''}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={testimonial.status.toUpperCase()} 
                        color={getStatusColor(testimonial.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(testimonial.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => { setSelectedTestimonial(testimonial); setViewDialog(true); }}>
                        <ViewIcon />
                      </IconButton>
                      {testimonial.status === 'pending' && (
                        <>
                          <IconButton size="small" color="success" onClick={() => updateStatusMutation.mutate({ id: testimonial._id, status: 'approved' })}>
                            <ApproveIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => updateStatusMutation.mutate({ id: testimonial._id, status: 'rejected' })}>
                            <RejectIcon />
                          </IconButton>
                        </>
                      )}
                      <IconButton size="small" color="error" onClick={() => {
                        if (window.confirm('Are you sure you want to delete this testimonial?')) {
                          deleteMutation.mutate(testimonial._id);
                        }
                      }}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Card List View */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
            {testimonials.map((testimonial) => (
              <Paper key={testimonial._id} elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '12px', bgcolor: '#FFFFFF' }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                  <Avatar src={testimonial.imageUrl} alt={testimonial.name} sx={{ width: 45, height: 45 }} />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ color: '#1E293B' }}>
                      {testimonial.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" noWrap sx={{ display: 'block' }}>
                      {testimonial.email}
                    </Typography>
                  </Box>
                  <Chip 
                    label={testimonial.status.toUpperCase()} 
                    color={getStatusColor(testimonial.status)}
                    size="small"
                    sx={{ fontSize: '0.65rem', fontWeight: 700 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Rating value={testimonial.rating} readOnly size="small" />
                  <Typography variant="caption" color="textSecondary">
                    ({testimonial.rating} stars)
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ color: '#475569', mb: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  "{testimonial.message}"
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: '#F8FAFC', borderRadius: '6px', mb: 1.5 }}>
                  <Box sx={{ minWidth: 0, flex: 1, mr: 1 }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>COMPANY / PRODUCT</Typography>
                    <Typography variant="body2" fontWeight="medium" sx={{ color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {testimonial.company || '-'} {testimonial.product ? `/ ${testimonial.product}` : ''}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(testimonial.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: '1px solid #F1F5F9', pt: 1 }}>
                  <IconButton size="small" onClick={() => { setSelectedTestimonial(testimonial); setViewDialog(true); }}>
                    <ViewIcon fontSize="small" />
                  </IconButton>
                  {testimonial.status === 'pending' && (
                    <>
                      <IconButton size="small" color="success" onClick={() => updateStatusMutation.mutate({ id: testimonial._id, status: 'approved' })}>
                        <ApproveIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => updateStatusMutation.mutate({ id: testimonial._id, status: 'rejected' })}>
                        <RejectIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                  <IconButton size="small" color="error" onClick={() => {
                    if (window.confirm('Are you sure you want to delete this testimonial?')) {
                      deleteMutation.mutate(testimonial._id);
                    }
                  }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            ))}
          </Box>
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Create Testimonial</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email *" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Rating *</InputLabel>
                  <Select value={formData.rating} label="Rating *" onChange={(e) => setFormData({ ...formData, rating: e.target.value })}>
                    {[5, 4, 3, 2, 1].map((num) => (
                      <MenuItem key={num} value={num}>{num} Star{num > 1 ? 's' : ''}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Message *" multiline rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Designation" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Product" value={formData.product} onChange={(e) => setFormData({ ...formData, product: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Profile Image</Typography>
                
                {/* Image Preview */}
                {imagePreviewUrl && (
                  <Box sx={{ mb: 2, position: 'relative', display: 'inline-block' }}>
                    <Box
                      component="img"
                      src={imagePreviewUrl}
                      alt="Image Preview"
                      sx={{ 
                        width: 120, 
                        height: 120, 
                        objectFit: 'cover', 
                        borderRadius: 2,
                        border: '1px solid #e2e8f0'
                      }}
                    />
                    <IconButton
                      onClick={handleRemoveImage}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: '#ef4444',
                        color: 'white',
                        '&:hover': { backgroundColor: '#dc2626' }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                
                {/* Upload Button */}
                <Button 
                  variant="outlined" 
                  component="label" 
                  startIcon={isUploadingImage ? <CircularProgress size={20} /> : <UploadIcon />}
                  disabled={isUploadingImage}
                  sx={{
                    mt: 1,
                    borderColor: '#6366F1',
                    color: '#6366F1',
                    '&:hover': {
                      borderColor: '#4F46E5',
                      backgroundColor: 'rgba(99, 102, 241, 0.04)'
                    }
                  }}
                >
                  {imagePreviewUrl ? 'Change Image' : 'Upload Image'}
                  <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                </Button>
                
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#94A3B8' }}>
                  Supported formats: JPG, PNG, GIF (Max 5MB)
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? <CircularProgress size={24} /> : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        {selectedTestimonial && (
          <>
            <DialogTitle>Testimonial Details</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                {selectedTestimonial.imageUrl && (
                  <Avatar src={selectedTestimonial.imageUrl} sx={{ width: 80, height: 80 }} />
                )}
                <Box>
                  <Typography variant="h6">{selectedTestimonial.name}</Typography>
                  <Typography variant="body2" color="textSecondary">{selectedTestimonial.email}</Typography>
                  <Rating value={selectedTestimonial.rating} readOnly sx={{ mt: 1 }} />
                </Box>
              </Box>
              <Typography variant="body1" paragraph>{selectedTestimonial.message}</Typography>
              <Grid container spacing={2}>
                {selectedTestimonial.designation && <Grid item xs={6}><Typography variant="body2" color="textSecondary">Designation: {selectedTestimonial.designation}</Typography></Grid>}
                {selectedTestimonial.company && <Grid item xs={6}><Typography variant="body2" color="textSecondary">Company: {selectedTestimonial.company}</Typography></Grid>}
                {selectedTestimonial.location && <Grid item xs={6}><Typography variant="body2" color="textSecondary">Location: {selectedTestimonial.location}</Typography></Grid>}
                {selectedTestimonial.product && <Grid item xs={6}><Typography variant="body2" color="textSecondary">Product: {selectedTestimonial.product}</Typography></Grid>}
              </Grid>
              <Chip label={selectedTestimonial.status.toUpperCase()} color={getStatusColor(selectedTestimonial.status)} sx={{ mt: 2 }} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialog(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} message={snackbar.message} />
    </Box>
  );
};

export default TestimonialsManagement;
