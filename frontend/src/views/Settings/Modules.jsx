import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  FormControlLabel,
  Switch,
  Button,
  Grid,
  Alert
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const Modules = () => {
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  // Fetch modules
  const { data: modulesData, isLoading, refetch } = useQuery(
    'modules',
    async () => {
      const response = await api.get('/api/settings/modules');
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        setModules(data);
        setLoading(false);
      },
      onError: (err) => {
        setError('Failed to load modules');
        setLoading(false);
        console.error('Error loading modules:', err);
      }
    }
  );

  // Update modules mutation
  const updateModulesMutation = useMutation(
    (data) => api.put('/api/settings/modules', { modules: data }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('modules');
        alert('Module settings updated successfully!');
      },
      onError: (error) => {
        console.error('Error updating modules:', error);
        alert('Error updating modules: ' + error.response?.data?.message || error.message);
      }
    }
  );

  const handleModuleToggle = (moduleName) => {
    setModules(prevModules =>
      prevModules.map(module =>
        module.name === moduleName
          ? { ...module, enabled: !module.enabled }
          : module
      )
    );
  };

  const handleSave = () => {
    updateModulesMutation.mutate(modules);
  };

  if (loading || isLoading) {
    return (
      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading modules...</Typography>
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

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Modules
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Module Management
        </Typography>

        <Paper
          sx={{
            p: 1.5,
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            mb: 2
          }}
        >
          <Grid container spacing={1.5}>
            {modules.map((module, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={module.enabled}
                      onChange={() => handleModuleToggle(module.name)}
                      name={module.name}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#1D5F99',
                          '&:hover': {
                            backgroundColor: 'rgba(29, 95, 153, 0.04)',
                          },
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#1D5F99',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography
                      sx={{
                        color: module.enabled ? '#1D5F99' : '#999',
                        fontWeight: module.enabled ? '500' : 'normal'
                      }}
                    >
                      {module.label}
                    </Typography>
                  }
                />
              </Grid>
            ))}
          </Grid>
        </Paper>

        <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
          {user?.permissions?.settings?.update && (
            <Button
              variant="contained"
              size="large"
              onClick={handleSave}
              disabled={updateModulesMutation.isLoading}
            >
              {updateModulesMutation.isLoading ? 'Saving...' : 'Save Module Settings'}
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Modules;