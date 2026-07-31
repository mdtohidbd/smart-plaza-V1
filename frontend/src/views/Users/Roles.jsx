import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Stack,
  Divider,
  Tooltip,
  Card,
  CardContent,
  CardHeader,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const PERMISSION_GROUPS = [
  {
    title: '🛍️ Sales & Customer Ops',
    color: '#e0f2fe',
    borderColor: '#bae6fd',
    modules: [
      { id: 'sales', label: 'Sales / POS', desc: 'Point of sale operations & transaction entries' },
      { id: 'contacts', label: 'Contacts', desc: 'Customers & Suppliers directory profiles' },
      { id: 'warranty', label: 'Warranty Claims', desc: 'Customer warranty processing & status' },
      { id: 'emi', label: 'EMI / Installments', desc: 'Customer installment plans & collection logs' }
    ]
  },
  {
    title: '📦 Inventory & Logistics',
    color: '#f0fdf4',
    borderColor: '#bbf7d0',
    modules: [
      { id: 'products', label: 'Products Catalog', desc: 'Item models, attributes, brands, categories' },
      { id: 'inventory', label: 'Inventory Control', desc: 'Stock tracking, serials, purchase stock logs' },
      { id: 'routes', label: 'Delivery Routes', desc: 'Customer delivery routing & tracking maps' },
      { id: 'ecommerce', label: 'E-Commerce Admin', desc: 'Storefront banners, testimonials, public products' }
    ]
  },
  {
    title: '📊 Finance & Reports',
    color: '#fff7ed',
    borderColor: '#ffedd5',
    modules: [
      { id: 'purchase', label: 'Purchases', desc: 'Supplier orders & procurement logs' },
      { id: 'accounts', label: 'Accounts & Finance', desc: 'Incomes, expenses, and ledger entries' },
      { id: 'reports', label: 'Reports & Analytics', desc: 'Sales, purchases, profits summaries' },
      { id: 'investors', label: 'Investors', desc: 'Equity shares, investments, dividend logs' }
    ]
  },
  {
    title: '⚙️ System & Administration',
    color: '#faf5ff',
    borderColor: '#e9d5ff',
    modules: [
      { id: 'dashboard', label: 'Dashboard Stats', desc: 'Main control center metrics & charts' },
      { id: 'users', label: 'Users & Roles', desc: 'Admin staff accounts, dynamic roles & permissions' },
      { id: 'messages', label: 'Messages / Support', desc: 'Customer website inquiries & dynamic chat' },
      { id: 'settings', label: 'System Settings', desc: 'Global shop parameters & backend configs' }
    ]
  }
];

