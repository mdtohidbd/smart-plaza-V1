import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
} from '@mui/material';
import {
  AccountBalanceWallet, TrendingUp, RemoveCircle, ReceiptLong, ShowChart,
} from '@mui/icons-material';
import { useParams, useLocation } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import {
  InvestorPage, PageHeader, StatGrid, SectionCard, EmptyState, LoadingState,
  colors, formatCurrency, btnSx,
} from './investorUi';

const statusColor = (status) => {
  if (status === 'Approved') return 'success';
  if (status === 'Pending') return 'warning';
  return 'error';
};

const ProfitGrowthTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <Box sx={{ bgcolor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '8px', px: 1.5, py: 1 }}>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: colors.text, mb: 0.5 }}>
        Day {point.day}
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary }}>
        Daily profit: <Box component="span" sx={{ fontWeight: 600, color: colors.success }}>{formatCurrency(point.dailyProfit)}</Box>
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary }}>
        Running total: <Box component="span" sx={{ fontWeight: 700, color: colors.success }}>{formatCurrency(point.cumulativeProfit)}</Box>
      </Typography>
    </Box>
  );
};

const InvestorDashboard = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const location = useLocation();
  const isDemo = location.pathname.includes('demo-dashboard');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [withdrawalDialog, setWithdrawalDialog] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState({ amount: '', type: 'Profit', note: '' });

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const endpoint = isDemo ? '/api/investors/demo-dashboard' : `/api/investors/dashboard/${id || 'my'}`;
        let response;
        try {
          response = await api.get(endpoint);
        } catch (err) {
          if (err.response?.status === 404 && (user?.role === 'Super Admin' || user?.role === 'Admin') && !isDemo && !id) {
            response = await api.get('/api/investors/demo-dashboard');
          } else {
            throw err;
          }
        }
        if (cancelled) return;
        setData(response.data.data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching dashboard:', err);
        setData(null);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [id, isDemo, user?.role]);

  const handleWithdrawal = async () => {
    try {
      setError(null);
      if (!withdrawalForm.amount || Number(withdrawalForm.amount) <= 0) {
        setError('Enter a valid amount');
        return;
      }
      await api.post('/api/investors/withdraw', {
        investorId: data.investor._id,
        amount: Number(withdrawalForm.amount),
        type: withdrawalForm.type,
        note: withdrawalForm.note,
      });
      setSuccess('Withdrawal request submitted successfully');
      setWithdrawalDialog(false);
      setWithdrawalForm({ amount: '', type: 'Profit', note: '' });
      const endpoint = isDemo ? '/api/investors/demo-dashboard' : `/api/investors/dashboard/${id || 'my'}`;
      const response = await api.get(endpoint);
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit withdrawal');
    }
  };

  if (loading) return <InvestorPage><LoadingState label="Loading dashboard…" /></InvestorPage>;
  if (error && !data) return <InvestorPage><Alert severity="error">{error}</Alert></InvestorPage>;
  if (!data) return <InvestorPage><Alert severity="error">No data found.</Alert></InvestorPage>;

  const isDemoView = isDemo || data.isDemo;
  const { investor, profitGrowth, withdrawalRequests } = data;
  const chartData = profitGrowth?.data || [];
  const currentMonthProfit = profitGrowth?.currentTotalProfit ?? 0;
  const chartTitle = profitGrowth?.monthLabel ? `Profit Growth — ${profitGrowth.monthLabel}` : 'Profit Growth — This Month';

  const pageTitle = isDemoView ? 'All Investors Overview' : `${investor.name}'s Dashboard`;
  const pageSubtitle = isDemoView
    ? 'Aggregate metrics across all investors'
    : 'Your personal investment and profit metrics';

  return (
    <InvestorPage>
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        action={
          !isDemoView && (
            <Button variant="contained" onClick={() => setWithdrawalDialog(true)} sx={{ ...btnSx, bgcolor: colors.accent, '&:hover': { bgcolor: '#0D9488' } }}>
              Request Withdrawal
            </Button>
          )
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <StatGrid
        items={[
          { key: 'capital', label: 'Capital Invested', value: formatCurrency(investor.investmentAmount), icon: <AccountBalanceWallet />, tone: 'accent' },
          { key: 'profit', label: 'Available Profit', value: formatCurrency(investor.availableBalance), icon: <TrendingUp />, tone: 'success' },
          { key: 'withdrawn', label: 'Total Withdrawn', value: formatCurrency(investor.totalWithdrawn), icon: <RemoveCircle />, tone: 'error' },
          { key: 'share', label: 'Profit Share', value: `${(investor.profitSharePercentage || 0).toFixed(2)}%`, icon: <ReceiptLong />, tone: 'info' },
        ]}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <SectionCard
            title={chartTitle}
            action={
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Current Total Profit
                </Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: colors.success, lineHeight: 1.2 }}>
                  {formatCurrency(currentMonthProfit)}
                </Typography>
              </Box>
            }
          >
            <Box sx={{ height: 280 }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="profitGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.success} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={colors.success} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.borderLight} />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: colors.textSecondary }}
                      label={{ value: 'Day of month', position: 'insideBottom', offset: -2, fontSize: 10, fill: colors.textMuted }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: colors.textSecondary }}
                      tickFormatter={(val) => `৳${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                      width={52}
                    />
                    <RechartsTooltip content={<ProfitGrowthTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="cumulativeProfit"
                      stroke={colors.success}
                      strokeWidth={2.5}
                      fill="url(#profitGrowthGrad)"
                      dot={{ r: 4, fill: colors.success, stroke: colors.surface, strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: colors.success, stroke: colors.surface, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No profit data for this month yet." icon={<ShowChart />} />
              )}
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          <SectionCard title="Recent Withdrawals" bodySx={{ p: 0 }}>
            {withdrawalRequests.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {withdrawalRequests.slice(0, 6).map((req) => (
                      <TableRow key={req._id} sx={{ '& td': { borderColor: colors.borderLight, py: 1.25 } }}>
                        <TableCell sx={{ pl: 2 }}>
                          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.text }}>
                            {formatCurrency(req.amount)}
                          </Typography>
                          <Typography sx={{ fontSize: '0.6875rem', color: colors.textMuted }}>
                            {req.requestDate ? format(new Date(req.requestDate), 'dd MMM yyyy') : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 2 }}>
                          <Chip
                            size="small"
                            label={req.status}
                            color={statusColor(req.status)}
                            variant="outlined"
                            sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 600 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <EmptyState message="No recent withdrawals." icon={<RemoveCircle />} />
            )}
          </SectionCard>
        </Grid>
      </Grid>

      <Dialog
        open={withdrawalDialog}
        onClose={() => setWithdrawalDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', border: `1px solid ${colors.border}` } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1 }}>Request Withdrawal</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth select required size="small" label="Withdrawal Type"
              value={withdrawalForm.type}
              onChange={(e) => setWithdrawalForm({ ...withdrawalForm, type: e.target.value })}
              SelectProps={{ native: true }}
            >
              <option value="Profit">Profit (From Available Balance)</option>
              <option value="Capital">Capital (From Base Investment)</option>
            </TextField>
            <TextField
              fullWidth required size="small" type="number" label="Amount (BDT)"
              value={withdrawalForm.amount}
              onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
              helperText={`Available: ${formatCurrency(investor.availableBalance)} · Capital: ${formatCurrency(investor.investmentAmount)}`}
            />
            <TextField
              fullWidth size="small" multiline rows={2} label="Note (Optional)"
              value={withdrawalForm.note}
              onChange={(e) => setWithdrawalForm({ ...withdrawalForm, note: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setWithdrawalDialog(false)} color="inherit" sx={btnSx}>Cancel</Button>
          <Button
            onClick={handleWithdrawal}
            variant="contained"
            disabled={!withdrawalForm.amount}
            sx={{ ...btnSx, bgcolor: colors.accent, '&:hover': { bgcolor: '#0D9488' } }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </InvestorPage>
  );
};

export default InvestorDashboard;
