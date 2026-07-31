import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';

const AddUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Sales Staff',
    address: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const queryClient = useQueryClient();

  const { data: rolesData } = useQuery(
    'roles',
    async () => {
      const response = await api.get('/api/roles');
      return response.data.data;
    },
    { refetchOnWindowFocus: false }
  );

  // Mutation for creating user
  const createUserMutation = useMutation(
    (userData) => api.post('/api/users', userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: 'Sales Staff',
          address: '',
          password: '',
          confirmPassword: ''
        });
        setSuccess('User created successfully!');
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (error) => {
        setError(error.response?.data?.message || error.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      setTimeout(() => setError(''), 5000);
      return;
    }

    // Prepare user data (excluding confirmPassword)
    const { confirmPassword, ...userData } = formData;
    createUserMutation.mutate(userData);
  };

  return (
    <Box sx={{
      py: { xs: 1, sm: 2 },
      backgroundColor: '#F8FAFC',
    }}>
      <Grid container spacing={1.5}>
        <Grid item xs={12}>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Paper sx={{ p: 2 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth size="small" label="Full Name" name="name" value={formData.name} onChange={handleInputChange} required />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth size="small" label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth size="small" label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Role</InputLabel>
                    <Select name="role" value={formData.role} onChange={handleInputChange}>
                      {rolesData?.map((role) => (
                        <MenuItem key={role._id} value={role.name}>
                          {role.name} {role.name === 'SR' ? '(Sales Representative)' : ''}
                        </MenuItem>
                      )) || [
                        <MenuItem key="sales-staff" value="Sales Staff">Sales Staff</MenuItem>,
                        <MenuItem key="ecommerce-admin" value="E-Commerce Admin">E-Commerce Admin</MenuItem>
                      ]}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Address" name="address" value={formData.address} onChange={handleInputChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth size="small" label="Password" name="password" type="password" value={formData.password} onChange={handleInputChange} required />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth size="small" label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} required />
                </Grid>
              </Grid>

              <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  size="large"
                  type="submit"
                  disabled={createUserMutation.isLoading}
                >
                  {createUserMutation.isLoading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Creating...
                    </>
                  ) : 'Create User'}
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AddUser;