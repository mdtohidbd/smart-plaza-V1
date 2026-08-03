import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress
} from '@mui/material';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const General = () => {
  const { user } = useAuth();
  const { fetchSettings, setSettings } = useSettings();
  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    phone: '',
    alternativePhone: '',
    email: '',
    website: '',
    logo: '',
    enableMultipleWarehouse: false,
    enableWholesale: true,
    enableRetail: false,
    enableSalesNotification: false,
    enableSalesReturnNotification: false,
    enablePaymentReceivedNotification: false
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const queryClient = useQueryClient();

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery(
    'settings',
    async () => {
      const response = await api.get('/api/settings');
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        setFormData({
          companyName: data.companyName || '',
          companyAddress: data.companyAddress || '',
          phone: data.phone || '',
          alternativePhone: data.alternativePhone || '',
          email: data.email || '',
          website: data.website || '',
          logo: data.logo || '',
          enableMultipleWarehouse: data.enableMultipleWarehouse || false,
          enableWholesale: data.enableWholesale !== undefined ? data.enableWholesale : true,
          enableRetail: data.enableRetail !== undefined ? data.enableRetail : false,
          enableSalesNotification: data.enableSalesNotification || false,
          enableSalesReturnNotification: data.enableSalesReturnNotification || false,
          enablePaymentReceivedNotification: data.enablePaymentReceivedNotification || false
        });
        setLoading(false);
      },
      onError: (err) => {
        setError('Failed to load settings');
        setLoading(false);
      }
    }
  );

  // Update settings mutation
  const updateSettingsMutation = useMutation(
    async (data) => {
      const response = await api.put('/api/settings', data);
      return response;
    },
    {
      onSuccess: (res) => {
        queryClient.invalidateQueries('settings');
        if (res?.data?.data) {
          setSettings(res.data.data);
        } else {
          setSettings(prev => ({ ...prev, ...formData }));
        }
        fetchSettings(); // Instantly sync across public and auth states
        alert('Settings updated successfully!');
      },
      onError: (error) => {
        console.error('Error updating settings:', error);
        alert('Error updating settings: ' + (error.response?.data?.message || error.message));
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('image', file);

    setUploadingLogo(true);
    try {
      const response = await api.post('/api/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data && response.data.url) {
        setFormData(prev => ({ ...prev, logo: response.data.url }));
        alert('Logo image uploaded successfully!');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      alert('Failed to upload logo image: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  if (loading) {
    return (
      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      bgcolor: '#f8fafc',
      '& fieldset': { borderColor: '#e2e8f0' },
      '&:hover fieldset': { borderColor: '#cbd5e1' },
      '&.Mui-focused fieldset': { borderColor: '#0f766e', borderWidth: '1px' },
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '800px', mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
        General Settings
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
        Manage your business profile and contact information.
      </Typography>

      {/* Multi-Shop Shortcut Banner */}
      <Paper
        sx={{
          p: 2.5,
          mb: 4,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.08) 0%, rgba(13, 148, 136, 0.03) 100%)',
          border: '1px solid rgba(20, 184, 166, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ p: 1.25, borderRadius: '10px', backgroundColor: '#14B8A6', color: '#FFFFFF', display: 'flex' }}>
            <CloudUploadIcon />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="#1E293B">
              Multi-Shop Management (মাল্টিশপ সেটিংস)
            </Typography>
            <Typography variant="body2" color="#64748B">
              Create and manage multiple shop branches or store locations seamlessly.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          onClick={() => window.location.href = '/dashboard/settings/shops'}
          sx={{
            backgroundColor: '#14B8A6',
            textTransform: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            '&:hover': { backgroundColor: '#0D9488' }
          }}
        >
          Manage Shops
        </Button>
      </Paper>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Company Name"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              required
              variant="outlined"
              sx={inputStyles}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              variant="outlined"
              sx={inputStyles}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Primary Phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              variant="outlined"
              sx={inputStyles}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Alternative Phone"
              name="alternativePhone"
              value={formData.alternativePhone}
              onChange={handleInputChange}
              variant="outlined"
              sx={inputStyles}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Website URL"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              variant="outlined"
              sx={inputStyles}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ p: 2.5, border: '1px dashed #CBD5E1', borderRadius: '12px', bgcolor: '#F8FAFC' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#334155', mb: 1.5 }}>
                Logo Image (Website Header & Favicon Icon)
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="Logo Image URL"
                    name="logo"
                    value={formData.logo}
                    onChange={handleInputChange}
                    placeholder="Upload image or paste direct image URL (.png, .jpg)"
                    variant="outlined"
                    sx={inputStyles}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    component="label"
                    variant="contained"
                    fullWidth
                    disabled={uploadingLogo}
                    startIcon={!uploadingLogo && <CloudUploadIcon />}
                    sx={{
                      height: '54px',
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 600,
                      bgcolor: '#0EA5E9',
                      '&:hover': { bgcolor: '#0284C7' },
                      boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)'
                    }}
                  >
                    {uploadingLogo ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} color="inherit" />
                        <span>Uploading...</span>
                      </Box>
                    ) : (
                      'Upload Logo Image'
                    )}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </Button>
                </Grid>
              </Grid>

              {formData.logo && !formData.logo.includes('google.com/imgres') && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, p: 1.5, bgcolor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Box
                    component="img"
                    src={formData.logo}
                    alt="Logo Preview"
                    sx={{ height: 40, width: 'auto', objectFit: 'contain', maxHeight: 40 }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.85rem' }}>
                    Preview of selected logo
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    sx={{ ml: 'auto', textTransform: 'none' }}
                    onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                  >
                    Remove
                  </Button>
                </Box>
              )}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Company Address"
              name="companyAddress"
              value={formData.companyAddress}
              onChange={handleInputChange}
              multiline
              rows={3}
              required
              variant="outlined"
              sx={inputStyles}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 5, display: 'flex', justifyContent: 'flex-end' }}>
          {(user?.role === 'Super Admin' || user?.permissions?.settings?.update || user?.role === 'Admin') ? (
            <Button
              variant="contained"
              type="submit"
              disabled={updateSettingsMutation.isLoading}
              sx={{
                bgcolor: '#0f766e',
                color: '#fff',
                px: 4,
                py: 1.2,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#0d655e',
                  boxShadow: '0 4px 12px rgba(15, 118, 110, 0.2)',
                }
              }}
            >
              {updateSettingsMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          ) : (
            <Alert severity="info" sx={{ width: '100%' }}>
              You do not have permission to update system settings. Please contact Super Admin.
            </Alert>
          )}
        </Box>
      </form>
    </Box>
  );
};

export default General;