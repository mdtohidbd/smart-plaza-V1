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
  Avatar,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
  Skeleton,
  TablePagination
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../context/AuthContext';
import { 
  Tv, AcUnit, Kitchen, Iron, Wash, KitchenOutlined,
  Microwave, SpeakerGroup, KitchenTwoTone, Computer, Smartphone,
  Checkroom, Chair, Watch, Headphones, Cable, Print, CameraAlt
} from '@mui/icons-material';

const AVAILABLE_ICONS = [
  { name: 'Computer', component: <Computer /> },
  { name: 'Smartphone', component: <Smartphone /> },
  { name: 'Television', component: <Tv /> },
  { name: 'Air Conditioner', component: <AcUnit /> },
  { name: 'Refrigerator', component: <Kitchen /> },
  { name: 'Deep Freezer', component: <KitchenTwoTone /> },
  { name: 'Washing Machine', component: <Wash /> },
  { name: 'Microwave', component: <Microwave /> },
  { name: 'Small Appliances', component: <Iron /> },
  { name: 'Air Fryer', component: <KitchenOutlined /> },
  { name: 'Audio & Speaker', component: <SpeakerGroup /> },
  { name: 'Headphones', component: <Headphones /> },
  { name: 'Smartwatch', component: <Watch /> },
  { name: 'Clothing', component: <Checkroom /> },
  { name: 'Furniture', component: <Chair /> },
  { name: 'Accessories', component: <Cable /> },
  { name: 'Printer', component: <Print /> },
  { name: 'Camera', component: <CameraAlt /> }
];


