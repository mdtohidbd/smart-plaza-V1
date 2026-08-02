import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { BRAND, PhoneIcon, MailIcon, PinIcon } from './invoiceTheme';
import { useSettings } from '../../context/SettingsContext';

const money = (n) => (typeof n === 'number' ? n.toLocaleString() : '0');

const FabricatedSalesInvoice = ({ invoiceData, sale }) => {
  const { settings } = useSettings();
  const logo = settings?.logo || '/logo-final.jpeg';
  const companyName = settings?.companyName || 'Smart Plaza BD';
  const phone = settings?.phone || '01842-144844';
  const email = settings?.email || 'smartplazabd@gmail.com';
  const address = settings?.companyAddress || '1, KDA Avenue, Khulna';
  const website = settings?.website || email;
  if (!invoiceData) return null;

  const items = invoiceData.items || [];
  const isPaid = invoiceData.dueAmount <= 0;
  const invoiceDate = sale?.date
    ? new Date(sale.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <Box sx={{ bgcolor: 'white', color: BRAND.ink, width: '100%', maxWidth: '800px', mx: 'auto', display: 'flex', flexDirection: 'column', minHeight: '900px', fontFamily: 'Arial, sans-serif' }} className="print-container">

      {/* Header */}
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ height: '4px', bgcolor: BRAND.orange }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${BRAND.border}`, position: 'relative', height: '90px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, zIndex: 1, pl: 4 }}>
            <Box sx={{ width: 72, display: 'flex', alignItems: 'center' }}>
              <img src={logo} alt="Company Logo" style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight: '60px' }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: 26, lineHeight: 1.1, color: BRAND.teal, letterSpacing: '-0.5px' }}>
                {companyName}
              </Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 'bold', color: BRAND.ink, mt: 0.5 }}>
                {email}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ position: 'absolute', top: 0, right: 0, width: '45%', height: '100%', zIndex: 0 }}>
            <Box sx={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '25px', bgcolor: 'black', clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)' }} />
            <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: '100%', height: '65px', bgcolor: BRAND.orange, clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 4 }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 28, letterSpacing: 1 }}>INVOICE</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: 4, pt: 2, pb: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Customer + Meta */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.5 }}>Invoice To:</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 16, color: BRAND.orange, textTransform: 'uppercase', lineHeight: 1 }}>
              {sale?.customer?.contactName || 'Walk-in Customer'}
            </Typography>
            <Typography sx={{ fontSize: 12, color: BRAND.gray, mt: 0.5 }}>
              {[sale?.customer?.address, sale?.customer?.businessName].filter(Boolean).join(', ')}
            </Typography>
            <Typography sx={{ fontSize: 12, mt: 1, fontWeight: 'bold' }}>
              P : {sale?.customer?.contactNumber || '+0000 1234 5678'}
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 'bold' }}>
              E : {sale?.customer?.email || 'info@yourmail.com'}
            </Typography>
          </Box>

          <Box sx={{ width: '250px' }}>
            <Box sx={{ bgcolor: 'black', py: 0.5, px: 1.5, mb: 1.5, borderLeft: `4px solid ${BRAND.orange}` }}>
              <Typography sx={{ color: '#fff', fontSize: '10.5px', fontWeight: 700, lineHeight: 1.35, letterSpacing: '0.2px' }}>
                INVOICE NO: {sale?.invoiceNumber}
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto auto', columnGap: 2, rowGap: 0.4 }}>
              <Typography sx={{ fontSize: 12, color: BRAND.gray }}>Vat Reg No</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{invoiceData.vatRegNo || '006617818-0801'}</Typography>
              <Typography sx={{ fontSize: 12, color: BRAND.gray }}>Sold By</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{sale?.soldBy?.name || '—'}</Typography>
              <Typography sx={{ fontSize: 12, color: BRAND.gray }}>Date</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{invoiceDate}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Items table */}
        <Table size="small" sx={{ mb: 2, '& .MuiTableCell-root': { borderBottom: `1px solid ${BRAND.border}`, py: 0.8 } }}>
          <TableHead>
            <TableRow>
              {['Item description', 'Quantity', 'Unit Price', 'Total Price'].map((label, i) => (
                <TableCell
                  key={label}
                  align={i === 0 ? 'left' : 'center'}
                  sx={{ bgcolor: BRAND.orange, color: '#fff', fontWeight: 700, fontSize: 11.5, textTransform: 'uppercase', border: 'none' }}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index} sx={{ bgcolor: index % 2 === 1 ? BRAND.rowAlt : 'transparent' }}>
                <TableCell>
                  <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{item.productName}</Typography>
                  <Typography sx={{ fontSize: 11, color: BRAND.gray }}>
                    {[item.model, item.color ? `Color: ${item.color}` : null, item.serialNumber, item.warranty && `Warranty: ${item.warranty}`].filter(Boolean).join(' • ')}
                  </Typography>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: 13 }}>{item.quantity}</TableCell>
                <TableCell align="center" sx={{ fontSize: 13 }}>৳{money(item.mrp)}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: 13 }}>৳{money(item.total)}</TableCell>
              </TableRow>
            ))}
            {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
              <TableRow key={`blank-${i}`} sx={{ height: 32 }}>
                <TableCell colSpan={4} />
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Payment + Totals */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: 'auto', gap: 4 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 1 }}>Payment method</Typography>
            <Typography sx={{ fontSize: 12, color: BRAND.gray }}>
              {sale?.paymentMethod && sale.paymentMethod !== 'Cash' ? sale.paymentMethod : 'Cash'}
            </Typography>
            <Typography sx={{ fontSize: 12, mt: 0.5, fontWeight: 700, color: isPaid ? 'green' : BRAND.orange }}>
              {isPaid ? 'PAID' : 'DUE'}
            </Typography>
          </Box>

          <Box sx={{ width: '260px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>Sub Total</Typography>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>৳{money(invoiceData.subTotal)}</Typography>
            </Box>
            {invoiceData.discount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: BRAND.orange }}>Smart Plaza Discount</Typography>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: BRAND.orange }}>- ৳{money(invoiceData.discount)}</Typography>
              </Box>
            )}
            {invoiceData.deliveryCharge > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>Delivery Charge</Typography>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>+ ৳{money(invoiceData.deliveryCharge)}</Typography>
              </Box>
            )}
            {invoiceData.installationCost > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>Installation Cost</Typography>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>+ ৳{money(invoiceData.installationCost)}</Typography>
              </Box>
            )}
            {invoiceData.cardCharge > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>Card Charge</Typography>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>+ ৳{money(invoiceData.cardCharge)}</Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>Due</Typography>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>৳{money(invoiceData.dueAmount)}</Typography>
            </Box>
            <Box sx={{ bgcolor: BRAND.orange, color: '#fff', display: 'flex', justifyContent: 'space-between', px: 1.5, py: 1.2 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 15 }}>Grand Total</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: 15 }}>৳{money(invoiceData.payableAmount)}</Typography>
            </Box>
          </Box>
        </Box>

      </Box>

      {/* Footer Wrapper (Signatures + Bottom Footer) */}
      <Box sx={{ width: '100%', mt: 'auto', breakInside: 'avoid', pageBreakInside: 'avoid', '@media print': { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10, bgcolor: 'white', px: 4, pb: 0 } }}>
        {/* Signatures */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, px: 1 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Thanks for doing business with us!</Typography>
          <Box sx={{ display: 'flex', gap: 5 }}>
            {['Received By', 'Authorized Seal & Sign'].map((label) => (
              <Box key={label} sx={{ borderTop: `1px solid ${BRAND.ink}`, width: 140, textAlign: 'center', pt: 0.5 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Footer Bar */}
        <Box sx={{ position: 'relative', height: '60px', width: '100%', overflow: 'hidden' }}>
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '15px', bgcolor: BRAND.orange }} />
          <Box sx={{ position: 'absolute', bottom: 15, left: 0, width: '60%', height: '20px', bgcolor: BRAND.orange, clipPath: 'polygon(0 0, 95% 0, 100% 100%, 0% 100%)' }} />
          <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: '45%', height: '60px', bgcolor: 'black', clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 4, zIndex: 1 }}>
            <Typography sx={{ color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', gap: 0.7, fontWeight: 'bold' }}>
              <Box sx={{ bgcolor: BRAND.orange, borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PinIcon size={11} />
              </Box>
              {address}
            </Typography>
          </Box>
          <Box sx={{ position: 'absolute', bottom: 15, left: '20px', display: 'flex', alignItems: 'center', gap: 4, zIndex: 2 }}>
            <Typography sx={{ color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', gap: 0.7, fontWeight: 'bold' }}>
              <Box sx={{ bgcolor: 'black', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <PhoneIcon size={11} />
              </Box>
              {phone}
            </Typography>
            <Typography sx={{ color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', gap: 0.7, fontWeight: 'bold' }}>
              <Box sx={{ bgcolor: 'black', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <MailIcon size={11} />
              </Box>
              {website}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FabricatedSalesInvoice;
