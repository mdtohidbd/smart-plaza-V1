import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Alert, CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, TrendingUp,
  AccountBalanceWallet, Key as KeyIcon, Groups,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import api from '../../utils/api';
import { format } from 'date-fns';
import {
  InvestorPage, PageHeader, StatGrid, SectionCard, LoadingState,
  colors, formatCurrency, btnSx, tableHeadSx,
} from './investorUi';

const Investors = () => {
  const [investors, setInvestors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '',
    investmentAmount: '',
    investedDate: format(new Date(), 'yyyy-MM-dd'), notes: '',
  });
  const [pwDialog, setPwDialog] = useState(false);
  const [pwInvestorId, setPwInvestorId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, statsRes] = await Promise.all([
        api.get('/api/investors'),
        api.get('/api/investors/stats'),
      ]);
      setInvestors(invRes.data.data || []);
      setStats(statsRes.data.data?.overall || null);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load investors');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (investor = null) => {
    setSelectedInvestor(investor);
    if (investor) {
      setFormData({
        name: investor.name || '',
        email: investor.email || '',
        phone: investor.phone || '',
        password: '',
        investmentAmount: investor.investmentAmount || '',
        investedDate: investor.investedDate ? format(new Date(investor.investedDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        notes: investor.notes || '',
      });
    } else {
      setFormData({
        name: '', email: '', phone: '', password: '', investmentAmount: '',
        investedDate: format(new Date(), 'yyyy-MM-dd'), notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      setError(null);
      if (selectedInvestor && !selectedInvestor.isPlaceholder) {
        const { password, ...updateData } = formData;
        await api.put(`/api/investors/${selectedInvestor._id}`, updateData);
      } else {
        await api.post('/api/investors', formData);
      }
      fetchData();
      setOpenDialog(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving investor');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (invId) => {
    if (!window.confirm('Are you sure you want to remove this investor?')) return;
    try {
      await api.delete(`/api/investors/${invId}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error removing investor');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      setPwLoading(true);
      await api.post(`/api/investors/${pwInvestorId}/change-password`, { newPassword });
      setPwDialog(false);
      setNewPassword('');
      setPwInvestorId(null);
      setError(null);
      alert('Password updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Error changing password');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) return <InvestorPage><LoadingState label="Loading investors…" /></InvestorPage>;

  return (
    <InvestorPage>
      <PageHeader
        icon={<Groups sx={{ fontSize: 20 }} />}
        title="Investor Management"
        subtitle="Manage investor accounts — each investor has a login with an admin-assigned profit share."
        action={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              component={Link}
              to="/dashboard/investors/demo-dashboard"
              variant="outlined"
              size="small"
              sx={{ ...btnSx, borderColor: colors.border, color: colors.textSecondary }}
            >
              Demo View
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
              onClick={() => handleOpenDialog()}
              sx={{ ...btnSx, bgcolor: colors.accent, '&:hover': { bgcolor: '#0D9488' } }}
            >
              Add Investor
            </Button>
          </Box>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {stats && (
        <StatGrid
          items={[
            { key: 'pool', label: 'Investment Pool', value: formatCurrency(stats.totalInvestment), icon: <AccountBalanceWallet />, tone: 'accent' },
            { key: 'profit', label: 'Profits Distributed', value: formatCurrency(stats.totalProfitEarned), icon: <TrendingUp />, tone: 'success' },
            { key: 'withdrawn', label: 'Total Withdrawn', value: formatCurrency(stats.totalWithdrawn), icon: <TrendingUp />, tone: 'error' },
            { key: 'count', label: 'Active Investors', value: stats.totalInvestors, icon: <Groups />, tone: 'info' },
          ]}
        />
      )}

      {/* Pie Chart for Capital Distribution */}
      {!loading && investors.length > 0 && (
        <SectionCard title="Capital Distribution" sx={{ mb: 3 }}>
          <Box sx={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={investors.filter(inv => !inv.isPlaceholder && inv.investmentAmount > 0)}
                  dataKey="investmentAmount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill={colors.accent}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                >
                  {investors.filter(inv => !inv.isPlaceholder && inv.investmentAmount > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={[colors.accent, colors.success, colors.info, colors.warning, colors.error, '#8884d8', '#82ca9d', '#ffc658'][index % 8]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </SectionCard>
      )}

      <SectionCard bodySx={{ p: 0 }}>
        <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
          <Table size="small">
            <TableHead sx={tableHeadSx}>
              <TableRow>
                <TableCell>Investor</TableCell>
                <TableCell align="right">Capital</TableCell>
                <TableCell align="center">Share %</TableCell>
                <TableCell align="right">Profit Earned</TableCell>
                <TableCell align="right">Withdrawn</TableCell>
                <TableCell align="right">Available</TableCell>
                <TableCell align="center">Joined</TableCell>
                <TableCell align="center" width={120}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {investors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: colors.textMuted, fontSize: '0.8125rem' }}>
                    No investors found. Add one using the button above.
                  </TableCell>
                </TableRow>
              ) : (
                investors.map((inv, idx) => (
                  <TableRow key={inv._id || idx} hover sx={{ '& td': { py: 1.25, fontSize: '0.8125rem', borderColor: colors.borderLight } }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: '0.8125rem' }}>{inv.name}</Typography>
                      <Typography sx={{ fontSize: '0.6875rem', color: colors.textMuted }}>{inv.email || inv.phone}</Typography>
                      {inv.isPlaceholder && (
                        <Chip size="small" label="No profile" color="warning" variant="outlined" sx={{ mt: 0.5, height: 20, fontSize: '0.625rem' }} />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: colors.accent }}>{formatCurrency(inv.investmentAmount)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={`${(inv.profitSharePercentage || 0).toFixed(1)}%`}
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 600, borderColor: colors.border, color: colors.textSecondary }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ color: colors.success, fontWeight: 500 }}>{formatCurrency(inv.totalProfitEarned)}</TableCell>
                    <TableCell align="right" sx={{ color: colors.error }}>{formatCurrency(inv.totalWithdrawn)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: colors.text }}>{formatCurrency(inv.availableBalance)}</TableCell>
                    <TableCell align="center" sx={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                      {inv.investedDate ? format(new Date(inv.investedDate), 'dd MMM yyyy') : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25 }}>
                        {!inv.isPlaceholder && (
                          <>
                            <Tooltip title="Dashboard">
                              <IconButton size="small" component={Link} to={`/dashboard/investors/dashboard/${inv._id}`} sx={{ color: colors.accent }}>
                                <TrendingUp sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Password">
                              <IconButton size="small" sx={{ color: colors.warning }} onClick={() => { setPwInvestorId(inv._id); setPwDialog(true); }}>
                                <KeyIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenDialog(inv)} sx={{ color: colors.textSecondary }}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        {!inv.isPlaceholder && (
                          <Tooltip title="Remove">
                            <IconButton size="small" sx={{ color: colors.error }} onClick={() => handleDelete(inv._id)}>
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Mobile cards */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, p: 1.5 }}>
          {investors.length === 0 ? (
            <Typography sx={{ py: 3, textAlign: 'center', color: colors.textMuted, fontSize: '0.8125rem' }}>
              No investors found.
            </Typography>
          ) : (
            investors.map((inv, idx) => (
              <Box
                key={inv._id || idx}
                sx={{ p: 1.5, border: `1px solid ${colors.borderLight}`, borderRadius: '8px', bgcolor: colors.bg }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: colors.text }}>{inv.name}</Typography>
                    <Typography sx={{ fontSize: '0.6875rem', color: colors.textMuted }}>{inv.email || inv.phone}</Typography>
                  </Box>
                  <Chip size="small" label={`${(inv.profitSharePercentage || 0).toFixed(1)}%`} variant="outlined" sx={{ height: 22, fontSize: '0.6875rem' }} />
                </Box>
                <Grid container spacing={1} sx={{ mb: 1 }}>
                  {[
                    { label: 'Capital', value: formatCurrency(inv.investmentAmount), color: colors.accent },
                    { label: 'Available', value: formatCurrency(inv.availableBalance), color: colors.text },
                    { label: 'Earned', value: formatCurrency(inv.totalProfitEarned), color: colors.success },
                    { label: 'Withdrawn', value: formatCurrency(inv.totalWithdrawn), color: colors.error },
                  ].map((item) => (
                    <Grid item xs={6} key={item.label}>
                      <Typography sx={{ fontSize: '0.625rem', color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</Typography>
                      <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: item.color }}>{item.value}</Typography>
                    </Grid>
                  ))}
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, pt: 1, borderTop: `1px solid ${colors.borderLight}` }}>
                  {!inv.isPlaceholder && (
                    <>
                      <IconButton size="small" component={Link} to={`/dashboard/investors/dashboard/${inv._id}`} sx={{ color: colors.accent }}>
                        <TrendingUp sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton size="small" sx={{ color: colors.warning }} onClick={() => { setPwInvestorId(inv._id); setPwDialog(true); }}>
                        <KeyIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </>
                  )}
                  <IconButton size="small" onClick={() => handleOpenDialog(inv)}><EditIcon sx={{ fontSize: 16 }} /></IconButton>
                  {!inv.isPlaceholder && (
                    <IconButton size="small" sx={{ color: colors.error }} onClick={() => handleDelete(inv._id)}>
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>
              </Box>
            ))
          )}
        </Box>
      </SectionCard>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1 }}>
            {selectedInvestor ? 'Edit Investor' : 'New Investor Account'}
          </DialogTitle>
          <DialogContent>
            {!selectedInvestor && (
              <Alert severity="info" sx={{ mb: 2, mt: 0.5, fontSize: '0.8125rem' }}>
                Creates a login account with the provided email and password.
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required size="small" label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required size="small" label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={selectedInvestor ? 12 : 6}>
                <TextField fullWidth required={!selectedInvestor} size="small" type="email" label="Email (Login ID)" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </Grid>
              {!selectedInvestor && (
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth required size="small" type="password" label="Initial Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} helperText="Investor uses this to log in" />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required size="small" type="number" label="Capital Investment (BDT)" value={formData.investmentAmount} onChange={(e) => setFormData({ ...formData, investmentAmount: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required size="small" type="date" label="Date of Joining" InputLabelProps={{ shrink: true }} value={formData.investedDate} onChange={(e) => setFormData({ ...formData, investedDate: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={selectedInvestor ? 6 : 12}>
                <TextField fullWidth size="small" label="Notes (Optional)" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setOpenDialog(false)} color="inherit" sx={btnSx}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitLoading} sx={{ ...btnSx, bgcolor: colors.accent, '&:hover': { bgcolor: '#0D9488' } }}>
              {submitLoading ? <CircularProgress size={18} color="inherit" /> : (selectedInvestor ? 'Update' : 'Create Account')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={pwDialog} onClose={() => { setPwDialog(false); setNewPassword(''); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth required size="small" type="password" label="New Password" sx={{ mt: 1 }}
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            helperText="Minimum 6 characters"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => { setPwDialog(false); setNewPassword(''); }} color="inherit" sx={btnSx}>Cancel</Button>
          <Button variant="contained" onClick={handleChangePassword} disabled={pwLoading} sx={{ ...btnSx, bgcolor: colors.warning, '&:hover': { bgcolor: '#B45309' } }}>
            {pwLoading ? <CircularProgress size={18} color="inherit" /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </InvestorPage>
  );
};

export default Investors;
