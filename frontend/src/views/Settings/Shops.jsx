import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useAuth } from '../../context/AuthContext';
import CreateShopModal from '../../components/CreateShopModal';
import api from '../../utils/api';

const Shops = () => {
  const { shops, activeShop, switchShop, fetchShops } = useAuth();
  const [loading, setLoading] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [editingShop, setEditingShop] = useState(null);

  const handleSwitchShop = async (shop) => {
    const res = await switchShop(shop);
    if (res?.success) {
      setToast({
        open: true,
        message: `Switched active shop to "${shop.name}"`,
        severity: 'success'
      });
    }
  };
  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });
  const [updateError, setUpdateError] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Deletion state
  const [deletingShop, setDeletingShop] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    fetchShops();
  }, []);

  const handleOpenEdit = (shop) => {
    setEditingShop(shop);
    setEditFormData({
      name: shop.name || '',
      address: shop.address || '',
      phone: shop.phone || '',
      email: shop.email || ''
    });
    setUpdateError(null);
  };

  const handleCloseEdit = () => {
    setEditingShop(null);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      setUpdateError('Shop name is required');
      return;
    }

    try {
      setUpdateLoading(true);
      setUpdateError(null);
      const res = await api.put(`/api/shops/${editingShop._id}`, editFormData);
      if (res.data?.success) {
        await fetchShops();
        handleCloseEdit();
      }
    } catch (err) {
      console.error('Failed to update shop:', err);
      setUpdateError(err.response?.data?.message || 'Failed to update shop');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleOpenDelete = (shop) => {
    setDeletingShop(shop);
    setDeleteError(null);
  };

  const handleCloseDelete = () => {
    setDeletingShop(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingShop) return;

    try {
      setDeleteLoading(true);
      setDeleteError(null);
      const res = await api.delete(`/api/shops/${deletingShop._id}`);
      if (res.data?.success) {
        await fetchShops();
        handleCloseDelete();
      }
    } catch (err) {
      console.error('Failed to delete shop:', err);
      setDeleteError(err.response?.data?.message || 'Failed to delete shop from database');
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
            <StorefrontIcon sx={{ fontSize: '1.8rem' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#1E293B">
              Multi-Shop Management (মাল্টিশপ সেটিংস)
            </Typography>
            <Typography variant="body2" color="#64748B">
              Manage your store locations, branches, and switch active shop context.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateModal(true)}
          sx={{
            backgroundColor: '#14B8A6',
            textTransform: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            px: 2.5,
            py: 1,
            '&:hover': { backgroundColor: '#0D9488' }
          }}
        >
          Create New Shop
        </Button>
      </Box>

      {/* Shop Cards */}
      <Grid container spacing={3}>
        {shops && shops.length > 0 ? (
          shops.map((shop) => {
            const isActive = activeShop?._id === shop._id;
            return (
              <Grid item xs={12} sm={6} md={4} key={shop._id}>
                <Card
                  sx={{
                    borderRadius: '16px',
                    border: isActive ? '2px solid #14B8A6' : '1px solid #E2E8F0',
                    boxShadow: isActive ? '0 4px 12px rgba(20, 184, 166, 0.15)' : 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                      borderColor: isActive ? '#14B8A6' : '#CBD5E1'
                    }
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StorefrontIcon sx={{ color: isActive ? '#14B8A6' : '#64748B' }} />
                        <Typography variant="h6" fontWeight={700} color="#1E293B">
                          {shop.name}
                        </Typography>
                      </Box>
                      {isActive ? (
                        <Chip
                          icon={<CheckCircleIcon style={{ color: '#14B8A6' }} />}
                          label="Active Shop"
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(20, 184, 166, 0.1)',
                            color: '#14B8A6',
                            fontWeight: 700,
                            borderRadius: '8px'
                          }}
                        />
                      ) : shop.isActive === false ? (
                        <Chip
                          label="Inactive"
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ borderRadius: '8px' }}
                        />
                      ) : (
                        <Chip
                          label="Branch"
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: '8px', color: '#64748B', borderColor: '#CBD5E1', fontWeight: 500 }}
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
                      {shop.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748B' }}>
                          <PhoneIcon sx={{ fontSize: '1rem' }} />
                          <Typography variant="body2">{shop.phone}</Typography>
                        </Box>
                      )}
                      {shop.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748B' }}>
                          <EmailIcon sx={{ fontSize: '1rem' }} />
                          <Typography variant="body2">{shop.email}</Typography>
                        </Box>
                      )}
                      {shop.address && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, color: '#64748B' }}>
                          <LocationOnIcon sx={{ fontSize: '1rem', mt: 0.2 }} />
                          <Typography variant="body2">{shop.address}</Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 2, borderTop: '1px solid #F1F5F9' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenEdit(shop)}
                          sx={{ textTransform: 'none', color: '#64748B', borderRadius: '6px' }}
                        >
                          Edit Details
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleOpenDelete(shop)}
                          sx={{
                            textTransform: 'none',
                            color: '#EF4444',
                            borderRadius: '6px',
                            '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.08)' }
                          }}
                        >
                          Delete
                        </Button>
                      </Box>

                      {!isActive && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleSwitchShop(shop)}
                          sx={{
                            textTransform: 'none',
                            borderRadius: '8px',
                            borderColor: '#14B8A6',
                            color: '#14B8A6',
                            fontWeight: 600,
                            '&:hover': {
                              backgroundColor: 'rgba(20, 184, 166, 0.04)',
                              borderColor: '#0D9488'
                            }
                          }}
                        >
                          Set as Active
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '12px', color: '#64748B' }}>
              No shops found. Click "Create New Shop" to add your first branch.
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Create Shop Modal */}
      <CreateShopModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onSuccess={async () => {
          await fetchShops();
        }}
      />

      {/* Edit Shop Dialog */}
      <Dialog open={Boolean(editingShop)} onClose={handleCloseEdit} maxWidth="sm" fullWidth paperProps={{ borderRadius: '12px' }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #E2E8F0' }}>
          Edit Shop Details
        </DialogTitle>
        <form onSubmit={handleUpdateSubmit}>
          <DialogContent sx={{ py: 2.5 }}>
            {updateError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
                {updateError}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Shop Name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  fullWidth
                  required
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Address"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, borderTop: '1px solid #E2E8F0', pt: 2 }}>
            <Button onClick={handleCloseEdit} variant="outlined" color="inherit" disabled={updateLoading} sx={{ textTransform: 'none', borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updateLoading}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                backgroundColor: '#14B8A6',
                '&:hover': { backgroundColor: '#0D9488' }
              }}
            >
              {updateLoading ? <CircularProgress size={22} color="inherit" /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingShop)}
        onClose={handleCloseDelete}
        maxWidth="xs"
        fullWidth
        paperProps={{ borderRadius: '12px' }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#991B1B', borderBottom: '1px solid #E2E8F0', pb: 2 }}>
          Confirm Delete Shop
        </DialogTitle>
        <DialogContent sx={{ py: 2.5 }}>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
              {deleteError}
            </Alert>
          )}
          <Typography variant="body1" color="#1E293B" fontWeight={500}>
            Are you sure you want to delete <strong>{deletingShop?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="#64748B" sx={{ mt: 1 }}>
            This action will permanently delete this shop and its settings from the database.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: '1px solid #E2E8F0', pt: 2 }}>
          <Button
            onClick={handleCloseDelete}
            variant="outlined"
            color="inherit"
            disabled={deleteLoading}
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
            sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Shop'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Active Shop Switch Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%', fontWeight: 600, borderRadius: '10px' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Shops;
