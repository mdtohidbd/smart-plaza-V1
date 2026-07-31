import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Tooltip,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  Skeleton,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteFileIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const Brands = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [openDialog, setOpenDialog] = useState(false);
  const [currentBrand, setCurrentBrand] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    description: '',
    website: '',
    country: '',
    isActive: true,
    displayOrder: 0
  });
  
  // Logo upload state
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch brands
  const { data: brandsData, isLoading } = useQuery(
    'brands',
    async () => {
      const response = await api.get('/api/brands');
      return response.data;
    },
    {
      refetchOnWindowFocus: false,
      retry: 1
    }
  );

  // Create brand mutation
  const createBrandMutation = useMutation(
    (data) => api.post('/api/brands', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('brands');
        handleCloseDialog();
        resetForm();
        setSuccess('Brand created successfully!');
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error creating brand');
      }
    }
  );

  // Update brand mutation
  const updateBrandMutation = useMutation(
    ({ id, data }) => api.put(`/api/brands/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('brands');
        handleCloseDialog();
        resetForm();
        setSuccess('Brand updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error updating brand');
      }
    }
  );

  // Delete brand mutation
  const deleteBrandMutation = useMutation(
    (id) => api.delete(`/api/brands/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('brands');
        setSuccess('Brand deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error deleting brand');
      }
    }
  );

  // Toggle status mutation
  const toggleStatusMutation = useMutation(
    (id) => api.put(`/api/brands/${id}/toggle-status`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('brands');
        setSuccess('Brand status updated!');
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error updating status');
      }
    }
  );

  const handleOpenDialog = (brand = null) => {
    if (brand) {
      setCurrentBrand(brand);
      setFormData({
        name: brand.name || '',
        logo: brand.logo || '',
        description: brand.description || '',
        website: brand.website || '',
        country: brand.country || '',
        isActive: brand.isActive !== undefined ? brand.isActive : true,
        displayOrder: brand.displayOrder || 0
      });
      // Set preview if logo exists
      if (brand.logo) {
        setLogoPreviewUrl(brand.logo);
        setSelectedLogo(null);
      } else {
        setLogoPreviewUrl('');
        setSelectedLogo(null);
      }
    } else {
      setCurrentBrand(null);
      resetForm();
    }
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentBrand(null);
    setSelectedLogo(null);
    setLogoPreviewUrl('');
    setError('');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      logo: '',
      description: '',
      website: '',
      country: '',
      isActive: true,
      displayOrder: 0
    });
    setSelectedLogo(null);
    setLogoPreviewUrl('');
  };

  // Handle logo file selection
  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setSelectedLogo(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  // Upload logo to ImgBB
  const uploadLogoToImgBB = async (file) => {
    setIsUploadingLogo(true);
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch('https://api.imgbb.com/1/upload?key=a0d1c7f2693c806b61ca26899e0a1a29', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('[BRAND LOGO] Uploaded to ImgBB:', result.data.url);
        return result.data.url;
      } else {
        throw new Error('Failed to upload logo');
      }
    } catch (error) {
      console.error('[BRAND LOGO] Upload error:', error);
      setError('Failed to upload logo. Please try again.');
      return null;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Remove selected logo
  const handleRemoveLogo = () => {
    setSelectedLogo(null);
    setLogoPreviewUrl('');
    setFormData({ ...formData, logo: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Brand name is required');
      return;
    }

    let logoUrl = formData.logo;

    // Upload logo if a new file is selected
    if (selectedLogo) {
      const uploadedUrl = await uploadLogoToImgBB(selectedLogo);
      if (uploadedUrl) {
        logoUrl = uploadedUrl;
      } else {
        return; // Stop if upload failed
      }
    }

    const brandData = {
      ...formData,
      logo: logoUrl
    };

    if (currentBrand) {
      updateBrandMutation.mutate({ id: currentBrand._id, data: brandData });
    } else {
      createBrandMutation.mutate(brandData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this brand?')) {
      deleteBrandMutation.mutate(id);
    }
  };

  const filteredBrands = useMemo(() => {
    const brands = brandsData?.data || [];
    if (!searchTerm.trim()) return brands;
    const term = searchTerm.toLowerCase();
    const filtered = brands.filter(brand =>
      brand.name.toLowerCase().includes(term) ||
      (brand.description && brand.description.toLowerCase().includes(term))
    );
    return filtered.sort((a, b) => {
      const aStarts = (a.name || '').toLowerCase().startsWith(term);
      const bStarts = (b.name || '').toLowerCase().startsWith(term);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
  }, [brandsData?.data, searchTerm]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedBrands = useMemo(() => {
    return filteredBrands.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredBrands, page, rowsPerPage]);

  return (
    <Box sx={{ py: { xs: 1, sm: 2 }, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <Grid container spacing={1.5} sx={{ px: { xs: 1, sm: 2 } }}>
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 1.5, mb: 1.5, border: '1px solid #eaeef3', borderRadius: '8px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconButton 
                  onClick={() => navigate('/dashboard')} 
                  sx={{ 
                    bgcolor: '#F1F5F9', 
                    '&:hover': { bgcolor: '#E2E8F0' },
                    borderRadius: '12px',
                    p: 1
                  }}
                >
                  <ArrowBackIcon sx={{ color: '#475569', fontSize: '1.25rem' }} />
                </IconButton>
                <Box>
                  <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, fontSize: '1rem' }}>Brands Management</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>Manage your product brands</Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{
                  backgroundColor: 'rgb(19, 52, 50)',
                  '&:hover': { backgroundColor: 'rgb(26, 70, 67)' }
                }}
              >
                Add Brand
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mt: 1 }} onClose={() => setSuccess('')}>
                {success}
              </Alert>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={0} sx={{ border: '1px solid #eaeef3', borderRadius: '8px', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #eaeef3' }}>
              <TextField
                fullWidth
                placeholder="Search brands..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                size="small"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1 }} />
                }}
                sx={{ flex: 1, maxWidth: 400 }}
              />
            </Box>

            {isMobile ? (
              /* ============ MOBILE CARD VIEW ============ */
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1.5, backgroundColor: '#F8FAFC' }}>
                {isLoading ? (
                  [1, 2, 3].map((item) => (
                    <Paper key={item} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#fff' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Skeleton variant="text" width="60%" height={18} />
                          <Skeleton variant="text" width="40%" height={14} />
                        </Box>
                      </Box>
                    </Paper>
                  ))
                ) : paginatedBrands.length === 0 ? (
                  <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#fff', border: '1px solid #eaeef3', borderRadius: '8px' }}>
                    <Typography variant="body2" color="textSecondary">
                      {searchTerm ? 'No brands found matching your search' : 'No brands added yet'}
                    </Typography>
                  </Paper>
                ) : (
                  paginatedBrands.map((brand) => (
                    <Paper
                      key={brand._id}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        backgroundColor: '#fff',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)'
                        }
                      }}
                    >
                      {/* Header: Logo + Brand Name + Status */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        {brand.logo ? (
                          <Box
                            component="img"
                            src={brand.logo}
                            alt={brand.name}
                            sx={{
                              width: 48,
                              height: 48,
                              objectFit: 'contain',
                              borderRadius: '10px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#f8fafc',
                              p: 0.5
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: '10px',
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '9px', fontWeight: 600, fontFamily: '"Outfit", sans-serif' }}>No Logo</Typography>
                          </Box>
                        )}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', fontFamily: '"Outfit", sans-serif' }}>
                            {brand.name}
                          </Typography>
                          {brand.country && (
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', fontFamily: '"Outfit", sans-serif' }}>
                              {brand.country}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          label={brand.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          icon={brand.isActive ? <CheckCircleIcon sx={{ fontSize: '14px !important' }} /> : <CancelIcon sx={{ fontSize: '14px !important' }} />}
                          sx={{
                            height: 22,
                            fontSize: '0.675rem',
                            fontWeight: 700,
                            backgroundColor: brand.isActive ? '#dcfce7' : '#fee2e2',
                            color: brand.isActive ? '#166534' : '#991b1b',
                            border: brand.isActive ? '1px solid #bbf7d0' : '1px solid #fecaca',
                            fontFamily: '"Outfit", sans-serif'
                          }}
                        />
                      </Box>

                      {/* Description */}
                      {brand.description && (
                        <Box sx={{ mb: 1.5, p: 1.25, backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.25, fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Outfit", sans-serif' }}>
                            Description
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.8rem', fontFamily: '"Outfit", sans-serif' }}>
                            {brand.description}
                          </Typography>
                        </Box>
                      )}

                      {/* Info Row: Website + Display Order */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Box>
                          {brand.website ? (
                            <a href={brand.website} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600, fontFamily: '"Outfit", sans-serif' }}>
                              {brand.website.replace(/^https?:\/\//, '').substring(0, 30)}{brand.website.replace(/^https?:\/\//, '').length > 30 ? '...' : ''}
                            </a>
                          ) : (
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: '"Outfit", sans-serif' }}>No website</Typography>
                          )}
                        </Box>
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#f0f9ff',
                          color: '#0369a1',
                          fontWeight: 700,
                          border: '1px solid #e0f2fe',
                          fontFamily: '"Outfit", sans-serif'
                        }}>
                          Order: {brand.displayOrder}
                        </span>
                      </Box>

                      {/* Actions Footer */}
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px dashed #e2e8f0', pt: 1.25 }}>
                        <IconButton
                          size="small"
                          onClick={() => toggleStatusMutation.mutate(brand._id)}
                          sx={{
                            p: 0.75,
                            border: '1px solid',
                            borderColor: brand.isActive ? '#fde68a' : '#bbf7d0',
                            borderRadius: '8px',
                            backgroundColor: '#f8fafc',
                            color: brand.isActive ? '#d97706' : '#059669',
                            '&:hover': {
                              backgroundColor: brand.isActive ? '#fffbeb' : '#f0fdf4',
                              borderColor: brand.isActive ? '#fbbf24' : '#86efac'
                            }
                          }}
                        >
                          {brand.isActive ? <CancelIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(brand)}
                          sx={{
                            p: 0.75,
                            border: '1px solid #dbeafe',
                            borderRadius: '8px',
                            backgroundColor: '#f8fafc',
                            color: '#2563eb',
                            '&:hover': {
                              backgroundColor: '#eff6ff',
                              borderColor: '#bfdbfe'
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(brand._id)}
                          sx={{
                            p: 0.75,
                            border: '1px solid #fee2e2',
                            borderRadius: '8px',
                            backgroundColor: '#f8fafc',
                            color: '#dc2626',
                            '&:hover': {
                              backgroundColor: '#fef2f2',
                              borderColor: '#fca5a5'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))
                )}
              </Box>
            ) : (
              /* ============ DESKTOP TABLE VIEW ============ */
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Logo</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Brand Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Country</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Website</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Display Order</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading ? (
                      [1, 2, 3, 4, 5].map((item) => (
                        <TableRow key={item}>
                          <TableCell><Skeleton variant="rectangular" width={50} height={50} sx={{ borderRadius: 1 }} /></TableCell>
                          <TableCell><Skeleton variant="text" width="60%" /><Skeleton variant="text" width="40%" /></TableCell>
                          <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                          <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                          <TableCell><Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 1 }} /></TableCell>
                          <TableCell><Skeleton variant="text" width={20} /></TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Skeleton variant="circular" width={28} height={28} />
                              <Skeleton variant="circular" width={28} height={28} />
                              <Skeleton variant="circular" width={28} height={28} />
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : paginatedBrands.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            {searchTerm ? 'No brands found matching your search' : 'No brands added yet'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedBrands.map((brand) => (
                        <TableRow key={brand._id} hover>
                          <TableCell>
                            {brand.logo ? (
                              <Box
                                component="img"
                                src={brand.logo}
                                alt={brand.name}
                                sx={{ width: 50, height: 50, objectFit: 'contain', borderRadius: 1 }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: 50,
                                  height: 50,
                                  borderRadius: 1,
                                  backgroundColor: '#f1f5f9',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Typography variant="caption" color="text.secondary">
                                  No Logo
                                </Typography>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {brand.name}
                            </Typography>
                            {brand.description && (
                              <Typography variant="caption" color="text.secondary">
                                {brand.description.substring(0, 50)}
                                {brand.description.length > 50 ? '...' : ''}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{brand.country || '-'}</TableCell>
                          <TableCell>
                            {brand.website ? (
                              <a href={brand.website} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                                {brand.website}
                              </a>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={brand.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              icon={brand.isActive ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
                              sx={{
                                backgroundColor: brand.isActive ? '#dcfce7' : '#fee2e2',
                                color: brand.isActive ? '#166534' : '#991b1b'
                              }}
                            />
                          </TableCell>
                          <TableCell>{brand.displayOrder}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Tooltip title="Toggle Status">
                                <IconButton
                                  size="small"
                                  onClick={() => toggleStatusMutation.mutate(brand._id)}
                                  sx={{ color: brand.isActive ? '#f59e0b' : '#10b981' }}
                                >
                                  {brand.isActive ? <CancelIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => handleOpenDialog(brand)} sx={{ color: '#3b82f6' }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" onClick={() => handleDelete(brand._id)} sx={{ color: '#ef4444' }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Pagination */}
            {!isLoading && filteredBrands.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredBrands.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{ borderTop: '1px solid #eaeef3' }}
              />
            )}
          </Paper>
        </Grid>

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: '#F8FAFC', borderBottom: '1px solid #e2e8f0' }}>
            {currentBrand ? 'Edit Brand' : 'Add New Brand'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Brand Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    error={!!error && !formData.name}
                    helperText={!formData.name && error ? 'Brand name is required' : ''}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Brand Logo</Typography>
                  
                  {/* Logo Preview */}
                  {logoPreviewUrl && (
                    <Box sx={{ mb: 2, position: 'relative', display: 'inline-block' }}>
                      <Box
                        component="img"
                        src={logoPreviewUrl}
                        alt="Logo Preview"
                        sx={{ 
                          width: 120, 
                          height: 120, 
                          objectFit: 'contain', 
                          borderRadius: 2,
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#F8FAFC'
                        }}
                      />
                      <IconButton
                        onClick={handleRemoveLogo}
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
                        <DeleteFileIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  
                  {/* Upload Button */}
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={isUploadingLogo ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                    disabled={isUploadingLogo}
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
                    {logoPreviewUrl ? 'Change Logo' : 'Upload Logo'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleLogoSelect}
                    />
                  </Button>
                  
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#94A3B8' }}>
                    Supported formats: JPG, PNG, GIF (Max 5MB)
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Display Order"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                    }
                    label="Active"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={createBrandMutation.isLoading || updateBrandMutation.isLoading || isUploadingLogo}
                sx={{
                  backgroundColor: 'rgb(19, 52, 50)',
                  '&:hover': { backgroundColor: 'rgb(26, 70, 67)' }
                }}
              >
                {createBrandMutation.isLoading || updateBrandMutation.isLoading || isUploadingLogo ? (
                  <CircularProgress size={24} color="inherit" />
                ) : currentBrand ? (
                  'Update'
                ) : (
                  'Create'
                )}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Grid>
    </Box>
  );
};

export default Brands;
