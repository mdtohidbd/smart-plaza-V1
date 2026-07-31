import React, { useState, useRef } from 'react';
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
  Button,
} from '@mui/material';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import useShopRefresh from '../../hooks/useShopRefresh';
import {
  CallReceived as InflowIcon,
  CallMade as OutflowIcon,
  AccountBalanceWallet as WalletIcon,
  InfoOutlined as InfoIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import CashFlowPrint from './CashFlowPrint';

const fmt = (n) =>
  `৳${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const FlowRow = ({ label, amount, color, hint }) => (
  <Box sx={{ mb: 1.5, px: 2 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="body1" sx={{ color: '#475569' }}>{label}</Typography>
      <Typography variant="body1" sx={{ fontWeight: 600, color: color || '#1e293b' }}>{fmt(amount)}</Typography>
    </Box>
    {hint && (
      <Typography variant="caption" sx={{ color: '#94a3b8', pl: 0.5 }}>{hint}</Typography>
    )}
  </Box>
);

const CashFlow = () => {
  const [filterType, setFilterType] = useState('monthly');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Cash_Flow_Statement',
  });

  const { data: cfData, isLoading, error, refetch } = useQuery(
    ['cashFlow', filterType, dateRange.startDate, dateRange.endDate],
    async () => {
      const params = { type: filterType };
      if (filterType === 'custom') {
        params.startDate = dateRange.startDate;
        params.endDate = dateRange.endDate;
      }
      const response = await api.get('/api/finance/cash-flow', { params });
      return response.data.data;
    },
    { enabled: filterType !== 'custom' || (!!dateRange.startDate && !!dateRange.endDate) }
  );

  useShopRefresh(refetch);

  const inflows = cfData?.inflows || {};
  const outflows = cfData?.outflows || {};

  return (
    <Box sx={{ py: { xs: 2, sm: 3 }, backgroundColor: '#F8FAFC', minHeight: '100%' }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #eaeef3', borderRadius: '12px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 700, fontFamily: '"Outfit", sans-serif', mb: 0.5 }}>
                  Cash Flow Statement
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Cash inflows from income entries and outflows from expenses & purchases.
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
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  disabled={isLoading || !cfData}
                  sx={{ color: '#0ea5e9', borderColor: '#0ea5e9', '&:hover': { borderColor: '#0284c7', backgroundColor: '#f0f9ff' } }}
                >
                  Export PDF
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {isLoading ? (
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Grid>
        ) : error ? (
          <Grid item xs={12}><Alert severity="error">Failed to load cash flow data.</Alert></Grid>
        ) : (
          <>
            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ border: '1px solid #bbf7d0', borderRadius: '12px', backgroundColor: '#f0fdf4' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <InflowIcon sx={{ color: '#16a34a', mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ color: '#16a34a', fontWeight: 600 }}>Total Inflows</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ color: '#15803d', fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
                    {fmt(inflows.total)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ border: '1px solid #fecaca', borderRadius: '12px', backgroundColor: '#fef2f2' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <OutflowIcon sx={{ color: '#dc2626', mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ color: '#dc2626', fontWeight: 600 }}>Total Outflows</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ color: '#b91c1c', fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
                    {fmt(outflows.total)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ border: '1px solid #bfdbfe', borderRadius: '12px', backgroundColor: '#eff6ff' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <WalletIcon sx={{ color: '#2563eb', mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ color: '#2563eb', fontWeight: 600 }}>Net Cash Flow</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ color: '#1d4ed8', fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
                    {fmt(cfData?.netCashFlow)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ border: '1px solid #eaeef3', borderRadius: '12px', height: '100%' }}>
                <Box sx={{ p: 2.5, borderBottom: '1px solid #eaeef3', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center' }}>
                  <InflowIcon sx={{ color: '#10b981', mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>Cash Inflows</Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <FlowRow label="Sales Revenue" amount={inflows.salesRevenue} color="#10b981"
                    hint="Cash / wholesale / partial retail payments" />
                  <FlowRow label="Down Payment (Retail EMI only)" amount={inflows.downPayment} color="#10b981"
                    hint="Not used for regular cash or wholesale sales" />
                  <FlowRow label="Sales Due Collections" amount={inflows.salesDueCollection} color="#10b981"
                    hint="Invoice number recorded in description" />
                  <FlowRow label="EMI Installment Collections (Principal)" amount={Math.max(0, (inflows.emiCollections || 0) - (cfData?.totalLateFees || 0))} color="#10b981"
                    hint="Post-sale EMI payments" />
                  <FlowRow label="EMI Late Fees" amount={cfData?.totalLateFees || 0} color="#10b981"
                    hint="Late fees collected from overdue installments" />
                  <FlowRow label="Other Income" amount={inflows.otherIncome} color="#10b981"
                    hint="Manual income entries" />
                  <Box sx={{ mt: 3, pt: 2, borderTop: '2px dashed #cbd5e1' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total Inflow</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#059669' }}>{fmt(inflows.total)}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ border: '1px solid #eaeef3', borderRadius: '12px', height: '100%' }}>
                <Box sx={{ p: 2.5, borderBottom: '1px solid #eaeef3', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center' }}>
                  <OutflowIcon sx={{ color: '#ef4444', mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>Cash Outflows</Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <FlowRow label="Purchase Payments" amount={outflows.purchasePayments} color="#ef4444"
                    hint="Supplier payments — tracked in Purchase module only" />
                  <FlowRow label="COGS (per sale)" amount={outflows.cogs} color="#ef4444"
                    hint="Customer name in expense; invoice in description" />
                  <FlowRow label="Delivery" amount={outflows.delivery} color="#ef4444" />
                  <FlowRow label="Installation" amount={outflows.installation} color="#ef4444" />
                  <FlowRow label="Sale Expense" amount={outflows.saleExpense} color="#ef4444" />
                  <FlowRow label="Payment Fees" amount={outflows.paymentFee} color="#ef4444" />
                  <FlowRow label="Other Operating" amount={outflows.otherOperating} color="#ef4444" />
                  <Box sx={{ mt: 3, pt: 2, borderTop: '2px dashed #cbd5e1' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total Outflow</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#dc2626' }}>{fmt(outflows.total)}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #eaeef3', borderRadius: '12px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <InfoIcon sx={{ color: '#64748b', fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>Income ↔ Expense relationship</Typography>
                </Box>
                {(cfData?.notes || []).map((note, i) => (
                  <Typography key={i} variant="body2" sx={{ color: '#64748b', mb: 0.75 }}>• {note}</Typography>
                ))}
                {cfData?.formulas && (
                  <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {Object.values(cfData.formulas).map((val, i) => (
                      <Chip key={i} label={val} size="small" sx={{ fontSize: '0.75rem' }} />
                    ))}
                  </Box>
                )}
              </Paper>
            </Grid>
          </>
        )}
      </Grid>
      
      {/* Hidden print component */}
      <Box sx={{ display: 'none' }}>
        <CashFlowPrint ref={printRef} cfData={cfData} filterType={filterType} dateRange={dateRange} />
      </Box>
    </Box>
  );
};

export default CashFlow;
