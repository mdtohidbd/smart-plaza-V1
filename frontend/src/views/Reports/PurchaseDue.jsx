import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import {
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
  Download as ExcelIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as EyeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import useShopRefresh from '../../hooks/useShopRefresh';

import PurchaseInvoiceDetailsModal from '../../components/PurchaseInvoiceDetailsModal';

const PurchaseDue = () => {
  const navigate = useNavigate();
  const { activeShop } = useAuth();
  
  // States
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filters, setFilters] = useState({
    supplierId: '',
    startDate: '',
    endDate: '',
    minDue: ''
  });
  
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  // Fetch Suppliers / Suppliers
  const { data: suppliersResponse, refetch: refetchSuppliers } = useQuery(
    ['contacts-suppliers', activeShop?._id],
    async () => {
      const response = await api.get('/api/suppliers');
      return response.data.data || [];
    },
    {
      enabled: true,
      staleTime: 60000
    }
  );
  const suppliers = suppliersResponse || [];

  // Fetch Purchase Due Report Data
  const { data: reportResponse, isLoading, error, refetch } = useQuery(
    ['purchaseDueReport', filters, activeShop?._id],
    async () => {
      const params = { ...filters, shopId: activeShop?._id };
      const response = await api.get('/api/reports/purchase-dues', { params });
      return response.data;
    },
    {
      enabled: true,
      staleTime: 5000
    }
  );

  // Automatically refresh data when shop changes
  useShopRefresh(() => {
    refetchSuppliers();
    refetch();
  });

  const reportData = reportResponse?.data || [];
  const summary = reportResponse?.summary || {
    totalDues: 0,
    totalOrders: 0,
    averageDue: 0,
    agingAnalysis: { current: 0, days30_60: 0, days60_90: 0, above90: 0 }
  };

  // Filter local search queries
  const filteredData = reportData.filter(item => {
    const term = searchQuery.toLowerCase();
    const purchaseNum = (item.purchaseNumber || '').toLowerCase();
    const supplierName = (item.supplier?.name || '').toLowerCase();
    const contact = (item.supplier?.contactNumber || '').toLowerCase();
    return purchaseNum.includes(term) || supplierName.includes(term) || contact.includes(term);
  });

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleResetFilters = () => {
    setFilters({
      supplierId: '',
      startDate: '',
      endDate: '',
      minDue: ''
    });
    setSearchQuery('');
  };

  const handleOpenInvoiceModal = (id) => {
    setSelectedPurchaseId(id);
    setModalOpen(true);
  };

  const handleCloseInvoiceModal = () => {
    setSelectedPurchaseId(null);
    setModalOpen(false);
  };

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const handleCloseToast = () => {
    setToastOpen(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Client-Side CSV Export
  const handleExportCSV = () => {
    if (!filteredData.length) {
      showToast('No data available to export.', 'error');
      return;
    }
    
    // Define headers
    const headers = ['Invoice Number', 'Supplier Name', 'Contact Number', 'Purchase Date', 'Due Date', 'Total Bill', 'Paid Amount', 'Due Amount', 'Overdue Days', 'Status'];
    
    // Map rows
    const rows = filteredData.map(item => [
      item.purchaseNumber || 'N/A',
      item.supplier?.name || 'N/A',
      item.supplier?.contactNumber || 'N/A',
      formatDate(item.date),
      formatDate(item.dueDate),
      item.total || 0,
      item.paidAmount || 0,
      item.dueAmount || 0,
      item.daysOverdue || 0,
      item.status || 'N/A'
    ]);

    // Build CSV string with UTF-8 BOM for Microsoft Excel compatibility
    const csvContent = '\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Purchase_Due_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV report exported successfully!', 'success');
  };

  return (
    <Box sx={{
      py: { xs: 1, sm: 2 },
      backgroundColor: '#F8FAFC',
      minHeight: '100vh'
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
      <Grid container spacing={2}>
        {/* Title Paper */}
        {/* Filters Card */}
        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              p: 2.5
            }}
          >
            <Typography variant="subtitle2" sx={{ color: '#1e293b', fontWeight: 600, mb: 2, fontFamily: '"Outfit", sans-serif' }}>
              Advanced Search Filters
            </Typography>

            <Grid container spacing={2} alignItems="center">
              {/* Supplier Dropdown */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Supplier / Supplier</InputLabel>
                  <Select
                    name="supplierId"
                    value={filters.supplierId}
                    label="Supplier / Supplier"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">All Suppliers</MenuItem>
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier._id} value={supplier._id}>
                        {supplier.name} ({supplier.contactNumber})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Start Date */}
              <Grid item xs={12} sm={6} md={2.5}>
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

              {/* End Date */}
              <Grid item xs={12} sm={6} md={2.5}>
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

              {/* Minimum Due */}
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Min Due Amount (৳)"
                  name="minDue"
                  type="number"
                  value={filters.minDue}
                  onChange={handleFilterChange}
                  placeholder="0"
                />
              </Grid>

              {/* Reset Button */}
              <Grid item xs={12} md={2} sx={{ display: 'flex', gap: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleResetFilters}
                  sx={{
                    borderRadius: '6px',
                    textTransform: 'none',
                    borderColor: '#cbd5e1',
                    color: '#475569'
                  }}
                >
                  Reset Filters
                </Button>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Dashboard Summaries Grid */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {/* Total Dues */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: '1px solid #fee2e2',
                  background: 'linear-gradient(135deg, #fef2f2 0%, #ffe4e6 100%)',
                  textAlign: 'center'
                }}
              >
                <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Total Supplier Dues
                </Typography>
                <Typography variant="h4" sx={{ color: '#b91c1c', fontWeight: 800, mt: 1, fontFamily: '"Outfit", sans-serif' }}>
                  ৳{summary.totalDues?.toLocaleString() || 0}
                </Typography>
              </Paper>
            </Grid>

            {/* Invoices with Dues */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: '1px solid #e0f2fe',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  textAlign: 'center'
                }}
              >
                <Typography variant="caption" sx={{ color: '#075985', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Bills with Dues
                </Typography>
                <Typography variant="h4" sx={{ color: '#0369a1', fontWeight: 800, mt: 1, fontFamily: '"Outfit", sans-serif' }}>
                  {summary.totalOrders || 0}
                </Typography>
              </Paper>
            </Grid>

            {/* Average Due */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: '1px solid #fae8ff',
                  background: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)',
                  textAlign: 'center'
                }}
              >
                <Typography variant="caption" sx={{ color: '#86198f', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Average Bill Due
                </Typography>
                <Typography variant="h4" sx={{ color: '#701a75', fontWeight: 800, mt: 1, fontFamily: '"Outfit", sans-serif' }}>
                  ৳{Math.round(summary.averageDue || 0).toLocaleString()}
                </Typography>
              </Paper>
            </Grid>

            {/* Critical Overdue Bills */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: '1px solid #ffedd5',
                  background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                  textAlign: 'center'
                }}
              >
                <Typography variant="caption" sx={{ color: '#9a3412', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Critical Overdue (&gt;90 Days)
                </Typography>
                <Typography variant="h4" sx={{ color: '#c2410c', fontWeight: 800, mt: 1, fontFamily: '"Outfit", sans-serif' }}>
                  {summary.agingAnalysis?.above90 || 0}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Data Table Section */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid #eaeef3',
              borderRadius: '8px'
            }}
          >
            {/* Search and Exports bar */}
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  placeholder="Search invoice number, supplier name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'center', md: 'flex-end' } }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<PdfIcon />}
                  onClick={() => {
                    setActiveTab(0);
                    setPreviewOpen(true);
                  }}
                  disabled={isLoading || !filteredData.length}
                  sx={{ borderRadius: '6px', textTransform: 'none' }}
                >
                  Preview PDF
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<ExcelIcon />}
                  onClick={() => {
                    setActiveTab(1);
                    setPreviewOpen(true);
                  }}
                  disabled={isLoading || !filteredData.length}
                  sx={{ borderRadius: '6px', textTransform: 'none' }}
                >
                  Preview Excel
                </Button>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: '#10B981',
                    borderRadius: '6px',
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#059669' }
                  }}
                  startIcon={<ExcelIcon />}
                  onClick={handleExportCSV}
                  disabled={isLoading || !filteredData.length}
                >
                  Export CSV
                </Button>
              </Grid>
            </Grid>

            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
                Error fetching purchase outstanding dues: {error.message || 'Unknown network error.'}
              </Alert>
            )}

            {/* Data Render */}
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <CircularProgress color="error" />
                <Typography variant="body2" sx={{ ml: 2, color: '#64748b' }}>
                  Loading supplier due ledgers...
                </Typography>
              </Box>
            ) : filteredData.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Alert severity="info" sx={{ borderRadius: '8px', display: 'inline-flex' }}>
                  No outstanding purchase due records found for the selected criteria.
                </Alert>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: '#F8FAFC',
                        '& .MuiTableCell-head': {
                          color: '#475569',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          textTransform: 'uppercase',
                          borderBottom: '1px solid #E2E8F0',
                          py: 1.5
                        }
                      }}
                    >
                      <TableCell>Invoice No</TableCell>
                      <TableCell>Supplier Name</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Purchase Date</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell align="right">Total Bill</TableCell>
                      <TableCell align="right">Paid</TableCell>
                      <TableCell align="right">Total Due</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Days Overdue</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData.map((row, index) => {
                      const overdueDays = row.daysOverdue || 0;
                      let daysChipColor = 'success';
                      if (overdueDays > 90) daysChipColor = 'error';
                      else if (overdueDays > 30) daysChipColor = 'warning';

                      return (
                        <TableRow
                          key={row._id || index}
                          sx={{
                            backgroundColor: index % 2 === 0 ? 'transparent' : '#f8fafc',
                            '&:hover': {
                              backgroundColor: '#f1f5f9',
                            },
                            '& .MuiTableCell-root': {
                              py: 1,
                              fontSize: '0.85rem'
                            }
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {row.purchaseNumber}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 500, color: '#334155' }}>
                            {row.supplier?.name || 'N/A'}
                          </TableCell>
                          <TableCell sx={{ color: '#475569' }}>
                            {row.supplier?.contactNumber || 'N/A'}
                          </TableCell>
                          <TableCell sx={{ color: '#475569' }}>
                            {formatDate(row.date)}
                          </TableCell>
                          <TableCell sx={{ color: '#475569' }}>
                            {formatDate(row.dueDate)}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#1e293b' }}>
                            ৳{(row.total || 0).toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#059669', fontWeight: 500 }}>
                            ৳{(row.paidAmount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#DC3545', fontWeight: 600 }}>
                            ৳{(row.dueAmount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={row.status || 'Partial'}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 20,
                                bgcolor: row.status === 'Completed' ? '#E8F5E9' : '#FFF3E0',
                                color: row.status === 'Completed' ? '#2E7D32' : '#ED6C02'
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${overdueDays} days`}
                              size="small"
                              color={daysChipColor}
                              sx={{ fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenInvoiceModal(row._id)}
                              sx={{
                                color: '#DC3545',
                                bgcolor: '#FEF2F2',
                                '&:hover': { bgcolor: '#FEE2E2' }
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
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Invoice Details Modal */}
      <PurchaseInvoiceDetailsModal
        open={modalOpen}
        onClose={handleCloseInvoiceModal}
        purchaseId={selectedPurchaseId}
      />

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
          {downloading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
              <CircularProgress color="error" />
            </Box>
          ) : (
            <Box>
              {activeTab === 0 ? (
                <Box sx={{ p: 1.5, border: '1px solid #ccc', borderRadius: 1, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="h6" gutterBottom>PDF Preview Content</Typography>
                  <Paper elevation={2} sx={{ p: 1.5, mb: 2 }}>
                    <Typography variant="h5" align="center" gutterBottom>Demo Electronics ERP</Typography>
                    <Typography variant="subtitle1" align="center" gutterBottom>Supplier Outstanding Purchase Dues</Typography>
                    <Typography variant="body2" align="center" sx={{ mb: 2 }}>Generated on: {new Date().toLocaleDateString()}</Typography>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Invoice Number</TableCell>
                            <TableCell>Supplier</TableCell>
                            <TableCell align="right">Total Bill</TableCell>
                            <TableCell align="right">Paid</TableCell>
                            <TableCell align="right">Due Amount</TableCell>
                            <TableCell align="center">Overdue Days</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredData.slice(0, 10).map((row, index) => (
                            <TableRow key={row._id || index}>
                              <TableCell>{row.purchaseNumber}</TableCell>
                              <TableCell>{row.supplier?.name || 'N/A'}</TableCell>
                              <TableCell align="right">৳{(row.total || 0).toLocaleString()}</TableCell>
                              <TableCell align="right">৳{(row.paidAmount || 0).toLocaleString()}</TableCell>
                              <TableCell align="right" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>৳{(row.dueAmount || 0).toLocaleString()}</TableCell>
                              <TableCell align="center">{row.daysOverdue || 0} days</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                  <Typography variant="caption" color="textSecondary">
                    This is a preview of how the PDF report will look. Actual report may contain all records.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ p: 1.5, border: '1px solid #ccc', borderRadius: 1, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="h6" gutterBottom>Excel Preview Content</Typography>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="body2" gutterBottom>Sheet: Purchase Outstanding Dues</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Invoice Number</TableCell>
                            <TableCell>Supplier Name</TableCell>
                            <TableCell>Purchase Date</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell align="right">Paid</TableCell>
                            <TableCell align="right">Outstanding Due</TableCell>
                            <TableCell align="center">Days Overdue</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredData.slice(0, 10).map((row, index) => (
                            <TableRow key={row._id || index}>
                              <TableCell>{row.purchaseNumber}</TableCell>
                              <TableCell>{row.supplier?.name || 'N/A'}</TableCell>
                              <TableCell>{formatDate(row.date)}</TableCell>
                              <TableCell align="right">{(row.total || 0)}</TableCell>
                              <TableCell align="right">{(row.paidAmount || 0)}</TableCell>
                              <TableCell align="right">{(row.dueAmount || 0)}</TableCell>
                              <TableCell align="center">{row.daysOverdue || 0}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    This is a preview of how the Excel report sheet will look.
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
            color="error"
            startIcon={activeTab === 0 ? <PdfIcon /> : <ExcelIcon />}
            onClick={() => {
              setDownloading(true);
              setTimeout(() => {
                setDownloading(false);
                setPreviewOpen(false);
                if (activeTab === 0) {
                  window.print();
                } else {
                  handleExportCSV();
                }
              }, 1000);
            }}
          >
            {downloading ? 'Processing...' : `Print / Export ${activeTab === 0 ? 'PDF' : 'Excel'}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
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
    </Box>
  );
};

export default PurchaseDue;