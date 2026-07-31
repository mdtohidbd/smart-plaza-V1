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
  Alert
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const General = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    phone: '',
    alternativePhone: '',
    email: '',
    website: '',
    enableMultipleWarehouse: false,
    enableWholesale: true,
    enableRetail: false,
    enableSalesNotification: false,
    enableSalesReturnNotification: false,
    enablePaymentReceivedNotification: false
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          enableMultipleWarehouse: data.enableMultipleWarehouse || false,
          enableWholesale: data.enableWholesale || true,
          enableRetail: data.enableRetail || false,
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
    (data) => api.put('/api/settings', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('settings');
        alert('Settings updated successfully!');
      },
      onError: (error) => {
        console.error('Error updating settings:', error);
        alert('Error updating settings: ' + error.response?.data?.message || error.message);
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
      <Typography variant="body2" sx={{ color: '#64748b', mb: 4 }}>
        Manage your business profile and contact information.
      </Typography>

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
              label="Website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              variant="outlined"
              sx={inputStyles}
            />
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
          {user?.permissions?.settings?.update && (
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
          )}
        </Box>
      </form>
    </Box>
  );
};

export default General;