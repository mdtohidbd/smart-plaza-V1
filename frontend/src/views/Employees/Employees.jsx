import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  InputAdornment,
  TextField,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  Grid,
  Avatar,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  TrendingUp as TrendingUpIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const PerformanceCell = ({ employeeId }) => {
  const { data: performanceData, isLoading } = useQuery(
    ['employeePerformance', employeeId],
    async () => {
      const response = await api.get(`/api/users/${employeeId}/performance`);
      return response.data.data;
    },
    {
      staleTime: 60000,
    }
  );

  if (isLoading) return <CircularProgress size={16} />;
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography sx={{ fontSize: '0.75rem', color: '#475569' }}>
        Sales: {performanceData?.salesCount || 0}
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
        Rev: ৳{(performanceData?.totalRevenue || 0).toLocaleString('en-US')}
      </Typography>
    </Box>
  );
};

const Employees = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeIdToDelete, setEmployeeIdToDelete] = useState(null);

  // Fetch employees (users)
  const { data: employeesData, isLoading, isError } = useQuery('employees', async () => {
    const response = await api.get('/api/users');
    // Filter out typical non-employee roles if necessary. Assuming all fetched users are staff.
    return response.data.data.filter(u => 
      u.role !== 'Online Customer' && 
      u.role !== 'Customer' &&
      u.role !== 'Investor' &&
      u.role !== 'Super Admin' &&
      u.approvalStatus === 'Approved'
    );
  });

  // Delete mutation
  const deleteEmployeeMutation = useMutation(
    (id) => api.delete(`/api/users/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('employees');
        setDeleteDialogOpen(false);
      }
    }
  );

  // Toggle status mutation
  const toggleStatusMutation = useMutation(
    ({ id, isActive }) => api.put(`/api/users/${id}/approve`, { isActive }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('employees');
      }
    }
  );

  const handleDeleteClick = (id) => {
    setEmployeeIdToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = (employee) => {
    toggleStatusMutation.mutate({ id: employee._id, isActive: !employee.isActive });
  };

  const filteredEmployees = useMemo(() => {
    const employees = employeesData || [];
    if (!searchTerm.trim()) return employees;
    const term = searchTerm.toLowerCase();
    const filtered = employees.filter((emp) =>
      emp.name?.toLowerCase().includes(term) ||
      emp.phone?.toLowerCase().includes(term) ||
      emp.email?.toLowerCase().includes(term) ||
      emp.role?.toLowerCase().includes(term)
    );
    return filtered.sort((a, b) => {
      const matchWord = (str) => (str || '').toLowerCase().split(/\s+/).some(w => w.startsWith(term));
      const aStarts = matchWord(a.name) || matchWord(a.phone);
      const bStarts = matchWord(b.name) || matchWord(b.phone);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
  }, [employeesData, searchTerm]);

  const getRoleColor = (role) => {
    switch (role) {
      case 'Super Admin': return 'error';
      case 'Admin': return 'warning';
      case 'Manager': return 'info';
      case 'Sales Staff': return 'success';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Failed to load employees data.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 1, sm: 2 }, backgroundColor: '#F8FAFC' }}>
      {/* Header section */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #E2E8F0', borderRadius: '10px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B', fontFamily: '"Outfit", sans-serif' }}>
              Employee Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontFamily: '"Outfit", sans-serif' }}>
              Manage staff roles, performance, and system access.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94A3B8' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: '8px', bgcolor: '#F8FAFC' }
              }}
            />
            {/* Add Employee routing (requires AddEmployee.jsx or similar) */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/dashboard/employees/add')}
              sx={{
                bgcolor: '#1D5F99',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(29, 95, 153, 0.2)',
                '&:hover': { bgcolor: '#42A2C2' }
              }}
            >
              Add Employee
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Desktop Table View */}
      <TableContainer component={Paper} elevation={0} sx={{ display: { xs: 'none', md: 'block' }, border: '1px solid #E2E8F0', borderRadius: '10px' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Performance</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Joined</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', textAlign: 'center' }}>Active</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569', textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.9rem' }}>
                      {employee.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: '#475569', mt: 0.5 }}>{employee.phone}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8' }}>{employee.email}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={employee.role} color={getRoleColor(employee.role)} size="small" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                </TableCell>
                <TableCell>
                  <PerformanceCell employeeId={employee._id} />
                </TableCell>
                <TableCell sx={{ fontSize: '0.85rem', color: '#475569' }}>
                  {new Date(employee.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="center">
                  <Switch 
                    size="small"
                    checked={employee.isActive} 
                    onChange={() => handleToggleStatus(employee)} 
                    color="primary"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => navigate(`/dashboard/employees/edit/${employee._id}`)} sx={{ color: '#1D5F99', mr: 0.5 }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteClick(employee._id)} sx={{ color: '#EF4444' }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredEmployees.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#64748B' }}>
                  No employees found matching the search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this employee? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#64748B' }}>Cancel</Button>
          <Button 
            onClick={() => deleteEmployeeMutation.mutate(employeeIdToDelete)} 
            color="error" 
            variant="contained"
            disabled={deleteEmployeeMutation.isLoading}
          >
            {deleteEmployeeMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;
