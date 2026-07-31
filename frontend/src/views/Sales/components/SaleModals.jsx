import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Grid,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Alert,
  Button
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const SaleModals = ({
  showPreviewDialog,
  setShowPreviewDialog,
  previewSaleData,
  showConfirmDialog,
  handleCancelConfirm,
  handleConfirmCreateSale,
  pendingSaleData,
  customers,
  handleSubmit
}) => {
  return (
    <>
      {/* Invoice Preview Dialog */}
      <Dialog 
        open={showPreviewDialog} 
        onClose={() => setShowPreviewDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px', backgroundColor: '#FFFFFF', color: '#1E293B' }
        }}
      >
        <DialogTitle sx={{ 
          color: '#1E293B', 
          fontWeight: 700,
          borderBottom: '1px solid #E2E8F0',
          pb: 1.5
        }}>
          📄 Generate Invoice Preview
        </DialogTitle>
        <DialogContent>
          {previewSaleData && (
            <Box sx={{ p: 1 }}>
              <Paper elevation={0} sx={{ 
                p: 2.5, 
                my: 1.5,
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px'
              }}>
                <Typography variant="h5" sx={{ color: '#6366F1', fontWeight: 'bold', mb: 2 }}>
                  TAX INVOICE
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#94A3B8', display: 'block', textTransform: 'uppercase' }}>
                      Invoice #:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 600 }}>
                      {previewSaleData.invoiceNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#94A3B8', display: 'block', textTransform: 'uppercase' }}>
                      Date:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 600 }}>
                      {new Date(previewSaleData.date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1.5, borderColor: '#E2E8F0' }} />

                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#94A3B8', display: 'block', textTransform: 'uppercase', mb: 0.5 }}>
                  Bill To:
                </Typography>
                <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 600 }}>
                  {previewSaleData.customer?.contactName || 'Walk-in Customer'}
                </Typography>

                <Divider sx={{ my: 1.5, borderColor: '#E2E8F0' }} />

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'rgba(99, 102, 241, 0.08)' }}>
                        <TableCell sx={{ color: '#1E293B', fontWeight: 'bold', py: 1 }}>Item</TableCell>
                        <TableCell sx={{ color: '#1E293B', fontWeight: 'bold', py: 1 }} align="right">Qty</TableCell>
                        <TableCell sx={{ color: '#1E293B', fontWeight: 'bold', py: 1 }} align="right">Unit Price</TableCell>
                        <TableCell sx={{ color: '#1E293B', fontWeight: 'bold', py: 1 }} align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewSaleData.items.map((item, index) => (
                        <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#F5F7FA' } }}>
                          <TableCell sx={{ color: '#1E293B', py: 0.75 }}>{item.productName || item.product?.name}</TableCell>
                          <TableCell align="right" sx={{ color: '#1E293B', py: 0.75 }}>{item.quantity}</TableCell>
                          <TableCell align="right" sx={{ color: '#1E293B', py: 0.75 }}>৳{item.unitPrice?.toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1E293B', py: 0.75 }}>
                            ৳{(item.quantity * item.unitPrice)?.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ 
                  mt: 2.5, 
                  p: 1.5, 
                  backgroundColor: 'rgba(99, 102, 241, 0.04)', 
                  borderRadius: '6px',
                  border: '1px solid rgba(99, 102, 241, 0.1)'
                }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Sub Total:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                        ৳{previewSaleData.subTotal?.toFixed(2)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Discount:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" align="right" sx={{ fontWeight: 'bold', color: '#EF4444' }}>
                        -৳{previewSaleData.discount?.toFixed(2)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Divider sx={{ my: 0.75, borderColor: '#E2E8F0' }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>Total Amount:</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#6366F1' }}>
                          ৳{previewSaleData.total?.toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>

              <Alert severity="info" sx={{ mt: 1 }}>
                This is an invoice preview. Submit complete sale to finalize this transaction.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0', gap: 1 }}>
          <Button 
            onClick={() => setShowPreviewDialog(false)}
            sx={{ color: '#94A3B8' }}
          >
            Close
          </Button>
          <Button 
            onClick={() => {
              setShowPreviewDialog(false);
              handleSubmit();
            }}
            variant="contained"
            sx={{ 
              backgroundColor: '#6366F1',
              color: '#FFFFFF',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#4F46E5' }
            }}
          >
            ✅ Confirm & Complete Sale
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRMATION DIALOG */}
      <Dialog 
        open={showConfirmDialog} 
        onClose={handleCancelConfirm}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'rgba(99, 102, 241, 0.05)', 
          color: '#6366F1', 
          fontWeight: 700,
          borderBottom: '1px solid #E2E8F0',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon sx={{ fontSize: 24, color: '#F59E0B' }} />
            Confirm Sale Creation
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, mt: 1.5 }}>
          <Typography variant="body1" sx={{ mb: 2, color: '#1E293B', fontWeight: 600 }}>
            Are you sure you want to log this retail sale record?
          </Typography>
          
          <Paper 
            variant="outlined"
            sx={{ 
              p: 2, 
              backgroundColor: '#F8FAFC', 
              borderRadius: '8px',
              borderColor: '#E2E8F0'
            }}
          >
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Customer</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {customers?.find(c => c._id === pendingSaleData?.customer)?.contactName || pendingSaleData?.customer || 'Walk-in Customer'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Payment Method</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {pendingSaleData?.paymentMethod || 'Cash'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Total Items</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {pendingSaleData?.items?.length || 0} items
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Total Amount</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#6366F1' }}>
                  ৳{pendingSaleData?.total?.toFixed(2) || '0.00'}
                </Typography>
              </Grid>
              
              {pendingSaleData?.isEmi && pendingSaleData?.emiOption && (
                <Grid item xs={12}>
                  <Box sx={{ mt: 1, p: 1.5, border: '1px solid #14B8A6', borderRadius: 1, bgcolor: '#F0FDFA' }}>
                    <Typography variant="subtitle2" sx={{ color: '#0D9488', fontWeight: 'bold', mb: 1, borderBottom: '1px solid #99F6E4', pb: 0.5 }}>
                      EMI Plan Summary
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="#0F766E">Base Amount</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F766E' }}>
                          ৳{Number(pendingSaleData.total).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="#0F766E">EMI Charge ({pendingSaleData.emiOption.interestRate || 0}%)</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F766E' }}>
                          ৳{Number(pendingSaleData.total * (pendingSaleData.emiOption.interestRate || 0) / 100).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="#0F766E">Total Payable</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F766E' }}>
                          ৳{Number(pendingSaleData.total + (pendingSaleData.total * (pendingSaleData.emiOption.interestRate || 0) / 100)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="#0F766E">Down Payment</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F766E' }}>
                          ৳{Number(pendingSaleData.emiOption.downPayment || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="#0F766E">Remaining Balance</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F766E' }}>
                          ৳{Number((pendingSaleData.total + (pendingSaleData.total * (pendingSaleData.emiOption.interestRate || 0) / 100)) - (pendingSaleData.emiOption.downPayment || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="#0F766E">Duration</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F766E' }}>
                          {pendingSaleData.emiOption.duration || 12} Months
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="#0F766E">Monthly Instalment</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F766E' }}>
                          ৳{Number(((pendingSaleData.total + (pendingSaleData.total * (pendingSaleData.emiOption.interestRate || 0) / 100)) - (pendingSaleData.emiOption.downPayment || 0)) / (pendingSaleData.emiOption.duration || 12)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 2, 
          borderTop: '1px solid #E2E8F0',
          gap: 1,
          bgcolor: '#F8FAFC'
        }}>
          <Button 
            onClick={handleCancelConfirm}
            sx={{ color: '#94A3B8' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmCreateSale}
            variant="contained"
            startIcon={<CheckCircleIcon sx={{ fontSize: 18 }} />}
            sx={{ 
              backgroundColor: '#10B981',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
              '&:hover': {
                backgroundColor: '#059669',
                boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)'
              }
            }}
          >
            Yes, Create Sale
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SaleModals;
