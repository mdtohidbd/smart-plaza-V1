import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  MenuItem,
  CircularProgress,
  InputAdornment,
  Snackbar,
  Alert,
  Chip,
  Divider,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Payments as PaymentsIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  MonetizationOn as CashIcon,
  CreditCard as CardIcon,
  PhoneAndroid as MfsIcon,
  AccountBalance as BankIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const METHOD_ICONS = {
  cash: <CashIcon sx={{ fontSize: 16 }} />,
  card: <CardIcon sx={{ fontSize: 16 }} />,
  bkash: <MfsIcon sx={{ fontSize: 16 }} />,
  nagad: <MfsIcon sx={{ fontSize: 16 }} />,
  cheque: <BankIcon sx={{ fontSize: 16 }} />
};

const METHOD_COLORS = {
  cash: '#10B981',
  card: '#8B5CF6',
  bkash: '#D12C69',
  nagad: '#F97316',
  cheque: '#3B82F6'
};

const METHOD_LABELS = {
  cash: 'Cash',
  card: 'Card',
  bkash: 'bKash',
  nagad: 'Nagad',
  cheque: 'Cheque'
};

const PAYMENT_METHODS = ['cash', 'card', 'bkash', 'nagad', 'cheque'];

const EMICollectionModal = ({ open, onClose, installment, onSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    collectedAmount: '',
    lateFee: 0,
    paymentMethod: 'cash',
    transactionId: '',
    notes: '',
    collectedBy: ''
  });
  const [employees, setEmployees] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (installment) {
      const remainingAmount = installment.amount - (installment.paidAmount || 0);
      setFormData({
        collectedAmount: Math.round(remainingAmount),
        lateFee: Math.round(installment.recommendedLateFee || 0),
        paymentMethod: 'cash',
        transactionId: '',
        notes: '',
        collectedBy: ''
      });
    }
  }, [installment]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get('/api/users');
        if (res.data && res.data.data) {
          const staff = res.data.data.filter(u =>
            u.role !== 'Online Customer' &&
            u.role !== 'Customer' &&
            u.role !== 'Investor' &&
            u.isActive !== false
          );
          setEmployees(staff);
        }
      } catch (err) {
        console.error('Failed to fetch employees', err);
      }
    };
    if (open) fetchEmployees();
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const showMessage = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(formData.collectedAmount) <= 0) {
      showMessage('Collected amount must be greater than zero.', 'error');
      return;
    }

    try {
      setLoading(true);
      const customerId = typeof installment.customer === 'object' && installment.customer !== null
        ? installment.customer._id || installment.customer.id
        : installment.customer;

      let customerName = installment.customerName;
      if (!customerName) {
        if (typeof installment.customer === 'object' && installment.customer !== null) {
          customerName = installment.customer.name || `${installment.customer.firstName || ''} ${installment.customer.lastName || ''}`.trim();
        }
      }
      if (!customerName) customerName = 'Unknown Customer';

      const payload = {
        emiInvoice: installment.invoice || installment.emiInvoice,
        invoiceNumber: installment.invoiceNumber || 'N/A',
        customer: customerId,
        customerName,
        customerPhone: installment.customerPhone || (installment.customer?.phone) || 'N/A',
        instalmentNumber: installment.instalmentNumber,
        dueDate: installment.dueDate,
        scheduledAmount: installment.amount,
        collectedAmount: Number(formData.collectedAmount) + Number(formData.lateFee),
        lateFee: Number(formData.lateFee),
        paymentMethod: formData.paymentMethod,
        transactionId: formData.transactionId,
        notes: formData.notes,
        collectedBy: formData.collectedBy || undefined
      };

      const res = await api.post('/api/emi/collections', payload);
      if (res.data.success) {
        onSuccess();
        onClose();
        navigate('/dashboard/emi/collections-list');
      }
    } catch (error) {
      console.error('Error recording collection:', error);
      showMessage(error.response?.data?.message || 'Failed to record collection', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!installment) return null;

  const remainingAmount = installment.amount - (installment.paidAmount || 0);
  const daysOverdue = installment.daysOverdue || 0;
  const monthsOverdue = daysOverdue > 0 ? Math.ceil(daysOverdue / 30) : 0;
  const recommendedLateFee = installment.recommendedLateFee || 0;
  const isOverdue = daysOverdue > 0;
  const totalPayable = Number(formData.collectedAmount || 0) + Number(formData.lateFee || 0);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            maxHeight: '92vh',
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
          color: '#fff',
          px: 2.5, py: 2,
          position: 'relative'
        }}>
          <IconButton onClick={onClose} size="small" sx={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: 'Outfit, sans-serif', mb: 0.25 }}>
            Record Payment
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', opacity: 0.8, fontFamily: 'Inter, sans-serif' }}>
            {installment.invoiceNumber} · {installment.customerName}
          </Typography>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          {/* Info Strip */}
          <Box sx={{ display: 'flex', bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <Box sx={{ flex: 1, p: 1.5, borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Instalment</Typography>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>#{installment.instalmentNumber}</Typography>
            </Box>
            <Box sx={{ flex: 1, p: 1.5, borderRight: '1px solid #E2E8F0', textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Due Date</Typography>
              <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: isOverdue ? '#DC2626' : '#0F172A' }}>
                {new Date(installment.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, p: 1.5, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Due Amount</Typography>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#DC2626', fontFamily: 'Outfit, sans-serif' }}>৳{remainingAmount.toLocaleString()}</Typography>
            </Box>
          </Box>

          {/* Late Fee Breakdown (only show if overdue) */}
          {isOverdue && (
            <Box sx={{
              mx: 2, mt: 1.5, p: 1.5,
              bgcolor: '#FEF2F2',
              borderRadius: '10px',
              border: '1px solid #FECACA',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                <WarningIcon sx={{ fontSize: 15, color: '#DC2626' }} />
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#DC2626' }}>
                  Overdue by {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} ({monthsOverdue} month{monthsOverdue !== 1 ? 's' : ''})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 0.25 }}>
                <InfoIcon sx={{ fontSize: 13, color: '#92400E' }} />
                <Typography sx={{ fontSize: '0.72rem', color: '#92400E', lineHeight: 1.3 }}>
                  Late fee: {monthsOverdue} month{monthsOverdue !== 1 ? 's' : ''} × 1% × ৳{(installment.subtotal || remainingAmount).toLocaleString()} = <strong>৳{recommendedLateFee.toLocaleString()}</strong>
                  {(installment.lateFeePaid > 0) && <> (already paid: ৳{installment.lateFeePaid})</>}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Form */}
          <Box component="form" id="collection-form" onSubmit={handleSubmit} sx={{ px: 2, pt: 1.5, pb: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Amount Row */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                fullWidth
                label="Collected Amount"
                name="collectedAmount"
                type="number"
                size="small"
                value={formData.collectedAmount}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>৳</Typography></InputAdornment>,
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontWeight: 600 } }}
              />
              <TextField
                fullWidth
                label="Late Fee"
                name="lateFee"
                type="number"
                size="small"
                value={formData.lateFee}
                onChange={handleChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>৳</Typography></InputAdornment>,
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontWeight: 600 } }}
              />
            </Box>

            {/* Payment Method Selector & Transaction */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Payment Method *
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {PAYMENT_METHODS.map(m => (
                  <Box
                    key={m}
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: m }))}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      cursor: 'pointer',
                      px: 1, py: 0.6, borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                      border: `1.5px solid ${formData.paymentMethod === m ? METHOD_COLORS[m] : '#E2E8F0'}`,
                      backgroundColor: formData.paymentMethod === m ? METHOD_COLORS[m] + '18' : 'transparent',
                      color: formData.paymentMethod === m ? METHOD_COLORS[m] : '#64748B',
                      transition: 'all .15s',
                      '&:hover': { borderColor: METHOD_COLORS[m], color: METHOD_COLORS[m] }
                    }}
                  >
                    {METHOD_ICONS[m]}
                    <span>{METHOD_LABELS[m]}</span>
                  </Box>
                ))}
              </Box>
            </Box>
            <TextField
              fullWidth
              label="Txn ID / Ref"
              name="transactionId"
              size="small"
              value={formData.transactionId}
              onChange={handleChange}
              placeholder="Optional"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            {/* Collected By & Notes */}
            <TextField
              select
              fullWidth
              label="Collected By"
              name="collectedBy"
              size="small"
              value={formData.collectedBy}
              onChange={handleChange}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            >
              <MenuItem value="">
                <em>Current User (Default)</em>
              </MenuItem>
              {employees.map(emp => (
                <MenuItem key={emp._id} value={emp._id}>
                  {emp.name} — <span style={{ color: '#64748B', fontSize: '0.8rem' }}>{emp.role}</span>
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Notes"
              name="notes"
              size="small"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={2}
              placeholder="Optional notes..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            {/* Total Payable Summary */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '10px',
              px: 2, py: 1.25
            }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#166534' }}>Total Payable</Typography>
              <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#15803D', fontFamily: 'Outfit, sans-serif' }}>
                ৳{totalPayable.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 2, py: 1.5, borderTop: '1px solid #E2E8F0', bgcolor: '#FAFAFA' }}>
          <Button onClick={onClose} disabled={loading} sx={{ borderRadius: '10px', textTransform: 'none', color: '#64748B', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="collection-form"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PaymentsIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              px: 3,
              fontWeight: 700,
              bgcolor: '#0F766E',
              boxShadow: '0 3px 10px rgba(15,118,110,0.3)',
              '&:hover': { bgcolor: '#0D9488' },
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(p => ({ ...p, open: false }))}>
        <Alert onClose={() => setSnackbar(p => ({ ...p, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EMICollectionModal;
