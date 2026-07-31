import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Card,
  CardHeader,
  CardContent,
  Divider
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const EditContact = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [contactData, setContactData] = useState({
    contactType: 'Customer',
    customerType: 'Individual',
    businessName: '',
    contactNumber: '',
    contactName: '',
    businessNumber: '',
    openingBalance: 0,
    creditLimit: 0,
    address: '',
    route: '',
    note: '',
    contactPersonName: '',
    businessRegistrationNumber: '',
    nidPassportNumber: '',
    guarantor: '',
    workplace: '',
    salary: 0,
    alternativeContactNumber: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch contact data
  const { data: contact, isLoading, isError } = useQuery(
    ['contact', id],
    async () => {
      const response = await api.get(`/api/contacts/customers/${id}`);
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        setContactData({
          contactType: data.contactType || 'Customer',
          customerType: data.customerType || 'Individual',
          businessName: data.businessName || '',
          contactNumber: data.contactNumber || '',
          contactName: data.contactName || '',
          businessNumber: data.businessNumber || '',
          openingBalance: data.openingBalance || 0,
          creditLimit: data.creditLimit || 0,
          address: data.address || '',
          route: data.route || '',
          note: data.note || '',
          contactPersonName: data.contactPersonName || '',
          businessRegistrationNumber: data.businessRegistrationNumber || '',
          nidPassportNumber: data.nidPassportNumber || '',
          guarantor: data.guarantor || '',
          workplace: data.workplace || '',
          salary: data.salary || 0,
          alternativeContactNumber: data.alternativeContactNumber || ''
        });
      },
      refetchOnWindowFocus: false,
    }
  );

  // Fetch routes if needed
  const { data: routes } = useQuery('routes', async () => {
    const response = await api.get('/api/routes');
    return response.data.data;
  });

  const updateContactMutation = useMutation(
    (data) => api.put(`/api/contacts/customers/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        queryClient.invalidateQueries('companies');
        queryClient.invalidateQueries(['contact', id]);
        setSuccess('Contact updated successfully!');
        setTimeout(() => {
          navigate('/contacts/customers');
        }, 1500);
      },
      onError: (error) => {
        console.error('Error updating contact:', error);
        const errorMessage = error.response?.data?.message || error.message;
        setError(errorMessage);
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactData({
      ...contactData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    console.log('=== SUBMITTING CONTACT UPDATE ===');
    console.log('Contact ID:', id);
    console.log('Form Data:', contactData);

    // Validation
    if (!contactData.contactName && !contactData.contactPersonName) {
      setError('Contact name is required');
      return;
    }

    if (!contactData.contactNumber) {
      setError('Contact number is required');
      return;
    }

    console.log('Validation passed, sending update request...');
    updateContactMutation.mutate(contactData);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Error loading contact data</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 1, sm: 2 }, 
      backgroundColor: '#F8FAFC',
      
    }}>
      <Grid container spacing={1.5} >
        <Grid item xs={12}>
          <Paper 
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              fontFamily: '"Outfit", sans-serif',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              
              <Box>
                <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, fontFamily: '"Outfit", sans-serif', fontSize: '1.2rem', mb: 0.25 }}>
                  Edit Contact
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem' }}>
                  Update contact information and details.
                </Typography>
              </Box>
            </Box>
            
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
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}>
            <CardHeader 
              title="Contact Information" 
              subheader="Update the contact details below"
              sx={{ 
                background: 'linear-gradient(135deg, #1D5F99 0%, #42A2C2 100%)',
                borderBottom: '1px solid #e0e0e0',
                py: 2,
                px: 2.5,
                '& .MuiCardHeader-title': {
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  fontFamily: '"Outfit", sans-serif'
                },
                '& .MuiCardHeader-subheader': {
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '0.8rem',
                  fontFamily: '"Outfit", sans-serif'
                }
              }}
            />
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Contact Type</InputLabel>
                      <Select
                        name="contactType"
                        value={contactData.contactType}
                        onChange={handleInputChange}
                        label="Contact Type"
                        disabled
                        sx={{ borderRadius: '8px' }}
                      >
                        <MenuItem value="Customer">Customer</MenuItem>
                        <MenuItem value="Company">Company</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {contactData.contactType === 'Customer' && (
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Customer Type</InputLabel>
                        <Select
                          name="customerType"
                          value={contactData.customerType}
                          onChange={handleInputChange}
                          label="Customer Type"
                          sx={{ borderRadius: '8px' }}
                        >
                          <MenuItem value="Individual">Individual</MenuItem>
                          <MenuItem value="Business">Business</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  
                  {contactData.contactType === 'Customer' && contactData.customerType === 'Business' && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Business Name"
                        name="businessName"
                        value={contactData.businessName}
                        onChange={handleInputChange}
                        margin="normal"
                        InputProps={{
                          sx: { borderRadius: '8px' }
                        }}
                      />
                    </Grid>
                  )}
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Contact Name"
                      name="contactName"
                      value={contactData.contactName}
                      onChange={handleInputChange}
                      required
                      margin="normal"
                      InputProps={{
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                  
                  {contactData.contactType === 'Company' && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Contact Person Name"
                        name="contactPersonName"
                        value={contactData.contactPersonName}
                        onChange={handleInputChange}
                        required
                        margin="normal"
                        InputProps={{
                          sx: { borderRadius: '8px' }
                        }}
                      />
                    </Grid>
                  )}
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Contact Number"
                      name="contactNumber"
                      value={contactData.contactNumber}
                      onChange={handleInputChange}
                      required
                      margin="normal"
                      InputProps={{
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                  
                  {contactData.contactType === 'Customer' && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Business Number"
                        name="businessNumber"
                        value={contactData.businessNumber}
                        onChange={handleInputChange}
                        margin="normal"
                        InputProps={{
                          sx: { borderRadius: '8px' }
                        }}
                      />
                    </Grid>
                  )}
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Opening Balance"
                      type="number"
                      name="openingBalance"
                      value={contactData.openingBalance}
                      onChange={handleInputChange}
                      margin="normal"
                      InputProps={{
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                  
                  {contactData.contactType === 'Customer' && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Credit Limit"
                        type="number"
                        name="creditLimit"
                        value={contactData.creditLimit}
                        onChange={handleInputChange}
                        margin="normal"
                        InputProps={{
                          sx: { borderRadius: '8px' }
                        }}
                      />
                    </Grid>
                  )}

                  {contactData.contactType === 'Customer' && (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="NID / Passport Number"
                          name="nidPassportNumber"
                          value={contactData.nidPassportNumber}
                          onChange={handleInputChange}
                          margin="normal"
                          InputProps={{ sx: { borderRadius: '8px' } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Guarantor Name & Contact"
                          name="guarantor"
                          value={contactData.guarantor}
                          onChange={handleInputChange}
                          margin="normal"
                          InputProps={{ sx: { borderRadius: '8px' } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Workplace"
                          name="workplace"
                          value={contactData.workplace}
                          onChange={handleInputChange}
                          margin="normal"
                          InputProps={{ sx: { borderRadius: '8px' } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Monthly Salary"
                          type="number"
                          name="salary"
                          value={contactData.salary}
                          onChange={handleInputChange}
                          margin="normal"
                          InputProps={{ sx: { borderRadius: '8px' } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Alternative Contact Number"
                          name="alternativeContactNumber"
                          value={contactData.alternativeContactNumber}
                          onChange={handleInputChange}
                          margin="normal"
                          InputProps={{ sx: { borderRadius: '8px' } }}
                        />
                      </Grid>
                    </>
                  )}
                  
                  <Grid item xs={12} md={6}>
                    {routes && (
                      <TextField
                        fullWidth
                        select
                        label="Route"
                        name="route"
                        value={contactData.route}
                        onChange={handleInputChange}
                        margin="normal"
                        InputProps={{
                          sx: { borderRadius: '8px' }
                        }}
                      >
                        {routes.map((route) => (
                          <MenuItem key={route._id} value={route._id}>
                            {route.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  </Grid>
                  
                  {contactData.contactType === 'Company' && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Business Registration Number"
                        name="businessRegistrationNumber"
                        value={contactData.businessRegistrationNumber}
                        onChange={handleInputChange}
                        margin="normal"
                        InputProps={{
                          sx: { borderRadius: '8px' }
                        }}
                      />
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      name="address"
                      value={contactData.address}
                      onChange={handleInputChange}
                      multiline
                      rows={2}
                      margin="normal"
                      InputProps={{
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Note"
                      name="note"
                      value={contactData.note}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      margin="normal"
                      InputProps={{
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }} />
                
                <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, gap: 2, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
                  <Button 
                    variant="outlined" 
                    size="large"
                    onClick={() => navigate('/contacts/customers')}
                    sx={{
                      borderRadius: '10px',
                      fontFamily: '"Outfit", sans-serif',
                      fontWeight: 600,
                      textTransform: 'none',
                      borderColor: '#e2e8f0',
                      color: '#64748b',
                      '&:hover': {
                        borderColor: '#cbd5e1',
                        backgroundColor: '#f8fafc'
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    size="large" 
                    type="submit"
                    disabled={updateContactMutation.isLoading}
                    sx={{ 
                      px: 4,
                      py: 1.25,
                      borderRadius: '10px',
                      backgroundColor: '#1D5F99',
                      fontFamily: '"Outfit", sans-serif',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(29, 95, 153, 0.25)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: '#42A2C2',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 16px rgba(29, 95, 153, 0.35)',
                      }
                    }}
                  >
                    {updateContactMutation.isLoading ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />
                        Updating...
                      </>
                    ) : 'Update Contact'}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EditContact;