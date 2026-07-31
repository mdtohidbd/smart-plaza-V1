import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Grid,
  InputAdornment,
  Paper
} from '@mui/material';
import { useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';

const SaleExpensesUpdate = ({ open, onClose, sale, onSuccess }) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    deliveryCharge: 0,
    installationCost: 0,
    additionalExpense: 0,
    cardCharge: 0
  });
  
  const [error, setError] = useState('');

  useEffect(() => {
    if (sale && open) {
      setFormData({
        deliveryCharge: Number(sale.deliveryCharge) || 0,
        installationCost: Number(sale.installationCost) || 0,
        additionalExpense: Number(sale.additionalExpense) || 0,
        cardCharge: Number(sale.cardCharge) || 0
      });
      setError('');
    }
  }, [sale, open]);

  const updateExpensesMutation = useMutation(
    (data) => api.put(`/api/sales/${sale._id}/expenses`, data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('sales');
        queryClient.invalidateQueries(['sale', sale?._id]);
        queryClient.invalidateQueries('dashboardData');
        if (onSuccess) {
          onSuccess(response.data.data);
        }
        onClose();
      },
      onError: (err) => {
        console.error('Error updating sale expenses:', err);
        setError(err.response?.data?.message || 'Error updating sale expenses and charges');
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : Math.max(0, Number(value) || 0)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateExpensesMutation.mutate({
      deliveryCharge: Number(formData.deliveryCharge) || 0,
      installationCost: Number(formData.installationCost) || 0,
      additionalExpense: Number(formData.additionalExpense) || 0,
      cardCharge: Number(formData.cardCharge) || 0
    });
  };

  const oldExpensesTotal = (Number(sale?.deliveryCharge) || 0) + 
                           (Number(sale?.installationCost) || 0) + 
                           (Number(sale?.additionalExpense) || 0) + 
                           (Number(sale?.cardCharge) || 0);

  const newExpensesTotal = (Number(formData.deliveryCharge) || 0) + 
                           (Number(formData.installationCost) || 0) + 
                           (Number(formData.additionalExpense) || 0) + 
                           (Number(formData.cardCharge) || 0);

  const diff = newExpensesTotal - oldExpensesTotal;
  const newGrandTotal = Math.max(0, (Number(sale?.total) || 0) + diff);
  const newDueAmount = Math.max(0, (Number(sale?.dueAmount) || 0) + diff);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: '#1E293B' }}>
        Edit Invoice Expenses & Charges - {sale?.invoiceNumber}
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Delivery Charge"
                name="deliveryCharge"
                type="number"
                value={formData.deliveryCharge}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                  inputProps: { min: 0, step: "any" }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Installation Cost"
                name="installationCost"
                type="number"
                value={formData.installationCost}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                  inputProps: { min: 0, step: "any" }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Additional Expense"
                name="additionalExpense"
                type="number"
                value={formData.additionalExpense}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                  inputProps: { min: 0, step: "any" }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Card Charge"
                name="cardCharge"
                type="number"
                value={formData.cardCharge}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                  inputProps: { min: 0, step: "any" }
                }}
              />
            </Grid>
          </Grid>

          {/* Real-time Calculation Summary */}
          <Paper
            variant="outlined"
            sx={{
              mt: 3,
              p: 2,
              borderRadius: '10px',
              bgcolor: '#F8FAFC',
              borderColor: '#E2E8F0'
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 1 }}>
              Calculation Preview
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Old Expenses:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>৳{oldExpensesTotal.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#64748B' }}>New Expenses:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: diff !== 0 ? '#6366F1' : 'inherit' }}>
                  ৳{newExpensesTotal.toFixed(2)} {diff !== 0 && `(${diff > 0 ? '+' : ''}${diff.toFixed(2)})`}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#64748B' }}>New Grand Total:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  ৳{newGrandTotal.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#64748B' }}>New Due Amount:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: newDueAmount > 0 ? '#EF4444' : '#10B981' }}>
                  ৳{newDueAmount.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={updateExpensesMutation.isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={updateExpensesMutation.isLoading}
          sx={{
            bgcolor: '#6366F1',
            '&:hover': { bgcolor: '#4F46E5' },
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          {updateExpensesMutation.isLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaleExpensesUpdate;
