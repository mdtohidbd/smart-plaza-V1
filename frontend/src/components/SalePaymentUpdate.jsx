import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import { useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';

const SalePaymentUpdate = ({ open, onClose, sale, onSuccess }) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    paidAmount: sale?.paidAmount || 0,
    dueAmount: sale?.dueAmount || 0,
    status: sale?.status || 'Partial',
    paymentMethod: sale?.paymentMethod || 'Cash'
  });
  
  const updatePaymentMutation = useMutation(
    (data) => api.put(`/api/sales/${sale._id}/payment`, data),
    {
      onSuccess: (response) => {
        onSuccess(response.data.data);
        onClose();
      },
      onError: (error) => {
        console.error('Error updating payment:', error);
        setError(error.response?.data?.message || 'Error updating payment information');
      }
    }
  );
  
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updatePaymentMutation.mutate(formData);
  };

  const total = sale?.subTotal - (sale?.discount || 0) + (sale?.tax || 0) || 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Update Payment Information - {sale?.invoiceNumber}
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Total: ৳{total.toFixed(2)}
          </Typography>
          
          <TextField
            fullWidth
            label="Paid Amount"
            name="paidAmount"
            type="number"
            value={formData.paidAmount}
            onChange={handleInputChange}
            margin="normal"
            InputProps={{
              inputProps: { 
                step: 0.01,
                min: 0
              }
            }}
          />
          
          <TextField
            fullWidth
            label="Due Amount"
            name="dueAmount"
            type="number"
            value={formData.dueAmount}
            onChange={handleInputChange}
            margin="normal"
            InputProps={{
              inputProps: { 
                step: 0.01,
                min: 0
              }
            }}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              label="Status"
            >
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Partial">Partial</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Payment Method</InputLabel>
            <Select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              label="Payment Method"
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Bank">Bank</MenuItem>
              <MenuItem value="Mobile Banking">Mobile Banking</MenuItem>
              <MenuItem value="Credit">Credit</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={updatePaymentMutation.isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={updatePaymentMutation.isLoading}
          sx={{ 
            backgroundColor: '#1D5F99',
            '&:hover': {
              backgroundColor: '#42A2C2'
            }
          }}
        >
          {updatePaymentMutation.isLoading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Updating...
            </>
          ) : 'Update Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SalePaymentUpdate;