import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Paper,
  Divider,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as SupplierIcon,
  CalendarToday as DateIcon,
  AttachMoney as MoneyIcon,
  ReceiptOutlined as ReceiptIcon,
  LocalPhone as PhoneIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import api from '../utils/api';

const PurchaseInvoiceDetailsModal = ({ open, onClose, purchaseId }) => {
  // Fetch detailed purchase invoice data
  const { data: purchaseData, isLoading, error } = useQuery(
    ['purchase-invoice-details', purchaseId],
    async () => {
      if (!purchaseId) return null;
      const response = await api.get(`/api/purchases/${purchaseId}`);
      return response.data.data;
    },
    {
      enabled: !!purchaseId && open,
      staleTime: 5000,
    }
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return { bg: '#E8F5E9', text: '#2E7D32' };
      case 'Partial': return { bg: '#FFF3E0', text: '#ED6C02' };
      case 'Pending': return { bg: '#FFFDE7', text: '#FBC02D' };
      default: return { bg: '#FFEBEE', text: '#D32F2F' };
    }
  };

  const handlePrint = () => {
    // Create new print window style
    const style = document.createElement('style');
    style.id = 'print-invoice-styles';
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden !important;
        }
        #printable-purchase-invoice, #printable-purchase-invoice * {
          visibility: visible !important;
        }
        #printable-purchase-invoice {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          font-family: 'Outfit', sans-serif !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .print-border {
          border: 1px dashed #ccc !important;
          padding: 15px !important;
          background-color: #FCFDFE !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin-top: 15px !important;
          margin-bottom: 20px !important;
        }
        th, td {
          border: 1px solid #e2e8f0 !important;
          padding: 8px 10px !important;
          text-align: left !important;
          font-size: 12px !important;
        }
        th {
          background-color: #f8fafc !important;
          color: #475569 !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          letter-spacing: 0.5px !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .text-right, th.text-right, td.text-right {
          text-align: right !important;
        }
        .text-center {
          text-align: center !important;
        }
        /* Preserve Grid columns in print layout */
        .MuiGrid-container {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: wrap !important;
          width: 100% !important;
        }
        .MuiGrid-item {
          box-sizing: border-box !important;
        }
        .MuiGrid-grid-sm-6 {
          width: 50% !important;
          max-width: 50% !important;
          flex-basis: 50% !important;
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
        /* Ensure flex layout is preserved for totals */
        .print-flex-row {
          display: flex !important;
          flex-direction: row !important;
          justify-content: space-between !important;
          width: 100% !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    window.print();
    
    // Clean up
    setTimeout(() => {
      const el = document.getElementById('print-invoice-styles');
      if (el) el.remove();
    }, 500);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          fontFamily: '"Outfit", sans-serif',
          minHeight: '350px',
          maxHeight: '85vh'
        }
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          py: 2,
          px: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ReceiptIcon sx={{ color: '#DC3545' }} />
          <Box>
            <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, fontSize: '1.1rem', fontFamily: '"Outfit", sans-serif' }}>
              Purchase Invoice Ledger
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontFamily: '"Outfit", sans-serif' }}>
              Detailed purchase and transaction summary
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '250px' }}>
            <CircularProgress color="error" />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2, borderRadius: '8px' }}>
            Failed to load invoice details: {error.message || 'Unknown error'}
          </Alert>
        ) : !purchaseData ? (
          <Alert severity="info" sx={{ mt: 2, borderRadius: '8px' }}>
            No invoice records found.
          </Alert>
        ) : (
          <Box id="printable-purchase-invoice">
            {/* Invoice Sheet */}
            <Paper variant="outlined" className="print-border" sx={{ p: 3, borderRadius: '8px', border: '1px dashed #CBD5E1', mb: 1, bgcolor: '#FCFDFE' }}>
              <Grid container spacing={2}>
                {/* Supplier Info */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748B', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <SupplierIcon fontSize="inherit" /> Supplier / Vendor
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1E293B', fontWeight: 700, mt: 0.5 }}>
                    {purchaseData.supplier?.name || purchaseData.supplier?.contactName || 'N/A'}
                  </Typography>
                  {purchaseData.supplier?.contactNumber && (
                    <Typography variant="body2" sx={{ color: '#475569', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, fontSize: '0.85rem' }}>
                      <PhoneIcon fontSize="inherit" /> {purchaseData.supplier.contactNumber}
                    </Typography>
                  )}
                  {purchaseData.supplier?.email && (
                    <Typography variant="body2" sx={{ color: '#475569', mt: 0.25, fontSize: '0.85rem' }}>
                      Email: {purchaseData.supplier.email}
                    </Typography>
                  )}
                  {purchaseData.supplier?.address && (
                    <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.8rem' }}>
                      Address: {purchaseData.supplier.address}
                    </Typography>
                  )}
                </Grid>

                {/* Invoice Metadata */}
                <Grid item xs={12} sm={6} sx={{ textAlign: { sm: 'right' } }}>
                  <Typography variant="caption" sx={{ color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                    Purchase Bill
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#DC3545', fontWeight: 800, mt: 0.5 }}>
                    {purchaseData.purchaseNumber}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontSize: '0.85rem' }}>
                    Purchase Date: <strong>{formatDate(purchaseData.date)}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, fontSize: '0.85rem' }}>
                    Challan No: <strong>{purchaseData.challanNumber || 'N/A'}</strong>
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                    <Chip
                      label={purchaseData.status}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(purchaseData.status).bg,
                        color: getStatusColor(purchaseData.status).text,
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2.5 }} />

              {/* Items List */}
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#475569', fontWeight: 600 }}>
                Transaction Items Breakdown
              </Typography>
              <TableContainer sx={{ border: '1px solid #E2E8F0', borderRadius: '6px', mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', py: 1 }}>Product Name</TableCell>
                      <TableCell align="right" className="text-right" sx={{ fontWeight: 600, fontSize: '0.78rem', py: 1 }}>Quantity</TableCell>
                      <TableCell align="right" className="text-right" sx={{ fontWeight: 600, fontSize: '0.78rem', py: 1 }}>Unit Price</TableCell>
                      <TableCell align="right" className="text-right" sx={{ fontWeight: 600, fontSize: '0.78rem', py: 1 }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchaseData.items?.map((item, idx) => (
                      <TableRow key={item._id || idx} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                        <TableCell sx={{ py: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#1E293B' }}>
                            {item.product?.name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" className="text-right" sx={{ py: 1 }}>{item.quantity}</TableCell>
                        <TableCell align="right" className="text-right" sx={{ py: 1 }}>৳{item.unitPrice?.toLocaleString()}</TableCell>
                        <TableCell align="right" className="text-right" sx={{ py: 1, fontWeight: 600 }}>৳{(item.quantity * item.unitPrice)?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totals Summary */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={7}>
                  {purchaseData.note && (
                    <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Note / Remarks
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569', fontStyle: 'italic', fontSize: '0.85rem' }}>
                        {purchaseData.note}
                      </Typography>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} md={5}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box className="print-flex-row" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Subtotal:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>৳{purchaseData.subTotal?.toLocaleString()}</Typography>
                    </Box>
                    {purchaseData.discount > 0 && (
                      <Box className="print-flex-row" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Discount:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#D32F2F' }}>-৳{purchaseData.discount?.toLocaleString()}</Typography>
                      </Box>
                    )}
                    {purchaseData.tax > 0 && (
                      <Box className="print-flex-row" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Tax:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>+৳{purchaseData.tax?.toLocaleString()}</Typography>
                      </Box>
                    )}
                    <Divider sx={{ my: 0.5 }} />
                    <Box className="print-flex-row" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>Total Bill:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#DC3545' }}>৳{purchaseData.total?.toLocaleString()}</Typography>
                    </Box>
                    <Box className="print-flex-row" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#059669', fontWeight: 500 }}>Amount Paid:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>৳{purchaseData.paidAmount?.toLocaleString()}</Typography>
                    </Box>
                    <Box className="print-flex-row" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#DC2626', fontWeight: 600 }}>Balance Due:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#DC2626', fontSize: '1rem' }}>
                        ৳{purchaseData.dueAmount?.toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 0.5 }} />
                    <Box className="print-flex-row" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>Payment Method:</Typography>
                      <Chip label={purchaseData.paymentMethod || 'Cash'} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
        <Button variant="outlined" className="no-print" onClick={handlePrint} sx={{ textTransform: 'none', borderRadius: '6px' }}>
          Print Invoice
        </Button>
        <Button variant="contained" className="no-print" onClick={onClose} sx={{ textTransform: 'none', borderRadius: '6px', bgcolor: '#DC3545', '&:hover': { bgcolor: '#BD2130' } }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseInvoiceDetailsModal;
