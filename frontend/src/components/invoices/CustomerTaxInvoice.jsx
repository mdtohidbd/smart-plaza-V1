import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

// Helper for Number to Words (Indian Numbering System)
const numberToWords = (num) => {
    if (!num) return 'Zero';
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
    
    const inWords = (n) => {
        if ((n = n.toString()).length > 9) return 'Amount too large';
        let nArray = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!nArray) return '';
        let str = '';
        str += (nArray[1] != 0) ? (a[Number(nArray[1])] || b[nArray[1][0]] + ' ' + a[nArray[1][1]]) + 'Crore ' : '';
        str += (nArray[2] != 0) ? (a[Number(nArray[2])] || b[nArray[2][0]] + ' ' + a[nArray[2][1]]) + 'Lakh ' : '';
        str += (nArray[3] != 0) ? (a[Number(nArray[3])] || b[nArray[3][0]] + ' ' + a[nArray[3][1]]) + 'Thousand ' : '';
        str += (nArray[4] != 0) ? (a[Number(nArray[4])] || b[nArray[4][0]] + ' ' + a[nArray[4][1]]) + 'Hundred ' : '';
        str += (nArray[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(nArray[5])] || b[nArray[5][0]] + ' ' + a[nArray[5][1]]) : '';
        return str.trim();
    };
    return inWords(Math.round(num));
}

