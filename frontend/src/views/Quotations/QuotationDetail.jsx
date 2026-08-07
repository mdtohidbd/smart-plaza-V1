import React from 'react';
import { Typography, Box, Paper, Grid, Button, CircularProgress, Alert, Chip, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, GlobalStyles } from '@mui/material';
import { useQuery } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Print as PrintIcon, ArrowBack as ArrowBackIcon, CheckCircle as CheckCircleIcon, ArrowForward as ArrowForwardIcon, PictureAsPdf as PictureAsPdfIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { PhoneIcon, MailIcon, PinIcon } from '../../components/invoices/invoiceTheme';
import { downloadPdfFromElement } from '../../utils/pdfGenerator';


import { useSettings } from '../../context/SettingsContext';

const QuotationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [isDownloading, setIsDownloading] = React.useState(false);
  
  const logo = settings?.logo || '/logo-final.jpeg';
  const companyName = settings?.companyName || 'Demo Electronics ERP';
  const phone = settings?.phone || '01842-144844';
  const email = settings?.email || 'admin@yourskybridge.com';
  const address = settings?.companyAddress || '1, KDA Avenue, Khulna';
  const website = settings?.website || 'www.yourskybridge.com';

  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin';
  const canUpdateStatus = isAdmin || user?.permissions?.sales?.update;

  const { data: quotation, isLoading, error, refetch } = useQuery(
    ['quotation', id],
    async () => {
      const res = await api.get(`/api/quotations/${id}`);
      return res.data.data;
    }
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !quotation) {
    return <Alert severity="error">Error loading quotation details.</Alert>;
  }

  const handleStatusChange = async (status) => {
    if (!window.confirm(`Are you sure you want to mark this quotation as ${status}?`)) return;
    try {
      await api.put(`/api/quotations/${id}/status`, { status });
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      const fileName = `Quotation_${quotation?.quotationNumber || id}.pdf`;
      await downloadPdfFromElement('printable-quotation', fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const hasMultipleQty = quotation?.items?.some(item => item.quantity > 1) || false;
  const colSpanCount = hasMultipleQty ? 6 : 5;
  const totalSavings = (quotation?.items?.reduce((sum, item) => sum + (item.quantity * (item.discount || 0)), 0) || 0) + (quotation?.discount || 0);


  return (
    <Box sx={{ py: 2, maxWidth: 1000, mx: 'auto' }}>
      <GlobalStyles
        styles={{
          '@media print': {
            'html, body': {
              backgroundColor: 'white !important',
              WebkitPrintColorAdjust: 'exact !important',
              printColorAdjust: 'exact !important',
              overflow: 'visible !important',
              height: 'auto !important',
            },
            '.MuiDrawer-root, .MuiAppBar-root, .MuiToolbar-root, .no-print, .no-print *': {
              display: 'none !important',
            },
            'main': {
              width: '100% !important',
              minHeight: 'auto !important',
              padding: '0 !important',
              margin: '0 !important',
            },
            '#printable-quotation': {
              width: '100% !important',
              maxWidth: '100% !important',
              boxShadow: 'none !important',
              border: 'none !important',
              backgroundColor: 'white !important',
              padding: '15mm 20mm !important',
              margin: '0 !important',
            },
            '@page': {
              margin: 0,
            },
            '::-webkit-scrollbar': {
              display: 'none !important',
            }
          },
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }} className="no-print">
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard/quotations')}>
          Back to Quotations
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {canUpdateStatus && quotation.status === 'Pending' && (
            <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => handleStatusChange('Approved')}>
              Approve
            </Button>
          )}
          {['Pending', 'Approved'].includes(quotation.status) && (
            <Button variant="contained" color="info" startIcon={<ArrowForwardIcon />} onClick={() => navigate(`/dashboard/sales/retail?quoteId=${quotation._id}`)}>
              Convert to Invoice
            </Button>
          )}
          <Button 
            variant="contained" 
            startIcon={isDownloading ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfIcon />} 
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            sx={{ backgroundColor: '#E67E22', '&:hover': { backgroundColor: '#d36e19' } }}
          >
            {isDownloading ? 'Generating PDF...' : 'Download PDF'}
          </Button>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>
            Print
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: { xs: 2.5, md: 4 }, pb: 0, borderRadius: 0, color: '#000', fontFamily: 'Arial, sans-serif', minHeight: '295mm', display: 'flex', flexDirection: 'column' }} id="printable-quotation" elevation={0}>
        {/* Header Section */}
        <Box sx={{ position: 'relative', mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0, borderBottom: `2px solid #E2E8F0`, position: 'relative', height: '90px', mx: { xs: -2.5, md: -4 }, mt: { xs: -2.5, md: -4 }, px: { xs: 2.5, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, zIndex: 1, pl: 1 }}>
              <Box sx={{ width: 80, height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={logo} alt={companyName} style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight: '60px' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="900" sx={{ m: 0, lineHeight: 1.1, color: '#E67E22', letterSpacing: '-0.5px', fontSize: '1.5rem' }}>
                  {companyName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#4b5563', fontWeight: 'bold', fontSize: '11px', display: 'block', mt: 0.5 }}>
                  {email}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ position: 'absolute', top: 0, right: 0, width: '45%', height: '100%', zIndex: 0 }}>
              <svg width="100%" height="100%" viewBox="0 0 450 90" preserveAspectRatio="none" style={{ display: 'block', position: 'absolute', top: 0, right: 0, width: '100%', height: '100%' }}>
                {/* Right Dark Block */}
                <rect x="410" y="0" width="40" height="90" fill="#333333" />
                {/* Orange Diagonal Polygon Banner */}
                <polygon points="100,0 410,0 410,90 0,90" fill="#E67E22" />
              </svg>
              <Box sx={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 7 }}>
                <Typography variant="h3" fontWeight="bold" sx={{ color: 'white', letterSpacing: 1, fontSize: '1.7rem' }}>QUOTATION</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
          <Box>
            <Typography variant="body2"><strong>Date:</strong> {new Date(quotation.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}><strong>To</strong></Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{quotation.customer?.contactName}</Typography>
            {quotation.customer?.address && <Typography variant="body2">{quotation.customer?.address}</Typography>}
            {quotation.customer?.contactNumber && <Typography variant="body2">{quotation.customer?.contactNumber}</Typography>}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2"><strong>Quotation No:</strong> {quotation.quotationNumber}</Typography>
            <Typography variant="body2"><strong>Valid Until:</strong> {new Date(quotation.validUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</Typography>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2 }}>
          Subject: {quotation.subject || 'Price Quotation for Products.'}
        </Typography>

        {/* Pricing Table */}
        <TableContainer sx={{ mb: 2, borderRadius: 0 }}>
          <Table size="small" sx={{ 
            '& .MuiTableCell-root': { 
              border: '1px solid #e2e8f0', 
              color: '#000',
              py: 0.4,
              px: 1,
              fontSize: '11px',
              fontFamily: 'Arial, sans-serif'
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              fontWeight: 'bold',
              backgroundColor: '#E67E22',
              color: 'white',
              border: 'none',
              fontSize: '11.5px',
              textTransform: 'uppercase'
            }
          }}>
            <TableHead>
              <TableRow>
                <TableCell align="center">SL</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="right">MRP</TableCell>
                <TableCell align="right">Special Discount</TableCell>
                {hasMultipleQty ? (
                  <>
                    <TableCell align="right">Final Price</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Total Final Price</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Final Price</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {quotation.items?.map((item, index) => {
                const totalFinalPrice = (item.quantity * item.unitPrice) - (item.quantity * (item.discount || 0));
                const finalPricePerUnit = totalFinalPrice / item.quantity;
                return (
                  <TableRow key={index}>
                    <TableCell align="center">{index + 1}</TableCell>
                    <TableCell>
                      <strong>{item.product?.name}</strong>
                      <Box sx={{ mt: 0.2, fontSize: '0.7rem', color: '#555' }}>
                        Model: {item.product?.model || '-'}
                        {item.product?.colors?.length > 0
                          ? ` | Color: ${item.product.colors.map(c => c.name).join(', ')}`
                          : (item.product?.color ? ` | Color: ${item.product.color}` : '')}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{item.unitPrice?.toLocaleString()}</TableCell>
                    <TableCell align="right">{item.discount?.toLocaleString() || '0'}</TableCell>
                    {hasMultipleQty ? (
                      <>
                        <TableCell align="right">{finalPricePerUnit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">{totalFinalPrice.toLocaleString()}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">{totalFinalPrice.toLocaleString()}</TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
              {/* Add total rows if there are additional charges or global discount */}
              {quotation.discount > 0 && (
                <TableRow>
                  <TableCell colSpan={colSpanCount} align="right" sx={{ fontWeight: 'bold' }}>Overall Discount:</TableCell>
                  <TableCell align="right">- {quotation.discount.toLocaleString()}</TableCell>
                </TableRow>
              )}
              {quotation.deliveryCharge > 0 && (
                <TableRow>
                  <TableCell colSpan={colSpanCount} align="right" sx={{ fontWeight: 'bold' }}>Delivery Charge:</TableCell>
                  <TableCell align="right">{quotation.deliveryCharge.toLocaleString()}</TableCell>
                </TableRow>
              )}
              {quotation.installationCost > 0 && (
                <TableRow>
                  <TableCell colSpan={colSpanCount} align="right" sx={{ fontWeight: 'bold' }}>Installation Cost:</TableCell>
                  <TableCell align="right">{quotation.installationCost.toLocaleString()}</TableCell>
                </TableRow>
              )}
              {quotation.otherCharges?.map((charge, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={colSpanCount} align="right" sx={{ fontWeight: 'bold' }}>Others Charge ({charge.name}):</TableCell>
                  <TableCell align="right">{charge.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {quotation.cardCharge > 0 && (
                <TableRow>
                  <TableCell colSpan={colSpanCount} align="right" sx={{ fontWeight: 'bold' }}>Card Charge:</TableCell>
                  <TableCell align="right">{quotation.cardCharge.toLocaleString()}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell colSpan={colSpanCount} align="right" sx={{ fontWeight: 'bold', backgroundColor: '#E67E22', color: 'white' }}>Grand Total:</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#E67E22', color: 'white' }}>
                  {quotation.total?.toLocaleString()}
                  {totalSavings > 0 && (
                    <Typography variant="caption" display="block" sx={{ mt: 0.2, fontSize: '0.65rem' }}>
                      (You will save ৳{totalSavings.toLocaleString()})
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Terms and Information */}
        <Box sx={{ mb: 2, '& .MuiTypography-root': { mb: 0.2, fontSize: '11px', fontFamily: 'Arial, sans-serif' } }}>
          <Typography variant="body2"><strong>NB:</strong> Above price is {quotation.vatAitInfo || 'excluding VAT and AIT'}</Typography>
          
          <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>Payment method</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: '#334155' }}>{quotation.paymentMethod || 'Payment must be done before/after delivery of the product by cash/cheque in favor of\n(Demo ERP) Acc Number: 206914 3880001, BRAC Bank, Branch: Khulna\nRouting number: 060471545'}</Typography>

          <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>Related information</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: '#334155' }}>{quotation.relatedInformation || 'The package contains 1 indoor and 1 outdoor unit with 10 feet copper pipe, connection cable and remote.\nAdditional charge 590 Taka per feet will be applicable if extra copper pipe and connection cable required.'}</Typography>
        </Box>

        {/* Dynamic Note Section */}
        {quotation.note && (
          <Box sx={{ mb: 2, '& .MuiTypography-root': { fontSize: '11px', fontFamily: 'Arial, sans-serif' } }}>
             <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>Additional Notes:</Typography>
             <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: '#334155' }}>{quotation.note}</Typography>
          </Box>
        )}

        {/* Dynamic Warranty Section */}
        {quotation.items?.some(item => item.warranties && item.warranties.length > 0) && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 800, color: 'black', textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '10px' }}>
              Warranty Information
            </Typography>
            <Box sx={{ border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden', maxWidth: 600 }}>
              <Table size="small" sx={{ '& .MuiTableCell-root': { py: 0.35, px: 1, fontSize: '10.5px', borderBottom: '1px solid #E2E8F0' } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell sx={{ color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase' }}>Product</TableCell>
                    <TableCell sx={{ color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase' }}>Warranty Type</TableCell>
                    <TableCell sx={{ color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase' }}>Duration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quotation.items.map((item, idx) => {
                    if (!item.warranties || item.warranties.length === 0) return null;
                    return item.warranties.map((w, wIdx) => (
                      <TableRow key={`${idx}-${wIdx}`} sx={{ '&:last-child td': { border: 0 } }}>
                        {wIdx === 0 && (
                          <TableCell rowSpan={item.warranties.length} sx={{ verticalAlign: 'top', borderRight: '1px solid #E2E8F0', fontWeight: 600 }}>
                            {item.product?.name}
                          </TableCell>
                        )}
                        <TableCell sx={{ color: '#475569' }}>{w.warrantyName}</TableCell>
                        <TableCell sx={{ color: '#475569', fontWeight: 'bold' }}>{w.duration} Months</TableCell>
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}

        {/* Footer Wrapper (Signatures + Bottom Footer) */}
        <Box sx={{ width: '100%', mt: 'auto', breakInside: 'avoid', pageBreakInside: 'avoid', '@media print': { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10, bgcolor: 'white', px: 3, pb: 0 } }}>
          {/* Signatures */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2, px: 1, '& .MuiTypography-root': { fontFamily: 'Arial, sans-serif' } }}>
            <Box sx={{ textAlign: 'left', minWidth: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <Typography variant="body2" sx={{ color: '#E67E22', fontWeight: 'bold', mb: 0.5 }}>Thanks for doing business with us!</Typography>
              <Box sx={{ color: '#333' }}>
                <Typography variant="caption" display="block">Best regards,</Typography>
                {quotation.quoteGivenByName && (
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>{quotation.quoteGivenByName}</Typography>
                )}
                {quotation.quoteGivenByDesignation && (
                  <Typography variant="caption" display="block">{quotation.quoteGivenByDesignation}</Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ textAlign: 'center', minWidth: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <Box sx={{ borderBottom: '1px solid #000', mb: 0.5, mt: 4 }} />
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Received By</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', minWidth: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <Box sx={{ borderBottom: '1px solid #000', mb: 0.5, mt: 4 }} />
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Stamp & Signature from Authority</Typography>
            </Box>
          </Box>

          {/* Bottom Footer Bar */}
          <Box sx={{ 
            position: 'relative', 
            height: '55px', 
            mx: { xs: -2.5, md: -4 },
            width: 'calc(100% + 64px)',
            overflow: 'hidden'
          }}>
            <svg width="100%" height="55" viewBox="0 0 1000 55" preserveAspectRatio="none" style={{ display: 'block', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
              {/* Left Orange Section with angled cut */}
              <polygon points="0,0 540,0 490,55 0,55" fill="#E67E22" />
              {/* Right Dark Black Section with angled cut */}
              <polygon points="490,0 1000,0 1000,55 440,55" fill="#000000" />
            </svg>
            
            {/* Phone & Website (Left side over orange polygon) */}
            <Box sx={{ position: 'absolute', top: 0, left: '24px', height: '100%', display: 'flex', alignItems: 'center', gap: 3, zIndex: 2 }}>
               <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'white', fontWeight: 'bold', fontSize: '11px' }}>
                 <Box sx={{ bgcolor: 'black', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <PhoneIcon size={12} />
                 </Box>
                 {phone}
               </Typography>
               <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'white', fontWeight: 'bold', fontSize: '11px' }}>
                 <Box sx={{ bgcolor: 'black', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <MailIcon size={12} />
                 </Box>
                 {website}
               </Typography>
            </Box>
            
            {/* Location Address (Right side over black polygon) */}
            <Box sx={{ position: 'absolute', top: 0, right: '28px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 2 }}>
               <Typography variant="caption" sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1, fontSize: '11px', fontWeight: 'bold' }}>
                 <Box sx={{ bgcolor: '#E67E22', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <PinIcon size={12} />
                 </Box>
                 {address}
               </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default QuotationDetail;
