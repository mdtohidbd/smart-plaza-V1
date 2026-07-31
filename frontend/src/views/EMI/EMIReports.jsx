import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  FormControl, InputLabel, Select, Chip, Divider, Avatar, IconButton, Tooltip, Skeleton,
  MenuItem, TextField, Button, Alert
} from '@mui/material';
import {
  Assessment as AssessmentIcon, TrendingUp, PersonOutline,
  Refresh, FileDownload, CalendarMonth, Payments
} from '@mui/icons-material';
import axios from 'axios';
import ExportButtons from '../../components/ExportButtons';

const API_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5001/api';

const methodColor = (m) => m === 'cash' ? 'success' : m === 'card' ? 'primary' : 'default';
const statusColor = (s) => s === 'on-time' ? 'success' : s === 'late' ? 'warning' : 'error';

const EMIReports = () => {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('collection');
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', sr: '', paymentMethod: '' });

  useEffect(() => { fetchReportData(); }, [reportType, filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const endpoint = reportType === 'performance' ? '/emi/reports/performance' : '/emi/reports/collection';
      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }, params: filters
      });
      setReportData(response.data.data);
      setError(null);
    } catch {
      setError('Failed to load report data');
    } finally { setLoading(false); }
  };

  const exportColumns = [
    { label: 'Date', accessor: (r) => new Date(r.collectionDate).toLocaleDateString() },
    { label: 'Invoice #', accessor: (r) => r.invoiceNumber },
    { label: 'Customer', accessor: (r) => r.customerName },
    { label: 'Method', accessor: (r) => r.paymentMethod },
    { label: 'Amount', accessor: (r) => `৳${r.collectedAmount}` },
    { label: 'Status', accessor: (r) => r.status },
  ];

  const MetricRow = ({ label, value, color }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2, borderBottom: '1px solid #f5f5f5' }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      {loading ? (
        <Skeleton variant="text" width={60} />
      ) : (
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: color || 'text.primary' }}>{value}</Typography>
      )}
    </Box>
  );



  if (error) return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchReportData} startIcon={<Refresh />}>Retry</Button>}>{error}</Alert>
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 }, maxWidth: 1400, mx: 'auto' }}>

      {/* Header */}
      <Box sx={{ mb: 3, p: { xs: 2, sm: 3 }, borderRadius: 3, background: 'linear-gradient(135deg,#312e81 0%,#4f46e5 60%,#6366f1 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, position: 'relative' }}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.7, letterSpacing: 2, fontSize: '0.7rem' }}>EMI MODULE — REPORTS</Typography>
            <Typography variant="h5" fontWeight={700} sx={{ fontFamily: '"Outfit", sans-serif' }}>EMI Reports & Analytics</Typography>
            <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>Collection performance, SR metrics & payment method breakdown</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {reportType === 'collection' && reportData?.transactions && (
              <ExportButtons data={reportData.transactions} columns={exportColumns} filename="emi_collection_report" title="EMI Collection Report" />
            )}
            <Tooltip title="Refresh"><IconButton onClick={fetchReportData} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}><Refresh /></IconButton></Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ borderRadius: 3, mb: 3, border: '1px solid #edf0f4' }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Report Type</InputLabel>
                <Select value={reportType} label="Report Type" onChange={(e) => setReportType(e.target.value)} sx={{ borderRadius: 2 }}>
                  <MenuItem value="collection">Collection Report</MenuItem>
                  <MenuItem value="performance">Performance Report</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField fullWidth size="small" type="date" label="Start Date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField fullWidth size="small" type="date" label="End Date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Method</InputLabel>
                <Select value={filters.paymentMethod} label="Payment Method" onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })} sx={{ borderRadius: 2 }}>
                  <MenuItem value="">All Methods</MenuItem>
                  {['cash', 'card', 'bkash', 'nagad', 'cheque'].map(m => <MenuItem key={m} value={m} sx={{ textTransform: 'capitalize' }}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button fullWidth variant="outlined" onClick={() => setFilters({ startDate: '', endDate: '', sr: '', paymentMethod: '' })} sx={{ borderRadius: 2, textTransform: 'none', height: 40 }}>Clear Filters</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ─── Collection Report ─── */}
      {reportType === 'collection' && (loading || reportData) && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
            {[
              { label: 'Total Collections', value: reportData?.summary?.totalCollections, icon: <AssessmentIcon />, gradient: 'linear-gradient(135deg,#4f46e5,#312e81)', shadow: '0 6px 20px rgba(79,70,229,0.3)' },
              { label: 'Total Collected', value: reportData?.summary?.totalCollected !== undefined ? `৳${(reportData.summary.totalCollected || 0).toLocaleString()}` : undefined, icon: <Payments />, gradient: 'linear-gradient(135deg,#00c853,#1b5e20)', shadow: '0 6px 20px rgba(0,200,83,0.25)' },
              { label: 'Date Range', value: reportData?.summary?.dateRange?.startDate ? `${new Date(reportData.summary.dateRange.startDate).toLocaleDateString()} – ${new Date(reportData.summary.dateRange.endDate).toLocaleDateString()}` : 'All time', icon: <CalendarMonth />, gradient: 'linear-gradient(135deg,#0f766e,#134e4a)', shadow: '0 6px 20px rgba(15,118,110,0.25)' },
            ].map((s) => (
              <Grid item xs={12} sm={4} key={s.label}>
                <Card sx={{ background: s.gradient, boxShadow: s.shadow, borderRadius: 3, color: '#fff', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-3px)' } }}>
                  <Box sx={{ position: 'absolute', bottom: -15, right: -15, opacity: 0.1 }}>{React.cloneElement(s.icon, { sx: { fontSize: 70 } })}</Box>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.85 }}>
                      {React.cloneElement(s.icon, { sx: { fontSize: 16 } })}
                      <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.67rem' }}>{s.label}</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={800} sx={{ fontFamily: '"Outfit",sans-serif', fontSize: { xs: '1.2rem', sm: '1.4rem' } }}>
                      {loading ? <Skeleton variant="text" width={100} sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} /> : s.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* SR Performance + Payment Method */}
          <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, border: '1px solid #edf0f4', height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#e0e7ff', width: 36, height: 36 }}><PersonOutline sx={{ color: '#4f46e5', fontSize: 20 }} /></Avatar>
                    <Typography variant="subtitle1" fontWeight={700}>Sales Rep Performance</Typography>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, py: 1.2 } }}>
                          <TableCell>Sales Rep</TableCell><TableCell align="right">Collections</TableCell><TableCell align="right">Amount</TableCell><TableCell align="right">Avg</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loading ? (
                          [1, 2, 3].map((item) => (
                            <TableRow key={item}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Skeleton variant="circular" width={26} height={26} />
                                  <Skeleton variant="text" width={60} />
                                </Box>
                              </TableCell>
                              <TableCell align="right"><Skeleton variant="text" width={40} sx={{ ml: 'auto' }} /></TableCell>
                              <TableCell align="right"><Skeleton variant="text" width={60} sx={{ ml: 'auto' }} /></TableCell>
                              <TableCell align="right"><Skeleton variant="text" width={50} sx={{ ml: 'auto' }} /></TableCell>
                            </TableRow>
                          ))
                        ) : reportData?.srWise?.length > 0 ? (
                          reportData.srWise.map((sr) => (
                            <TableRow key={sr.sr} hover sx={{ '& td': { py: 1 } }}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ width: 26, height: 26, bgcolor: '#e0e7ff', fontSize: '0.7rem', color: '#4f46e5' }}>{(sr.sr || 'U')[0]}</Avatar>
                                  <Typography variant="body2" fontWeight={600}>{sr.sr}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="right"><Typography variant="body2">{sr.totalCollections}</Typography></TableCell>
                              <TableCell align="right"><Typography variant="body2" fontWeight={700} color="success.main">৳{sr.totalAmount.toLocaleString()}</Typography></TableCell>
                              <TableCell align="right"><Typography variant="body2" color="text.secondary">৳{Math.round(sr.totalAmount / sr.totalCollections).toLocaleString()}</Typography></TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>No SR data available.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, border: '1px solid #edf0f4', height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#f0fdf4', width: 36, height: 36 }}><Payments sx={{ color: '#00c853', fontSize: 20 }} /></Avatar>
                    <Typography variant="subtitle1" fontWeight={700}>Payment Method Breakdown</Typography>
                  </Box>
                  <Grid container spacing={1.5}>
                    {loading ? (
                      [1, 2, 3, 4].map((item) => (
                        <Grid item xs={6} key={item}>
                          <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #edf0f4' }}>
                            <Skeleton variant="rectangular" width={50} height={22} sx={{ mb: 1, borderRadius: 1 }} />
                            <Skeleton variant="text" width="40%" height={24} />
                            <Skeleton variant="text" width="60%" />
                          </Paper>
                        </Grid>
                      ))
                    ) : Object.entries(reportData?.methodWise || {}).map(([method, data]) => (
                      <Grid item xs={6} key={method}>
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #edf0f4' }}>
                          <Chip label={method} size="small" color={methodColor(method)} sx={{ mb: 1, fontWeight: 600, textTransform: 'capitalize', fontSize: '0.7rem', height: 22 }} />
                          <Typography variant="h6" fontWeight={800} sx={{ fontFamily: '"Outfit",sans-serif' }}>{data.count}</Typography>
                          <Typography variant="body2" color="success.main" fontWeight={600}>৳{data.amount.toLocaleString()}</Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Transactions Table */}
          <Card sx={{ borderRadius: 3, border: '1px solid #edf0f4', overflow: 'hidden' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Avatar sx={{ bgcolor: '#e0e7ff', width: 36, height: 36 }}><AssessmentIcon sx={{ color: '#4f46e5', fontSize: 20 }} /></Avatar>
                <Typography variant="subtitle1" fontWeight={700}>All Transactions</Typography>
              </Box>

              <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 } }}>
                      <TableCell>Date</TableCell><TableCell>Invoice #</TableCell><TableCell>Customer</TableCell>
                      <TableCell>Collected By</TableCell><TableCell>Method</TableCell><TableCell>Amount</TableCell><TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      [1, 2, 3].map((item) => (
                        <TableRow key={item}>
                          <TableCell><Skeleton variant="text" width={80} /></TableCell>
                          <TableCell><Skeleton variant="text" width={60} /></TableCell>
                          <TableCell><Skeleton variant="text" width={90} /></TableCell>
                          <TableCell><Skeleton variant="text" width={80} /></TableCell>
                          <TableCell><Skeleton variant="rectangular" width={50} height={22} sx={{ borderRadius: 1 }} /></TableCell>
                          <TableCell><Skeleton variant="text" width={60} /></TableCell>
                          <TableCell><Skeleton variant="rectangular" width={50} height={22} sx={{ borderRadius: 1 }} /></TableCell>
                        </TableRow>
                      ))
                    ) : reportData?.transactions?.length > 0 ? (
                      reportData.transactions.map((t) => (
                        <TableRow key={t._id} hover sx={{ '& td': { py: 1.2 } }}>
                          <TableCell><Typography variant="caption" color="text.secondary">{new Date(t.collectionDate).toLocaleDateString()}</Typography></TableCell>
                          <TableCell><Typography variant="body2" fontWeight={700} color="primary">{t.invoiceNumber}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{t.customerName}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{t.collectedBy?.name || 'N/A'}</Typography></TableCell>
                          <TableCell><Chip label={t.paymentMethod} size="small" color={methodColor(t.paymentMethod)} sx={{ fontWeight: 600, textTransform: 'capitalize', height: 22, fontSize: '0.7rem' }} /></TableCell>
                          <TableCell><Typography variant="body2" fontWeight={700} color="success.main">৳{t.collectedAmount.toLocaleString()}</Typography></TableCell>
                          <TableCell><Chip label={t.status} size="small" color={statusColor(t.status)} sx={{ fontWeight: 600, textTransform: 'capitalize', height: 22, fontSize: '0.7rem' }} /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>No transactions found for the selected filters.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Mobile */}
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
                        <Grid item xs={12}><Skeleton variant="text" width="30%" /><Skeleton variant="text" width="60%" /></Grid>
                        <Grid item xs={6}><Skeleton variant="text" width="40%" /><Skeleton variant="text" width="50%" /></Grid>
                        <Grid item xs={6}><Skeleton variant="text" width="40%" /><Skeleton variant="rectangular" width="50%" height={20} sx={{ borderRadius: 1 }} /></Grid>
                      </Grid>
                    </Paper>
                  ))
                ) : reportData?.transactions?.map((t) => (
                  <Paper key={t._id} elevation={0} sx={{ p: 2, border: '1px solid #edf0f4', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" fontWeight={700} color="primary">{t.invoiceNumber}</Typography>
                      <Chip label={t.status} size="small" color={statusColor(t.status)} sx={{ fontWeight: 600, textTransform: 'capitalize', height: 20, fontSize: '0.7rem' }} />
                    </Box>
                    <Divider sx={{ mb: 1 }} />
                    <Grid container spacing={1}>
                      <Grid item xs={12}><Typography variant="caption" color="text.secondary">Customer</Typography><Typography variant="body2" fontWeight={600}>{t.customerName}</Typography></Grid>
                      <Grid item xs={6}><Typography variant="caption" color="text.secondary">Amount</Typography><Typography variant="body2" fontWeight={700} color="success.main">৳{t.collectedAmount.toLocaleString()}</Typography></Grid>
                      <Grid item xs={6}><Typography variant="caption" color="text.secondary">Method</Typography><Chip label={t.paymentMethod} size="small" color={methodColor(t.paymentMethod)} sx={{ height: 20, fontSize: '0.7rem', textTransform: 'capitalize' }} /></Grid>
                      <Grid item xs={12}><Typography variant="caption" color="text.secondary">{new Date(t.collectionDate).toLocaleDateString()} · {t.collectedBy?.name || 'N/A'}</Typography></Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      {/* ─── Performance Report ─── */}
      {reportType === 'performance' && (loading || reportData) && (
        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, border: '1px solid #edf0f4' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#e0e7ff', width: 36, height: 36 }}><AssessmentIcon sx={{ color: '#4f46e5', fontSize: 20 }} /></Avatar>
                  <Typography variant="subtitle1" fontWeight={700}>Invoice Metrics</Typography>
                </Box>
                <MetricRow label="Total Invoices" value={reportData.invoiceMetrics?.totalInvoices} />
                <MetricRow label="Active Invoices" value={reportData.invoiceMetrics?.activeInvoices} color="#d97706" />
                <MetricRow label="Completed Invoices" value={reportData.invoiceMetrics?.completedInvoices} color="#16a34a" />
                <MetricRow label="Defaulted Invoices" value={reportData.invoiceMetrics?.defaultedInvoices} color="#dc2626" />
                <MetricRow label="Completion Rate" value={`${reportData.invoiceMetrics?.completionRate}%`} color="#1a73e8" />
                <MetricRow label="Default Rate" value={`${reportData.invoiceMetrics?.defaultRate}%`} color="#dc2626" />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, border: '1px solid #edf0f4' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#f0fdf4', width: 36, height: 36 }}><TrendingUp sx={{ color: '#16a34a', fontSize: 20 }} /></Avatar>
                  <Typography variant="subtitle1" fontWeight={700}>Financial Metrics</Typography>
                </Box>
                <MetricRow label="Total Value" value={`৳${(reportData.financialMetrics?.totalValue || 0).toLocaleString()}`} />
                <MetricRow label="Collected Value" value={`৳${(reportData.financialMetrics?.collectedValue || 0).toLocaleString()}`} color="#16a34a" />
                <MetricRow label="Outstanding Value" value={`৳${(reportData.financialMetrics?.outstandingValue || 0).toLocaleString()}`} color="#dc2626" />
                <MetricRow label="Recovery Rate" value={`${reportData.financialMetrics?.recoveryRate}%`} color="#1a73e8" />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default EMIReports;
