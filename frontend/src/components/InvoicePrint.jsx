import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import logo from '../assets/logo.jpeg';
import { downloadPdfFromElement } from '../utils/pdfGenerator';
import { useSettings } from '../context/SettingsContext';

const InvoicePrint = forwardRef(({ sale, companyInfo: customCompanyInfo }, ref) => {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [printReady, setPrintReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Dynamic company information fallback
  const companyInfo = customCompanyInfo || {
    companyName: settings?.companyName || 'Smart Plaza BD',
    companyAddress: settings?.companyAddress || '1 KDA Avenue, Shibbari, Khulna, Bangladesh, 9100',
    phone: settings?.phone || '01842-144844',
    email: settings?.email || 'smartplazabd@gmail.com',
    logo: settings?.logo || logo
  };

  useImperativeHandle(ref, () => ({
    openPrintDialog: () => {
      setOpen(true);
    }
  }));

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setPrintReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setPrintReady(false);
    }
  }, [open]);

  const handlePrint = () => {
    const style = document.createElement('style');
    style.id = 'print-invoice-styles';
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden !important;
        }
        #printable-sale-invoice, #printable-sale-invoice * {
          visibility: visible !important;
        }
        #printable-sale-invoice {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          font-family: 'Arial', sans-serif !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin-top: 15px !important;
          margin-bottom: 20px !important;
        }
        th, td {
          border: 1px solid #000000 !important;
          padding: 8px 10px !important;
          text-align: left !important;
          font-size: 12px !important;
          color: #000000 !important;
        }
        th {
          background-color: #f5f5f5 !important;
          font-weight: bold !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .text-right, th.text-right, td.text-right {
          text-align: right !important;
        }
        .text-center, th.text-center, td.text-center {
          text-align: center !important;
        }
        .no-print {
          display: none !important;
        }
        .MuiGrid-container {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: wrap !important;
          width: 100% !important;
        }
        .MuiGrid-item {
          box-sizing: border-box !important;
        }
        .MuiGrid-grid-md-7 {
          width: 58.33% !important;
          max-width: 58.33% !important;
          flex-basis: 58.33% !important;
        }
        .MuiGrid-grid-md-5 {
          width: 41.67% !important;
          max-width: 41.67% !important;
          flex-basis: 41.67% !important;
        }
        .MuiGrid-grid-md-8 {
          width: 66.67% !important;
          max-width: 66.67% !important;
          flex-basis: 66.67% !important;
        }
        .MuiGrid-grid-md-4 {
          width: 33.33% !important;
          max-width: 33.33% !important;
          flex-basis: 33.33% !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => {
      const el = document.getElementById('print-invoice-styles');
      if (el) el.remove();
    }, 500);
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      const fileName = `Invoice_${sale?.invoiceNumber || sale?._id || 'Sale'}.pdf`;
      await downloadPdfFromElement('printable-sale-invoice', fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!sale) {
    return null;
  }

  const handleClose = () => {
    setOpen(false);
  };

  // Calculate totals
  const subtotal = sale.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) || 0;
  const total = sale.total || subtotal - (sale.discount || 0) + (sale.tax || 0);

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose} 
        fullScreen
        PaperProps={{
          style: {
            margin: 0,
            width: '100vw',
            height: '100vh',
            maxWidth: 'none',
          }
        }}
      >
        <DialogActions className="no-print" sx={{ p: 1, backgroundColor: '#f5f5f5', gap: 1 }}>
          <Button 
            onClick={handleDownloadPdf} 
            variant="contained" 
            disabled={isDownloading}
            startIcon={isDownloading ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfIcon />}
            sx={{ 
              backgroundColor: '#E67E22',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#d36e19'
              }
            }}
          >
            {isDownloading ? 'Generating PDF...' : 'Download PDF'}
          </Button>
          <Button 
            onClick={handlePrint} 
            variant="contained" 
            startIcon={<PrintIcon />}
            sx={{ 
              backgroundColor: '#000000',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#333333'
              }
            }}
          >
            Print Invoice
          </Button>
          <IconButton onClick={handleClose} sx={{ ml: 1 }}>
            <CloseIcon />
          </IconButton>
        </DialogActions>
        
        <DialogContent sx={{ p: 0, height: 'calc(100vh - 64px)' }}>
          <Box 
            id="printable-sale-invoice"
            sx={{ 
              width: '100%',
              height: '100%',
              p: 4,
              backgroundColor: 'white',
              overflow: 'auto',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {/* Header - Professional Black & White */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={7}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                  <img 
                    src={companyInfo.logo || logo} 
                    alt="Company Logo" 
                    style={{ 
                      maxHeight: '100px', 
                      maxWidth: '200px',
                      objectFit: 'contain'
                    }}
                  />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#000000' }}>
                      {companyInfo.companyName}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.5, lineHeight: 1.4, color: '#000000' }}>
                      {companyInfo.companyAddress}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.5, color: '#000000' }}>
                      Phone: {companyInfo.phone}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#000000' }}>
                      Email: {companyInfo.email}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={5}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2, color: '#000000' }}>
                    INVOICE
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ border: 'none', py: 0.5, px: 1, fontWeight: 'bold', fontSize: '0.85rem' }}>Invoice #:</TableCell>
                        <TableCell align="right" className="text-right" sx={{ border: 'none', py: 0.5, px: 1, textAlign: 'right', fontSize: '0.85rem' }}>
                          {sale.invoiceNumber || 'N/A'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ border: 'none', py: 0.5, px: 1, fontWeight: 'bold', fontSize: '0.85rem' }}>Date:</TableCell>
                        <TableCell align="right" className="text-right" sx={{ border: 'none', py: 0.5, px: 1, textAlign: 'right', fontSize: '0.85rem' }}>
                          {sale.date ? new Date(sale.date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ border: 'none', py: 0.5, px: 1, fontWeight: 'bold', fontSize: '0.85rem' }}>Status:</TableCell>
                        <TableCell align="right" className="text-right" sx={{ border: 'none', py: 0.5, px: 1, textAlign: 'right', fontSize: '0.85rem' }}>
                          {sale.status || 'N/A'}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              </Grid>
            </Grid>

            {/* Separator Line */}
            <Box sx={{ borderBottom: '1px solid #000000', mb: 3 }} />

            {/* Bill To Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, fontSize: '0.95rem' }}>Bill To:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.9rem', mb: 0.5 }}>
                {sale.customer?.contactName || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.5 }}>
                {sale.customer?.contactNumber || ''}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                {sale.customer?.address || sale.shippingAddress || ''}
              </Typography>
            </Box>

            {/* Items Table - Clean Black & White */}
            <TableContainer sx={{ mb: 3, border: '1px solid #000000' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.85rem', borderBottom: '1px solid #000000', py: 1 }}>Product</TableCell>
                    <TableCell align="center" className="text-center" sx={{ fontWeight: 'bold', fontSize: '0.85rem', borderBottom: '1px solid #000000', py: 1, textAlign: 'center' }}>Qty</TableCell>
                    <TableCell align="right" className="text-right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', borderBottom: '1px solid #000000', py: 1, textAlign: 'right' }}>Price</TableCell>
                    <TableCell align="right" className="text-right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', borderBottom: '1px solid #000000', py: 1, textAlign: 'right' }}>Disc</TableCell>
                    <TableCell align="right" className="text-right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', borderBottom: '1px solid #000000', py: 1, textAlign: 'right' }}>Tax</TableCell>
                    <TableCell align="right" className="text-right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', borderBottom: '1px solid #000000', py: 1, textAlign: 'right' }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sale.items?.map((item, index) => {
                    const itemTotal = (item.quantity * item.unitPrice) - (item.discount || 0) + (item.tax || 0);
                    return (
                      <TableRow key={index}>
                        <TableCell sx={{ fontSize: '0.85rem', py: 1, borderBottom: '0.5px solid #cccccc' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                              {item.product?.name || item.productName || 'N/A'}
                            </Typography>
                            {item.warrantyName && (
                              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#555', display: 'block', mt: 0.5 }}>
                                Warranty: {item.warrantyName} {item.warrantyDurationMonths ? `(${item.warrantyDurationMonths} months)` : ''}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center" className="text-center" sx={{ fontSize: '0.85rem', py: 1, borderBottom: '0.5px solid #cccccc', textAlign: 'center' }}>
                          {item.quantity}
                        </TableCell>
                        <TableCell align="right" className="text-right" sx={{ fontSize: '0.85rem', py: 1, borderBottom: '0.5px solid #cccccc', textAlign: 'right' }}>
                          {item.unitPrice.toFixed(2)}
                        </TableCell>
                        <TableCell align="right" className="text-right" sx={{ fontSize: '0.85rem', py: 1, borderBottom: '0.5px solid #cccccc', textAlign: 'right' }}>
                          {(item.discount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell align="right" className="text-right" sx={{ fontSize: '0.85rem', py: 1, borderBottom: '0.5px solid #cccccc', textAlign: 'right' }}>
                          {(item.tax || 0).toFixed(2)}
                        </TableCell>
                        <TableCell align="right" className="text-right" sx={{ fontSize: '0.85rem', py: 1, borderBottom: '0.5px solid #cccccc', textAlign: 'right', fontWeight: 'bold' }}>
                          {itemTotal.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Summary - Dual Totals (Customer & Govt) */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <TableContainer sx={{ width: '280px', border: '1px solid #000000' }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ border: 'none', borderBottom: '1px solid #000000', py: 1, px: 1 }}></TableCell>
                      <TableCell align="center" className="text-center" sx={{ border: 'none', borderBottom: '1px solid #000000', py: 1, px: 1, fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center' }}>CUSTOMER</TableCell>
                      <TableCell align="center" className="text-center" sx={{ border: 'none', borderBottom: '1px solid #000000', py: 1, px: 1, fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center' }}>GOVT</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ border: 'none', borderBottom: '0.5px solid #cccccc', py: 0.5, px: 1, fontSize: '0.85rem' }}>Subtotal:</TableCell>
                      <TableCell align="right" className="text-right" sx={{ border: 'none', borderBottom: '0.5px solid #cccccc', py: 0.5, px: 1, fontSize: '0.85rem', textAlign: 'right' }}>{subtotal.toFixed(2)}</TableCell>
                      <TableCell align="right" className="text-right" sx={{ border: 'none', borderBottom: '0.5px solid #cccccc', py: 0.5, px: 1, fontSize: '0.85rem', textAlign: 'right' }}>{subtotal.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ border: 'none', borderBottom: '0.5px solid #cccccc', py: 0.5, px: 1, fontSize: '0.85rem' }}>Discount:</TableCell>
                      <TableCell align="right" className="text-right" sx={{ border: 'none', borderBottom: '0.5px solid #cccccc', py: 0.5, px: 1, fontSize: '0.85rem', textAlign: 'right' }}>-{(sale.discount || 0).toFixed(2)}</TableCell>
                      <TableCell align="right" className="text-right" sx={{ border: 'none', borderBottom: '0.5px solid #cccccc', py: 0.5, px: 1, fontSize: '0.85rem', textAlign: 'right' }}>-{(sale.discount || 0).toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ border: 'none', borderBottom: '0.5px solid #cccccc', py: 0.5, px: 1, fontSize: '0.85rem' }}>Tax:</TableCell>
                      <TableCell align="right" className="text-right" sx={{ border: 'none', borderBottom: '0.5px solid #cccccc', py: 0.5, px: 1, fontSize: '0.85rem', textAlign: 'right' }}>+{(sale.tax || 0).toFixed(2)}</TableCell>
                      <TableCell align="right" className="text-right" sx={{ border: 'none', borderBottom: '0.5px solid #cccccc', py: 0.5, px: 1, fontSize: '0.85rem', textAlign: 'right' }}>+{(sale.tax || 0).toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ border: 'none', borderBottom: '1px solid #000000', py: 1, px: 1, fontSize: '0.9rem', fontWeight: 'bold' }}>Total:</TableCell>
                      <TableCell align="right" className="text-right" sx={{ border: 'none', borderBottom: '1px solid #000000', py: 1, px: 1, fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'right' }}>{total.toFixed(2)}</TableCell>
                      <TableCell align="right" className="text-right" sx={{ border: 'none', borderBottom: '1px solid #000000', py: 1, px: 1, fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'right' }}>{total.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ border: 'none', borderBottom: '0.5px solid #cccccc', py: 0.5, px: 1, fontSize: '0.85rem' }}>Paid:</TableCell>
                      <TableCell align="right" className="text-right" sx={{ border: 'none', borderBottom: '0.5px solid #cccccc', py: 0.5, px: 1, fontSize: '0.85rem', textAlign: 'right' }}>{(sale.paidAmount || 0).toFixed(2)}</TableCell>
                      <TableCell align="right" className="text-right" sx={{ border: 'none', borderBottom: '0.5px solid #cccccc', py: 0.5, px: 1, fontSize: '0.85rem', textAlign: 'right' }}>{(sale.paidAmount || 0).toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ border: 'none', py: 0.5, px: 1, fontSize: '0.85rem', fontWeight: 'bold' }}>Due:</TableCell>
                      <TableCell align="right" className="text-right" sx={{ border: 'none', py: 0.5, px: 1, fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'right' }}>{Math.max(0, total - (sale.paidAmount || 0)).toFixed(2)}</TableCell>
                      <TableCell align="right" className="text-right" sx={{ border: 'none', py: 0.5, px: 1, fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'right' }}>{Math.max(0, total - (sale.paidAmount || 0)).toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Footer with QR Code */}
            <Box sx={{ borderTop: '1px solid #000000', pt: 3, mt: 4 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, fontSize: '0.85rem' }}>Terms & Conditions:</Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', lineHeight: 1.5, display: 'block' }}>
                    1. Goods once sold are not returnable.
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', lineHeight: 1.5, display: 'block' }}>
                    2. This is a computer generated document.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#666' }}>
                      QR Code
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default InvoicePrint;
