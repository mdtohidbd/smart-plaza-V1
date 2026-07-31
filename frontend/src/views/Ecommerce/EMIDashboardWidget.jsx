import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Button,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  Assignment,
  CheckCircle,
  Warning,
  Visibility,
  Payment
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5001/api';

const EMIDashboardWidget = () => {
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);

  useEffect(() => {
    fetchEMIData();
  }, []);

  const fetchEMIData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch overview and recent invoices in parallel
      const [overviewRes, invoicesRes, overdueRes] = await Promise.all([
        axios.get(`${API_URL}/emi/receivable-overview`, config),
        axios.get(`${API_URL}/emi/invoices?limit=5&sortBy=createdAt&sortOrder=-1`, config),
        axios.get(`${API_URL}/emi/reports?type=overdue&limit=5`, config)
      ]);

      setOverviewData(overviewRes.data.data);
      setRecentInvoices(invoicesRes.data.data || []);
      setOverdueInvoices(Array.isArray(overdueRes.data.data) ? overdueRes.data.data.slice(0, 5) : []);
    } catch (error) {
      console.error('Error fetching EMI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'primary';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'defaulted': return 'error';
      default: return 'default';
    }
  };

  const getInstalmentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partial': return 'warning';
      case 'overdue': return 'error';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      {/* Section Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          EMI Management
        </Typography>
        <Button 
          variant="outlined" 
          size="small"
          onClick={() => window.location.href = '/dashboard/emi'}
        >
          View All
        </Button>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Total EMI Invoices */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assignment sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total EMI Invoices
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {overviewData?.totalInvoices || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {overviewData?.activeCustomersCount || 0} Active Customers
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Amount */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceWallet sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total EMI Amount
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                ৳{(overviewData?.totalAmount || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Collected */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Collected
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                ৳{(overviewData?.totalCollected || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {overviewData?.collectionRate?.toFixed(1) || 0}% Collection Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Outstanding Balance */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingDown sx={{ color: 'error.main', mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Outstanding Balance
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                ৳{(overviewData?.totalOutstanding || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="error.main">
                {overviewData?.overdueInvoices || 0} Overdue
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent EMI Invoices and Overdue */}
      <Grid container spacing={3}>
        {/* Recent Invoices */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Recent EMI Sales
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentInvoices.map((invoice) => (
                      <TableRow key={invoice._id}>
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>৳{invoice.emiPlan?.totalPayableAmount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={invoice.status}
                            color={getStatusColor(invoice.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Overdue Invoices */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'error.main' }}>
                Overdue Invoices
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Due</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {overdueInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No overdue invoices
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      overdueInvoices.map((invoice) => {
                        const overdueInstalment = invoice.instalments?.find(
                          inst => inst.status === 'pending' || inst.status === 'partial'
                        );
                        return (
                          <TableRow key={invoice._id}>
                            <TableCell>{invoice.invoiceNumber}</TableCell>
                            <TableCell>{invoice.customerName}</TableCell>
                            <TableCell>
                              ৳{(overdueInstalment?.amount - overdueInstalment?.paidAmount)?.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label="Overdue"
                                color="error"
                                size="small"
                                icon={<Warning />}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Collection Progress */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Collection Progress Overview
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Collected</Typography>
              <Typography variant="body2" fontWeight="bold">
                ৳{(overviewData?.totalCollected || 0).toLocaleString()} / ৳{(overviewData?.totalAmount || 0).toLocaleString()}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(overviewData?.collectionRate || 0)}
              sx={{ height: 10, borderRadius: 5 }}
              color={overviewData?.collectionRate > 75 ? 'success' : overviewData?.collectionRate > 50 ? 'warning' : 'error'}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {overviewData?.collectionRate?.toFixed(1) || 0}% of total amount collected
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EMIDashboardWidget;
