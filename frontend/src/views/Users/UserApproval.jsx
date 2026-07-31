import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Check, Close, Visibility } from '@mui/icons-material';
import api from '../../utils/api';
import RequirePermission from '../../components/RequirePermission';

const UserApproval = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'

  // Wrap the entire component with permission check
  return (
    <RequirePermission
      module="users"
      action="update"
    >
      <UserApprovalContent
        queryClient={queryClient}
        selectedUser={selectedUser}
        dialogOpen={dialogOpen}
        actionType={actionType}
        setDialogOpen={setDialogOpen}
        setActionType={setActionType}
        setSelectedUser={setSelectedUser}
      />
    </RequirePermission>
  );
};

// Extract content to separate component to avoid re-renders
const UserApprovalContent = ({
  queryClient,
  selectedUser,
  dialogOpen,
  actionType,
  setDialogOpen,
  setActionType,
  setSelectedUser
}) => {
  const [assignedRole, setAssignedRole] = useState('Sales Staff');

  // Fetch pending users
  const { data: users, isLoading, error, refetch } = useQuery(
    'users-all',
    async () => {
      const response = await api.get('/api/users');
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  // Fetch available roles
  const { data: rolesData } = useQuery(
    'roles',
    async () => {
      const response = await api.get('/api/roles');
      return response.data.data;
    },
    { refetchOnWindowFocus: false }
  );

  // Filter out online customer role (automatic)
  const availableRoles = rolesData?.filter(role => role.name !== 'Online Customer') || [];

  // Filter pending users — exclude Online Customers (they are auto-approved on shop registration)
  const pendingUsers = users?.filter(user =>
    user.approvalStatus === 'Pending' &&
    user.role !== 'Online Customer'
  ) || [];

  // Approve user mutation
  const approveUserMutation = useMutation(
    ({ userId, approvalStatus, isActive, role }) =>
      api.put(`/api/users/${userId}/approve`, { approvalStatus, isActive, role }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users-all');
        setDialogOpen(false);
        setSelectedUser(null);
        refetch();
      },
      onError: (error) => {
        console.error('Error updating user status:', error);
        alert('Error updating user status: ' + (error.response?.data?.message || error.message));
      }
    }
  );

  const handleApproveClick = (user) => {
    setSelectedUser(user);
    setActionType('approve');
    setAssignedRole(user.role === 'Pending' || !user.role ? 'Sales Staff' : user.role);
    setDialogOpen(true);
  };

  const handleRejectClick = (user) => {
    setSelectedUser(user);
    setActionType('reject');
    setDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedUser) return;

    if (actionType === 'approve') {
      approveUserMutation.mutate({
        userId: selectedUser._id,
        approvalStatus: 'Approved',
        isActive: true,
        role: assignedRole
      });
    } else if (actionType === 'reject') {
      approveUserMutation.mutate({
        userId: selectedUser._id,
        approvalStatus: 'Rejected',
        isActive: false
      });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setActionType('');
  };

  const getStatusChip = (status) => {
    const colors = {
      Pending: { bg: '#FFF3E0', color: '#E65100' },
      Approved: { bg: '#E8F5E8', color: '#2E7D32' },
      Rejected: { bg: '#FFEBEE', color: '#C62828' }
    };

    const color = colors[status] || colors.Pending;

    return (
      <Chip
        label={status}
        sx={{ backgroundColor: color.bg, color: color.color, fontWeight: 600 }}
      />
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <Typography>Loading pending approvals...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Error loading users: {error.message}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 1, sm: 2 }, backgroundColor: '#F8FAFC' }}>
      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: { xs: 1.5, sm: 1.5 },
              mb: 1.5,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{
                width: 36, height: 36,
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                mr: 1.5,
                flexShrink: 0
              }}>
                UA
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 700, fontFamily: '"Outfit", sans-serif', fontSize: '1.1rem', lineHeight: 1.2, mb: 0.25 }}>
                  User Approval
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem' }}>
                  Review, assign role, and approve/reject new user registrations
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper
            sx={{
              p: 1.5,
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              borderRadius: 1,
            }}
          >
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1D5F99' }}>
                Pending Approvals ({pendingUsers.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => refetch()}
                sx={{
                  borderColor: '#1D5F99',
                  color: '#1D5F99',
                  '&:hover': {
                    borderColor: '#0d47a1',
                    backgroundColor: 'rgba(29, 95, 153, 0.04)'
                  }
                }}
              >
                Refresh
              </Button>
            </Box>

            {pendingUsers.length === 0 ? (
              <Alert severity="success" sx={{ mt: 2 }}>
                No pending user approvals! All users have been reviewed.
              </Alert>
            ) : (
              <>
                {/* Desktop Table View */}
                <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, boxShadow: 'none', border: 'none' }}>
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor: '#F8FAFC',
                          '& .MuiTableCell-head': {
                            color: '#475569',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            fontFamily: '"Outfit", sans-serif',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #eaeef3',
                            padding: '10px 16px',
                          }
                        }}
                      >
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Registration Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingUsers.map((user) => (
                        <TableRow
                          key={user._id}
                          sx={{
                            '&:nth-of-type(even)': { backgroundColor: '#f9fbfd' },
                            '&:hover': { backgroundColor: '#f0f7ff' },
                          }}
                        >
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>
                            <Chip
                              label={user.role}
                              size="small"
                              sx={{
                                backgroundColor: user.role === 'SR' ? '#E3F2FD' : '#F3E5F5',
                                color: '#1D5F99',
                                fontWeight: 600
                              }}
                            />
                          </TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>{getStatusChip(user.approvalStatus)}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDialogOpen(true);
                                  setActionType('view');
                                }}
                                sx={{ color: '#1976D2' }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                onClick={() => handleApproveClick(user)}
                                sx={{ color: '#2E7D32' }}
                              >
                                <Check />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                onClick={() => handleRejectClick(user)}
                                sx={{ color: '#C62828' }}
                              >
                                <Close />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Mobile Card List View */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mt: 1 }}>
                  {pendingUsers.map((user) => (
                    <Paper key={user._id} elevation={0} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: '12px', bgcolor: '#FFFFFF' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1E293B' }}>
                            {user.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', wordBreak: 'break-all' }}>
                            {user.email} &bull; {user.phone}
                          </Typography>
                        </Box>
                        <Box sx={{ flexShrink: 0 }}>
                          {getStatusChip(user.approvalStatus)}
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                        <Chip
                          label={user.role}
                          size="small"
                          sx={{
                            backgroundColor: user.role === 'SR' ? '#E3F2FD' : '#F3E5F5',
                            color: '#1D5F99',
                            fontWeight: 600,
                            fontSize: '0.7rem'
                          }}
                        />
                        <Chip
                          label={`Reg: ${new Date(user.createdAt).toLocaleDateString()}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Box>

                      <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedUser(user);
                            setDialogOpen(true);
                            setActionType('view');
                          }}
                          sx={{ color: '#1976D2', border: '1px solid #E2E8F0', borderRadius: '8px', p: 0.75 }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleApproveClick(user)}
                          sx={{ color: '#2E7D32', border: '1px solid #E2E8F0', borderRadius: '8px', p: 0.75 }}
                        >
                          <Check fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleRejectClick(user)}
                          sx={{ color: '#C62828', border: '1px solid #E2E8F0', borderRadius: '8px', p: 0.75 }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {selectedUser && (
          <>
            <DialogTitle sx={{ bgcolor: '#F8FAFC', color: '#1e293b', fontWeight: 600, fontSize: '1.2rem', p: 2, borderBottom: '1px solid #eaeef3' }}>
              {actionType === 'approve' && 'Approve User'}
              {actionType === 'reject' && 'Reject User'}
              {actionType === 'view' && 'User Details'}
            </DialogTitle>
            <DialogContent>
              {actionType === 'view' ? (
                <Box sx={{ pt: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Name:</Typography>
                      <Typography variant="body1">{selectedUser.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Email:</Typography>
                      <Typography variant="body1">{selectedUser.email}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Phone:</Typography>
                      <Typography variant="body1">{selectedUser.phone}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Role:</Typography>
                      <Chip label={selectedUser.role} size="small" />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Registration Date:</Typography>
                      <Typography variant="body1">
                        {new Date(selectedUser.createdAt).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Status:</Typography>
                      <Box sx={{ mt: 0.5 }}>{getStatusChip(selectedUser.approvalStatus)}</Box>
                    </Grid>
                    {selectedUser.address && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Address:</Typography>
                        <Typography variant="body1">{selectedUser.address}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              ) : (
                <Box sx={{ pt: 1 }}>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    {actionType === 'approve'
                      ? `Are you sure you want to approve ${selectedUser.name}? They will be activated and allowed to log in.`
                      : `Are you sure you want to reject ${selectedUser.name}? They will not be able to log in.`}
                  </Typography>

                  {actionType === 'approve' && (
                    <FormControl fullWidth sx={{ mt: 1, mb: 1 }}>
                      <InputLabel id="assign-role-label">Assign System Role</InputLabel>
                      <Select
                        labelId="assign-role-label"
                        id="assign-role-select"
                        value={assignedRole}
                        label="Assign System Role"
                        onChange={(e) => setAssignedRole(e.target.value)}
                        sx={{ borderRadius: 1 }}
                      >
                        {availableRoles.length > 0 ? (
                          availableRoles.map((role) => (
                            <MenuItem key={role._id} value={role.name}>
                              {role.name}
                            </MenuItem>
                          ))
                        ) : (
                          ['Sales Staff', 'Manager', 'Admin', 'SR', 'DSR', 'E-Commerce Admin', 'Investor'].map((rName) => (
                            <MenuItem key={rName} value={rName}>
                              {rName}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 1 }}>
                        The selected role will determine the user's workspace permissions and dashboard access.
                      </Typography>
                    </FormControl>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid #eaeef3', bgcolor: '#F8FAFC' }}>
              <Button onClick={handleCloseDialog} color="inherit">
                Cancel
              </Button>
              {actionType === 'approve' && (
                <Button
                  onClick={handleConfirmAction}
                  variant="contained"
                  disabled={approveUserMutation.isLoading}
                  sx={{
                    backgroundColor: '#2E7D32',
                    '&:hover': { backgroundColor: '#1B5E20' }
                  }}
                >
                  {approveUserMutation.isLoading ? 'Approving...' : 'Approve User'}
                </Button>
              )}
              {actionType === 'reject' && (
                <Button
                  onClick={handleConfirmAction}
                  variant="contained"
                  disabled={approveUserMutation.isLoading}
                  sx={{
                    backgroundColor: '#C62828',
                    '&:hover': { backgroundColor: '#B71C1C' }
                  }}
                >
                  {approveUserMutation.isLoading ? 'Rejecting...' : 'Reject User'}
                </Button>
              )}
              {actionType === 'view' && (
                <Button
                  onClick={handleCloseDialog}
                  variant="contained"
                  sx={{
                    backgroundColor: '#1D5F99',
                    '&:hover': { backgroundColor: '#0d47a1' }
                  }}
                >
                  Close
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default UserApproval;
