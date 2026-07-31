import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { Send as SendIcon, Person as PersonIcon, Business as BusinessIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';

function TabPanel({ children, value, index }) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 2 }}>
      {value === index && children}
    </Box>
  );
}

function SmsBalanceCard({ smsBalanceData, isLoadingBalance }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #e8f5e9 100%)',
        border: '1px solid #b3e5fc',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0277bd', mb: 1 }}>
        💰 SMS Balance
      </Typography>
      {isLoadingBalance ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
          <CircularProgress size={22} />
        </Box>
      ) : smsBalanceData?.success ? (
        <>
          {smsBalanceData.balance !== null ? (
            <Typography variant="h4" sx={{ color: '#2e7d32', fontWeight: 800, my: 0.5 }}>
              ৳{Number(smsBalanceData.balance).toFixed(2)}
            </Typography>
          ) : (
            <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 700, my: 0.5 }}>
              {smsBalanceData.status === 'active' ? '✅ Active' : '⚠️ Check Status'}
            </Typography>
          )}
          <Typography variant="body2" sx={{ color: '#555', mt: 0.5 }}>
            Status:{' '}
            <strong style={{ color: smsBalanceData.status === 'active' ? '#2e7d32' : '#c62828' }}>
              {smsBalanceData.message || 'Account Active'}
            </strong>
          </Typography>
          {smsBalanceData.lastChecked && (
            <Typography variant="caption" sx={{ color: '#90a4ae', display: 'block', mt: 0.5 }}>
              Last checked: {new Date(smsBalanceData.lastChecked).toLocaleString()}
            </Typography>
          )}
        </>
      ) : (
        <Alert severity="warning" sx={{ mt: 1 }}>Unable to fetch balance</Alert>
      )}
    </Paper>
  );
}

