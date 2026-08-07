import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Grid } from '@mui/material';
import { BRAND, PhoneIcon, MailIcon, PinIcon } from '../../components/invoices/invoiceTheme';

const logo = '/logo-final.jpeg';

const fmt = (n) =>
  `৳${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const FlowRow = ({ label, amount, color }) => (
  <TableRow>
    <TableCell sx={{ borderBottom: `1px solid ${BRAND.border}` }}>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{label}</Typography>
    </TableCell>
    <TableCell align="right" sx={{ borderBottom: `1px solid ${BRAND.border}` }}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: color || '#1e293b' }}>{fmt(amount)}</Typography>
    </TableCell>
  </TableRow>
);

const CashFlowPrint = React.forwardRef(({ cfData, filterType, dateRange }, ref) => {
  if (!cfData) return null;

  const inflows = cfData.inflows || {};
  const outflows = cfData.outflows || {};

  let periodText = 'Today';
  if (filterType === 'monthly') periodText = 'This Month';
  if (filterType === 'custom') periodText = `${dateRange.startDate} to ${dateRange.endDate}`;

  return (
    <Box ref={ref} sx={{ bgcolor: 'white', color: 'black', width: '100%', maxWidth: '800px', mx: 'auto', display: 'flex', flexDirection: 'column', minHeight: '980px', position: 'relative', '@media print': { minHeight: 'auto', height: 'auto', overflow: 'visible', margin: 0, padding: 0 } }} className="print-container">
      
      {/* Header */}
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0, borderBottom: `2px solid ${BRAND.border}`, position: 'relative', height: '90px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, zIndex: 1, pl: 4 }}>
            <Box sx={{ width: 80, height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={logo} alt="Demo ERP Logo" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
            </Box>
            <Box>
              <Typography variant="h3" fontWeight="900" sx={{ m: 0, lineHeight: 1, letterSpacing: '-1px' }}>
                <Box component="span" sx={{ color: BRAND.orange }}>Smart</Box>{' '}
                <Box component="span" sx={{ color: BRAND.teal }}>Plaza</Box>
              </Typography>
              <Typography variant="caption" sx={{ color: BRAND.ink, fontWeight: 'bold', fontSize: '11px', display: 'flex', gap: 1 }}>
                <span>Electronics</span>
                <span>Smartphones</span>
                <span>Gadgets</span>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ position: 'absolute', top: 0, right: 0, width: '45%', height: '100%', zIndex: 0 }}>
            <Box sx={{ position: 'absolute', top: 0, right: 0, width: '38px', height: '100%', zIndex: 2 }}>
              <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#333' }} />
            </Box>
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: 'calc(100% - 38px)', height: '100%', bgcolor: BRAND.orange, clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 4, zIndex: 1 }}>
              <Typography variant="h3" fontWeight="bold" sx={{ color: 'white', letterSpacing: 1 }}>REPORT</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: 3, pt: 3, pb: 2, flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* Watermark Logo */}
        <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.1, zIndex: 0, pointerEvents: 'none', width: '60%', height: '60%', display: 'flex', alignItems: 'center', justifyContent: 'center', '@media print': { position: 'fixed' } }}>
          <img src={logo} alt="Watermark" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </Box>

        <Box sx={{ mb: 4, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: BRAND.ink, textTransform: 'uppercase', letterSpacing: 1 }}>
            Cash Flow Statement
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            Period: {periodText}
          </Typography>
        </Box>

        {/* Summary Boxes */}
        <Grid container spacing={3} sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
          <Grid item xs={4}>
            <Box sx={{ p: 2, border: `1px solid #16a34a`, borderRadius: 2, bgcolor: '#f0fdf4', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Inflows</Typography>
              <Typography variant="h6" sx={{ color: '#15803d', fontWeight: 'bold' }}>{fmt(inflows.total)}</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ p: 2, border: `1px solid #dc2626`, borderRadius: 2, bgcolor: '#fef2f2', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Outflows</Typography>
              <Typography variant="h6" sx={{ color: '#b91c1c', fontWeight: 'bold' }}>{fmt(outflows.total)}</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ p: 2, border: `1px solid #2563eb`, borderRadius: 2, bgcolor: '#eff6ff', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 'bold', textTransform: 'uppercase' }}>Net Cash Flow</Typography>
              <Typography variant="h6" sx={{ color: '#1d4ed8', fontWeight: 'bold' }}>{fmt(cfData.netCashFlow)}</Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Detailed Breakdown */}
        <Grid container spacing={4} sx={{ position: 'relative', zIndex: 1 }}>
          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: '#10b981', borderBottom: `2px solid #10b981`, pb: 0.5 }}>
              Cash Inflows
            </Typography>
            <Table size="small">
              <TableBody>
                <FlowRow label="Sales Revenue" amount={inflows.salesRevenue} />
                <FlowRow label="Down Payment (Retail EMI only)" amount={inflows.downPayment} />
                <FlowRow label="Sales Due Collections" amount={inflows.salesDueCollection} />
                <FlowRow label="EMI Installment Collections (Principal)" amount={Math.max(0, (inflows.emiCollections || 0) - (cfData.totalLateFees || 0))} />
                <FlowRow label="EMI Late Fees" amount={cfData.totalLateFees || 0} />
                <FlowRow label="Other Income" amount={inflows.otherIncome} />
                <TableRow>
                  <TableCell sx={{ borderBottom: 'none' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Total Inflow</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: 'none' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#059669' }}>{fmt(inflows.total)}</Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: '#ef4444', borderBottom: `2px solid #ef4444`, pb: 0.5 }}>
              Cash Outflows
            </Typography>
            <Table size="small">
              <TableBody>
                <FlowRow label="Purchase Payments" amount={outflows.purchasePayments} />
                <FlowRow label="COGS (per sale)" amount={outflows.cogs} />
                <FlowRow label="Delivery" amount={outflows.delivery} />
                <FlowRow label="Installation" amount={outflows.installation} />
                <FlowRow label="Sale Expense" amount={outflows.saleExpense} />
                <FlowRow label="Payment Fees" amount={outflows.paymentFee} />
                <FlowRow label="Other Operating" amount={outflows.otherOperating} />
                <TableRow>
                  <TableCell sx={{ borderBottom: 'none' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Total Outflow</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: 'none' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#dc2626' }}>{fmt(outflows.total)}</Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Grid>
        </Grid>
      </Box>

      {/* Footer Wrapper (Bottom Footer) */}
      <Box sx={{ width: '100%', mt: 'auto', breakInside: 'avoid', pageBreakInside: 'avoid', '@media print': { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10, bgcolor: 'white', px: 3, pb: 0 } }}>
        <Box sx={{ position: 'relative', height: '60px', width: '100%', overflow: 'hidden' }}>
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '15px', bgcolor: BRAND.orange }} />
          <Box sx={{ position: 'absolute', bottom: 15, left: 0, width: '60%', height: '20px', bgcolor: BRAND.orange, clipPath: 'polygon(0 0, 95% 0, 100% 100%, 0% 100%)' }} />
          
          <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: '45%', height: '60px', zIndex: 1 }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: 'calc(100% - 38px)', height: '100%', bgcolor: '#333', clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)' }} />
            <Box sx={{ position: 'absolute', top: 0, right: 0, width: '38px', height: '100%' }}>
              <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#333' }} />
            </Box>
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: 'calc(100% - 38px)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 4, zIndex: 1 }}>
             <Typography variant="caption" sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
               <Box sx={{ bgcolor: BRAND.orange, borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <PinIcon size={11} />
               </Box>
               1, KDA Avenue, Khulna
             </Typography>
            </Box>
          </Box>
          
          <Box sx={{ position: 'absolute', bottom: 15, left: '20px', display: 'flex', alignItems: 'center', gap: 4, height: '20px', zIndex: 2 }}>
             <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.7, color: 'white', fontWeight: 'bold' }}>
               <Box sx={{ bgcolor: 'black', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <PhoneIcon size={11} />
               </Box>
               01842144844
             </Typography>
             <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.7, color: 'white', fontWeight: 'bold' }}>
               <Box sx={{ bgcolor: 'black', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <MailIcon size={11} />
               </Box>
               www.yourskybridge.com
             </Typography>
          </Box>
        </Box>
      </Box>
      
    </Box>
  );
});

export default CashFlowPrint;
