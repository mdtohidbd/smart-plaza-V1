import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// ── Shared Head Form Dialog ────────────────────────────────────────────────────
const HeadDialog = ({ open, onClose, onSubmit, title, editingHead, isLoading, error }) => {
  const [form, setForm] = useState({ name: '', description: '', isActive: true });

  useEffect(() => {
    if (editingHead) {
      setForm({
        name: editingHead.name || '',
        description: editingHead.description || '',
        isActive: editingHead.isActive ?? true,
      });
    } else {
      setForm({ name: '', description: '', isActive: true });
    }
  }, [editingHead, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', pb: 1 }}>
        {editingHead ? `Edit "${editingHead.name}"` : title}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1, pb: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Type Name *"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                autoFocus
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    size="small"
                    color="success"
                  />
                }
                label={<Typography sx={{ fontSize: '0.875rem' }}>Active</Typography>}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, borderTop: '1px solid #eaeef3', gap: 1 }}>
          <Button onClick={onClose} size="small" variant="outlined" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="small"
            variant="contained"
            disabled={isLoading}
            sx={{ textTransform: 'none', backgroundColor: '#1D5F99', '&:hover': { backgroundColor: '#1a5490' } }}
          >
            {isLoading ? 'Saving…' : editingHead ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// ── Head Table ─────────────────────────────────────────────────────────────────
const HeadTable = ({ heads, isLoading, canUpdate, canDelete, accentColor, onEdit, onDelete }) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!heads || heads.length === 0) {
    return (
      <Box sx={{ py: 5, textAlign: 'center' }}>
        <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem' }}>
          No types defined yet. Click "Add" to create one.
        </Typography>
      </Box>
    );
  }

  return (
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
              <TableCell>#</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              {(canUpdate || canDelete) && <TableCell align="center">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {heads.map((head, index) => (
              <TableRow
                key={head._id}
                sx={{
                  backgroundColor: index % 2 === 0 ? '#fff' : '#f9fbfd',
                  '&:hover': { backgroundColor: '#EFF6FF' },
                  '& .MuiTableCell-root': { py: '6px', px: '12px' },
                }}
              >
                <TableCell sx={{ color: '#94A3B8', width: 40 }}>{index + 1}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{head.name}</TableCell>
                <TableCell sx={{ color: '#64748b', fontSize: '0.825rem' }}>{head.description || '—'}</TableCell>
                <TableCell>
                  <Chip
                    label={head.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={head.isActive ? 'success' : 'default'}
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                </TableCell>
                {(canUpdate || canDelete) && (
                  <TableCell align="center">
                    {canUpdate && (
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => onEdit(head)}
                          sx={{ color: '#1D5F99', '&:hover': { backgroundColor: 'rgba(29,95,153,0.08)' } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => onDelete(head)}
                          sx={{ color: '#EF4444', '&:hover': { backgroundColor: 'rgba(239,68,68,0.08)' } }}
                        >
                          <DeleteIcon fontSize="small" />
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

      {/* Mobile view */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, p: 1.5, backgroundColor: '#F8FAFC' }}>
        {heads.map((head, index) => (
          <Paper key={head._id} elevation={0} sx={{ p: 2, border: '1px solid #eaeef3', borderRadius: '12px', backgroundColor: '#fff', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: head.description ? 1 : 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600 }}>
                  #{index + 1}
                </Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
                  {head.name}
                </Typography>
              </Box>
              <Chip
                label={head.isActive ? 'Active' : 'Inactive'}
                size="small"
                color={head.isActive ? 'success' : 'default'}
                variant="outlined"
                sx={{ fontSize: '0.65rem', height: 20 }}
              />
            </Box>
            
            {head.description && (
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.78rem', lineHeight: 1.4 }}>
                  {head.description}
                </Typography>
              </Box>
            )}
            
            {(canUpdate || canDelete) && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', pt: 1, gap: 1 }}>
                {canUpdate && (
                  <Button
                    size="small"
                    startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                    onClick={() => onEdit(head)}
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
                    onClick={() => onDelete(head)}
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
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const HeadsManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(0); // 0 = income, 1 = expense
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHead, setEditingHead] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [headToDelete, setHeadToDelete] = useState(null);
  const [formError, setFormError] = useState('');

  // Refresh on shop change
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries('incomeHeads');
      queryClient.invalidateQueries('expenseHeads');
    };
    window.addEventListener('shopChanged', handler);
    return () => window.removeEventListener('shopChanged', handler);
  }, [queryClient]);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: incomeHeads = [], isLoading: loadingIncome } = useQuery(
    'incomeHeads',
    async () => (await api.get('/api/incomeHeads')).data.data,
    { refetchOnWindowFocus: false }
  );

  const { data: rawExpenseHeads = [], isLoading: loadingExpense } = useQuery(
    'expenseHeads',
    async () => (await api.get('/api/expenseHeads')).data.data,
    { refetchOnWindowFocus: false }
  );

  const expenseHeads = useMemo(() => {
    return rawExpenseHeads.filter(h => h.name !== 'Purchase' && h.name !== 'Purchase Cost');
  }, [rawExpenseHeads]);

  const canCreate = user?.role === 'Super Admin' || user?.permissions?.accounts?.create;
  const canUpdate = user?.role === 'Super Admin' || user?.permissions?.accounts?.update;
  const canDelete = user?.role === 'Super Admin' || user?.permissions?.accounts?.delete;

  const isIncome = activeTab === 0;
  const endpoint = isIncome ? '/api/incomeHeads' : '/api/expenseHeads';
  const queryKey = isIncome ? 'incomeHeads' : 'expenseHeads';

  // ── Mutations ──────────────────────────────────────────────────────────────────
  const createMutation = useMutation(
    (data) => api.post(endpoint, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKey);
        setDialogOpen(false);
        setFormError('');
      },
      onError: (err) => setFormError(err.response?.data?.message || 'Failed to create head.'),
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => api.put(`${endpoint}/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKey);
        setDialogOpen(false);
        setFormError('');
      },
      onError: (err) => setFormError(err.response?.data?.message || 'Failed to update head.'),
    }
  );

  const deleteMutation = useMutation(
    (id) => api.delete(`${endpoint}/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKey);
        setDeleteDialogOpen(false);
        setHeadToDelete(null);
      },
      onError: (err) => alert(err.response?.data?.message || 'Failed to delete head.'),
    }
  );

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingHead(null);
    setFormError('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (head) => {
    setEditingHead(head);
    setFormError('');
    setDialogOpen(true);
  };

  const handleSubmit = (formData) => {
    setFormError('');
    if (editingHead) {
      updateMutation.mutate({ id: editingHead._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDeleteClick = (head) => {
    setHeadToDelete(head);
    setDeleteDialogOpen(true);
  };

  // ── Render ─────────────────────────────────────────────────────────────────────
  const currentHeads = isIncome ? incomeHeads : expenseHeads;
  const currentLoading = isIncome ? loadingIncome : loadingExpense;
  const accentColor = isIncome ? '#059669' : '#EF4444';

  return (
    <Box sx={{ py: { xs: 1, sm: 2 }, backgroundColor: '#F8FAFC' }}>
      <Grid container spacing={1.5}>
        {/* ── Header ── */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
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
                Types Management
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                Define and manage income and expense category types.
              </Typography>
            </Box>
            {canCreate && (
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleOpenAdd}
                sx={{
                  backgroundColor: accentColor,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  py: { xs: 0.75, sm: 0.5 },
                  '&:hover': { backgroundColor: isIncome ? '#047857' : '#DC2626' },
                }}
              >
                Add {isIncome ? 'Types Income' : 'Types Expense'}
              </Button>
            )}
          </Paper>
        </Grid>



        {/* ── Tabs + Table ── */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ border: '1px solid #eaeef3', borderRadius: '8px', overflow: 'hidden' }}>
            <Box sx={{ borderBottom: '1px solid #e2e8f0' }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{
                  px: 2,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    minHeight: 44,
                    color: '#64748b',
                  },
                  '& .Mui-selected': { color: '#1D5F99 !important' },
                  '& .MuiTabs-indicator': { backgroundColor: '#1D5F99' },
                }}
              >
                <Tab
                  icon={<IncomeIcon sx={{ fontSize: 16 }} />}
                  iconPosition="start"
                  label={`Types Income (${incomeHeads.length})`}
                />
                <Tab
                  icon={<ExpenseIcon sx={{ fontSize: 16 }} />}
                  iconPosition="start"
                  label={`Types Expense (${expenseHeads.length})`}
                />
              </Tabs>
            </Box>

            <HeadTable
              heads={currentHeads}
              isLoading={currentLoading}
              canUpdate={canUpdate}
              canDelete={canDelete}
              accentColor={accentColor}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteClick}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* ── Add / Edit Dialog ── */}
      <HeadDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setFormError(''); }}
        onSubmit={handleSubmit}
        title={`Add ${isIncome ? 'Types Income' : 'Types Expense'}`}
        editingHead={editingHead}
        isLoading={createMutation.isLoading || updateMutation.isLoading}
        error={formError}
      />

      {/* ── Delete Confirm ── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Delete Type?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.875rem' }}>
            Are you sure you want to delete <strong>{headToDelete?.name}</strong>?
            Any transactions using this type will lose their category reference.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, borderTop: '1px solid #eaeef3', gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} size="small" variant="outlined" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={() => deleteMutation.mutate(headToDelete?._id)}
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

export default HeadsManagement;
