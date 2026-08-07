import React, { useState } from 'react';
import {
  Grid,
  Box,
  Autocomplete,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const CustomerSelection = ({
  customers,
  customer,
  setCustomer,
  openCustomerDialog,
  setOpenCustomerDialog,
  newCustomer,
  setNewCustomer,
  handleCreateCustomer,
  isBusiness = false,
  isIndividual = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCustomerClick = async () => {
    setIsSubmitting(true);
    try {
      await handleCreateCustomer();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Autocomplete
            fullWidth
            size="small"
            options={customers || []}
            getOptionLabel={(option) => {
              if (option && option.contactName) {
                return `${option.contactName} - ${option.contactNumber}`;
              }
              return '';
            }}
            value={
              customers?.find(c => c._id === customer) || null
            }
            onChange={(event, newValue) => {
              if (newValue && newValue._id) {
                setCustomer(newValue._id);
              } else {
                setCustomer('');
              }
            }}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label={isBusiness ? "Business Customer *" : (isIndividual ? "Individual Customer *" : "Customer *")} 
                required
                InputProps={{
                  ...params.InputProps,
                  sx: { borderRadius: '8px' }
                }}
              />
            )}
          />
          <Button
            variant="outlined"
            onClick={() => setOpenCustomerDialog(true)}
            sx={{
              minWidth: '40px',
              width: '40px',
              p: 0,
              borderColor: '#E2E8F0',
              color: '#6366F1',
              borderRadius: '8px',
              '&:hover': { borderColor: '#6366F1', backgroundColor: 'rgba(99, 102, 241, 0.04)' }
            }}
          >
            <AddIcon sx={{ fontSize: 20 }} />
          </Button>
        </Box>
      </Grid>

      <Dialog 
        open={openCustomerDialog} 
        onClose={() => !isSubmitting && setOpenCustomerDialog(false)}
        PaperProps={{
          sx: { borderRadius: '12px', bgcolor: '#FFFFFF', color: '#1E293B' }
        }}
      >
        <DialogTitle sx={{ 
          color: '#1E293B', 
          fontWeight: 700,
          borderBottom: '1px solid #E2E8F0',
          pb: 1.5
        }}>{isBusiness ? 'Add New Business Customer' : (isIndividual ? 'Add New Individual Customer' : 'Add New Customer')}</DialogTitle>
        <DialogContent sx={{ minWidth: '420px', bgcolor: '#FFFFFF', mt: 1.5 }}>
          <Grid container spacing={1.5}>
            {isBusiness && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Business Name *"
                  value={newCustomer.businessName || ''}
                  onChange={(e) => setNewCustomer({ ...newCustomer, businessName: e.target.value })}
                  size="small" 
                  disabled={isSubmitting}
                  InputProps={{ sx: { borderRadius: '8px' } }}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={isBusiness ? "Contact Name *" : "Customer Name *"}
                value={newCustomer.contactName}
                onChange={(e) => setNewCustomer({ ...newCustomer, contactName: e.target.value })}
                size="small" 
                disabled={isSubmitting}
                InputProps={{ sx: { borderRadius: '8px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={newCustomer.contactNumber}
                onChange={(e) => setNewCustomer({ ...newCustomer, contactNumber: e.target.value })}
                size="small" 
                disabled={isSubmitting}
                InputProps={{ sx: { borderRadius: '8px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                size="small" 
                disabled={isSubmitting}
                InputProps={{ sx: { borderRadius: '8px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                size="small" 
                multiline
                rows={2}
                disabled={isSubmitting}
                InputProps={{ sx: { borderRadius: '8px' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0', bgcolor: '#FFFFFF', gap: 1 }}>
          <Button 
            onClick={() => setOpenCustomerDialog(false)}
            disabled={isSubmitting}
            sx={{
              color: '#94A3B8',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)', color: '#64748b' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddCustomerClick} 
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              backgroundColor: '#6366F1',
              color: '#FFFFFF',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#4F46E5' }
            }}
          >
            {isSubmitting ? 'Adding...' : (isBusiness ? 'Add Business' : (isIndividual ? 'Add Individual' : 'Add Customer'))}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomerSelection;
