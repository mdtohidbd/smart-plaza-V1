import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Snackbar,
  Autocomplete
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import api from '../../utils/api';

const RouteSettings = () => {
  const [routes, setRoutes] = useState([]);
  const [srs, setSrs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    area: '',
    assignedSR: null
  });
  
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  
  // Deletion
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchRoutes();
    fetchSRs();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/routes');
      if (res.data?.success) {
        setRoutes(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSRs = async () => {
    try {
      // Fetch users and filter by SR and DSR
      const res = await api.get('/api/users');
      if (res.data?.success) {
        const srUsers = res.data.data.filter(u => u.role === 'SR' || u.role === 'DSR');
        setSrs(srUsers);
      }
    } catch (err) {
      console.error('Error fetching SRs:', err);
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ name: '', code: '', area: '', assignedSR: null });
    setModalError(null);
    setOpenModal(true);
  };

  const handleOpenEdit = (route) => {
    setIsEditing(true);
    setEditingId(route._id);
    setFormData({
      name: route.name,
      code: route.code,
      area: route.area || '',
      assignedSR: route.assignedSR ? srs.find(sr => sr._id === route.assignedSR._id) : null
    });
    setModalError(null);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setModalError('Name and Code are required');
      return;
    }

    try {
      setModalLoading(true);
      setModalError(null);
      
      const payload = {
        name: formData.name,
        code: formData.code,
        area: formData.area,
        assignedSR: formData.assignedSR ? formData.assignedSR._id : null
      };

      if (isEditing) {
        await api.put(`/api/routes/${editingId}`, payload);
        setToast({ open: true, message: 'Route updated successfully', severity: 'success' });
      } else {
        await api.post('/api/routes', payload);
        setToast({ open: true, message: 'Route created successfully', severity: 'success' });
      }
      
      fetchRoutes();
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save route:', err);
      setModalError(err.response?.data?.message || 'Failed to save route');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/api/routes/${deleteDialog._id}`);
      setToast({ open: true, message: 'Route deleted successfully', severity: 'success' });
      fetchRoutes();
      setDeleteDialog(null);
    } catch (err) {
      console.error('Failed to delete route:', err);
      setToast({ open: true, message: err.response?.data?.message || 'Failed to delete route', severity: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1.25, borderRadius: '12px', backgroundColor: 'rgba(20, 184, 166, 0.1)', color: '#14B8A6', display: 'flex' }}>
            <MapIcon sx={{ fontSize: '1.8rem' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#1E293B">
              Route/Beat Management
            </Typography>
            <Typography variant="body2" color="#64748B">
              Manage distribution routes, beats, and assign SRs.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            backgroundColor: '#14B8A6',
            textTransform: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            '&:hover': { backgroundColor: '#0D9488' }
          }}
        >
          Create Route
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {routes.map(route => (
            <Grid item xs={12} sm={6} md={4} key={route._id}>
              <Card sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" fontWeight={700} color="#1E293B">
                      {route.name}
                    </Typography>
                    <Chip label={route.code} size="small" sx={{ backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 600 }} />
                  </Box>
                  <Typography variant="body2" color="#64748B" sx={{ mb: 2 }}>
                    Area: {route.area || 'Not specified'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, backgroundColor: '#F8FAFC', borderRadius: '8px', mb: 2 }}>
                    <PersonIcon sx={{ color: '#94A3B8', fontSize: '1.2rem' }} />
                    <Typography variant="body2" fontWeight={500} color="#334155">
                      {route.assignedSR ? route.assignedSR.name : 'Unassigned'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 1, borderTop: '1px solid #F1F5F9' }}>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenEdit(route)}>
                      Edit
                    </Button>
                    <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteDialog(route)}>
                      Delete
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {routes.length === 0 && (
            <Grid item xs={12}>
              <Typography color="text.secondary" align="center" sx={{ p: 4 }}>
                No routes found. Create your first route to get started.
              </Typography>
            </Grid>
          )}
        </Grid>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #E2E8F0' }}>
          {isEditing ? 'Edit Route' : 'Create New Route'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ py: 2.5 }}>
            {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Route Name (e.g. Mirpur-10)"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Route Code (e.g. MRP-10)"
                  fullWidth
                  required
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Area Description"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.area}
                  onChange={e => setFormData({ ...formData, area: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  options={srs}
                  getOptionLabel={(option) => `${option.name} (${option.role})`}
                  value={formData.assignedSR}
                  onChange={(e, newValue) => setFormData({ ...formData, assignedSR: newValue })}
                  renderInput={(params) => <TextField {...params} label="Assign SR/DSR (Optional)" size="small" />}
                  isOptionEqualToValue={(option, value) => option._id === value._id}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseModal} color="inherit" disabled={modalLoading}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={modalLoading}>
              {modalLoading ? 'Saving...' : 'Save Route'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={Boolean(deleteDialog)} onClose={() => setDeleteDialog(null)}>
        <DialogTitle color="error">Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the route <strong>{deleteDialog?.name}</strong>?
            This may fail if there are sales already tied to this route.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast({ ...toast, open: false })}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RouteSettings;
