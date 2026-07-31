import React, { useState, useRef } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, Button, Chip,
  Alert, CircularProgress, Divider, LinearProgress, Tooltip,
  IconButton, Badge
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PhoneIcon from '@mui/icons-material/Phone';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import { useQuery, useMutation } from 'react-query';
import api from '../../utils/api';

const sx = {
  section: {
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    p: 2.5,
    mb: 2,
    background: '#fff',
  },
  label: {
    fontSize: '0.72rem', fontWeight: 700, color: '#64748b',
    textTransform: 'uppercase', mb: 0.5, letterSpacing: '0.05em'
  },
  numberChip: {
    m: 0.3, fontSize: '0.75rem', fontWeight: 600,
    borderRadius: '6px', height: 28,
  }
};

const MAX_SMS_LENGTH = 160;

function parseNumbers(raw) {
  return [...new Set(
    raw.split(/[\r\n\t,; ]+/)
      .map(n => n.replace(/\D/g, '')) // strip non-digits
      .filter(n => n.length >= 10)     // keep valid-looking numbers
  )];
}

export default function BulkSms() {
  const [bulkRaw, setBulkRaw] = useState('');
  const [numbers, setNumbers] = useState([]);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState(null); // { success, failed }
  const [error, setError] = useState('');
  const pasteRef = useRef(null);

  // Fetch SMS balance
  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = useQuery(
    'sms-balance-bulk',
    async () => {
      const r = await api.get('/api/messages/sms-balance');
      return r.data.data;
    },
    { refetchInterval: 60000, staleTime: 30000 }
  );

  // Fetch customers
  const { data: customers } = useQuery(
    'customers-bulk-sms',
    async () => {
      const response = await api.get('/api/contacts/customers');
      return response.data.data || [];
    },
    { refetchOnWindowFocus: false }
  );

  // Send bulk SMS mutation
  const sendMutation = useMutation(
    async ({ phoneNumbers, message }) => {
      const r = await api.post('/api/sms/send-bulk', { phoneNumbers, message, transactionType: 'promotional' });
      return r.data;
    },
    {
      onSuccess: (data) => {
        setResults(data.data);
        refetchBalance();
        setError('');
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to send bulk SMS');
      }
    }
  );

  const handleBulkBoxChange = (val) => {
    setBulkRaw(val);
    const parsed = parseNumbers(val);
    setNumbers(parsed);
    setResults(null);
  };

  const handleRemoveNumber = (num) => {
    setNumbers(prev => prev.filter(n => n !== num));
    setResults(null);
  };

  const handleClearAll = () => {
    setBulkRaw('');
    setNumbers([]);
    setResults(null);
    setError('');
  };

  const handleSend = () => {
    setError('');
    setResults(null);
    if (numbers.length === 0) return setError('Please add at least one phone number.');
    if (!message.trim()) return setError('Please type a message to send.');
    sendMutation.mutate({ phoneNumbers: numbers, message: message.trim() });
  };

  const remaining = MAX_SMS_LENGTH - message.length;
  const msgColor = remaining < 0 ? '#ef4444' : remaining < 20 ? '#f59e0b' : '#64748b';

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, maxWidth: 980, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b', fontFamily: '"Outfit",sans-serif' }}>
            Bulk SMS Campaign
          </Typography>
          <Typography sx={{ fontSize: '0.73rem', color: '#64748b' }}>
            Paste phone numbers, compose your promotional message, and send via MimSMS
          </Typography>
        </Box>

        {/* Balance badge */}
        <Paper elevation={0} sx={{
          px: 2, py: 1, borderRadius: '10px',
          background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
          border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 1
        }}>
          <AccountBalanceWalletIcon sx={{ color: '#16a34a', fontSize: '1.1rem' }} />
          {balanceLoading ? (
            <CircularProgress size={14} sx={{ color: '#16a34a' }} />
          ) : (
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>
              {balanceData?.balance != null ? `৳${Number(balanceData.balance).toFixed(2)}` : balanceData?.message || 'Balance N/A'}
            </Typography>
          )}
        </Paper>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem', borderRadius: '8px' }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={2}>
        {/* LEFT: Number input */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={sx.section}>
            <Typography sx={sx.label}>Paste Phone Numbers</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', mb: 1.5 }}>
              Paste from Excel — supports newline, comma, tab, or space separated numbers
            </Typography>
            <TextField
              ref={pasteRef}
              fullWidth
              multiline
              rows={4}
              placeholder={'01711000001\n01811000002\n01911000003\n...'}
              value={bulkRaw}
              onChange={e => handleBulkBoxChange(e.target.value)}
              sx={{
                mb: 1.5,
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.8rem', fontFamily: 'monospace',
                  bgcolor: '#f8fafc', borderRadius: '8px'
                }
              }}
            />

            {/* Quick Add Customers */}
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mb: 1 }}>
              Quick Add Customers
            </Typography>
            <Box sx={{ 
              maxHeight: 120, overflowY: 'auto', p: 1, mb: 1.5,
              bgcolor: '#f8fafc', borderRadius: '8px', 
              border: '1px solid #e2e8f0', 
              display: 'flex', flexWrap: 'wrap', gap: 0.5 
            }}>
              {customers?.map(c => {
                const phone = c.phone || c.mobile || c.contactNumber;
                if (!phone) return null;
                return (
                  <Chip 
                    key={c._id}
                    label={`${c.contactName} (${phone})`}
                    size="small"
                    onClick={() => {
                       const newVal = bulkRaw ? `${bulkRaw}\n${phone}` : phone;
                       handleBulkBoxChange(newVal);
                    }}
                    sx={{ fontSize: '0.7rem', cursor: 'pointer', '&:hover': { bgcolor: '#e2e8f0' } }}
                  />
                );
              })}
              {(!customers || customers.length === 0) && (
                <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', p: 0.5 }}>
                  No customers found.
                </Typography>
              )}
            </Box>

            {/* Number count bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <PhoneIcon sx={{ fontSize: '0.9rem', color: '#6366f1' }} />
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
                  {numbers.length} number{numbers.length !== 1 ? 's' : ''} detected
                </Typography>
              </Box>
              {numbers.length > 0 && (
                <Tooltip title="Clear all numbers">
                  <IconButton size="small" onClick={handleClearAll} sx={{ color: '#ef4444' }}>
                    <ClearAllIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* Chips for parsed numbers */}
            {numbers.length > 0 && (
              <Box sx={{
                maxHeight: 180, overflowY: 'auto', p: 1.5,
                bgcolor: '#f8fafc', borderRadius: '8px',
                border: '1px solid #e2e8f0',
                display: 'flex', flexWrap: 'wrap'
              }}>
                {numbers.map(num => (
                  <Chip
                    key={num}
                    label={num}
                    size="small"
                    onDelete={() => handleRemoveNumber(num)}
                    deleteIcon={<DeleteIcon />}
                    sx={{ ...sx.numberChip, bgcolor: '#ede9fe', color: '#5b21b6', '& .MuiChip-deleteIcon': { color: '#7c3aed', fontSize: '0.85rem' } }}
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* RIGHT: Message compose */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={sx.section}>
            <Typography sx={sx.label}>Compose Message</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', mb: 1.5 }}>
              Keep under {MAX_SMS_LENGTH} characters for a single SMS credit per recipient
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={7}
              placeholder="Type your promotional SMS message here...&#10;&#10;e.g. Dear Customer, We have an exciting offer! Get 20% off on all electronics this weekend. Visit SmartPlaza now. Reply STOP to unsubscribe."
              value={message}
              onChange={e => setMessage(e.target.value)}
              sx={{
                mb: 0.5,
                '& .MuiOutlinedInput-root': { fontSize: '0.85rem', borderRadius: '8px' }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontSize: '0.72rem', color: msgColor, fontWeight: 600 }}>
                {message.length}/{MAX_SMS_LENGTH} chars
                {remaining < 0 ? ` (${Math.ceil(Math.abs(remaining) / MAX_SMS_LENGTH) + 1} SMS credits)` : ''}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Total credits: ~{numbers.length * Math.ceil(message.length / MAX_SMS_LENGTH || 1)}
              </Typography>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Summary row */}
            <Box sx={{
              bgcolor: '#faf5ff', border: '1px solid #e9d5ff',
              borderRadius: '8px', p: 1.5, mb: 2,
              display: 'flex', gap: 3, flexWrap: 'wrap'
            }}>
              <Box>
                <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Recipients</Typography>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#6366f1' }}>{numbers.length}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Message Length</Typography>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{message.length} chars</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>SMS / Recipient</Typography>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{Math.ceil(message.length / MAX_SMS_LENGTH) || 1}</Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={sendMutation.isLoading ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
              onClick={handleSend}
              disabled={sendMutation.isLoading || numbers.length === 0 || !message.trim()}
              sx={{
                borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem',
                py: 1.3, textTransform: 'none', fontFamily: '"Outfit",sans-serif',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                '&:hover': { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 6px 18px rgba(99,102,241,0.45)' },
                '&:disabled': { opacity: 0.6 }
              }}
            >
              {sendMutation.isLoading
                ? `Sending to ${numbers.length} recipients...`
                : `🚀 Send SMS to ${numbers.length} Number${numbers.length !== 1 ? 's' : ''}`}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Results Panel */}
      {sendMutation.isLoading && (
        <Paper elevation={0} sx={{ ...sx.section, bgcolor: '#faf5ff', border: '1px solid #e9d5ff' }}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#6366f1', mb: 1 }}>
            📡 Sending messages... Please wait
          </Typography>
          <LinearProgress sx={{ borderRadius: '4px', bgcolor: '#e9d5ff', '& .MuiLinearProgress-bar': { bgcolor: '#6366f1' } }} />
        </Paper>
      )}

      {results && !sendMutation.isLoading && (
        <Paper elevation={0} sx={{ ...sx.section, border: results.success ? '1px solid #bbf7d0' : '1px solid #fecaca' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            {results.success
              ? <CheckCircleIcon sx={{ color: '#16a34a', fontSize: '1.3rem' }} />
              : <ErrorIcon sx={{ color: '#dc2626', fontSize: '1.3rem' }} />}
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: results.success ? '#15803d' : '#dc2626' }}>
              {results.success ? 'Bulk SMS Sent Successfully!' : 'Some messages failed'}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {results.trxnId && (
              <Grid item xs={12} sm={4}>
                <Box sx={{ bgcolor: '#f0fdf4', borderRadius: '8px', p: 1.5 }}>
                  <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Transaction ID</Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#15803d', fontFamily: 'monospace' }}>
                    {results.trxnId}
                  </Typography>
                </Box>
              </Grid>
            )}
            {results.successCount != null && (
              <Grid item xs={6} sm={4}>
                <Box sx={{ bgcolor: '#f0fdf4', borderRadius: '8px', p: 1.5 }}>
                  <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Delivered</Typography>
                  <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: '#16a34a' }}>{results.successCount}</Typography>
                </Box>
              </Grid>
            )}
            {results.failCount != null && results.failCount > 0 && (
              <Grid item xs={6} sm={4}>
                <Box sx={{ bgcolor: '#fef2f2', borderRadius: '8px', p: 1.5 }}>
                  <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Failed</Typography>
                  <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: '#dc2626' }}>{results.failCount}</Typography>
                </Box>
              </Grid>
            )}
          </Grid>

          {results.message && (
            <Typography sx={{ fontSize: '0.78rem', color: '#64748b', mt: 1.5, fontStyle: 'italic' }}>
              API response: {results.message}
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
}
