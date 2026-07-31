import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as AccountBalanceIcon,
  Savings as SavingsIcon,
  PhoneAndroid as PhoneIcon,
  AttachMoney as MoneyIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const typeColors = {
  Cash: { bg: '#E8F5E9', text: '#2E7D32', icon: <MoneyIcon sx={{ fontSize: 18, color: '#2E7D32' }} /> },
  Bank: { bg: '#E3F2FD', text: '#1565C0', icon: <AccountBalanceIcon sx={{ fontSize: 18, color: '#1565C0' }} /> },
  'Mobile Banking': { bg: '#FFF8E1', text: '#E65100', icon: <PhoneIcon sx={{ fontSize: 18, color: '#E65100' }} /> },
};

const emptyForm = {
  type: 'Cash',
  name: '',
  accountNumber: '',
  bankName: '',
  branchName: '',
  openingBalance: 0,
  isActive: true,
};

const ManageAccounts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [accountToView, setAccountToView] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  // Refresh on shop change
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries('accounts');
      if (accountToView) queryClient.invalidateQueries(['accountTransactions', accountToView._id]);
    };
    window.addEventListener('shopChanged', handler);
    return () => window.removeEventListener('shopChanged', handler);
  }, [queryClient, accountToView]);

  // Fetch accounts
  const { data: accounts = [], isLoading, error } = useQuery(
    'accounts',
    async () => {
      const res = await api.get('/api/accounts');
      return res.data.data;
    },
    { refetchOnWindowFocus: false }
  );

  // Fetch transactions for View Details modal
  const { data: accountDetails, isLoading: detailsLoading } = useQuery(
    ['accountTransactions', accountToView?._id],
    async () => {
      const res = await api.get(`/api/accounts/${accountToView._id}/transactions`);
      return res.data.data;
    },
    {
      enabled: !!accountToView,
      refetchOnWindowFocus: false,
    }
  );

  const canCreate = user?.role === 'Super Admin' || user?.permissions?.accounts?.create;
  const canUpdate = user?.role === 'Super Admin' || user?.permissions?.accounts?.update;
  const canDelete = user?.role === 'Super Admin' || user?.permissions?.accounts?.delete;
  const canRead = user?.role === 'Super Admin' || user?.permissions?.accounts?.read;

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation(
    (data) => api.post('/api/accounts', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('accounts');
        queryClient.invalidateQueries('dashboardData');
        handleCloseDialog();
      },
      onError: (err) => setFormError(err.response?.data?.message || 'Failed to create account.'),
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => api.put(`/api/accounts/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('accounts');
        queryClient.invalidateQueries('dashboardData');
        handleCloseDialog();
      },
      onError: (err) => setFormError(err.response?.data?.message || 'Failed to update account.'),
    }
  );

  const deleteMutation = useMutation(
    (id) => api.delete(`/api/accounts/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('accounts');
        queryClient.invalidateQueries('dashboardData');
        setDeleteDialogOpen(false);
        setAccountToDelete(null);
      },
      onError: (err) => alert(err.response?.data?.message || 'Failed to delete account.'),
    }
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleOpenDialog = (account = null) => {
    setFormError('');
    if (account) {
      setEditingAccount(account);
      setFormData({
        type: account.type,
        name: account.name,
        accountNumber: account.accountNumber || '',
        bankName: account.bankName || '',
        branchName: account.branchName || '',
        openingBalance: account.openingBalance ?? 0,
        isActive: account.isActive,
      });
    } else {
      setEditingAccount(null);
      setFormData(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
    setFormData(emptyForm);
    setFormError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name.trim()) { setFormError('Account name is required.'); return; }
    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDeleteClick = (account) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = (account) => {
    setAccountToView(account);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setAccountToView(null);
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const activeAccounts = accounts.filter((a) => a.isActive);
  const totalCurrentBalance = accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ py: { xs: 1, sm: 2 }, backgroundColor: '#F8FAFC' }}>
      <Grid container spacing={1.5}>
        {/* ── Header ── */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 0.5,
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, fontSize: '1.1rem', mb: 0.25 }}>
                Manage Accounts
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                Add and manage your financial accounts (Cash, Bank, Mobile Banking).
              </Typography>
            </Box>
            {canCreate && (
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{
                  backgroundColor: '#1D5F99',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  py: { xs: 0.75, sm: 0.5 },
                  '&:hover': { backgroundColor: '#1a5490' },
                }}
              >
                Add Account
              </Button>
            )}
          </Paper>
        </Grid>

        {/* ── Summary Cards ── */}
        {[
          { label: 'Total Accounts', value: accounts.length, color: '#1D5F99', bg: '#EFF6FF', xs: 6 },
          { label: 'Active Accounts', value: activeAccounts.length, color: '#059669', bg: '#ECFDF5', xs: 6 },
          {
            label: 'Current Total Balance',
            value: `৳${totalCurrentBalance.toLocaleString()}`,
            color: '#7C3AED',
            bg: '#F5F3FF',
            xs: 12
          },
        ].map((card) => (
          <Grid item xs={card.xs} sm={4} key={card.label}>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                border: '1px solid #eaeef3',
                borderRadius: '8px',
                backgroundColor: card.bg,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.25,
              }}
            >
              <Typography sx={{ fontSize: '0.72rem', color: card.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {card.label}
              </Typography>
              <Typography sx={{ fontSize: { xs: card.xs === 12 ? '1.35rem' : '1.25rem', sm: '1.5rem' }, fontWeight: 700, color: card.color }}>
                {card.value}
              </Typography>
            </Paper>
          </Grid>
        ))}

        {/* ── Error / Loading ── */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">Error loading accounts: {error.message}</Alert>
          </Grid>
        )}

        {/* ── Accounts Table ── */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress size={28} />
              </Box>
            ) : accounts.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <AccountBalanceIcon sx={{ fontSize: 40, color: '#CBD5E1', mb: 1 }} />
                <Typography sx={{ color: '#94A3B8', fontSize: '0.9rem' }}>
                  No accounts yet. {canCreate ? 'Click "Add Account" to get started.' : ''}
                </Typography>
              </Box>
            ) : (
              <>
                {/* Desktop view */}
                <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor: '#F1F5F9',
                          '& .MuiTableCell-head': {
                            color: '#475569',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #e2e8f0',
                            py: '8px',
                            px: '12px',
                            whiteSpace: 'nowrap',
                          },
                        }}
                      >
                        <TableCell>Account Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Account No.</TableCell>
                        <TableCell>Bank / Provider</TableCell>
                        <TableCell align="right">Opening Bal.</TableCell>
                        <TableCell align="right">Current Balance</TableCell>
                        <TableCell>Status</TableCell>
                        {(canRead || canUpdate || canDelete) && <TableCell align="center">Actions</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {accounts.map((account, index) => {
                        const typeStyle = typeColors[account.type] || typeColors.Cash;
                        return (
                          <TableRow
                            key={account._id}
                            sx={{
                              backgroundColor: index % 2 === 0 ? '#fff' : '#f9fbfd',
                              '&:hover': { backgroundColor: '#EFF6FF' },
                              '& .MuiTableCell-root': { py: '6px', px: '12px', whiteSpace: 'nowrap' },
                            }}
                          >
                            <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{account.name}</TableCell>
                            <TableCell>
                              <Chip
                                label={account.type}
                                size="small"
                                icon={typeStyle.icon}
                                sx={{
                                  backgroundColor: typeStyle.bg,
                                  color: typeStyle.text,
                                  fontWeight: 600,
                                  fontSize: '0.72rem',
                                  height: 22,
                                  '& .MuiChip-icon': { ml: '4px' },
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: '#475569' }}>{account.accountNumber || '—'}</TableCell>
                            <TableCell sx={{ color: '#475569' }}>{account.bankName || '—'}</TableCell>
                            <TableCell align="right" sx={{ color: '#64748b' }}>
                              ৳{(account.openingBalance || 0).toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#1D5F99', fontSize: '0.9rem' }}>
                              ৳{(account.currentBalance || 0).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={account.isActive ? 'Active' : 'Inactive'}
                                size="small"
                                color={account.isActive ? 'success' : 'default'}
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            </TableCell>
                            {(canRead || canUpdate || canDelete) && (
                              <TableCell align="center">
                                {canRead && (
                                  <Tooltip title="View Transactions Log">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleViewDetails(account)}
                                      sx={{ color: '#059669', '&:hover': { backgroundColor: 'rgba(5,150,105,0.08)' } }}
                                    >
                                      <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {canUpdate && (
                                  <Tooltip title="Edit Account">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenDialog(account)}
                                      sx={{ color: '#1D5F99', '&:hover': { backgroundColor: 'rgba(29,95,153,0.08)' } }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {canDelete && (
                                  <Tooltip title="Delete Account">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteClick(account)}
                                      sx={{ color: '#EF4444', '&:hover': { backgroundColor: 'rgba(239,68,68,0.08)' } }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Mobile View Cards */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, p: 1.5, backgroundColor: '#F8FAFC' }}>
                  {accounts.map((account) => {
                    const typeStyle = typeColors[account.type] || typeColors.Cash;
                    return (
                      <Paper key={account._id} elevation={0} sx={{ p: 2, border: '1px solid #eaeef3', borderRadius: '12px', backgroundColor: '#fff', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                            {account.name}
                          </Typography>
                          <Chip
                            label={account.type}
                            size="small"
                            icon={typeStyle.icon}
                            sx={{
                              backgroundColor: typeStyle.bg,
                              color: typeStyle.text,
                              fontWeight: 600,
                              fontSize: '0.65rem',
                              height: 22,
                              '& .MuiChip-icon': { ml: '4px', fontSize: '14px' },
                            }}
                          />
                        </Box>
                        
                        <Grid container spacing={1} sx={{ mb: 1.5 }}>
                          {account.accountNumber && (
                            <Grid item xs={6}>
                              <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Acc No.</Typography>
                              <Typography sx={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>{account.accountNumber}</Typography>
                            </Grid>
                          )}
                          {account.bankName && (
                            <Grid item xs={6}>
                              <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>{account.type === 'Bank' ? 'Bank' : 'Provider'}</Typography>
                              <Typography sx={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>{account.bankName}</Typography>
                            </Grid>
                          )}
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Opening Bal.</Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>৳{(account.openingBalance || 0).toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Current Bal.</Typography>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#1D5F99' }}>৳{(account.currentBalance || 0).toLocaleString()}</Typography>
                          </Grid>
                        </Grid>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', pt: 1 }}>
                          <Chip
                            label={account.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={account.isActive ? 'success' : 'default'}
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
                          
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {canRead && (
                              <Tooltip title="View Transactions">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewDetails(account)}
                                  sx={{ color: '#059669', '&:hover': { backgroundColor: 'rgba(5,150,105,0.08)' } }}
                                >
                                  <VisibilityIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canUpdate && (
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(account)}
                                  sx={{ color: '#1D5F99', '&:hover': { backgroundColor: 'rgba(29,95,153,0.08)' } }}
                                >
                                  <EditIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canDelete && (
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(account)}
                                  sx={{ color: '#EF4444', '&:hover': { backgroundColor: 'rgba(239,68,68,0.08)' } }}
                                >
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── View Details Modal ── */}
      <Dialog open={detailsDialogOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid #eaeef3', bgcolor: '#F8FAFC' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>
                {accountToView?.name} Transactions
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                Account Log & Details
              </Typography>
            </Box>
            <Button onClick={handleCloseDetails} size="small" variant="outlined" sx={{ textTransform: 'none' }}>
              Close
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress size={28} />
            </Box>
          ) : accountDetails ? (
            <Box>
              {/* Stats Bar */}
              <Box sx={{ display: 'flex', gap: 1.5, p: 2, bgcolor: '#f9fbfd', borderBottom: '1px solid #eaeef3', flexWrap: 'wrap' }}>
                <Box sx={{ flex: { xs: '1 1 calc(50% - 12px)', md: 1 }, p: 1.5, bgcolor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <Typography sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Opening Balance</Typography>
                  <Typography sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, fontWeight: 700, color: '#475569' }}>৳{(accountDetails.openingBalance || 0).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ flex: { xs: '1 1 calc(50% - 12px)', md: 1 }, p: 1.5, bgcolor: '#ECFDF5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <Typography sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#059669', fontWeight: 600, textTransform: 'uppercase' }}>Total Income (+)</Typography>
                  <Typography sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, fontWeight: 700, color: '#059669' }}>৳{(accountDetails.totalIncome || 0).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ flex: { xs: '1 1 calc(50% - 12px)', md: 1 }, p: 1.5, bgcolor: '#FEF2F2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  <Typography sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#DC2626', fontWeight: 600, textTransform: 'uppercase' }}>Total Expense (-)</Typography>
                  <Typography sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, fontWeight: 700, color: '#DC2626' }}>৳{(accountDetails.totalExpense || 0).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ flex: { xs: '1 1 calc(50% - 12px)', md: 1 }, p: 1.5, bgcolor: '#EFF6FF', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <Typography sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#1D5F99', fontWeight: 600, textTransform: 'uppercase' }}>Current Balance</Typography>
                  <Typography sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, fontWeight: 700, color: '#1D5F99' }}>৳{(accountDetails.currentBalance || 0).toLocaleString()}</Typography>
                </Box>
              </Box>

              {/* Transactions Log Switcher */}
              {accountDetails.transactions?.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography sx={{ color: '#94A3B8', fontSize: '0.9rem' }}>No transactions recorded yet.</Typography>
                </Box>
              ) : (
                <>
                  {/* Desktop Transactions Table */}
                  <TableContainer sx={{ maxHeight: 400, display: { xs: 'none', md: 'block' } }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow sx={{ '& .MuiTableCell-head': { bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700, fontSize: '0.75rem', py: 1 } }}>
                          <TableCell>Date</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Head</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Added By</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {accountDetails.transactions.map((tx) => (
                          <TableRow key={tx._id} sx={{ '&:hover': { bgcolor: '#f8fafc' }, '& .MuiTableCell-root': { py: 1, borderBottom: '1px solid #f1f5f9' } }}>
                            <TableCell sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={tx._type === 'income' ? 'Income' : 'Expense'} 
                                size="small"
                                icon={tx._type === 'income' ? <TrendingUpIcon sx={{ fontSize: 14 }}/> : <TrendingDownIcon sx={{ fontSize: 14 }} />}
                                sx={{ 
                                  bgcolor: tx._type === 'income' ? '#ECFDF5' : '#FEF2F2', 
                                  color: tx._type === 'income' ? '#059669' : '#DC2626',
                                  fontWeight: 600, fontSize: '0.7rem', height: 22 
                                }} 
                              />
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{tx.head?.name || '—'}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem', color: '#1e293b' }}>{tx.name}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: tx._type === 'income' ? '#059669' : '#DC2626' }}>
                              {tx._type === 'income' ? '+' : '-'} ৳{tx.amount.toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>{tx.addedBy?.name || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Mobile Transactions Card List */}
                  <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.25, p: 1.5, maxHeight: 400, overflowY: 'auto', backgroundColor: '#F8FAFC' }}>
                    {accountDetails.transactions.map((tx) => (
                      <Paper key={tx._id} elevation={0} sx={{ p: 1.5, border: '1px solid #eaeef3', borderRadius: '8px', backgroundColor: '#fff' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                            {new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </Typography>
                          <Chip 
                            label={tx._type === 'income' ? 'Income' : 'Expense'} 
                            size="small"
                            icon={tx._type === 'income' ? <TrendingUpIcon sx={{ fontSize: 12 }}/> : <TrendingDownIcon sx={{ fontSize: 12 }} />}
                            sx={{ 
                              bgcolor: tx._type === 'income' ? '#ECFDF5' : '#FEF2F2', 
                              color: tx._type === 'income' ? '#059669' : '#DC2626',
                              fontWeight: 600, fontSize: '0.625rem', height: 20 
                            }} 
                          />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{tx.name}</Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>Head: {tx.head?.name || '—'}</Typography>
                          </Box>
                          <Typography sx={{ fontWeight: 700, color: tx._type === 'income' ? '#059669' : '#DC2626', fontSize: '0.875rem' }}>
                            {tx._type === 'income' ? '+' : '-'} ৳{tx.amount.toLocaleString()}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          ) : (
            <Box sx={{ p: 3 }}><Alert severity="error">Failed to load account details.</Alert></Box>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1, fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>
          {editingAccount ? 'Edit Account' : 'Add New Account'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Account Type *</InputLabel>
                  <Select name="type" value={formData.type} onChange={handleChange} label="Account Type *" required>
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Bank">Bank</MenuItem>
                    <MenuItem value="Mobile Banking">Mobile Banking</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Account Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              {formData.type !== 'Cash' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Account Number"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label={formData.type === 'Bank' ? 'Bank Name' : 'Provider Name'}
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                    />
                  </Grid>
                  {formData.type === 'Bank' && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Branch Name"
                        name="branchName"
                        value={formData.branchName}
                        onChange={handleChange}
                      />
                    </Grid>
                  )}
                </>
              )}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Opening Balance (৳)"
                  name="openingBalance"
                  type="number"
                  value={formData.openingBalance}
                  onChange={handleChange}
                  inputProps={{ min: 0 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">৳</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      size="small"
                      color="success"
                    />
                  }
                  label={<Typography sx={{ fontSize: '0.875rem' }}>Account is Active</Typography>}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, borderTop: '1px solid #eaeef3', gap: 1 }}>
            <Button onClick={handleCloseDialog} size="small" variant="outlined" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="small"
              variant="contained"
              disabled={createMutation.isLoading || updateMutation.isLoading}
              sx={{ backgroundColor: '#1D5F99', textTransform: 'none', '&:hover': { backgroundColor: '#1a5490' } }}
            >
              {(createMutation.isLoading || updateMutation.isLoading) ? 'Saving…' : editingAccount ? 'Update Account' : 'Add Account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Delete Account?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.875rem' }}>
            Are you sure you want to delete <strong>{accountToDelete?.name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, borderTop: '1px solid #eaeef3', gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} size="small" variant="outlined" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={() => deleteMutation.mutate(accountToDelete?._id)}
            size="small"
            color="error"
            variant="contained"
            disabled={deleteMutation.isLoading}
            sx={{ textTransform: 'none' }}
          >
            {deleteMutation.isLoading ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageAccounts;
