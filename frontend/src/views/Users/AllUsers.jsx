import React, { useState, useMemo } from 'react';
import { Typography, Box, Paper, CircularProgress, Alert, Grid, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Chip, Skeleton, TablePagination } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';

const AllUsers = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const { data: users, isLoading, error } = useQuery(
    'users',
    async () => {
      const response = await api.get('/api/users');
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  const { data: rolesData } = useQuery(
    'roles',
    async () => {
      const response = await api.get('/api/roles');
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  // State for selected roles (toggleable pills)
  const [selectedRoles, setSelectedRoles] = useState(new Set());

  // Toggle role selection
  const toggleRole = (roleName) => {
    const newSelectedRoles = new Set(selectedRoles);
    if (newSelectedRoles.has(roleName)) {
      newSelectedRoles.delete(roleName);
    } else {
      newSelectedRoles.add(roleName);
    }
    setSelectedRoles(newSelectedRoles);
    setPage(0);
  };

  // Filter users based on selected roles
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (selectedRoles.size === 0) return users;
    return users.filter(user => selectedRoles.has(user.role));
  }, [users, selectedRoles]);

  // Extract unique role names from users or roles data
  const uniqueRoles = useMemo(() => {
    if (rolesData && rolesData.length > 0) {
      return rolesData.map(role => role.name);
    }
    // Fallback to users' roles if rolesData is empty
    if (users && users.length > 0) {
      return [...new Set(users.map(user => user.role))];
    }
    return [];
  }, [rolesData, users]);

  // State for user form dialog
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Sales Staff',
    address: '',
    isActive: true
  });

  // State for password dialog
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Mutations for user operations
  const createUserMutation = useMutation(
    (userData) => api.post('/api/users', userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        handleCloseUserDialog();
        alert('User created successfully!');
      },
      onError: (error) => {
        console.error('Error creating user:', error);
        alert('Error creating user: ' + error.response?.data?.message || error.message);
      }
    }
  );

  const updateUserMutation = useMutation(
    ({ id, data }) => api.put(`/api/users/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        handleCloseUserDialog();
        alert('User updated successfully!');
      },
      onError: (error) => {
        console.error('Error updating user:', error);
        alert('Error updating user: ' + error.response?.data?.message || error.message);
      }
    }
  );

  const deleteUserMutation = useMutation(
    (id) => api.delete(`/api/users/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        alert('User deleted successfully!');
      },
      onError: (error) => {
        console.error('Error deleting user:', error);
        alert('Error deleting user: ' + error.response?.data?.message || error.message);
      }
    }
  );

  // Functions for user dialog
  const handleOpenUserDialog = (user = null) => {
    if (user) {
      setCurrentUser(user);
      setUserFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address || '',
        isActive: user.isActive
      });
    } else {
      setCurrentUser(null);
      setUserFormData({
        name: '',
        email: '',
        phone: '',
        role: 'Sales Staff',
        address: '',
        isActive: true
      });
    }
    setOpenUserDialog(true);
  };

  const handleCloseUserDialog = () => {
    setOpenUserDialog(false);
    setCurrentUser(null);
  };

  const handleUserInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserFormData({
      ...userFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();

    if (currentUser) {
      updateUserMutation.mutate({ id: currentUser._id, data: userFormData });
    } else {
      createUserMutation.mutate(userFormData);
    }
  };

  const handleDeleteUser = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleOpenPasswordDialog = (user) => {
    setCurrentUser(user);
    setPasswordFormData({ newPassword: '', confirmPassword: '' });
    setOpenPasswordDialog(true);
  };

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
    if (!openUserDialog) {
      setCurrentUser(null);
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData({
      ...passwordFormData,
      [name]: value
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (passwordFormData.newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    
    updateUserMutation.mutate({ 
      id: currentUser._id, 
      data: { password: passwordFormData.newPassword } 
    }, {
      onSuccess: () => {
        handleClosePasswordDialog();
      }
    });
  };

  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Error loading users: {error.message}</Alert>
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
            sx={{
              p: { xs: 1.5, sm: 2 },
              mb: 1.5,
              border: '1px solid #e2e8f0',
              boxShadow: 'none',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 700, fontSize: '1.3rem' }}>
                  All Users
                </Typography>
              </Box>
              <Button
                variant="contained"
                onClick={() => handleOpenUserDialog()}
                sx={{
                  backgroundColor: '#0f172a',
                  '&:hover': {
                    backgroundColor: '#1e293b'
                  },
                  borderRadius: '8px',
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  boxShadow: 'none',
                  height: 40,
                }}
              >
                Add User
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          {/* Role Pills */}
          <Paper sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: 'none', mb: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {uniqueRoles.map((role) => (
                <Chip
                  key={role}
                  label={role}
                  onClick={() => toggleRole(role)}
                  color={selectedRoles.has(role) ? 'primary' : 'default'}
                  variant={selectedRoles.has(role) ? 'filled' : 'outlined'}
                  sx={{
                    borderRadius: '8px',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    py: 0.5,
                    px: 1,
                    '&:hover': {
                      opacity: 0.9
                    }
                  }}
                />
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          {/* Minimal List View */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {isLoading ? (
              [1, 2, 3].map((item) => (
                <Paper key={item} sx={{ p: { xs: 1.5, sm: 2 }, border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: 'none', bgcolor: '#fff' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexGrow: 1 }}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Skeleton variant="text" width="30%" height={24} />
                        <Skeleton variant="text" width="50%" height={18} />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Skeleton variant="circular" width={28} height={28} />
                      <Skeleton variant="circular" width={28} height={28} />
                      <Skeleton variant="circular" width={28} height={28} />
                    </Box>
                  </Box>
                </Paper>
              ))
            ) : paginatedUsers?.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '12px', boxShadow: 'none', bgcolor: '#f8fafc' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                  {selectedRoles.size === 0 ? 'No users found' : 'No users found for selected roles'}
                </Typography>
              </Paper>
            ) : (
              paginatedUsers?.map((userItem) => (
                <Paper key={userItem._id} sx={{
                  p: { xs: 1.5, sm: 2 },
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: 'none',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    bgcolor: '#fafafa'
                  }
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {userItem.name.charAt(0).toUpperCase()}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>
                          {userItem.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.25 }}>
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                            {userItem.email}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                            •
                          </Typography>
                          <Chip
                            label={userItem.role}
                            size="small"
                            variant="filled"
                            sx={{
                              bgcolor: '#f1f5f9',
                              color: '#475569',
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              height: 22
                            }}
                          />
                          <Chip
                            label={userItem.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            variant="filled"
                            sx={{
                              bgcolor: userItem.isActive ? '#d1fae5' : '#fee2e2',
                              color: userItem.isActive ? '#065f46' : '#991b1b',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 22
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexShrink: 0 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenPasswordDialog(userItem)}
                        title="Change Password"
                        sx={{ color: '#64748b', '&:hover': { color: '#ea580c', bgcolor: '#fff7ed' } }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                        </svg>
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenUserDialog(userItem)}
                        title="Edit User"
                        sx={{ color: '#64748b', '&:hover': { color: '#0f172a', bgcolor: '#f1f5f9' } }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUser(userItem._id)}
                        sx={{ color: '#64748b', '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' } }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              ))
            )}
          </Box>

          {/* Pagination */}
          {!isLoading && filteredUsers?.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                mt: 2,
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                bgcolor: '#fff',
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: '0.825rem',
                }
              }}
            />
          )}
        </Grid>
      </Grid>

      {/* User Form Dialog */}
      <Dialog open={openUserDialog} onClose={handleCloseUserDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <form onSubmit={handleUserSubmit}>
          <DialogContent>
            <Grid container spacing={1.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={userFormData.name}
                  onChange={handleUserInputChange}
                  margin="normal"
                  required
                  inputProps={{ maxLength: 50 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={userFormData.email}
                  onChange={handleUserInputChange}
                  margin="normal"
                  required
                  inputProps={{ maxLength: 100 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={userFormData.phone}
                  onChange={handleUserInputChange}
                  margin="normal"
                  required
                  inputProps={{ maxLength: 20 }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    value={userFormData.role}
                    onChange={handleUserInputChange}
                    label="Role"
                  >
                    {rolesData?.map((role) => (
                      <MenuItem key={role._id} value={role.name}>
                        {role.name} {role.name === 'SR' ? '(Sales Representative)' : ''}
                      </MenuItem>
                    )) || [
                        <MenuItem key="sales-staff" value="Sales Staff">Sales Staff</MenuItem>,
                        <MenuItem key="ecommerce-admin" value="E-Commerce Admin">E-Commerce Admin</MenuItem>
                      ]}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={userFormData.address}
                  onChange={handleUserInputChange}
                  margin="normal"
                  multiline
                  rows={2}
                  inputProps={{ maxLength: 200 }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="isActive"
                      checked={userFormData.isActive}
                      onChange={(e) => {
                        const { name, checked } = e.target;
                        setUserFormData({
                          ...userFormData,
                          [name]: checked
                        });
                      }}
                    />
                  }
                  label="Active"
                  labelPlacement="end"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUserDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createUserMutation.isLoading || updateUserMutation.isLoading}
              sx={{
                backgroundColor: '#28A745',
                '&:hover': {
                  backgroundColor: '#218838'
                }
              }}
            >
              {createUserMutation.isLoading || updateUserMutation.isLoading ? 'Saving...' : currentUser ? 'Update User' : 'Create User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={openPasswordDialog} onClose={handleClosePasswordDialog} maxWidth="xs" fullWidth>
        <DialogTitle>
          Change Password {currentUser && `for ${currentUser.name}`}
        </DialogTitle>
        <form onSubmit={handlePasswordSubmit}>
          <DialogContent>
            <Grid container spacing={1.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={passwordFormData.newPassword}
                  onChange={handlePasswordInputChange}
                  margin="normal"
                  required
                  inputProps={{ minLength: 6 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  margin="normal"
                  required
                  inputProps={{ minLength: 6 }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePasswordDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updateUserMutation.isLoading}
              sx={{
                backgroundColor: '#ea580c',
                '&:hover': {
                  backgroundColor: '#c2410c'
                }
              }}
            >
              {updateUserMutation.isLoading ? 'Saving...' : 'Update Password'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AllUsers;