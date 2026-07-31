import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

const FabricatedTaxInvoice = ({ invoiceData, sale }) => {
  if (!invoiceData) return null;

  return (
    <Box sx={{ p: 4, bgcolor: 'white', color: 'black', width: '100%', maxWidth: '800px', mx: 'auto' }} className="print-container">
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">SmartPlaza</Typography>
        <Typography variant="subtitle1">Tax Invoice (VAT) - Gov Copy</Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="body2"><strong>Invoice No:</strong> {sale?.invoiceNumber}</Typography>
          <Typography variant="body2"><strong>Date:</strong> {new Date(sale?.date).toLocaleDateString()}</Typography>
        </Box>
        <Box>
          <Typography variant="body2"><strong>Customer:</strong> {sale?.customer?.contactName || 'Walk-in Customer'}</Typography>
          <Typography variant="body2"><strong>Phone:</strong> {sale?.customer?.contactNumber}</Typography>
        </Box>
      </Box>

      <Table size="small" sx={{ mb: 3, border: '1px solid #ddd', '& th, & td': { borderRight: '1px solid #ddd', fontSize: '11px', p: 1 } }}>
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell><strong>Goods Description</strong></TableCell>
            <TableCell align="center"><strong>Unit</strong></TableCell>
            <TableCell align="center"><strong>Qty</strong></TableCell>
            <TableCell align="right"><strong>Unit Value</strong></TableCell>
            <TableCell align="right"><strong>Sales Value</strong></TableCell>
            <TableCell align="right"><strong>Total Purchase Value</strong></TableCell>
            <TableCell align="right"><strong>Purchase Tax %</strong></TableCell>
            <TableCell align="right"><strong>Sales Tax %</strong></TableCell>
            <TableCell align="right"><strong>VAT Amount</strong></TableCell>
            <TableCell align="right" sx={{ borderRight: 'none' }}><strong>Grand Total</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoiceData.items?.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.goodsDescription}</TableCell>
              <TableCell align="center">{item.unit}</TableCell>
              <TableCell align="center">{item.quantity}</TableCell>
              <TableCell align="right">৳{item.unitValue?.toLocaleString()}</TableCell>
              <TableCell align="right">৳{item.salesValue?.toLocaleString()}</TableCell>
              <TableCell align="right">৳{item.totalPurchaseValue?.toLocaleString()}</TableCell>
              <TableCell align="right">{item.purchaseTaxPercent}%</TableCell>
              <TableCell align="right">{item.salesTaxPercent}%</TableCell>
              <TableCell align="right">৳{item.vatAmount?.toLocaleString()}</TableCell>
              <TableCell align="right" sx={{ borderRight: 'none' }}>৳{item.grandTotal?.toLocaleString()}</TableCell>
            </TableRow>
          ))}
          <TableRow sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>
            <TableCell colSpan={4} align="right"><strong>Totals:</strong></TableCell>
            <TableCell align="right"><strong>৳{invoiceData.totalSalesValue?.toLocaleString()}</strong></TableCell>
            <TableCell align="right"><strong>৳{invoiceData.totalPurchaseValue?.toLocaleString()}</strong></TableCell>
            <TableCell colSpan={2}></TableCell>
            <TableCell align="right"><strong>৳{invoiceData.totalVatAmount?.toLocaleString()}</strong></TableCell>
            <TableCell align="right" sx={{ borderRight: 'none' }}><strong>৳{invoiceData.grandTotal?.toLocaleString()}</strong></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  );
};

export default FabricatedTaxInvoice;
