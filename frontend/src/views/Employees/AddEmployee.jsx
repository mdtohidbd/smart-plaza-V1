import React, { useState } from 'react';
import { 
  Box, Typography, Paper, TextField, Button, Grid, MenuItem, CircularProgress 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';

const AddEmployee = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'Sales Staff',
    permissions: [] // Default permissions can be set later
  });

  const roles = [
    'Super Admin',
    'Admin',
    'Manager',
    'Sales Staff',
    'E-Commerce Admin'
  ];

  const mutation = useMutation(
    (newEmployee) => api.post('/api/users', newEmployee),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('employees');
        navigate('/dashboard/employees');
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to create employee');
      }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.role) {
      setError('Please fill in all required fields.');
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: '#1E293B', fontFamily: '"Outfit", sans-serif' }}>
          Add New Employee
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2, p: 1, bgcolor: '#FEF2F2', borderRadius: '4px', border: '1px solid #FECACA' }}>
            {error}
          </Typography>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                select
                required
                variant="outlined"
              >
                {roles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Temporary Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard/employees')}
              sx={{ color: '#64748B', borderColor: '#CBD5E1' }}
              disabled={mutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={mutation.isLoading}
              sx={{
                bgcolor: '#1D5F99',
                '&:hover': { bgcolor: '#42A2C2' }
              }}
            >
              {mutation.isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Add Employee'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default AddEmployee;
