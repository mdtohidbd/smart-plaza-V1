import React, { useState, useMemo } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  useTheme,
  useMediaQuery,
  Skeleton,
  TablePagination
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../../context/AuthContext';

const Units = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isUserAdmin = ['Super Admin', 'Super Admin Plus', 'Admin'].includes(user?.role);
  const canCreate = isUserAdmin || user?.permissions?.products?.create === true;
  const canUpdate = isUserAdmin || user?.permissions?.products?.update === true;
  const canDelete = isUserAdmin || user?.permissions?.products?.delete === true;
  const showForm = (!editingId && canCreate) || (editingId && canUpdate);

  const queryClient = useQueryClient();

  // Fetch units
  const { data: units, isLoading, error: fetchError } = useQuery(
    'units',
    async () => {
      const response = await api.get('/api/units');
      return response.data.data;
    }
  );

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedUnits = useMemo(() => {
    return (units || []).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [units, page, rowsPerPage]);

  // Create unit mutation
  const createUnitMutation = useMutation(
    (unitData) => api.post('/api/units', unitData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('units');
        setName('');
        setSymbol('');
        setDescription('');
        setSuccess('Unit created successfully!');
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (error) => {
        setError(error.response?.data?.message || error.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  );

  // Update unit mutation
  const updateUnitMutation = useMutation(
    ({ id, data }) => api.put(`/api/units/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('units');
        setEditingId(null);
        setName('');
        setSymbol('');
        setDescription('');
        setSuccess('Unit updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (error) => {
        setError(error.response?.data?.message || error.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  );

  // Delete unit mutation
  const deleteUnitMutation = useMutation(
    (id) => api.delete(`/api/units/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('units');
        setDeleteId(null);
        setSuccess('Unit deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (error) => {
        setError(error.response?.data?.message || error.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateUnitMutation.mutate({
        id: editingId,
        data: { name, symbol, description }
      });
    } else {
      createUnitMutation.mutate({ name, symbol, description });
    }
  };

  const handleEdit = (unit) => {
    setEditingId(unit._id);
    setName(unit.name);
    setSymbol(unit.symbol);
    setDescription(unit.description || '');
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    deleteUnitMutation.mutate(deleteId);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setSymbol('');
    setDescription('');
  };

  if (fetchError) {
    return (
      <Box sx={{ py: { xs: 1, sm: 2 } }}>
        <Alert severity="error">Error loading units: {fetchError.message}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      py: { xs: 1, sm: 2 },
      backgroundColor: '#F8FAFC',
    }}>
      <Grid container spacing={1.5}>

        <Grid item xs={12}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </Grid>

        <Grid item xs={12}>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
        </Grid>

        {showForm && (
          <Grid item xs={12}>
            <Paper
              elevation={0}
            sx={{
              p: 2,
              mb: 2,
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              fontFamily: '"Outfit", sans-serif',
            }}
            >
              <Typography variant="h6" gutterBottom>
                {editingId ? 'Edit Unit' : 'Add New Unit'}
              </Typography>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Unit Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Symbol"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={createUnitMutation.isLoading || updateUnitMutation.isLoading}
                      >
                        {createUnitMutation.isLoading || updateUnitMutation.isLoading ? (
                          <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            {editingId ? 'Updating...' : 'Creating...'}
                          </>
                        ) : editingId ? 'Update Unit' : 'Create Unit'}
                      </Button>
                      {editingId && (
                        <Button variant="outlined" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>
        )}

        <Grid item xs={12}>
          <Paper
            sx={{
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              borderRadius: '8px',
              overflow: 'visible',
              '& .MuiTableRow-root:hover': {
                backgroundColor: '#f5f9ff',
              },
              p: 0,
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
              }
            }}
          >
            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, fontSize: '1.1rem', p: 2, borderBottom: '1px solid #eaeef3', m: 0 }}>
              Unit List
            </Typography>
            {isMobile ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1.5, backgroundColor: '#F8FAFC' }}>
                {isLoading ? (
                  [1, 2, 3].map((item) => (
                    <Paper key={item} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#fff' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Skeleton variant="text" width="60%" height={18} />
                        <Skeleton variant="rectangular" width={50} height={18} sx={{ borderRadius: 1 }} />
                      </Box>
                      <Skeleton variant="text" width="80%" height={14} />
                    </Paper>
                  ))
                ) : paginatedUnits.length === 0 ? (
                  <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#fff', border: '1px solid #eaeef3', borderRadius: '8px' }}>
                    <Typography variant="body2" color="textSecondary">
                      No units found.
                    </Typography>
                  </Paper>
                ) : (
                  paginatedUnits.map((unit) => (
                    <Paper
                      key={unit._id}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        backgroundColor: '#fff',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', fontFamily: '"Outfit", sans-serif' }}>
                          {unit.name}
                        </Typography>
                        <span style={{
                          fontSize: '11px',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          fontWeight: 700,
                          border: '1px solid #dbeafe',
                          fontFamily: '"Outfit", sans-serif',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}>
                          {unit.symbol}
                        </span>
                      </Box>

                      {/* Description */}
                      {unit.description && (
                        <Box sx={{ mb: 1.5, p: 1.25, backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.25, fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Outfit", sans-serif' }}>
                            Description
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.85rem', fontFamily: '"Outfit", sans-serif' }}>
                            {unit.description}
                          </Typography>
                        </Box>
                      )}

                      {/* Actions Footer */}
                      {(canUpdate || canDelete) && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px dashed #e2e8f0', pt: 1.25 }}>
                          {canUpdate && (
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleEdit(unit)}
                              sx={{
                                p: 0.75,
                                border: '1px solid #dbeafe',
                                borderRadius: '8px',
                                backgroundColor: '#f8fafc',
                                '&:hover': {
                                  backgroundColor: '#eff6ff',
                                  borderColor: '#bfdbfe'
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          {canDelete && (
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDelete(unit._id)}
                              sx={{
                                p: 0.75,
                                border: '1px solid #fee2e2',
                                borderRadius: '8px',
                                backgroundColor: '#f8fafc',
                                '&:hover': {
                                  backgroundColor: '#fef2f2',
                                  borderColor: '#fca5a5'
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      )}
                    </Paper>
                  ))
                )}
              </Box>
            ) : (
              <TableContainer sx={{ overflow: 'auto' }}>
                <Table
                  sx={{
                    minWidth: 800,
                    tableLayout: 'auto'
                  }}
                >
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
                      <TableCell >Name</TableCell>
                      <TableCell >Symbol</TableCell>
                      <TableCell >Description</TableCell>
                      {(canUpdate || canDelete) && (
                        <TableCell  align="right">Actions</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading ? (
                      [1, 2, 3, 4, 5].map((item) => (
                        <TableRow key={item}>
                          <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="60%" /></TableCell>
                          <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="30%" /></TableCell>
                          <TableCell sx={{ py: 1.5 }}><Skeleton variant="text" width="80%" /></TableCell>
                          {(canUpdate || canDelete) && (
                            <TableCell align="right" sx={{ py: 1.5 }}>
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                <Skeleton variant="circular" width={28} height={28} />
                                <Skeleton variant="circular" width={28} height={28} />
                              </Box>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : paginatedUnits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canUpdate || canDelete ? 4 : 3} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                          No units found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUnits.map((unit, index) => (
                        <TableRow
                          key={unit._id}
                          sx={{
                            backgroundColor: index % 2 === 0 ? 'transparent' : '#f9fbfd',
                            '&:hover': {
                              backgroundColor: '#eef5ff', // Light blue hover
                            },
                            '& .MuiTableCell-root': {
                              whiteSpace: 'nowrap',
                              padding: '6px 10px'
                            }
                          }}
                        >
                          <TableCell sx={{ color: '#333', fontWeight: 500 }}>{unit.name}</TableCell>
                          <TableCell sx={{ color: '#333' }}>{unit.symbol}</TableCell>
                          <TableCell sx={{ color: '#333' }}>{unit.description || 'N/A'}</TableCell>
                          {(canUpdate || canDelete) && (
                            <TableCell align="right">
                              {canUpdate && (
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => handleEdit(unit)}
                                  sx={{
                                    '&:hover': {
                                      backgroundColor: 'rgba(29, 95, 153, 0.1)' // Light blue hover
                                    }
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                              )}
                              {canDelete && (
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => handleDelete(unit._id)}
                                  sx={{
                                    '&:hover': {
                                      backgroundColor: 'rgba(244, 67, 54, 0.1)' // Light red hover
                                    }
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Pagination */}
            {!isLoading && units?.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={units.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{ borderTop: '1px solid #eaeef3' }}
              />
            )}
          </Paper>
        </Grid>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
        >
          <DialogTitle sx={{ bgcolor: '#F8FAFC', color: '#1e293b', fontWeight: 600, fontSize: '1.2rem', p: 2, borderBottom: '1px solid #eaeef3' }}>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this unit? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #eaeef3', bgcolor: '#F8FAFC' }}>
            <Button onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              onClick={confirmDelete}
              color="error"
              disabled={deleteUnitMutation.isLoading}
            >
              {deleteUnitMutation.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    </Box>
  );
};

export default Units;