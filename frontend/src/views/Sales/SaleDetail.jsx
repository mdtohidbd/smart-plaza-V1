import React, { useRef, useState, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { useQuery, useQueryClient } from 'react-query';
import { useParams, Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { PictureAsPdf as PictureAsPdfIcon, Print as PrintIcon, Edit as EditIcon, Share as ShareIcon } from '@mui/icons-material';
import InvoicePrint from '../../components/InvoicePrint';
import PrintInvoiceModal from '../../components/invoices/PrintInvoiceModal';
import SalePaymentUpdate from '../../components/SalePaymentUpdate';
import SaleExpensesUpdate from '../../components/SaleExpensesUpdate';
import InvoiceShareButtons from '../../components/InvoiceShareButtons';
import { isSuperAdminPlus } from '../../utils/roleUtils';
import { formatDate } from '../../utils/dateUtils';

const SaleDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  // Validate MongoDB ObjectId format (24 hex characters)
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  if (!isValidObjectId) {
    return <Navigate to="/dashboard/sales" replace />;
  }

  const { data: sale, isLoading, error } = useQuery(
    ['sale', id],
    async () => {
      const response = await api.get(`/api/sales/${id}`);
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

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

  const invoicePrintRef = useRef();
  const { user } = useContext(AuthContext);
  const isGovtAuditor = isSuperAdminPlus(user);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentUpdate, setShowPaymentUpdate] = useState(false);
  const [showExpensesUpdate, setShowExpensesUpdate] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({});

  // Fetch company settings
  const { data: settings } = useQuery(
    'company-settings',
    async () => {
      const response = await api.get('/api/settings');
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        if (data) {
          setCompanyInfo({
            companyName: data.companyName,
            companyAddress: data.companyAddress,
            phone: data.phone,
            email: data.email,
            logo: data.logo
          });
        }
      }
    }
  );

  const handlePrintInvoice = () => {
    if (isGovtAuditor) {
      setShowInvoiceModal(true);
      return;
    }
    if (invoicePrintRef.current) {
      invoicePrintRef.current.openPrintDialog();
    }
  };

  const handleOpenPaymentUpdate = () => {
    setShowPaymentUpdate(true);
  };

  const handleClosePaymentUpdate = () => {
    setShowPaymentUpdate(false);
  };

  const handlePaymentUpdateSuccess = (updatedSale) => {
    queryClient.invalidateQueries(['sale', id]);
    queryClient.invalidateQueries('sales');
    queryClient.invalidateQueries('dashboardData');
  };

  const handleOpenExpensesUpdate = () => {
    setShowExpensesUpdate(true);
  };

  const handleCloseExpensesUpdate = () => {
    setShowExpensesUpdate(false);
  };

  const handleExpensesUpdateSuccess = (updatedSale) => {
    queryClient.invalidateQueries(['sale', id]);
    queryClient.invalidateQueries('sales');
    queryClient.invalidateQueries('dashboardData');
  };

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
        <Alert severity="error">Error loading sale: {error.message}</Alert>
      </Box>
    );
  }

  if (!sale) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Sale not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      py: { xs: 1, sm: 2 },
      backgroundColor: '#F8FAFC',

    }}>
      <Grid container spacing={1.5} >
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              fontFamily: '"Outfit", sans-serif',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                
                <Box>
                  <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, fontFamily: '"Outfit", sans-serif', fontSize: '1.2rem', mb: 0.25 }}>
                    Sale Details
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem' }}>
                    View detailed information about this sale.
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: { xs: 2, sm: 0 } }}>
                {/* Share Buttons */}
                <Tooltip title="Share Invoice">
                  <Button
                    variant="outlined"
                    startIcon={<ShareIcon />}
                    onClick={() => document.getElementById('share-buttons-container').style.display = 
                      document.getElementById('share-buttons-container').style.display === 'none' ? 'flex' : 'none'}
                    sx={{
                      borderColor: '#1D5F99',
                      color: '#1D5F99',
                      '&:hover': {
                        backgroundColor: '#f0f7ff',
                        borderColor: '#1D5F99',
                      },
                      borderRadius: '8px',
                      px: 3,
                      mr: 1
                    }}
                  >
                    Share
                  </Button>
                </Tooltip>
                
                <Tooltip title="Download Invoice as PDF">
                  <Button
                    variant="contained"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={() => downloadInvoice(sale._id)}
                    sx={{
                      backgroundColor: '#E67E22',
                      color: '#ffffff',
                      '&:hover': {
                        backgroundColor: '#d36e19',
                      },
                      borderRadius: '8px',
                      px: 3,
                      mr: 1
                    }}
                  >
                    Download PDF
                  </Button>
                </Tooltip>

                <Tooltip title="Print Invoice">
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={handlePrintInvoice}
                    sx={{
                      borderColor: '#1D5F99',
                      color: '#1D5F99',
                      '&:hover': {
                        backgroundColor: '#f0f7ff',
                        borderColor: '#1D5F99',
                      },
                      borderRadius: '8px',
                      px: 3,
                      mr: 1
                    }}
                  >
                    Print
                  </Button>
                </Tooltip>
                {user?.role === 'Super Admin' && (
                  <Tooltip title="Update Payment Information">
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={handleOpenPaymentUpdate}
                      sx={{
                        borderColor: '#42A2C2',
                        color: '#42A2C2',
                        '&:hover': {
                          backgroundColor: '#e6f7ff',
                          borderColor: '#42A2C2',
                        },
                        borderRadius: '8px',
                        px: 3
                      }}
                    >
                      Update Payment
                    </Button>
                  </Tooltip>
                )}
                {(user?.role === 'Super Admin' || user?.role === 'Admin' || true) && (
                  <Tooltip title="Edit Invoice Expenses & Charges">
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={handleOpenExpensesUpdate}
                      sx={{
                        borderColor: '#6366F1',
                        color: '#6366F1',
                        '&:hover': {
                          backgroundColor: '#eef2ff',
                          borderColor: '#6366F1',
                        },
                        borderRadius: '8px',
                        px: 3,
                        ml: 1
                      }}
                    >
                      Edit Expenses
                    </Button>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Box 
        id="share-buttons-container" 
        sx={{ mb: 2, display: 'flex' }}
      >
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Share Invoice:
        </Typography>
        <InvoiceShareButtons sale={sale} companyInfo={companyInfo} />
      </Box>
      
      <Grid container spacing={1.5} >
        {/* Sale Information Card */}
        <Grid item xs={12} md={6}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}>
            <CardHeader
              title="Sale Information"
              sx={{
                backgroundColor: '#f5f9ff',
                borderBottom: '1px solid #e0e0e0',
                '& .MuiCardHeader-title': {
                  color: '#1D5F99',
                  fontWeight: '600',
                  fontSize: '1.2rem'
                }
              }}
            />
            <CardContent>
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Invoice Number</Typography>
                  <Typography variant="body1">{sale.invoiceNumber}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Date</Typography>
                  <Typography variant="body1">
                    {formatDate(sale.date, true)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Type</Typography>
                  <Typography variant="body1">{sale.type?.toUpperCase()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Status</Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 'bold',
                      color: sale.status === 'Completed' ? '#4caf50' : sale.status === 'Partial' ? '#ff9800' : '#f44336',
                    }}
                  >
                    {sale.status}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Payment Method</Typography>
                  <Typography variant="body1">{sale.paymentMethod}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Total</Typography>
                  <Typography variant="body1" fontWeight="bold">৳{sale.total?.toFixed(2)}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Information Card */}
        <Grid item xs={12} md={6}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}>
            <CardHeader
              title="Customer Information"
              sx={{
                backgroundColor: '#f5f9ff',
                borderBottom: '1px solid #e0e0e0',
                '& .MuiCardHeader-title': {
                  color: '#1D5F99',
                  fontWeight: '600',
                  fontSize: '1.2rem'
                }
              }}
            />
            <CardContent>
              <Grid container spacing={1.5}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Name</Typography>
                  <Typography variant="body1">{sale.customer?.contactName || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Contact Number</Typography>
                  <Typography variant="body1">{sale.customer?.contactNumber || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Address</Typography>
                  <Typography variant="body1">{sale.customer?.address || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Sale Items Card */}
        <Grid item xs={12}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}>
            <CardHeader
              title="Sale Items"
              sx={{
                backgroundColor: '#f5f9ff',
                borderBottom: '1px solid #e0e0e0',
                '& .MuiCardHeader-title': {
                  color: '#1D5F99',
                  fontWeight: '600',
                  fontSize: '1.2rem'
                }
              }}
            />
            <CardContent>
              <TableContainer sx={{ overflow: 'auto' }}>
                <Table
                  sx={{
                    minWidth: 800,
                    tableLayout: 'auto' // Allow table to adjust column widths automatically
                  }}
                >
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: '#1D5F99', // Brand primary color
                        '& .MuiTableCell-head': {
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          borderBottom: '2px solid #e0e0e0',
                          whiteSpace: 'nowrap',
                          padding: '6px 10px'
                        }
                      }}
                    >
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 180 }}>Product</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 120 }}>Quantity</TableCell>
                      <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold', minWidth: 140 }}>Unit Price</TableCell>
                      <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold', minWidth: 140 }}>Discount</TableCell>
                      <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold', minWidth: 120 }}>Tax</TableCell>
                      <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold', minWidth: 140 }}>Line Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sale.items?.map((item, index) => (
                      <TableRow
                        key={index}
                        sx={{
                          backgroundColor: index % 2 === 0 ? 'transparent' : '#f9fbfd',
                          '&:hover': {
                            backgroundColor: '#eef5ff', // Light blue hover
                          },
                          '& .MuiTableCell-root': {
                            whiteSpace: 'nowrap',
                            padding: '6px 10px'
                          }
                        }}
                      >
                        <TableCell sx={{ color: '#333', fontWeight: 500 }}>{item.product?.name || 'N/A'}</TableCell>
                        <TableCell sx={{ color: '#333' }}>{item.quantity}</TableCell>
                        <TableCell align="right" sx={{ color: '#1D5F99', fontWeight: '500' }}>৳{item.unitPrice?.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ color: '#E57141', fontWeight: '500' }}>৳{item.discount?.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ color: '#42A2C2', fontWeight: '500' }}>৳{item.tax?.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ color: '#388E3C', fontWeight: '500' }}>৳{((item.quantity * item.unitPrice) - item.discount + item.tax).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Financial Summary Card */}
        <Grid item xs={12} md={6}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}>
            <CardHeader
              title="Financial Summary"
              sx={{
                backgroundColor: '#f5f9ff',
                borderBottom: '1px solid #e0e0e0',
                '& .MuiCardHeader-title': {
                  color: '#1D5F99',
                  fontWeight: '600',
                  fontSize: '1.2rem'
                }
              }}
            />
            <CardContent>
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Subtotal</Typography>
                  <Typography variant="body1">৳{sale.subTotal?.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Discount</Typography>
                  <Typography variant="body1">৳{sale.discount?.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Tax</Typography>
                  <Typography variant="body1">৳{(sale.tax || 0).toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Delivery Charge</Typography>
                  <Typography variant="body1">৳{(sale.deliveryCharge || 0).toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Installation Cost</Typography>
                  <Typography variant="body1">৳{(sale.installationCost || 0).toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Additional Expense</Typography>
                  <Typography variant="body1">৳{(sale.additionalExpense || 0).toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Card Charge</Typography>
                  <Typography variant="body1">৳{(sale.cardCharge || 0).toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Total</Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ color: '#1E293B' }}>৳{(sale.total || 0).toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12} sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleOpenExpensesUpdate}
                    sx={{
                      borderColor: '#6366F1',
                      color: '#6366F1',
                      '&:hover': { bgcolor: '#EEF2FF', borderColor: '#4F46E5' },
                      textTransform: 'none',
                      borderRadius: '6px'
                    }}
                  >
                    Edit Expenses
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Information Card */}
        <Grid item xs={12} md={6}>
          <Card elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}>
            <CardHeader
              title="Payment Information"
              sx={{
                backgroundColor: '#f5f9ff',
                borderBottom: '1px solid #e0e0e0',
                '& .MuiCardHeader-title': {
                  color: '#1D5F99',
                  fontWeight: '600',
                  fontSize: '1.2rem'
                }
              }}
            />
            <CardContent>
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Paid Amount</Typography>
                  <Typography variant="body1" color="success.main" fontWeight="bold">৳{sale.paidAmount?.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Due Amount</Typography>
                  <Typography
                    variant="body1"
                    color={sale.dueAmount > 0 ? 'error' : 'success'}
                    fontWeight="bold"
                  >
                    ৳{sale.dueAmount?.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Note</Typography>
                  <Typography variant="body1">{sale.note || 'No note provided'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Invoice Print Component */}
      {isGovtAuditor ? (
        <PrintInvoiceModal
          open={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          saleId={id}
        />
      ) : (
        <InvoicePrint
          ref={invoicePrintRef}
          sale={sale}
          companyInfo={{
            companyName: 'Smart Plaza BD',
            companyAddress: '1 KDA Avenue, Shibbari, Khulna, Khulna, Bangladesh, 9100',
            phone: '01842-144844',
            email: 'smartplazabd@gmail.com'
          }}
        />
      )}

      {/* Sale Payment Update Component */}
      <SalePaymentUpdate
        open={showPaymentUpdate}
        onClose={handleClosePaymentUpdate}
        sale={sale}
        onSuccess={handlePaymentUpdateSuccess}
      />

      {/* Sale Expenses Update Component */}
      <SaleExpensesUpdate
        open={showExpensesUpdate}
        onClose={handleCloseExpensesUpdate}
        sale={sale}
        onSuccess={handleExpensesUpdateSuccess}
      />
    </Box>
  );
};

export default SaleDetail;