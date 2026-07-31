import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Grid,
  Divider
} from '@mui/material';
import api from '../utils/api';

const ProfitAnalysisModal = ({ open, onClose, sale }) => {
  const [emiInvoice, setEmiInvoice] = useState(null);

  const isEmi = sale && (sale.invoiceType === 'EMI' || sale.emiOption);

  useEffect(() => {
    if (open && isEmi && sale?._id) {
      api.get(`/api/emi/invoices?relatedSaleOrder=${sale._id}`)
        .then(res => {
          if (res.data?.data && res.data.data.length > 0) {
            setEmiInvoice(res.data.data[0]);
          }
        })
        .catch(err => console.error("Failed to fetch EMI details:", err));
    } else {
      setEmiInvoice(null);
    }
  }, [open, isEmi, sale?._id]);

  if (!sale) return null;

  // Products Breakdown
  // individual item net profit calculations
  const items = sale.items || [];
  const taxItems = sale.invoices?.customerTax?.items || [];
  
  let totalProductProfit = 0;
  let totalSalesValue = 0;
  let totalCogs = 0;

  const productRows = items.map((item, index) => {
    // Find matching item in taxItems for COGS
    const taxItem = taxItems.find(t => t.productId?.toString() === item.product?._id?.toString() || t.productId?.toString() === item.product?.toString()) || taxItems[index] || {};
    
    const discount = item.discount || 0;
    const saleValue = (item.unitPrice * item.quantity) - discount;
    const cogs = taxItem.totalPurchaseValue || (item.product?.purchasePrice ? item.product.purchasePrice * item.quantity : 0) || 0;
    const itemProfit = saleValue - cogs;
    
    totalSalesValue += saleValue;
    totalCogs += cogs;
    totalProductProfit += itemProfit;

    return {
      name: item.productName || item.product?.name || taxItem.goodsDescription || 'Unknown Product',
      serialNumber: item.serialNumber || 'N/A',
      quantity: item.quantity,
      saleValue,
      cogs,
      itemProfit
    };
  });

  // Expenses
  const rawDelivery = sale.deliveryCharge || 0;
  const rawInstallation = sale.installationCost || 0;
  const rawOtherCharges = sale.additionalExpense || 0;

  const delivery = sale.isOperatingDelivery ? rawDelivery : 0;
  const installation = sale.isOperatingInstallation ? rawInstallation : 0;
  const otherCharges = sale.isOperatingExpense ? rawOtherCharges : 0;
  
  // Payment Fees (pos percentage cut from card payment or bkash nagad percentage cut)
  const payments = sale.payments || [];
  let totalPaymentFees = 0;
  const paymentRows = payments.filter(p => p.feeAmount > 0).map(p => {
    totalPaymentFees += p.feeAmount;
    return {
      method: p.method,
      provider: p.posMachineName || p.mfsProviderName || '',
      feePercentage: p.feePercentage,
      feeAmount: p.feeAmount
    };
  });

  const totalExpenses = delivery + installation + otherCharges + totalPaymentFees;
  const rawTotalExpenses = rawDelivery + rawInstallation + rawOtherCharges + totalPaymentFees;

  const emiInterest = isEmi && sale.emiOption?.interestRate
    ? (sale.total * sale.emiOption.interestRate) / 100
    : 0;

  const lateFee = emiInvoice ? (emiInvoice.totalLateFeePaid || 0) : 0;
  
  const cogsGlobal = sale.invoices?.customerTax?.totalPurchaseValue || (sale.items?.reduce((sum, item) => sum + ((item.product?.purchasePrice || 0) * item.quantity), 0)) || 0;
  const globalNetProfit = sale.total + emiInterest + lateFee - cogsGlobal - rawTotalExpenses;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1, color: '#1D5F99', fontWeight: 600 }}>
        Profit Analysis - Invoice #{sale.invoiceNumber}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="h6" sx={{ fontSize: '1.1rem', mb: 2, fontWeight: 500, color: '#334155' }}>
          Product Breakdown
        </Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
              <TableRow>
                <TableCell><strong>Product</strong></TableCell>
                <TableCell><strong>Serial/IMEI</strong></TableCell>
                <TableCell align="center"><strong>Qty</strong></TableCell>
                <TableCell align="right"><strong>Sale Value (net)</strong></TableCell>
                <TableCell align="right"><strong>COGS</strong></TableCell>
                <TableCell align="right"><strong>Item Profit</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productRows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.serialNumber}</TableCell>
                  <TableCell align="center">{row.quantity}</TableCell>
                  <TableCell align="right">৳{row.saleValue.toFixed(2)}</TableCell>
                  <TableCell align="right">৳{row.cogs.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ color: row.itemProfit >= 0 ? 'success.main' : 'error.main', fontWeight: 500 }}>
                    ৳{row.itemProfit.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ backgroundColor: '#F1F5F9' }}>
                <TableCell colSpan={3} align="right"><strong>Total Product Profit:</strong></TableCell>
                <TableCell align="right"><strong>৳{totalSalesValue.toFixed(2)}</strong></TableCell>
                <TableCell align="right"><strong>৳{totalCogs.toFixed(2)}</strong></TableCell>
                <TableCell align="right" sx={{ color: totalProductProfit >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
                  ৳{totalProductProfit.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h6" sx={{ fontSize: '1.1rem', mb: 2, fontWeight: 500, color: '#334155' }}>
          Expense Breakdown
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: isEmi ? 2 : 0 }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>
                      Delivery Expense
                      {!sale.isOperatingDelivery && rawDelivery > 0 && (
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontStyle: 'italic' }}>
                          *Non deductable, paid by customer
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">৳{delivery.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Installation Expense
                      {!sale.isOperatingInstallation && rawInstallation > 0 && (
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontStyle: 'italic' }}>
                          *Non deductable, paid by customer
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">৳{installation.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Other Charges
                      {!sale.isOperatingExpense && rawOtherCharges > 0 && (
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontStyle: 'italic' }}>
                          *Non deductable, paid by customer
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">৳{otherCharges.toFixed(2)}</TableCell>
                  </TableRow>
                  {paymentRows.map((p, i) => (
                    <TableRow key={`pay-${i}`}>
                      <TableCell>
                        Payment Fee ({p.method}{p.provider ? ` - ${p.provider}` : ''} {p.feePercentage ? `@ ${p.feePercentage}%` : ''})
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>
                        ৳{p.feeAmount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ backgroundColor: '#F1F5F9' }}>
                    <TableCell align="right"><strong>Total Deductions:</strong></TableCell>
                    <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                      ৳{totalExpenses.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {isEmi && (
              <>
                <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', mt: 2, mb: 1, fontWeight: 700, color: '#0F766E' }}>
                  EMI Earnings
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>EMI Interest Earned</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                          + ৳{emiInterest.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Late Fees Collected</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                          + ৳{lateFee.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              p: 3, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center',
              backgroundColor: globalNetProfit >= 0 ? '#F0FDF4' : '#FEF2F2',
              border: `1px solid ${globalNetProfit >= 0 ? '#BBF7D0' : '#FECACA'}`,
              borderRadius: 2
            }}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Final Net Profit
              </Typography>
              <Typography variant="h3" sx={{ color: globalNetProfit >= 0 ? '#16A34A' : '#DC2626', fontWeight: 700 }}>
                ৳{globalNetProfit.toFixed(2)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, backgroundColor: '#F8FAFC' }}>
        <Button onClick={onClose} variant="outlined" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfitAnalysisModal;
