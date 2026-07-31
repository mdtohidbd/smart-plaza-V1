import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const SmsConfiguration = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState({
    username: '',
    apikey: '',
    senderName: '',
    baseUrl: 'https://api.mimsms.com'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const queryClient = useQueryClient();

  // Load current configuration
  const { data: currentConfig, isLoading, refetch } = useQuery(
    'smsConfig',
    async () => {
      try {
        const response = await api.get('/api/sms/config');
        return response.data;
      } catch (error) {
        console.error('Error fetching SMS config:', error);
        return { isConfigured: false };
      }
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Update config state when currentConfig data is loaded
  useEffect(() => {
    if (currentConfig) {
      setConfig({
        username: currentConfig.hasUsername ? '***' : '', // Show placeholder if exists
        apikey: currentConfig.hasApikey ? '***' : '', // Show placeholder if exists
        senderName: currentConfig.hasSenderName ? '***' : '', // Show placeholder if exists
        baseUrl: currentConfig.baseUrl || 'https://api.mimsms.com'
      });
    }
  }, [currentConfig]);

  // Test configuration mutation
  const testConfigMutation = useMutation(
    () => api.post('/api/sms/test-config'),
    {
      onSuccess: (response) => {
        if (response.data.isConfigured) {
          setSuccess('SMS configuration is valid and working!');
        } else {
          setError('SMS configuration is missing required credentials');
        }
        setTimeout(() => {
          setSuccess('');
          setError('');
        }, 5000);
      },
      onError: (error) => {
        setError(error.response?.data?.message || error.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  );

  // Check balance mutation
  const checkBalanceMutation = useMutation(
    () => api.get('/api/sms/balance'),
    {
      onSuccess: (response) => {
        if (response.data.success) {
          setSuccess(`Current balance: ${response.data.data.balance}`);
        } else {
          setError(response.data.data.error || 'Failed to check balance');
        }
        setTimeout(() => {
          setSuccess('');
          setError('');
        }, 5000);
      },
      onError: (error) => {
        setError(error.response?.data?.message || error.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // If the current value is a mask (***), clear it when user starts typing
    setConfig(prev => {
      const currentValue = prev[name];
      const newValue = currentValue === '***' ? value : value;
      return {
        ...prev,
        [name]: newValue
      };
    });
  };

  const handleTestConfig = () => {
    testConfigMutation.mutate();
  };

  const handleCheckBalance = () => {
    checkBalanceMutation.mutate();
  };

  const updateConfigMutation = useMutation(
    (configData) => api.put('/api/sms/config', configData),
    {
      onSuccess: (response) => {
        setSuccess('SMS configuration updated successfully!');
        setTimeout(() => setSuccess(''), 5000);
        refetch();
      },
      onError: (error) => {
        setError(error.response?.data?.message || error.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  );

  const handleSaveConfig = () => {
    updateConfigMutation.mutate(config);
  };



  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Typography variant="h5" gutterBottom>
        SMS Configuration
      </Typography>

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

      <Grid container spacing={1.5}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="MiMSMS API Configuration"
              subheader="Configure your MiMSMS SMS API credentials"
            />
            <CardContent>
              <Grid container spacing={1.5}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="API Base URL"
                    name="baseUrl"
                    value={config.baseUrl}
                    onChange={handleInputChange}
                    helperText="Default: https://api.mimsms.com"
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={config.username}
                    onChange={handleInputChange}
                    placeholder={config.username === '***' ? 'Currently configured - enter new value to update' : 'your@email.com'}
                    margin="normal"
                    type="email"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="API Key"
                    name="apikey"
                    value={config.apikey}
                    onChange={handleInputChange}
                    placeholder={config.apikey === '***' ? 'Currently configured - enter new value to update' : 'XXXXXXXXXXXXXXXXXXXXXX'}
                    margin="normal"
                    type="password"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Sender Name"
                    name="senderName"
                    value={config.senderName}
                    onChange={handleInputChange}
                    placeholder={config.senderName === '***' ? 'Currently configured - enter new value to update' : 'Your Company Name'}
                    margin="normal"
                    helperText="Registered sender ID for SMS"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, mt: 2, '& > button': { width: { xs: '100%', sm: 'auto' } } }}>
                    {user?.permissions?.settings?.update && (
                      <Button
                        variant="contained"
                        onClick={handleSaveConfig}
                        disabled={testConfigMutation.isLoading || checkBalanceMutation.isLoading}
                      >
                        Save Configuration
                      </Button>
                    )}

                    <Button
                      variant="outlined"
                      onClick={handleTestConfig}
                      disabled={testConfigMutation.isLoading}
                    >
                      {testConfigMutation.isLoading ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Testing...
                        </>
                      ) : 'Test Configuration'}
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={handleCheckBalance}
                      disabled={checkBalanceMutation.isLoading}
                    >
                      {checkBalanceMutation.isLoading ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Checking...
                        </>
                      ) : 'Check Balance'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title="Configuration Status"
              subheader="Current setup status"
            />
            <CardContent>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Status:{' '}
                <strong>
                  {isLoading ? 'Loading...' :
                    currentConfig?.isConfigured ? '✅ Configured' : '❌ Not Configured'}
                </strong>
              </Typography>

              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {currentConfig?.message || 'Configuration not tested yet'}
              </Typography>

              <Typography variant="h6" gutterBottom>
                Setup Instructions:
              </Typography>
              <Typography variant="body2" component="ol" sx={{ pl: 2 }}>
                <li>Enter your MiMSMS API credentials</li>
                <li>Click "Test Configuration" to verify</li>
                <li>Save the configuration</li>
                <li>Check your SMS balance</li>
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mt: 1.5 }}>
            <CardHeader
              title="API Documentation"
              subheader="Reference for MiMSMS integration"
            />
            <CardContent>
              <Typography variant="body2" color="textSecondary" paragraph>
                Base URL: https://api.mimsms.com
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                For detailed API documentation, visit: mim.digital
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Supported transaction types: T (Transactional), P (Promotional), D (Dynamic)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SmsConfiguration;