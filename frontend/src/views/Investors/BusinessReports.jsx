import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Divider, Dialog, DialogContent, IconButton, Skeleton
} from '@mui/material';
import {
  Assessment as AssessmentIcon, Close as CloseIcon, ChevronLeft, ChevronRight,
  Person as PersonIcon,
} from '@mui/icons-material';
import api from '../../utils/api';
import dayjs from 'dayjs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import {
  InvestorPage, PageHeader, StatGrid, SectionCard, LoadingState,
  colors, formatCurrency, formatCompact, cardSx, tableHeadSx,
} from './investorUi';

const CHART_COLORS = {
  revenue: '#0F766E',
  cost: '#F59E0B',
  expenses: '#EF4444',
  netProfit: '#059669',
};

const BusinessReports = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [targetMonth, setTargetMonth] = useState(dayjs().month() + 1);
  const [targetYear, setTargetYear] = useState(dayjs().year());
  const [selectedDayInfo, setSelectedDayInfo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [targetMonth, targetYear]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/investors/business-reports?targetMonth=${targetMonth}&targetYear=${targetYear}`);
      setReports(res.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching business reports:', err);
      setError('Failed to load business reports');
    } finally {
      setLoading(false);
    }
  };

  if (error) return <InvestorPage><Alert severity="error">{error}</Alert></InvestorPage>;

  const { dailySales = [], monthlyProfit = [], investorProfitShares = [], cumulativeNetProfit = 0 } = reports || {};

  const formatPeriodLabel = (item) => {
    if (!item || !item.year || !item.month) return '';
    return dayjs(`${item.year}-${String(item.month).padStart(2, '0')}-01`).format('MMM YYYY');
  };

  const profitChartData = [...monthlyProfit].reverse().map((item) => ({
    name: formatPeriodLabel(item),
    revenue: item.revenue,
    cost: item.cost,
    expenses: item.expenses,
    netProfit: item.netProfit,
  }));

  const selectedMonthLabel = dayjs(`${targetYear}-${String(targetMonth).padStart(2, '0')}-01`).format('MMMM YYYY');

  const selectedMonthData = monthlyProfit.find(m => m.year === targetYear && m.month === targetMonth) || {};
  const prevMonth = targetMonth === 1 ? { month: 12, year: targetYear - 1 } : { month: targetMonth - 1, year: targetYear };
  const lastMonthData = monthlyProfit.find(m => m.year === prevMonth.year && m.month === prevMonth.month) || {};

  const handlePrevMonth = () => {
    if (targetMonth === 1) {
      setTargetMonth(12);
      setTargetYear((prev) => prev - 1);
    } else {
      setTargetMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (targetMonth === 12) {
      setTargetMonth(1);
      setTargetYear((prev) => prev + 1);
    } else {
      setTargetMonth((prev) => prev + 1);
    }
  };

  const monthNav = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <IconButton
        onClick={handlePrevMonth}
        size="small"
        sx={{ border: `1px solid ${colors.border}`, width: 28, height: 28 }}
      >
        <ChevronLeft sx={{ fontSize: 18 }} />
      </IconButton>
      <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.text, minWidth: 108, textAlign: 'center' }}>
        {dayjs(`${targetYear}-${targetMonth}-01`).format('MMM YYYY')}
      </Typography>
      <IconButton
        onClick={handleNextMonth}
        size="small"
        sx={{ border: `1px solid ${colors.border}`, width: 28, height: 28 }}
      >
        <ChevronRight sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>
  );

  const renderCalendar = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '4px', width: '100%' }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <Box key={`sh-${i}`} sx={{ textAlign: 'center', fontSize: '0.625rem', fontWeight: 700, color: colors.textMuted, py: 0.5 }}>{d}</Box>
          ))}
          {[...Array(35)].map((_, i) => (
             <Skeleton key={`sk-${i}`} variant="rounded" width="100%" height={44} sx={{ borderRadius: '6px' }} />
          ))}
        </Box>
      );
    }
    if (!reports?.dailyProfit) return null;

    const firstDayOfMonth = dayjs(`${targetYear}-${targetMonth}-01`).day();
    const blanks = Array(firstDayOfMonth).fill(null);
    const allCells = [...blanks, ...reports.dailyProfit];

    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: '4px',
          width: '100%',
        }}
      >
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Box
            key={`${d}-${i}`}
            sx={{
              textAlign: 'center',
              fontSize: '0.625rem',
              fontWeight: 700,
              color: colors.textMuted,
              py: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {d}
          </Box>
        ))}
        {allCells.map((cell, index) => {
          if (!cell) {
            return <Box key={`blank-${index}`} sx={{ minHeight: 44 }} />;
          }

          const isPositive = cell.netProfit > 0;
          const isNegative = cell.netProfit < 0;
          const hasData = isPositive || isNegative || cell.revenue > 0;

          let bg = colors.surface;
          let border = colors.borderLight;
          if (isPositive) { bg = colors.successSoft; border = '#A7F3D0'; }
          else if (isNegative) { bg = colors.errorSoft; border = '#FECACA'; }
          else if (cell.revenue > 0) { bg = colors.bg; }

          return (
            <Box
              key={cell.day}
              onClick={() => { setSelectedDayInfo(cell); setIsModalOpen(true); }}
              sx={{
                minHeight: { xs: 40, sm: 44, md: 48 },
                px: 0.25,
                py: 0.5,
                bgcolor: bg,
                border: `1px solid ${border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'border-color 0.15s',
                '&:hover': { borderColor: colors.accent },
              }}
            >
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: colors.text, lineHeight: 1 }}>
                {cell.day}
              </Typography>
              {hasData && (
                <Typography
                  sx={{
                    fontSize: '0.5625rem',
                    fontWeight: 600,
                    color: isPositive ? colors.success : isNegative ? colors.error : colors.textMuted,
                    mt: 0.25,
                    lineHeight: 1,
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  {formatCompact(cell.netProfit)}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <InvestorPage>
      <PageHeader
        icon={<AssessmentIcon sx={{ fontSize: 20 }} />}
        title="Business Reports"
        subtitle="Profit & Loss overview with daily and monthly breakdowns."
      />

      <StatGrid
        compact
        isLoading={loading}
        items={[
          { key: 'revenue', label: `${selectedMonthLabel} Revenue`, value: formatCurrency(selectedMonthData.revenue), tone: 'accent' },
          { key: 'costs', label: 'Cost of Goods Sold', value: formatCurrency(selectedMonthData.cost || 0), tone: 'error' },
          { key: 'expenses', label: 'Operating Expenses', value: formatCurrency(selectedMonthData.expenses || 0), tone: 'error' },
          { key: 'profit', label: `${selectedMonthLabel} Net Profit`, value: formatCurrency(selectedMonthData.netProfit), tone: 'success' },
          { key: 'last', label: `${formatPeriodLabel(prevMonth)} Profit`, value: formatCurrency(lastMonthData.netProfit), tone: 'neutral' },
        ]}
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} xl={7}>
          <SectionCard title="Daily Profit Calendar" action={monthNav} bodySx={{ p: 1.5 }}>
            {renderCalendar()}
          </SectionCard>
        </Grid>

        <Grid item xs={12} xl={5}>
          <SectionCard title={`Daily Sales — ${selectedMonthLabel}`} bodySx={{ p: 0 }}>
            <TableContainer sx={{ maxHeight: 340 }}>
              <Table size="small" stickyHeader>
                <TableHead sx={tableHeadSx}>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Txns</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={`skel-${i}`}>
                        <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                        <TableCell align="center"><Skeleton variant="text" width="40%" sx={{ mx: 'auto' }} /></TableCell>
                        <TableCell align="right"><Skeleton variant="text" width="50%" sx={{ ml: 'auto' }} /></TableCell>
                      </TableRow>
                    ))
                  ) : dailySales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4, color: colors.textMuted, fontSize: '0.8125rem' }}>
                        No recent sales
                      </TableCell>
                    </TableRow>
                  ) : (
                    dailySales.map((row, i) => (
                      <TableRow
                        key={i}
                        hover
                        sx={{ '&:last-child td': { borderBottom: 0 }, '& td': { py: 1, fontSize: '0.8125rem', borderColor: colors.borderLight } }}
                      >
                        <TableCell sx={{ color: colors.text, fontWeight: 500 }}>
                          {dayjs(row._id).format('MMM D, YYYY')}
                        </TableCell>
                        <TableCell align="center" sx={{ color: colors.textSecondary }}>{row.count}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: colors.accent }}>
                          {formatCurrency(row.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        </Grid>

        <Grid item xs={12}>
          <SectionCard title="Financial Performance Trend" bodySx={{ pt: 1 }}>
            <Box sx={{ height: 320, width: '100%' }}>
              {loading ? (
                <Skeleton variant="rounded" width="100%" height="100%" sx={{ borderRadius: 2 }} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.borderLight} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: colors.textSecondary }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: colors.textSecondary }}
                      tickFormatter={(val) => `৳${(val / 1000)}k`}
                      width={52}
                    />
                    <RechartsTooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="revenue" name="Revenue" fill={CHART_COLORS.revenue} radius={[3, 3, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="cost" name="COGS" fill={CHART_COLORS.cost} radius={[3, 3, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="expenses" name="Expenses" fill={CHART_COLORS.expenses} radius={[3, 3, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="netProfit" name="Net Profit" fill={CHART_COLORS.netProfit} radius={[3, 3, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </SectionCard>
        </Grid>

        {/* Investor Profit Share Section */}
        {(loading || investorProfitShares?.length > 0) && (
          <Grid item xs={12}>
            <SectionCard title="Investor Profit Share (12-Month Cumulative)" bodySx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={tableHeadSx}>
                    <TableRow>
                      <TableCell>Investor</TableCell>
                      <TableCell align="center">Share %</TableCell>
                      <TableCell align="right">Investment</TableCell>
                      <TableCell align="right">Cumulative Share</TableCell>
                      <TableCell align="right">Already Withdrawn</TableCell>
                      <TableCell align="right">Available</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      [...Array(2)].map((_, i) => (
                        <TableRow key={`inv-skel-${i}`}>
                          <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                          <TableCell align="center"><Skeleton variant="text" width="30%" sx={{ mx: 'auto' }} /></TableCell>
                          <TableCell align="right"><Skeleton variant="text" width="50%" sx={{ ml: 'auto' }} /></TableCell>
                          <TableCell align="right"><Skeleton variant="text" width="50%" sx={{ ml: 'auto' }} /></TableCell>
                          <TableCell align="right"><Skeleton variant="text" width="50%" sx={{ ml: 'auto' }} /></TableCell>
                          <TableCell align="right"><Skeleton variant="text" width="50%" sx={{ ml: 'auto' }} /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <>
                        {investorProfitShares.map((inv) => (
                          <TableRow key={inv._id} hover sx={{ '& td': { py: 1, fontSize: '0.8125rem', borderColor: colors.borderLight } }}>
                            <TableCell sx={{ fontWeight: 600, color: colors.text }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <PersonIcon sx={{ fontSize: 14, color: colors.textMuted }} />
                                {inv.name}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Typography sx={{ fontWeight: 700, color: '#6366F1', fontSize: '0.8125rem' }}>
                                {inv.profitSharePercentage}%
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 500 }}>{formatCurrency(inv.investmentAmount)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: colors.success }}>{formatCurrency(inv.calculatedProfitShare)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 500, color: inv.totalWithdrawn > 0 ? colors.error : colors.textMuted }}>{formatCurrency(inv.totalWithdrawn)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: inv.availableProfit > 0 ? colors.success : colors.textMuted }}>{formatCurrency(inv.availableProfit)}</TableCell>
                          </TableRow>
                        ))}
                        {cumulativeNetProfit > 0 && (
                          <TableRow sx={{ '& td': { py: 1.25, fontSize: '0.8125rem', borderTop: `2px solid ${colors.border}` } }}>
                            <TableCell colSpan={3} sx={{ fontWeight: 700, color: colors.text }}>
                              Cumulative Net Profit (12 mo.)
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: colors.accent, fontSize: '0.9rem' }}>
                              {formatCurrency(cumulativeNetProfit)}
                            </TableCell>
                            <TableCell colSpan={2} />
                          </TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </SectionCard>
          </Grid>
        )}
      </Grid>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { ...cardSx, borderRadius: '12px' } }}
      >
        {selectedDayInfo && (
          <>
            <Box
              sx={{
                px: 2.5,
                py: 2,
                borderBottom: `1px solid ${colors.borderLight}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box>
                <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase' }}>
                  Daily Report
                </Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: colors.text }}>
                  {dayjs(selectedDayInfo.date).format('MMMM D, YYYY')}
                </Typography>
              </Box>
              <IconButton onClick={() => setIsModalOpen(false)} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <DialogContent sx={{ p: 2.5 }}>
              {[
                { label: 'Revenue', value: formatCurrency(selectedDayInfo.revenue), color: colors.text },
                { label: 'Cost of Goods', value: formatCurrency(selectedDayInfo.cost), color: colors.error },
                { label: 'Operating Expenses', value: formatCurrency(selectedDayInfo.expenses), color: colors.error },
                { label: 'Other Income', value: formatCurrency(selectedDayInfo.otherIncome), color: colors.success },
              ].map((row) => (
                <Box key={row.label}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25 }}>
                    <Typography sx={{ fontSize: '0.8125rem', color: colors.textSecondary }}>{row.label}</Typography>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: row.color }}>{row.value}</Typography>
                  </Box>
                  <Divider sx={{ borderColor: colors.borderLight }} />
                </Box>
              ))}
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: '8px',
                  bgcolor: selectedDayInfo.netProfit >= 0 ? colors.successSoft : colors.errorSoft,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: colors.text }}>Net Profit</Typography>
                <Typography
                  sx={{
                    fontSize: '1.125rem',
                    fontWeight: 800,
                    color: selectedDayInfo.netProfit >= 0 ? colors.success : colors.error,
                  }}
                >
                  {formatCurrency(selectedDayInfo.netProfit)}
                </Typography>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </InvestorPage>
  );
};

export default BusinessReports;
