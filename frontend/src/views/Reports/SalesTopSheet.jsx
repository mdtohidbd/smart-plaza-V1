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
  Chip,
  Tooltip
} from '@mui/material';
import { Search as SearchIcon, PictureAsPdf as PdfIcon, Download as ExcelIcon, Refresh as RefreshIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import useShopRefresh from '../../hooks/useShopRefresh';


const SalesTopSheet = () => {
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');
  const [searchTerm, setSearchTerm] = useState('');
  const { activeShop } = useAuth();

  // Fetch sales top sheet data
  const {
    data: topSheetData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['salesTopSheet', activeShop?._id],
    async () => {
      const response = await api.get('/api/reports/sales-top-sheet', {
        params: {
          shopId: activeShop?._id,
          limit: 100
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
  const filteredData = topSheetData?.filter(item => 
    item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
              <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Refresh Data">
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => refetch()}
                      disabled={isLoading}
                      startIcon={<RefreshIcon />}
                    >
                      Refresh
                    </Button>
                  </Tooltip>
                </Box>
              
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search products or customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ ml: 2 }}>Loading sales data...</Typography>
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Error loading sales data: {error?.response?.data?.message || error?.message || 'Unknown error'}
                </Alert>
              ) : !topSheetData?.length ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No sales data available for the selected criteria.
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow 
                        sx={{
                          backgroundColor: '#3F51B5',
                          '& .MuiTableCell-head': {
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            borderBottom: '2px solid #e0e0e0',
                            whiteSpace: 'nowrap',
                            padding: '8px 12px'
                          }
                        }}
                      >
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 200 }}>Product Name</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 150 }}>Customer</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 120 }}>Total Quantity</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 120 }}>Total Value</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 120 }}>Avg. Rate</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 120 }}>Rank</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredData.map((item, index) => (
                        <TableRow 
                          key={item._id || index}
                          sx={{
                            backgroundColor: index % 2 === 0 ? 'transparent' : '#f9fbfd',
                            '&:hover': {
                              backgroundColor: '#e8eaf6',
                            },
                            '& .MuiTableCell-root': {
                              whiteSpace: 'nowrap',
                              padding: '8px 12px'
                            }
                          }}
                        >
                          <TableCell sx={{ color: '#333' }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {item.productName || 'N/A'}
                              </Typography>
                              {item.salesCount > 1 && (
                                <Chip size="small" label={`${item.salesCount} sales`} sx={{ mt: 0.5 }} />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: '#333' }}>
                            {item.customerName || 'N/A'}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#333' }}>
                            {item.totalQuantity?.toLocaleString() || 0}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#3F51B5', fontWeight: '500' }}>
                            ৳{item.totalValue?.toLocaleString() || 0}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#3F51B5', fontWeight: '500' }}>
                            ৳{item.avgRate?.toLocaleString() || 0}
                          </TableCell>
                          <TableCell sx={{ color: '#3F51B5', fontWeight: '500' }}>
                            <Chip 
                              label={`#${item.rank}`} 
                              size="small"
                              sx={{
                                backgroundColor: item.rank <= 3 ? '#3F51B5' : '#f0f0f0',
                                color: item.rank <= 3 ? 'white' : '#333',
                                fontWeight: 'bold'
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button 
                  variant="outlined" 
                  color="primary"
                  startIcon={<PdfIcon />}
                  onClick={() => handlePreviewClick(0)}
                  disabled={isLoading || !topSheetData?.length}
                >
                  Preview PDF
                </Button>
                <Button 
                  variant="outlined" 
                  color="secondary"
                  startIcon={<ExcelIcon />}
                  onClick={() => handlePreviewClick(1)}
                  disabled={isLoading || !topSheetData?.length}
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
                      <Typography variant="h5" align="center" gutterBottom>Demo Electronics ERP</Typography>
                      <Typography variant="subtitle1" align="center" gutterBottom>Sales Top Sheet Report</Typography>
                      <Typography variant="body2" align="center" sx={{ mb: 2 }}>Generated on: {new Date().toLocaleDateString()}</Typography>
                      
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Month</TableCell>
                              <TableCell>Product Category</TableCell>
                              <TableCell align="right">Sales</TableCell>
                              <TableCell align="right">Target</TableCell>
                              <TableCell align="right">Achievement</TableCell>
                              <TableCell align="right">Rank</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {[1, 2, 3, 4, 5].map((row, index) => (
                              <TableRow key={row}>
                                <TableCell>January 2024</TableCell>
                                <TableCell>Mobile Phones</TableCell>
                                <TableCell align="right">৳2,50,000</TableCell>
                                <TableCell align="right">৳2,00,000</TableCell>
                                <TableCell align="right">125%</TableCell>
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
                      <Typography variant="body2" gutterBottom>Sheet: Sales Top Sheet</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Month</TableCell>
                              <TableCell>Product Category</TableCell>
                              <TableCell align="right">Sales</TableCell>
                              <TableCell align="right">Target</TableCell>
                              <TableCell align="right">Achievement</TableCell>
                              <TableCell align="right">Rank</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {[1, 2, 3, 4, 5].map((row, index) => (
                              <TableRow key={row}>
                                <TableCell>January 2024</TableCell>
                                <TableCell>Mobile Phones</TableCell>
                                <TableCell align="right">250000</TableCell>
                                <TableCell align="right">200000</TableCell>
                                <TableCell align="right">125%</TableCell>
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

export default SalesTopSheet;
