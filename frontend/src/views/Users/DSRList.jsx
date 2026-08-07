import React, { useState, useEffect } from 'react';
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
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import api from '../../utils/api';

const DSRList = () => {
  const [dsrs, setDsrs] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch users and routes in parallel
        const [usersRes, routesRes] = await Promise.all([
          api.get('/api/users'),
          api.get('/api/routes')
        ]);
        
        if (usersRes.data?.success) {
          const dsrUsers = usersRes.data.data.filter(u => u.role === 'DSR');
          setDsrs(dsrUsers);
        }
        
        if (routesRes.data?.success) {
          setRoutes(routesRes.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch DSRs:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getRouteForDSR = (dsrId) => {
    const route = routes.find(r => r.assignedSR && r.assignedSR._id === dsrId);
    return route ? route.name : 'Unassigned';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#1E293B">
          Distributor Sales Representatives (DSR)
        </Typography>
        <Typography variant="body2" color="#64748B">
          Manage your distributor-level sales force and their assigned routes.
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: 'none', border: '1px solid #E2E8F0' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Assigned Route</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dsrs.length > 0 ? (
              dsrs.map((dsr) => (
                <TableRow key={dsr._id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{dsr.name}</TableCell>
                  <TableCell>{dsr.email}</TableCell>
                  <TableCell>{dsr.phone || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getRouteForDSR(dsr._id)} 
                      size="small"
                      color={getRouteForDSR(dsr._id) === 'Unassigned' ? 'default' : 'secondary'}
                      variant={getRouteForDSR(dsr._id) === 'Unassigned' ? 'outlined' : 'filled'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={dsr.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={dsr.isActive ? 'success' : 'error'}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: '#64748B' }}>
                  No Distributor Sales Representatives found. Create a user with role "DSR".
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DSRList;

