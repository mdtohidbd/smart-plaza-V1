import React, { useState } from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Search as SearchIcon,
  CheckCircle as SuccessIcon,
  Cancel as FailedIcon,
  Schedule as PendingIcon
} from '@mui/icons-material';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const PaymentHistory = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: payments, isLoading } = useQuery(
    ['userPayments', user?._id],
    async () => {
      const response = await api.get('/api/payments/my-payments');
      return response.data.data;
    },
    {
      enabled: !!user,
      refetchOnWindowFocus: false
    }
  );

  // Filter payments based on search
  const filteredPayments = payments?.filter(payment =>
    payment.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Calculate totals
  const totalPaid = payments?.reduce((sum, p) => sum + (p.status === 'success' ? p.amount : 0), 0) || 0;
  const pendingAmount = payments?.reduce((sum, p) => sum + (p.status === 'pending' ? p.amount : 0), 0) || 0;
  const totalTransactions = payments?.length || 0;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

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
          <PaymentIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Box>
            <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700 }}>
              Payment History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View all your transactions
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 1 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Total Paid
              </Typography>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                ৳{totalPaid.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 1 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Pending Payments
              </Typography>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                ৳{pendingAmount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 1 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Total Transactions
              </Typography>
              <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700 }}>
                {totalTransactions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
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
        <TextField
          fullWidth
          placeholder="Search by invoice number or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
              bgcolor: 'background.default'
            }
          }}
        />
      </Paper>

      {/* Payment Table */}
      <Paper
        sx={{
          bgcolor: 'background.paper',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          boxShadow: 'none',
          overflow: 'hidden'
        }}
      >
        {filteredPayments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <PaymentIcon color="action" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No payments found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'Try a different search term' : 'Your payment history will appear here'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Invoice #</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Method</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow
                    key={payment._id}
                    sx={{
                      '&:hover': { bgcolor: 'background.default' },
                      borderBottom: (theme) => `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <TableCell sx={{ color: 'text.primary' }}>
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary', fontWeight: 600 }}>
                      {payment.invoiceNumber || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>
                      {payment.description || 'Payment'}
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary', textTransform: 'capitalize' }}>
                      {payment.method || payment.paymentMethod || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary', fontWeight: 700 }}>
                      ৳{payment.amount?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={
                          payment.status === 'success' ? <SuccessIcon /> :
                          payment.status === 'failed' ? <FailedIcon /> :
                          <PendingIcon />
                        }
                        label={payment.status?.toUpperCase()}
                        color={
                          payment.status === 'success' ? 'success' :
                          payment.status === 'failed' ? 'error' :
                          'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default PaymentHistory;
