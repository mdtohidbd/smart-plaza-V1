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
  CircularProgress,
  Chip,
  Tooltip,
  Alert,
  Divider,
  Avatar
} from '@mui/material';
import { useQuery, useQueryClient } from 'react-query';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { format } from 'date-fns';
import {
  Print as PrintIcon,
  Share as ShareIcon,
  Receipt as ReceiptIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Timeline as TimelineIcon,
  MonetizationOn as MonetizationOnIcon,
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon,
  Payment as PaymentIcon,
  ErrorOutline as ErrorIcon,
  CheckCircleOutline as CheckIcon,
  Edit as EditIcon,
  CreditCard as CreditCardIcon
} from '@mui/icons-material';
import PrintInvoiceModal from '../../components/invoices/PrintInvoiceModal';
import InvoiceShareButtons from '../../components/InvoiceShareButtons';
import SalePaymentUpdate from '../../components/SalePaymentUpdate';
import EMICollectionModal from './EMICollectionModal';
import EditInstalmentModal from './EditInstalmentModal';

const EMISaleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Validate MongoDB ObjectId format (24 hex characters)
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  if (!isValidObjectId) {
    return <Navigate to="/dashboard/emi/sales" replace />;
  }

  const { data: invoice, isLoading, error } = useQuery(
    ['emi-invoice', id],
    async () => {
      const response = await api.get(`/api/emi/invoices/${id}`);
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const [showPaymentUpdate, setShowPaymentUpdate] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({});
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [editInstalmentModalOpen, setEditInstalmentModalOpen] = useState(false);
  const [selectedInstalmentToEdit, setSelectedInstalmentToEdit] = useState(null);

  const handleOpenEditModal = (item) => {
    setSelectedInstalmentToEdit(item);
    setEditInstalmentModalOpen(true);
  };

  const handleCollectClick = (item) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let daysOverdue = 0;
    let recommendedLateFee = 0;
    
    if (item.dueDate) {
      const dueDate = new Date(item.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        const diffTime = Math.abs(today - dueDate);
        daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const monthsOverdue = Math.ceil(daysOverdue / 30) || 1;
        const totalLateFee = (monthsOverdue * 0.01) * (invoice.subtotal || 0);
        const alreadyPaid = item.lateFeePaid || 0;
        recommendedLateFee = Math.max(0, Math.round(totalLateFee - alreadyPaid));
      }
    }

    const payload = {
      invoice: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customer,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      instalmentNumber: item.instalmentNumber,
      dueDate: item.dueDate,
      amount: item.amount,
      paidAmount: item.paidAmount || 0,
      daysOverdue,
      recommendedLateFee,
      status: item.status
    };
    setSelectedInstallment(payload);
    setCollectionModalOpen(true);
  };

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
    setPrintModalOpen(true);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={40} color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Error loading EMI Invoice: {error.message}</Alert>
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">EMI Invoice not found</Alert>
      </Box>
    );
  }

  // Transform the invoice to match Sale object shape for the standard components temporarily
  const sale = {
    ...invoice,
    date: invoice.invoiceDate,
    customer: {
      contactName: invoice.customerName,
      contactNumber: invoice.customerPhone,
      address: invoice.customerAddress
    },
    items: invoice.products.map(p => ({
      product: p.product,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      discount: p.discount || 0,
      tax: 0
    })),
    subTotal: invoice.subtotal || invoice.totalAmount,
    discount: invoice.discount || 0,
    tax: invoice.tax || 0,
    total: invoice.emiPlan?.totalPayableAmount || invoice.totalAmount,
    totalAmount: invoice.emiPlan?.totalPayableAmount || invoice.totalAmount,
    paidAmount: invoice.paidAmount || 0,
    dueAmount: invoice.outstandingBalance || 0,
    note: invoice.notes,
    paymentMethod: invoice.downPayment?.method || 'Cash',
    type: 'EMI',
    invoiceType: 'EMI',
    emiDetails: {
      planType: invoice.emiPlan.planType,
      duration: invoice.emiPlan.duration,
      downPayment: invoice.downPayment?.amount || 0,
      monthlyInstalment: invoice.emiPlan.monthlyInstalment
    }
  };

  const getStatusChip = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return (
          <Chip
            icon={<CheckIcon sx={{ fontSize: '14px !important', color: '#059669 !important' }} />}
            label="COMPLETED"
            sx={{ bgcolor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontWeight: 700, fontSize: '0.75rem', px: 0.5 }}
          />
        );
      case 'active':
        return (
          <Chip
            icon={<TimelineIcon sx={{ fontSize: '14px !important', color: '#D97706 !important' }} />}
            label="ACTIVE"
            sx={{ bgcolor: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', fontWeight: 700, fontSize: '0.75rem', px: 0.5 }}
          />
        );
      default:
        return (
          <Chip
            icon={<ErrorIcon sx={{ fontSize: '14px !important', color: '#DC2626 !important' }} />}
            label={status?.toUpperCase() || 'UNKNOWN'}
            sx={{ bgcolor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontWeight: 700, fontSize: '0.75rem', px: 0.5 }}
          />
        );
    }
  };

  return (
    <Box sx={{ py: 1.5, px: 2, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      
      {/* ── Top Action & Title Bar ── */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          background: 'linear-gradient(to right, #FFFFFF, #F8FAFC)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => navigate('/dashboard/emi/sales')}
            sx={{
              bgcolor: '#F1F5F9',
              color: '#475569',
              '&:hover': { bgcolor: '#E2E8F0' },
              borderRadius: '12px'
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Box>
            <Typography variant="h6" sx={{ color: '#0F172A', fontWeight: 800, fontFamily: 'Outfit, sans-serif', fontSize: '1.35rem', letterSpacing: '-0.02em', mb: 0.25 }}>
              EMI Sale Details
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontFamily: 'Inter, sans-serif', fontSize: '0.825rem', fontWeight: 500 }}>
              View detailed information about invoice #{invoice.invoiceNumber}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={() => {
              const el = document.getElementById('share-buttons-container');
              if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
            }}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              borderColor: '#E2E8F0',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.85rem',
              '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' }
            }}
          >
            Share
          </Button>
          
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrintInvoice}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              bgcolor: '#0F766E',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.85rem',
              boxShadow: '0 4px 12px rgba(15,118,110,0.2)',
              '&:hover': { bgcolor: '#0D9488', boxShadow: '0 6px 16px rgba(13,148,136,0.3)' }
            }}
          >
            Print Invoice
          </Button>
        </Box>
      </Paper>

      {/* Share Container */}
      <Box 
        id="share-buttons-container" 
        sx={{ 
          mb: 3, 
          display: 'none',
          p: 2.5,
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF'
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#334155' }}>
          Share Invoice Link:
        </Typography>
        <InvoiceShareButtons 
          sale={sale} 
          companyInfo={companyInfo} 
          message={`Dear ${invoice.customerName}, your EMI Invoice ${invoice.invoiceNumber} has been created. Total payable amount: ৳${(invoice.emiPlan?.totalPayableAmount || invoice.totalAmount || 0).toLocaleString()}. Remaining Due: ৳${(invoice.outstandingBalance || 0).toLocaleString()}. Thank you!`}
        />
      </Box>

      {/* ── Information Cards ── */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        
        {/* Sale & Customer Summary Card */}
        <Grid item xs={12}>
          <Card 
            elevation={0}
            sx={{
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF'
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6} sx={{ borderRight: { md: '1px solid #F1F5F9' } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F766E', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptIcon sx={{ fontSize: 18 }} /> Sale & Plan Details
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>Invoice Number</Typography>
                      <Typography variant="body2" fontWeight={700} color="#0F172A">{invoice.invoiceNumber}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>Date</Typography>
                      <Typography variant="body2" fontWeight={600} color="#334155">
                        {format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>Plan & Duration</Typography>
                      <Typography variant="body2" fontWeight={600} color="#334155" sx={{ textTransform: 'capitalize' }}>
                        {invoice.emiPlan?.planType || '—'} ({invoice.emiPlan?.duration} Months)
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>Status</Typography>
                      <Box sx={{ mt: 0.25 }}>{getStatusChip(invoice.status)}</Box>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12} md={6} sx={{ pl: { md: 3 } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F766E', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ fontSize: 18 }} /> Customer Information
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>Name</Typography>
                      <Typography variant="body2" fontWeight={700} color="#0F172A">{invoice.customerName || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>Contact Number</Typography>
                      <Typography variant="body2" fontWeight={600} color="#334155">{invoice.customerPhone || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>Address</Typography>
                      <Typography variant="body2" fontWeight={600} color="#334155">{invoice.customerAddress || 'N/A'}</Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Side-by-side Tables: Sale Items (5 cols) & Instalment Schedule (7 cols) */}
        <Grid item xs={12} md={5}>
          <Card 
            elevation={0}
            sx={{
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              overflow: 'hidden',
              height: '100%'
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'rgba(15,118,110,0.1)', color: '#0F766E', width: 32, height: 32 }}>
                <AssignmentIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
                Sale Items
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#475569', fontWeight: 700, fontSize: '0.75rem', py: 1 }}>Product</TableCell>
                    <TableCell align="center" sx={{ color: '#475569', fontWeight: 700, fontSize: '0.75rem', py: 1 }}>Qty</TableCell>
                    <TableCell align="right" sx={{ color: '#475569', fontWeight: 700, fontSize: '0.75rem', py: 1 }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.products?.map((item, index) => (
                    <TableRow key={index} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                      <TableCell sx={{ color: '#0F172A', fontWeight: 600, fontSize: '0.8rem', py: 1 }}>
                        {item.name || item.product?.name || 'N/A'}
                      </TableCell>
                      <TableCell align="center" sx={{ color: '#334155', fontWeight: 500, py: 1 }}>{item.quantity}</TableCell>
                      <TableCell align="right" sx={{ color: '#0F172A', fontWeight: 700, py: 1 }}>
                        ৳{(item.total || ((item.quantity * item.unitPrice) - (item.discount || 0))).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card 
            elevation={0}
            sx={{
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              overflow: 'hidden',
              height: '100%'
            }}
          >
            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: '#ECFDF5', color: '#0F766E', width: 36, height: 36 }}>
                <CalendarIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#0F172A', fontFamily: 'Outfit, sans-serif', fontSize: '1.05rem' }}>
                Instalment Schedule
              </Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 380 }}>
              <Table size="small" stickyHeader>
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#475569', fontWeight: 800, fontSize: '0.75rem', py: 1.2, letterSpacing: 0.5 }}>INSTALMENT</TableCell>
                    <TableCell sx={{ color: '#475569', fontWeight: 800, fontSize: '0.75rem', py: 1.2, letterSpacing: 0.5 }}>DUE DATE</TableCell>
                    <TableCell align="right" sx={{ color: '#475569', fontWeight: 800, fontSize: '0.75rem', py: 1.2, letterSpacing: 0.5 }}>AMOUNT</TableCell>
                    <TableCell align="center" sx={{ color: '#475569', fontWeight: 800, fontSize: '0.75rem', py: 1.2, letterSpacing: 0.5 }}>STATUS</TableCell>
                    <TableCell align="center" sx={{ color: '#475569', fontWeight: 800, fontSize: '0.75rem', py: 1.2, letterSpacing: 0.5 }}>PAID DATE</TableCell>
                    <TableCell align="right" sx={{ color: '#475569', fontWeight: 800, fontSize: '0.75rem', py: 1.2, letterSpacing: 0.5 }}>PAID</TableCell>
                    <TableCell align="center" sx={{ color: '#475569', fontWeight: 800, fontSize: '0.75rem', py: 1.2 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.instalments?.map((item, index) => {
                    const statusKey = (item.status || 'pending').toLowerCase();
                    
                    const statusConfig = {
                      paid: { label: 'PAID', bgcolor: '#DCFCE7', color: '#15803D', border: '#BBF7D0' },
                      pending: { label: 'PENDING', bgcolor: '#F8FAFC', color: '#64748B', border: '#E2E8F0' },
                      partial: { label: 'PARTIAL', bgcolor: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
                      overdue: { label: 'OVERDUE', bgcolor: '#FEE2E2', color: '#B91C1C', border: '#FECACA' },
                      waived: { label: 'WAIVED', bgcolor: '#F3E8FF', color: '#6B21A8', border: '#E9D5FF' }
                    };

                    const cfg = statusConfig[statusKey] || statusConfig.pending;

                    return (
                      <TableRow key={index} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                        <TableCell sx={{ color: '#0F172A', fontWeight: 800, fontSize: '0.85rem', py: 1, fontFamily: 'Outfit, sans-serif' }}>
                          Month {item.instalmentNumber}
                        </TableCell>
                        <TableCell sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.82rem', py: 1 }}>
                          {item.dueDate ? format(new Date(item.dueDate), 'dd MMM yyyy') : '—'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#0F172A', fontWeight: 800, fontSize: '0.85rem', py: 1, fontFamily: 'Outfit, sans-serif' }}>
                          ৳{(item.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell align="center" sx={{ py: 1 }}>
                          <Chip 
                            label={cfg.label} 
                            size="small" 
                            sx={{ 
                              height: '22px', 
                              fontSize: '0.65rem', 
                              fontWeight: 800,
                              borderRadius: '6px',
                              bgcolor: cfg.bgcolor,
                              color: cfg.color,
                              border: `1px solid ${cfg.border}`,
                              px: 0.5,
                              letterSpacing: 0.5
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.82rem', py: 1 }}>
                          {item.paidDate ? format(new Date(item.paidDate), 'dd MMM yyyy') : '—'}
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1 }}>
                          {item.paidAmount > 0 ? (
                            <Typography sx={{ color: '#059669', fontWeight: 800, fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif' }}>
                              ৳{(item.paidAmount || 0).toLocaleString()}
                            </Typography>
                          ) : (
                            <Typography sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.82rem', fontFamily: 'Outfit, sans-serif' }}>
                              ৳0
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ py: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                            <Tooltip title="Collect / Quick Pay">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCollectClick(item)} 
                                sx={{ 
                                  color: '#16A34A', 
                                  bgcolor: '#F0FDF4', 
                                  border: '1px solid #DCFCE7', 
                                  '&:hover': { bgcolor: '#DCFCE7' }, 
                                  p: 0.6,
                                  borderRadius: '8px'
                                }}
                              >
                                <CreditCardIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Edit Instalment">
                              <IconButton 
                                size="small" 
                                onClick={() => handleOpenEditModal(item)} 
                                sx={{ 
                                  color: '#0284C7', 
                                  bgcolor: '#F0F9FF', 
                                  border: '1px solid #BAE6FD', 
                                  '&:hover': { bgcolor: '#E0F2FE' }, 
                                  p: 0.6,
                                  borderRadius: '8px'
                                }}
                              >
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Financial Summary */}
        <Grid item xs={12} md={6}>
          <Card 
            elevation={0}
            sx={{
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              height: '100%'
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'rgba(15,118,110,0.1)', color: '#0F766E', width: 32, height: 32 }}>
                <MonetizationOnIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
                Financial Summary
              </Typography>
            </Box>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>Subtotal</Typography>
                  <Typography variant="body2" fontWeight={600} color="#334155">৳{(invoice.subtotal || 0).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>Discount</Typography>
                  <Typography variant="body2" fontWeight={600} color="#334155">৳{(invoice.discount || 0).toLocaleString()}</Typography>
                </Box>
                <Divider sx={{ borderStyle: 'dashed', my: 0.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>Total EMI Interest</Typography>
                  <Typography variant="body2" fontWeight={600} color="#D97706">৳{(invoice.emiPlan?.interestAmount || 0).toLocaleString()}</Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight={700} color="#0F172A">Total (Gross)</Typography>
                  <Typography variant="body2" fontWeight={800} color="#0F766E">৳{(invoice.totalAmount || 0).toLocaleString()}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Information */}
        <Grid item xs={12} md={6}>
          <Card 
            elevation={0}
            sx={{
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              height: '100%'
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'rgba(15,118,110,0.1)', color: '#0F766E', width: 32, height: 32 }}>
                <PaymentIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
                Payment Information
              </Typography>
            </Box>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>Down Payment</Typography>
                  <Typography variant="body2" fontWeight={700} color="#059669">৳{(invoice.downPayment?.amount || 0).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>Total EMI Payable</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0F172A">৳{(invoice.emiPlan?.totalPayableAmount || invoice.totalAmount || 0).toLocaleString()}</Typography>
                </Box>
                <Divider sx={{ borderStyle: 'dashed', my: 0.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight={700} color="#0F172A">Due Amount (Remaining)</Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight={800} 
                    color={invoice.outstandingBalance > 0 ? 'error.main' : 'success.main'}
                  >
                    ৳{(invoice.outstandingBalance || 0).toLocaleString()}
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>Note</Typography>
                  <Typography variant="caption" fontWeight={500} color="#64748B" align="right" sx={{ maxWidth: '70%' }}>
                    {invoice.notes || 'None'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Print Modal Component */}
      <PrintInvoiceModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        saleId={id}
        sourceType="emi"
      />
      {collectionModalOpen && selectedInstallment && (
        <EMICollectionModal
          open={collectionModalOpen}
          onClose={() => setCollectionModalOpen(false)}
          installment={selectedInstallment}
          onSuccess={() => { queryClient.invalidateQueries(['emi-invoice', id]); setCollectionModalOpen(false); }}
        />
      )}
      {editInstalmentModalOpen && selectedInstalmentToEdit && (
        <EditInstalmentModal
          open={editInstalmentModalOpen}
          onClose={() => setEditInstalmentModalOpen(false)}
          invoice={invoice}
          instalment={selectedInstalmentToEdit}
          onSuccess={() => {
            queryClient.invalidateQueries(['emi-invoice', id]);
            setEditInstalmentModalOpen(false);
          }}
        />
      )}
    </Box>
  );
};

export default EMISaleDetail;