const Categories = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Computer');
  const [parent, setParent] = useState('');
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

  // Fetch categories
  const { data: categories, isLoading, error: fetchError } = useQuery(
    'categories',
    async () => {
      const response = await api.get('/api/categories');
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

  const paginatedCategories = useMemo(() => {
    return (categories || []).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [categories, page, rowsPerPage]);

  // Create category mutation
  const createCategoryMutation = useMutation(
    async (categoryData) => {
      const response = await api.post('/api/categories', {
        name: categoryData.name,
        description: categoryData.description || '',
        icon: categoryData.icon || 'Computer',
        parent: categoryData.parent || undefined
      });
      return response.data.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categories');
        setName('');
        setDescription('');
        setIcon('Computer');
        setParent('');
        setSuccess('Category created successfully!');
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (error) => {
        setError(error.response?.data?.message || error.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  );

  // Update category mutation
  const updateCategoryMutation = useMutation(
    async ({ id, data }) => {
      const response = await api.put(`/api/categories/${id}`, {
        name: data.name,
        description: data.description || '',
        icon: data.icon || 'Computer',
        parent: data.parent || undefined
      });
      return response.data.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categories');
        setEditingId(null);
        setName('');
        setDescription('');
        setIcon('Computer');
        setParent('');
        setSuccess('Category updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      },
      onError: (error) => {
        setError(error.response?.data?.message || error.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  );

  // Delete category mutation
  const deleteCategoryMutation = useMutation(
    (id) => api.delete(`/api/categories/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categories');
        setDeleteId(null);
        setSuccess('Category deleted successfully!');
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
      updateCategoryMutation.mutate({
        id: editingId,
        data: { name, description, icon, parent: parent || null }
      });
    } else {
      createCategoryMutation.mutate({ name, description, icon, parent: parent || null });
    }
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setName(category.name);
    setDescription(category.description || '');
    setIcon(category.icon || 'Computer');
    setParent(category.parent?._id || '');
  };



  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    deleteCategoryMutation.mutate(deleteId);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setIcon('Computer');
    setParent('');
  };

  if (fetchError) {
    return (
      <Box sx={{ py: { xs: 1, sm: 2 } }}>
        <Alert severity="error">Error loading categories: {fetchError.message}</Alert>
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

        {/* Two Column Layout */}
        <Grid container spacing={3}>
          {/* Left Column - Form */}
          {showForm && (
            <Grid item xs={12} md={5} lg={5}>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  border: '2px solid #e2e8f0',
                  borderRadius: '20px',
                  fontFamily: '"Outfit", sans-serif',
                  background: 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
                  height: 'fit-content',
                  position: 'sticky',
                  top: 24
                }}
              >
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: '#0f172a', mb: 3, fontSize: '1.75rem' }}>
                  {editingId ? 'Edit Category' : 'Add New Category'}
                </Typography>
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="medium"
                        label="Category Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            fontSize: '1rem'
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: '1rem',
                            fontWeight: 500
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth size="medium">
                        <InputLabel id="category-icon-label" sx={{ fontSize: '1rem', fontWeight: 500 }}>Icon</InputLabel>
                        <Select
                          labelId="category-icon-label"
                          value={icon}
                          label="Icon"
                          onChange={(e) => setIcon(e.target.value)}
                          renderValue={(selected) => {
                            const selectedIcon = AVAILABLE_ICONS.find(i => i.name === selected);
                            return (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ fontSize: '1.5rem' }}>{selectedIcon?.component}</Box>
                                <Typography sx={{ fontSize: '1rem', fontWeight: 500 }}>{selectedIcon?.name}</Typography>
                              </Box>
                            );
                          }}
                          sx={{
                            borderRadius: '12px',
                            '& .MuiOutlinedInput-root': {
                              fontSize: '1rem'
                            }
                          }}
                        >
                          {AVAILABLE_ICONS.map((ico) => (
                            <MenuItem key={ico.name} value={ico.name} sx={{ fontSize: '1rem' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ fontSize: '1.5rem' }}>{ico.component}</Box>
                                <Typography sx={{ fontSize: '1rem', fontWeight: 500 }}>{ico.name}</Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth size="medium">
                        <InputLabel id="parent-category-label" sx={{ fontSize: '1rem', fontWeight: 500 }}>Parent</InputLabel>
                        <Select
                          labelId="parent-category-label"
                          value={parent}
                          label="Parent"
                          onChange={(e) => setParent(e.target.value)}
                          sx={{
                            borderRadius: '12px',
                            '& .MuiOutlinedInput-root': {
                              fontSize: '1rem'
                            }
                          }}
                        >
                          <MenuItem value="" sx={{ fontSize: '1rem' }}><em>None (Top Level)</em></MenuItem>
                          {(Array.isArray(categories) ? categories : []).filter(c => c._id !== editingId).map(c => (
                            <MenuItem key={c._id} value={c._id} sx={{ fontSize: '1rem' }}>{c.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="medium"
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        multiline
                        rows={4}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            fontSize: '1rem'
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: '1rem',
                            fontWeight: 500
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Button
                          type="submit"
                          variant="contained"
                          fullWidth
                          disabled={createCategoryMutation.isLoading || updateCategoryMutation.isLoading}
                          sx={{ 
                            height: 56,
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            textTransform: 'none',
                            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                              boxShadow: '0 6px 20px rgba(59, 130, 246, 0.5)'
                            }
                          }}
                        >
                          {createCategoryMutation.isLoading || updateCategoryMutation.isLoading ? (
                            <CircularProgress size={24} />
                          ) : editingId ? 'Update Category' : 'Create Category'}
                        </Button>
                        {editingId && (
                          <Button 
                            variant="outlined" 
                            onClick={cancelEdit} 
                            sx={{ 
                              height: 56, 
                              minWidth: '56px', 
                              p: 0,
                              borderRadius: '12px',
                              fontSize: '1.2rem'
                            }}
                          >
                            <CloseIcon />
                          </Button>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </form>
              </Paper>
            </Grid>
          )}

          {/* Right Column - Categories Display */}
          <Grid item xs={12} md={7} lg={7}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                border: '2px solid #e2e8f0',
                borderRadius: '20px',
                fontFamily: '"Outfit", sans-serif',
                background: 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
                minHeight: 300
              }}
            >
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: '#0f172a', mb: 3, fontSize: '1.75rem' }}>
                All Categories
              </Typography>
              {isLoading ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <Skeleton key={item} variant="rounded" width={140} height={52} sx={{ borderRadius: '26px' }} />
                  ))}
                </Box>
              ) : paginatedCategories.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {paginatedCategories.map((category) => (
                    <Chip
                      key={category._id}
                      avatar={
                        <Avatar sx={{ 
                          width: 40,
                          height: 40,
                          bgcolor: editingId === category._id ? 'primary.main' : '#e2e8f0',
                          color: editingId === category._id ? 'white' : '#64748b',
                          fontSize: '1.2rem'
                        }}>
                          <Box sx={{ fontSize: '1.4rem' }}>
                            {AVAILABLE_ICONS.find(i => i.name === category.icon)?.component || <Computer />}
                          </Box>
                        </Avatar>
                      }
                      label={category.name}
                      onClick={() => handleEdit(category)}
                      onDelete={canDelete ? () => handleDelete(category._id) : undefined}
                      color={editingId === category._id ? "primary" : "default"}
                      variant={editingId === category._id ? "filled" : "outlined"}
                      sx={{
                        height: 52,
                        borderRadius: '26px',
                        fontFamily: '"Outfit", sans-serif',
                        fontWeight: 600,
                        px: 1.5,
                        py: 3,
                        fontSize: '1.05rem',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-3px) scale(1.03)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                          cursor: 'pointer'
                        },
                        '& .MuiChip-label': {
                          px: 1.5,
                          fontSize: '1.05rem'
                        }
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 12, 
                  color: '#94a3b8',
                  fontFamily: '"Outfit", sans-serif'
                }}>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, mb: 1 }}>No categories found</Typography>
                  <Typography variant="body1" sx={{ fontSize: '1rem' }}>Create your first category to get started</Typography>
                </Box>
              )}

              {/* Pagination */}
              {!isLoading && categories?.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 20, 50]}
                  component="div"
                  count={categories.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  sx={{ borderTop: '1px solid #eaeef3', mt: 3 }}
                />
              )}
            </Paper>
          </Grid>
        </Grid>



        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
        >
          <DialogTitle sx={{ bgcolor: '#F8FAFC', color: '#1e293b', fontWeight: 600, fontSize: '1.2rem', p: 2, borderBottom: '1px solid #eaeef3' }}>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this category? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #eaeef3', bgcolor: '#F8FAFC' }}>
            <Button onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              onClick={confirmDelete}
              color="error"
              disabled={deleteCategoryMutation.isLoading}
            >
              {deleteCategoryMutation.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    </Box>
  );
};

export default Categories;