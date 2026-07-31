import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
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
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import { Search as SearchIcon, PictureAsPdf as PdfIcon, Download as ExcelIcon, Refresh as RefreshIcon, LocalShipping as DeliveryIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import useShopRefresh from '../../hooks/useShopRefresh';


const DeliveryWiseTopChart = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');
  const { activeShop } = useAuth();

  // Fetch delivery wise top chart data
  const {
    data: chartData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['deliveryWiseTopChart', activeShop?._id],
    async () => {
      const response = await api.get('/api/reports/delivery-wise-top-chart', {
        params: {
          shopId: activeShop?._id,
          limit: 50
        }
      });
      return response.data.data;
    },
    {

      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Automatically refresh data when shop changes
  useShopRefresh(refetch);

  // Filter data based on search
  const filteredData = chartData?.filter(item =>
    item.deliveryPersonName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      // For delivery-wise chart, we'll create a simple PDF with the data
      showToast('PDF generation for delivery-wise top chart is being prepared...', 'info');
      setLoading(false);
      setPreviewOpen(false);
    } catch (error) {
      console.error('PDF download error:', error);
      showToast('Failed to download PDF report. Please try again.', 'error');
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      // Call the API to export Excel
      const response = await api.get('/api/reports/export/excel', {
        params: {
          reportType: 'delivery-wise',
          limit: 50
        },
        responseType: 'blob'
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `delivery-wise-top-chart-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      showToast('Excel report downloaded successfully!', 'success');
    } catch (error) {
      console.error('Excel download error:', error);
      showToast('Failed to download Excel report. Please try again.', 'error');
    } finally {
      setLoading(false);
      setPreviewOpen(false);
    }
  };

  const handleGenerateChart = () => {
    refetch();
  };

  const handlePreviewClick = (tabIndex) => {
    setActiveTab(tabIndex);
    setPreviewOpen(true);
  };

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const handleCloseToast = () => {
    setToastOpen(false);
  };
  return (
    <Box sx={{
      py: { xs: 1, sm: 2 },
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
              <Box sx={{ mt: 1.5, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleGenerateChart}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
                  Generate Chart
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={() => refetch()}
                  disabled={!chartData || isLoading}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<PdfIcon />}
                  onClick={() => handlePreviewClick(0)}
                  disabled={!chartData?.length}
                >
                  Preview PDF
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<ExcelIcon />}
                  onClick={() => handlePreviewClick(1)}
                  disabled={!chartData?.length}
                >
                  Preview Excel
                </Button>
              </Box>

              {/* Display Data */}
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Error loading data: {error.message}
                </Alert>
              )}

              {chartData && chartData.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Top {chartData.length} Delivery Routes
                  </Typography>
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{
                          backgroundColor: '#F8FAFC',
                          '& .MuiTableCell-head': {
                            color: '#1e293b',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            fontFamily: '"Outfit", sans-serif',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #eaeef3',
                            padding: '10px 16px',
                          }
                        }}>
                          <TableCell>Rank</TableCell>
                          <TableCell>Delivery Person</TableCell>
                          <TableCell align="right">Total Orders</TableCell>
                          <TableCell align="right">Total Value</TableCell>
                          <TableCell align="right">Total Items</TableCell>
                          <TableCell align="right">Avg Order Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {chartData.map((delivery, index) => (
                          <TableRow
                            key={delivery._id || index}
                            sx={{
                              backgroundColor: index % 2 === 0 ? 'transparent' : '#ffebee',
                              '&:hover': { backgroundColor: '#ffcdd2' }
                            }}
                          >
                            <TableCell>
                              <Chip 
                                label={`#${delivery.rank}`} 
                                size="small"
                                color={delivery.rank <= 3 ? 'primary' : 'default'}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{delivery.deliveryPersonName}</TableCell>
                            <TableCell align="right">{delivery.totalOrders?.toLocaleString() || 0}</TableCell>
                            <TableCell align="right" sx={{ color: '#F44336', fontWeight: 500 }}>
                              ৳{(delivery.totalValue || 0).toLocaleString()}
                            </TableCell>
                            <TableCell align="right">{delivery.totalItems?.toLocaleString() || 0}</TableCell>
                            <TableCell align="right">৳{(delivery.avgOrderValue || 0).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
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
                      <Typography variant="subtitle1" align="center" gutterBottom>Delivery Wise Top Chart Report</Typography>
                      <Typography variant="body2" align="center" sx={{ mb: 2 }}>Generated on: {new Date().toLocaleDateString()}</Typography>

                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Delivery Route</TableCell>
                              <TableCell>Driver</TableCell>
                              <TableCell align="right">Deliveries</TableCell>
                              <TableCell align="right">Sales</TableCell>
                              <TableCell align="right">Rating</TableCell>
                              <TableCell align="right">Rank</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {[1, 2, 3, 4, 5].map((row, index) => (
                              <TableRow key={row}>
                                <TableCell>Route A - Dhaka</TableCell>
                                <TableCell>John Doe</TableCell>
                                <TableCell align="right">150</TableCell>
                                <TableCell align="right">৳22,50,000</TableCell>
                                <TableCell align="right">4.8</TableCell>
                                <TableCell align="right">#1</TableCell>
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
                      <Typography variant="body2" gutterBottom>Sheet: Delivery Wise Top Chart</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Delivery Route</TableCell>
                              <TableCell>Driver</TableCell>
                              <TableCell align="right">Deliveries</TableCell>
                              <TableCell align="right">Sales</TableCell>
                              <TableCell align="right">Rating</TableCell>
                              <TableCell align="right">Rank</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {[1, 2, 3, 4, 5].map((row, index) => (
                              <TableRow key={row}>
                                <TableCell>Route A - Dhaka</TableCell>
                                <TableCell>John Doe</TableCell>
                                <TableCell align="right">150</TableCell>
                                <TableCell align="right">2250000</TableCell>
                                <TableCell align="right">4.8</TableCell>
                                <TableCell align="right">#1</TableCell>
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
                if (activeTab === 0) {
                  handleExportPDF();
                } else {
                  handleExportExcel();
                }
              }}
              disabled={loading}
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

export default DeliveryWiseTopChart;
