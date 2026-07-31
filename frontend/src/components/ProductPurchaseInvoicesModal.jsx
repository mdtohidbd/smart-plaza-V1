import React, { useState } from 'react';
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
  Visibility as EyeIcon,
  ArrowBack as BackIcon,
  Close as CloseIcon,
  Business as SupplierIcon,
  CalendarToday as DateIcon,
  AttachMoney as MoneyIcon,
  ShoppingBag as ProductIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import api from '../utils/api';

const ProductPurchaseInvoicesModal = ({ open, onClose, productId, productName }) => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'details'
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // Fetch purchase invoices for this product
  const { data: purchasesResponse, isLoading, error } = useQuery(
    ['product-purchase-invoices', productId],
    async () => {
      if (!productId) return null;
      const response = await api.get(`/api/reports/purchase-product-wise/${productId}/invoices`);
      return response.data.data || [];
    },
    {
      enabled: !!productId && open,
      staleTime: 5000,
    }
  );

  const handleOpenDetails = (purchase) => {
    setSelectedPurchase(purchase);
    setViewMode('details');
  };

  const handleBackToList = () => {
    setSelectedPurchase(null);
    setViewMode('list');
  };

  const handleCloseModal = () => {
    setViewMode('list');
    setSelectedPurchase(null);
    onClose();
  };

  const formatDate = (dateStr) => {
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

  return (
    <Dialog
      open={open}
      onClose={handleCloseModal}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          fontFamily: '"Outfit", sans-serif',
          minHeight: '400px',
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
          {viewMode === 'details' && (
            <IconButton onClick={handleBackToList} size="small" sx={{ mr: 1, border: '1px solid #CBD5E1' }}>
              <BackIcon fontSize="small" />
            </IconButton>
          )}
          <Box>
            <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600, fontSize: '1.1rem', fontFamily: '"Outfit", sans-serif' }}>
              {viewMode === 'list' 
                ? `Purchase History - ${productName || 'Product'}`
                : `Invoice Details - ${selectedPurchase?.purchaseNumber}`
              }
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontFamily: '"Outfit", sans-serif' }}>
              {viewMode === 'list'
                ? 'List of all purchase transactions containing this product'
                : `Purchased on ${selectedPurchase ? formatDate(selectedPurchase.date) : ''}`
              }
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleCloseModal} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2, borderRadius: '8px' }}>
            Failed to load purchase invoices: {error.message}
          </Alert>
        ) : viewMode === 'list' ? (
          /* List Mode */
          purchasesResponse?.length === 0 ? (
            <Box sx={{ py: 6, textAlignment: 'center' }}>
              <Alert severity="info" sx={{ borderRadius: '8px' }}>
                No purchase transactions found for this product.
              </Alert>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', py: 1.5 }}>Invoice No</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', py: 1.5 }}>Supplier</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', py: 1.5 }}>Date</TableCell>
                    <TableCell align="right" className="text-right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', py: 1.5 }}>Qty</TableCell>
                    <TableCell align="right" className="text-right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', py: 1.5 }}>Unit Rate</TableCell>
                    <TableCell align="right" className="text-right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', py: 1.5 }}>Subtotal</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', py: 1.5 }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', py: 1.5 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchasesResponse?.map((purchase) => {
                    // Find product details in this purchase items list
                    const purchaseItem = purchase.items?.find(item => 
                      item.product?._id === productId || item.product === productId
                    );
                    const qty = purchaseItem?.quantity || 0;
                    const rate = purchaseItem?.unitPrice || 0;
                    const subtotal = qty * rate;
                    const statusStyle = getStatusColor(purchase.status);

                    return (
                      <TableRow key={purchase._id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                        <TableCell sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.82rem' }}>
                          {purchase.purchaseNumber}
                        </TableCell>
                        <TableCell sx={{ color: '#475569', fontSize: '0.82rem' }}>
                          {purchase.company?.businessName || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ color: '#475569', fontSize: '0.82rem' }}>
                          {formatDate(purchase.date)}
                        </TableCell>
                        <TableCell align="right" className="text-right" sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.82rem' }}>
                          {qty}
                        </TableCell>
                        <TableCell align="right" className="text-right" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                          ৳{rate.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" className="text-right" sx={{ color: '#42A2C2', fontWeight: 600, fontSize: '0.82rem' }}>
                          ৳{subtotal.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={purchase.status}
                            size="small"
                            sx={{
                              bgcolor: statusStyle.bg,
                              color: statusStyle.text,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: '20px'
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDetails(purchase)}
                            sx={{
                              color: '#42A2C2',
                              bgcolor: '#F0FDFA',
                              '&:hover': { bgcolor: '#CCFBF1' }
                            }}
                          >
                            <EyeIcon fontSize="inherit" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )
        ) : (
          /* Details Mode - Premium Invoice View */
          <Box>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: '8px', border: '1px dashed #CBD5E1', mb: 2, bgcolor: '#FCFDFE' }}>
              <Grid container spacing={2}>
                {/* Invoice Metadata */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                    Purchase From
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#1E293B', fontWeight: 700, mt: 0.5 }}>
                    {selectedPurchase.company?.businessName || 'Supplier'}
                  </Typography>
                  {selectedPurchase.company?.contactNumber && (
                    <Typography variant="body2" sx={{ color: '#475569', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                      Phone: {selectedPurchase.company.contactNumber}
                    </Typography>
                  )}
                  {selectedPurchase.company?.email && (
                    <Typography variant="body2" sx={{ color: '#475569', mt: 0.25 }}>
                      Email: {selectedPurchase.company.email}
                    </Typography>
                  )}
                  {selectedPurchase.company?.address && (
                    <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '0.8rem' }}>
                      Address: {selectedPurchase.company.address}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={6} sx={{ textAlign: { sm: 'right' } }}>
                  <Typography variant="caption" sx={{ color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                    Invoice Info
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#42A2C2', fontWeight: 800, mt: 0.5 }}>
                    {selectedPurchase.purchaseNumber}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>
                    Date: <strong>{formatDate(selectedPurchase.date)}</strong>
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                    <Chip
                      label={selectedPurchase.status}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(selectedPurchase.status).bg,
                        color: getStatusColor(selectedPurchase.status).text,
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2.5 }} />

              {/* Items List in purchase */}
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#475569', fontWeight: 600 }}>
                Purchased Items Ledger
              </Typography>
              <TableContainer sx={{ border: '1px solid #E2E8F0', borderRadius: '6px', mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', py: 1 }}>Item Description</TableCell>
                      <TableCell align="right" className="text-right" sx={{ fontWeight: 600, fontSize: '0.78rem', py: 1 }}>Quantity</TableCell>
                      <TableCell align="right" className="text-right" sx={{ fontWeight: 600, fontSize: '0.78rem', py: 1 }}>Unit Price</TableCell>
                      <TableCell align="right" className="text-right" sx={{ fontWeight: 600, fontSize: '0.78rem', py: 1 }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedPurchase.items?.map((item, idx) => {
                      const isTarget = item.product?._id === productId || item.product === productId;
                      return (
                        <TableRow 
                          key={item._id || idx} 
                          sx={{ 
                            bgcolor: isTarget ? '#F0F9FF' : 'transparent',
                            borderLeft: isTarget ? '3px solid #0EA5E9' : 'none'
                          }}
                        >
                          <TableCell sx={{ py: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: isTarget ? 600 : 500, color: '#1E293B' }}>
                              {item.product?.name || productName || 'N/A'}
                            </Typography>
                            {isTarget && (
                              <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 500 }}>
                                (Target Product)
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right" className="text-right" sx={{ py: 1, fontWeight: isTarget ? 600 : 400 }}>{item.quantity}</TableCell>
                          <TableCell align="right" className="text-right" sx={{ py: 1 }}>৳{item.unitPrice?.toLocaleString()}</TableCell>
                          <TableCell align="right" className="text-right" sx={{ py: 1, fontWeight: 600 }}>৳{(item.quantity * item.unitPrice)?.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totals Grid */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={7}>
                  {selectedPurchase.note && (
                    <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Note / Remarks
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569', fontStyle: 'italic' }}>
                        {selectedPurchase.note}
                      </Typography>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} md={5}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box className="print-flex-row" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Subtotal:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>৳{selectedPurchase.subTotal?.toLocaleString()}</Typography>
                    </Box>
                    {selectedPurchase.discount > 0 && (
                      <Box className="print-flex-row" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Discount:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#D32F2F' }}>-৳{selectedPurchase.discount?.toLocaleString()}</Typography>
                      </Box>
                    )}
                    {selectedPurchase.tax > 0 && (
                      <Box className="print-flex-row" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Tax:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>+৳{selectedPurchase.tax?.toLocaleString()}</Typography>
                      </Box>
                    )}
                    <Divider sx={{ my: 0.5 }} />
                    <Box className="print-flex-row" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>Total Bill:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#42A2C2' }}>৳{selectedPurchase.total?.toLocaleString()}</Typography>
                    </Box>
                    <Box className="print-flex-row" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#059669', fontWeight: 500 }}>Amount Paid:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>৳{selectedPurchase.paidAmount?.toLocaleString()}</Typography>
                    </Box>
                    <Box className="print-flex-row" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#DC2626', fontWeight: 500 }}>Balance Due:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#DC2626' }}>৳{selectedPurchase.dueAmount?.toLocaleString()}</Typography>
                    </Box>
                    
                    <Divider sx={{ my: 0.5 }} />
                    <Box className="print-flex-row" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>Payment Type:</Typography>
                      <Chip label={selectedPurchase.paymentMethod || 'Cash'} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
        {viewMode === 'details' ? (
          <Button variant="outlined" onClick={handleBackToList} startIcon={<BackIcon />} sx={{ textTransform: 'none', borderRadius: '6px' }}>
            Back to Invoices
          </Button>
        ) : null}
        <Button variant="contained" onClick={handleCloseModal} sx={{ textTransform: 'none', borderRadius: '6px', bgcolor: '#42A2C2', '&:hover': { bgcolor: '#378CA8' } }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductPurchaseInvoicesModal;
