import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  TextField,
  MenuItem,
  Button,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { format } from 'date-fns';
import api from '../../utils/api';

const EditInstalmentModal = ({ open, onClose, invoice, instalment, onSuccess }) => {
  const [status, setStatus] = useState('pending');
  const [paidDate, setPaidDate] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [lateFee, setLateFee] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (instalment) {
      setStatus(instalment.status || 'pending');
      const formattedDate = instalment.paidDate
        ? format(new Date(instalment.paidDate), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');
      setPaidDate(formattedDate);
      setPaidAmount(
        instalment.paidAmount !== undefined
          ? instalment.paidAmount.toString()
          : (instalment.status === 'paid' ? (instalment.amount || 0).toString() : '0')
      );
      setLateFee((instalment.lateFeePaid || 0).toString());
      setPaymentMethod(instalment.paymentMethod || 'cash');
      setNotes(instalment.notes || '');
      setError('');
    }
  }, [instalment, open]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!invoice || !instalment) return;

    setLoading(true);
    setError('');

    try {
      let finalPaidAmount = parseFloat(paidAmount) || 0;
      if (status === 'paid' && finalPaidAmount === 0) {
        finalPaidAmount = instalment.amount || 0;
      } else if (status === 'pending') {
        finalPaidAmount = 0;
      }

      const payload = {
        status,
        paidDate: status === 'pending' ? null : paidDate,
        paidAmount: finalPaidAmount,
        lateFee: parseFloat(lateFee) || 0,
        paymentMethod,
        notes
      };

      const response = await api.put(
        `/api/emi/invoices/${invoice._id}/instalment/${instalment.instalmentNumber}`,
        payload
      );

      if (response.data?.success) {
        if (onSuccess) onSuccess(response.data.data);
        onClose();
      }
    } catch (err) {
      console.error('Failed to update instalment:', err);
      setError(err.response?.data?.message || 'Failed to update instalment');
    } finally {
      setLoading(false);
    }
  };

  const getWarningText = () => {
    switch (status) {
      case 'pending':
        return 'Setting to pending will reverse the payment — the Income ledger entry will be removed and invoice balance will update.';
      case 'paid':
        return 'Setting to paid will record an Income ledger entry and mark this instalment as complete.';
      case 'partial':
        return 'Setting to partial will record a partial payment against this instalment balance.';
      case 'overdue':
        return 'Setting to overdue will mark this instalment for collection follow-up.';
      case 'waived':
        return 'Setting to waived will forgive this instalment amount without adding to income ledger.';
      default:
        return '';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }
      }}
    >
      {/* Vibrant Blue Header Banner matching Screenshot 2 & 3 */}
      <Box
        sx={{
          bgcolor: '#2563EB',
          color: '#FFFFFF',
          p: 2.5,
          position: 'relative'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            fontSize: '1.25rem',
            fontFamily: '"Outfit", sans-serif',
            lineHeight: 1.2
          }}
        >
          Edit Instalment
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '0.9rem',
            fontWeight: 500,
            mt: 0.5
          }}
        >
          Month {instalment?.instalmentNumber} - ৳{(instalment?.amount || 0).toLocaleString()}
        </Typography>

        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 12,
            top: 12,
            color: '#FFFFFF',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.15)' }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <form onSubmit={handleSave}>
        <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {error && (
            <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>
              {error}
            </Typography>
          )}

          {/* Payment Status Dropdown */}
          <TextField
            select
            fullWidth
            label="Payment Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            variant="outlined"
            size="medium"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                '&.Mui-focused fieldset': { borderColor: '#10B981' }
              }
            }}
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="partial">Partial</MenuItem>
            <MenuItem value="overdue">Overdue</MenuItem>
            <MenuItem value="waived">Waived</MenuItem>
          </TextField>

          {/* Paid Date Input */}
          <TextField
            fullWidth
            type="date"
            label="Paid Date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px'
              }
            }}
          />

          {/* Paid Amount Input */}
          <TextField
            fullWidth
            type="number"
            label="Paid Amount"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            variant="outlined"
            InputProps={{
              startAdornment: <InputAdornment position="start" sx={{ color: '#475569', fontWeight: 700 }}>৳</InputAdornment>
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px'
              }
            }}
          />

          {/* Late Fee Input */}
          <TextField
            fullWidth
            type="number"
            label="Late Fee"
            value={lateFee}
            onChange={(e) => setLateFee(e.target.value)}
            variant="outlined"
            InputProps={{
              startAdornment: <InputAdornment position="start" sx={{ color: '#475569', fontWeight: 700 }}>৳</InputAdornment>
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px'
              }
            }}
          />

          {/* Payment Method Select */}
          <TextField
            select
            fullWidth
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px'
              }
            }}
          >
            <MenuItem value="cash">cash</MenuItem>
            <MenuItem value="bkash">bKash</MenuItem>
            <MenuItem value="nagad">Nagad</MenuItem>
            <MenuItem value="rocket">Rocket</MenuItem>
            <MenuItem value="mfs">MFS (Mobile Banking)</MenuItem>
            <MenuItem value="card">Card</MenuItem>
            <MenuItem value="bank">Bank Transfer</MenuItem>
          </TextField>

          {/* Notes Multiline */}
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Notes"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px'
              }
            }}
          />

          {/* Warning / Notice Box at Bottom matching Screenshot 2 & 3 */}
          {getWarningText() && (
            <Box
              sx={{
                p: 2,
                bgcolor: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '12px',
                display: 'flex',
                gap: 1.5,
                alignItems: 'flex-start'
              }}
            >
              <WarningAmberIcon sx={{ color: '#D97706', fontSize: 24, mt: 0.2, flexShrink: 0 }} />
              <Typography
                variant="body2"
                sx={{
                  color: '#92400E',
                  fontSize: '0.85rem',
                  lineHeight: 1.45,
                  fontWeight: 500
                }}
              >
                {getWarningText()}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 0, justifyContent: 'flex-end', gap: 1 }}>
          <Button
            onClick={onClose}
            disabled={loading}
            sx={{
              textTransform: 'none',
              color: '#64748B',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: '#1D4ED8',
              color: '#FFFFFF',
              borderRadius: '10px',
              px: 3,
              py: 1,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.9rem',
              '&:hover': {
                bgcolor: '#1E40AF'
              },
              boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)'
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditInstalmentModal;