const CustomerTaxInvoice = ({ invoiceData, sale, title }) => {
  if (!invoiceData) return null;

  const isFabricated = title === 'Retail Tax Invoice';
  const salesItems = (isFabricated ? sale?.invoices?.fabricatedSales?.items : sale?.invoices?.customerSales?.items) || [];

  const invoiceDate = sale?.date ? new Date(sale.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const invoiceTime = sale?.date ? new Date(sale.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const totalQty = invoiceData.items?.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0) || 0;

  return (
    <Box sx={{ p: 4, bgcolor: 'white', color: 'black', width: '100%', maxWidth: '850px', mx: 'auto', fontFamily: 'Arial, sans-serif' }} className="print-container">
      
      {/* Header Section */}
      <Box sx={{ position: 'relative', textAlign: 'center', mb: 2 }}>
        {/* Government Logo Placeholder */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: 60, height: 60 }}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/84/Government_Seal_of_Bangladesh.svg" alt="Govt Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </Box>
        
        {/* Mushak Box */}
        <Box sx={{ position: 'absolute', top: 0, right: 0, border: '2px solid #000', px: 1, py: 0.5 }}>
          <Typography variant="caption" fontWeight="bold">Mushak 6.3</Typography>
        </Box>

        <Typography variant="subtitle2" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>Government of the People's Republic of Bangladesh</Typography>
        <Typography variant="subtitle2" fontWeight="bold">National Board of Revenue</Typography>
        <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>{title || 'Tax Invoice'}</Typography>
        <Typography variant="caption" display="block">[See clauses (GA) and (CHA) of Sub-Rule (1) of Rule 40]</Typography>
      </Box>

      {/* Info Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #000', pt: 1, mb: 1 }}>
        <Box sx={{ width: '60%', pr: 2 }}>
          <Typography variant="body2" sx={{ fontSize: '11px' }}><strong>Name of Registered Person:</strong> Smart Plaza</Typography>
          <Typography variant="body2" sx={{ fontSize: '11px' }}><strong>BIN of Registered Person:</strong> 006617818-0801</Typography>
          <Typography variant="body2" sx={{ fontSize: '11px' }}><strong>Address:</strong> 1, KDA Avenue, Khulna</Typography>
          <Typography variant="body2" sx={{ fontSize: '11px' }}><strong>Challan Issuing Address:</strong> 1, KDA Avenue, Khulna</Typography>
          
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ fontSize: '11px' }}><strong>Name of Purchaser:</strong> {sale?.customer?.contactName || 'Walk-in Customer'}</Typography>
            <Typography variant="body2" sx={{ fontSize: '11px' }}><strong>BIN of Purchaser (Where applicable):</strong> {sale?.customer?.bin || 'N/A'}</Typography>
            <Typography variant="body2" sx={{ fontSize: '11px' }}><strong>Address of Purchaser:</strong> {sale?.customer?.address || 'N/A'}</Typography>
            <Typography variant="body2" sx={{ fontSize: '11px' }}><strong>Destination of Supply:</strong> {sale?.customer?.address || 'N/A'}</Typography>
            <Typography variant="body2" sx={{ fontSize: '11px' }}><strong>Vehicle Type and Number:</strong> N/A</Typography>
          </Box>
        </Box>

        <Box sx={{ width: '40%', pl: 2 }}>
          <Typography variant="body2" sx={{ fontSize: '11px' }}><strong>Challan No:</strong> {sale?.invoiceNumber || 'N/A'}</Typography>
          <Typography variant="body2" sx={{ fontSize: '11px' }}><strong>Reference No:</strong> N/A</Typography>
          <Typography variant="body2" sx={{ fontSize: '11px' }}><strong>Date of Issue:</strong> {invoiceDate}</Typography>
          <Typography variant="body2" sx={{ fontSize: '11px' }}><strong>Time of Issue:</strong> {invoiceTime}</Typography>

        </Box>
      </Box>

      {/* Table */}
      <Table sx={{ border: '1px solid #000', '& th, & td': { border: '1px solid #000', p: '4px', fontSize: '10px' }, '& th': { textAlign: 'center', fontWeight: 'bold', bgcolor: '#f9f9f9', lineHeight: 1.2 } }}>
        <TableHead>
          <TableRow>
            <TableCell>S/L<br/>No</TableCell>
            <TableCell>Good/Service Description (Incases with Brand Name)</TableCell>
            <TableCell>Unit of<br/>Supply</TableCell>
            <TableCell>Qty</TableCell>
            <TableCell>Unit Value<br/>(TAKA)</TableCell>
            <TableCell>Total Value<br/>(TAKA)</TableCell>
            <TableCell>SD<br/>Rate</TableCell>
            <TableCell>SD<br/>Amount</TableCell>
            <TableCell>VAT Rate/<br/>Specific Tax</TableCell>
            <TableCell>VAT /Specific<br/>Tax Amount (TAKA)</TableCell>
            <TableCell>Value including<br/>all types of Duty & Tax (TAKA)</TableCell>
          </TableRow>
          <TableRow sx={{ '& th': { textAlign: 'center', py: 0.5, bgcolor: '#e0e0e0' } }}>
            <TableCell as="th">1</TableCell>
            <TableCell as="th">2</TableCell>
            <TableCell as="th">3</TableCell>
            <TableCell as="th">4</TableCell>
            <TableCell as="th">5</TableCell>
            <TableCell as="th">6</TableCell>
            <TableCell as="th">7</TableCell>
            <TableCell as="th">8</TableCell>
            <TableCell as="th">9</TableCell>
            <TableCell as="th">10</TableCell>
            <TableCell as="th">11</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoiceData.items?.map((item, index) => {
            const qty = Number(item.quantity) || 1;
            const taxRate = Number(item.salesTaxPercent) || 15;
            const salesInvoiceItem = salesItems[index];
            const inclusiveTotal = Number(salesInvoiceItem?.total) || Number(sale?.items?.[index]?.total) || Number(item.total) || Number(item.grandTotal) || 0;
            const exclusiveTotal = inclusiveTotal / (1 + (taxRate / 100));
            const calculatedVat = inclusiveTotal - exclusiveTotal;
            const exclusiveUnit = exclusiveTotal / qty;

            return (
            <TableRow key={index}>
              <TableCell align="center">{index + 1}</TableCell>
              <TableCell>{item.goodsDescription}</TableCell>
              <TableCell align="center">{item.unit || 'PCS'}</TableCell>
              <TableCell align="center">{qty}</TableCell>
              <TableCell align="right">{exclusiveUnit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
              <TableCell align="right">{exclusiveTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
              <TableCell align="center"></TableCell>
              <TableCell align="right"></TableCell>
              <TableCell align="center">{taxRate.toFixed(2)}%</TableCell>
              <TableCell align="right">{calculatedVat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
              <TableCell align="right">{inclusiveTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
            </TableRow>
          )})}
          <TableRow sx={{ fontWeight: 'bold' }}>
            <TableCell colSpan={5} align="right">Total</TableCell>
            <TableCell align="right">{
              (invoiceData.items?.reduce((sum, item, index) => {
                const rate = Number(item.salesTaxPercent) || 15;
                const salesInvoiceItem = salesItems[index];
                const incTotal = Number(salesInvoiceItem?.total) || Number(sale?.items?.[index]?.total) || Number(item.total) || Number(item.grandTotal) || 0;
                return sum + (incTotal / (1 + rate / 100));
              }, 0) || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
            }</TableCell>
            <TableCell colSpan={2}></TableCell>
            <TableCell></TableCell>
            <TableCell align="right">{
              (invoiceData.items?.reduce((sum, item, index) => {
                const rate = Number(item.salesTaxPercent) || 15;
                const salesInvoiceItem = salesItems[index];
                const incTotal = Number(salesInvoiceItem?.total) || Number(sale?.items?.[index]?.total) || Number(item.total) || Number(item.grandTotal) || 0;
                const excTotal = incTotal / (1 + rate / 100);
                return sum + (incTotal - excTotal);
              }, 0) || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
            }</TableCell>
            <TableCell align="right">{
              (invoiceData.items?.reduce((sum, item, index) => {
                const salesInvoiceItem = salesItems[index];
                return sum + (Number(salesInvoiceItem?.total) || Number(sale?.items?.[index]?.total) || Number(item.total) || Number(item.grandTotal) || 0);
              }, 0) || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
            }</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* Footer Details */}
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '11px' }}>Quantity In Words: <span style={{ fontWeight: 'normal' }}>{numberToWords(totalQty)} Piece(S) Only</span></Typography>
        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '11px' }}>Amount In Words: <span style={{ fontWeight: 'normal' }}>{numberToWords(invoiceData.grandTotal)} Taka Only</span></Typography>
      </Box>

      {/* Signatures */}
      <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', width: '300px' }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '11px', mb: 4 }}>Name of Authorized Person of Organization:</Typography>
        <Typography variant="body2" sx={{ fontSize: '11px', mb: 1 }}><strong>Designation:</strong></Typography>
        
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ fontSize: '11px', mb: 2 }}><strong>Signature:</strong></Typography>
          <Box sx={{ borderTop: '1px solid #000', width: '200px', pt: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#1976d2', display: 'block', lineHeight: 1.2 }}>Smart Plaza</Typography>
            <Typography variant="caption" sx={{ color: '#1976d2', display: 'block', lineHeight: 1.2 }}>Authorized Signature</Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="caption" sx={{ fontSize: '10px' }}>Value excluding all types of taxes.</Typography>
      </Box>
      
      <Box sx={{ mt: 4, pt: 1, borderTop: '1px solid #eee' }}>
         <Typography variant="caption" sx={{ fontSize: '9px', color: '#666' }}>Printed on: {invoiceDate} - {invoiceTime}</Typography>
      </Box>

    </Box>
  );
};

export default CustomerTaxInvoice;
