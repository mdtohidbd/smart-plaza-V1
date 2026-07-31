import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  Divider,
  CircularProgress,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  MonetizationOn as CashIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  PhoneAndroid as MfsIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import api from '../../../utils/api';

const METHOD_ICONS = {
  Cash: <CashIcon sx={{ fontSize: 16 }} />,
  Bank: <BankIcon sx={{ fontSize: 16 }} />,
  Card: <CardIcon sx={{ fontSize: 16 }} />,
  MFS: <MfsIcon sx={{ fontSize: 16 }} />
};

const METHOD_COLORS = {
  Cash: '#10B981',
  Bank: '#3B82F6',
  Card: '#8B5CF6',
  MFS: '#F59E0B'
};

const PAYMENT_METHODS = ['Cash', 'Bank', 'Card', 'MFS'];

const emptyEntry = () => ({
  method: 'Cash',
  amount: '',
  posMachine: null,
  posMachineName: '',
  mfsProvider: null,
  mfsProviderName: '',
  feePercentage: 0,
  feeAmount: 0,
  bankName: ''
});

/**
 * SplitPaymentPanel — replaces the single Payment Method + Paid Amount fields.
 * Allows adding multiple payment entries (Cash, Bank, Card, MFS).
 * Emits `onPaymentsChange(paymentsArray, totalPaid)` on each change.
 */