function GenericSmsTab({ type, smsBalanceData, isLoadingBalance }) {
  const isCustomer = type === 'customer';
  const entityIdKey = isCustomer ? 'customer' : 'company';
  
  const [formData, setFormData] = useState({ [entityIdKey]: '', subject: '', message: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const queryClient = useQueryClient();

  const fetchEntitiesUrl = isCustomer ? '/api/contacts/customers' : '/api/suppliers';
  const fetchMessagesUrl = isCustomer ? '/api/messages/customer' : '/api/messages/supplier';
  const queryKeyEntities = isCustomer ? 'customers' : 'companies';
  const queryKeyMessages = isCustomer ? 'customerMessages' : 'supplierMessages';

  const { data: entities, isLoading: isLoadingEntities } = useQuery(queryKeyEntities, async () => {
    const res = await api.get(fetchEntitiesUrl);
    return res.data.data;
  });

  const { data: messages, isLoading: isLoadingMessages } = useQuery(queryKeyMessages, async () => {
    const res = await api.get(fetchMessagesUrl);
    return res.data.data;
  });

  const sendMutation = useMutation(
    (data) => api.post(fetchMessagesUrl, data),
    {
      onSuccess: (res) => {
        queryClient.invalidateQueries(queryKeyMessages);
        setFormData({ [entityIdKey]: '', subject: '', message: '' });
        const smsInfo = res.data.data?.smsDeliveryInfo;
        if (smsInfo?.success) {
          setSuccess(`✅ SMS sent! Transaction ID: ${smsInfo.trxnId}`);
        } else if (smsInfo) {
          setSuccess(`⚠️ Saved but SMS failed: ${smsInfo.error?.responseResult || smsInfo.error}`);
        } else {
          setSuccess('✅ Message sent successfully!');
        }
        setTimeout(() => setSuccess(''), 5000);
      },
      onError: (err) => {
        setError(err.response?.data?.message || err.message);
        setTimeout(() => setError(''), 5000);
      },
    }
  );

  const handleSubmit = () => {
    if (!formData[entityIdKey] || !formData.message.trim()) {
      setError(`Please select a ${type} and type a message.`);
      return;
    }
    sendMutation.mutate({ ...formData, messageType: 'SMS' });
  };

  const getEntityDisplay = (entity) => {
    if (isCustomer) return entity.contactName;
    return entity.companyName || entity.name;
  };

  const getEntityPhone = (entity) => {
    return entity.phone || entity.mobile || entity.contactNumber || '';
  };
  
  const getMessageRecipientName = (msg) => {
    if (isCustomer) return msg.recipients?.[0]?.contactName || 'Customer';
    return msg.recipients?.[0]?.companyName || msg.recipients?.[0]?.name || 'Supplier';
  };

  const themeColor = isCustomer ? '#1976d2' : '#6a1b9a';
  const themeGradient = isCustomer 
    ? 'linear-gradient(135deg,#1976d2,#42a5f5)' 
    : 'linear-gradient(135deg,#6a1b9a,#ab47bc)';
  const themeGradientHover = isCustomer 
    ? 'linear-gradient(135deg,#1565c0,#1976d2)' 
    : 'linear-gradient(135deg,#4a148c,#6a1b9a)';
  
  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={2}>
        {/* Compose */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: '#1e293b' }}>
              {isCustomer ? '📱 Send SMS to Customer' : '🏢 Send SMS to Supplier'}
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }} required>
              <InputLabel>Select {isCustomer ? 'Customer' : 'Supplier / Company'}</InputLabel>
              <Select
                value={formData[entityIdKey]}
                label={`Select ${isCustomer ? 'Customer' : 'Supplier / Company'}`}
                onChange={(e) => setFormData({ ...formData, [entityIdKey]: e.target.value })}
                disabled={isLoadingEntities}
              >
                {entities?.map((e) => {
                  const name = getEntityDisplay(e);
                  const phone = getEntityPhone(e);
                  return (
                    <MenuItem key={e._id} value={e._id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{name}</span>
                        {phone && <span style={{ color: '#64748b', fontSize: '0.82rem' }}>({phone})</span>}
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Subject (optional)"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Message *"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              multiline
              rows={4}
              required
              placeholder="Type your SMS message here..."
              helperText={`SMS will be sent to the ${type}'s registered phone number`}
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={sendMutation.isLoading ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
              onClick={handleSubmit}
              disabled={sendMutation.isLoading}
              sx={{
                borderRadius: '10px', fontWeight: 700, textTransform: 'none',
                background: themeGradient,
                '&:hover': { background: themeGradientHover },
              }}
            >
              {sendMutation.isLoading ? 'Sending SMS...' : `📱 Send SMS to ${isCustomer ? 'Customer' : 'Supplier'}`}
            </Button>
          </Paper>
        </Grid>

        {/* Stats + Balance */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: '12px', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>📊 Stats</Typography>
            {isLoadingMessages ? (
              <CircularProgress size={20} />
            ) : (
              <>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Total Sent: <strong>{messages?.length || 0}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: themeColor }}>
                  📱 SMS: <strong>{messages?.filter((m) => m.messageType === 'SMS' || !isCustomer).length || 0}</strong>
                </Typography>
                {messages?.length > 0 && (
                  <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {messages.slice(0, 4).map((msg) => (
                      <Chip
                        key={msg._id}
                        label={`${getMessageRecipientName(msg)} · ${msg.status}`}
                        size="small"
                        color={msg.status === 'Failed' ? 'error' : 'success'}
                      />
                    ))}
                  </Box>
                )}
              </>
            )}
          </Paper>
          <SmsBalanceCard smsBalanceData={smsBalanceData} isLoadingBalance={isLoadingBalance} />
        </Grid>
      </Grid>

      {/* History Table */}
      <Paper elevation={0} sx={{ p: 2, mt: 2, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Message History</Typography>

        {/* Desktop */}
        <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600 }}>{isCustomer ? 'Customer' : 'Supplier'}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {messages?.length > 0 ? messages.map((msg) => {
                const name = getMessageRecipientName(msg);
                return (
                  <TableRow key={msg._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: themeColor }}>
                          {name.charAt(0)}
                        </Avatar>
                        {name}
                      </Box>
                    </TableCell>
                    <TableCell>{msg.subject || '—'}</TableCell>
                    <TableCell>{msg.message?.substring(0, 50)}{msg.message?.length > 50 ? '…' : ''}</TableCell>
                    <TableCell>{new Date(msg.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={msg.status || 'Sent'} color={msg.status === 'Failed' ? 'error' : 'success'} size="small" />
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: '#94a3b8', py: 3 }}>No messages sent yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
          {messages?.length > 0 ? messages.map((msg) => {
            const name = getMessageRecipientName(msg);
            return (
              <Paper key={msg._id} elevation={0} sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: themeColor }}>
                      {name.charAt(0)}
                    </Avatar>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{name}</Typography>
                  </Box>
                  <Chip label={msg.status || 'Sent'} color={msg.status === 'Failed' ? 'error' : 'success'} size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#475569' }}>{msg.message}</Typography>
                <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8', mt: 0.5, textAlign: 'right' }}>
                  {new Date(msg.createdAt).toLocaleString()}
                </Typography>
              </Paper>
            );
          }) : (
            <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>No messages sent yet</Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

const IndividualSms = () => {
  const [activeTab, setActiveTab] = useState(0);

  const { data: smsBalanceData, isLoading: isLoadingBalance } = useQuery(
    'smsBalance',
    async () => {
      const res = await api.get('/api/messages/sms-balance');
      return res.data.data;
    },
    { refetchInterval: 60000, staleTime: 30000 }
  );

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
          📱 Individual SMS
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.25 }}>
          Send individual SMS messages to customers or suppliers
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{
            bgcolor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '0.875rem',
              textTransform: 'none',
              minHeight: 48,
              gap: 0.5,
            },
            '& .Mui-selected': { color: 'primary.main' },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab icon={<PersonIcon fontSize="small" />} iconPosition="start" label="Customer SMS" />
          <Tab icon={<BusinessIcon fontSize="small" />} iconPosition="start" label="Supplier SMS" />
        </Tabs>

        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          <TabPanel value={activeTab} index={0}>
            <GenericSmsTab type="customer" smsBalanceData={smsBalanceData} isLoadingBalance={isLoadingBalance} />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <GenericSmsTab type="supplier" smsBalanceData={smsBalanceData} isLoadingBalance={isLoadingBalance} />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default IndividualSms;
