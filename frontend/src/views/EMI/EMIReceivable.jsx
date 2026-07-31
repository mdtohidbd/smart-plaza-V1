import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  CircularProgress, Alert, Chip, FormControl, InputLabel,
  Select, MenuItem, Divider, Avatar, LinearProgress, Button, Tooltip, IconButton, Skeleton
} from '@mui/material';
import {
  AttachMoney as MoneyIcon, TrendingUp as TrendIcon,
  AccountBalance as BankIcon, Person as PersonIcon,
  Refresh, CalendarMonth
} from '@mui/icons-material';
import axios from 'axios';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, isToday } from 'date-fns';
const API_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5001/api';

const EMIReceivable = () => {
  const [loading, setLoading] = useState(true);
  const [receivableData, setReceivableData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => { fetchReceivableData(); }, [selectedMonth, selectedYear]);

  const fetchReceivableData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {};
      if (selectedMonth) params.month = selectedMonth;
      if (selectedYear) params.year = selectedYear;
      const response = await axios.get(`${API_URL}/emi/stats/receivable`, {
        headers: { Authorization: `Bearer ${token}` }, params
      });
      setReceivableData(response.data.data);
      setError(null);
    } catch {
      setError('Failed to load receivable overview');
    } finally { setLoading(false); }
  };

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
    .map((label, i) => ({ value: String(i + 1), label }));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => ({ value: String(currentYear - 2 + i), label: String(currentYear - 2 + i) }));

  const recoveryPct = receivableData?.summary?.totalReceivable > 0
    ? ((receivableData.summary.totalReceived / receivableData.summary.totalReceivable) * 100).toFixed(1)
    : 0;

  const summaryCards = [
    { label: 'Total Receivable', key: 'totalReceivable', icon: <MoneyIcon />, gradient: 'linear-gradient(135deg,#1a73e8,#0d47a1)', shadow: '0 6px 20px rgba(26,115,232,0.3)' },
    { label: 'Total Received', key: 'totalReceived', icon: <TrendIcon />, gradient: 'linear-gradient(135deg,#00c853,#1b5e20)', shadow: '0 6px 20px rgba(0,200,83,0.25)' },
    { label: 'Outstanding', key: 'totalOutstanding', icon: <BankIcon />, gradient: 'linear-gradient(135deg,#ff6f00,#b71c1c)', shadow: '0 6px 20px rgba(255,111,0,0.3)' },
    { label: 'Active Invoices', key: 'totalInvoices', icon: <PersonIcon />, gradient: 'linear-gradient(135deg,#7b1fa2,#4a148c)', shadow: '0 6px 20px rgba(123,31,162,0.25)', isCount: true },
  ];



  if (error) return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchReceivableData} startIcon={<Refresh />}>Retry</Button>}>{error}</Alert>
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 }, maxWidth: 1400, mx: 'auto' }}>

      {/* Header */}
      <Box sx={{ mb: 3, p: { xs: 2, sm: 3 }, borderRadius: 3, background: 'linear-gradient(135deg,#134e4a 0%,#0f766e 60%,#0d9488 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, position: 'relative' }}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.7, letterSpacing: 2, fontSize: '0.7rem' }}>EMI MODULE — RECEIVABLE</Typography>
            <Typography variant="h5" fontWeight={700} sx={{ fontFamily: '"Outfit", sans-serif' }}>EMI Receivable Overview</Typography>
            <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>Track outstanding and collected installment payments</Typography>
          </Box>
          <Tooltip title="Refresh"><IconButton onClick={fetchReceivableData} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}><Refresh /></IconButton></Tooltip>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ borderRadius: 3, mb: 3, border: '1px solid #edf0f4' }}>
        <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonth sx={{ color: '#0f766e', fontSize: 20 }} />
            <Typography variant="body2" fontWeight={600} color="text.secondary">Filter by:</Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Month</InputLabel>
            <Select value={selectedMonth} label="Month" onChange={(e) => setSelectedMonth(e.target.value)} sx={{ borderRadius: 2 }}>
              <MenuItem value="">All Months</MenuItem>
              {months.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Year</InputLabel>
            <Select value={selectedYear} label="Year" onChange={(e) => setSelectedYear(e.target.value)} sx={{ borderRadius: 2 }}>
              {years.map(y => <MenuItem key={y.value} value={y.value}>{y.label}</MenuItem>)}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid item xs={6} sm={6} md={3} key={card.key}>
            <Card sx={{ background: card.gradient, boxShadow: card.shadow, borderRadius: 3, color: '#fff', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-3px)' } }}>
              <Box sx={{ position: 'absolute', bottom: -20, right: -20, opacity: 0.1 }}>
                {React.cloneElement(card.icon, { sx: { fontSize: 80 } })}
              </Box>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.85 }}>
                  {React.cloneElement(card.icon, { sx: { fontSize: 16 } })}
                  <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.67rem' }}>{card.label}</Typography>
                </Box>
                <Typography variant="h5" fontWeight={800} sx={{ fontFamily: '"Outfit",sans-serif', fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                  {loading ? (
                    <Skeleton variant="text" width={80} sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                  ) : card.isCount ? (
                    (receivableData?.summary?.[card.key] || 0)
                  ) : (
                    `৳${(receivableData?.summary?.[card.key] || 0).toLocaleString()}`
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Calendar for Receiving Dates */}
      <Card sx={{ borderRadius: 3, border: '1px solid #edf0f4', mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Avatar sx={{ bgcolor: '#fff3e0', width: 36, height: 36 }}>
              <CalendarMonth sx={{ color: '#ff6f00', fontSize: 20 }} />
            </Avatar>
            <Typography variant="subtitle1" fontWeight={700}>Upcoming & Collection Calendar</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ffecb3' }} /><Typography variant="caption">Upcoming (Yellow)</Typography></Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#c8e6c9' }} /><Typography variant="caption">Collected (Green)</Typography></Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ffcdd2' }} /><Typography variant="caption">Overdue (Red)</Typography></Box>
          </Box>
          
          <Grid container spacing={1}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Grid item xs={12/7} key={day} sx={{ textAlign: 'center', pb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary">{day}</Typography>
              </Grid>
            ))}
            {(() => {
              const currentMonth = selectedMonth ? parseInt(selectedMonth) - 1 : new Date().getMonth();
              const currentYearVal = selectedYear ? parseInt(selectedYear) : new Date().getFullYear();
              const monthStart = startOfMonth(new Date(currentYearVal, currentMonth));
              const monthEnd = endOfMonth(monthStart);
              const startDate = startOfWeek(monthStart);
              const endDate = endOfWeek(monthEnd);
              const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

              return loading ? (
                Array.from({ length: 28 }).map((_, idx) => (
                  <Grid item xs={12/7} key={idx} sx={{ display: 'flex' }}>
                    <Box sx={{
                      minHeight: { xs: 80, sm: 120 },
                      width: '100%',
                      p: 1,
                      border: '1px solid #f0f0f0',
                      borderRadius: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1
                    }}>
                      <Skeleton variant="text" width="20%" />
                      <Skeleton variant="rectangular" height={24} sx={{ borderRadius: 1 }} />
                      <Skeleton variant="rectangular" height={24} sx={{ borderRadius: 1 }} />
                    </Box>
                  </Grid>
                ))
              ) : calendarDays.map((day, idx) => {
                const events = receivableData?.calendarEvents?.filter(e => isSameDay(new Date(e.dueDate), day)) || [];
                const hasOverdue = events.some(e => e.status === 'overdue' || (e.status === 'pending' && new Date(e.dueDate) < new Date()));
                const hasUpcoming = events.some(e => e.status === 'pending' && new Date(e.dueDate) >= new Date());
                const hasCollected = events.some(e => e.status === 'paid');
                
                let bgColor = '#fff';
                if (hasOverdue) bgColor = '#ffcdd2'; // Red
                else if (hasUpcoming) bgColor = '#ffecb3'; // Yellow
                else if (hasCollected) bgColor = '#c8e6c9'; // Green

                const isCurrentMonth = isSameMonth(day, monthStart);

                return (
                  <Grid item xs={12/7} key={idx} sx={{ display: 'flex' }}>
                    <Box sx={{
                      minHeight: { xs: 80, sm: 120 },
                      width: '100%',
                      p: 1,
                      border: '1px solid #f0f0f0',
                      borderRadius: 1,
                      bgcolor: isCurrentMonth ? bgColor : '#fcfcfc',
                      opacity: isCurrentMonth ? 1 : 0.4,
                      display: 'flex',
                      flexDirection: 'column',
                      transition: '0.2s',
                      '&:hover': {
                        transform: isCurrentMonth && events.length > 0 ? 'scale(1.02)' : 'none',
                        boxShadow: isCurrentMonth && events.length > 0 ? 2 : 0,
                        zIndex: 1
                      }
                    }}>
                      <Typography variant="body2" fontWeight={isToday(day) ? 800 : 500} color={isToday(day) ? 'primary' : 'text.primary'} sx={{ mb: 1 }}>
                        {format(day, 'd')}
                      </Typography>
                      <Box sx={{ flexGrow: 1 }}>
                        {events.map((e, i) => (
                          <Typography key={i} variant="caption" sx={{ 
                            display: 'block', 
                            fontSize: '0.65rem', 
                            lineHeight: 1.2, 
                            mb: 0.5,
                            bgcolor: 'rgba(255,255,255,0.5)',
                            p: 0.5,
                            borderRadius: 1
                          }}>
                            <strong>{e.customerName}</strong><br/>
                            ৳{e.amount} ({e.status})
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                );
              });
            })()}
          </Grid>
        </CardContent>
      </Card>

      {/* Customer-wise Receivables */}
      <Card sx={{ borderRadius: 3, border: '1px solid #edf0f4', overflow: 'hidden' }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Avatar sx={{ bgcolor: '#faf5ff', width: 36, height: 36 }}>
              <PersonIcon sx={{ color: '#7b1fa2', fontSize: 20 }} />
            </Avatar>
            <Typography variant="subtitle1" fontWeight={700}>Customer-wise Receivables</Typography>
          </Box>

          {/* Desktop Table */}
          <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 } }}>
                  <TableCell>Customer</TableCell><TableCell>Contact</TableCell><TableCell>Invoices</TableCell>
                  <TableCell>Receivable</TableCell><TableCell>Received</TableCell><TableCell>Outstanding</TableCell><TableCell>Recovery</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1, 2, 3].map((item) => (
                    <TableRow key={item}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Skeleton variant="circular" width={28} height={28} />
                          <Skeleton variant="text" width={80} />
                        </Box>
                      </TableCell>
                      <TableCell><Skeleton variant="text" width={100} /></TableCell>
                      <TableCell><Skeleton variant="text" width={40} /></TableCell>
                      <TableCell><Skeleton variant="text" width={80} /></TableCell>
                      <TableCell><Skeleton variant="text" width={80} /></TableCell>
                      <TableCell><Skeleton variant="text" width={80} /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width={50} height={22} sx={{ borderRadius: 1 }} /></TableCell>
                    </TableRow>
                  ))
                ) : receivableData?.customerWise?.length > 0 ? (
                  receivableData.customerWise.map((c) => {
                    const pct = c.totalReceivable > 0 ? ((c.totalReceived / c.totalReceivable) * 100).toFixed(0) : 0;
                    return (
                      <TableRow key={c.customer._id} hover sx={{ '& td': { py: 1.2 } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: '#faf5ff', fontSize: '0.75rem', color: '#7b1fa2' }}>{(c.customer.name || 'U')[0]}</Avatar>
                            <Typography variant="body2" fontWeight={600}>{c.customer.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell><Typography variant="body2">{c.customer.phone}</Typography></TableCell>
                        <TableCell><Chip label={c.totalInvoices} size="small" sx={{ height: 22, fontSize: '0.7rem' }} /></TableCell>
                        <TableCell><Typography variant="body2" fontWeight={600}>৳{c.totalReceivable.toLocaleString()}</Typography></TableCell>
                        <TableCell><Typography variant="body2" fontWeight={600} color="success.main">৳{c.totalReceived.toLocaleString()}</Typography></TableCell>
                        <TableCell><Typography variant="body2" fontWeight={600} color="error.main">৳{c.totalOutstanding.toLocaleString()}</Typography></TableCell>
                        <TableCell><Chip label={`${pct}%`} size="small" color={pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'error'} sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }} /></TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>No customer receivable data found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Cards */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
            {loading ? (
              [1, 2, 3].map((item) => (
                <Paper key={item} elevation={0} sx={{ p: 2, border: '1px solid #edf0f4', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Skeleton variant="text" width="40%" height={20} />
                    <Skeleton variant="rectangular" width="20%" height={20} sx={{ borderRadius: 1 }} />
                  </Box>
                  <Divider sx={{ mb: 1 }} />
                  <Grid container spacing={1}>
                    <Grid item xs={12}><Skeleton variant="text" width="50%" /></Grid>
                    <Grid item xs={4}><Skeleton variant="text" width="40%" /><Skeleton variant="text" width="60%" /></Grid>
                    <Grid item xs={4}><Skeleton variant="text" width="40%" /><Skeleton variant="text" width="60%" /></Grid>
                    <Grid item xs={4}><Skeleton variant="text" width="40%" /><Skeleton variant="text" width="60%" /></Grid>
                  </Grid>
                </Paper>
              ))
            ) : receivableData?.customerWise?.map((c) => {
              const pct = c.totalReceivable > 0 ? ((c.totalReceived / c.totalReceivable) * 100).toFixed(0) : 0;
              return (
                <Paper key={c.customer._id} elevation={0} sx={{ p: 2, border: '1px solid #edf0f4', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" fontWeight={700}>{c.customer.name}</Typography>
                    <Chip label={`${pct}%`} size="small" color={pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'error'} sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
                  </Box>
                  <Divider sx={{ mb: 1 }} />
                  <Grid container spacing={1}>
                    <Grid item xs={12}><Typography variant="caption" color="text.secondary">Phone: {c.customer.phone}</Typography></Grid>
                    <Grid item xs={4}><Typography variant="caption" color="text.secondary" display="block">Receivable</Typography><Typography variant="body2" fontWeight={600}>৳{c.totalReceivable.toLocaleString()}</Typography></Grid>
                    <Grid item xs={4}><Typography variant="caption" color="text.secondary" display="block">Received</Typography><Typography variant="body2" fontWeight={600} color="success.main">৳{c.totalReceived.toLocaleString()}</Typography></Grid>
                    <Grid item xs={4}><Typography variant="caption" color="text.secondary" display="block">Outstanding</Typography><Typography variant="body2" fontWeight={600} color="error.main">৳{c.totalOutstanding.toLocaleString()}</Typography></Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EMIReceivable;
