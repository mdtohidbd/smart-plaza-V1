import React, { useState } from 'react';
import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, Grid, Card, CardContent, CardHeader, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Button, IconButton, Chip, useTheme, useMediaQuery } from '@mui/material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, PictureAsPdf as PdfIcon, Download as ExcelIcon, Visibility as EyeIcon, AddShoppingCart as CartIcon } from '@mui/icons-material';
import api from '../../utils/api';
import useShopRefresh from '../../hooks/useShopRefresh';
import ProductPurchaseInvoicesModal from '../../components/ProductPurchaseInvoicesModal';

const StockReports = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  // States for purchase history modal
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProductName, setSelectedProductName] = useState('');

  const handleOpenInvoiceModal = (productId, productName) => {
    setSelectedProductId(productId);
    setSelectedProductName(productName);
    setInvoiceModalOpen(true);
  };

  const handlePrintReport = () => {
    if (!stockData || stockData.length === 0) return;
    
    const printWindow = window.open('', '_blank');
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const rows = stockData.map(item => `
      <tr>
        <td>${item.product.name}</td>
        <td>${item.product?.model || 'N/A'}</td>
        <td style="text-align: right;">${item.currentQuantity}</td>
        <td style="text-align: right;">৳${item.product.purchasePrice.toLocaleString()}</td>
        <td style="text-align: right;">৳${(item.currentQuantity * item.product.purchasePrice).toLocaleString()}</td>
        <td>${item.isOutOfStock ? 'Out of Stock' : item.isLowStock ? 'Low Stock' : 'In Stock'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Stock Report - Smart Plaza BD</title>
          <style>
            body { font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; }
            h1 { color: #1d5f99; margin-bottom: 5px; }
            .header-info { color: #64748b; font-size: 0.9rem; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 0.9rem; }
            th { background-color: #f8fafc; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .summary-box { display: flex; gap: 20px; margin-bottom: 25px; background: #f1f5f9; padding: 15px; border-radius: 8px; }
            .summary-item { flex: 1; }
            .summary-label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; }
            .summary-value { font-size: 1.25rem; font-weight: bold; color: #1e293b; margin-top: 5px; }
          </style>
        </head>
        <body>
          <h1>Smart Plaza BD</h1>
          <div class="header-info">Stock Report | Generated on ${today}</div>
          
          <div class="summary-box">
            <div class="summary-item">
              <div class="summary-label">Total Stock Value</div>
              <div class="summary-value">৳${totalStockValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Unique Items</div>
              <div class="summary-value">${totalItems}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Low Stock Items</div>
              <div class="summary-value">${lowStockItems}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Model</th>
                <th style="text-align: right;">Quantity</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportCSV = () => {
    if (!stockData || stockData.length === 0) return;

    // Define CSV headers
    const headers = ['Product Name', 'Model', 'Current Quantity', 'Purchase Price (BDT)', 'Total Stock Value (BDT)', 'Alert Quantity', 'Status'];
    
    // Format data rows
    const rows = stockData.map(item => [
      `"${item.product.name.replace(/"/g, '""')}"`,
      `"${(item.product?.model || 'N/A').replace(/"/g, '""')}"`,
      item.currentQuantity,
      item.product.purchasePrice,
      item.currentQuantity * item.product.purchasePrice,
      item.alertQuantity,
      item.isOutOfStock ? 'Out of Stock' : item.isLowStock ? 'Low Stock' : 'In Stock'
    ]);

    // Create CSV string with BOM for Excel UTF-8 support
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Stock_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { data: stockData, isLoading, error, refetch } = useQuery(
    'currentStock',
    async () => {
      const response = await api.get('/api/inventory/current');
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  // Automatically refresh data when shop changes
  useShopRefresh(refetch);

  if (isLoading) {
    return (
      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Error loading stock reports: {error.message}</Alert>
      </Box>
    );
  }

  // Calculate summary statistics
  const totalStockValue = stockData?.reduce((sum, item) => sum + (item.currentQuantity * item.product.purchasePrice), 0) || 0;
  const totalItems = stockData?.length || 0;
  const lowStockItems = stockData?.filter(item => item.isLowStock).length || 0;

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
          Stock Reports
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontFamily: '"Outfit", sans-serif' }}>
          Overview of all stock & inventory reports
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
                  <Typography variant="h6" color="textSecondary" sx={{ fontSize: '0.9rem', mb: 0.5 }}>Total Stock Value</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1D5F99', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                    ৳{totalStockValue.toFixed(2)}
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
                  <Typography variant="h6" color="textSecondary" sx={{ fontSize: '0.9rem', mb: 0.5 }}>Total Items</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#42A2C2', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                    {totalItems}
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
                  <Typography variant="h6" color="textSecondary" sx={{ fontSize: '0.9rem', mb: 0.5 }}>Low Stock Items</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#E57141', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                    {lowStockItems}
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
              title="Stock Details" 
              subheader="Detailed view of all stock items"
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
            <CardContent>
              {isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {stockData?.map((item) => (
                    <Card
                      key={item.product._id}
                      elevation={0}
                      sx={{
                        p: 2,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          borderColor: '#1D5F99',
                          boxShadow: '0 4px 12px rgba(29, 95, 153, 0.08)'
                        }
                      }}
                    >
                      {/* Product Name & SKU */}
                      <Box sx={{ mb: 1 }}>
                        <Typography sx={{ color: '#1E293B', fontWeight: 700, fontSize: '0.925rem', fontFamily: '"Outfit", sans-serif' }}>
                          {item.product.name}
                        </Typography>
                        <Typography sx={{ color: '#64748B', fontSize: '0.725rem', mt: 0.25 }}>
                          Model: {item.product?.model || 'N/A'}
                        </Typography>
                      </Box>

                      <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

                      {/* Stock Info */}
                      <Grid container spacing={2} sx={{ my: 0.5 }}>
                        <Grid item xs={6}>
                          <Typography sx={{ color: '#64748B', fontSize: '0.725rem' }}>Current Quantity</Typography>
                          <Typography sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.85rem', mt: 0.25 }}>
                            {item.currentQuantity}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography sx={{ color: '#64748B', fontSize: '0.725rem' }}>Alert Quantity</Typography>
                          <Typography sx={{ color: '#1E293B', fontWeight: 600, fontSize: '0.85rem', mt: 0.25 }}>
                            {item.alertQuantity}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

                      {/* Footer Info & Actions */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Box>
                          {item.isOutOfStock ? (
                            <Chip 
                              label="Out of Stock" 
                              size="small" 
                              sx={{ bgcolor: '#ffebee', color: '#f44336', fontWeight: 700, fontSize: '0.75rem', borderRadius: '4px' }} 
                            />
                          ) : item.isLowStock ? (
                            <Chip 
                              label="Low Stock" 
                              size="small" 
                              sx={{ bgcolor: '#fff3e0', color: '#ff9800', fontWeight: 700, fontSize: '0.75rem', borderRadius: '4px' }} 
                            />
                          ) : (
                            <Chip 
                              label="In Stock" 
                              size="small" 
                              sx={{ bgcolor: '#e8f5e9', color: '#4caf50', fontWeight: 700, fontSize: '0.75rem', borderRadius: '4px' }} 
                            />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            title="View Purchase History Invoices"
                            onClick={() => handleOpenInvoiceModal(item.product._id, item.product.name)}
                            sx={{ 
                              color: '#1D5F99',
                              backgroundColor: 'rgba(29, 95, 153, 0.05)',
                              '&:hover': {
                                backgroundColor: 'rgba(29, 95, 153, 0.15)',
                              }
                            }}
                          >
                            <EyeIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            title="Add Purchase Invoice"
                            onClick={() => navigate('/dashboard/purchase/add')}
                            sx={{ 
                              color: '#42A2C2',
                              backgroundColor: 'rgba(66, 162, 194, 0.05)',
                              '&:hover': {
                                backgroundColor: 'rgba(66, 162, 194, 0.15)',
                              }
                            }}
                          >
                            <CartIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Box>
              ) : (
                <TableContainer>
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
                        <TableCell>Product</TableCell>
                        <TableCell>Model</TableCell>
                        <TableCell align="right">Current Quantity</TableCell>
                        <TableCell align="right">Alert Quantity</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stockData?.map((item) => (
                        <TableRow 
                          key={item.product._id}
                          sx={{
                            '&:nth-of-type(even)': { backgroundColor: '#f9fbfd' },
                            '&:hover': { backgroundColor: '#f0f7ff' },
                          }}
                        >
                          <TableCell>{item.product.name}</TableCell>
                          <TableCell>{item.product.sku}</TableCell>
                          <TableCell align="right">{item.currentQuantity}</TableCell>
                          <TableCell align="right">{item.alertQuantity}</TableCell>
                          <TableCell>
                            {item.isOutOfStock ? (
                              <Box
                                component="span"
                                sx={{
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  backgroundColor: '#ffebee',
                                  color: '#f44336',
                                }}
                              >
                                Out of Stock
                              </Box>
                            ) : item.isLowStock ? (
                              <Box
                                component="span"
                                sx={{
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  backgroundColor: '#fff3e0',
                                  color: '#ff9800',
                                }}
                              >
                                Low Stock
                              </Box>
                            ) : (
                              <Box
                                component="span"
                                sx={{
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  backgroundColor: '#e8f5e9',
                                  color: '#4caf50',
                                }}
                              >
                                In Stock
                              </Box>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                              <IconButton 
                                size="small" 
                                title="View Purchase History Invoices"
                                onClick={() => handleOpenInvoiceModal(item.product._id, item.product.name)}
                                sx={{ 
                                  color: '#1D5F99',
                                  backgroundColor: 'rgba(29, 95, 153, 0.05)',
                                  '&:hover': {
                                    backgroundColor: 'rgba(29, 95, 153, 0.15)',
                                  }
                                }}
                              >
                                <EyeIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                title="Add Purchase Invoice"
                                onClick={() => navigate('/dashboard/purchase/add')}
                                sx={{ 
                                  color: '#42A2C2',
                                  backgroundColor: 'rgba(66, 162, 194, 0.05)',
                                  '&:hover': {
                                    backgroundColor: 'rgba(66, 162, 194, 0.15)',
                                  }
                                }}
                              >
                                <CartIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
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
                      <Typography variant="subtitle1" align="center" gutterBottom>Stock Report</Typography>
                      <Typography variant="body2" align="center" sx={{ mb: 2 }}>Generated on: {new Date().toLocaleDateString()}</Typography>
                      
                      <TableContainer sx={{ border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem' }}>Product</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem' }}>Model</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.78rem' }}>Quantity</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.78rem' }}>Unit Price</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.78rem' }}>Total Value</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem' }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {stockData?.slice(0, 5)?.map((item) => (
                              <TableRow key={item.product._id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                                <TableCell sx={{ py: 1 }}>{item.product.name}</TableCell>
                                <TableCell sx={{ py: 1 }}>{item.product?.model || 'N/A'}</TableCell>
                                <TableCell align="right" sx={{ py: 1 }}>{item.currentQuantity}</TableCell>
                                <TableCell align="right" sx={{ py: 1 }}>৳{item.product.purchasePrice?.toLocaleString()}</TableCell>
                                <TableCell align="right" sx={{ py: 1, fontWeight: 600 }}>৳{(item.currentQuantity * item.product.purchasePrice)?.toLocaleString()}</TableCell>
                                <TableCell sx={{ py: 1 }}>
                                  <Chip 
                                    label={item.isOutOfStock ? 'Out of Stock' : item.isLowStock ? 'Low Stock' : 'In Stock'} 
                                    size="small" 
                                    sx={{
                                      bgcolor: item.isOutOfStock ? '#ffebee' : item.isLowStock ? '#fff3e0' : '#e8f5e9',
                                      color: item.isOutOfStock ? '#f44336' : item.isLowStock ? '#ff9800' : '#4caf50',
                                      fontWeight: 600,
                                      fontSize: '0.7rem',
                                      height: '20px'
                                    }}
                                  />
                                </TableCell>
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
                      <Typography variant="body2" gutterBottom>Sheet: Stock Report</Typography>
                      <TableContainer sx={{ border: '1px solid #C8E6C9', borderRadius: '6px', overflow: 'hidden' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#E8F5E9' }}>
                              <TableCell sx={{ fontWeight: 700, color: '#2E7D32', fontSize: '0.78rem' }}>Product Name</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: '#2E7D32', fontSize: '0.78rem' }}>Model</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: '#2E7D32', fontSize: '0.78rem' }}>Current Quantity</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: '#2E7D32', fontSize: '0.78rem' }}>Purchase Price</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: '#2E7D32', fontSize: '0.78rem' }}>Total Value</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: '#2E7D32', fontSize: '0.78rem' }}>Alert Quantity</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: '#2E7D32', fontSize: '0.78rem' }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {stockData?.slice(0, 5)?.map((item) => (
                              <TableRow key={item.product._id} sx={{ '&:hover': { bgcolor: '#F1F8F5' }, borderBottom: '1px solid #E8F5E9' }}>
                                <TableCell sx={{ py: 1 }}>{item.product.name}</TableCell>
                                <TableCell sx={{ py: 1 }}>{item.product?.model || 'N/A'}</TableCell>
                                <TableCell align="right" sx={{ py: 1 }}>{item.currentQuantity}</TableCell>
                                <TableCell align="right" sx={{ py: 1 }}>৳{item.product.purchasePrice?.toLocaleString()}</TableCell>
                                <TableCell align="right" sx={{ py: 1, fontWeight: 600 }}>৳{(item.currentQuantity * item.product.purchasePrice)?.toLocaleString()}</TableCell>
                                <TableCell align="right" sx={{ py: 1 }}>{item.alertQuantity}</TableCell>
                                <TableCell sx={{ py: 1 }}>{item.isOutOfStock ? 'Out of Stock' : item.isLowStock ? 'Low Stock' : 'In Stock'}</TableCell>
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
                setPreviewOpen(false);
                if (activeTab === 0) {
                  handlePrintReport();
                } else {
                  handleExportCSV();
                }
              }}
            >
              {activeTab === 0 ? 'Print / Save PDF' : 'Download Excel'}
            </Button>
          </DialogActions>
        </Dialog>
        <ProductPurchaseInvoicesModal
          open={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
          productId={selectedProductId}
          productName={selectedProductName}
        />
      </Grid>
    </Box>
  );
};

export default StockReports;