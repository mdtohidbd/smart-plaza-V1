import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
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
  Alert as MuiAlert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, PictureAsPdf as PdfIcon, Download as ExcelIcon } from '@mui/icons-material';
import { useQuery } from 'react-query';
import api from '../../utils/api';

const PurchaseReports = () => {
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const { data: summaryData } = useQuery(
    'purchaseReportsSummary',
    async () => {
      const response = await api.get('/api/purchases/reports/summary');
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  const reportItems = [
    {
      title: 'All Purchase Reports',
      description: `View all purchase reports ${summaryData?.allPurchases !== undefined ? `(${summaryData.allPurchases})` : ''}`,
      path: '/dashboard/reports/purchase/all',
      color: '#1D5F99'
    },
    {
      title: 'Product Wise Purchase Report',
      description: `View purchase reports by product ${summaryData?.productWise !== undefined ? `(${summaryData.productWise})` : ''}`,
      path: '/dashboard/reports/purchase/product-wise',
      color: '#42A2C2'
    },

    {
      title: 'Supplier Ledger Reports',
      description: `View supplier ledger reports ${summaryData?.supplierLedger !== undefined ? `(${summaryData.supplierLedger})` : ''}`,
      path: '/dashboard/reports/purchase/supplier-ledger',
      color: '#28A745'
    },
    {
      title: 'Purchase Due Report',
      description: `View purchase due reports ${summaryData?.due !== undefined ? `(${summaryData.due})` : ''}`,
      path: '/dashboard/reports/purchase/due',
      color: '#DC3545'
    },
    {
      title: 'Purchase Return Report',
      description: `View purchase return reports ${summaryData?.returns !== undefined ? `(${summaryData.returns})` : ''}`,
      path: '/dashboard/reports/purchase/return',
      color: '#FD7E14'
    }
  ];


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
      
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: '#1e293b',
            fontFamily: '"Outfit", sans-serif',
            fontSize: { xs: '1.3rem', sm: '1.6rem' },
            letterSpacing: '-0.3px',
          }}
        >
          Purchase Reports
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontFamily: '"Outfit", sans-serif' }}>
          Overview of all purchase report categories
        </Typography>
      </Box>
      <Grid container spacing={1.5} >
        <Grid item xs={12}>
          <Grid container spacing={1.5}>
            {reportItems.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #eaeef3',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: item.color,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ color: item.color, fontWeight: 600, fontFamily: '"Outfit", sans-serif', fontSize: '1.1rem' }}>
                        {item.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {item.description}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                    <Button
                      size="small"
                      variant="contained"
                      sx={{
                        backgroundColor: item.color,
                        '&:hover': {
                          backgroundColor: `${item.color}CC`, // Darker shade on hover
                        },
                        textTransform: 'none',
                        fontWeight: 500
                      }}
                      onClick={() => navigate(item.path)}
                    >
                      View Report
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
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
                      <Typography variant="subtitle1" align="center" gutterBottom>Purchase Reports Overview</Typography>
                      <Typography variant="body2" align="center" sx={{ mb: 2 }}>Generated on: {new Date().toLocaleDateString()}</Typography>

                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Report Type</TableCell>
                              <TableCell align="right">Description</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {reportItems.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.title}</TableCell>
                                <TableCell align="right">{item.description}</TableCell>
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
                      <Typography variant="body2" gutterBottom>Sheet: Purchase Reports</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Report Type</TableCell>
                              <TableCell align="right">Description</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {reportItems.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.title}</TableCell>
                                <TableCell align="right">{item.description}</TableCell>
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

export default PurchaseReports;