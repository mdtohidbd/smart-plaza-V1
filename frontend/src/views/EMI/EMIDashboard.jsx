import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, CircularProgress,
  Alert, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Divider, Avatar,
  LinearProgress, Tooltip, IconButton, Skeleton
} from '@mui/material';
import {
  CheckCircleOutline, WarningAmber, AccessTime, Payments,
  TrendingUp, ArrowForward, CreditScore, AccountBalanceWallet,
  Person, Refresh
} from '@mui/icons-material';
import axios from 'axios';
import { calcEMI, fmt } from '../../utils/emiCalculations';
import { useSettings } from '../../context/SettingsContext';

const API_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5001/api';

const statCards = [
  {
    key: 'totalActiveInvoices',
    label: 'Active EMIs',
    icon: <CreditScore />,
    gradient: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
    shadow: '0 8px 24px rgba(26,115,232,0.35)',
  },
  {
    key: 'totalCompleted',
    label: 'Completed',
    icon: <CheckCircleOutline />,
    gradient: 'linear-gradient(135deg, #00c853 0%, #1b5e20 100%)',
    shadow: '0 8px 24px rgba(0,200,83,0.3)',
  },
  {
    key: 'overdueCount',
    label: 'Overdue',
    icon: <WarningAmber />,
    gradient: 'linear-gradient(135deg, #ff6f00 0%, #b71c1c 100%)',
    shadow: '0 8px 24px rgba(255,111,0,0.35)',
  },
  {
    key: 'todayAmount',
    label: "Today's Collection",
    icon: <Payments />,
    gradient: 'linear-gradient(135deg, #7b1fa2 0%, #4a148c 100%)',
    shadow: '0 8px 24px rgba(123,31,162,0.3)',
    isCurrency: true,
  },
];

const statusColor = (status) => {
  if (status === 'completed') return 'success';
  if (status === 'defaulted') return 'error';
  if (status === 'active') return 'primary';
  return 'warning';
};

