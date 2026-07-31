import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, Button, FormControl,
  InputLabel, Select, MenuItem, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, InputAdornment, IconButton,
  Tooltip, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, Chip, CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon,
  TrendingDown as ExpenseIcon, AccountBalance as AccountIcon, ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const EMPTY_FORM = {
  expenseHead: '',
  accountId: '',
  name: '',
  date: new Date().toISOString().split('T')[0],
  amount: '',
  description: '',
};

// ── Small stat card ────────────────────────────────────────────────────────────
const StatChip = ({ label, value, color }) => (
  <Paper elevation={0} sx={{
    px: { xs: 1.5, sm: 2 },
    py: 1,
    border: `1px solid ${color}30`,
    borderRadius: '8px',
    backgroundColor: `${color}08`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: { xs: '75px', sm: '100px' },
    textAlign: 'center',
    gap: 0.25
  }}>
    <Typography sx={{ fontSize: { xs: '0.625rem', sm: '0.72rem' }, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</Typography>
    <Typography sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' }, fontWeight: 700, color, whiteSpace: 'nowrap' }}>{value}</Typography>
  </Paper>
);

const Expense = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseIdToDelete, setExpenseIdToDelete] = useState(null);

  // Refresh on shop change
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries('expenses');
      queryClient.invalidateQueries('expenseHeads');
      queryClient.invalidateQueries('accounts');
    };
    window.addEventListener('shopChanged', handler);
    return () => window.removeEventListener('shopChanged', handler);
  }, [queryClient]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: rawExpenseHeads = [] } = useQuery(
    'expenseHeads',
    async () => (await api.get('/api/expenseHeads')).data.data,
    { refetchOnWindowFocus: false }
  );

  const expenseHeads = useMemo(() => {
    return rawExpenseHeads.filter(h => h.name !== 'Purchase' && h.name !== 'Purchase Cost');
  }, [rawExpenseHeads]);

  const { data: accounts = [] } = useQuery(
    'accounts',
    async () => (await api.get('/api/accounts')).data.data,
    { refetchOnWindowFocus: false }
  );

  const { data: rawExpenseRecords = [], isLoading } = useQuery(
    'expenses',
    async () => (await api.get('/api/expense')).data.data,
    { refetchOnWindowFocus: false }
  );

  const expenseRecords = useMemo(() => {
    return rawExpenseRecords.filter(r => {
      const headName = r.expenseHead?.name || '';
      return headName !== 'Purchase' && headName !== 'Purchase Cost';
    });
  }, [rawExpenseRecords]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!searchTerm) return expenseRecords;
    const t = searchTerm.toLowerCase();
    const result = expenseRecords.filter(r =>
      r.name?.toLowerCase().includes(t) ||
      r.expenseHead?.name?.toLowerCase().includes(t) ||
      r.accountId?.name?.toLowerCase().includes(t) ||
      String(r.amount).includes(t) ||
      r.description?.toLowerCase().includes(t)
    );
    return result.sort((a, b) => {
      const aStarts = (a.name || '').toLowerCase().startsWith(t) ||
                      (a.expenseHead?.name || '').toLowerCase().startsWith(t);
      const bStarts = (b.name || '').toLowerCase().startsWith(t) ||
                      (b.expenseHead?.name || '').toLowerCase().startsWith(t);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
  }, [expenseRecords, searchTerm]);

  const totalExpense = expenseRecords.reduce((s, r) => s + (r.amount || 0), 0);
  const thisMonth = expenseRecords.filter(r => {
    const d = new Date(r.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, r) => s + (r.amount || 0), 0);

  const canCreate = user?.role === 'Super Admin' || user?.permissions?.accounts?.create;
  const canUpdate = user?.role === 'Super Admin' || user?.permissions?.accounts?.update;
  const canDelete = user?.role === 'Super Admin' || user?.permissions?.accounts?.delete;

  // ── Mutations ──────────────────────────────────────────────────────────────
  const reset = () => { setFormData(EMPTY_FORM); setEditingId(null); };

  const createMutation = useMutation(
    (data) => api.post('/api/expense', data),
    { onSuccess: () => { queryClient.invalidateQueries('expenses'); queryClient.invalidateQueries('dashboardData'); reset(); } }
  );
  const updateMutation = useMutation(
    ({ id, data }) => api.put(`/api/expense/${id}`, data),
    { onSuccess: () => { queryClient.invalidateQueries('expenses'); reset(); } }
  );
  const deleteMutation = useMutation(
    (id) => api.delete(`/api/expense/${id}`),
    { onSuccess: () => { queryClient.invalidateQueries('expenses'); setDeleteDialogOpen(false); } }
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.accountId) delete payload.accountId;
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const handleEdit = (r) => {
    setEditingId(r._id);
    setFormData({
      expenseHead: r.expenseHead?._id || r.expenseHead || '',
      accountId: r.accountId?._id || r.accountId || '',
      name: r.name || '',
      date: r.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      amount: r.amount || '',
      description: r.description || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isBusy = createMutation.isLoading || updateMutation.isLoading;

  return (
    <Box sx={{ py: { xs: 1, sm: 1.5 }, backgroundColor: '#F8FAFC' }}>
      <Grid container spacing={1.5}>

        {/* ── Page Header ── */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: '12px 16px', border: '1px solid #eaeef3', borderRadius: '8px', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton 
                onClick={() => navigate('/dashboard')} 
                sx={{ 
                  bgcolor: '#F1F5F9', 
                  '&:hover': { bgcolor: '#E2E8F0' },
                  borderRadius: '12px',
                  p: 0.75
                }}
              >
                <ArrowBackIcon sx={{ color: '#475569', fontSize: '1.15rem' }} />
              </IconButton>
              <Box sx={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ExpenseIcon sx={{ fontSize: 20, color: '#EF4444' }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', lineHeight: 1.2 }}>Expense Management</Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>Record and manage expense transactions</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap', width: { xs: '100%', md: 'auto' }, overflowX: 'auto' }}>
              <StatChip label="Total" value={`৳${totalExpense.toLocaleString()}`} color="#EF4444" />
              <StatChip label="This Month" value={`৳${thisMonth.toLocaleString()}`} color="#F97316" />
              <StatChip label="Records" value={expenseRecords.length} color="#7C3AED" />
            </Box>
          </Paper>
        </Grid>

        {/* ── Entry Form ── */}
        {(canCreate || (editingId && canUpdate)) && (
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ border: '1px solid #eaeef3', borderRadius: '8px', overflow: 'hidden' }}>
              {/* Form title bar */}
              <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #eaeef3', backgroundColor: editingId ? '#FFF9F0' : '#FFF5F5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: editingId ? '#92400E' : '#991B1B' }}>
                  {editingId ? '✏️ Editing Expense Record' : '+ Record New Expense'}
                </Typography>
                {editingId && (
                  <Button size="small" onClick={reset} sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#64748b' }}>
                    Cancel Edit
                  </Button>
                )}
              </Box>

              <Box sx={{ p: 2 }}>
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={1.5}>
                    {/* Row 1 */}
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControl fullWidth size="small" required>
                        <InputLabel>Expense Type *</InputLabel>
                        <Select name="expenseHead" value={formData.expenseHead} onChange={handleChange} label="Expense Type *">
                          {expenseHeads.map(h => <MenuItem key={h._id} value={h._id}>{h.name}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField fullWidth size="small" label="Expense Name *" name="name" value={formData.name} onChange={handleChange} required />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField fullWidth size="small" label="Date *" type="date" name="date" value={formData.date} onChange={handleChange} InputLabelProps={{ shrink: true }} required />
                    </Grid>

                    {/* Row 2 */}
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth size="small" label="Amount *" type="number" name="amount"
                        value={formData.amount} onChange={handleChange} required
                        InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={7}>
                      <TextField fullWidth size="small" label="Description" name="description" value={formData.description} onChange={handleChange} placeholder="Optional notes…" />
                    </Grid>
                    <Grid item xs={12} sm={12} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Button fullWidth variant="contained" type="submit" disabled={isBusy} size="medium"
                        sx={{ textTransform: 'none', fontWeight: 600, backgroundColor: '#EF4444', '&:hover': { backgroundColor: '#DC2626' }, height: 40 }}>
                        {isBusy ? 'Saving…' : editingId ? 'Update' : 'Save Expense'}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* ── Records Table ── */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ border: '1px solid #eaeef3', borderRadius: '8px', overflow: 'hidden' }}>
            {/* Table toolbar */}
            <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid #eaeef3', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <TextField
                size="small" placeholder="Search records…" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                sx={{ minWidth: 240, '& .MuiInputBase-root': { fontSize: '0.825rem' } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: '#94A3B8' }} /></InputAdornment> }}
              />
              <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                {filtered.length} of {expenseRecords.length} records
              </Typography>
            </Box>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress size={24} /></Box>
            ) : filtered.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <ExpenseIcon sx={{ fontSize: 36, color: '#CBD5E1', mb: 1 }} />
                <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem' }}>No expense records found.</Typography>
              </Box>
            ) : (
              <>
                {/* Desktop view */}
                <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#F1F5F9', '& .MuiTableCell-head': { color: '#475569', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: '7px', px: '12px', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' } }}>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Description</TableCell>
                        {(canUpdate || canDelete) && <TableCell align="center">Actions</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.map((r, i) => (
                        <TableRow key={r._id} sx={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fbfd', '&:hover': { backgroundColor: '#FEF2F2' }, '& .MuiTableCell-root': { py: '5px', px: '12px', whiteSpace: 'nowrap' } }}>
                          <TableCell sx={{ color: '#64748b', fontSize: '0.8rem' }}>{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                          <TableCell>
                            <Chip label={r.expenseHead?.name || '—'} size="small" sx={{ backgroundColor: '#FEF2F2', color: '#991B1B', fontWeight: 600, fontSize: '0.7rem', height: 20 }} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 500, color: '#1e293b', fontSize: '0.825rem' }}>{r.name}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#EF4444', fontSize: '0.875rem' }}>৳{r.amount?.toLocaleString()}</TableCell>
                          <TableCell sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                            <Typography noWrap sx={{ fontSize: 'inherit', maxWidth: 200 }}>{r.description || '—'}</Typography>
                          </TableCell>
                          {(canUpdate || canDelete) && (
                            <TableCell align="center">
                              {canUpdate && (
                                <Tooltip title="Edit">
                                  <IconButton size="small" onClick={() => handleEdit(r)} sx={{ color: '#1D5F99', '&:hover': { backgroundColor: 'rgba(29,95,153,0.08)' } }}>
                                    <EditIcon sx={{ fontSize: 15 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {canDelete && (
                                <Tooltip title="Delete">
                                  <IconButton size="small" onClick={() => { setExpenseIdToDelete(r._id); setDeleteDialogOpen(true); }} sx={{ color: '#EF4444', '&:hover': { backgroundColor: 'rgba(239,68,68,0.08)' } }}>
                                    <DeleteIcon sx={{ fontSize: 15 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Mobile View Cards */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, p: 1.5, backgroundColor: '#F8FAFC' }}>
                  {filtered.map((r) => (
                    <Paper key={r._id} elevation={0} sx={{ p: 2, border: '1px solid #eaeef3', borderRadius: '12px', backgroundColor: '#fff', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}>
                          {new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Typography>
                        <Chip
                          label={r.expenseHead?.name || '—'}
                          size="small"
                          sx={{ backgroundColor: '#FEF2F2', color: '#991B1B', fontWeight: 600, fontSize: '0.65rem', height: 20 }}
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ flex: 1, pr: 1 }}>
                          <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem', mb: 0.5 }}>
                            {r.name}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 700, color: '#EF4444', fontSize: '0.9rem', textAlign: 'right' }}>
                          ৳{r.amount?.toLocaleString()}
                        </Typography>
                      </Box>
                      
                      {r.description && (
                        <Box sx={{ backgroundColor: '#F8FAFC', p: 1, borderRadius: '6px', mb: 1 }}>
                          <Typography sx={{ color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic', wordBreak: 'break-word' }}>
                            "{r.description}"
                          </Typography>
                        </Box>
                      )}
                      
                      {(canUpdate || canDelete) && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', pt: 1, gap: 1 }}>
                          {canUpdate && (
                            <Button
                              size="small"
                              startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                              onClick={() => handleEdit(r)}
                              sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.5, color: '#1D5F99', '&:hover': { backgroundColor: 'rgba(29,95,153,0.05)' } }}
                            >
                              Edit
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteIcon sx={{ fontSize: 14 }} />}
                              onClick={() => { setExpenseIdToDelete(r._id); setDeleteDialogOpen(true); }}
                              sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.5, '&:hover': { backgroundColor: 'rgba(239,68,68,0.05)' } }}
                            >
                              Delete
                            </Button>
                          )}
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── Delete Dialog ── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Delete Expense?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.875rem' }}>This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, borderTop: '1px solid #eaeef3', gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} size="small" variant="outlined" sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={() => deleteMutation.mutate(expenseIdToDelete)} size="small" color="error" variant="contained" disabled={deleteMutation.isLoading} sx={{ textTransform: 'none' }}>
            {deleteMutation.isLoading ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Expense;