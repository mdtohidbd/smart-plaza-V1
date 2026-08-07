import React from 'react';
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Divider,
  Autocomplete,
  TextField,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import {
  Remove as RemoveIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const CartTable = ({
  cart,
  isMobile,
  updateQuantity,
  removeFromCart,
  toggleWarranty,
  updateCartSerialAtIndex,
  updateDiscount,
  updateCartColor,
  warrantyTemplates
}) => {
  if (isMobile) {
    return (
      <Paper sx={{ 
        flexGrow: 1,
        p: 1.5, 
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: 'none',
        mb: 1.5,
        overflowY: 'auto'
      }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '13px', mb: 1 }}>
          Selected Items ({cart.length} items)
        </Typography>
        
        {cart.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Cart is empty. Tap products below to add.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {cart.map((item) => (
              <Paper 
                key={item.product._id} 
                variant="outlined" 
                sx={{ 
                  p: 1.5, 
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  borderColor: '#E2E8F0'
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  {/* Image */}
                  <Box sx={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '8px', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    flexShrink: 0
                  }}>
                    {item.product.images?.[0] ? (
                      <img src={item.product.images[0]} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Typography sx={{ fontSize: '9px', color: 'text.secondary' }}>N/A</Typography>
                    )}
                  </Box>

                  {/* Info */}
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: 'text.primary', fontSize: '12.5px' }}>
                      {item.product.name}
                    </Typography>
                    {(() => {
                      const hasMultipleColors = item.product.colors?.length > 1;
                      const singleColor = item.product.colors?.length === 1 ? item.product.colors[0].name : item.product.color;
                      
                      if (hasMultipleColors) {
                        return (
                          <FormControl size="small" sx={{ mt: 0.5, mb: 0.5, minWidth: 120 }}>
                            <Select
                              value={item.selectedColor || item.product.colors[0].name}
                              onChange={(e) => updateCartColor(item.product._id, e.target.value)}
                              sx={{ height: 24, fontSize: '11px' }}
                            >
                              {item.product.colors.map((c, i) => (
                                <MenuItem key={i} value={c.name} sx={{ fontSize: '11px' }}>{c.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        );
                      } else if (singleColor) {
                        return (
                          <Typography variant="caption" sx={{ color: '#475569', fontSize: '10.5px', fontWeight: 600, display: 'block' }}>
                            Color: {singleColor}
                          </Typography>
                        );
                      }
                      return null;
                    })()}
                    {item.offer && (
                      <Box sx={{ display: 'inline-flex', mt: 0.25 }}>
                        <Chip
                          label={item.offer.discountType === 'flat' ? `Campaign: ৳${item.offer.discountAmount} Off` : `Campaign: ${item.offer.discountPercentage}% Off`}
                          size="small"
                          sx={{
                            height: '16px',
                            fontSize: '9.5px',
                            fontWeight: 700,
                            backgroundColor: '#FEE2E2',
                            color: '#EF4444',
                            border: '1px solid #FCA5A5'
                          }}
                        />
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mt: 0.25 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '10.5px' }}>
                        {item.discount > 0 ? (
                          <React.Fragment>
                            <span style={{ textDecoration: 'line-through', marginRight: 4 }}>৳{item.unitPrice}</span>
                            <span style={{ color: '#EF4444', fontWeight: 700 }}>৳{item.unitPrice - item.discount}</span>
                          </React.Fragment>
                        ) : (
                          `৳${item.unitPrice}`
                        )}
                      </Typography>
                      <Chip
                        label={`Stock: ${item.currentQuantity}`}
                        size="small"
                        sx={{
                          height: '16px',
                          fontSize: '9px',
                          fontWeight: 700,
                          backgroundColor: item.currentQuantity <= 0 ? '#FEE2E2' : item.currentQuantity <= 10 ? '#FEF3C7' : '#D1FAE5',
                          color: item.currentQuantity <= 0 ? '#EF4444' : item.currentQuantity <= 10 ? '#D97706' : '#059669',
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Total Price */}
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '12.5px', flexShrink: 0 }}>
                    ৳{((item.unitPrice - (item.discount || 0)) * item.quantity).toFixed(2)}
                  </Typography>
                </Box>

                {/* Warranty Selection (Mobile) */}
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexDirection: 'column' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Warranties</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(() => {
                      const matchingTemplates = warrantyTemplates.filter(t => t.brand?._id === (item.product.brand?._id || item.product.brand) && t.category?._id === (item.product.category?._id || item.product.category) && t.isActive);
                      if (matchingTemplates.length === 0) {
                        return <Typography variant="caption" sx={{ color: 'text.disabled' }}>No warranties found</Typography>;
                      }
                      return matchingTemplates.map(t => {
                        const isSelected = item.warranties?.some(w => w.templateId === t._id);
                        return (
                          <Chip
                            key={t._id}
                            label={`${t.name} (${t.durationMonths}m)`}
                            size="small"
                            color={isSelected ? "primary" : "default"}
                            variant={isSelected ? "filled" : "outlined"}
                            onClick={() => toggleWarranty(item.product._id, t)}
                            onDelete={isSelected ? () => toggleWarranty(item.product._id, t) : undefined}
                            sx={{ fontSize: '10px', height: '24px' }}
                          />
                        );
                      });
                    })()}
                  </Box>
                </Box>

                {/* Discount Input (Mobile) */}
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexDirection: 'column' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Discount (৳)</Typography>
                  <TextField
                    type="number"
                    size="small"
                    value={(item.discount || 0) === 0 ? '' : item.discount}
                    onChange={(e) => {
                      const val = e.target.value;
                      const numVal = parseFloat(val);
                      if (!isNaN(numVal)) {
                        updateDiscount(item.product._id, numVal);
                      } else if (val === '' || val === '-') {
                        updateDiscount(item.product._id, 0);
                      }
                    }}
                    inputProps={{ 
                      min: 0, 
                      max: item.unitPrice,
                      style: { textAlign: 'left' }
                    }}
                    placeholder="0"
                    sx={{
                      '& input': {
                        textAlign: 'left'
                      }
                    }}
                    InputProps={{
                      sx: {
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC'
                      }
                    }}
                  />
                </Box>

                <Divider sx={{ my: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' }} />

                {/* Batch and Serials (Mobile) */}
                {(item.batches?.length > 0 || item.trackSerials) && (
                  <Box sx={{ mt: 1, mb: 1, display: 'flex', gap: 1, flexDirection: 'column' }}>
                    {item.batches?.length > 0 && (
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        Active Batches: {item.batches.map(b => b.batchNumber).join(', ')}
                      </Typography>
                    )}
                    {item.trackSerials && (
                      <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%', minWidth: '180px' }}>
                        {Array.from({ length: item.quantity }, (_, idx) => {
                          const usedSerials = (item.selectedSerials || []).filter((s, i) => i !== idx && s);
                          const suggestions = (item.availableSerials || []).filter(s => !usedSerials.includes(s));
                          
                          return (
                            <Autocomplete
                              key={idx}
                              freeSolo
                              size="small"
                              options={suggestions}
                              value={item.selectedSerials?.[idx] || ''}
                              onChange={(e, newVal) => updateCartSerialAtIndex(item.product._id, idx, newVal || '')}
                              onInputChange={(e, newVal, reason) => {
                                if (reason === 'input') updateCartSerialAtIndex(item.product._id, idx, newVal);
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  variant="outlined"
                                  placeholder={`Serial #${idx + 1}`}
                                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '11px', p: '2px 6px', minHeight: '28px' } }}
                                />
                              )}
                              sx={{ width: '100%' }}
                            />
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                )}

                {/* Controls */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton 
                      size="small"
                      onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                      sx={{
                        p: 0.5,
                        color: '#6366F1',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        backgroundColor: '#FFFFFF',
                        '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' }
                      }}
                    >
                      <RemoveIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                    <Typography sx={{ mx: 1.75, minWidth: '18px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: 'text.primary' }}>
                      {item.quantity}
                    </Typography>
                    <IconButton 
                      size="small"
                      onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                      disabled={item.quantity >= item.currentQuantity}
                      sx={{
                        p: 0.5,
                        color: '#6366F1',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        backgroundColor: '#FFFFFF',
                        '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' },
                        '&.Mui-disabled': { borderColor: '#E2E8F0', color: '#CBD5E1', backgroundColor: '#F1F5F9' }
                      }}
                    >
                      <AddIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Box>

                  <IconButton 
                    size="small"
                    onClick={() => removeFromCart(item.product._id)}
                    sx={{ 
                      color: '#EF4444', 
                      p: 0.75,
                      border: '1px solid #FCA5A5',
                      borderRadius: '6px',
                      backgroundColor: '#FFFFFF',
                      '&:hover': { backgroundColor: '#FEE2E2' }
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Paper>
    );
  }

  return (
    <TableContainer sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
      <Table size="small" stickyHeader sx={{ minWidth: { xs: 650, md: '100%' } }}>
        <TableHead>
          <TableRow sx={{
            '& .MuiTableCell-head': {
              backgroundColor: '#F8FAFC',
              color: 'text.secondary',
              fontWeight: 700,
              fontSize: '10px',
              textTransform: 'uppercase',
              padding: '8px 12px',
              borderBottom: '1px solid #E2E8F0'
            }
          }}>
            <TableCell>Product Description</TableCell>
            <TableCell align="center">Serial / IMEI</TableCell>
            <TableCell align="right">Price (৳)</TableCell>
            <TableCell align="center">Quantity</TableCell>
            <TableCell align="center">Warranty</TableCell>
            <TableCell align="center">Discount (৳)</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell align="center">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cart.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary', fontSize: '12px' }}>
                Cart is empty. Tap products from the catalog panel above to build your order.
              </TableCell>
            </TableRow>
          ) : (
            cart.map((item) => (
              <TableRow key={item.product._id} sx={{ '&:hover': { backgroundColor: '#F8FAFC' } }}>
                <TableCell sx={{ py: 0.5, px: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '4px', 
                      overflow: 'hidden', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: '#F1F5F9',
                      flexShrink: 0
                    }}>
                      {item.product.images?.[0] ? (
                        <img src={item.product.images[0]} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <Typography sx={{ fontSize: '8px', color: 'text.secondary' }}>N/A</Typography>
                      )}
                    </Box>
                    <Box sx={{ minWidth: 0, width: '100%' }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: 'text.primary', fontSize: '12px' }}>
                        {item.product.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '10px', display: 'block', mb: 0.5 }}>
                        Model: {item.product.model || 'N/A'}
                        {item.batches?.length > 0 && ` | Batches: ${item.batches.map(b => b.batchNumber).join(', ')}`}
                      </Typography>
                      {(() => {
                        const hasMultipleColors = item.product.colors?.length > 1;
                        const singleColor = item.product.colors?.length === 1 ? item.product.colors[0].name : item.product.color;
                        
                        if (hasMultipleColors) {
                          return (
                            <Box sx={{ display: 'inline-flex', mb: 0.5, mr: 0.5 }}>
                              <FormControl size="small" sx={{ minWidth: 100 }}>
                                <Select
                                  value={item.selectedColor || item.product.colors[0].name}
                                  onChange={(e) => updateCartColor(item.product._id, e.target.value)}
                                  sx={{ 
                                    height: '24px', 
                                    fontSize: '11px',
                                    bgcolor: '#EEF2FF',
                                    color: '#4F46E5',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#C7D2FE',
                                    }
                                  }}
                                >
                                  {item.product.colors.map((c, i) => (
                                    <MenuItem key={i} value={c.name} sx={{ fontSize: '11px' }}>🎨 Color: {c.name}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                          );
                        } else if (singleColor) {
                          return (
                            <Box sx={{ display: 'inline-flex', mb: 0.5, mr: 0.5 }}>
                              <Chip
                                label={`🎨 Color: ${singleColor}`}
                                size="small"
                                sx={{
                                  height: '20px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  backgroundColor: '#EEF2FF',
                                  color: '#4F46E5',
                                  border: '1px solid #C7D2FE'
                                }}
                              />
                            </Box>
                          );
                        }
                        return null;
                      })()}
                      {item.offer && (
                        <Box sx={{ display: 'inline-flex', mb: 0.5 }}>
                          <Chip
                            label={item.offer.discountType === 'flat' ? `Campaign: ৳${item.offer.discountAmount} Off` : `Campaign: ${item.offer.discountPercentage}% Off`}
                            size="small"
                            sx={{
                              height: '18px',
                              fontSize: '9.5px',
                              fontWeight: 700,
                              backgroundColor: '#FEE2E2',
                              color: '#EF4444',
                              border: '1px solid #FCA5A5'
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ minWidth: '180px', py: 0.5 }}>
                  {item.trackSerials ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%' }}>
                      {Array.from({ length: item.quantity }, (_, idx) => {
                        const usedSerials = (item.selectedSerials || []).filter((s, i) => i !== idx && s);
                        const suggestions = (item.availableSerials || []).filter(s => !usedSerials.includes(s));
                        
                        return (
                          <Autocomplete
                            key={idx}
                            freeSolo
                            size="small"
                            options={suggestions}
                            value={item.selectedSerials?.[idx] || ''}
                            onChange={(e, newVal) => updateCartSerialAtIndex(item.product._id, idx, newVal || '')}
                            onInputChange={(e, newVal, reason) => {
                              if (reason === 'input') updateCartSerialAtIndex(item.product._id, idx, newVal);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="outlined"
                                placeholder={`Serial #${idx + 1}`}
                                sx={{ '& .MuiOutlinedInput-root': { fontSize: '11px', p: '2px 6px', minHeight: '28px' } }}
                              />
                            )}
                            sx={{ width: '100%' }}
                          />
                        );
                      })}
                    </Box>
                  ) : (
                    <Typography sx={{ color: 'text.secondary', fontSize: '11px' }}>—</Typography>
                  )}
                </TableCell>
                <TableCell align="right" sx={{ fontSize: '12px', py: 0.5 }}>
                  {item.discount > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      {/* Discounted Unit Price */}
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#EF4444' }}>
                        ৳{(item.unitPrice - item.discount)}
                      </Typography>
                      {/* Original Unit Price */}
                      <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary', fontSize: '10px' }}>
                        ৳{item.unitPrice}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      ৳{item.unitPrice}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center" sx={{ py: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton 
                      size="small"
                      onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                      sx={{
                        p: 0.25,
                        color: '#6366F1',
                        border: '1px solid #E2E8F0',
                        borderRadius: '4px',
                        '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' }
                      }}
                    >
                      <RemoveIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                    <Typography sx={{ mx: 1, minWidth: '18px', textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>
                      {item.quantity}
                    </Typography>
                    <IconButton 
                      size="small"
                      onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                      disabled={item.quantity >= item.currentQuantity}
                      sx={{
                        p: 0.25,
                        color: '#6366F1',
                        border: '1px solid #E2E8F0',
                        borderRadius: '4px',
                        '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' },
                        '&.Mui-disabled': { borderColor: '#F1F5F9', color: '#CBD5E1' }
                      }}
                    >
                      <AddIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Box>
                </TableCell>
                
                {/* Desktop Warranty Selector */}
                <TableCell align="center" sx={{ py: 0.5 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', maxWidth: '200px' }}>
                    {(() => {
                      const matchingTemplates = warrantyTemplates.filter(t => t.brand?._id === (item.product.brand?._id || item.product.brand) && t.category?._id === (item.product.category?._id || item.product.category) && t.isActive);
                      if (matchingTemplates.length === 0) {
                        return <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '10px' }}>No warranties found</Typography>;
                      }
                      return matchingTemplates.map(t => {
                        const isSelected = item.warranties?.some(w => w.templateId === t._id);
                        return (
                          <Chip
                            key={t._id}
                            label={`${t.name} (${t.durationMonths}m)`}
                            size="small"
                            color={isSelected ? "primary" : "default"}
                            variant={isSelected ? "filled" : "outlined"}
                            onClick={() => toggleWarranty(item.product._id, t)}
                            onDelete={isSelected ? () => toggleWarranty(item.product._id, t) : undefined}
                            sx={{ fontSize: '10px', height: '20px' }}
                          />
                        );
                      });
                    })()}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <TextField
                    type="number"
                    size="small"
                    value={(item.discount || 0) === 0 ? '' : item.discount}
                    onChange={(e) => {
                      const val = e.target.value;
                      const numVal = parseFloat(val);
                      if (!isNaN(numVal)) {
                        updateDiscount(item.product._id, numVal);
                      } else if (val === '' || val === '-') {
                        updateDiscount(item.product._id, 0);
                      }
                    }}
                    inputProps={{ 
                      min: 0, 
                      max: item.unitPrice,
                      style: { textAlign: 'left' }
                    }}
                    placeholder="0"
                    sx={{
                      width: '100px',
                      '& input': {
                        textAlign: 'left'
                      }
                    }}
                    InputProps={{
                      sx: {
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC'
                      }
                    }}
                  />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '12px' }}>
                  ৳{((item.unitPrice - (item.discount || 0)) * item.quantity).toFixed(2)}
                </TableCell>
                <TableCell align="center">
                  <IconButton 
                    size="small"
                    onClick={() => removeFromCart(item.product._id)}
                    sx={{ color: '#EF4444', p: 0.5 }}
                  >
                    <DeleteIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CartTable;
