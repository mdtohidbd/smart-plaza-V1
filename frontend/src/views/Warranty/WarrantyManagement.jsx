import React, { useState, useMemo } from 'react';
import {
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Skeleton,
  TablePagination
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ReceiptLong as ClaimIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const WarrantyManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);

  // Template Form State
  const [openTemplateForm, setOpenTemplateForm] = useState(false);
  const [editTemplateMode, setEditTemplateMode] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    brand: '',
    category: '',
    durationMonths: 12,
    description: '',
    isDefault: false,
    isActive: true
  });

  // Fetch Brands and Categories for dropdowns
  const { data: brandsRes } = useQuery('brands', () => api.get('/api/brands?limit=1000').then(res => res.data));
  const { data: categoriesRes } = useQuery('categories', () => api.get('/api/categories').then(res => res.data));
  
  const brands = brandsRes?.data || [];
  const categories = categoriesRes?.data || [];

  // Fetch Templates
  const { data: templatesRes, isLoading: loadingTemplates } = useQuery(
    'warranty-templates',
    () => api.get('/api/warranty/templates').then(res => res.data)
  );
  const templates = templatesRes?.data || [];

  // Fetch Active Warranties
  const { data: warrantiesRes, isLoading: loadingWarranties } = useQuery(
    'active-warranties',
    () => api.get('/api/warranty').then(res => res.data)
  );
  const warranties = warrantiesRes?.data || [];

  // Template Pagination
  const [templatePage, setTemplatePage] = useState(0);
  const [templateRowsPerPage, setTemplateRowsPerPage] = useState(10);

  // Active Warranties Pagination
  const [warrantyPage, setWarrantyPage] = useState(0);
  const [warrantyRowsPerPage, setWarrantyRowsPerPage] = useState(10);

  const handleChangeTemplatePage = (event, newPage) => {
    setTemplatePage(newPage);
  };
  const handleChangeTemplateRowsPerPage = (event) => {
    setTemplateRowsPerPage(parseInt(event.target.value, 10));
    setTemplatePage(0);
  };

  const handleChangeWarrantyPage = (event, newPage) => {
    setWarrantyPage(newPage);
  };
  const handleChangeWarrantyRowsPerPage = (event) => {
    setWarrantyRowsPerPage(parseInt(event.target.value, 10));
    setWarrantyPage(0);
  };

  const paginatedTemplates = useMemo(() => {
    return templates.slice(templatePage * templateRowsPerPage, templatePage * templateRowsPerPage + templateRowsPerPage);
  }, [templates, templatePage, templateRowsPerPage]);

  const paginatedWarranties = useMemo(() => {
    return warranties.slice(warrantyPage * warrantyRowsPerPage, warrantyPage * warrantyRowsPerPage + warrantyRowsPerPage);
  }, [warranties, warrantyPage, warrantyRowsPerPage]);

  // Mutations
  const createTemplateMutation = useMutation(
    (data) => api.post('/api/warranty/templates', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('warranty-templates');
        handleCloseTemplateForm();
      }
    }
  );

  const updateTemplateMutation = useMutation(
    ({ id, data }) => api.put(`/api/warranty/templates/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('warranty-templates');
        handleCloseTemplateForm();
      }
    }
  );

  const deleteTemplateMutation = useMutation(
    (id) => api.delete(`/api/warranty/templates/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('warranty-templates');
      }
    }
  );

  // Handlers
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenTemplateForm = (template = null) => {
    if (template) {
      setEditTemplateMode(true);
      setSelectedTemplateId(template._id);
      setTemplateFormData({
        name: template.name,
        brand: template.brand?._id || '',
        category: template.category?._id || '',
        durationMonths: template.durationMonths,
        description: template.description || '',
        isDefault: template.isDefault,
        isActive: template.isActive
      });
    } else {
      setEditTemplateMode(false);
      setSelectedTemplateId(null);
      setTemplateFormData({
        name: '',
        brand: '',
        category: '',
        durationMonths: 12,
        description: '',
        isDefault: false,
        isActive: true
      });
    }
    setOpenTemplateForm(true);
  };

  const handleCloseTemplateForm = () => {
    setOpenTemplateForm(false);
  };

  const handleTemplateFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTemplateFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTemplateSubmit = (e) => {
    e.preventDefault();
    if (editTemplateMode) {
      updateTemplateMutation.mutate({ id: selectedTemplateId, data: templateFormData });
    } else {
      createTemplateMutation.mutate(templateFormData);
    }
  };

  const handleDeleteTemplate = (id) => {
    if (window.confirm('Are you sure you want to delete this warranty template?')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#1E293B' }}>
        Warranty Management
      </Typography>

      <Paper sx={{ width: '100%', mb: 3, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            backgroundColor: '#F8FAFC'
          }}
        >
          <Tab label="Warranty Templates" />
          <Tab label="Active Warranties" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* TAB 0: TEMPLATES */}
          {activeTab === 0 && (
            <Box>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                gap: 2, 
                justifyContent: 'space-between', 
                alignItems: { xs: 'stretch', sm: 'center' }, 
                mb: 3 
              }}>
                <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  Warranty Templates (Brand/Category Based)
                </Typography>
                {user?.permissions?.sales?.create && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenTemplateForm()}
                    sx={{ 
                      backgroundColor: '#E57141', 
                      '&:hover': { backgroundColor: '#D65E2A' },
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Add Template
                  </Button>
                )}
              </Box>

              <>
                {/* Mobile View: Warranty Templates Cards */}
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                  {loadingTemplates ? (
                    [1, 2].map((item) => (
                      <Box key={item} sx={{ p: 2, mb: 1.5, border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: '#F8FAFC' }}>
                        <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1.5 }} />
                        <Grid container spacing={1.5}>
                          <Grid item xs={6}><Skeleton variant="text" width="80%" /><Skeleton variant="text" width="60%" /></Grid>
                          <Grid item xs={6}><Skeleton variant="text" width="80%" /><Skeleton variant="text" width="60%" /></Grid>
                        </Grid>
                      </Box>
                    ))
                  ) : paginatedTemplates.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center', color: '#64748B', border: '1px dashed #CBD5E1', borderRadius: '8px' }}>
                      No templates found.
                    </Box>
                  ) : (
                    paginatedTemplates.map((row) => (
                        <Box 
                          key={row._id} 
                          sx={{ 
                            p: 2, 
                            mb: 1.5, 
                            border: '1px solid #E2E8F0', 
                            borderRadius: '8px', 
                            backgroundColor: '#F8FAFC',
                            position: 'relative'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap', pr: 6 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                              {row.name}
                            </Typography>
                            {row.isDefault && (
                              <Chip label="Default" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem', backgroundColor: '#1D5F99' }} />
                            )}
                          </Box>
                          
                          <Grid container spacing={1.5} sx={{ mb: 1 }}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" display="block">Brand</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: '#1E293B' }}>{row.brand?.name || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" display="block">Category</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: '#1E293B' }}>{row.category?.name || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" display="block">Duration</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: '#1E293B' }}>{row.durationMonths} Months</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" display="block">Status</Typography>
                              <Chip 
                                label={row.isActive ? 'Active' : 'Inactive'} 
                                color={row.isActive ? 'success' : 'default'} 
                                size="small"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            </Grid>
                          </Grid>

                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', pt: 1, gap: 1 }}>
                            {user?.permissions?.sales?.update && (
                              <IconButton size="small" color="primary" onClick={() => handleOpenTemplateForm(row)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                            {user?.permissions?.sales?.delete && user?.role !== 'Sales Staff' && (
                              <IconButton size="small" color="error" onClick={() => handleDeleteTemplate(row._id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                      ))
                    )}
                  </Box>

                  {/* Desktop View: Table */}
                  <TableContainer sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <Table sx={{ minWidth: 650 }}>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#F1F5F9' }}>
                          <TableCell><strong>Name</strong></TableCell>
                          <TableCell><strong>Brand</strong></TableCell>
                          <TableCell><strong>Category</strong></TableCell>
                          <TableCell><strong>Default Duration</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell align="right"><strong>Actions</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loadingTemplates ? (
                          [1, 2, 3].map((item) => (
                            <TableRow key={item}>
                              <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                              <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                              <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                              <TableCell><Skeleton variant="text" width="30%" /></TableCell>
                              <TableCell><Skeleton variant="rectangular" width={50} height={20} sx={{ borderRadius: 1 }} /></TableCell>
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                  <Skeleton variant="circular" width={28} height={28} />
                                  <Skeleton variant="circular" width={28} height={28} />
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : paginatedTemplates.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center">No templates found.</TableCell>
                          </TableRow>
                        ) : (
                          paginatedTemplates.map((row) => (
                            <TableRow key={row._id} hover>
                              <TableCell>
                                {row.name}
                                {row.isDefault && (
                                  <Chip label="Default" size="small" color="primary" sx={{ ml: 1, height: 20 }} />
                                )}
                              </TableCell>
                              <TableCell>{row.brand?.name || 'N/A'}</TableCell>
                              <TableCell>{row.category?.name || 'N/A'}</TableCell>
                              <TableCell>{row.durationMonths} Months</TableCell>
                              <TableCell>
                                <Chip 
                                  label={row.isActive ? 'Active' : 'Inactive'} 
                                  color={row.isActive ? 'success' : 'default'} 
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">
                                {user?.permissions?.sales?.update && (
                                  <IconButton color="primary" onClick={() => handleOpenTemplateForm(row)}>
                                    <EditIcon />
                                  </IconButton>
                                )}
                                {user?.permissions?.sales?.delete && user?.role !== 'Sales Staff' && (
                                  <IconButton color="error" onClick={() => handleDeleteTemplate(row._id)}>
                                    <DeleteIcon />
                                  </IconButton>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Template Pagination */}
                  {!loadingTemplates && templates.length > 0 && (
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25]}
                      component="div"
                      count={templates.length}
                      rowsPerPage={templateRowsPerPage}
                      page={templatePage}
                      onPageChange={handleChangeTemplatePage}
                      onRowsPerPageChange={handleChangeTemplateRowsPerPage}
                      sx={{ borderTop: '1px solid #e2e8f0', mt: 2 }}
                    />
                  )}
                </>
            </Box>
          )}

          {/* TAB 1: ACTIVE WARRANTIES */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3 }}>Active Warranties (From Retail Sales)</Typography>
              <>
                {/* Mobile View: Active Warranties Cards */}
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                  {loadingWarranties ? (
                    [1, 2].map((item) => (
                      <Box key={item} sx={{ p: 2, mb: 1.5, border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: '#F8FAFC' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Skeleton variant="text" width="40%" height={20} />
                          <Skeleton variant="rectangular" width={60} height={18} sx={{ borderRadius: 1 }} />
                        </Box>
                        <Skeleton variant="text" width="60%" height={16} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="80%" height={16} sx={{ mb: 1.5 }} />
                        <Grid container spacing={1.5} sx={{ borderTop: '1px solid #F1F5F9', pt: 1.5 }}>
                          <Grid item xs={6}><Skeleton variant="text" width="80%" /></Grid>
                          <Grid item xs={6}><Skeleton variant="text" width="80%" /></Grid>
                        </Grid>
                      </Box>
                    ))
                  ) : paginatedWarranties.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center', color: '#64748B', border: '1px dashed #CBD5E1', borderRadius: '8px' }}>
                      No active warranties found.
                    </Box>
                  ) : (
                    paginatedWarranties.map((row) => (
                        <Box 
                          key={row._id} 
                          sx={{ 
                            p: 2, 
                            mb: 1.5, 
                            border: '1px solid #E2E8F0', 
                            borderRadius: '8px', 
                            backgroundColor: '#F8FAFC'
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1D5F99' }}>
                              Invoice: #{row.sale?.invoiceNumber || 'N/A'}
                            </Typography>
                            <Chip 
                              label={row.status} 
                              color={
                                row.status === 'Active' ? 'success' : 
                                row.status === 'Expired' ? 'error' : 
                                row.status === 'Claimed' ? 'warning' : 'default'
                              }
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>

                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" color="textSecondary" display="block">Customer</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1E293B' }}>{row.customer?.contactName || 'N/A'}</Typography>
                          </Box>

                          <Box sx={{ mb: 1.5 }}>
                            <Typography variant="caption" color="textSecondary" display="block">Product</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1E293B' }}>{row.product?.name || 'N/A'}</Typography>
                          </Box>

                          <Grid container spacing={1} sx={{ borderTop: '1px solid #F1F5F9', pt: 1.5 }}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" display="block">Start Date</Typography>
                              <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500 }}>
                                {row.startDate ? format(new Date(row.startDate), 'dd MMM yyyy') : 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary" display="block">End Date</Typography>
                              <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500 }}>
                                {row.endDate ? format(new Date(row.endDate), 'dd MMM yyyy') : 'N/A'}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      ))
                    )}
                  </Box>

                  {/* Desktop View: Table */}
                  <TableContainer sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <Table sx={{ minWidth: 650 }}>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#F1F5F9' }}>
                          <TableCell><strong>Invoice #</strong></TableCell>
                          <TableCell><strong>Customer</strong></TableCell>
                          <TableCell><strong>Product</strong></TableCell>
                          <TableCell><strong>Warranty Type</strong></TableCell>
                          <TableCell><strong>Start Date</strong></TableCell>
                          <TableCell><strong>End Date</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loadingWarranties ? (
                          [1, 2, 3].map((item) => (
                            <TableRow key={item}>
                              <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                              <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                              <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                              <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                              <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                              <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                              <TableCell><Skeleton variant="rectangular" width={50} height={20} sx={{ borderRadius: 1 }} /></TableCell>
                            </TableRow>
                          ))
                        ) : paginatedWarranties.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center">No active warranties found.</TableCell>
                          </TableRow>
                        ) : (
                          paginatedWarranties.map((row) => (
                            <TableRow key={row._id} hover>
                              <TableCell>{row.sale?.invoiceNumber || 'N/A'}</TableCell>
                              <TableCell>{row.customer?.contactName}</TableCell>
                              <TableCell>{row.product?.name}</TableCell>
                              <TableCell>{row.warrantyName || 'Manual Warranty'}</TableCell>
                              <TableCell>{format(new Date(row.startDate), 'dd MMM yyyy')}</TableCell>
                              <TableCell>{format(new Date(row.endDate), 'dd MMM yyyy')}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={row.status} 
                                  color={
                                    row.status === 'Active' ? 'success' : 
                                    row.status === 'Expired' ? 'error' : 
                                    row.status === 'Claimed' ? 'warning' : 'default'
                                  }
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Active Warranties Pagination */}
                  {!loadingWarranties && warranties.length > 0 && (
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      component="div"
                      count={warranties.length}
                      rowsPerPage={warrantyRowsPerPage}
                      page={warrantyPage}
                      onPageChange={handleChangeWarrantyPage}
                      onRowsPerPageChange={handleChangeWarrantyRowsPerPage}
                      sx={{ borderTop: '1px solid #e2e8f0', mt: 2 }}
                    />
                  )}
                </>
            </Box>
          )}
        </Box>
      </Paper>

      {/* TEMPLATE FORM DIALOG */}
      <Dialog open={openTemplateForm} onClose={handleCloseTemplateForm} maxWidth="sm" fullWidth>
        <form onSubmit={handleTemplateSubmit}>
          <DialogTitle>{editTemplateMode ? 'Edit Warranty Template' : 'Add Warranty Template'}</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Warranty Name (e.g. Panel Warranty)"
                  name="name"
                  value={templateFormData.name}
                  onChange={handleTemplateFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Brand</InputLabel>
                  <Select
                    name="brand"
                    value={templateFormData.brand}
                    label="Brand"
                    onChange={handleTemplateFormChange}
                  >
                    {brands.map(b => (
                      <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={templateFormData.category}
                    label="Category"
                    onChange={handleTemplateFormChange}
                  >
                    {categories.map(c => (
                      <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Duration (Months)"
                  name="durationMonths"
                  type="number"
                  value={templateFormData.durationMonths}
                  onChange={handleTemplateFormChange}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={2}
                  value={templateFormData.description}
                  onChange={handleTemplateFormChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={templateFormData.isActive}
                      onChange={handleTemplateFormChange}
                      name="isActive"
                      color="primary"
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTemplateForm} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" sx={{ backgroundColor: '#E57141', '&:hover': { backgroundColor: '#D65E2A' } }}>
              {editTemplateMode ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default WarrantyManagement;