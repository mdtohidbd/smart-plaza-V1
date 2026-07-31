import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Container, Button, Rating,
  IconButton, CircularProgress, Tooltip,
} from '@mui/material';
import {
  ShoppingCart, RemoveRedEye, ChevronRight, ChevronLeft, LocalOffer,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { getPublicApiBase } from '../../utils/publicApi';

const responsive = {
  desktop: { breakpoint: { max: 3000, min: 1280 }, items: 4, slidesToSlide: 1 },
  tablet:  { breakpoint: { max: 1280, min: 768  }, items: 3, slidesToSlide: 1 },
  mobile:  { breakpoint: { max: 768,  min: 480  }, items: 2, slidesToSlide: 1 },
  tiny:    { breakpoint: { max: 480,  min: 0    }, items: 2, slidesToSlide: 1 },
};

const CustomArrow = ({ direction, onClick }) => (
  <Box onClick={onClick} sx={{
    position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
    ...(direction === 'left' ? { left: { xs: 2, md: -20 } } : { right: { xs: 2, md: -20 } }),
    width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 },
    border: '1px solid #E2E8F0', borderRadius: '4px', bgcolor: 'rgba(255,255,255,0.95)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#475569', transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    '&:hover': { borderColor: '#14B8A6', color: '#14B8A6', bgcolor: '#F8FAFC' },
  }}>
    {direction === 'left' ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
  </Box>
);

const ProductCard = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [img2Error, setImg2Error] = useState(false);

  const hasDiscount = product.cuttedPrice && product.cuttedPrice > product.price;
  const discountPct = hasDiscount ? Math.round(((product.cuttedPrice - product.price) / product.cuttedPrice) * 100) : 0;
  
  // Robust image source extraction – skip empty strings & empty arrays
  const extractImgUrl = (src) => {
    if (!src) return null;
    if (typeof src === 'string' && src.trim()) return src.trim();
    if (src?.url && typeof src.url === 'string' && src.url.trim()) return src.url.trim();
    return null;
  };

  const getImgSrc = (index = 0) => {
    if (product.images && Array.isArray(product.images) && product.images.length > index) {
      const url = extractImgUrl(product.images[index]);
      if (url) return url;
    }
    if (index === 0 && product.image && typeof product.image === 'string' && product.image.trim()) {
      return product.image.trim();
    }
    return null;
  };

  const imgSrc = getImgSrc(0);
  const imgSrc2 = getImgSrc(1); // second image for hover swap
  const hasSecondImage = !!imgSrc2;

  const isOutOfStock = false; // Override to allow adding to cart
  const isLowStock = false; // Hide stock badges as per requirement

  return (
    <Box
      onClick={() => navigate(`/shop/products/${product._id}`)}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      sx={{
        display: 'flex', flexDirection: 'column', bgcolor: '#FFFFFF',
        borderRadius: '12px', overflow: 'hidden',
        border: '1px solid #E2E8F0',
        boxShadow: hovered
          ? '0 8px 24px rgba(0,0,0,0.06)'
          : '0 1px 3px rgba(0,0,0,0.02)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        height: '100%', cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* Image Area */}
      <Box sx={{
        position: 'relative', pt: '100%', overflow: 'hidden',
        bgcolor: '#FFFFFF',
        borderBottom: '1px solid #F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      >
        {imgSrc && !imgError ? (
          <>
            {/* Primary Image */}
            <Box component="img" src={imgSrc} alt={product.name}
              sx={{
                position: 'absolute', top: 0, left: 0,
                transform: hovered ? 'scale(1.08)' : 'scale(1)',
                width: '100%', height: '100%', padding: { xs: '0.4rem', md: '1.5rem' }, objectFit: 'contain', mixBlendMode: 'normal',
                transition: 'opacity 0.5s ease, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: (hovered && hasSecondImage && !img2Error) ? 0 : 1,
              }}
              onError={() => setImgError(true)}
            />
            {/* Second Image (shown on hover) */}
            {hasSecondImage && !img2Error && (
              <Box component="img" src={imgSrc2} alt={`${product.name} - view 2`}
                sx={{
                  position: 'absolute', top: 0, left: 0,
                  transform: hovered ? 'scale(1.08)' : 'scale(0.95)',
                  width: '100%', height: '100%', padding: { xs: '0.4rem', md: '1.5rem' }, objectFit: 'contain', mixBlendMode: 'normal',
                  transition: 'opacity 0.5s ease, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: hovered ? 1 : 0,
                }}
                onError={() => setImg2Error(true)}
              />
            )}
          </>
        ) : (
          <Box sx={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            bgcolor: '#F8FAFC',
          }}>
            <Box sx={{
              width: 70, height: 70, borderRadius: '16px',
              bgcolor: 'rgba(20, 184, 166, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mb: 1,
            }}>
              <Typography sx={{ fontSize: '2rem' }}>📷</Typography>
            </Box>
            <Typography sx={{
              fontSize: '0.65rem', color: '#94A3B8', fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
            }}>
              No Image
            </Typography>
          </Box>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <Box sx={{
            position: 'absolute', top: { xs: 8, md: 12 }, left: { xs: 8, md: 12 },
            bgcolor: '#DC2626', color: '#FFFFFF',
            fontSize: { xs: '0.65rem', md: '0.72rem' }, fontWeight: 800,
            px: { xs: 1, md: 1.5 }, py: { xs: 0.3, md: 0.4 },
            display: 'flex', alignItems: 'center', gap: 0.4,
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)',
            letterSpacing: '0.02em',
          }}>
            <LocalOffer sx={{ fontSize: '0.65rem' }} />-{discountPct}%
          </Box>
        )}



        {/* Quick View */}
        <Box sx={{
          position: 'absolute', bottom: 10, right: 10,
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(8px)',
          transition: 'all 0.3s ease',
        }}>
          <Tooltip title="Quick View" arrow>
            <IconButton size="small"
              onClick={(e) => { e.stopPropagation(); navigate(`/shop/products/${product._id}`); }}
              sx={{
                bgcolor: 'rgba(255,255,255,0.95)', border: '1px solid #E2E8F0',
                color: '#0F172A', borderRadius: '50%',
                width: 36, height: 36,
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                '&:hover': { bgcolor: '#14B8A6', color: '#FFFFFF', borderColor: '#14B8A6' },
                transition: 'all 0.2s ease',
              }}>
              <RemoveRedEye sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: { xs: 1, md: 2 }, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Typography sx={{
          fontFamily: 'Inter, sans-serif', color: '#14B8A6',
          fontSize: { xs: '0.55rem', md: '0.68rem' }, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5,
        }}>
          {product.category?.name || 'Electronics'}
        </Typography>

        <Typography
          sx={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 600,
            fontSize: { xs: '0.75rem', md: '0.92rem' }, color: '#0F172A',
            lineHeight: 1.3, mb: 1, flexGrow: 1,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            '&:hover': { color: '#14B8A6' }, transition: 'color 0.2s ease', cursor: 'pointer',
          }}
        >
          {product.name}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <Rating value={product.ratings || 4} readOnly size="small"
            sx={{ color: '#FBBF24', fontSize: { xs: '0.65rem', md: '0.82rem' } }} />
          <Typography sx={{ fontFamily: 'Inter, sans-serif', color: '#94A3B8', fontSize: { xs: '0.55rem', md: '0.7rem' }, fontWeight: 500 }}>
            ({product.numOfReviews || 0})
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: { xs: 1, md: 2 } }}>
          <Typography sx={{
            fontFamily: 'Outfit, sans-serif', color: '#0F172A', fontWeight: 800,
            fontSize: { xs: '0.92rem', md: '1.25rem' },
          }}>
            ৳{product.price?.toLocaleString() || '0'}
          </Typography>
          {hasDiscount && (
            <Typography sx={{
              fontFamily: 'Inter, sans-serif', color: '#94A3B8',
              textDecoration: 'line-through', fontSize: { xs: '0.65rem', md: '0.8rem' }, fontWeight: 400,
            }}>
              ৳{product.cuttedPrice?.toLocaleString()}
            </Typography>
          )}
        </Box>

        <Button fullWidth variant="contained" size="small"
          startIcon={<ShoppingCart sx={{ fontSize: { xs: '0.75rem !important', md: '1rem !important' } }} />}
          onClick={(e) => { e.stopPropagation(); onAddToCart(product, e); }} disabled={false}
          sx={{
            bgcolor: '#0F766E', color: '#FFFFFF', fontFamily: 'Inter, sans-serif',
            fontSize: { xs: '0.68rem', md: '0.82rem' }, fontWeight: 700,
            borderRadius: '6px', textTransform: 'none',
            py: { xs: 0.5, md: 1 }, boxShadow: 'none',
            '&:hover': { bgcolor: '#0D9488', boxShadow: 'none' },
            '&:disabled': { bgcolor: '#F1F5F9', color: '#94A3B8', border: '1px solid #E2E8F0', background: 'none' },
            transition: 'all 0.2s ease',
          }}
        >
          Add to Cart
        </Button>
      </Box>
    </Box>
  );
};

