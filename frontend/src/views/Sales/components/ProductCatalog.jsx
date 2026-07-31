import React from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Grid,
  CircularProgress,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';

const ProductCatalog = ({
  isMobile,
  searchTerm,
  setSearchTerm,
  filteredProducts,
  productsLoading,
  addToCart,
  cart,
  total,
  setMobileTab,
  activeOffers
}) => {

  const renderProductGrid = () => {
    if (productsLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: isMobile ? 8 : 0, height: isMobile ? 'auto' : '100%' }}>
          <CircularProgress size={isMobile ? 32 : 24} sx={{ color: '#6366F1' }} />
        </Box>
      );
    }
    
    if (filteredProducts.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: isMobile ? 8 : 0, height: isMobile ? 'auto' : '100%' }}>
          <Typography variant={isMobile ? "body2" : "caption"} sx={{ color: 'text.secondary' }}>No products found</Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={1}>
        {filteredProducts.map((item) => {
          const currentStock = item.currentQuantity ?? 0;
          const isOutOfStock = currentStock <= 0;
          const isLowStock = currentStock > 0 && currentStock <= 10;
          
          // Check if already in cart (for mobile badge)
          const cartItem = cart?.find(c => c.product._id === item.product._id);
          const cartQty = cartItem ? cartItem.quantity : 0;

          // Find active offer
          let offer = null;
          if (activeOffers && Array.isArray(activeOffers)) {
            offer = activeOffers.find(o => {
              const offerProductId = o.product?._id || o.product;
              const itemProductId = item.product?._id || item.product;
              return offerProductId && itemProductId && String(offerProductId) === String(itemProductId);
            });
          }

          const basePrice = item.sellingPrice || item.product.sellingPrice || 0;
          let discountedPrice = basePrice;
          let discountLabel = '';
          if (offer) {
            if (offer.discountType === 'flat') {
              const amount = offer.discountAmount || 0;
              discountedPrice = Math.max(0, basePrice - amount);
              discountLabel = `৳${amount} Off`;
            } else if (offer.discountType === 'percentage' || offer.discountPercentage) {
              const percent = offer.discountPercentage || 0;
              discountedPrice = basePrice - (basePrice * percent / 100);
              discountLabel = `${percent}% Off`;
            }
          }
          
          return (
            <Grid item xs={6} sm={isMobile ? 6 : 4} md={isMobile ? undefined : 3} lg={isMobile ? undefined : 2.4} key={item.product._id}>
              <Paper
                variant="outlined"
                onClick={() => !isOutOfStock && addToCart(item)}
                sx={{
                  p: isMobile ? 1.25 : 1,
                  textAlign: 'center',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  position: 'relative',
                  opacity: isOutOfStock ? (isMobile ? 0.5 : 0.45) : 1,
                  borderRadius: isMobile ? '12px' : '8px',
                  transition: 'all 0.2s ease-in-out',
                  borderColor: isMobile && cartQty > 0 ? '#6366F1' : '#E2E8F0',
                  backgroundColor: isMobile && cartQty > 0 ? '#EEF2FF' : '#FFFFFF',
                  boxShadow: isMobile && cartQty > 0 ? '0 4px 12px rgba(99, 102, 241, 0.05)' : 'none',
                  '&:active': isMobile ? {
                    transform: 'scale(0.97)'
                  } : {},
                  '&:hover': (!isOutOfStock && !isMobile) ? {
                    borderColor: '#6366F1',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)',
                    transform: 'translateY(-1px)'
                  } : {}
                }}
              >
                {/* Quantity Badge if in cart (Mobile only visually) */}
                {isMobile && cartQty > 0 && (
                  <Box sx={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    backgroundColor: '#6366F1',
                    color: '#FFFFFF',
                    borderRadius: '10px',
                    px: 1,
                    py: 0.25,
                    fontSize: '10px',
                    fontWeight: 700,
                    zIndex: 2
                  }}>
                    {cartQty}
                  </Box>
                )}

                {/* Offer Badge / Tag */}
                {offer && (
                  <Box sx={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    borderRadius: '4px',
                    px: 0.75,
                    py: 0.25,
                    fontSize: '9px',
                    fontWeight: 700,
                    zIndex: 2,
                    textTransform: 'uppercase',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                  }}>
                    {discountLabel || 'Sale'}
                  </Box>
                )}

                <Box sx={{ 
                  width: '100%', 
                  height: isMobile ? '70px' : '56px', 
                  borderRadius: isMobile ? '8px' : '6px', 
                  overflow: 'hidden', 
                  backgroundColor: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: isMobile ? 1 : 0.5
                }}>
                  {item.product.images?.[0] ? (
                    <img src={item.product.images[0]} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Typography variant="caption" sx={{ fontSize: isMobile ? '10px' : '8px', color: '#94A3B8' }}>No Image</Typography>
                  )}
                </Box>
                
                <Typography variant={isMobile ? "body2" : "caption"} sx={{ 
                  fontWeight: isMobile ? 700 : 600, 
                  display: '-webkit-box', 
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontSize: isMobile ? '12px' : '11px', 
                  lineHeight: 1.3,
                  height: isMobile ? '31px' : '28px', // Approximately 2 lines
                  color: 'text.primary', 
                  mb: 0.5 
                }}>
                  {item.product.name}
                </Typography>

                {/* Product Colors Badge */}
                {(() => {
                  const colorsList = item.product.colors?.length > 0
                    ? item.product.colors.map(c => c.name).join(', ')
                    : item.product.color;
                  return colorsList ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5, px: 0.5 }}>
                      <Box sx={{
                        backgroundColor: '#EEF2FF',
                        border: '1px solid #C7D2FE',
                        borderRadius: '12px',
                        px: 1,
                        py: 0.25,
                        fontSize: isMobile ? '11px' : '10.5px',
                        fontWeight: 700,
                        color: '#4F46E5',
                        display: 'inline-block',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 1px 2px rgba(79, 70, 229, 0.08)'
                      }}>
                        🎨 {colorsList}
                      </Box>
                    </Box>
                  ) : null;
                })()}

                {offer ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.75, mb: isMobile ? 1 : 0.5, flexWrap: 'wrap' }}>
                    {/* Discounted Price */}
                    <Typography variant={isMobile ? "body2" : "caption"} sx={{ fontSize: isMobile ? '13px' : '11px', color: '#EF4444', fontWeight: isMobile ? 800 : 700 }}>
                      ৳{discountedPrice}
                    </Typography>
                    {/* Original Price */}
                    <Typography variant="caption" sx={{ fontSize: isMobile ? '10px' : '9px', color: 'text.secondary', textDecoration: 'line-through' }}>
                      ৳{basePrice}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant={isMobile ? "body2" : "caption"} sx={{ display: 'block', fontSize: isMobile ? '13px' : '11px', color: '#6366F1', fontWeight: isMobile ? 800 : 700, mb: isMobile ? 1 : 0.5 }}>
                    ৳{basePrice}
                  </Typography>
                )}
                
                <Box sx={{ 
                  py: isMobile ? 0.5 : 0.25,
                  px: isMobile ? 1 : 0,
                  borderRadius: isMobile ? '6px' : '4px',
                  backgroundColor: isOutOfStock ? '#FEE2E2' : isLowStock ? '#FEF3C7' : '#D1FAE5',
                  border: '1px solid',
                  borderColor: isOutOfStock ? '#FCA5A5' : isLowStock ? '#FCD34D' : '#34D399',
                  display: isMobile ? 'flex' : 'block',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography sx={{ 
                    fontSize: isMobile ? '9px' : '8.5px', 
                    fontWeight: 700,
                    color: isOutOfStock ? '#EF4444' : isLowStock ? '#D97706' : '#059669',
                    display: 'block'
                  }}>
                    {isOutOfStock ? 'Sold Out' : `Stock: ${currentStock}`}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Catalog Search & Info */}
        <Paper sx={{ 
          p: 1.25, 
          display: 'flex', 
          flexDirection: 'column',
          mb: 1, 
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: 'none'
        }}>
          <TextField
            fullWidth
            placeholder="Search name, model, color..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '13px',
                borderRadius: '8px',
                backgroundColor: '#F8FAFC',
                '& fieldset': { borderColor: '#E2E8F0' },
                '&:hover fieldset': { borderColor: '#CBD5E1' },
                '&.Mui-focused fieldset': { borderColor: '#6366F1' },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94A3B8', fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* Product Grid Area */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0, pb: 9 }}>
          {renderProductGrid()}
        </Box>

        {/* Floating Bottom Bar for Checkout */}
        {cart?.length > 0 && (
          <Paper sx={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            p: 1.5,
            borderRadius: '16px',
            backgroundColor: '#1E293B',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 1000
          }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontWeight: 600 }}>
                {cart.length} {cart.length === 1 ? 'item' : 'items'} in Cart
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#6366F1' }}>
                ৳{total.toFixed(2)}
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => setMobileTab(1)}
              endIcon={<ShoppingCartIcon sx={{ fontSize: 16 }} />}
              sx={{
                backgroundColor: '#6366F1',
                color: '#FFFFFF',
                fontWeight: 700,
                borderRadius: '10px',
                textTransform: 'none',
                px: 2.5,
                py: 1,
                '&:hover': {
                  backgroundColor: '#4F46E5'
                }
              }}
            >
              Review & Pay
            </Button>
          </Paper>
        )}
      </Box>
    );
  }

  // Desktop view
  return (
    <Paper sx={{ 
      p: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: 0, 
      height: '48%', 
      mb: 1, 
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      border: '1px solid #E2E8F0'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '14px' }}>
            Available Products
          </Typography>
        </Box>
        <TextField
          placeholder="Search name, model, color..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{
            width: '240px',
            '& .MuiOutlinedInput-root': {
              fontSize: '12px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#F8FAFC',
              '& fieldset': { borderColor: '#E2E8F0' },
              '&:hover fieldset': { borderColor: '#CBD5E1' },
              '&.Mui-focused fieldset': { borderColor: '#6366F1' },
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#94A3B8', fontSize: 16 }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0, mt: 0.5 }}>
        {renderProductGrid()}
      </Box>
    </Paper>
  );
};

export default ProductCatalog;
