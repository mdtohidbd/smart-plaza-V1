import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Tooltip,
  CircularProgress,
  LinearProgress,
  Chip,
  Grid,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import api from '../../utils/api';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const fileInputRef = useRef(null);

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const handleToastClose = () => {
    setToastOpen(false);
  };
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    images: [],
    link: '/shop/products',
    isActive: true,
    displayOrder: 0,
    position: 'main'
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/banners');
      if (res.data.success) {
        setBanners(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      showToast('Failed to fetch banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const resetUploadState = () => {
    setUploadedImageUrls([]);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpen = (banner = null) => {
    resetUploadState();
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title || '',
        image: banner.image || '',
        images: banner.images || [],
        link: banner.link || '/shop/products',
        isActive: banner.isActive,
        displayOrder: banner.displayOrder || 0,
        position: banner.position || 'main'
      });
      // If editing, show existing images as uploaded
      const existingImages = [];
      if (banner.image) existingImages.push(banner.image);
      if (banner.images && banner.images.length > 0) {
        banner.images.forEach(img => {
          if (!existingImages.includes(img)) existingImages.push(img);
        });
      }
      setUploadedImageUrls(existingImages);
    } else {
      setEditingBanner(null);
      setFormData({
        title: '',
        image: '',
        images: [],
        link: '/shop/products',
        isActive: true,
        displayOrder: 0,
        position: 'main'
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingBanner(null);
    resetUploadState();
  };

  // Handle file selection and auto-upload
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Only images are allowed', 'warning');
      return;
    }

    // Validate file sizes (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Max 10MB per file', 'warning');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('images', file); // API expects 'images'

      const res = await api.post('/api/banners/upload-images', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      if (res.data.success) {
        const newUrls = res.data.data;
        setUploadedImageUrls(newUrls); // Replaces existing image (only 1 allowed)

        // Update form data
        setFormData(fd => ({
          ...fd,
          image: newUrls[0],
          images: newUrls
        }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast(error.response?.data?.message || 'Failed to upload image', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that at least one image is uploaded
    if (!formData.image && uploadedImageUrls.length === 0) {
      showToast('Please upload at least one image', 'error');
      return;
    }

    // Ensure image field is set
    const submitData = {
      ...formData,
      image: formData.image || uploadedImageUrls[0],
      images: uploadedImageUrls
    };

    try {
      if (editingBanner) {
        await api.put(`/api/banners/${editingBanner._id}`, submitData);
        showToast('Banner updated successfully', 'success');
      } else {
        await api.post('/api/banners', submitData);
        showToast('Banner created successfully', 'success');
      }
      handleClose();
      fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      showToast(error.response?.data?.message || 'Failed to save banner', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        await api.delete(`/api/banners/${id}`);
        showToast('Banner deleted successfully', 'success');
        fetchBanners();
      } catch (error) {
        console.error('Error deleting banner:', error);
        showToast('Failed to delete banner', 'error');
      }
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      await api.put(`/api/banners/${banner._id}`, { isActive: !banner.isActive });
      fetchBanners();
      showToast('Banner status updated', 'success');
    } catch (error) {
      showToast('Failed to update banner status', 'error');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Box p={3}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Banner Management</Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: { xs: 'stretch', md: 'flex-end' }, '& .MuiButton-root': { flex: { xs: 1, sm: 'initial' }, minWidth: { xs: 'calc(50% - 8px)', sm: 120 } } }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchBanners}
            disabled={loading}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Add New Banner
          </Button>
        </Box>
      </Box>

      {/* Desktop Table View */}
      <Card sx={{ display: { xs: 'none', md: 'block' } }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Image</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Title / Position</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Link</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Order</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
                ) : banners.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center">No banners found</TableCell></TableRow>
                ) : (
                  banners.map((banner) => (
                    <TableRow key={banner._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Box
                            component="img"
                            src={banner.image}
                            alt={banner.title}
                            sx={{ width: 80, height: 45, borderRadius: 1, objectFit: 'cover', border: '1px solid #E2E8F0' }}
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/80x45?text=Error'; }}
                          />
                          {banner.images && banner.images.length > 1 && (
                            <Chip
                              size="small"
                              label={`+${banner.images.length - 1}`}
                              sx={{ alignSelf: 'center', fontSize: '0.7rem', height: 22 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">{banner.title || 'Untitled'}</Typography>
                        <Typography variant="caption" sx={{
                          px: 1,
                          py: 0.2,
                          bgcolor: banner.position === 'main' ? 'primary.light' : 'secondary.light',
                          color: 'white',
                          borderRadius: 1,
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}>
                          {banner.position}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {banner.link}
                        </Typography>
                        <Tooltip title="Test Link">
                          <IconButton size="small" onClick={() => window.open(banner.link, '_blank')}>
                            <OpenInNewIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{banner.displayOrder}</TableCell>
                      <TableCell>
                        <Switch
                           checked={banner.isActive}
                           onChange={() => handleToggleActive(banner)}
                           size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={() => handleOpen(banner)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(banner._id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Mobile Card List View */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        {loading ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></Paper>
        ) : banners.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>No banners found</Paper>
        ) : (
          banners.map((banner) => (
            <Paper key={banner._id} elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '12px', bgcolor: '#FFFFFF' }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ position: 'relative' }}>
                  <Box
                    component="img"
                    src={banner.image}
                    alt={banner.title}
                    sx={{ width: 100, height: 56, borderRadius: '8px', objectFit: 'cover', border: '1px solid #E2E8F0' }}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/100x56?text=Error'; }}
                  />
                  {banner.images && banner.images.length > 1 && (
                    <Chip
                      size="small"
                      label={`+${banner.images.length - 1}`}
                      sx={{ position: 'absolute', bottom: -6, right: -6, fontSize: '0.6rem', height: 18, bgcolor: 'rgba(0,0,0,0.7)', color: '#fff' }}
                    />
                  )}
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {banner.title || 'Untitled'}
                  </Typography>
                  <Chip
                    size="small"
                    label={banner.position}
                    sx={{
                      mt: 0.5,
                      height: 18,
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      bgcolor: banner.position === 'main' ? 'primary.main' : 'secondary.main',
                      color: 'white'
                    }}
                  />
                </Box>
              </Box>

              <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

              <Grid container spacing={1} sx={{ mb: 1.5 }}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, bgcolor: '#F8FAFC', borderRadius: '6px' }}>
                    <Typography sx={{ fontSize: '0.72rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 'calc(100% - 30px)' }}>
                      {banner.link}
                    </Typography>
                    <IconButton size="small" onClick={() => window.open(banner.link, '_blank')} sx={{ padding: '2px' }}>
                      <OpenInNewIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                </Grid>
                <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, mr: 1 }}>ORDER:</Typography>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>{banner.displayOrder}</Typography>
                </Grid>
                <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, mr: 1 }}>STATUS:</Typography>
                  <Switch
                    checked={banner.isActive}
                    onChange={() => handleToggleActive(banner)}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', pt: 1.5, gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                  onClick={() => handleOpen(banner)}
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', py: 0.5 }}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon sx={{ fontSize: 14 }} />}
                  onClick={() => handleDelete(banner._id)}
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem', py: 0.5 }}
                >
                  Delete
                </Button>
              </Box>
            </Paper>
          ))
        )}
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700, pb: 1, pt: 2, px: 3 }}>{editingBanner ? 'Edit Banner' : 'Add New Banner'}</DialogTitle>
          <DialogContent dividers sx={{ p: 3, pt: 2 }}>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                fullWidth
                size="small"
                label="Banner Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Sharp Deep Freezer"
                required
              />

              {/* ─── Image Upload Section ─── */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: '#1E293B' }}>
                  Banner Image *
                </Typography>
                <Typography variant="caption" sx={{ mb: 1, display: 'block', color: '#64748B' }}>
                  Upload a single image for the banner. Max 10MB.
                </Typography>

                {uploadedImageUrls.length > 0 && !uploading ? (
                  <Box sx={{ position: 'relative', width: '100%', height: 160, borderRadius: 2, overflow: 'hidden', border: '1px solid #E2E8F0', mb: 2 }}>
                    <img
                      src={uploadedImageUrls[0]}
                      alt="Banner Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveUploadedImage(0)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        '&:hover': { bgcolor: 'rgba(239,68,68,0.9)' }
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ) : (
                  <Box
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    sx={{
                      border: '2px dashed #CBD5E1',
                      borderRadius: 2,
                      p: 3,
                      mb: 2,
                      textAlign: 'center',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      backgroundColor: '#F8FAFC',
                      '&:hover': {
                        borderColor: '#14B8A6',
                        backgroundColor: '#F0FDFA',
                      }
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    {uploading ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                        <CircularProgress size={32} sx={{ color: '#14B8A6' }} />
                        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                          Uploading image... {uploadProgress}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={uploadProgress}
                          sx={{
                            width: '100%',
                            maxWidth: 200,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#E2E8F0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#14B8A6',
                              borderRadius: 3,
                            }
                          }}
                        />
                      </Box>
                    ) : (
                      <>
                        <CloudUploadIcon sx={{ fontSize: 36, color: '#94A3B8', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                          Click or drag & drop to upload
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                          PNG, JPG, WEBP — 1 file max
                        </Typography>
                      </>
                    )}
                  </Box>
                )}
              </Box>

              <TextField
                fullWidth
                size="small"
                label="Link URL"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="/shop/products?category=..."
              />

              <Box display="flex" gap={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                >
                  <MenuItem value="main">Main Slider (Large)</MenuItem>
                  <MenuItem value="side_top">Side Banner (Top Right)</MenuItem>
                  <MenuItem value="side_bottom">Side Banner (Bottom Right)</MenuItem>
                </TextField>

                <TextField
                  type="number"
                  fullWidth
                  size="small"
                  label="Display Order"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 1.5, bgcolor: '#F8FAFC' }}>
            <Button onClick={handleClose} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
            <Tooltip title={!formData.title ? "Title is required" : uploadedImageUrls.length === 0 ? "Image is required" : ""} arrow>
              <span>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={uploading || uploadedImageUrls.length === 0 || !formData.title}
                  sx={{
                    bgcolor: '#14B8A6',
                    '&:hover': { bgcolor: '#0F766E' },
                    fontWeight: 600,
                  }}
                >
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
                </Button>
              </span>
            </Tooltip>
          </DialogActions>
        </form>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={6000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleToastClose} severity={toastSeverity} sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Banners;