const ProductSlider = ({ title = 'Featured Products', category = null, limit = 8, sortBy = null, section = null }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProducts(); }, [category, sortBy]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: limit.toString() });
      if (category) params.append('category', category);
      if (sortBy) params.append('sortBy', sortBy);
      if (section) params.append('section', section);
      const response = await axios.get(`${getPublicApiBase()}/products?${params}`);
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    if (!product?._id) return;
    const cart = JSON.parse(localStorage.getItem('ecommerceCart') || '[]');
    const existingIndex = cart.findIndex(item => {
      const id = item.product?._id || item._id;
      return id === product._id;
    });
    if (existingIndex >= 0) {
      cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
    } else {
      cart.push({ product, quantity: 1 });
    }
    localStorage.setItem('ecommerceCart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('open-cart-drawer'));
    const toastEl = document.createElement('div');
    toastEl.textContent = `"${product.name}" added to cart`;
    Object.assign(toastEl.style, {
      position: 'fixed', bottom: '24px', left: '50%',
      transform: 'translateX(-50%)', background: '#14B8A6', color: '#0F172A',
      fontFamily: 'Inter, sans-serif', fontWeight: '700',
      fontSize: '0.8rem', borderRadius: '4px', padding: '10px 16px', zIndex: '9999',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)', transition: 'opacity 0.3s ease',
      maxWidth: '90vw', textAlign: 'center',
    });
    document.body.appendChild(toastEl);
    setTimeout(() => { toastEl.style.opacity = '0'; }, 2000);
    setTimeout(() => { document.body.removeChild(toastEl); }, 2400);
  };

  if (loading) {
    return (
      <Box sx={{ py: { xs: 4, md: 8 }, textAlign: 'center', bgcolor: '#FFFFFF' }}>
        <CircularProgress size={32} sx={{ color: '#14B8A6' }} />
      </Box>
    );
  }

  if (products.length === 0) return null;

  return (
    <Box sx={{
      py: { xs: 4, md: 10 }, bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0',
      '& .react-multi-carousel-list': { overflow: 'hidden' },
      '& .react-multi-carousel-track': { alignItems: 'stretch' },
      '& .react-multi-carousel-item': { height: 'auto', px: { xs: '4px', md: '8px' } },
    }}>
      <Container maxWidth="xl" sx={{ position: 'relative' }}>
        {/* Section header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2.5, md: 3 } }}>
          <Box>
            <Typography sx={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800,
              fontSize: { xs: '1.2rem', md: '1.6rem' }, color: '#0F172A',
              lineHeight: 1.1, letterSpacing: '-0.02em',
            }}>{title}</Typography>
          </Box>
          <Button variant="text" endIcon={<ChevronRight />}
            onClick={() => navigate('/shop/products')}
            sx={{
              color: '#0F766E', fontFamily: 'Inter, sans-serif',
              fontSize: { xs: '0.75rem', md: '0.875rem' }, fontWeight: 600,
              textTransform: 'none', borderBottom: '1px solid transparent',
              borderRadius: 0, pb: 0.25, px: { xs: 0.5, md: 1 },
              '&:hover': { bgcolor: 'transparent', borderBottomColor: '#0F766E' },
            }}>
            View All
          </Button>
        </Box>

        {/* Carousel */}
        <Box sx={{ overflow: 'hidden', mx: 0 }}>
          <Carousel
            responsive={responsive} infinite={true} autoPlay={false}
            showDots={false} arrows={true}
            customTransition="transform 400ms cubic-bezier(0.16, 1, 0.3, 1)"
            transitionDuration={400} containerClass="carousel-container"
            removeArrowOnDeviceType={[]}
            customLeftArrow={<CustomArrow direction="left" />}
            customRightArrow={<CustomArrow direction="right" />}
          >
            {products.map((product) => (
              <Box key={product._id} sx={{ px: 0.5, height: '100%', boxSizing: 'border-box' }}>
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </Box>
            ))}
          </Carousel>
        </Box>
      </Container>
    </Box>
  );
};

export default ProductSlider;
