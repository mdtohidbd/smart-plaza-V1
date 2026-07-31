import React, { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Switch, Chip,
  CircularProgress, Alert, TextField, InputAdornment,
  Avatar, Tooltip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, Grid, Divider, Select, MenuItem, FormControl
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import StorefrontIcon from '@mui/icons-material/Storefront';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditIcon from '@mui/icons-material/Edit';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../utils/api';
import EcommerceDetailsModal from './EcommerceDetailsModal';

export default function EcommerceAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [priceDialog, setPriceDialog] = useState(null); // { product, batches }
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { data: products = [], isLoading, error } = useQuery('ecommerce-all-products', async () => {
    const r = await api.get('/api/ecommerce-admin/all-products');
    return r.data.data || [];
  }, { refetchOnWindowFocus: false });

  // Fetch preorder demand (pending online order quantities per product)
  const { data: demandMap = {} } = useQuery('ecommerce-preorder-demand', async () => {
    const r = await api.get('/api/ecommerce-admin/preorder-demand');
    return r.data.data || {};
  }, { refetchOnWindowFocus: false });

  const toggleMutation = useMutation(async (productId) => {
    await api.patch(`/api/ecommerce-admin/products/${productId}/toggle`);
  }, {
    onSuccess: () => queryClient.invalidateQueries('ecommerce-all-products'),
  });

  const togglePreorderMutation = useMutation(async (productId) => {
    await api.patch(`/api/ecommerce-admin/products/${productId}/toggle-preorder`);
  }, {
    onSuccess: () => queryClient.invalidateQueries('ecommerce-all-products'),
  });

  const sectionMutation = useMutation(async ({ id, section }) => {
    await api.put(`/api/ecommerce-admin/products/${id}`, { landingPageSection: section });
  }, {
    onSuccess: () => queryClient.invalidateQueries('ecommerce-all-products'),
  });

  const openPriceBreakdown = async (product) => {
    try {
      const r = await api.get(`/api/ecommerce-admin/products/${product._id}/price-breakdown`);
      setPriceDialog({ product, ...r.data.data });
    } catch { /* ignore */ }
  };

  const filtered = products.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    (p.model && p.model.toLowerCase().includes(search.toLowerCase())) ||
    p.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const listedCount = products.filter(p => p.isListedOnEcommerce).length;
  const inStockListed = products.filter(p => p.isListedOnEcommerce && p.isInStock).length;
  const preorderCount = products.filter(p => p.isListedOnEcommerce && p.isPreorder).length;

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={28} /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>Failed to load products</Alert>;

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 } }}>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>

        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 1,
          background: 'linear-gradient(135deg,#f0f7ff 0%,#fff 100%)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StorefrontIcon sx={{ color: '#6366f1', fontSize: '1.2rem' }} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b', fontFamily: '"Outfit",sans-serif' }}>
                Ecommerce Products
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                Control what appears on the public store
              </Typography>
            </Box>
          </Box>
          <TextField placeholder="Search product…" size="small" value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: '0.9rem', color: '#94a3b8' }} /></InputAdornment> }}
            sx={{ width: 210, '& .MuiOutlinedInput-root': { fontSize: '0.78rem', height: 30, borderRadius: '6px' } }} />
        </Box>

        {/* Stats */}
        <Box sx={{ px: 2, py: 0.75, display: 'flex', gap: 1.5, flexWrap: 'wrap',
          borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
          {[
            { label: 'Total Products', value: products.length, color: '#3b82f6', bg: '#eff6ff' },
            { label: 'Listed on Store', value: listedCount, color: '#6366f1', bg: '#f5f3ff' },
            { label: 'Listed & In Stock', value: inStockListed, color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Preorder Enabled', value: preorderCount, color: '#f59e0b', bg: '#fffbeb' },
            { label: 'Not Listed', value: products.length - listedCount, color: '#94a3b8', bg: '#f8fafc' },
          ].map(s => (
            <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5,
              px: 1, py: 0.3, borderRadius: '6px', background: s.bg, border: '1px solid #e2e8f0' }}>
              <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 500 }}>{s.label}:</Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: s.color }}>{s.value}</Typography>
            </Box>
          ))}
        </Box>

        {/* Table */}
        {/* Mobile View: Product Cards */}
        <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 1.5, p: 1.5 }}>
          {filtered.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#fff', border: '1px solid #eaeef3', borderRadius: '8px' }}>
              <Typography variant="body2" color="textSecondary">
                No products found.
              </Typography>
            </Paper>
          ) : (
            filtered.map(p => (
              <Paper
                key={p._id}
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  position: 'relative'
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                  <Avatar src={p.image} alt={p.name}
                    sx={{ width: 44, height: 44, borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Box sx={{ pr: 4 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B', lineHeight: 1.25 }}>
                      {p.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.67rem', color: '#94a3b8', fontFamily: 'monospace', mt: 0.5 }}>
                      Model: {p.model || '—'}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={1.5} sx={{ borderTop: '1px solid #F1F5F9', pt: 1.5, mb: 1.5 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary" display="block">Category</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1E293B' }}>{p.category?.name || '—'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary" display="block">Stock Status</Typography>
                    <Chip
                      label={p.isInStock ? `${p.currentStock} units` : 'Out of Stock'}
                      size="small"
                      sx={{
                        height: 18, fontSize: '0.62rem', fontWeight: 700,
                        background: p.isInStock ? '#f0fdf4' : '#fef2f2',
                        color: p.isInStock ? '#16a34a' : '#dc2626',
                        border: `1px solid ${p.isInStock ? '#bbf7d0' : '#fecaca'}`,
                        mt: 0.25
                      }} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary" display="block">Ecommerce Price</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                      <Typography sx={{ fontWeight: 700, color: '#6366f1', fontSize: '0.82rem' }}>
                        {p.ecommerceDisplayPrice ? `৳${Number(p.ecommerceDisplayPrice).toLocaleString()}` : '—'}
                      </Typography>
                      {p.activeBatchCount > 1 && (
                        <IconButton size="small" onClick={() => openPriceBreakdown(p)} sx={{ p: 0.2 }}>
                          <InfoOutlinedIcon sx={{ fontSize: '0.85rem', color: '#94a3b8' }} />
                        </IconButton>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary" display="block">Retail Listed</Typography>
                    <Chip label={p.isRetailProduct ? 'Yes' : 'No'} size="small"
                      sx={{ 
                        height: 18, fontSize: '0.62rem', fontWeight: 700, mt: 0.25,
                        background: p.isRetailProduct ? '#f0fdf4' : '#f8fafc',
                        color: p.isRetailProduct ? '#16a34a' : '#94a3b8' 
                      }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary" display="block">Landing Section</Typography>
                    <FormControl size="small" sx={{ mt: 0.5, minWidth: 140 }}>
                      <Select
                        value={p.landingPageSection || 'Default'}
                        onChange={(e) => sectionMutation.mutate({ id: p._id, section: e.target.value })}
                        disabled={sectionMutation.isLoading}
                        sx={{ fontSize: '0.75rem', height: 30 }}
                      >
                        <MenuItem value="Default" sx={{ fontSize: '0.75rem' }}>Default (New Arrivals)</MenuItem>
                        <MenuItem value="Featured Products" sx={{ fontSize: '0.75rem' }}>Featured Products</MenuItem>
                        <MenuItem value="Best Sellers" sx={{ fontSize: '0.75rem' }}>Best Sellers</MenuItem>
                        <MenuItem value="Hot Deals" sx={{ fontSize: '0.75rem' }}>Hot Deals</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Switch
                      size="small"
                      checked={p.isListedOnEcommerce}
                      onChange={() => toggleMutation.mutate(p._id)}
                      disabled={toggleMutation.isLoading}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#6366f1' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { background: '#6366f1' } }}
                    />
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 600,
                      color: p.isListedOnEcommerce ? '#6366f1' : '#94a3b8' }}>
                      {p.isListedOnEcommerce ? 'Listed' : 'Hidden'}
                    </Typography>
                  </Box>

                  <IconButton 
                    size="small" 
                    onClick={() => { setSelectedProduct(p); setEditModalOpen(true); }}
                    sx={{ color: '#6366f1', background: '#eff6ff', '&:hover': { background: '#dbeafe' }, borderRadius: '8px' }}
                  >
                    <EditIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Box>
              </Paper>
            ))
          )}
        </Box>

        {/* Desktop View: Table */}
        <TableContainer sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#f8fafc' }}>
                {['Product', 'Category', 'Stock / Demand', 'Ecommerce Price', 'Landing Section', 'Retail Listed', 'Ecommerce Listed', 'Preorder', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#64748b',
                    textTransform: 'uppercase', py: 0.75, px: 1.5, whiteSpace: 'nowrap' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3, color: '#94a3b8', fontSize: '0.8rem' }}>
                    No products found.
                  </TableCell>
                </TableRow>
              ) : filtered.map(p => {
                const demand = demandMap[p._id];
                return (
                  <TableRow key={p._id} sx={{
                    '&:nth-of-type(odd)': { background: '#fafafa' },
                    '&:hover': { background: '#f0f7ff' },
                    '& .MuiTableCell-root': { py: 0.6, px: 1.5, fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9' }
                  }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={p.image} alt={p.name}
                          sx={{ width: 28, height: 28, borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                        <Box>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1e293b', lineHeight: 1.2 }}>
                            {p.name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.67rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {p.model || '—'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{p.category?.name || '—'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                        <Chip
                          label={p.isInStock
                            ? (p.actualStock > 0 ? `${p.actualStock} units` : 'Preorder In Stock')
                            : 'Out of Stock'}
                          size="small"
                          sx={{
                            height: 18, fontSize: '0.62rem', fontWeight: 700,
                            background: p.isInStock ? (p.actualStock > 0 ? '#f0fdf4' : '#fffbeb') : '#fef2f2',
                            color: p.isInStock ? (p.actualStock > 0 ? '#16a34a' : '#d97706') : '#dc2626',
                            border: `1px solid ${p.isInStock ? (p.actualStock > 0 ? '#bbf7d0' : '#fde68a') : '#fecaca'}`
                          }} />
                        {demand && demand.pendingQty > 0 && (
                          <Tooltip title={`${demand.orderCount} pending online order(s) waiting for this product`}>
                            <Chip
                              icon={<ShoppingCartIcon sx={{ fontSize: '0.65rem !important' }} />}
                              label={`${demand.pendingQty} pending`}
                              size="small"
                              sx={{
                                height: 18, fontSize: '0.62rem', fontWeight: 700,
                                background: '#fff7ed', color: '#c2410c',
                                border: '1px solid #fed7aa', cursor: 'help'
                              }} />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography sx={{ fontWeight: 700, color: '#6366f1', fontSize: '0.82rem' }}>
                          {p.ecommerceDisplayPrice ? `৳${Number(p.ecommerceDisplayPrice).toLocaleString()}` : '—'}
                        </Typography>
                        {p.activeBatchCount > 1 && (
                          <Tooltip title={`${p.activeBatchCount} active batches — showing highest price`}>
                            <IconButton size="small" onClick={() => openPriceBreakdown(p)} sx={{ p: 0.2 }}>
                              <InfoOutlinedIcon sx={{ fontSize: '0.85rem', color: '#94a3b8' }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {p.activeBatchCount > 1 && (
                          <Chip label={`${p.activeBatchCount} batches`} size="small"
                            sx={{ height: 16, fontSize: '0.6rem', background: '#f5f3ff', color: '#6366f1', border: '1px solid #ddd6fe' }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={p.landingPageSection || 'Default'}
                          onChange={(e) => sectionMutation.mutate({ id: p._id, section: e.target.value })}
                          disabled={sectionMutation.isLoading}
                          sx={{ fontSize: '0.75rem', height: 26, '& .MuiSelect-select': { py: 0.5 } }}
                        >
                          <MenuItem value="Default" sx={{ fontSize: '0.75rem' }}>Default</MenuItem>
                          <MenuItem value="Featured Products" sx={{ fontSize: '0.75rem' }}>Featured</MenuItem>
                          <MenuItem value="Best Sellers" sx={{ fontSize: '0.75rem' }}>Best Sellers</MenuItem>
                          <MenuItem value="Hot Deals" sx={{ fontSize: '0.75rem' }}>Hot Deals</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <Chip label={p.isRetailProduct ? 'Yes' : 'No'} size="small"
                        sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700,
                          background: p.isRetailProduct ? '#f0fdf4' : '#f8fafc',
                          color: p.isRetailProduct ? '#16a34a' : '#94a3b8' }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Switch
                          size="small"
                          checked={p.isListedOnEcommerce}
                          onChange={() => toggleMutation.mutate(p._id)}
                          disabled={toggleMutation.isLoading}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#6366f1' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { background: '#6366f1' } }}
                        />
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600,
                          color: p.isListedOnEcommerce ? '#6366f1' : '#94a3b8' }}>
                          {p.isListedOnEcommerce ? 'Listed' : 'Hidden'}
                        </Typography>
                      </Box>
                    </TableCell>
                    {/* Preorder Toggle */}
                    <TableCell>
                      <Tooltip title={
                        p.isPreorder
                          ? 'Preorder ON — shows as In Stock even with 0 physical stock'
                          : 'Preorder OFF — only shows In Stock when physical stock > 0'
                      }>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Switch
                            size="small"
                            checked={!!p.isPreorder}
                            onChange={() => togglePreorderMutation.mutate(p._id)}
                            disabled={togglePreorderMutation.isLoading}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': { color: '#f59e0b' },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { background: '#f59e0b' }
                            }}
                          />
                          <Typography sx={{ fontSize: '0.67rem', fontWeight: 600,
                            color: p.isPreorder ? '#d97706' : '#94a3b8' }}>
                            {p.isPreorder ? 'Pre' : 'Off'}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit Ecommerce Details">
                        <IconButton 
                          size="small" 
                          onClick={() => { setSelectedProduct(p); setEditModalOpen(true); }}
                          sx={{ color: '#6366f1', background: '#eff6ff', '&:hover': { background: '#dbeafe' } }}
                        >
                          <EditIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Price Breakdown Dialog */}
      <Dialog open={!!priceDialog} onClose={() => setPriceDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '0.9rem', fontWeight: 700, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon sx={{ color: '#6366f1', fontSize: '1.1rem' }} />
            Price Breakdown — {priceDialog?.product?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {priceDialog?.batches?.length > 0 ? (
            <>
              <Alert severity="info" sx={{ mb: 1.5, fontSize: '0.75rem' }}>
                Ecommerce shows highest price: <strong>৳{priceDialog.displayPrice?.toLocaleString()}</strong>
              </Alert>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: '#f8fafc' }}>
                    {['Batch #', 'Date', 'Buy Price', 'Sell Price', 'Remaining'].map(h => (
                      <TableCell key={h} sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', py: 0.75 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {priceDialog.batches.map(b => (
                    <TableRow key={b._id}>
                      <TableCell sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{b.batchNumber}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{new Date(b.purchaseDate).toLocaleDateString('en-BD')}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>৳{b.purchasePrice?.toLocaleString()}</TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', fontWeight: 700, color: b.sellingPrice === priceDialog.maxSellingPrice ? '#6366f1' : '#1e293b' }}>
                        ৳{b.sellingPrice?.toLocaleString()}
                        {b.sellingPrice === priceDialog.maxSellingPrice && (
                          <Chip label="Shown" size="small" sx={{ ml: 0.5, height: 15, fontSize: '0.55rem', background: '#f5f3ff', color: '#6366f1' }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{b.remainingQty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <Typography sx={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', py: 2 }}>
              No active batches with stock.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPriceDialog(null)} size="small">Close</Button>
        </DialogActions>
      </Dialog>

      <EcommerceDetailsModal 
        open={editModalOpen} 
        onClose={() => { setEditModalOpen(false); setSelectedProduct(null); }} 
        product={selectedProduct} 
      />
    </Box>
  );
}
