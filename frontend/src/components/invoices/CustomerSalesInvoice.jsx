import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { BRAND, PhoneIcon, MailIcon, PinIcon } from './invoiceTheme';
import { useSettings } from '../../context/SettingsContext';

const CustomerSalesInvoice = ({ invoiceData, sale, title }) => {
  const { settings } = useSettings();
  const logo = settings?.logo || '/logo-final.jpeg';
  const companyName = settings?.companyName || 'Demo Electronics ERP';
  const phone = settings?.phone || '01842-144844';
  const email = settings?.email || 'admin@yourskybridge.com';
  const address = settings?.companyAddress || '1, KDA Avenue, Khulna';
  const website = settings?.website || email;
  if (!invoiceData) return null;

  const baseDate = sale?.date ? new Date(sale.date) : new Date();
  const invoiceDate = baseDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const nextMonth = new Date(baseDate);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextInstalmentDate = nextMonth.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const isFabricated = title === 'Retail Sales Invoice';
  const hasEMI = !isFabricated && (sale?.isEmi || sale?.invoiceType?.toUpperCase() === 'EMI' || sale?.payments?.some(p => p.method?.toUpperCase() === 'EMI') || sale?.paymentMethod?.toUpperCase() === 'EMI');
  const hasWarranty = invoiceData?.items?.some(item => item.warranty && item.warranty !== 'N/A' && item.warranty.toLowerCase() !== 'no warranty' && item.warranty.trim() !== '');

  // Set empty rows to exactly 2 as requested by the user
  const emptyRowCount = 2;

  const actualDownPayment = sale?.emiOption?.downPayment || sale?.paidAmount || invoiceData?.paidAmount || 0;
  const emiInterestRate = sale?.emiOption?.interestRate || 0;
  const emiInterestAmount = (invoiceData?.payableAmount * emiInterestRate) / 100;
  const totalWithEMI = (invoiceData?.payableAmount || 0) + emiInterestAmount;
  const loanAmount = totalWithEMI - actualDownPayment;
  const emiDuration = sale?.emiOption?.duration || 12;
  const monthlyInstalment = loanAmount / emiDuration;

  return (
    <Box sx={{ bgcolor: 'white', color: 'black', width: '100%', maxWidth: '800px', mx: 'auto', display: 'flex', flexDirection: 'column', minHeight: '980px', position: 'relative', '@media print': { minHeight: 'auto', height: 'auto', overflow: 'visible', margin: 0, padding: 0 } }} className="print-container">
      
      {/* Header */}
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0, borderBottom: `2px solid ${BRAND.border}`, position: 'relative', height: '90px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, zIndex: 1, pl: 4 }}>
            <Box sx={{ width: 80, height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={logo} alt="Company Logo" style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight: '60px' }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="900" sx={{ m: 0, lineHeight: 1.1, color: BRAND.teal, letterSpacing: '-0.5px' }}>
                {companyName}
              </Typography>
              <Typography variant="caption" sx={{ color: BRAND.ink, fontWeight: 'bold', fontSize: '11px', display: 'block', mt: 0.5 }}>
                {email}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ position: 'absolute', top: 0, right: 0, width: '45%', height: '100%', zIndex: 0 }}>
            <Box sx={{ position: 'absolute', top: 0, right: 0, width: '38px', height: '100%', zIndex: 2 }}>
              <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#333' }} />
            </Box>
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: 'calc(100% - 38px)', height: '100%', bgcolor: BRAND.orange, clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 4, zIndex: 1 }}>
              <Typography variant="h3" fontWeight="bold" sx={{ color: 'white', letterSpacing: 1 }}>INVOICE</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: 3, pt: 1, pb: 2, flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* Watermark Logo - Fixed to middle of EVERY page during print */}
        <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.1, zIndex: 0, pointerEvents: 'none', width: '60%', height: '60%', display: 'flex', alignItems: 'center', justifyContent: 'center', '@media print': { position: 'fixed' } }}>
          <img src={logo} alt="Watermark" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </Box>

        {/* Customer Info Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, position: 'relative', zIndex: 1 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5 }}>Invoice To:</Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ color: BRAND.orange, textTransform: 'uppercase', lineHeight: 1 }}>
              {sale?.customer?.contactName || 'Walk-in Customer'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {[sale?.customer?.address, sale?.customer?.businessName].filter(Boolean).join(', ')}
            </Typography>
            
            <Typography variant="body2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ bgcolor: BRAND.orange, borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PhoneIcon size={11} />
              </Box>
              {sale?.customer?.contactNumber || '+0000 1234 5678'}
            </Typography>
          </Box>

          <Box sx={{ width: '250px' }}>
            <Box sx={{ bgcolor: 'black', py: 0.5, px: 1.5, mb: 2, display: 'inline-block', width: '100%', borderLeft: `4px solid ${BRAND.orange}` }}>
              <Typography sx={{ color: '#fff', fontSize: '10.5px', fontWeight: 700, lineHeight: 1.35, letterSpacing: '0.2px' }}>
                INVOICE NO: {sale?.invoiceNumber || '060820'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="textSecondary">Vat Reg No</Typography>
              <Typography variant="body2" fontWeight="bold">006617818-0801</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="textSecondary">Sold By</Typography>
              <Typography variant="body2" fontWeight="bold">{sale?.soldBy?.name || 'Aabir Ahammed'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="textSecondary">Date</Typography>
              <Typography variant="body2" fontWeight="bold">{invoiceDate}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Table */}
        <Table sx={{ mb: 1, '& .MuiTableCell-root': { borderBottom: `1px solid ${BRAND.border}`, py: 0.5 }, position: 'relative', zIndex: 1 }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ bgcolor: BRAND.orange, color: 'white', fontWeight: 'bold', width: '5%' }}>SL</TableCell>
              <TableCell sx={{ bgcolor: BRAND.orange, color: 'white', fontWeight: 'bold', width: '35%' }}>Item description</TableCell>
              <TableCell align="right" sx={{ bgcolor: BRAND.orange, color: 'white', fontWeight: 'bold', width: '12%', textTransform: 'uppercase' }}>MRP</TableCell>
              <TableCell align="right" sx={{ bgcolor: BRAND.orange, color: 'white', fontWeight: 'bold', width: '13%', textTransform: 'uppercase' }}>Special Discount</TableCell>
              <TableCell align="right" sx={{ bgcolor: BRAND.orange, color: 'white', fontWeight: 'bold', width: '15%', textTransform: 'uppercase' }}>Final Price</TableCell>
              <TableCell align="center" sx={{ bgcolor: BRAND.orange, color: 'white', fontWeight: 'bold', width: '8%' }}>Qty</TableCell>
              <TableCell align="right" sx={{ bgcolor: BRAND.orange, color: 'white', fontWeight: 'bold', width: '12%', textTransform: 'uppercase' }}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoiceData.items?.map((item, index) => {
              const basePrice = item.unitPrice || item.price || item.unitValue || (item.total / (item.quantity || 1)) || 0;
              const discount = item.discount || 0;
              const finalPrice = basePrice - discount;
              const quantity = item.quantity || 0;
              const total = item.total || (finalPrice * quantity);

              return (
                <TableRow key={index} sx={{ bgcolor: index % 2 === 1 ? BRAND.rowAlt : 'transparent' }}>
                  <TableCell align="center" sx={{ bgcolor: 'transparent', borderBottom: `1px solid ${BRAND.border}` }}>
                    {index + 1}
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'transparent', borderBottom: `1px solid ${BRAND.border}` }}>
                    <Typography variant="body2" fontWeight="bold">
                      {item.productName}{item.color ? ` - ${item.color}` : ''}
                    </Typography>
                    {item.model && (
                      <Typography variant="caption" display="block" color="textSecondary">
                        Model: {item.model}
                      </Typography>
                    )}
                    {item.serialNumber && (
                      <Typography variant="caption" display="block" color="textSecondary">SN: {item.serialNumber}</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'transparent', fontWeight: 'bold', borderBottom: `1px solid ${BRAND.border}` }}>
                    {basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'transparent', fontWeight: 'bold', borderBottom: `1px solid ${BRAND.border}` }}>
                    {discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'transparent', fontWeight: 'bold', borderBottom: `1px solid ${BRAND.border}` }}>
                    {finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="center" sx={{ bgcolor: 'transparent', fontWeight: 'bold', borderBottom: `1px solid ${BRAND.border}` }}>
                    {quantity < 10 ? `0${quantity}` : quantity}
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'transparent', fontWeight: 'bold', borderBottom: `1px solid ${BRAND.border}` }}>
                    {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              );
            })}
            {/* Empty rows to visually fill the page */}
            {[...Array(emptyRowCount)].map((_, idx) => (
              <TableRow key={`empty-${idx}`} sx={{ height: '35px' }}>
                <TableCell sx={{ bgcolor: 'transparent', borderBottom: `1px solid ${BRAND.border}` }}></TableCell>
                <TableCell sx={{ bgcolor: 'transparent', borderBottom: `1px solid ${BRAND.border}` }}></TableCell>
                <TableCell sx={{ bgcolor: 'transparent', borderBottom: `1px solid ${BRAND.border}` }}></TableCell>
                <TableCell sx={{ bgcolor: 'transparent', borderBottom: `1px solid ${BRAND.border}` }}></TableCell>
                <TableCell sx={{ bgcolor: 'transparent', borderBottom: `1px solid ${BRAND.border}` }}></TableCell>
                <TableCell sx={{ bgcolor: 'transparent', borderBottom: `1px solid ${BRAND.border}` }}></TableCell>
                <TableCell sx={{ bgcolor: 'transparent', borderBottom: `1px solid ${BRAND.border}` }}></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Footer Calculation Area */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, mt: 'auto', pt: 1.5 }}>
          <Box sx={{ width: '45%' }}>


            <Box sx={{ mt: 1, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              
              {hasEMI && (
          <Box sx={{ p: 0.8, border: `1px solid ${BRAND.orange}`, borderRadius: '6px', bgcolor: '#fff8f0', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <Typography sx={{ fontSize: '11px', fontWeight: 'bold', color: BRAND.orange, display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.4 }}>
              <span style={{ fontSize: '12px' }}>💳</span> EMI Information
            </Typography>
            <Box sx={{ mt: 0.4, pt: 0.4, borderTop: `1px dashed ${BRAND.orange}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.6 }}>
              <Box>
                <Typography sx={{ fontSize: '9px', color: BRAND.inkLight }}>Duration:</Typography>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: BRAND.orange }}>{sale?.emiOption?.duration || 12} Months</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '9px', color: BRAND.inkLight }}>Down Payment:</Typography>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: BRAND.orange }}>৳ {actualDownPayment.toLocaleString()}</Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 0.4, pt: 0.4, borderTop: `1px dashed ${BRAND.orange}` }}>
              <Typography sx={{ fontSize: '9px', color: BRAND.inkLight }}>Next Instalment:</Typography>
              <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: BRAND.orange }}>{nextInstalmentDate} (Monthly)</Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ p: 0.8, border: `1px solid #e2e8f0`, borderRadius: '6px', bgcolor: '#f8fafc', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          <Typography sx={{ fontSize: '11px', fontWeight: 'bold', color: BRAND.ink, mb: 0.4 }}>Terms & Conditions</Typography>
          <Box sx={{ fontSize: '8.5px', color: BRAND.gray, lineHeight: 1.4 }}>
            • Goods once sold are not refundable.<br/>
            • Please check products before delivery.<br/>
            • Manufacturer warranty applies as per brand policy.<br/>
            • Original invoice required for warranty claims.<br/>
            • Not liable for damage caused by misuse.
          </Box>
        </Box>
            </Box>
          </Box>

          <Box sx={{ width: '45%', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
              <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>Sub Total</Typography>
              <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>
                {(invoiceData.subTotal - (invoiceData.totalItemDiscounts || 0))?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
            
            {(invoiceData.discount > 0) && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: BRAND.orange }}>Demo ERP Discount</Typography>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: BRAND.orange }}>- {invoiceData.discount?.toLocaleString()}</Typography>
              </Box>
            )}

            {/* Fallback: Show Total Discount if subTotal is greater than payableAmount */}
            {((invoiceData.subTotal || 0) - (invoiceData.payableAmount || 0)) > 0 && 
             !(invoiceData.totalItemDiscounts > 0 || invoiceData.discount > 0) && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: BRAND.orange }}>Total Discount</Typography>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: BRAND.orange }}>
                  - {((invoiceData.subTotal || 0) - (invoiceData.payableAmount || 0)).toLocaleString()}
                </Typography>
              </Box>
            )}



            {(invoiceData.deliveryCharge > 0 && !sale?.isOperatingDelivery) && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>Delivery Charge</Typography>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>+ {invoiceData.deliveryCharge?.toLocaleString()}</Typography>
              </Box>
            )}

            {(invoiceData.installationCost > 0 && !sale?.isOperatingInstallation) && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>Installation Cost</Typography>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>+ {invoiceData.installationCost?.toLocaleString()}</Typography>
              </Box>
            )}

            {(invoiceData.additionalExpense > 0 && !sale?.isOperatingExpense) && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>Additional Expense</Typography>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>+ {invoiceData.additionalExpense?.toLocaleString()}</Typography>
              </Box>
            )}

            {invoiceData.cardCharge > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>Card Charge</Typography>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>+ {invoiceData.cardCharge?.toLocaleString()}</Typography>
              </Box>
            )}

            {hasEMI ? (
          <>
            {emiInterestRate > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>EMI Interest ({emiInterestRate}%)</Typography>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold' }}>{emiInterestAmount.toLocaleString()}</Typography>
              </Box>
            )}
            
            <Box sx={{ bgcolor: BRAND.orange, color: 'white', p: 0.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 0.6 }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 'bold' }}>Grand Total</Typography>
              <Typography sx={{ fontSize: '13px', fontWeight: 'bold' }}>{totalWithEMI.toLocaleString()}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
              <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: 'textSecondary' }}>Down Payment</Typography>
              <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: 'textSecondary' }}>{actualDownPayment.toLocaleString()}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
              <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: 'textSecondary' }}>Loan Amount</Typography>
              <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: 'textSecondary' }}>{loanAmount.toLocaleString()}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, px: 0.5, pt: 0.6, borderTop: `1px dashed ${BRAND.border}` }}>
              <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: BRAND.orange }}>Monthly Instalment ({emiDuration} Mos)</Typography>
              <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: BRAND.orange }}>
                {monthlyInstalment.toLocaleString()}
              </Typography>
            </Box>
          </>
        ) : (
              <>
                <Box sx={{ bgcolor: BRAND.orange, color: 'white', p: 0.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 0.6 }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 'bold' }}>Grand Total</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 'bold' }}>{invoiceData.payableAmount?.toLocaleString()}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
                  <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: 'textSecondary' }}>Paid Amount</Typography>
                  <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: 'textSecondary' }}>{invoiceData.paidAmount?.toLocaleString()}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, px: 0.5 }}>
                  <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: invoiceData.dueAmount > 0 ? '#DC2626' : 'textSecondary' }}>Due Amount</Typography>
                  <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: invoiceData.dueAmount > 0 ? '#DC2626' : 'textSecondary' }}>{invoiceData.dueAmount?.toLocaleString() || '0'}</Typography>
                </Box>
              </>
            )}

            <Box sx={{ mt: 1, pt: 0.8, borderTop: `1px solid ${BRAND.border}` }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 'bold', mb: 0.6 }}>Payment method</Typography>
              
              {!isFabricated && sale?.payments && sale.payments.length > 0 ? sale.payments.map((p, idx) => (
                <Box key={idx} sx={{ mb: 1, pb: 0.5, borderBottom: idx < sale.payments.length - 1 ? '1px dashed #E2E8F0' : 'none' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
                    <Typography sx={{ fontSize: '9px', color: 'textSecondary' }}>Method</Typography>
                    <Typography sx={{ fontSize: '9px', fontWeight: 'bold' }}>{p.method} (৳{p.amount?.toLocaleString()})</Typography>
                  </Box>
                  {p.method === 'Card' && p.posMachineName && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
                      <Typography sx={{ fontSize: '8.5px', color: 'textSecondary' }}>POS Terminal</Typography>
                      <Typography sx={{ fontSize: '8.5px', fontWeight: 'bold' }}>{p.posMachineName}</Typography>
                    </Box>
                  )}
                  {p.method === 'MFS' && p.mfsProviderName && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
                      <Typography sx={{ fontSize: '8.5px', color: 'textSecondary' }}>MFS Provider</Typography>
                      <Typography sx={{ fontSize: '8.5px', fontWeight: 'bold' }}>{p.mfsProviderName}</Typography>
                    </Box>
                  )}
                  {p.method === 'Bank' && p.bankName && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
                      <Typography sx={{ fontSize: '8.5px', color: 'textSecondary' }}>Bank Name</Typography>
                      <Typography sx={{ fontSize: '8.5px', fontWeight: 'bold' }}>{p.bankName}</Typography>
                    </Box>
                  )}
                  {p.transactionId && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
                      <Typography sx={{ fontSize: '8.5px', color: 'textSecondary' }}>Transaction ID</Typography>
                      <Typography sx={{ fontSize: '8.5px', fontWeight: 'bold' }}>{p.transactionId}</Typography>
                    </Box>
                  )}
                  {p.feeAmount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
                      <Typography sx={{ fontSize: '8.5px', color: 'textSecondary' }}>Trans. Fee</Typography>
                      <Typography sx={{ fontSize: '8.5px', fontWeight: 'bold' }}>৳{p.feeAmount?.toFixed(2)} ({p.method === 'Card' ? `${p.feePercentage}%` : `৳${p.feePercentage}/1k`})</Typography>
                    </Box>
                  )}
                </Box>
              )) : (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
                    <Typography sx={{ fontSize: '9px', color: 'textSecondary' }}>Method</Typography>
                    <Typography sx={{ fontSize: '9px', fontWeight: 'bold' }}>{isFabricated ? 'Cash' : (sale?.paymentMethod && sale.paymentMethod !== 'Split' ? sale.paymentMethod : 'Cash')}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3, px: 0.5 }}>
                    <Typography sx={{ fontSize: '9px', color: 'textSecondary' }}>Payment Status</Typography>
                    <Typography sx={{ fontSize: '9px', fontWeight: 'bold' }}>{isFabricated ? 'PAID' : (invoiceData.dueAmount > 0 ? 'PARTIAL' : 'PAID')}</Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Warranty Information Table */}
        {hasWarranty && (
          <Box sx={{ mb: 1, position: 'relative', zIndex: 1, breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <Typography sx={{ display: 'block', mb: 0.4, fontWeight: 700, color: 'black', textTransform: 'uppercase', letterSpacing: '0.6px', fontSize: '9px' }}>
              Warranty Information
            </Typography>
            <Box sx={{ border: '1px solid #E2E8F0', borderRadius: '5px', overflow: 'hidden' }}>
              <Table size="small" sx={{ '& .MuiTableCell-root': { py: 0.3, px: 1, borderBottom: '1px solid #E2E8F0' } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell sx={{ color: '#64748B', fontWeight: 'bold', fontSize: '8.5px', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0' }}>PRODUCT</TableCell>
                    <TableCell sx={{ color: '#64748B', fontWeight: 'bold', fontSize: '8.5px', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0' }}>WARRANTY TYPE</TableCell>
                    <TableCell sx={{ color: '#64748B', fontWeight: 'bold', fontSize: '8.5px', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0' }}>DURATION</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoiceData.items?.filter(item => item.warranty && item.warranty !== 'N/A' && item.warranty.toLowerCase() !== 'no warranty' && item.warranty.trim() !== '').map((item, idx) => {
                    let wType = item.warranty;
                    let wDuration = 'As per policy';
                    
                    const match = item.warranty.match(/^(.*?)\s*\((.*?)\)$/i);
                    if (match) {
                      wType = match[1].trim();
                      wDuration = match[2].trim();
                    } else if (/^\d+\s*Months?$/i.test(item.warranty)) {
                      wType = 'Standard Warranty';
                      wDuration = item.warranty;
                    }

                    return (
                      <TableRow key={idx} sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell sx={{ fontSize: '9.5px', color: '#1E293B', fontWeight: 600 }}>{item.productName}</TableCell>
                        <TableCell sx={{ fontSize: '9px', color: '#475569' }}>{wType}</TableCell>
                        <TableCell sx={{ fontSize: '9px', color: '#475569', fontWeight: 'bold' }}>{wDuration}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}

      </Box>

      {/* Footer Wrapper (Signatures + Bottom Footer) */}
      <Box sx={{ width: '100%', mt: 'auto', breakInside: 'avoid', pageBreakInside: 'avoid', '@media print': { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10, bgcolor: 'white', px: 3, pb: 0 } }}>
        {/* Signatures */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, px: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold">Thanks for doing business with us!</Typography>
          <Box sx={{ display: 'flex', gap: 6 }}>
            <Box sx={{ borderTop: '1px solid #000', width: '150px', textAlign: 'center', pt: 0.5 }}>
              <Typography variant="caption" fontWeight="bold">Received By</Typography>
            </Box>
            <Box sx={{ borderTop: '1px solid #000', width: '150px', textAlign: 'center', pt: 0.5 }}>
              <Typography variant="caption" fontWeight="bold">Authorized Seal & Sign</Typography>
            </Box>
          </Box>
        </Box>

        {/* Bottom Footer Bar */}
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
               {address}
             </Typography>
            </Box>
          </Box>
          
          <Box sx={{ position: 'absolute', bottom: 15, left: '20px', display: 'flex', alignItems: 'center', gap: 4, height: '20px', zIndex: 2 }}>
             <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.7, color: 'white', fontWeight: 'bold' }}>
               <Box sx={{ bgcolor: 'black', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <PhoneIcon size={11} />
               </Box>
               {phone}
             </Typography>
             <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.7, color: 'white', fontWeight: 'bold' }}>
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

export default CustomerSalesInvoice;
