import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { Security, Warning, CheckCircle, HelpOutline } from '@mui/icons-material';
import api from '../../utils/api';

const FraudCheckerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, alertsRes] = await Promise.all([
        api.get('/api/v1/fraud-checker/stats'),
        api.get('/api/v1/fraud-checker/alerts')
      ]);
      setStats(statsRes.data.data);
      setRecentAlerts(alertsRes.data.data || []);
    } catch (err) {
      console.error('Error fetching fraud checker data:', err);
      setError('Failed to load fraud checker data');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      case 'NEW': return 'info';
      default: return 'default';
    }
  };

  if (loading) return <Box p={3} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Box p={3}><Alert severity="error">{error}</Alert></Box>;

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Security color="primary" />
        Fraud Detection Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'primary.main' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Checked</Typography>
              <Typography variant="h4">{stats?.totalChecked || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'error.main' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>High Risk</Typography>
              <Typography variant="h4" color="error.main">{stats?.highRisk || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Medium Risk</Typography>
              <Typography variant="h4" color="warning.main">{stats?.mediumRisk || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'success.main' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Low Risk</Typography>
              <Typography variant="h4" color="success.main">{stats?.lowRisk || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts Table */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Recent High & Medium Risk Alerts
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order Number</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Phone Number</TableCell>
              <TableCell>Risk Level</TableCell>
              <TableCell>Success Ratio</TableCell>
              <TableCell>Recommendation</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentAlerts.length > 0 ? recentAlerts.map((order) => (
              <TableRow key={order._id}>
                <TableCell>{order.orderNumber}</TableCell>
                <TableCell>{order.customer?.contactName || 'N/A'}</TableCell>
                <TableCell>{order.fraudCheck?.phoneNumber}</TableCell>
                <TableCell>
                  <Chip 
                    label={order.fraudCheck?.riskLevel} 
                    color={getRiskColor(order.fraudCheck?.riskLevel)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{order.fraudCheck?.successRatio}%</TableCell>
                <TableCell>{order.fraudCheck?.recommendation}</TableCell>
                <TableCell>
                  <Button variant="outlined" size="small" href={`/dashboard/sales-orders/${order._id}`}>
                    View Order
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} align="center">No recent high or medium risk alerts found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FraudCheckerDashboard;
