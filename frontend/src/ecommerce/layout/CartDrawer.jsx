import React, { useState, useEffect } from 'react';
import { Drawer, Box, Typography, IconButton, Button } from '@mui/material';
import { Close as CloseIcon, Delete, Add, Remove } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const CartDrawer = ({ open, onClose }) => {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      loadCart();
    }
    const handleStorageChange = () => loadCart();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [open]);

  const loadCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('ecommerceCart') || '[]');
      setCartItems(cart);
    } catch { }
  };

  const updateQuantity = (index, newQty) => {
    if (newQty < 1) return;
    const updated = cartItems.map((item, i) => i === index ? { ...item, quantity: newQty } : item);
    localStorage.setItem('ecommerceCart', JSON.stringify(updated));
    setCartItems(updated);
    window.dispatchEvent(new Event('storage'));
  };

  const removeItem = (index) => {
    const updated = cartItems.filter((_, i) => i !== index);
    localStorage.setItem('ecommerceCart', JSON.stringify(updated));
    setCartItems(updated);
    window.dispatchEvent(new Event('storage'));
  };

  const subtotal = cartItems.reduce((s, item) => {
    const price = item.product?.price ?? item.price ?? item.product?.sellingPrice ?? item.sellingPrice ?? 0;
    return s + price * (item.quantity || 0);
  }, 0);

  return (
    <Drawer 
      anchor="right" 
      open={open} 
      onClose={onClose} 
      sx={{ zIndex: 1400 }}
      slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(15, 23, 42, 0.4)' } } }}
      PaperProps={{ 
        sx: { 
          width: { xs: '100%', sm: 450 }, 
          bgcolor: '#FFFFFF',
          borderLeft: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.05)',
        } 
      }}
    >
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
        <Typography variant="h6" sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
          Your Cart <Box component="span" sx={{ bgcolor: '#F8FAFC', color: '#64748B', px: 1.5, py: 0.5, borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>{cartItems.reduce((s, i) => s + (i.quantity || 1), 0)}</Box>
        </Typography>
        <IconButton onClick={onClose} sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A', bgcolor: '#F1F5F9', transform: 'rotate(90deg)' }, transition: 'all 0.3s ease' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {cartItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ width: 80, height: 80, bgcolor: '#F8FAFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: '2rem' }}>🛒</Typography>
            </Box>
            <Typography sx={{ color: '#0F172A', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.25rem', mb: 1 }}>Your cart is empty</Typography>
            <Typography sx={{ color: '#64748B', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', mb: 3 }}>Looks like you haven't added anything yet.</Typography>
            <Button 
              variant="outlined" 
              onClick={() => { onClose(); navigate('/shop/products'); }}
              sx={{ borderRadius: '30px', px: 4, py: 1, color: '#14B8A6', borderColor: '#14B8A6', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#F0FDFA', borderColor: '#0D9488' } }}
            >
              Start Shopping
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {cartItems.map((item, index) => {
              const product = item.product || item;
              const quantity = item.quantity || 1;
              const price = product.price ?? product.sellingPrice ?? 0;
              const imgSrc = product.image || product.images?.[0];
              
              return (
                <Box key={index} sx={{ display: 'flex', gap: 2, borderBottom: '1px dashed #E2E8F0', pb: 3, pt: 1 }}>
                  <Box sx={{ width: 80, height: 80, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {imgSrc ? <img src={imgSrc} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Box sx={{ bgcolor: '#F1F5F9', width: '100%', height: '100%' }} />}
                  </Box>
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: '#0F172A', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', pr: 1 }}>
                        {product.name}
                      </Typography>
                      <IconButton size="small" onClick={() => removeItem(index)} sx={{ color: '#94A3B8', p: 0.5, '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' } }}><Delete fontSize="small" /></IconButton>
                    </Box>
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, color: '#14B8A6', fontSize: '0.9rem', mt: 'auto', mb: 1 }}>
                      ৳{(price * quantity).toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#F8FAFC', borderRadius: '8px', p: 0.5 }}>
                        <IconButton size="small" onClick={() => updateQuantity(index, quantity - 1)} disabled={quantity <= 1} sx={{ p: 0.5, color: quantity <= 1 ? '#CBD5E1' : '#475569' }}><Remove sx={{ fontSize: '1rem' }} /></IconButton>
                        <Typography sx={{ px: 2, fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>{quantity}</Typography>
                        <IconButton size="small" onClick={() => updateQuantity(index, quantity + 1)} sx={{ p: 0.5, color: '#475569' }}><Add sx={{ fontSize: '1rem' }} /></IconButton>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </Box>

      {cartItems.length > 0 && (
        <Box sx={{ p: 3, borderTop: '1px solid #F1F5F9', bgcolor: '#FFFFFF', boxShadow: '0 -4px 10px rgba(0,0,0,0.02)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, color: '#64748B' }}>Subtotal</Typography>
            <Typography sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#0F172A', fontSize: '1.1rem' }}>৳{subtotal.toLocaleString()}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, color: '#64748B' }}>Shipping</Typography>
            <Typography sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, color: '#14B8A6', fontSize: '0.95rem' }}>Calculated at checkout</Typography>
          </Box>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={() => { onClose(); navigate('/shop/checkout'); }}
            sx={{ 
              bgcolor: '#0F172A', 
              color: '#FFFFFF', 
              fontWeight: 700, 
              py: 1.8, 
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)', 
              '&:hover': { bgcolor: '#1E293B', boxShadow: '0 6px 16px rgba(15, 23, 42, 0.3)' } 
            }}
          >
            Checkout Now
          </Button>
          <Typography sx={{ textAlign: 'center', fontSize: '0.75rem', color: '#94A3B8', mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            🔒 Secure and encrypted checkout
          </Typography>
        </Box>
      )}
    </Drawer>
  );
};

export default CartDrawer;
