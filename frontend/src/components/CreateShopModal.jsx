import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import api from '../utils/api';

const CreateShopModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    currency: 'BDT'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Shop name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/api/shops', {
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        settings: {
          currency: formData.currency
        }
      });

      if (res.data?.success) {
        setFormData({
          name: '',
          address: '',
          phone: '',
          email: '',
          currency: 'BDT'
        });
        if (onSuccess) {
          onSuccess(res.data.data);
        }
        onClose();
      }
    } catch (err) {
      console.error('Failed to create shop:', err);
      setError(err.response?.data?.message || 'Failed to create shop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth paperProps={{ borderRadius: '12px' }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1, borderBottom: '1px solid #E2E8F0' }}>
        <Box sx={{ p: 1, borderRadius: '10px', backgroundColor: 'rgba(20, 184, 166, 0.1)', color: '#14B8A6', display: 'flex' }}>
          <StorefrontIcon />
        </Box>
        <Typography variant="h6" fontWeight={700} color="#1E293B">
          Create New Shop / Branch
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ py: 2.5 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Shop / Branch Name"
                placeholder="e.g. Smart Plaza Main Branch"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Phone Number"
                placeholder="e.g. 01842-144844"
                value={formData.phone}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email Address"
                placeholder="e.g. shop@smartplazabd.com"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Address / Location"
                placeholder="e.g. 1 KDA Avenue, Shibbari, Khulna"
                value={formData.address}
                onChange={handleChange}
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="currency"
                label="Default Currency"
                value={formData.currency}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: '1px solid #E2E8F0', pt: 2 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" disabled={loading} sx={{ textTransform: 'none', borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              backgroundColor: '#14B8A6',
              '&:hover': { backgroundColor: '#0D9488' }
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Shop'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateShopModal;
