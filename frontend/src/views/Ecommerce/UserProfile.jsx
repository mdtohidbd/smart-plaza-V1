import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const UserProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch user profile
  const { data: profile, isLoading } = useQuery(
    ['userProfile', user?._id],
    async () => {
      const response = await api.get(`/api/auth/profile`);
      return response.data;
    },
    {
      enabled: !!user?._id,
      refetchOnWindowFocus: false
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (updatedData) => {
      const response = await api.put(`/api/auth/profile`, updatedData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userProfile', user._id]);
        setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Failed to update profile',
          severity: 'error'
        });
      }
    }
  );

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || ''
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Typography>Loading profile...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper
        sx={{
          p: { xs: 2.5, md: 4 },
          bgcolor: 'background.paper',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          boxShadow: 'none'
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 3, md: 4 } }}>
          <Avatar
            sx={{
              width: { xs: 64, md: 80 },
              height: { xs: 64, md: 80 },
              bgcolor: '#14B8A6', // Changed to match theme's primary
              fontSize: { xs: 28, md: 32 },
              fontWeight: 700,
              mr: 3
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          <Box>
            <Typography variant="h5" color="text.primary" sx={{ fontWeight: 700, mb: 0.5 }}>
              My Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your account information
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: { xs: 2, md: 3 } }} />

        {/* Profile Form */}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                InputProps={{
                  startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    bgcolor: 'background.default'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                InputProps={{
                  startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    bgcolor: 'background.default'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                InputProps={{
                  startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    bgcolor: 'background.default'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                InputProps={{
                  startAdornment: <LocationIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    bgcolor: 'background.default'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: 2, justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => window.history.back()}
                  sx={{
                    borderColor: 'divider',
                    color: 'text.secondary',
                    width: { xs: '100%', sm: 'auto' },
                    py: { xs: 1.2, sm: 1 }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={updateProfileMutation.isLoading}
                  startIcon={<SaveIcon />}
                  sx={{ 
                    bgcolor: '#14B8A6', 
                    '&:hover': { bgcolor: '#0F766E' },
                    width: { xs: '100%', sm: 'auto' },
                    py: { xs: 1.2, sm: 1 },
                    boxShadow: '0 4px 10px rgba(20, 184, 166, 0.25)'
                  }}
                >
                  {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="outlined"
          sx={{ width: '100%', bgcolor: 'background.paper' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserProfile;
