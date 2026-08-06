import React, { useState, useMemo } from 'react';
import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, TextField, InputAdornment, Grid, IconButton, Tooltip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, Snackbar, Chip, useTheme, useMediaQuery, Collapse, TablePagination, Skeleton } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Image as ImageIcon, Visibility as VisibilityIcon, KeyboardArrowDown as KeyboardArrowDownIcon, KeyboardArrowUp as KeyboardArrowUpIcon, Inventory as InventoryIcon, Storefront as StorefrontIcon, ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { cloudThumb } from '../../utils/cloudinaryUtils';

const renderPriceWithDiscrepancy = (product, activeBatches, type) => {
  if (!activeBatches || activeBatches.length === 0) {
    if (type === 'purchase') {
      return `৳${(product.purchasePrice || 0).toLocaleString()}`;
    } else if (type === 'selling') {
      return `৳${(product.sellingPrice || 0).toLocaleString()}`;
    } else {
      const ecomPrice = product.sellingPrice || 0;
      return `৳${ecomPrice.toLocaleString()}`;
    }
  }

  const prices = activeBatches.map(batch => {
    if (type === 'purchase') return batch.purchasePrice;
    if (type === 'selling') return batch.sellingPrice;
    return batch.ecommercePriceOverride !== undefined && batch.ecommercePriceOverride !== null
      ? batch.ecommercePriceOverride
      : batch.sellingPrice;
  });

  const uniquePrices = [...new Set(prices)].filter(p => p !== undefined && p !== null);

  if (uniquePrices.length === 0) {
    if (type === 'purchase') {
      return `৳${(product.purchasePrice || 0).toLocaleString()}`;
    } else if (type === 'selling') {
      return `৳${(product.sellingPrice || 0).toLocaleString()}`;
    } else {
      const ecomPrice = product.sellingPrice || 0;
      return `৳${ecomPrice.toLocaleString()}`;
    }
  }

  if (uniquePrices.length === 1) {
    return `৳${uniquePrices[0].toLocaleString()}`;
  }

  const minPrice = Math.min(...uniquePrices);
  const maxPrice = Math.max(...uniquePrices);

  return (
    <span title={`${activeBatches.length} Active Batches with differing prices`}>
      ৳{minPrice.toLocaleString()} - ৳{maxPrice.toLocaleString()}{' '}
      <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 500 }}>
        ({activeBatches.length} Batches)
      </span>
    </span>
  );
};

