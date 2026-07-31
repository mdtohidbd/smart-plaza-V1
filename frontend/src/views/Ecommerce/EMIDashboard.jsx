import React from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  CalendarToday as CalendarIcon,
  Payments as PaymentIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EMIDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch user's EMI invoices
  const { data: emiData, isLoading } = useQuery(
    ['userEMI', user?._id],
    async () => {
      const response = await api.get('/api/emi-invoices/my-emis');
      return response.data.data;
    },
    {
      enabled: !!user,
      refetchOnWindowFocus: false,
      refetchInterval: 30000 // Refresh every 30 seconds
    }
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const upcomingPayments = emiData?.upcomingPayments || [];
  const activeInvoices = emiData?.activeInvoices || [];
  const totalOutstanding = emiData?.totalOutstanding || 0;
  const nextPaymentDate = upcomingPayments[0]?.dueDate;
  const nextPaymentAmount = upcomingPayments[0]?.amount || 0;

  return (
    <Box sx={{ py: 2 }}>
      {/* Header */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          bgcolor: 'background.paper',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          boxShadow: 'none'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CreditCardIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Box>
            <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700 }}>
              EMI Payments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your installment payments
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 1 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PaymentIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Outstanding
                </Typography>
              </Box>
              <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700 }}>
                ৳{totalOutstanding.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 1 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Next Payment Date
                </Typography>
              </Box>
              <Typography variant="h5" color="text.primary" sx={{ fontWeight: 700 }}>
                {nextPaymentDate ? new Date(nextPaymentDate).toLocaleDateString() : 'N/A'}
              </Typography>
              {nextPaymentAmount > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Amount: ৳{nextPaymentAmount.toLocaleString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 1 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CreditCardIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Active Invoices
                </Typography>
              </Box>
              <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700 }}>
                {activeInvoices.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upcoming Payments */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          bgcolor: 'background.paper',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          boxShadow: 'none'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
            Upcoming Payments
          </Typography>
          {upcomingPayments.length > 0 && (
            <Chip
              label={`${upcomingPayments.length} pending`}
              color="warning"
              size="small"
            />
          )}
        </Box>

        {upcomingPayments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <PaymentIcon color="action" sx={{ fontSize: 60, mb: 2 }} />
            <Typography color="text.secondary">
              No upcoming payments
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Invoice #</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Due Date</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {upcomingPayments.map((payment) => (
                  <TableRow key={payment._id} sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                    <TableCell sx={{ color: 'text.primary' }}>{payment.invoiceNumber}</TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>
                      {new Date(payment.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary', fontWeight: 600 }}>
                      ৳{payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status}
                        color={
                          payment.status === 'paid' ? 'success' :
                          payment.status === 'overdue' ? 'error' :
                          'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={payment.status === 'paid'}
                        onClick={() => navigate(`/shop/payments/${payment._id}`)}
                      >
                        Pay Now
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Active Invoices */}
      <Paper
        sx={{
          p: 3,
          bgcolor: 'background.paper',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          boxShadow: 'none'
        }}
      >
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700, mb: 3 }}>
          Active EMI Invoices
        </Typography>

        {activeInvoices.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CreditCardIcon color="action" sx={{ fontSize: 60, mb: 2 }} />
            <Typography color="text.secondary">
              No active EMI invoices
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {activeInvoices.map((invoice) => (
              <Grid item xs={12} md={6} key={invoice._id}>
                <Card sx={{ bgcolor: 'background.default', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 600 }}>
                        {invoice.invoiceNumber}
                      </Typography>
                      <Chip
                        label={invoice.status}
                        color={invoice.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Amount:
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                        ৳{invoice.totalAmount?.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Paid:
                      </Typography>
                      <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                        ৳{invoice.paidAmount?.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Remaining:
                      </Typography>
                      <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                        ৳{(invoice.totalAmount - invoice.paidAmount)?.toLocaleString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default EMIDashboard;
