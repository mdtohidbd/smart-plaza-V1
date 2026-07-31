import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, TextField, Button, Grid, MenuItem, CircularProgress 
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Sales Staff'
  });

  const roles = [
    'Super Admin',
    'Admin',
    'Manager',
    'Sales Staff',
    'E-Commerce Admin'
  ];

  const { data: employeeData, isLoading } = useQuery(
    ['employee', id],
    async () => {
      const response = await api.get(`/api/users/${id}`);
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          role: data.role || 'Sales Staff'
        });
      }
    }
  );

  const mutation = useMutation(
    (updatedEmployee) => api.put(`/api/users/${id}`, updatedEmployee),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('employees');
        queryClient.invalidateQueries(['employee', id]);
        navigate('/dashboard/employees');
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to update employee');
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
    
    if (!formData.name || !formData.email || !formData.phone || !formData.role) {
      setError('Please fill in all required fields.');
      return;
    }

    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: '#1E293B', fontFamily: '"Outfit", sans-serif' }}>
          Edit Employee
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
              {mutation.isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Update Employee'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default EditEmployee;
