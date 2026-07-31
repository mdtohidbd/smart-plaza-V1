import React from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';
import api from '../utils/api';

const TransferInvoiceModal = ({ open, onClose, transfer, isReturn = false }) => {
  
  const handleDownloadInvoice = () => {
    if (transfer?._id) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('No authorization token found. Please log in again.');
          return;
        }
        window.open(`${api.defaults.baseURL}/api/transfers/${transfer._id}/invoice?action=download&token=${encodeURIComponent(token)}`, '_blank');
      } catch (error) {
        alert('Error downloading invoice: ' + error.message);
      }
    }
  };

  const handleOpenInvoicePrint = () => {
    if (transfer?._id) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('No authorization token found. Please log in again.');
          return;
        }
        window.open(`${api.defaults.baseURL}/api/transfers/${transfer._id}/invoice?action=view&token=${encodeURIComponent(token)}`, '_blank');
      } catch (error) {
        alert('Error viewing invoice: ' + error.message);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: '#1D5F99', fontWeight: 600 }}>
        {isReturn ? 'Return Processed Successfully' : 'Transfer Created Successfully'}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="h6" sx={{ mb: 2, color: '#1D5F99' }}>
          Reference #{transfer?.referenceNumber || 'N/A'}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {isReturn 
            ? 'The returned items have been successfully logged and added back to inventory.' 
            : 'The product transfer has been successfully logged and items have been deducted from inventory.'}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Contact:</strong> {transfer?.contact?.contactName || transfer?.contact?.name || 'N/A'}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Date:</strong> {transfer?.date ? new Date(transfer.date).toLocaleDateString() : 'N/A'}
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          <strong>Status:</strong> {transfer?.status || 'N/A'}
        </Typography>
        
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
          What would you like to do next?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 3, gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button 
          onClick={handleDownloadInvoice}
          variant="contained"
          sx={{ 
            backgroundColor: '#1D5F99',
            '&:hover': { backgroundColor: '#42A2C2' },
            borderRadius: '8px',
            px: 2
          }}
        >
          Download Invoice
        </Button>
        <Button 
          onClick={handleOpenInvoicePrint}
          variant="outlined"
          sx={{ 
            color: '#1D5F99',
            borderColor: '#1D5F99',
            '&:hover': { backgroundColor: '#1D5F99', color: 'white' },
            borderRadius: '8px',
            px: 2
          }}
        >
          View & Print Invoice
        </Button>
        <Button 
          onClick={onClose}
          sx={{ 
            color: '#666',
            borderColor: '#ccc',
            '&:hover': { backgroundColor: '#f5f5f5' },
            borderRadius: '8px',
            px: 2
          }}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferInvoiceModal;