const EMIDashboard = () => {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [overdueData, setOverdueData] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, overdueRes, invoicesRes] = await Promise.all([
        axios.get(`${API_URL}/emi/stats/dashboard`, { headers }),
        axios.get(`${API_URL}/emi/stats/overdue`, { headers }),
        axios.get(`${API_URL}/emi/invoices?limit=6`, { headers }),
      ]);
      setStats(statsRes.data.data);
      setOverdueData(overdueRes.data.data);
      setRecentInvoices(invoicesRes.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching EMI dashboard data:', err);
      setError('Failed to load EMI dashboard data. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const recoveryRate = stats && (stats.totalOutstanding + stats.totalPaid) > 0
    ? ((stats.totalPaid / (stats.totalOutstanding + stats.totalPaid)) * 100).toFixed(1)
    : 0;

  // Aggregate totals from recentInvoices using the shared calcEMI utility
  // (used for any derived sums shown in this dashboard)
  const calcAll = (invoices) => invoices.reduce((acc, inv) => {
    const c = calcEMI(inv);
    acc.emiPaid += c.emiPaid;
    acc.outstanding += c.outstanding;
    return acc;
  }, { emiPaid: 0, outstanding: 0 });



  if (error) return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={fetchDashboardData} startIcon={<Refresh />}>Retry</Button>
      }>{error}</Alert>
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 }, maxWidth: 1400, mx: 'auto' }}>

      {/* ── Header ── */}
      <Box sx={{
        mb: 3,
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        background: 'linear-gradient(135deg, #0f2557 0%, #1a73e8 60%, #0d47a1 100%)',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -60, left: '30%',
          width: 160, height: 160,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, position: 'relative' }}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.7, letterSpacing: 2, fontSize: '0.7rem' }}>
              {(settings?.companyName || 'Demo ERP').toUpperCase()} — EMI MODULE
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ fontFamily: '"Outfit", sans-serif', lineHeight: 1.2 }}>
              EMI Management Dashboard
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>
              Real-time installment tracking, overdue monitoring & collection insights
            </Typography>
          </Box>
          <Tooltip title="Refresh data">
            <IconButton onClick={fetchDashboardData} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Stat Cards ── */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid item xs={6} sm={6} md={3} key={card.key}>
            <Card sx={{
              background: card.gradient,
              boxShadow: card.shadow,
              borderRadius: 3,
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-3px)' },
            }}>
              <Box sx={{
                position: 'absolute', bottom: -20, right: -20,
                opacity: 0.12, fontSize: 100,
                display: 'flex', alignItems: 'center',
              }}>
                {React.cloneElement(card.icon, { sx: { fontSize: 90 } })}
              </Box>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.85 }}>
                  {React.cloneElement(card.icon, { sx: { fontSize: 18 } })}
                  <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.68rem' }}>
                    {card.label}
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ fontFamily: '"Outfit", sans-serif', fontSize: { xs: '1.4rem', sm: '1.8rem' } }}>
                  {loading ? (
                    <Skeleton variant="text" width={80} sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                  ) : card.isCurrency ? (
                    `৳${(stats?.[card.key] || 0).toLocaleString()}`
                  ) : (
                    stats?.[card.key] || 0
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>



      {/* ── Recent EMI Invoices ── */}
      <Card sx={{ borderRadius: 3, border: '1px solid #edf0f4' }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: '#e8f0fe', width: 36, height: 36 }}>
                <AccessTime sx={{ color: '#1a73e8', fontSize: 20 }} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700}>Recent EMI Sales</Typography>
            </Box>
            <Button
              size="small"
              variant="contained"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/dashboard/emi/sales')}
              sx={{ borderRadius: 2, textTransform: 'none', background: 'linear-gradient(135deg,#1a73e8,#0d47a1)', boxShadow: '0 4px 12px rgba(26,115,232,0.3)' }}
            >
              View All
            </Button>
          </Box>

          {/* Desktop Table */}
          <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 } }}>
                  <TableCell>Date</TableCell>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Total Payment</TableCell>
                  <TableCell align="right">Down Payment</TableCell>
                  <TableCell align="right">Total Payable</TableCell>
                  <TableCell align="right">EMI Paid</TableCell>
                  <TableCell align="right">Outstanding</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1, 2, 3].map((item) => (
                    <TableRow key={item}>
                      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell align="right"><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell align="right"><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell align="right"><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell align="right"><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell align="right"><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                    </TableRow>
                  ))
                ) : recentInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      No EMI sales found. Create one from Retail Sales.
                    </TableCell>
                  </TableRow>
                ) : recentInvoices.map((inv) => (
                  <TableRow key={inv._id} hover sx={{ '& td': { py: 1.2 } }}>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{new Date(inv.createdAt).toLocaleDateString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary">{inv.invoiceNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#e8f0fe', fontSize: '0.75rem', color: '#1a73e8' }}>
                          {(inv.customer?.name || inv.customer?.businessName || 'U')[0].toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>{inv.customer?.name || inv.customer?.businessName || 'Unknown'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {fmt(calcEMI(inv).totalPayment)}
                        </Typography>
                        {calcEMI(inv).interestRate > 0 && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                            ({calcEMI(inv).interestRate}% interest)
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">{fmt(calcEMI(inv).downPayment)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>{fmt(calcEMI(inv).totalPayable)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="success.main" fontWeight={600}>{fmt(calcEMI(inv).emiPaid)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="error.main" fontWeight={600}>{fmt(calcEMI(inv).totalOutstanding)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={inv.status} color={statusColor(inv.status)} size="small" sx={{ fontWeight: 600, textTransform: 'capitalize', fontSize: '0.7rem', height: 22 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {loading ? (
              [1, 2, 3].map((item) => (
                <Paper key={item} elevation={0} sx={{ p: 2, border: '1px solid #edf0f4', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Skeleton variant="text" width="40%" height={20} />
                    <Skeleton variant="text" width="20%" height={20} />
                  </Box>
                  <Divider sx={{ mb: 1 }} />
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Skeleton variant="text" width="30%" />
                      <Skeleton variant="text" width="60%" />
                    </Grid>
                    <Grid item xs={6}>
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="text" width="50%" />
                    </Grid>
                    <Grid item xs={6}>
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="text" width="50%" />
                    </Grid>
                  </Grid>
                </Paper>
              ))
            ) : recentInvoices.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                No EMI invoices found.
              </Typography>
            ) : recentInvoices.map((inv) => (
              <Paper key={inv._id} elevation={0} sx={{ p: 2, border: '1px solid #edf0f4', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" fontWeight={700} color="primary">{inv.invoiceNumber}</Typography>
                  <Chip label={inv.status} color={statusColor(inv.status)} size="small" sx={{ fontWeight: 600, textTransform: 'capitalize', fontSize: '0.7rem', height: 20 }} />
                </Box>
                <Divider sx={{ mb: 1 }} />
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Customer</Typography>
                    <Typography variant="body2" fontWeight={600}>{inv.customer?.name || inv.customer?.businessName || 'Unknown'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Total Payable</Typography>
                    <Typography variant="body2" fontWeight={700}>{fmt(calcEMI(inv).totalPayable)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">EMI Paid</Typography>
                    <Typography variant="body2" fontWeight={700} color="success.main">{fmt(calcEMI(inv).emiPaid)}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EMIDashboard;
