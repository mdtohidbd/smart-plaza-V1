import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Divider, Grid } from '@mui/material';

const logo = '/logo-final.jpeg';

const EMIInvoice = ({ emiInvoice, sale, title }) => {
  // Use emiInvoice if available, fallback to sale if somehow emiInvoice is missing but it's an EMI sale
  if (!emiInvoice && !sale) return null;

  const data = emiInvoice || {};
  const customerName = data.customerName || sale?.customer?.contactName || 'Walk-in Customer';
  const customerPhone = data.customerPhone || sale?.customer?.contactNumber || '';
  const customerAddress = data.customerAddress || sale?.customer?.address || '';
  const invoiceNumber = data.invoiceNumber || sale?.invoiceNumber || '';
  const invoiceDate = new Date(data.invoiceDate || sale?.date).toLocaleDateString('en-GB');

  // Format currency
  const formatCurrency = (amount) => `৳${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, bgcolor: 'white', color: 'black', width: '100%', maxWidth: '850px', mx: 'auto', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }} className="print-container">
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, borderBottom: '2px solid #0f172a', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={logo} alt="Smart Plaza Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </Box>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>SmartPlaza</Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>1 KDA Avenue, Shibabari, Khulna, Bangladesh, 9100</Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>Phone: 01842-144844 | Email: smartplazabd@gmail.com</Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {title || 'EMI INVOICE'}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1 }}>#{invoiceNumber}</Typography>
          <Typography variant="body2">Date: {invoiceDate}</Typography>
        </Box>
      </Box>

      {/* Customer Information */}
      <Box sx={{ mb: 4, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
          Bill To / Agreement With
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{customerName}</Typography>
            <Typography variant="body2" sx={{ color: '#475569' }}>{customerPhone}</Typography>
            <Typography variant="body2" sx={{ color: '#475569' }}>{customerAddress}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ textAlign: { sm: 'right' } }}>
            {/* Can add guarantor info here if available in the future */}
            <Typography variant="body2" sx={{ color: '#475569' }}><strong>Showroom:</strong> {data.showroom || 'Main Branch'}</Typography>
            <Typography variant="body2" sx={{ color: '#475569' }}><strong>Status:</strong> <span style={{textTransform: 'uppercase', fontWeight: 600, color: data.status === 'active' ? '#10b981' : '#3b82f6'}}>{data.status || 'Active'}</span></Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Product Details */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
        Product Details
      </Typography>
      <Table size="small" sx={{ mb: 4, '& th': { bgcolor: '#0f172a', color: 'white', fontWeight: 600, py: 1 }, '& td': { py: 1.5, borderBottom: '1px solid #e2e8f0' } }}>
        <TableHead>
          <TableRow>
            <TableCell>Description</TableCell>
            <TableCell align="center">Qty</TableCell>
            <TableCell align="right">Unit Price</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(data.products || sale?.items || []).map((item, index) => (
            <TableRow key={index}>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.name || item.productName}</Typography>
                {(item.model || item.color || item.serialNumber) && (
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                    {[
                      item.model ? `Model: ${item.model}` : '',
                      item.color ? `Color: ${item.color}` : '',
                      item.serialNumber ? `SN: ${item.serialNumber}` : ''
                    ].filter(Boolean).join(' | ')}
                  </Typography>
                )}
              </TableCell>
              <TableCell align="center">{item.quantity}</TableCell>
              <TableCell align="right">{formatCurrency(item.unitPrice || item.mrp)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(item.total || item.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* EMI Schedule Summary */}
        <Grid item xs={12} md={6}>
          <Box sx={{ p: 1.5, bgcolor: '#eff6ff', borderRadius: 1.5, border: '1px solid #bfdbfe', height: '100%' }}>
            <Typography sx={{ fontWeight: 700, color: '#1e3a8a', mb: 1, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
              EMI Plan Summary
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
              <Typography sx={{ fontSize: '0.8rem', color: '#1e40af' }}>Plan Duration:</Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e3a8a' }}>{data.emiPlan?.duration || 0} Months</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
              <Typography sx={{ fontSize: '0.8rem', color: '#1e40af' }}>Interest Rate:</Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e3a8a' }}>{data.emiPlan?.interestRate || 0}%</Typography>
            </Box>
            <Divider sx={{ my: 0.8, borderColor: '#93c5fd' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
              <Typography sx={{ fontSize: '0.8rem', color: '#1e40af' }}>Monthly Installment:</Typography>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#1d4ed8' }}>{formatCurrency(data.emiPlan?.monthlyInstalment)}</Typography>
            </Box>
          </Box>
        </Grid>

        {/* Financial Calculation */}
        <Grid item xs={12} md={6}>
          <Box sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
              <Typography sx={{ fontSize: '0.8rem', color: '#475569' }}>Base Amount:</Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{formatCurrency(data.totalAmount || sale?.invoices?.customerSales?.payableAmount)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
              <Typography sx={{ fontSize: '0.8rem', color: '#475569' }}>Total Interest:</Typography>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{formatCurrency(data.emiPlan?.interestAmount)}</Typography>
            </Box>
            {(data.deliveryCharge > 0 || sale?.deliveryCharge > 0) && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#475569' }}>Delivery Charge:</Typography>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>+ {formatCurrency(data.deliveryCharge || sale?.deliveryCharge)}</Typography>
              </Box>
            )}
            {(data.installationCost > 0 || sale?.installationCost > 0) && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#475569' }}>Installation Cost:</Typography>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>+ {formatCurrency(data.installationCost || sale?.installationCost)}</Typography>
              </Box>
            )}
            {(data.cardCharge > 0 || sale?.cardCharge > 0) && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#475569' }}>Card Charge:</Typography>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>+ {formatCurrency(data.cardCharge || sale?.cardCharge)}</Typography>
              </Box>
            )}
            <Divider sx={{ my: 0.8 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
              <Typography sx={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>Gross Total:</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{formatCurrency((data.totalAmount || 0) + (data.emiPlan?.interestAmount || 0))}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
              <Typography sx={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>Down Payment Paid:</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, textAlign: 'right', maxWidth: '65%' }}>
                {sale?.payments && sale.payments.length > 0
                  ? sale.payments.map(p => `${p.method}: ${formatCurrency(p.amount)}`).join(', ')
                  : formatCurrency(data.downPayment?.amount || 0)
                }
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography sx={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 800 }}>Total EMI Payable:</Typography>
              <Typography sx={{ fontSize: '1rem', color: '#0f172a', fontWeight: 800 }}>{formatCurrency(data.emiPlan?.totalPayableAmount || data.outstandingBalance)}</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Installment Schedule (Brief) */}
      {data.instalments && data.instalments.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
            Installment Schedule Details
          </Typography>
          <Table size="small" sx={{ border: '1px solid #e2e8f0', '& th': { bgcolor: '#f8fafc', color: '#475569', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }, '& td': { fontSize: '0.8rem', py: 1 } }}>
            <TableHead>
              <TableRow>
                <TableCell>Ins. No</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.instalments.slice(0, 12).map((inst, idx) => (
                <TableRow key={idx}>
                  <TableCell>#{inst.instalmentNumber}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{new Date(inst.dueDate).toLocaleDateString('en-GB')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(inst.amount)}</TableCell>
                  <TableCell align="center">
                    <Box component="span" sx={{ 
                      px: 1, py: 0.5, borderRadius: 1, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                      bgcolor: inst.status === 'paid' ? '#d1fae5' : inst.status === 'overdue' ? '#fee2e2' : '#f1f5f9',
                      color: inst.status === 'paid' ? '#059669' : inst.status === 'overdue' ? '#dc2626' : '#475569'
                    }}>
                      {inst.status}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {data.instalments.length > 12 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ fontStyle: 'italic', color: '#64748b', py: 1 }}>
                    ... and {data.instalments.length - 12} more installments.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Terms and Conditions */}
      <Box sx={{ mb: 4, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
        <Typography sx={{ fontWeight: 700, color: '#475569', mb: 0.5, fontSize: '0.7rem', textTransform: 'uppercase' }}>
          Terms & Conditions
        </Typography>
        <Typography sx={{ fontSize: '0.68rem', color: '#64748b', display: 'block', lineHeight: 1.4 }}>
          1. Product remains SmartPlaza property until full EMI is paid.<br/>
          2. Late payment may incur penalty charges as per policy.<br/>
          3. Warranty void if EMI payments are defaulted.<br/>
          4. Customer agrees to payment schedule by signing.
        </Typography>
      </Box>

      {/* Signatures */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 8, pt: 2 }}>
        <Box sx={{ textAlign: 'center', width: '200px' }}>
          <Box sx={{ borderTop: '1px solid #94a3b8', pt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>Customer Signature</Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'center', width: '200px' }}>
          <Box sx={{ borderTop: '1px solid #94a3b8', pt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>Authorized Signature</Typography>
          </Box>
        </Box>
      </Box>

    </Box>
  );
};

export default EMIInvoice;
