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
import { Search as SearchIcon, PictureAsPdf as PdfIcon, Download as ExcelIcon, Refresh as RefreshIcon, Route as RouteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import useShopRefresh from '../../hooks/useShopRefresh';


const RouteWiseTopChart = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');
  const { activeShop } = useAuth();

  // Fetch route wise top chart data
  const {
    data: chartData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['routeWiseTopChart', activeShop?._id],
    async () => {
      const response = await api.get('/api/reports/route-wise-top-chart', {
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
    item.routeName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Exporting PDF...');
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    console.log('Exporting Excel...');
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
                    Top {chartData.length} Routes
                  </Typography>
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Rank</TableCell>
                          <TableCell>Route</TableCell>
                          <TableCell align="right">Total Orders</TableCell>
                          <TableCell align="right">Total Value</TableCell>
                          <TableCell align="right">Total Items</TableCell>
                          <TableCell align="right">Avg Order Value</TableCell>
                          <TableCell align="right">Customers</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {chartData.map((route, index) => (
                          <TableRow
                            key={route._id || index}
                            sx={{
                              backgroundColor: index % 2 === 0 ? 'transparent' : '#f3e5f5',
                              '&:hover': { backgroundColor: '#e1bee7' }
                            }}
                          >
                            <TableCell>
                              <Chip 
                                label={`#${route.rank}`} 
                                size="small"
                                color={route.rank <= 3 ? 'primary' : 'default'}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{route.routeName}</TableCell>
                            <TableCell align="right">{route.totalOrders?.toLocaleString() || 0}</TableCell>
                            <TableCell align="right" sx={{ color: '#9C27B0', fontWeight: 500 }}>
                              ৳{(route.totalValue || 0).toLocaleString()}
                            </TableCell>
                            <TableCell align="right">{route.totalItems?.toLocaleString() || 0}</TableCell>
                            <TableCell align="right">৳{(route.avgOrderValue || 0).toLocaleString()}</TableCell>
                            <TableCell align="right">{route.customerCount || 0}</TableCell>
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
                      <Typography variant="subtitle1" align="center" gutterBottom>Route Wise Top Chart Report</Typography>
                      <Typography variant="body2" align="center" sx={{ mb: 2 }}>Generated on: {new Date().toLocaleDateString()}</Typography>

                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Route</TableCell>
                              <TableCell>Manager</TableCell>
                              <TableCell align="right">Visits</TableCell>
                              <TableCell align="right">Sales</TableCell>
                              <TableCell align="right">Customers</TableCell>
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
                                <TableCell align="right">45</TableCell>
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
                      <Typography variant="body2" gutterBottom>Sheet: Route Wise Top Chart</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Route</TableCell>
                              <TableCell>Manager</TableCell>
                              <TableCell align="right">Visits</TableCell>
                              <TableCell align="right">Sales</TableCell>
                              <TableCell align="right">Customers</TableCell>
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
                                <TableCell align="right">45</TableCell>
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

export default RouteWiseTopChart;
