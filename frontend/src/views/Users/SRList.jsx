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

const SRList = () => {
  const [srs, setSrs] = useState([]);
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
          const srUsers = usersRes.data.data.filter(u => u.role === 'SR');
          setSrs(srUsers);
        }
        
        if (routesRes.data?.success) {
          setRoutes(routesRes.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch SRs:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getRouteForSR = (srId) => {
    const route = routes.find(r => r.assignedSR && r.assignedSR._id === srId);
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
          Sales Representatives (SR)
        </Typography>
        <Typography variant="body2" color="#64748B">
          Manage your field sales force and their assigned routes.
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
            {srs.length > 0 ? (
              srs.map((sr) => (
                <TableRow key={sr._id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{sr.name}</TableCell>
                  <TableCell>{sr.email}</TableCell>
                  <TableCell>{sr.phone || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getRouteForSR(sr._id)} 
                      size="small"
                      color={getRouteForSR(sr._id) === 'Unassigned' ? 'default' : 'primary'}
                      variant={getRouteForSR(sr._id) === 'Unassigned' ? 'outlined' : 'filled'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={sr.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={sr.isActive ? 'success' : 'error'}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: '#64748B' }}>
                  No Sales Representatives found. Create a user with role "SR".
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SRList;

