import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  TextField,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert as MuiAlert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Search as SearchIcon, PictureAsPdf as PdfIcon, Download as ExcelIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const ConsolidatedInvoice = () => {
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');
  const [filters, setFilters] = useState({
    customerId: '',
    startDate: '',
    endDate: ''
  });

  const { activeShop } = useAuth();

  // Fetch consolidated invoice data
  const { data: invoiceData, isLoading, error, refetch } = useQuery(
    ['consolidatedInvoice', filters, activeShop?._id],
    async () => {
      const params = { ...filters, shopId: activeShop?._id };
      const response = await api.get('/api/reports/consolidated-invoice', { params });
      return response.data;
    },
    {
      enabled: false, // Don't auto-fetch, wait for user to click Generate
    }
  );

  const handleGenerateReport = () => {
    refetch();
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const handleCloseToast = () => {
    setToastOpen(false);
  };

  const handlePreviewClick = (tabIndex) => {
    setActiveTab(tabIndex);
    setPreviewOpen(true);
  };
  return (
    <Box sx={{ py: { xs: 1, sm: 2 }, 
      backgroundColor: '#F8FAFC',
      
    }}>
      
      {/* Slick Back Button */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Box
          onClick={() => navigate(-1)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            px: 1.5,
            py: 0.75,
            borderRadius: '8px',
            border: '1px solid rgba(0,0,0,0.08)',
            bgcolor: 'white',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            transition: 'all 0.18s ease',
            '&:hover': {
              boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
              transform: 'translateX(-2px)',
              borderColor: 'rgba(0,0,0,0.18)',
            },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 16, color: '#64748b' }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.82rem', fontFamily: '"Outfit", sans-serif' }}>
            Back
          </Typography>
        </Box>
      </Box>
      <Grid container spacing={1.5} >
        <Grid item xs={12}>
          <Card 
            sx={{ 
              p: 1.5,
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              borderRadius: 1,
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
              }
            }}
          >
            <CardContent>
              {/* Filters */}
              <Grid container spacing={2} sx={{ mt: 2, mb: 2 }}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Start Date"
                    name="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="End Date"
                    name="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Customer</InputLabel>
                    <Select
                      name="customerId"
                      value={filters.customerId}
                      label="Customer"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">All Customers</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    onClick={handleGenerateReport}
                    disabled={isLoading}
                    sx={{ height: '40px' }}
                  >
                    {isLoading ? <CircularProgress size={24} /> : 'Generate'}
                  </Button>
                </Grid>
              </Grid>
              
              {/* Results Display */}
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Error loading report: {error.message}
                </Alert>
              )}
              
              {invoiceData && !isLoading && (
                <TableContainer component={Paper} sx={{ mt: 2, mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Invoice Number</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell align="right">Total Amount</TableCell>
                        <TableCell>Paid</TableCell>
                        <TableCell align="right">Due</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoiceData.data?.map((invoice) => (
                        <TableRow key={invoice._id}>
                          <TableCell>{invoice.invoiceNumber || 'N/A'}</TableCell>
                          <TableCell>{invoice.customer?.name || 'N/A'}</TableCell>
                          <TableCell align="right">৳{invoice.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>{invoice.paidAmount?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell align="right">৳{invoice.dueAmount?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>
                            {invoice.status || (invoice.dueAmount > 0 ? 'Partial' : 'Paid')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              <Box sx={{ mt: 1.5, display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  color="primary"
                  startIcon={<PdfIcon />}
                  onClick={() => handlePreviewClick(0)}
                  disabled={!invoiceData}
                >
                  Preview PDF
                </Button>
                <Button 
                  variant="outlined" 
                  color="secondary"
                  startIcon={<ExcelIcon />}
                  onClick={() => handlePreviewClick(1)}
                  disabled={!invoiceData}
                >
                  Preview Excel
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Preview Dialog */}
        <Dialog 
          open={previewOpen} 
          onClose={() => setPreviewOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              minHeight: '60vh',
              maxHeight: '80vh',
            }
          }}
        >
          <DialogTitle sx={{ bgcolor: '#F8FAFC', color: '#1e293b', fontWeight: 600, fontSize: '1.2rem', p: 2, borderBottom: '1px solid #eaeef3' }}>
            Report Preview
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ mt: 1 }}
            >
              <Tab label="PDF Preview" />
              <Tab label="Excel Preview" />
            </Tabs>
          </DialogTitle>
          <DialogContent dividers>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                {activeTab === 0 ? (
                  <Box sx={{ p: 1.5, border: '1px solid #ccc', borderRadius: 1, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="h6" gutterBottom>PDF Preview Content</Typography>
                    <Paper elevation={2} sx={{ p: 1.5, mb: 2 }}>
                      <Typography variant="h5" align="center" gutterBottom>Smart Plaza BD</Typography>
                      <Typography variant="subtitle1" align="center" gutterBottom>Consolidated Invoice Report</Typography>
                      <Typography variant="body2" align="center" sx={{ mb: 2 }}>Generated on: {new Date().toLocaleDateString()}</Typography>
                      
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Invoice</TableCell>
                              <TableCell>Customer</TableCell>
                              <TableCell align="right">Total</TableCell>
                              <TableCell align="right">Paid</TableCell>
                              <TableCell align="right">Due</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {[1, 2, 3, 4, 5].map((row, index) => (
                              <TableRow key={row}>
                                <TableCell>INV-001</TableCell>
                                <TableCell>ABC Customer Ltd.</TableCell>
                                <TableCell align="right">৳2,50,000</TableCell>
                                <TableCell align="right">৳2,00,000</TableCell>
                                <TableCell align="right">৳50,000</TableCell>
                                <TableCell>Partial</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                    <Typography variant="caption" color="textSecondary">
                      This is a preview of how the PDF report will look. Actual report may vary slightly.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ p: 1.5, border: '1px solid #ccc', borderRadius: 1, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="h6" gutterBottom>Excel Preview Content</Typography>
                    <Paper elevation={2} sx={{ p: 2 }}>
                      <Typography variant="body2" gutterBottom>Sheet: Consolidated Invoice</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Invoice</TableCell>
                              <TableCell>Customer</TableCell>
                              <TableCell align="right">Total</TableCell>
                              <TableCell align="right">Paid</TableCell>
                              <TableCell align="right">Due</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {[1, 2, 3, 4, 5].map((row, index) => (
                              <TableRow key={row}>
                                <TableCell>INV-001</TableCell>
                                <TableCell>ABC Customer Ltd.</TableCell>
                                <TableCell align="right">250000</TableCell>
                                <TableCell align="right">200000</TableCell>
                                <TableCell align="right">50000</TableCell>
                                <TableCell>Partial</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      This is a preview of how the Excel report will look. Actual report may vary slightly.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #eaeef3', bgcolor: '#F8FAFC' }}>
            <Button onClick={() => setPreviewOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              color={activeTab === 0 ? "primary" : "secondary"}
              startIcon={activeTab === 0 ? <PdfIcon /> : <ExcelIcon />}
              onClick={() => {
                setLoading(true);
                // Simulate download process
                setTimeout(async () => {
                  try {
                    // Simulate download process
                    // In a real application, this would make an API call to generate and download the report
                    
                    // For demo purposes, we'll simulate a successful download
                    // In a real app, you'd have actual API calls here
                    
                    // Show success toast
                    showToast(`${activeTab === 0 ? 'PDF' : 'Excel'} report downloaded successfully!`, 'success');
                    
                    // Close loading and preview
                    setLoading(false);
                    setPreviewOpen(false);
                  } catch (error) {
                    // Show error toast if download fails
                    showToast(`Failed to download ${activeTab === 0 ? 'PDF' : 'Excel'} report: ${error.message || 'Unknown error'}`, 'error');
                    setLoading(false);
                  }
                }, 1500);
              }}
            >
              {loading ? 'Processing...' : `Download ${activeTab === 0 ? 'PDF' : 'Excel'}`}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Toast Notification */}
        <Snackbar 
          open={toastOpen} 
          autoHideDuration={6000} 
          onClose={handleCloseToast}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <MuiAlert
            onClose={handleCloseToast}
            severity={toastSeverity}
            elevation={6}
            variant="filled"
          >
            {toastMessage}
          </MuiAlert>
        </Snackbar>
      </Grid>
    </Box>
  );
};

export default ConsolidatedInvoice;