const SplitPaymentPanel = ({ grandTotal = 0, initialPayments, onPaymentsChange, disabled = false, autoSyncGrandTotal = true }) => {
  const [entries, setEntries] = useState(
    initialPayments && initialPayments.length > 0 
      ? initialPayments.map(p => ({ ...emptyEntry(), ...p }))
      : [{ ...emptyEntry(), amount: grandTotal || '' }]
  );

  const lastLoadedJsonRef = useRef(null);
  const lastEmittedJsonRef = useRef(null);

  // When initialPayments arrive (e.g. from async fetch in edit modal)
  useEffect(() => {
    if (initialPayments && initialPayments.length > 0) {
      const json = JSON.stringify(initialPayments);
      if (json !== lastLoadedJsonRef.current && json !== lastEmittedJsonRef.current) {
        lastLoadedJsonRef.current = json;
        lastEmittedJsonRef.current = json;
        setEntries(initialPayments.map(p => ({ ...emptyEntry(), ...p })));
      }
    }
  }, [initialPayments]);

  // Fetch POS Machines for Card entries
  const { data: posMachinesRes, isLoading: loadingPOS } = useQuery(
    'pos-machines',
    () => api.get('/api/pos-machines').then(r => r.data.data),
    { refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 }
  );

  // Fetch MFS Providers for MFS entries
  const { data: mfsProvidersRes, isLoading: loadingMFS } = useQuery(
    'mfs-providers',
    () => api.get('/api/mfs-providers').then(r => r.data.data),
    { refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 }
  );

  const posMachines = posMachinesRes || [];
  const mfsProviders = mfsProvidersRes || [];

  const totalPaid = useMemo(
    () => entries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
    [entries]
  );

  const remaining = useMemo(() => grandTotal - totalPaid, [grandTotal, totalPaid]);

  // Notify parent whenever entries change
  useEffect(() => {
    const validEntries = entries
      .filter(e => parseFloat(e.amount) > 0)
      .map(e => ({
        method: e.method,
        amount: parseFloat(e.amount) || 0,
        posMachine: e.posMachine?._id || e.posMachine || null,
        posMachineName: e.posMachineName || '',
        mfsProvider: e.mfsProvider?._id || e.mfsProvider || null,
        mfsProviderName: e.mfsProviderName || '',
        feePercentage: parseFloat(e.feePercentage) || 0,
        feeAmount: parseFloat(e.feeAmount) || 0,
        bankName: e.bankName || ''
      }));
    const json = JSON.stringify(validEntries);
    if (json !== lastEmittedJsonRef.current) {
      lastEmittedJsonRef.current = json;
      onPaymentsChange(validEntries, totalPaid);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, totalPaid]);

  // Sync first entry amount when grandTotal changes (only if autoSyncGrandTotal is enabled and there's 1 entry)
  useEffect(() => {
    if (autoSyncGrandTotal && entries.length === 1) {
      setEntries(prev => {
        const currAmt = parseFloat(prev[0].amount) || 0;
        if (currAmt === grandTotal) return prev;
        return [{ ...prev[0], amount: grandTotal > 0 ? grandTotal : '' }];
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grandTotal, autoSyncGrandTotal]);

  const updateEntry = (index, field, value) => {
    setEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // If MFS method changes provider, recalculate fee
      if (field === 'mfsProvider' && value) {
        const provider = mfsProviders.find(p => p._id === (value._id || value));
        if (provider) {
          updated[index].feePercentage = provider.feePerThousand || 0;
          const amt = parseFloat(updated[index].amount) || 0;
          updated[index].feeAmount = parseFloat(((amt * (provider.feePerThousand || 0)) / 1000).toFixed(2));
          updated[index].mfsProviderName = provider.name;
        }
      }

      // Recalculate fee when amount changes
      if (field === 'amount' && updated[index].feePercentage) {
        const amt = parseFloat(value) || 0;
        if (updated[index].method === 'MFS') {
          updated[index].feeAmount = parseFloat(((amt * updated[index].feePercentage) / 1000).toFixed(2));
        } else if (updated[index].method === 'Card') {
          updated[index].feeAmount = parseFloat(((amt * updated[index].feePercentage) / 100).toFixed(2));
        }
      }

      // If POS machine selected, store name and fee
      if (field === 'posMachine' && value) {
        const machine = posMachines.find(m => m._id === (value._id || value));
        if (machine) {
          updated[index].posMachineName = machine.name;
          updated[index].feePercentage = machine.feePercentage || 0;
          const amt = parseFloat(updated[index].amount) || 0;
          updated[index].feeAmount = parseFloat(((amt * (machine.feePercentage || 0)) / 100).toFixed(2));
        }
      }

      return updated;
    });
  };

  const addEntry = () => {
    setEntries(prev => [...prev, { ...emptyEntry(), amount: Math.max(0, remaining).toFixed(2) }]);
  };

  const removeEntry = (index) => {
    if (entries.length === 1) return;
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleMethodChange = (index, method) => {
    setEntries(prev => {
      const updated = [...prev];
      updated[index] = {
        ...emptyEntry(),
        amount: updated[index].amount,
        method
      };
      return updated;
    });
  };

  const isFullyPaid = Math.abs(remaining) < 0.01;
  const isOverPaid = remaining < -0.01;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '13px' }}>
          Payment Method(s)
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon sx={{ fontSize: 14 }} />}
          onClick={addEntry}
          disabled={disabled || entries.length >= 4}
          sx={{ fontSize: '11px', textTransform: 'none', borderRadius: '6px', py: 0.25 }}
          variant="outlined"
        >
          Split
        </Button>
      </Box>

      {entries.map((entry, index) => (
        <Paper
          key={index}
          variant="outlined"
          sx={{
            p: 1.25,
            mb: 1,
            borderRadius: '10px',
            borderColor: METHOD_COLORS[entry.method] + '55',
            backgroundColor: METHOD_COLORS[entry.method] + '08',
            position: 'relative'
          }}
        >
          {/* Method selector + amount row */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: entry.method === 'Cash' ? 0 : 1 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Amount (৳)"
                type="number"
                value={entry.amount}
                onChange={(e) => updateEntry(index, 'amount', e.target.value)}
                size="small"
                disabled={disabled}
                inputProps={{ min: 0 }}
                InputProps={{ sx: { borderRadius: '8px', fontSize: '13px' } }}
              />
              {entries.length > 1 && (
                <IconButton
                  size="small"
                  onClick={() => removeEntry(index)}
                  disabled={disabled}
                  sx={{ color: '#EF4444', '&:hover': { backgroundColor: '#FEE2E2' } }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {PAYMENT_METHODS.map(m => (
                <Tooltip key={m} title={m}>
                  <Box
                    onClick={() => !disabled && handleMethodChange(index, m)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.4,
                      cursor: disabled ? 'default' : 'pointer',
                      px: 0.75, py: 0.4, borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                      border: `1.5px solid ${entry.method === m ? METHOD_COLORS[m] : '#E2E8F0'}`,
                      backgroundColor: entry.method === m ? METHOD_COLORS[m] + '18' : 'transparent',
                      color: entry.method === m ? METHOD_COLORS[m] : '#94A3B8',
                      transition: 'all .15s',
                      '&:hover': disabled ? {} : { borderColor: METHOD_COLORS[m], color: METHOD_COLORS[m] }
                    }}
                  >
                    {METHOD_ICONS[m]}
                    <span>{m}</span>
                  </Box>
                </Tooltip>
              ))}
            </Box>
          </Box>

          {/* Conditional sub-fields */}
          {entry.method === 'Card' && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {loadingPOS ? (
                <CircularProgress size={20} />
              ) : (
                <Autocomplete
                  size="small"
                  options={posMachines.filter(m => m.isActive)}
                  getOptionLabel={(o) => `${o.name}${o.bankName ? ` (${o.bankName})` : ''} (${o.feePercentage || 0}%)`}
                  value={posMachines.find(m => m._id === (entry.posMachine?._id || entry.posMachine)) || null}
                  onChange={(_, val) => updateEntry(index, 'posMachine', val)}
                  disabled={disabled}
                  sx={{ flex: 1, minWidth: 130 }}
                  renderInput={(params) => (
                    <TextField {...params} label="POS Terminal" sx={{ '& .MuiInputLabel-root': { fontSize: '12px' } }} />
                  )}
                />
              )}
              {entry.feePercentage > 0 && (
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: 0.5,
                  px: 1, py: 0.5, borderRadius: '6px',
                  backgroundColor: '#E0E7FF', border: '1px solid #A5B4FC'
                }}>
                  <Typography sx={{ fontSize: '11px', color: '#3730A3', fontWeight: 600 }}>
                    Fee {entry.feePercentage}% = ৳{entry.feeAmount.toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {entry.method === 'MFS' && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {loadingMFS ? (
                <CircularProgress size={20} />
              ) : (
                <Autocomplete
                  size="small"
                  options={mfsProviders.filter(p => p.isActive)}
                  getOptionLabel={(o) => `${o.name} (৳${o.feePerThousand || 0}/1000)`}
                  value={mfsProviders.find(p => p._id === (entry.mfsProvider?._id || entry.mfsProvider)) || null}
                  onChange={(_, val) => updateEntry(index, 'mfsProvider', val)}
                  disabled={disabled}
                  sx={{ flex: 1, minWidth: 130 }}
                  renderInput={(params) => (
                    <TextField {...params} label="MFS Provider" sx={{ '& .MuiInputLabel-root': { fontSize: '12px' } }} />
                  )}
                />
              )}
              {entry.feePercentage > 0 && (
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: 0.5,
                  px: 1, py: 0.5, borderRadius: '6px',
                  backgroundColor: '#FEF3C7', border: '1px solid #FCD34D'
                }}>
                  <Typography sx={{ fontSize: '11px', color: '#92400E', fontWeight: 600 }}>
                    Fee ৳{entry.feePercentage}/1000 = ৳{entry.feeAmount.toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {entry.method === 'Bank' && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                label="Bank Name"
                value={entry.bankName}
                onChange={(e) => updateEntry(index, 'bankName', e.target.value)}
                disabled={disabled}
                sx={{ flex: 1, '& .MuiInputLabel-root': { fontSize: '12px' } }}
                InputProps={{ sx: { borderRadius: '8px' } }}
              />
            </Box>
          )}
        </Paper>
      ))}

      {/* Total paid summary */}
      <Box sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        p: 1, borderRadius: '8px',
        backgroundColor: isOverPaid ? '#FEF2F2' : isFullyPaid ? '#F0FDF4' : '#F8FAFC',
        border: `1px solid ${isOverPaid ? '#FECACA' : isFullyPaid ? '#BBF7D0' : '#E2E8F0'}`
      }}>
        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
          Total Paid
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: isOverPaid ? '#EF4444' : isFullyPaid ? '#10B981' : '#1E293B' }}>
            ৳{totalPaid.toFixed(2)}
          </Typography>
          {!isFullyPaid && !isOverPaid && (
            <Chip
              label={`৳${Math.abs(remaining).toFixed(2)} remaining`}
              size="small"
              sx={{ fontSize: '10px', height: '20px', backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 600 }}
            />
          )}
          {isFullyPaid && (
            <Chip
              label="FULLY PAID"
              size="small"
              sx={{ fontSize: '10px', height: '20px', backgroundColor: '#DCFCE7', color: '#166534', fontWeight: 700 }}
            />
          )}
          {isOverPaid && (
            <Chip
              label={`৳${Math.abs(remaining).toFixed(2)} change`}
              size="small"
              sx={{ fontSize: '10px', height: '20px', backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: 600 }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default SplitPaymentPanel;
