import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CreditCard as CardIcon,
  PhoneAndroid as MfsIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';

const emptyMachine = { name: '', bankName: '', feePercentage: 0, isActive: true };
const emptyProvider = { name: '', feePerThousand: 0, isActive: true };

const PaymentConfig = () => {
  const queryClient = useQueryClient();

  // POS Machine state
  const [machineDialog, setMachineDialog] = useState(false);
  const [editMachine, setEditMachine] = useState(null);
  const [machineForm, setMachineForm] = useState(emptyMachine);

  // MFS Provider state
  const [providerDialog, setProviderDialog] = useState(false);
  const [editProvider, setEditProvider] = useState(null);
  const [providerForm, setProviderForm] = useState(emptyProvider);

  const [error, setError] = useState('');

  // ---- POS Machines ----
  const { data: machinesRes, isLoading: machinesLoading } = useQuery(
    'pos-machines',
    () => api.get('/api/pos-machines').then(r => r.data.data),
    { refetchOnWindowFocus: false }
  );
  const machines = machinesRes || [];

  const saveMachine = useMutation(
    (data) => editMachine
      ? api.put(`/api/pos-machines/${editMachine._id}`, data)
      : api.post('/api/pos-machines', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pos-machines');
        setMachineDialog(false);
        setEditMachine(null);
        setMachineForm(emptyMachine);
      },
      onError: (err) => setError(err.response?.data?.message || 'Error saving POS Machine')
    }
  );

  const deleteMachine = useMutation(
    (id) => api.delete(`/api/pos-machines/${id}`),
    { onSuccess: () => queryClient.invalidateQueries('pos-machines') }
  );

  const openMachineDialog = (machine = null) => {
    setEditMachine(machine);
    setMachineForm(machine ? { name: machine.name, bankName: machine.bankName || '', feePercentage: machine.feePercentage || 0, isActive: machine.isActive } : emptyMachine);
    setMachineDialog(true);
  };

  // ---- MFS Providers ----
  const { data: providersRes, isLoading: providersLoading } = useQuery(
    'mfs-providers',
    () => api.get('/api/mfs-providers').then(r => r.data.data),
    { refetchOnWindowFocus: false }
  );
  const providers = providersRes || [];

  const saveProvider = useMutation(
    (data) => editProvider
      ? api.put(`/api/mfs-providers/${editProvider._id}`, data)
      : api.post('/api/mfs-providers', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('mfs-providers');
        setProviderDialog(false);
        setEditProvider(null);
        setProviderForm(emptyProvider);
      },
      onError: (err) => setError(err.response?.data?.message || 'Error saving MFS Provider')
    }
  );

  const deleteProvider = useMutation(
    (id) => api.delete(`/api/mfs-providers/${id}`),
    { onSuccess: () => queryClient.invalidateQueries('mfs-providers') }
  );

  const openProviderDialog = (provider = null) => {
    setEditProvider(provider);
    setProviderForm(provider ? { name: provider.name, feePerThousand: provider.feePerThousand || 0, isActive: provider.isActive } : emptyProvider);
    setProviderDialog(true);
  };

  const sectionHeader = (icon, title, onAdd) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '14px' }}>{title}</Typography>
      </Box>
      <Button
        size="small"
        startIcon={<AddIcon sx={{ fontSize: 14 }} />}
        onClick={onAdd}
        variant="contained"
        sx={{ fontSize: '11px', textTransform: 'none', borderRadius: '8px', py: 0.5, px: 1.5 }}
      >
        Add
      </Button>
    </Box>
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '16px' }}>
        Payment Configuration
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748B', mb: 3, fontSize: '12px' }}>
        Manage POS terminals (Card payments) and Mobile Financial Service providers (MFS payments). These will appear as options during checkout.
      </Typography>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2.5}>
        {/* POS Machines */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
            {sectionHeader(
              <CardIcon sx={{ color: '#8B5CF6', fontSize: 20 }} />,
              'Card / POS Terminals',
              () => openMachineDialog()
            )}
            {machinesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : machines.length === 0 ? (
              <Typography sx={{ color: '#94A3B8', fontSize: '12px', textAlign: 'center', py: 3 }}>
                No POS terminals configured. Add one to enable Card payments.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Terminal</TableCell>
                      <TableCell sx={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Bank / POS Name</TableCell>
                      <TableCell sx={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Fee (%)</TableCell>
                      <TableCell sx={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Status</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {machines.map(m => (
                      <TableRow key={m._id} hover>
                        <TableCell sx={{ fontSize: '12px' }}>{m.name}</TableCell>
                        <TableCell sx={{ fontSize: '12px', color: '#64748B' }}>{m.bankName || '—'}</TableCell>
                        <TableCell sx={{ fontSize: '12px' }}>
                          <Chip
                            label={`${m.feePercentage || 0}%`}
                            size="small"
                            sx={{ fontSize: '10px', height: '18px', backgroundColor: '#FEF3C7', color: '#92400E' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={m.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            sx={{
                              fontSize: '10px', height: '18px',
                              backgroundColor: m.isActive ? '#DCFCE7' : '#F1F5F9',
                              color: m.isActive ? '#166534' : '#64748B'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => openMachineDialog(m)} sx={{ p: 0.25 }}>
                            <EditIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <IconButton size="small" onClick={() => deleteMachine.mutate(m._id)} sx={{ p: 0.25, color: '#EF4444' }}>
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* MFS Providers */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
            {sectionHeader(
              <MfsIcon sx={{ color: '#F59E0B', fontSize: 20 }} />,
              'MFS Providers (bKash, Nagad...)',
              () => openProviderDialog()
            )}
            {providersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : providers.length === 0 ? (
              <Typography sx={{ color: '#94A3B8', fontSize: '12px', textAlign: 'center', py: 3 }}>
                No MFS providers configured. Add one to enable MFS payments.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Provider</TableCell>
                      <TableCell sx={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Fee (per 1000 TK)</TableCell>
                      <TableCell sx={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Status</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {providers.map(p => (
                      <TableRow key={p._id} hover>
                        <TableCell sx={{ fontSize: '12px', fontWeight: 600 }}>{p.name}</TableCell>
                        <TableCell sx={{ fontSize: '12px' }}>
                          <Chip
                            label={`৳${p.feePerThousand || 0}`}
                            size="small"
                            sx={{ fontSize: '10px', height: '18px', backgroundColor: '#FEF3C7', color: '#92400E' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={p.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            sx={{
                              fontSize: '10px', height: '18px',
                              backgroundColor: p.isActive ? '#DCFCE7' : '#F1F5F9',
                              color: p.isActive ? '#166534' : '#64748B'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => openProviderDialog(p)} sx={{ p: 0.25 }}>
                            <EditIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <IconButton size="small" onClick={() => deleteProvider.mutate(p._id)} sx={{ p: 0.25, color: '#EF4444' }}>
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* POS Machine Dialog */}
      <Dialog open={machineDialog} onClose={() => setMachineDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '15px', fontWeight: 700 }}>
          {editMachine ? 'Edit POS Terminal' : 'Add POS Terminal'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Terminal Name" size="small"
                value={machineForm.name}
                onChange={(e) => setMachineForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Counter 1, bKash POS"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Bank / POS Name" size="small"
                value={machineForm.bankName}
                onChange={(e) => setMachineForm(p => ({ ...p, bankName: e.target.value }))}
                placeholder="e.g. BRAC Bank"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Transaction Fee (%)" size="small" type="number"
                value={machineForm.feePercentage}
                onChange={(e) => setMachineForm(p => ({ ...p, feePercentage: parseFloat(e.target.value) || 0 }))}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={machineForm.isActive} onChange={(e) => setMachineForm(p => ({ ...p, isActive: e.target.checked }))} />}
                label={<Typography sx={{ fontSize: '13px' }}>Active</Typography>}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMachineDialog(false)} sx={{ textTransform: 'none', fontSize: '13px' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => saveMachine.mutate(machineForm)}
            disabled={!machineForm.name || saveMachine.isLoading}
            sx={{ textTransform: 'none', fontSize: '13px', borderRadius: '8px' }}
          >
            {saveMachine.isLoading ? <CircularProgress size={16} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MFS Provider Dialog */}
      <Dialog open={providerDialog} onClose={() => setProviderDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '15px', fontWeight: 700 }}>
          {editProvider ? 'Edit MFS Provider' : 'Add MFS Provider'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Provider Name" size="small"
                value={providerForm.name}
                onChange={(e) => setProviderForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. bKash, Nagad, Rocket"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Fee (per 1000 TK)" size="small" type="number"
                value={providerForm.feePerThousand}
                onChange={(e) => setProviderForm(p => ({ ...p, feePerThousand: parseFloat(e.target.value) || 0 }))}
                inputProps={{ min: 0, step: 0.1 }}
                helperText="Flat fee applied per 1000 TK"
                FormHelperTextProps={{ sx: { fontSize: '10px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={providerForm.isActive} onChange={(e) => setProviderForm(p => ({ ...p, isActive: e.target.checked }))} />}
                label={<Typography sx={{ fontSize: '13px' }}>Active</Typography>}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setProviderDialog(false)} sx={{ textTransform: 'none', fontSize: '13px' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => saveProvider.mutate(providerForm)}
            disabled={!providerForm.name || saveProvider.isLoading}
            sx={{ textTransform: 'none', fontSize: '13px', borderRadius: '8px' }}
          >
            {saveProvider.isLoading ? <CircularProgress size={16} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentConfig;
