import React, { useState } from 'react';
import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, Grid, Card, CardContent, CardHeader, Divider, IconButton, Tooltip, Link, Button, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Snackbar, Alert as MuiAlert, Skeleton, TextField, MenuItem, Select, FormControl, InputLabel, InputAdornment, Chip } from '@mui/material';
import { useQuery } from 'react-query';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { PictureAsPdf as PictureAsPdfIcon, Add as AddIcon, Print as PrintIcon, Download as ExcelIcon, Search as SearchIcon } from '@mui/icons-material';
import api from '../../utils/api';
import useShopRefresh from '../../hooks/useShopRefresh';

const SalesReports = () => {
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastSeverity, setToastSeverity] = useState('success');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const handleCloseToast = () => {
    setToastOpen(false);
  };

  const { data: sales, isLoading, error, refetch } = useQuery(
    'sales',
    async () => {
      const response = await api.get('/api/sales');
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000
    }
  );

  // Automatically refresh data when shop changes
  useShopRefresh(refetch);

  const downloadInvoice = async (saleId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authorization token found. Please log in again.');
        return;
      }
      
      // Open invoice with token in URL
      window.open(`${api.defaults.baseURL}/api/sales/${saleId}/invoice?token=${encodeURIComponent(token)}`, '_blank');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Error downloading invoice: ' + error.message);
    }
  };

  const downloadPDF = () => {
    if (!sales) return;
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
      <html>
        <head>
          <title>Sales Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h2 { color: #333; margin-bottom: 5px; }
            h3 { color: #555; margin-top: 0; }
            .header { text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Demo Electronics ERP</h2>
            <h3>Sales Report</h3>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>SR</th>
                <th>Date</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${sales.map(sale => `
                <tr>
                  <td>${sale.invoiceNumber}</td>
                  <td>${sale.customer?.contactName || 'N/A'}</td>
                  <td>${sale.assignedSR?.name || 'N/A'}</td>
                  <td>${new Date(sale.date).toLocaleDateString()}</td>
                  <td>৳${sale.total}</td>
                  <td>৳${sale.paidAmount}</td>
                  <td>৳${sale.dueAmount}</td>
                  <td>${sale.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const downloadExcel = () => {
    if (!sales) return;
    const headers = ['Invoice', 'Customer', 'SR', 'Date', 'Total (BDT)', 'Paid (BDT)', 'Due (BDT)', 'Status'];
    const csvRows = [headers.join(',')];
    
    sales.forEach(sale => {
      const row = [
        sale.invoiceNumber,
        `"${sale.customer?.contactName || 'N/A'}"`,
        `"${sale.assignedSR?.name || 'N/A'}"`,
        new Date(sale.date).toLocaleDateString(),
        sale.total,
        sale.paidAmount,
        sale.dueAmount,
        sale.status
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Full-screen loading check removed to support skeleton rendering


  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Error loading sales reports: {error.message}</Alert>
      </Box>
    );
  }

  const getCustomerName = (sale) => {
    if (!sale) return 'N/A';
    if (typeof sale.customer === 'string' && sale.customer.trim() && !sale.customer.match(/^[0-9a-fA-F]{24}$/)) {
      return sale.customer;
    }
    return (
      sale.customer?.contactName ||
      sale.customer?.name ||
      sale.customer?.businessName ||
      sale.customerName ||
      sale.customerDetails?.contactName ||
      sale.customerDetails?.name ||
      sale.shippingAddress?.name ||
      sale.billingAddress?.name ||
      'N/A'
    );
  };

  const getCustomerPhone = (sale) => {
    if (!sale) return '';
    return (
      sale.customer?.contactNumber ||
      sale.customer?.phone ||
      sale.customer?.mobile ||
      sale.customerPhone ||
      sale.customerDetails?.contactNumber ||
      sale.customerDetails?.phone ||
      sale.shippingAddress?.phone ||
      ''
    );
  };

  const getSRName = (sale) => {
    if (!sale) return 'N/A';
    return (
      sale.assignedSR?.name ||
      sale.assignedSR?.contactName ||
      sale.srName ||
      sale.salesPerson ||
      sale.createdBy?.name ||
      'N/A'
    );
  };

  // Filter sales based on search and status
  const filteredSales = sales?.filter(sale => {
    if (statusFilter !== 'ALL' && sale.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const inv = (sale.invoiceNumber || '').toLowerCase();
    const cust = getCustomerName(sale).toLowerCase();
    const phone = getCustomerPhone(sale).toLowerCase();
    const sr = getSRName(sale).toLowerCase();
    return inv.includes(term) || cust.includes(term) || phone.includes(term) || sr.includes(term);
  }) || [];

  // Calculate summary statistics excluding cancelled sales
  const activeSales = sales?.filter(sale => sale.status !== 'Cancelled') || [];
  const totalSales = activeSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalQuantity = activeSales.reduce((sum, sale) => sum + (sale.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0), 0);
  const avgOrderValue = activeSales.length > 0 ? totalSales / activeSales.length : 0;

  return (
    <Box sx={{ p: 1.5, backgroundColor: '#F8FAFC', }}>
      
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
          Sales Reports
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontFamily: '"Outfit", sans-serif' }}>
          Overview of all sales report categories
        </Typography>
      </Box>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
              height: '100%'
            }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" color="textSecondary" sx={{ fontSize: '0.9rem', mb: 0.5 }}>Total Sales</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1D5F99', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                    {isLoading ? <Skeleton variant="text" width={100} /> : `৳${totalSales.toFixed(2)}`}
                  </Typography>
                </Box>
                
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3} md={4}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
              height: '100%'
            }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" color="textSecondary" sx={{ fontSize: '0.9rem', mb: 0.5 }}>Items Sold</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#42A2C2', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                    {isLoading ? <Skeleton variant="text" width={60} /> : totalQuantity}
                  </Typography>
                </Box>
                
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3} md={4}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
              height: '100%'
            }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" color="textSecondary" sx={{ fontSize: '0.9rem', mb: 0.5 }}>Avg. Order</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#E57141', fontSize: { xs: '1.1rem', sm: '1.4rem' } }}>
                    {isLoading ? <Skeleton variant="text" width={100} /> : `৳${avgOrderValue.toFixed(2)}`}
                  </Typography>
                </Box>
                
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}>
            <CardHeader 
              title="Sales Details" 
              subheader="Detailed view of all sales transactions"
              sx={{ 
                backgroundColor: '#f5f9ff',
                borderBottom: '1px solid #e0e0e0',
                '& .MuiCardHeader-title': {
                  color: '#1D5F99',
                  fontWeight: '600',
                  fontSize: '1.2rem'
                },
                '& .MuiCardHeader-subheader': {
                  color: '#666'
                }
              }}
            />
            <Box sx={{ p: 2, borderBottom: '1px solid #eaeef3', backgroundColor: '#fff', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Search by invoice, customer, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ width: { xs: '100%', sm: 320 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="ALL">All Statuses</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Delivered">Delivered</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <CardContent>
              <>
                {/* Desktop view */}
                <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor: '#F8FAFC',
                          '& .MuiTableCell-head': {
                            color: '#475569',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            fontFamily: '"Outfit", sans-serif',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #eaeef3',
                            padding: '10px 16px',
                          }
                        }}
                      >
                        <TableCell>Invoice</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>SR</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Paid</TableCell>
                        <TableCell align="right">Due</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {isLoading ? (
                        [1, 2, 3, 4, 5].map((item) => (
                          <TableRow key={item}>
                            <TableCell><Skeleton variant="text" width="90%" /></TableCell>
                            <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                            <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                            <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                            <TableCell align="right"><Skeleton variant="text" width="50%" /></TableCell>
                            <TableCell align="right"><Skeleton variant="text" width="50%" /></TableCell>
                            <TableCell align="right"><Skeleton variant="text" width="50%" /></TableCell>
                            <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Skeleton variant="circular" width={24} height={24} />
                                <Skeleton variant="circular" width={24} height={24} />
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : filteredSales?.map((sale) => (
                        <TableRow 
                          key={sale._id}
                          sx={{
                            '&:nth-of-type(even)': { backgroundColor: '#f9fbfd' },
                            '&:hover': { backgroundColor: '#f0f7ff' },
                          }}
                        >
                          <TableCell>
                            <RouterLink 
                              to={`/sales/${sale._id}`}
                              style={{ 
                                textDecoration: 'none', 
                                color: '#1D5F99',
                                fontWeight: 'bold'
                              }}
                            >
                              {sale.invoiceNumber}
                            </RouterLink>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {getCustomerName(sale)}
                              </Typography>
                              {getCustomerPhone(sale) && (
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                  {getCustomerPhone(sale)}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>{getSRName(sale)}</TableCell>
                          <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                          <TableCell align="right">৳{sale.total}</TableCell>
                          <TableCell align="right">৳{sale.paidAmount}</TableCell>
                          <TableCell align="right">৳{sale.dueAmount}</TableCell>
                          <TableCell>
                            <Box
                              component="span"
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                backgroundColor: sale.status === 'Completed' ? '#e8f5e9' : sale.status === 'Partial' ? '#fff3e0' : '#ffebee',
                                color: sale.status === 'Completed' ? '#4caf50' : sale.status === 'Partial' ? '#ff9800' : '#f44336',
                              }}
                            >
                              {sale.status}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Download Invoice as PDF">
                              <IconButton onClick={() => downloadInvoice(sale._id)}>
                                <PictureAsPdfIcon sx={{ color: '#1D5F99' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Print Invoice">
                              <IconButton onClick={async () => {
                                try {
                                  const token = localStorage.getItem('token');
                                  if (!token) {
                                    alert('No authorization token found. Please log in again.');
                                    return;
                                  }
                                  
                                  // Open print view with proper authorization
                                  const printUrl = `${api.defaults.baseURL}/api/sales/${sale._id}/invoice?format=print&token=${encodeURIComponent(token)}`;
                                  window.open(printUrl, '_blank');
                                } catch (error) {
                                  console.error('Error opening print view:', error);
                                  alert('Error opening print view: ' + error.message);
                                }
                              }}>
                                <PrintIcon sx={{ color: '#42A2C2', ml: 1 }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Mobile View Cards */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5, p: 1.5, backgroundColor: '#F8FAFC' }}>
                  {isLoading ? (
                    [1, 2, 3].map((item) => (
                      <Paper key={item} elevation={0} sx={{ p: 2, border: '1px solid #eaeef3', borderRadius: '12px', backgroundColor: '#fff' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Skeleton variant="text" width="40%" height={20} />
                          <Skeleton variant="text" width="20%" height={20} />
                        </Box>
                        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                          <Grid item xs={6}>
                            <Skeleton variant="text" width="50%" />
                            <Skeleton variant="text" width="80%" />
                          </Grid>
                          <Grid item xs={6}>
                            <Skeleton variant="text" width="50%" />
                            <Skeleton variant="text" width="80%" />
                          </Grid>
                        </Grid>
                        <Skeleton variant="rectangular" height={36} sx={{ borderRadius: '8px', mb: 1.5 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Skeleton variant="circular" width={28} height={28} />
                          <Skeleton variant="circular" width={28} height={28} />
                        </Box>
                      </Paper>
                    ))
                  ) : filteredSales?.map((sale) => (
                    <Paper key={sale._id} elevation={0} sx={{ p: 2, border: '1px solid #eaeef3', borderRadius: '12px', backgroundColor: '#fff', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <RouterLink 
                          to={`/sales/${sale._id}`}
                          style={{ 
                            textDecoration: 'none', 
                            color: '#1D5F99',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                          }}
                        >
                          {sale.invoiceNumber}
                        </RouterLink>
                        <Box
                          component="span"
                          sx={{
                            px: 1.25,
                            py: 0.25,
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            backgroundColor: sale.status === 'Completed' ? '#e8f5e9' : sale.status === 'Partial' ? '#fff3e0' : '#ffebee',
                            color: sale.status === 'Completed' ? '#4caf50' : sale.status === 'Partial' ? '#ff9800' : '#f44336',
                          }}
                        >
                          {sale.status}
                        </Box>
                      </Box>

                      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Customer</Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>{sale.customer?.contactName || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>SR</Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>{sale.assignedSR?.name || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Date</Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>{new Date(sale.date).toLocaleDateString()}</Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ display: 'flex', gap: 1.5, p: 1, backgroundColor: '#F8FAFC', borderRadius: '8px', mb: 1.5, justifyContent: 'space-around', textAlign: 'center' }}>
                        <Box>
                          <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>TOTAL</Typography>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>৳{sale.total}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>PAID</Typography>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#4caf50' }}>৳{sale.paidAmount}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>DUE</Typography>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#f44336' }}>৳{sale.dueAmount}</Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', pt: 1, gap: 0.5 }}>
                        <Tooltip title="Download PDF">
                          <IconButton size="small" onClick={() => downloadInvoice(sale._id)} sx={{ color: '#1D5F99' }}>
                            <PictureAsPdfIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Print">
                          <IconButton size="small" onClick={async () => {
                            try {
                              const token = localStorage.getItem('token');
                              if (!token) {
                                alert('No authorization token found. Please log in again.');
                                return;
                              }
                              const printUrl = `${api.defaults.baseURL}/api/sales/${sale._id}/invoice?format=print&token=${encodeURIComponent(token)}`;
                              window.open(printUrl, '_blank');
                            } catch (error) {
                              alert('Error: ' + error.message);
                            }
                          }} sx={{ color: '#42A2C2' }}>
                            <PrintIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </>
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
                      <Typography variant="subtitle1" align="center" gutterBottom>Sales Report</Typography>
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
                            {sales?.slice(0, 5)?.map((sale) => (
                              <TableRow key={sale._id}>
                                <TableCell>{sale.invoiceNumber}</TableCell>
                                <TableCell>{sale.customer?.contactName || 'N/A'}</TableCell>
                                <TableCell align="right">৳{sale.total}</TableCell>
                                <TableCell align="right">৳{sale.paidAmount}</TableCell>
                                <TableCell align="right">৳{sale.dueAmount}</TableCell>
                                <TableCell>{sale.status}</TableCell>
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
                      <Typography variant="body2" gutterBottom>Sheet: Sales Report</Typography>
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
                            {sales?.slice(0, 5)?.map((sale) => (
                              <TableRow key={sale._id}>
                                <TableCell>{sale.invoiceNumber}</TableCell>
                                <TableCell>{sale.customer?.contactName || 'N/A'}</TableCell>
                                <TableCell align="right">{sale.total}</TableCell>
                                <TableCell align="right">{sale.paidAmount}</TableCell>
                                <TableCell align="right">{sale.dueAmount}</TableCell>
                                <TableCell>{sale.status}</TableCell>
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
              startIcon={activeTab === 0 ? <PictureAsPdfIcon /> : <ExcelIcon />}
              onClick={() => {
                setLoading(true);
                // Simulate download process
                setTimeout(async () => {
                  try {
                    if (activeTab === 0) {
                      downloadPDF();
                    } else {
                      downloadExcel();
                    }
                    
                    showToast(`${activeTab === 0 ? 'PDF' : 'Excel'} report downloaded successfully!`, 'success');
                    setLoading(false);
                    setPreviewOpen(false);
                  } catch (error) {
                    showToast(`Failed to download ${activeTab === 0 ? 'PDF' : 'Excel'} report: ${error.message || 'Unknown error'}`, 'error');
                    setLoading(false);
                  }
                }, 500);
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

export default SalesReports;