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
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardHeader,
  CardContent,
  Divider,
  InputAdornment,
  IconButton
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../../utils/api';

const AddContact = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'supplier' || searchParams.get('type') === 'Company' ? 'Company' : 'Customer';
  const [contactType, setContactType] = useState(initialType); // 'Customer' or 'Company'
  const [customerData, setCustomerData] = useState({
    contactType: 'Customer',
    customerType: 'Individual',
    businessName: '',
    contactNumber: '',
    contactName: '',
    businessNumber: '',
    openingBalance: '',
    creditLimit: '',
    address: '',
    route: '',
    note: '',
    nidPassportNumber: '',
    guarantor: '',
    workplace: '',
    salary: '',
    alternativeContactNumber: ''
  });
  
  const [companyData, setCompanyData] = useState({
    name: '',
    contactNumber: '',
    contactName: '',
    email: '',
    openingBalance: '',
    address: '',
    note: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentSubmitType, setCurrentSubmitType] = useState('');

  const queryClient = useQueryClient();

  // Fetch routes if needed
  const { data: routes } = useQuery('routes', async () => {
    const response = await api.get('/api/routes');
    return response.data.data;
  });

  // Mutation for creating customer
  const createCustomerMutation = useMutation(
    (customerData) => api.post('/api/contacts/customers', customerData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
        setCustomerData({
          contactType: 'Customer',
          customerType: 'Individual',
          businessName: '',
          contactNumber: '',
          contactName: '',
          businessNumber: '',
          openingBalance: '',
          creditLimit: '',
          address: '',
          route: '',
          note: '',
          nidPassportNumber: '',
          guarantor: '',
          workplace: '',
          salary: '',
          alternativeContactNumber: ''
        });
        setSuccess('Customer created successfully!');
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (error) => {
        setError(error.response?.data?.message || error.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  );

  // Mutation for creating company
  const createCompanyMutation = useMutation(
    (companyData) => api.post('/api/suppliers', companyData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('companies');
        setCompanyData({
          name: '',
          contactNumber: '',
          contactName: '',
          email: '',
          openingBalance: '',
          address: '',
          note: ''
        });
        setSuccess('Company created successfully!');
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (error) => {
        setError(error.response?.data?.message || error.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  );

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerData({
      ...customerData,
      [name]: value
    });
  };

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompanyData({
      ...companyData,
      [name]: value
    });
  };

  const handleTabChange = (event, newValue) => {
    setContactType(newValue);
  };

  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    setCurrentSubmitType('customer');
    setShowConfirmation(true);
  };

  const handleCompanySubmit = (e) => {
    e.preventDefault();
    setCurrentSubmitType('company');
    setShowConfirmation(true);
  };

  const confirmSubmit = () => {
    setShowConfirmation(false);
    
    if (currentSubmitType === 'customer') {
      createCustomerMutation.mutate(customerData);
    } else if (currentSubmitType === 'company') {
      createCompanyMutation.mutate(companyData);
    }
  };

  const cancelSubmit = () => {
    setShowConfirmation(false);
  };

  return (
    <Box sx={{ py: { xs: 1, sm: 2 }, backgroundColor: '#F8FAFC' }}>
      <Grid container spacing={1.5}>
        
        <Grid item xs={12}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}>
            <CardHeader 
              avatar={
                <IconButton 
                  onClick={() => navigate(-1)} 
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.15)', 
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    p: 0.75,
                    mr: -0.5
                  }}
                >
                  <ArrowBackIcon sx={{ fontSize: '1.1rem' }} />
                </IconButton>
              }
              title="Contact Information" 
              subheader="Fill in the contact details below"
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
              <Tabs 
                value={contactType} 
                onChange={handleTabChange} 
                sx={{ 
                  mb: 2,
                  '& .MuiTab-root': {
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    minHeight: 40,
                    color: '#64748b',
                  },
                  '& .Mui-selected': {
                    color: '#1D5F99 !important',
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#1D5F99',
                    height: 3,
                    borderRadius: '3px 3px 0 0'
                  }
                }}
              >
                <Tab value="Customer" label="Customer" />
                <Tab value="Company" label="Company" />
              </Tabs>
              
              {contactType === 'Customer' ? (
                <form onSubmit={handleCustomerSubmit}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Customer Type</InputLabel>
                        <Select
                          name="customerType"
                          value={customerData.customerType}
                          onChange={handleCustomerChange}
                          label="Customer Type"
                          sx={{ borderRadius: '8px' }}
                        >
                          <MenuItem value="Individual">Individual</MenuItem>
                          <MenuItem value="Business">Business</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {customerData.customerType === 'Business' && (
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth size="small" label="Business Name" name="businessName" value={customerData.businessName} onChange={handleCustomerChange} />
                      </Grid>
                    )}
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth size="small" label="Contact Name" name="contactName" value={customerData.contactName} onChange={handleCustomerChange} required />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth size="small" label="Contact Number" name="contactNumber" value={customerData.contactNumber} onChange={handleCustomerChange} required />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth size="small" label="Business Number" name="businessNumber" value={customerData.businessNumber} onChange={handleCustomerChange} />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth size="small" label="Opening Balance" type="number" name="openingBalance" value={customerData.openingBalance} onChange={handleCustomerChange}
                        helperText="Initial balance (৳)" InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }} inputProps={{ step: '0.01', min: '0' }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth size="small" label="Credit Limit" type="number" name="creditLimit" value={customerData.creditLimit} onChange={handleCustomerChange} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth size="small" label="NID / Passport Number" name="nidPassportNumber" value={customerData.nidPassportNumber} onChange={handleCustomerChange} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth size="small" label="Guarantor Name & Contact" name="guarantor" value={customerData.guarantor} onChange={handleCustomerChange} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth size="small" label="Workplace" name="workplace" value={customerData.workplace} onChange={handleCustomerChange} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth size="small" label="Monthly Salary" type="number" name="salary" value={customerData.salary} onChange={handleCustomerChange}
                        InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }} inputProps={{ step: '1', min: '0' }} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth size="small" label="Alternative Contact Number" name="alternativeContactNumber" value={customerData.alternativeContactNumber} onChange={handleCustomerChange} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Address" name="address" value={customerData.address} onChange={handleCustomerChange} multiline rows={2} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Note" name="note" value={customerData.note} onChange={handleCustomerChange} multiline rows={2} />
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Button 
                      variant="contained" 
                      size="large" 
                      type="submit"
                      fullWidth
                      disabled={createCustomerMutation.isLoading}
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
                        },
                        maxWidth: { sm: '220px' }
                      }}
                    >
                      {createCustomerMutation.isLoading ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />
                          Creating...
                        </>
                      ) : 'Create Customer'}
                    </Button>
                  </Box>
                </form>
              ) : (
                <form onSubmit={handleCompanySubmit}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth size="small" label="Supplier / Company Name" name="name" value={companyData.name} onChange={handleCompanyChange} required />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth size="small" label="Contact Number" name="contactNumber" value={companyData.contactNumber} onChange={handleCompanyChange} required />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth size="small" label="Contact Person Name" name="contactName" value={companyData.contactName} onChange={handleCompanyChange} required />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth size="small" label="Email" type="email" name="email" value={companyData.email} onChange={handleCompanyChange} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth size="small" label="Opening Balance" type="number" name="openingBalance" value={companyData.openingBalance} onChange={handleCompanyChange}
                        helperText="Initial balance (৳)" InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }} inputProps={{ step: '0.01', min: '0' }} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Address" name="address" value={companyData.address} onChange={handleCompanyChange} multiline rows={2} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Note" name="note" value={companyData.note} onChange={handleCompanyChange} multiline rows={2} />
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Button 
                      variant="contained" 
                      size="large" 
                      type="submit"
                      fullWidth
                      disabled={createCompanyMutation.isLoading}
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
                        },
                        maxWidth: { sm: '220px' }
                      }}
                    >
                      {createCompanyMutation.isLoading ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />
                          Creating...
                        </>
                      ) : 'Create Company'}
                    </Button>
                  </Box>
                </form>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmation}
        onClose={cancelSubmit}
      >
        <DialogTitle sx={{ bgcolor: '#F8FAFC', color: '#1e293b', fontWeight: 600, fontSize: '1.2rem', p: 2, borderBottom: '1px solid #eaeef3' }}>Confirm Creation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to create this {currentSubmitType}? Please verify all information is correct.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eaeef3', bgcolor: '#F8FAFC' }}>
          <Button onClick={cancelSubmit}>Cancel</Button>
          <Button onClick={confirmSubmit} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddContact;