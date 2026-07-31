import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import useShopRefresh from '../../hooks/useShopRefresh';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as BankIcon,
  ShowChart as ChartIcon,
  ReceiptLong as ReceiptIcon,
  Storefront as StoreIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';

const fmt = (n) =>
  `৳${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const LineRow = ({ label, amount, color, indent, bold, hint }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, px: 2, pl: indent ? 4 : 2 }}>
    <Box>
      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: bold ? 600 : 400 }}>
        {label}
      </Typography>
      {hint && (
        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
          {hint}
        </Typography>
      )}
    </Box>
    <Typography variant="body2" sx={{ fontWeight: bold ? 700 : 500, color: color || '#1e293b' }}>
      {amount}
    </Typography>
  </Box>
);

const ProfitAndLoss = () => {
  const [filterType, setFilterType] = useState('monthly');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const { data: plData, isLoading, error, refetch } = useQuery(
    ['profitLoss', filterType, dateRange.startDate, dateRange.endDate],
    async () => {
      const params = { type: filterType };
      if (filterType === 'custom') {
        params.startDate = dateRange.startDate;
        params.endDate = dateRange.endDate;
      }
      const response = await api.get('/api/finance/profit-loss', { params });
      return response.data.data;
    },
    { enabled: filterType !== 'custom' || (!!dateRange.startDate && !!dateRange.endDate) }
  );

  useShopRefresh(refetch);

  const ib = plData?.incomeBreakdown || {};
  const eb = plData?.expenseBreakdown || {};
  const totalIncome = plData?.revenue || 0;

  const StatCard = ({ title, amount, icon, color, bgColor }) => (
    <Card elevation={0} sx={{
      border: '1px solid #eaeef3', borderRadius: '12px', backgroundColor: bgColor || '#fff',
      transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ p: 1, borderRadius: '8px', backgroundColor: `${color}15`, display: 'flex', mr: 1.5 }}>
            {React.cloneElement(icon, { sx: { color } })}
          </Box>
          <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ color: '#1e293b', fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
          {fmt(amount)}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ py: { xs: 2, sm: 3 }, backgroundColor: '#F8FAFC', minHeight: '100%' }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #eaeef3', borderRadius: '12px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 700, fontFamily: '"Outfit", sans-serif', mb: 0.5 }}>
                  Profit & Loss Statement
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Income and expenses from the accounts ledger, linked to sales invoices.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Period</InputLabel>
                  <Select value={filterType} label="Period" onChange={(e) => setFilterType(e.target.value)}>
                    <MenuItem value="daily">Today</MenuItem>
                    <MenuItem value="monthly">This Month</MenuItem>
                    <MenuItem value="custom">Custom Range</MenuItem>
                  </Select>
                </FormControl>
                {filterType === 'custom' && (
                  <>
                    <TextField size="small" type="date" label="Start Date" InputLabelProps={{ shrink: true }}
                      value={dateRange.startDate} onChange={(e) => setDateRange((p) => ({ ...p, startDate: e.target.value }))} />
                    <TextField size="small" type="date" label="End Date" InputLabelProps={{ shrink: true }}
                      value={dateRange.endDate} onChange={(e) => setDateRange((p) => ({ ...p, endDate: e.target.value }))} />
                  </>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {isLoading ? (
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Grid>
        ) : error ? (
          <Grid item xs={12}><Alert severity="error">Failed to load profit and loss data.</Alert></Grid>
        ) : (
          <>
            <Grid item xs={12} md={4}>
              <StatCard title="Total Income" amount={totalIncome} icon={<StoreIcon />} color="#0ea5e9" />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard title="Cost of Goods Sold" amount={plData?.cogs} icon={<ReceiptIcon />} color="#f59e0b" />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard title="Gross Profit" amount={plData?.grossProfit} icon={<ChartIcon />} color="#8b5cf6" bgColor="#f5f3ff" />
            </Grid>

            <Grid item xs={12} md={8}>
              <Paper elevation={0} sx={{ border: '1px solid #eaeef3', borderRadius: '12px', overflow: 'hidden' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid #eaeef3' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>Calculation Breakdown</Typography>
                </Box>

                <Box sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155', mb: 2 }}>Income (from Income module)</Typography>
                  <LineRow label="Sales Revenue" amount={fmt(ib.salesRevenue)} color="#10b981"
                    hint="Cash / wholesale / partial payments at sale time" indent />
                  <LineRow label="Down Payment" amount={fmt(ib.downPayment)} color="#10b981"
                    hint="Retail (EMI) sales only — initial down payment" indent />
                  <LineRow label="EMI Collections (Principal)" amount={fmt(Math.max(0, (ib.emiCollection || 0) - (plData?.totalLateFees || 0)))} color="#10b981"
                    hint="Installment payments collected after EMI sale" indent />
                  <LineRow label="EMI Late Fees" amount={fmt(plData?.totalLateFees || 0)} color="#10b981"
                    hint="Late fees collected from overdue installments" indent />
                  <LineRow label="Sales Due Collections" amount={fmt(ib.salesDueCollection)} color="#10b981"
                    hint="Outstanding invoice due payments" indent />
                  <LineRow label="Other Income" amount={fmt(ib.otherIncome)} color="#10b981"
                    hint="Manual entries in Income module" indent />
                  <Divider sx={{ my: 1.5 }} />
                  <LineRow label="Total Income" amount={fmt(totalIncome)} bold />

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155', mb: 2 }}>Expenses (from Expense module)</Typography>
                  <LineRow label="COGS" amount={`- ${fmt(eb.cogs)}`} color="#ef4444"
                    hint="Product cost per sale — linked to invoice in description" indent />
                  <LineRow label="Delivery" amount={`- ${fmt(eb.delivery)}`} color="#ef4444" indent />
                  <LineRow label="Installation" amount={`- ${fmt(eb.installation)}`} color="#ef4444" indent />
                  <LineRow label="Sale Expense" amount={`- ${fmt(eb.saleExpense)}`} color="#ef4444"
                    hint="Operating expense from retail sales" indent />
                  <LineRow label="Payment Fees" amount={`- ${fmt(eb.paymentFee)}`} color="#ef4444"
                    hint="Card / MFS processing fees" indent />
                  <LineRow label="Other Operating" amount={`- ${fmt(eb.otherOperating)}`} color="#ef4444"
                    hint="Custom manual expenses" indent />
                  <Divider sx={{ my: 1.5 }} />
                  <LineRow label="Total Expenses" amount={`- ${fmt(plData?.totalExpense)}`} color="#ef4444" bold />
                </Box>

                <Box sx={{ p: 3, backgroundColor: plData?.netProfit >= 0 ? '#ecfdf5' : '#fef2f2', borderTop: '1px solid #eaeef3' }}>
                  <LineRow label="Gross Profit (Income − COGS)" amount={fmt(plData?.grossProfit)} bold
                    color={plData?.grossProfit >= 0 ? '#059669' : '#dc2626'} />
                  <LineRow label="Net Profit (Income − All Expenses)" amount={fmt(plData?.netProfit)} bold
                    color={plData?.netProfit >= 0 ? '#059669' : '#dc2626'} />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <StatCard title="Operating Expenses" amount={plData?.operatingExpenses} icon={<TrendingDownIcon />} color="#ef4444" />
                </Grid>
                <Grid item xs={12}>
                  <StatCard title="Other Income" amount={ib.otherIncome} icon={<TrendingUpIcon />} color="#10b981" />
                </Grid>
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #eaeef3', borderRadius: '12px', backgroundColor: '#fff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <InfoIcon sx={{ color: '#64748b', fontSize: 18 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>How it ties to sales</Typography>
                    </Box>
                    {(plData?.notes || []).map((note, i) => (
                      <Typography key={i} variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.75, lineHeight: 1.5 }}>
                        • {note}
                      </Typography>
                    ))}
                    {plData?.formulas && (
                      <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #e2e8f0' }}>
                        {Object.entries(plData.formulas).map(([key, val]) => (
                          <Chip key={key} label={val} size="small" sx={{ mb: 0.5, mr: 0.5, fontSize: '0.7rem' }} />
                        ))}
                      </Box>
                    )}
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Card elevation={0} sx={{
                    border: 'none', borderRadius: '12px',
                    background: plData?.netProfit >= 0
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#fff',
                  }}>
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      <BankIcon sx={{ fontSize: 48, mb: 2, opacity: 0.8 }} />
                      <Typography variant="subtitle2" sx={{ opacity: 0.9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', mb: 1 }}>
                        Net Profit
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>
                        {fmt(plData?.netProfit)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default ProfitAndLoss;
