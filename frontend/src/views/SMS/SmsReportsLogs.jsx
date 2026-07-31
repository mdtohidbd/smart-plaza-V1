import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  TextField,
  InputAdornment,
  Skeleton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Message as MessageIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import api from '../../utils/api';

const SmsReportsLogs = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch SMS balance
  const { data: balanceData, isLoading: isLoadingBalance } = useQuery(
    'smsBalanceReport',
    async () => {
      const res = await api.get('/api/messages/sms-balance');
      return res.data.data;
    },
    { refetchInterval: 60000 }
  );

  // Fetch all messages
  const { data: allMessages, isLoading: isLoadingMessages } = useQuery(
    'allMessagesLogs',
    async () => {
      const res = await api.get('/api/messages');
      return res.data.data;
    }
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter messages based on search
  const filteredMessages = allMessages?.filter((msg) => {
    const searchStr = searchTerm.toLowerCase();
    const typeStr = (msg.recipientType || '').toLowerCase();
    const titleStr = (msg.title || '').toLowerCase();
    const bodyStr = (msg.body || '').toLowerCase();
    const statusStr = (msg.status || '').toLowerCase();
    
    return typeStr.includes(searchStr) || 
           titleStr.includes(searchStr) || 
           bodyStr.includes(searchStr) || 
           statusStr.includes(searchStr);
  }) || [];

  const paginatedMessages = filteredMessages.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Stats calculation
  const totalMessages = allMessages?.length || 0;
  const sentMessages = allMessages?.filter(m => m.status === 'Sent')?.length || 0;
  const failedMessages = allMessages?.filter(m => m.status === 'Failed')?.length || 0;
  const pendingMessages = allMessages?.filter(m => ['Pending', 'Processing'].includes(m.status))?.length || 0;

  const getStatusColor = (status) => {
    switch(status) {
      case 'Sent': return 'success';
      case 'Failed': return 'error';
      case 'Pending': 
      case 'Processing': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
          📈 SMS Reports & Logs
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.25 }}>
          View overall SMS statistics, balance, and message delivery logs
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Balance Card */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2.5, 
              height: '100%',
              borderRadius: '12px',
              border: '1px solid #b3e5fc',
              background: 'linear-gradient(135deg, #e3f2fd 0%, #e8f5e9 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0277bd', mb: 1.5 }}>
              Current Balance
            </Typography>
            
            {isLoadingBalance ? (
              <Box sx={{ py: 1 }}>
                <Skeleton variant="text" width="60%" height={45} />
                <Skeleton variant="text" width="40%" height={20} />
              </Box>
            ) : balanceData?.success ? (
              <>
                {balanceData.balance !== null ? (
                  <Typography variant="h3" sx={{ color: '#2e7d32', fontWeight: 800 }}>
                    ৳{Number(balanceData.balance).toFixed(2)}
                  </Typography>
                ) : (
                  <Typography variant="h5" sx={{ color: '#2e7d32', fontWeight: 700 }}>
                    {balanceData.status === 'active' ? 'Active' : 'Check Status'}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ color: '#455a64', mt: 1, fontWeight: 500 }}>
                  Account Status: <span style={{ color: balanceData.status === 'active' ? '#2e7d32' : '#c62828' }}>{balanceData.message || 'Active'}</span>
                </Typography>
                {balanceData.lastChecked && (
                  <Typography variant="caption" sx={{ color: '#90a4ae', display: 'block', mt: 1 }}>
                    Last sync: {new Date(balanceData.lastChecked).toLocaleString()}
                  </Typography>
                )}
              </>
            ) : (
              <Alert severity="warning" sx={{ py: 0 }}>Unable to fetch balance</Alert>
            )}
          </Paper>
        </Grid>

        {/* Stats Summary */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 2.5, height: '100%', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
              Delivery Statistics
            </Typography>
            
            {isLoadingMessages ? (
              <Grid container spacing={2}>
                {[1, 2, 3, 4].map((item) => (
                  <Grid item xs={6} sm={3} key={item}>
                    <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <Skeleton variant="text" width="40%" height={16} />
                      <Skeleton variant="text" width="60%" height={32} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#334155' }}>{totalMessages}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                    <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600, textTransform: 'uppercase' }}>Sent</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#15803d' }}>{sentMessages}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                    <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600, textTransform: 'uppercase' }}>Failed</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#b91c1c' }}>{failedMessages}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1.5, bgcolor: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                    <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 600, textTransform: 'uppercase' }}>Processing</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#b45309' }}>{pendingMessages}</Typography>
                  </Box>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Logs Table */}
      <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon sx={{ color: '#64748b' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Message Logs
            </Typography>
          </Box>
          <TextField
            size="small"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: '100%', sm: 250 }, bgcolor: '#fff' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Subject / Title</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Message Content</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoadingMessages ? (
                [1, 2, 3, 4, 5].map((item) => (
                  <TableRow key={item}>
                    <TableCell sx={{ py: 1.5 }}><Skeleton variant="rectangular" width={60} height={22} sx={{ borderRadius: 1 }} /></TableCell>
                    <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="50%" /></TableCell>
                    <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="80%" /></TableCell>
                    <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="40%" /></TableCell>
                    <TableCell sx={{ py: 1.5 }}><Skeleton variant="rectangular" width={50} height={22} sx={{ borderRadius: 1 }} /></TableCell>
                  </TableRow>
                ))
              ) : paginatedMessages.length > 0 ? (
                paginatedMessages.map((msg) => (
                  <TableRow key={msg._id} hover>
                    <TableCell>
                      <Chip 
                        label={msg.recipientType || 'Message'} 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          fontWeight: 600, 
                          color: '#475569', 
                          borderColor: '#cbd5e1',
                          bgcolor: '#f8fafc'
                        }} 
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {msg.title || '—'}
                    </TableCell>
                    <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                      {msg.body?.length > 70 ? `${msg.body.substring(0, 70)}...` : msg.body}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={msg.status || 'Unknown'} 
                        color={getStatusColor(msg.status)} 
                        size="small" 
                        sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600 }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                    {searchTerm ? 'No matching logs found' : 'No message logs available'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredMessages.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid #e2e8f0' }}
        />
      </Paper>
    </Box>
  );
};

export default SmsReportsLogs;