const ProductCard = ({
  product,
  hasUpdatePermission,
  hasDeletePermission,
  navigate,
  setProductIdToDelete,
  setDeleteDialogOpen,
  getProductQuantity,
  getStockColor,
  isInventoryLoading,
  activeBatches = []
}) => {
  const [open, setOpen] = useState(false);

  const { data: batches, isLoading: isBatchesLoading } = useQuery(
    ['productBatches', product._id],
    async () => {
      const response = await api.get(`/api/stock-batches/product/${product._id}`);
      return response.data;
    },
    {
      enabled: open,
      refetchOnWindowFocus: false,
    }
  );

  const qty = getProductQuantity(product._id);
  const batchesList = batches?.data || [];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        backgroundColor: '#fff',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.05)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)'
        }
      }}
    >
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {/* Image */}
        <Box sx={{ flexShrink: 0 }}>
          {product.image ? (
            <img
              src={cloudThumb(product.image)}
              alt={product.name}
              style={{
                width: '65px',
                height: '65px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}
            />
          ) : (
            <Box
              sx={{
                width: 65,
                height: 65,
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ImageIcon fontSize="medium" sx={{ color: '#94a3b8' }} />
            </Box>
          )}
        </Box>

        {/* Info */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.3, mb: 0.5, fontFamily: '"Outfit", sans-serif' }}>
            {product.name}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5, fontFamily: '"Outfit", sans-serif', fontWeight: 500 }}>
            Model: {product.model || 'N/A'}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
            {product.category?.name && (
              <span style={{
                fontSize: '10.5px',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                fontWeight: 600,
                border: '1px solid #e2e8f0',
                fontFamily: '"Outfit", sans-serif'
              }}>
                {product.category.name}
              </span>
            )}
            {product.brand?.name && (
              <span style={{
                fontSize: '10.5px',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                fontWeight: 600,
                border: '1px solid #dbeafe',
                fontFamily: '"Outfit", sans-serif'
              }}>
                {product.brand.name}
              </span>
            )}
            <Chip
              label={product.isListedOnEcommerce ? 'Online' : 'Offline'}
              size="small"
              color={product.isListedOnEcommerce ? 'success' : 'default'}
              variant="outlined"
              sx={{ height: '18px', fontSize: '10px', fontWeight: 600 }}
            />
          </Box>
          {(product.colors?.length > 0 || product.color) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>Colors:</Typography>
              {product.colors?.length > 0 ? (
                product.colors.map((c, cIdx) => (
                  <Tooltip key={cIdx} title={c.name || 'Color'}>
                    <Box sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      bgcolor: c.code || '#14B8A6',
                      border: (c.code === '#FFFFFF' || c.code === '#ffffff') ? '1px solid #94A3B8' : '1px solid rgba(0,0,0,0.15)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }} />
                  </Tooltip>
                ))
              ) : (
                <Chip label={product.color} size="small" sx={{ height: '16px', fontSize: '9px', bgcolor: '#F1F5F9' }} />
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Price Details */}
      <Box sx={{ 
        mt: 2, 
        pt: 1.5, 
        borderTop: '1px solid #f1f5f9',
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 1.5,
        textAlign: 'center'
      }}>
        <Box sx={{ backgroundColor: '#f8fafc', py: 0.75, borderRadius: '8px', border: '1px solid #f1f5f9' }}>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '10.5px', fontWeight: 500, fontFamily: '"Outfit", sans-serif' }}>
            Purchase Price
          </Typography>
          <Typography variant="subtitle2" sx={{ color: '#10b981', fontWeight: 700, fontSize: '12.5px', fontFamily: '"Outfit", sans-serif' }}>
            {renderPriceWithDiscrepancy(product, activeBatches, 'purchase')}
          </Typography>
        </Box>
        <Box sx={{ backgroundColor: '#f5f3ff', py: 0.75, borderRadius: '8px', border: '1px solid #ede9fe' }}>
          <Typography variant="caption" sx={{ color: '#6d28d9', display: 'block', fontSize: '10.5px', fontWeight: 500, fontFamily: '"Outfit", sans-serif' }}>
            Selling Price
          </Typography>
          <Typography variant="subtitle2" sx={{ color: '#6366f1', fontWeight: 700, fontSize: '12.5px', fontFamily: '"Outfit", sans-serif' }}>
            {renderPriceWithDiscrepancy(product, activeBatches, 'selling')}
          </Typography>
        </Box>
        <Box sx={{ backgroundColor: '#faf5ff', py: 0.75, borderRadius: '8px', border: '1px solid #f3e8ff' }}>
          <Typography variant="caption" sx={{ color: '#7c3aed', display: 'block', fontSize: '10.5px', fontWeight: 500, fontFamily: '"Outfit", sans-serif' }}>
            Ecommerce Price
          </Typography>
          <Typography variant="subtitle2" sx={{ color: '#8b5cf6', fontWeight: 700, fontSize: '12.5px', fontFamily: '"Outfit", sans-serif' }}>
            {renderPriceWithDiscrepancy(product, activeBatches, 'ecommerce')}
          </Typography>
        </Box>
        <Box sx={{ backgroundColor: '#fffbeb', py: 0.75, borderRadius: '8px', border: '1px solid #fef3c7' }}>
          <Typography variant="caption" sx={{ color: '#b45309', display: 'block', fontSize: '10.5px', fontWeight: 500, fontFamily: '"Outfit", sans-serif' }}>
            MRP
          </Typography>
          <Typography variant="subtitle2" sx={{ color: '#f59e0b', fontWeight: 700, fontSize: '12.5px', fontFamily: '"Outfit", sans-serif' }}>
            ৳{(product.mrp || 0).toLocaleString()}
          </Typography>
        </Box>
      </Box>

      {/* Stock & Action footer */}
      <Box sx={{ 
        mt: 2, 
        pt: 1.5, 
        borderTop: '1px dashed #e2e8f0',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#475569', fontSize: '12px', fontWeight: 600, fontFamily: '"Outfit", sans-serif' }}>
            Stock:
          </Typography>
          {isInventoryLoading ? (
            <CircularProgress size={14} />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 1.25,
                  py: 0.5,
                  backgroundColor: getStockColor(qty, product),
                  borderRadius: '6px',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '11.5px',
                  fontFamily: '"Outfit", sans-serif',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                {qty} {product.unit?.name || ''}
              </Box>
              {product.isPreorder && (
                <Chip
                  label="Preorder"
                  size="small"
                  sx={{ height: '20px', fontSize: '10px', fontWeight: 600, backgroundColor: '#fef3c7', color: '#d97706', alignSelf: 'flex-start' }}
                />
              )}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setOpen(!open)}
            sx={{
              textTransform: 'none',
              borderRadius: '6px',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 600,
              fontSize: '11px',
              py: 0.5
            }}
          >
            {open ? 'Hide Batches' : `${activeBatches.length} Batches`}
          </Button>

          {qty === 0 && (
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={() => navigate(`/dashboard/inventory/stock-in?product=${product._id}`)}
              sx={{
                textTransform: 'none',
                borderRadius: '6px',
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 600,
                fontSize: '11px',
                py: 0.5,
                boxShadow: 'none'
              }}
            >
              Stock In
            </Button>
          )}

          {(hasUpdatePermission || hasDeletePermission) && (
            <>
              <Tooltip title="View in Stock List">
                <IconButton
                  size="small"
                  color="info"
                  onClick={() => navigate('/dashboard/inventory/stock-list?search=' + encodeURIComponent(product.sku || product.name))}
                  sx={{
                    p: 0.75,
                    border: '1px solid #e0f2fe',
                    borderRadius: '8px',
                    backgroundColor: '#f0f9ff',
                    '&:hover': {
                      backgroundColor: '#e0f2fe',
                      borderColor: '#bae6fd'
                    }
                  }}
                >
                  <InventoryIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {product.isListedOnEcommerce && (
                <Tooltip title="View in Ecommerce List">
                  <IconButton
                    size="small"
                    color="secondary"
                    onClick={() => navigate('/dashboard/products/ecommerce?search=' + encodeURIComponent(product.sku || product.name))}
                    sx={{
                      p: 0.75,
                      border: '1px solid #f3e8ff',
                      borderRadius: '8px',
                      backgroundColor: '#faf5ff',
                      '&:hover': {
                        backgroundColor: '#f3e8ff',
                        borderColor: '#e9d5ff'
                      }
                    }}
                  >
                    <StorefrontIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {hasUpdatePermission && (
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => navigate(`/dashboard/products/edit/${product._id}`)}
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
              {hasDeletePermission && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    setProductIdToDelete(product._id);
                    setDeleteDialogOpen(true);
                  }}
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
            </>
          )}
        </Box>
      </Box>

      {/* Collapse Batches Stack */}
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.8rem', fontFamily: '"Outfit", sans-serif' }}>
            Batches Info
          </Typography>
          {isBatchesLoading ? (
            <Box sx={{ py: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="textSecondary" sx={{ fontFamily: '"Outfit", sans-serif' }}>Loading...</Typography>
            </Box>
          ) : !batchesList || batchesList.length === 0 ? (
            <Typography variant="caption" color="textSecondary" sx={{ py: 0.5, fontFamily: '"Outfit", sans-serif', fontStyle: 'italic' }}>
              No batches found.
            </Typography>
          ) : (
            batchesList.map(batch => (
              <Box key={batch._id} sx={{ p: 1, backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.72rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <span style={{ fontWeight: 700, color: '#475569', fontFamily: 'monospace' }}>{batch.batchNumber}</span>
                  <Chip
                    label={batch.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={batch.isActive ? 'success' : 'default'}
                    variant="outlined"
                    sx={{ height: '16px', fontSize: '8px', fontWeight: 700 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', mb: 0.5, fontFamily: '"Outfit", sans-serif' }}>
                  <span>Supplier: {batch.supplier?.name || batch.supplier?.companyName || '—'}</span>
                  <span>Date: {new Date(batch.purchaseDate).toLocaleDateString()}</span>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontFamily: '"Outfit", sans-serif' }}>
                  <span>Buy: <strong style={{ color: '#10b981' }}>৳{batch.purchasePrice}</strong> | Sell: <strong style={{ color: '#6366f1' }}>৳{batch.sellingPrice}</strong></span>
                  <span style={{ color: '#1e293b' }}>Qty: {batch.remainingQty}/{batch.quantity}</span>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

const ProductRow = ({
  product,
  index,
  hasUpdatePermission,
  hasDeletePermission,
  navigate,
  setProductIdToDelete,
  setDeleteDialogOpen,
  getProductQuantity,
  getStockColor,
  isInventoryLoading,
  activeBatches = []
}) => {
  const [open, setOpen] = useState(false);

  const { data: batches, isLoading: isBatchesLoading } = useQuery(
    ['productBatches', product._id],
    async () => {
      const response = await api.get(`/api/stock-batches/product/${product._id}`);
      return response.data;
    },
    {
      enabled: open,
      refetchOnWindowFocus: false,
    }
  );

  const qty = getProductQuantity(product._id);
  const batchesList = batches?.data || [];

  return (
    <>
      <TableRow
        sx={{
          backgroundColor: index % 2 === 0 ? 'transparent' : '#F8FAFC',
          '&:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
          },
          '& .MuiTableCell-root': {
            whiteSpace: 'nowrap',
            padding: '4px 8px',
            color: '#1E293B',
            fontSize: '0.8125rem'
          }
        }}
      >
        <TableCell>
          {product.image ? (
            <img
              src={cloudThumb(product.image)}
              alt={product.name}
              style={{
                width: '40px',
                height: '40px',
                objectFit: 'cover',
                borderRadius: '6px'
              }}
            />
          ) : (
            <Box
              sx={{
                width: 40,
                height: 40,
                backgroundColor: '#f0f0f0',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ImageIcon fontSize="small" color="disabled" />
            </Box>
          )}
        </TableCell>
        
        <TableCell sx={{ color: '#1E293B', fontWeight: 500, whiteSpace: 'normal', minWidth: '150px' }}>{product.name}</TableCell>
        <TableCell sx={{ color: '#94A3B8', display: { xs: 'none', lg: 'table-cell' } }}>{product.model || 'N/A'}</TableCell>
        <TableCell sx={{ color: '#94A3B8', display: { xs: 'none', lg: 'table-cell' } }}>{product.category?.name || 'N/A'}</TableCell>
        <TableCell sx={{ color: '#94A3B8', display: { xs: 'none', xl: 'table-cell' } }}>{product.unit?.name || 'N/A'}</TableCell>
        <TableCell align="right" sx={{ color: '#10B981', fontWeight: '500' }}>
          {renderPriceWithDiscrepancy(product, activeBatches, 'purchase')}
        </TableCell>
        <TableCell align="right" sx={{ color: '#6366F1', fontWeight: '500' }}>
          {renderPriceWithDiscrepancy(product, activeBatches, 'selling')}
        </TableCell>
        <TableCell align="right" sx={{ color: '#8B5CF6', fontWeight: '500' }}>
          {renderPriceWithDiscrepancy(product, activeBatches, 'ecommerce')}
        </TableCell>
        <TableCell align="right" sx={{ color: '#F59E0B', fontWeight: '500' }}>৳{(product.mrp || 0).toLocaleString()}</TableCell>
        <TableCell sx={{ color: '#94A3B8', display: { xs: 'none', xl: 'table-cell' }, whiteSpace: 'normal', minWidth: '120px' }}>{product.supplier?.name || 'N/A'}</TableCell>
        <TableCell sx={{ color: '#94A3B8', display: { xs: 'none', lg: 'table-cell' } }}>{product.brand?.name || 'N/A'}</TableCell>
        <TableCell align="center">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
            <Chip
              label={product.isListedOnEcommerce ? 'Online' : 'Offline'}
              size="small"
              color={product.isListedOnEcommerce ? 'success' : 'default'}
              variant="outlined"
              sx={{ fontSize: '11px', fontWeight: 600, height: '22px' }}
            />
            {product.isPreorder && (
              <Chip
                label="Preorder"
                size="small"
                sx={{ fontSize: '10px', fontWeight: 600, height: '20px', backgroundColor: '#fef3c7', color: '#d97706' }}
              />
            )}
          </Box>
        </TableCell>
        <TableCell align="center">
          <Button
            size="small"
            variant="outlined"
            onClick={() => setOpen(!open)}
            endIcon={open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
            sx={{
              textTransform: 'none',
              borderRadius: '20px',
              fontWeight: 600,
              fontSize: '11px',
              padding: '2px 10px',
              color: '#334155',
              borderColor: '#e2e8f0',
              backgroundColor: '#f8fafc',
              '&:hover': {
                backgroundColor: '#f1f5f9',
                borderColor: '#cbd5e1'
              }
            }}
          >
            {activeBatches.length} Batches
          </Button>
        </TableCell>
        {(hasUpdatePermission || hasDeletePermission) && (
          <TableCell align="center">
            {qty === 0 && (
              <Tooltip title="Stock In">
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={() => navigate(`/dashboard/inventory/stock-in?product=${product._id}`)}
                  sx={{
                    minWidth: 'auto',
                    p: '4px 8px',
                    mr: 0.5,
                    textTransform: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    boxShadow: 'none'
                  }}
                >
                  Stock In
                </Button>
              </Tooltip>
            )}
            <Tooltip title="View in Stock List">
              <IconButton
                color="info"
                onClick={() => navigate('/dashboard/inventory/stock-list?search=' + encodeURIComponent(product.sku || product.name))}
                sx={{ '&:hover': { backgroundColor: 'rgba(2, 132, 199, 0.1)' } }}
              >
                <InventoryIcon />
              </IconButton>
            </Tooltip>
            {product.isListedOnEcommerce && (
              <Tooltip title="View in Ecommerce List">
                <IconButton
                  color="secondary"
                  onClick={() => navigate('/dashboard/products/ecommerce?search=' + encodeURIComponent(product.sku || product.name))}
                  sx={{ '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.1)' } }}
                >
                  <StorefrontIcon />
                </IconButton>
              </Tooltip>
            )}
            {hasUpdatePermission && (
              <Tooltip title="Edit Product">
                <IconButton
                  color="primary"
                  onClick={() => navigate(`/dashboard/products/edit/${product._id}`)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(29, 95, 153, 0.1)'
                    }
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
            {hasDeletePermission && (
              <Tooltip title="Delete Product">
                <IconButton
                  color="error"
                  onClick={() => {
                    setProductIdToDelete(product._id);
                    setDeleteDialogOpen(true);
                  }}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 0.1)'
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
          </TableCell>
        )}
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={hasUpdatePermission || hasDeletePermission ? 14 : 13}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, padding: 2, backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
              <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 700, color: '#1e293b', fontFamily: '"Outfit", sans-serif', mb: 1.5 }}>
                Product Batches Info — {product.name}
              </Typography>
              {isBatchesLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="textSecondary" sx={{ fontFamily: '"Outfit", sans-serif' }}>
                    Loading batches...
                  </Typography>
                </Box>
              ) : !batchesList || batchesList.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ fontFamily: '"Outfit", sans-serif', fontStyle: 'italic' }}>
                  No batches have been created for this product yet.
                </Typography>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <Table size="small" aria-label="batches">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                        {[
                          { label: 'Batch Number', align: 'left' },
                          { label: 'Purchase Date', align: 'left' },
                          { label: 'Supplier', align: 'left' },
                          { label: 'Buying Price', align: 'right' },
                          { label: 'Selling Price', align: 'right' },
                          { label: 'Stock (Remaining / Total)', align: 'right' },
                          { label: 'Status', align: 'center' }
                        ].map((col) => (
                          <TableCell
                            key={col.label}
                            align={col.align}
                            sx={{
                              fontWeight: 600,
                              color: '#475569',
                              fontSize: '0.72rem',
                              fontFamily: '"Outfit", sans-serif',
                              py: 1
                            }}
                          >
                            {col.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {batchesList.map((batch) => {
                        const isOut = batch.remainingQty <= 0;
                        return (
                          <TableRow
                            key={batch._id}
                            sx={{
                              '&:hover': { backgroundColor: '#f8fafc' },
                              '& td': {
                                fontSize: '0.75rem',
                                color: '#334155',
                                fontFamily: '"Outfit", sans-serif',
                                py: 1
                              }
                            }}
                          >
                            <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace !important' }}>{batch.batchNumber}</TableCell>
                            <TableCell>{new Date(batch.purchaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</TableCell>
                            <TableCell>{batch.supplier?.name || batch.supplier?.companyName || '—'}</TableCell>
                            <TableCell align="right" sx={{ color: '#10b981', fontWeight: 600 }}>৳{batch.purchasePrice?.toLocaleString()}</TableCell>
                            <TableCell align="right" sx={{ color: '#6366f1', fontWeight: 600 }}>৳{batch.sellingPrice?.toLocaleString()}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: isOut ? '#94a3b8' : '#1e293b' }}>
                              {batch.remainingQty} / {batch.quantity}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={batch.isActive ? 'Active' : 'Inactive'}
                                size="small"
                                color={batch.isActive ? 'success' : 'default'}
                                variant="outlined"
                                sx={{ height: '18px', fontSize: '10px', fontWeight: 700 }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const AllProducts = () => {
  const { user, activeShop } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorOpen, setErrorOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check user permissions
  const hasUpdatePermission = user?.role === 'Super Admin' || user?.permissions?.products?.update === true;
  const hasDeletePermission = user?.role === 'Super Admin' || user?.permissions?.products?.delete === true;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const { data: productsData, isLoading, error } = useQuery(
    ['products', page, rowsPerPage, searchTerm, activeShop?._id],
    async () => {
      const response = await api.get('/api/products', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm
        }
      });
      return response.data;
    },
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  const products = productsData?.data || [];
  const totalProducts = productsData?.total || 0;

  // Fetch active batches to check price discrepancies
  const { data: activeBatches = [] } = useQuery(
    'activeBatches',
    async () => {
      const response = await api.get('/api/stock-batches/active');
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  const activeBatchesByProduct = useMemo(() => {
    const groups = {};
    if (activeBatches && Array.isArray(activeBatches)) {
      activeBatches.forEach(batch => {
        const prodId = batch.product?._id || batch.product;
        if (prodId) {
          if (!groups[prodId]) groups[prodId] = [];
          groups[prodId].push(batch);
        }
      });
    }
    return groups;
  }, [activeBatches]);

  // Fetch inventory to get current quantities
  const { data: inventoryData, isLoading: isInventoryLoading } = useQuery(
    'inventory-stock',
    async () => {
      const response = await api.get('/api/stock-batches/summary');
      return response.data.data;
    },
    {
      enabled: !!products,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const deleteProductMutation = useMutation(
    (id) => api.delete(`/api/products/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        setDeleteDialogOpen(false);
      },
      onError: (error) => {
        console.error('Error deleting product:', error);
        console.log('Error response:', error.response);
        // Show user-friendly error message
        const errorMsg = error.response?.data?.message || error.message || 'Failed to delete product. You may not have permission.';
        console.log('Showing error message:', errorMsg);
        setErrorMessage(errorMsg);
        setErrorOpen(true);
      }
    }
  );

  // Client-side filtering is no longer needed; handled by backend API.

  // Helper function to get current quantity for a product
  const getProductQuantity = (productId) => {
    if (!inventoryData) return 0; // Return 0 instead of 'N/A' while loading
    const stockItem = inventoryData.find(item => item.product._id === productId);
    return stockItem ? stockItem.totalRemaining : 0;
  };

  // Helper function to determine stock status color
  const getStockColor = (quantity, product) => {
    if (quantity === 0) return '#9e9e9e'; // Grey - no stock
    if (quantity < 0) return '#f44336'; // Red - negative stock
    if (quantity <= (product.alertQuantity || 5)) return '#ff9800'; // Orange - low stock
    return '#4caf50'; // Green - good stock
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="rectangular" width={300} height={40} sx={{ borderRadius: 1 }} />
        </Box>
        <Paper elevation={0} sx={{ border: '1px solid #eaeef3', borderRadius: '8px', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                  <TableCell><Skeleton variant="text" width={40} /></TableCell>
                  <TableCell><Skeleton variant="text" width={150} /></TableCell>
                  <TableCell><Skeleton variant="text" width={100} /></TableCell>
                  <TableCell><Skeleton variant="text" width={100} /></TableCell>
                  <TableCell><Skeleton variant="text" width={60} /></TableCell>
                  <TableCell><Skeleton variant="text" width={80} /></TableCell>
                  <TableCell><Skeleton variant="text" width={80} /></TableCell>
                  <TableCell><Skeleton variant="text" width={80} /></TableCell>
                  <TableCell><Skeleton variant="text" width={100} /></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                  <TableRow key={item}>
                    <TableCell><Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: 1 }} /></TableCell>
                    <TableCell><Skeleton variant="text" width={180} /></TableCell>
                    <TableCell><Skeleton variant="text" width={100} /></TableCell>
                    <TableCell><Skeleton variant="text" width={100} /></TableCell>
                    <TableCell><Skeleton variant="text" width={60} /></TableCell>
                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                    <TableCell><Skeleton variant="rectangular" width={100} height={30} sx={{ borderRadius: 1 }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Error loading products: {error.message}</Alert>
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
            elevation={0}
            sx={{
              p: 1.5,
              mb: 1.5,
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              fontFamily: '"Outfit", sans-serif',
            }}
          >
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} sm={4} md={3}>
                <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, fontSize: '1.1rem', mb: 0 }}>
                  All Products
                </Typography>
              </Grid>
              <Grid item xs={12} sm={8} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  placeholder="Search products by name, model, category, brand..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0); // Reset to first page on search
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '6px' }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'space-between', md: 'flex-end' }, gap: 1.5, mt: { xs: 0.5, md: 0 } }}>
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/dashboard/products/add')}
                  sx={{
                    backgroundColor: '#1D5F99',
                    '&:hover': {
                      backgroundColor: '#42A2C2'
                    },
                    borderRadius: '6px',
                    fontWeight: 600,
                    textTransform: 'none',
                    flexGrow: { xs: 1, md: 0 },
                    py: 1
                  }}
                >
                  Add Product
                </Button>
                <Typography variant="caption" color="textSecondary" sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                  (Showing {products.length} of {totalProducts})
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              overflow: 'hidden',
              p: 0
            }}
          >
            {isMobile ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1.5 }}>
                {products?.length > 0 ? (
                  products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      hasUpdatePermission={hasUpdatePermission}
                      hasDeletePermission={hasDeletePermission}
                      navigate={navigate}
                      setProductIdToDelete={setProductIdToDelete}
                      setDeleteDialogOpen={setDeleteDialogOpen}
                      getProductQuantity={getProductQuantity}
                      getStockColor={getStockColor}
                      isInventoryLoading={isInventoryLoading}
                      activeBatches={activeBatchesByProduct[product._id] || []}
                    />
                  ))
                ) : (
                  <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#fff', border: '1px solid #eaeef3', borderRadius: '8px' }}>
                    <Typography variant="body2" color="textSecondary">
                      No products found matching your search criteria.
                    </Typography>
                  </Paper>
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
                            fontSize: '0.7rem',
                            fontFamily: '"Outfit", sans-serif',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: '1px solid #eaeef3',
                            padding: '8px 12px',
                          }
                      }}
                    >
                      <TableCell>Image</TableCell>
                      <TableCell>Product Name</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Model</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Category</TableCell>
                      <TableCell sx={{ display: { xs: 'none', xl: 'table-cell' } }}>Unit</TableCell>
                      <TableCell align="right">Purchase Price</TableCell>
                      <TableCell align="right">Selling Price</TableCell>
                      <TableCell align="right">Ecommerce Price</TableCell>
                      <TableCell align="right">MRP</TableCell>
                      <TableCell sx={{ display: { xs: 'none', xl: 'table-cell' } }}>Supplier</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Brand</TableCell>
                      <TableCell align="center">Ecommerce</TableCell>
                      <TableCell align="center">Batches</TableCell>
                      {(hasUpdatePermission || hasDeletePermission) && (
                        <TableCell align="center">Actions</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products?.length > 0 ? (
                      products.map((product, index) => (
                        <ProductRow
                          key={product._id}
                          product={product}
                          index={index}
                          hasUpdatePermission={hasUpdatePermission}
                          hasDeletePermission={hasDeletePermission}
                          navigate={navigate}
                          setProductIdToDelete={setProductIdToDelete}
                          setDeleteDialogOpen={setDeleteDialogOpen}
                          getProductQuantity={getProductQuantity}
                          getStockColor={getStockColor}
                          isInventoryLoading={isInventoryLoading}
                          activeBatches={activeBatchesByProduct[product._id] || []}
                        />
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={hasUpdatePermission || hasDeletePermission ? 15 : 14} align="center" sx={{ py: 4 }}>
                          <Typography variant="body1" color="textSecondary">
                            No products found matching your search criteria.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <TablePagination
              component="div"
              count={totalProducts}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[20, 50, 100]}
              sx={{ borderTop: '1px solid #eaeef3' }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-product-dialog-title"
        aria-describedby="delete-product-dialog-description"
      >
        <DialogTitle id="delete-product-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-product-dialog-description">
            Are you sure you want to delete this product? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eaeef3', bgcolor: '#F8FAFC' }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              deleteProductMutation.mutate(productIdToDelete);
            }}
            color="error"
            disabled={deleteProductMutation.isLoading}
            autoFocus
          >
            {deleteProductMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={errorOpen}
        autoHideDuration={6000}
        onClose={() => setErrorOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setErrorOpen(false)}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AllProducts;