const Roles = () => {
  const { user } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    isActive: true,
    permissions: {
      dashboard: { read: false, create: false, update: false, delete: false },
      sales: { read: false, create: false, update: false, delete: false },
      purchase: { read: false, create: false, update: false, delete: false },
      products: { read: false, create: false, update: false, delete: false },
      contacts: { read: false, create: false, update: false, delete: false },
      inventory: { read: false, create: false, update: false, delete: false },
      accounts: { read: false, create: false, update: false, delete: false },
      reports: { read: false, create: false, update: false, delete: false },
      users: { read: false, create: false, update: false, delete: false },
      messages: { read: false, create: false, update: false, delete: false },
      settings: { read: false, create: false, update: false, delete: false },
      warranty: { read: false, create: false, update: false, delete: false },
      routes: { read: false, create: false, update: false, delete: false },
      investors: { read: false, create: false, update: false, delete: false },
      emi: { read: false, create: false, update: false, delete: false },
      ecommerce: { read: false, create: false, update: false, delete: false }
    }
  });

  const queryClient = useQueryClient();

  // Fetch roles
  const { data: roles, isLoading, error } = useQuery(
    'roles',
    async () => {
      const response = await api.get('/api/roles');
      return response.data.data;
    }
  );

  // Permanent (non-deletable) roles
  const PERMANENT_ROLES = [
    'Super Admin',
    'Super Admin Plus',
    'Manager',
    'Sales Staff',
    'Investor',
    'E-Commerce Admin'
  ];

  // Standard role presets based on specifications
  const ROLE_PRESETS = {
    'Super Admin': {
      dashboard: { read: true, create: true, update: true, delete: true },
      sales: { read: true, create: true, update: true, delete: true },
      purchase: { read: true, create: true, update: true, delete: true },
      products: { read: true, create: true, update: true, delete: true },
      contacts: { read: true, create: true, update: true, delete: true },
      inventory: { read: true, create: true, update: true, delete: true },
      accounts: { read: true, create: true, update: true, delete: true },
      reports: { read: true, create: true, update: true, delete: true },
      users: { read: true, create: true, update: true, delete: true },
      messages: { read: true, create: true, update: true, delete: true },
      settings: { read: true, create: true, update: true, delete: true },
      warranty: { read: true, create: true, update: true, delete: true },
      routes: { read: true, create: true, update: true, delete: true },
      investors: { read: true, create: true, update: true, delete: true },
      emi: { read: true, create: true, update: true, delete: true },
      ecommerce: { read: true, create: true, update: true, delete: true }
    },
    'Super Admin Plus': {
      dashboard: { read: false, create: false, update: false, delete: false },
      sales: { read: true, create: true, update: true, delete: true },
      purchase: { read: false, create: false, update: false, delete: false },
      products: { read: true, create: true, update: true, delete: true },
      contacts: { read: true, create: true, update: true, delete: true },
      inventory: { read: true, create: true, update: true, delete: true },
      accounts: { read: false, create: false, update: false, delete: false },
      reports: { read: false, create: false, update: false, delete: false },
      users: { read: false, create: false, update: false, delete: false },
      messages: { read: false, create: false, update: false, delete: false },
      settings: { read: true, create: false, update: true, delete: false },
      warranty: { read: true, create: true, update: true, delete: true },
      routes: { read: false, create: false, update: false, delete: false },
      investors: { read: false, create: false, update: false, delete: false },
      emi: { read: false, create: false, update: false, delete: false },
      ecommerce: { read: true, create: true, update: true, delete: true }
    },
    'Manager': {
      dashboard: { read: true, create: true, update: true, delete: false },
      sales: { read: true, create: true, update: true, delete: false },
      purchase: { read: true, create: true, update: true, delete: false },
      products: { read: true, create: true, update: true, delete: false },
      contacts: { read: true, create: true, update: true, delete: false },
      inventory: { read: true, create: true, update: true, delete: false },
      accounts: { read: true, create: false, update: false, delete: false }, // no accounts edit
      reports: { read: true, create: true, update: true, delete: false },
      users: { read: false, create: false, update: false, delete: false },
      messages: { read: true, create: true, update: true, delete: false },
      settings: { read: false, create: false, update: false, delete: false },
      warranty: { read: true, create: true, update: true, delete: false },
      routes: { read: true, create: true, update: true, delete: false },
      investors: { read: false, create: false, update: false, delete: false },
      emi: { read: true, create: true, update: true, delete: false },
      ecommerce: { read: true, create: true, update: true, delete: false }
    },
    'Sales Staff': {
      dashboard: { read: true, create: false, update: false, delete: false },
      sales: { read: true, create: true, update: true, delete: false }, // can make sales entries
      purchase: { read: false, create: false, update: false, delete: false },
      products: { read: true, create: false, update: false, delete: false },
      contacts: { read: true, create: true, update: true, delete: false },
      inventory: { read: true, create: false, update: false, delete: false },
      accounts: { read: false, create: false, update: false, delete: false },
      reports: { read: true, create: false, update: false, delete: false },
      users: { read: false, create: false, update: false, delete: false },
      messages: { read: false, create: false, update: false, delete: false },
      settings: { read: false, create: false, update: false, delete: false },
      warranty: { read: true, create: true, update: true, delete: false },
      routes: { read: true, create: false, update: false, delete: false },
      investors: { read: false, create: false, update: false, delete: false },
      emi: { read: true, create: true, update: true, delete: false },
      ecommerce: { read: false, create: false, update: false, delete: false }
    },
    'Investor': {
      dashboard: { read: false, create: false, update: false, delete: false },
      sales: { read: false, create: false, update: false, delete: false },
      purchase: { read: false, create: false, update: false, delete: false },
      products: { read: false, create: false, update: false, delete: false },
      contacts: { read: false, create: false, update: false, delete: false },
      inventory: { read: false, create: false, update: false, delete: false },
      accounts: { read: false, create: false, update: false, delete: false },
      reports: { read: false, create: false, update: false, delete: false },
      users: { read: false, create: false, update: false, delete: false },
      messages: { read: false, create: false, update: false, delete: false },
      settings: { read: false, create: false, update: false, delete: false },
      warranty: { read: false, create: false, update: false, delete: false },
      routes: { read: false, create: false, update: false, delete: false },
      investors: { read: true, create: false, update: false, delete: false },
      emi: { read: false, create: false, update: false, delete: false },
      ecommerce: { read: false, create: false, update: false, delete: false }
    },
    'E-Commerce Admin': {
      dashboard: { read: false, create: false, update: false, delete: false },
      sales: { read: false, create: false, update: false, delete: false },
      purchase: { read: false, create: false, update: false, delete: false },
      products: { read: true, create: true, update: true, delete: true }, // for e-commerce product management
      contacts: { read: false, create: false, update: false, delete: false },
      inventory: { read: false, create: false, update: false, delete: false },
      accounts: { read: false, create: false, update: false, delete: false },
      reports: { read: false, create: false, update: false, delete: false },
      users: { read: false, create: false, update: false, delete: false },
      messages: { read: false, create: false, update: false, delete: false },
      settings: { read: true, create: false, update: true, delete: false }, // for banner management
      warranty: { read: false, create: false, update: false, delete: false },
      routes: { read: false, create: false, update: false, delete: false },
      investors: { read: false, create: false, update: false, delete: false },
      emi: { read: false, create: false, update: false, delete: false },
      ecommerce: { read: true, create: true, update: true, delete: true } // full e-commerce access
    }
  };

  const handleApplyPreset = (presetName) => {
    if (ROLE_PRESETS[presetName]) {
      setFormData({
        ...formData,
        permissions: JSON.parse(JSON.stringify(ROLE_PRESETS[presetName]))
      });
    }
  };

  // Create role mutation
  const createRoleMutation = useMutation(
    (data) => api.post('/api/roles', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('roles');
        handleCloseDialog();
        resetForm();
      },
      onError: (error) => {
        console.error('Error creating role:', error);
      }
    }
  );

  // Update role mutation
  const updateRoleMutation = useMutation(
    ({ id, data }) => api.put(`/api/roles/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('roles');
        handleCloseDialog();
        resetForm();
      },
      onError: (error) => {
        console.error('Error updating role:', error);
      }
    }
  );

  // Delete role mutation
  const deleteRoleMutation = useMutation(
    (id) => api.delete(`/api/roles/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('roles');
      },
      onError: (error) => {
        console.error('Error deleting role:', error);
        alert(error.response?.data?.message || 'Error deleting role');
      }
    }
  );

  const handleOpenDialog = (role = null) => {
    if (role) {
      setCurrentRole(role);
      setFormData({
        name: role.name,
        isActive: role.isActive,
        permissions: {
          dashboard: { read: false, create: false, update: false, delete: false, ...role.permissions?.dashboard },
          sales: { read: false, create: false, update: false, delete: false, ...role.permissions?.sales },
          purchase: { read: false, create: false, update: false, delete: false, ...role.permissions?.purchase },
          products: { read: false, create: false, update: false, delete: false, ...role.permissions?.products },
          contacts: { read: false, create: false, update: false, delete: false, ...role.permissions?.contacts },
          inventory: { read: false, create: false, update: false, delete: false, ...role.permissions?.inventory },
          accounts: { read: false, create: false, update: false, delete: false, ...role.permissions?.accounts },
          reports: { read: false, create: false, update: false, delete: false, ...role.permissions?.reports },
          users: { read: false, create: false, update: false, delete: false, ...role.permissions?.users },
          messages: { read: false, create: false, update: false, delete: false, ...role.permissions?.messages },
          settings: { read: false, create: false, update: false, delete: false, ...role.permissions?.settings },
          warranty: { read: false, create: false, update: false, delete: false, ...role.permissions?.warranty },
          routes: { read: false, create: false, update: false, delete: false, ...role.permissions?.routes },
          investors: { read: false, create: false, update: false, delete: false, ...role.permissions?.investors },
          emi: { read: false, create: false, update: false, delete: false, ...role.permissions?.emi },
          ecommerce: { read: false, create: false, update: false, delete: false, ...role.permissions?.ecommerce }
        }
      });
    } else {
      setCurrentRole(null);
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentRole(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      isActive: true,
      permissions: {
        dashboard: { read: false, create: false, update: false, delete: false },
        sales: { read: false, create: false, update: false, delete: false },
        purchase: { read: false, create: false, update: false, delete: false },
        products: { read: false, create: false, update: false, delete: false },
        contacts: { read: false, create: false, update: false, delete: false },
        inventory: { read: false, create: false, update: false, delete: false },
        accounts: { read: false, create: false, update: false, delete: false },
        reports: { read: false, create: false, update: false, delete: false },
        users: { read: false, create: false, update: false, delete: false },
        messages: { read: false, create: false, update: false, delete: false },
        settings: { read: false, create: false, update: false, delete: false },
        warranty: { read: false, create: false, update: false, delete: false },
        routes: { read: false, create: false, update: false, delete: false },
        investors: { read: false, create: false, update: false, delete: false },
        emi: { read: false, create: false, update: false, delete: false },
        ecommerce: { read: false, create: false, update: false, delete: false }
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handlePermissionChange = (module, action) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [module]: {
          ...formData.permissions[module],
          [action]: !formData.permissions[module][action]
        }
      }
    });
  };

  const handleEditPermissionChange = (module) => {
    const isEditingNow = formData.permissions[module]?.create || formData.permissions[module]?.update || false;
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [module]: {
          ...formData.permissions[module],
          create: !isEditingNow,
          update: !isEditingNow
        }
      }
    });
  };

  const handleToggleSimplifiedControl = (controlName) => {
    const newPermissions = JSON.parse(JSON.stringify(formData.permissions));
    
    if (controlName === 'view') {
      const isCurrentlyViewOn = Object.values(formData.permissions).some(p => p.read);
      const targetVal = !isCurrentlyViewOn;
      
      const coreModules = ['dashboard', 'sales', 'products', 'inventory', 'ecommerce', 'routes', 'warranty', 'emi', 'messages'];
      coreModules.forEach(mod => {
        newPermissions[mod].read = targetVal;
        if (!targetVal) {
          newPermissions[mod].create = false;
          newPermissions[mod].update = false;
          newPermissions[mod].delete = false;
        }
      });
      
      const isFinancialOn = formData.permissions.accounts?.read || formData.permissions.purchase?.read || false;
      const isCustomerOn = formData.permissions.contacts?.read || false;
      
      if (targetVal) {
        if (isFinancialOn) {
          ['purchase', 'accounts', 'reports', 'investors'].forEach(mod => { newPermissions[mod].read = true; });
        }
        if (isCustomerOn) {
          ['contacts'].forEach(mod => { newPermissions[mod].read = true; });
        }
      } else {
        Object.keys(newPermissions).forEach(mod => {
          newPermissions[mod].read = false;
          newPermissions[mod].create = false;
          newPermissions[mod].update = false;
          newPermissions[mod].delete = false;
        });
      }
    }
    
    else if (controlName === 'edit') {
      const isCurrentlyEditOn = Object.values(formData.permissions).some(p => p.create || p.update);
      const targetVal = !isCurrentlyEditOn;
      
      Object.keys(newPermissions).forEach(mod => {
        if (newPermissions[mod].read) {
          newPermissions[mod].create = targetVal;
          newPermissions[mod].update = targetVal;
        } else {
          newPermissions[mod].create = false;
          newPermissions[mod].update = false;
        }
        if (!targetVal) {
          newPermissions[mod].delete = false;
        }
      });
    }
    
    else if (controlName === 'delete') {
      const isCurrentlyDeleteOn = Object.values(formData.permissions).some(p => p.delete);
      const targetVal = !isCurrentlyDeleteOn;
      
      Object.keys(newPermissions).forEach(mod => {
        if (newPermissions[mod].read && (newPermissions[mod].create || newPermissions[mod].update)) {
          newPermissions[mod].delete = targetVal;
        } else {
          newPermissions[mod].delete = false;
        }
      });
    }
    
    else if (controlName === 'financial') {
      const isCurrentlyFinancialOn = formData.permissions.accounts?.read || formData.permissions.purchase?.read || false;
      const targetVal = !isCurrentlyFinancialOn;
      
      const financialModules = ['purchase', 'accounts', 'reports', 'investors'];
      financialModules.forEach(mod => {
        newPermissions[mod].read = targetVal;
        newPermissions[mod].create = targetVal ? (Object.values(formData.permissions).some(p => p.create || p.update)) : false;
        newPermissions[mod].update = targetVal ? (Object.values(formData.permissions).some(p => p.create || p.update)) : false;
        newPermissions[mod].delete = targetVal ? (Object.values(formData.permissions).some(p => p.delete)) : false;
      });
    }
    
    else if (controlName === 'customer') {
      const isCurrentlyCustomerOn = formData.permissions.contacts?.read || false;
      const targetVal = !isCurrentlyCustomerOn;
      
      const customerModules = ['contacts'];
      customerModules.forEach(mod => {
        newPermissions[mod].read = targetVal;
        newPermissions[mod].create = targetVal ? (Object.values(formData.permissions).some(p => p.create || p.update)) : false;
        newPermissions[mod].update = targetVal ? (Object.values(formData.permissions).some(p => p.create || p.update)) : false;
        newPermissions[mod].delete = targetVal ? (Object.values(formData.permissions).some(p => p.delete)) : false;
      });
    }
    
    setFormData({
      ...formData,
      permissions: newPermissions
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (currentRole) {
      updateRoleMutation.mutate({ id: currentRole._id, data: formData });
    } else {
      createRoleMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      deleteRoleMutation.mutate(id);
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Error loading roles: {error.message}</Alert>
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
              <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 700, fontSize: '1.3rem' }}>
                Role Management
              </Typography>
              {user?.permissions?.users?.create && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
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
                  Add New Role
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          {/* Minimal List View */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {roles?.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '12px', boxShadow: 'none', bgcolor: '#f8fafc' }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                  No roles found
                </Typography>
              </Paper>
            ) : (
              roles?.map((role) => (
                <Paper key={role._id} sx={{
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
                        {role.name.charAt(0).toUpperCase()}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>
                          {role.name}
                          {PERMANENT_ROLES.includes(role.name) && (
                            <Chip
                              label="Permanent"
                              size="small"
                              variant="filled"
                              sx={{
                                bgcolor: '#fef3c7',
                                color: '#92400e',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 20,
                                ml: 1
                              }}
                            />
                          )}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.25 }}>
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                            Created: {new Date(role.createdAt).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                            •
                          </Typography>
                          <Chip
                            label={role.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            variant="filled"
                            sx={{
                              bgcolor: role.isActive ? '#d1fae5' : '#fee2e2',
                              color: role.isActive ? '#065f46' : '#991b1b',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 22
                            }}
                          />
                          <Chip
                            label={`${Object.keys(role.permissions || {}).filter(module =>
                              Object.values(role.permissions[module]).some(permission => permission)
                            ).length} active permissions`}
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
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexShrink: 0 }}>
                      {(user?.permissions?.users?.update || user?.permissions?.users?.delete) && (
                        <>
                          {user?.permissions?.users?.update && (
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(role)}
                              sx={{ color: '#64748b', '&:hover': { color: '#0f172a', bgcolor: '#f1f5f9' } }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          {user?.permissions?.users?.delete && !PERMANENT_ROLES.includes(role.name) && (
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(role._id)}
                              sx={{ color: '#64748b', '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </>
                      )}
                    </Box>
                  </Box>
                </Paper>
              ))
            )}
          </Box>
        </Grid>

        {/* Add/Edit Role Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="lg" 
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: '#FFFFFF',
              color: '#1E293B'
            }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: '#FFFFFF', 
            color: '#1E293B', 
            fontWeight: 600, 
            fontSize: '1.2rem', 
            p: 2, 
            borderBottom: '1px solid #E2E8F0'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600 }}>
                {currentRole ? 'Edit Role' : 'Add New Role'}
              </Typography>
              <Chip
                label={currentRole ? 'Editing' : 'Creating'}
                color={currentRole ? 'warning' : 'primary'}
                size="small"
                variant="outlined"
                sx={{ color: '#1E293B', borderColor: '#CBD5E1' }}
              />
            </Box>
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ bgcolor: '#FFFFFF' }}>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label="Role Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    inputProps={{ maxLength: 50 }}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      sx: { 
                        borderRadius: '8px',
                        backgroundColor: '#F5F7FA',
                        color: '#1E293B',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E2E8F0'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E2E8F0'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6366F1'
                        }
                      }
                    }}
                    InputLabelProps={{
                      sx: { color: '#94A3B8' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center', pt: { xs: 0, md: 2 }, pl: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        color="success"
                      />
                    }
                    label={<span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Active Status</span>}
                    labelPlacement="end"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: '#F8FAFC', 
                    borderRadius: '8px', 
                    border: '1px solid #E2E8F0', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    flexWrap: 'wrap',
                    mb: 1
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
                      Load Standard Preset Template:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {Object.keys(ROLE_PRESETS).map((preset) => (
                        <Button
                          key={preset}
                          variant="outlined"
                          size="small"
                          onClick={() => handleApplyPreset(preset)}
                          sx={{
                            borderColor: '#CBD5E1',
                            color: '#475569',
                            backgroundColor: '#FFFFFF',
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '6px',
                            '&:hover': {
                              borderColor: '#1D5F99',
                              color: '#1D5F99',
                              backgroundColor: '#F0F9FF'
                            }
                          }}
                        >
                          {preset}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                </Grid>

                {/* Simplified Access Control Panel */}
                <Grid item xs={12}>
                  <Card
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      background: 'linear-gradient(to right, #F8FAFC, #FFFFFF)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                        🔑 Simplified Access Control
                      </Typography>
                      <Chip
                        label="New Standard"
                        size="small"
                        sx={{ height: 20, bgcolor: '#EEF2F6', color: '#1D5F99', fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2, fontSize: '0.8rem' }}>
                      Manage user permissions globally using 5 unified axes. Toggling these will automatically adjust the granular permissions matrix below.
                    </Typography>

                    <Grid container spacing={2}>
                      {/* View Access */}
                      <Grid item xs={12} sm={4} md={2.4}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: '8px',
                          border: '1px solid #bae6fd',
                          bgcolor: '#e0f2fe',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          height: '100%'
                        }}>
                          <Typography variant="h5" sx={{ mb: 1 }}>👁️</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0369a1', fontSize: '0.85rem' }}>Global View</Typography>
                          <Typography variant="caption" sx={{ color: '#0284c7', display: 'block', height: 32, fontSize: '0.7rem', my: 0.5 }}>Read modules and basic dashboards</Typography>
                          <Switch
                            checked={Object.values(formData.permissions).some(p => p.read)}
                            onChange={() => handleToggleSimplifiedControl('view')}
                            color="primary"
                            size="small"
                          />
                        </Box>
                      </Grid>

                      {/* Edit Access */}
                      <Grid item xs={12} sm={4} md={2.4}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: '8px',
                          border: '1px solid #e9d5ff',
                          bgcolor: '#faf5ff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          height: '100%'
                        }}>
                          <Typography variant="h5" sx={{ mb: 1 }}>✏️</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#7e22ce', fontSize: '0.85rem' }}>Global Edit</Typography>
                          <Typography variant="caption" sx={{ color: '#a855f7', display: 'block', height: 32, fontSize: '0.7rem', my: 0.5 }}>Create or edit business records</Typography>
                          <Switch
                            checked={Object.values(formData.permissions).some(p => p.create || p.update)}
                            onChange={() => handleToggleSimplifiedControl('edit')}
                            color="secondary"
                            size="small"
                            disabled={!Object.values(formData.permissions).some(p => p.read)}
                          />
                        </Box>
                      </Grid>

                      {/* Delete Access */}
                      <Grid item xs={12} sm={4} md={2.4}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: '8px',
                          border: '1px solid #fecaca',
                          bgcolor: '#fef2f2',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          height: '100%'
                        }}>
                          <Typography variant="h5" sx={{ mb: 1 }}>🗑️</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#b91c1c', fontSize: '0.85rem' }}>Global Delete</Typography>
                          <Typography variant="caption" sx={{ color: '#ef4444', display: 'block', height: 32, fontSize: '0.7rem', my: 0.5 }}>Delete or void ledger/sale records</Typography>
                          <Switch
                            checked={Object.values(formData.permissions).some(p => p.delete)}
                            onChange={() => handleToggleSimplifiedControl('delete')}
                            color="error"
                            size="small"
                            disabled={!Object.values(formData.permissions).some(p => p.create || p.update)}
                          />
                        </Box>
                      </Grid>

                      {/* Financial Access */}
                      <Grid item xs={12} sm={6} md={2.4}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: '8px',
                          border: '1px solid #a7f3d0',
                          bgcolor: '#ecfdf5',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          height: '100%'
                        }}>
                          <Typography variant="h5" sx={{ mb: 1 }}>💰</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#047857', fontSize: '0.85rem' }}>Financial Access</Typography>
                          <Typography variant="caption" sx={{ color: '#059669', display: 'block', height: 32, fontSize: '0.7rem', my: 0.5 }}>Unlock purchase, ledger & profit logs</Typography>
                          <Switch
                            checked={formData.permissions.accounts?.read || formData.permissions.purchase?.read || false}
                            onChange={() => handleToggleSimplifiedControl('financial')}
                            color="success"
                            size="small"
                          />
                        </Box>
                      </Grid>

                      {/* Customer Access */}
                      <Grid item xs={12} sm={6} md={2.4}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: '8px',
                          border: '1px solid #fde68a',
                          bgcolor: '#fffbeb',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          height: '100%'
                        }}>
                          <Typography variant="h5" sx={{ mb: 1 }}>👥</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#b45309', fontSize: '0.85rem' }}>Customer Data</Typography>
                          <Typography variant="caption" sx={{ color: '#d97706', display: 'block', height: 32, fontSize: '0.7rem', my: 0.5 }}>Unlock customer directory & details</Typography>
                          <Switch
                            checked={formData.permissions.contacts?.read || false}
                            onChange={() => handleToggleSimplifiedControl('customer')}
                            color="warning"
                            size="small"
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>

                {/* Permissions Section */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 1, mb: 1, color: '#1E293B', fontWeight: 700, fontSize: '1.1rem' }}>
                    Configure Permissions Matrix
                  </Typography>
                  
                  <Grid container spacing={2.5}>
                    {PERMISSION_GROUPS.map((group) => (
                      <Grid item xs={12} md={6} key={group.title}>
                        <Card 
                          elevation={0} 
                          sx={{ 
                            border: `1px solid ${group.borderColor}`, 
                            borderRadius: '12px',
                            height: '100%',
                            overflow: 'hidden'
                          }}
                        >
                          <Box sx={{ 
                            px: 2, 
                            py: 1.25, 
                            bgcolor: group.color, 
                            borderBottom: `1px solid ${group.borderColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.9rem' }}>
                              {group.title}
                            </Typography>
                          </Box>
                          <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {group.modules.map((mod) => {
                              const hasView = formData.permissions[mod.id]?.read || false;
                              const hasEdit = formData.permissions[mod.id]?.create || formData.permissions[mod.id]?.update || false;
                              const hasDel = formData.permissions[mod.id]?.delete || false;
                              
                              return (
                                <Box 
                                  key={mod.id}
                                  sx={{ 
                                    p: 1.25, 
                                    bgcolor: '#F8FAFC', 
                                    borderRadius: '8px',
                                    border: '1px solid #E2E8F0',
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    alignItems: { xs: 'flex-start', sm: 'center' },
                                    justifyContent: 'space-between',
                                    gap: 1.5
                                  }}
                                >
                                  <Box sx={{ flex: 1, pr: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.85rem', mb: 0.25 }}>
                                      {mod.label}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', lineHeight: 1.3 }}>
                                      {mod.desc}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0, width: { xs: '100%', sm: 'auto' }, justifyContent: 'space-between' }}>
                                    <FormControlLabel
                                      control={
                                        <Switch
                                          size="small"
                                          checked={hasView}
                                          onChange={() => handlePermissionChange(mod.id, 'read')}
                                          color="primary"
                                        />
                                      }
                                      label={<span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>View</span>}
                                      labelPlacement="bottom"
                                      sx={{ m: 0 }}
                                    />
                                    <FormControlLabel
                                      control={
                                        <Switch
                                          size="small"
                                          checked={hasEdit}
                                          onChange={() => handleEditPermissionChange(mod.id)}
                                          color="info"
                                        />
                                      }
                                      label={<span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Edit</span>}
                                      labelPlacement="bottom"
                                      sx={{ m: 0 }}
                                    />
                                    <FormControlLabel
                                      control={
                                        <Switch
                                          size="small"
                                          checked={hasDel}
                                          onChange={() => handlePermissionChange(mod.id, 'delete')}
                                          color="error"
                                        />
                                      }
                                      label={<span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Delete</span>}
                                      labelPlacement="bottom"
                                      sx={{ m: 0 }}
                                    />
                                  </Box>
                                </Box>
                              );
                            })}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ 
              bgcolor: '#FFFFFF',
              borderTop: '1px solid #E2E8F0',
              p: 2 
            }}>
              <Button
                onClick={handleCloseDialog}
                variant="outlined"
                sx={{
                  borderColor: '#E2E8F0',
                  color: '#94A3B8',
                  '&:hover': {
                    borderColor: '#6366F1',
                    color: '#6366F1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)'
                  },
                  px: 3,
                  py: 1
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={createRoleMutation.isLoading || updateRoleMutation.isLoading}
                sx={{
                  backgroundColor: '#6366F1',
                  color: '#FFFFFF',
                  '&:hover': {
                    backgroundColor: '#4F46E5'
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(99, 102, 241, 0.3)',
                    color: 'rgba(255, 255, 255, 0.5)'
                  },
                  px: 3,
                  py: 1,
                  ml: 1
                }}
              >
                {createRoleMutation.isLoading || updateRoleMutation.isLoading ? 'Saving...' : currentRole ? 'Update Role' : 'Create Role'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Grid>
    </Box>
  );
};

export default Roles;
