import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getPublicApiBase } from '../../utils/publicApi';
import { AccessTime } from '@mui/icons-material';

const DealCard = ({ product, navigate }) => {
  const [hovered, setHovered] = useState(false);
  const discountPercentage = Math.round(
    ((product.cuttedPrice - product.price) / product.cuttedPrice) * 100
  );

  const primaryImage = product.image || product.images?.[0] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23F8FAFC"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="48" fill="%2394A3B8"%3E📦%3C/text%3E%3C/svg%3E';
  const secondImage = product.images?.[1];
  const hasSecondImage = !!secondImage;

  return (
    <Card 
      onClick={() => navigate(`/shop/products/${product._id}`)} 
      onMouseEnter={() => setHovered(true)} 
      onMouseLeave={() => setHovered(false)}
      sx={{
        position: 'relative', 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFFFFF', 
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        boxShadow: hovered
          ? '0 8px 24px rgba(0,0,0,0.06)'
          : '0 1px 3px rgba(0,0,0,0.02)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ 
        position: 'absolute', top: 8, left: 8, zIndex: 2, 
        bgcolor: '#DC2626', color: '#fff', 
        px: 1, py: 0.25, fontSize: '0.7rem', 
        fontWeight: 700, borderRadius: '4px' 
      }}>
        -{discountPercentage}%
      </Box>

      <Box sx={{ 
        position: 'relative', pt: '100%',
        bgcolor: '#FFFFFF', overflow: 'hidden',
        borderBottom: '1px solid #F1F5F9',
      }}>
        <Box component="img"
          src={primaryImage}
          alt={product.name}
          sx={{ 
            position: 'absolute', top: 0, left: 0, 
            width: '100%', height: '100%', 
            p: 2, objectFit: 'contain',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
            transition: 'opacity 0.5s ease, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: (hovered && hasSecondImage) ? 0 : 1,
          }}
        />
        {hasSecondImage && (
          <Box component="img"
            src={secondImage}
            alt={`${product.name} - view 2`}
            sx={{ 
              position: 'absolute', top: 0, left: 0, 
              width: '100%', height: '100%', 
              p: 2, objectFit: 'contain',
              transform: hovered ? 'scale(1.08)' : 'scale(0.95)',
              transition: 'opacity 0.5s ease, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: hovered ? 1 : 0,
            }}
          />
        )}
      </Box>

      <CardContent sx={{ p: 2, pt: 1, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <Typography variant="body2" sx={{
          fontFamily: 'Inter, sans-serif',
          color: '#0F172A',
          fontSize: '0.875rem', 
          lineHeight: 1.4,
          mb: 1.5,
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          display: '-webkit-box', 
          WebkitLineClamp: 2, 
          WebkitBoxOrient: 'vertical',
        }}>
          {product.name}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ 
            color: '#0F766E', 
            fontSize: '1.1rem', 
            fontWeight: 700,
            fontFamily: 'Outfit, sans-serif'
          }}>
            ৳{product.price?.toLocaleString()}
          </Typography>
          <Typography sx={{ 
            textDecoration: 'line-through', 
            color: '#94A3B8', 
            fontSize: '0.8rem',
            fontFamily: 'Inter, sans-serif'
          }}>
            ৳{product.cuttedPrice?.toLocaleString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const DealSlider = () => {
  const navigate = useNavigate();
  const [dealProducts, setDealProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Static countdown for display purposes
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 45, seconds: 30 });

  useEffect(() => { fetchDealProducts(); }, []);

  const fetchDealProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${getPublicApiBase()}/products?limit=20`);
      const productsWithDiscount = response.data.data.filter(product => {
        if (product.price && product.cuttedPrice) {
          const discountPercentage = ((product.cuttedPrice - product.price) / product.cuttedPrice) * 100;
          return discountPercentage >= 15;
        }
        return false;
      }).slice(0, 5); // Show top 5 for 5-col grid
      setDealProducts(productsWithDiscount);
    } catch (error) {
      console.error('Error fetching deal products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography sx={{ color: '#94A3B8' }}>Loading deals...</Typography>
      </Box>
    );
  }

  if (dealProducts.length === 0) return null;

  return (
    <Box sx={{
      py: { xs: 4, md: 6 },
      bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0'
    }}>
      <Container maxWidth="xl">
        {/* Section Header */}
        <Box sx={{ 
          display: 'flex', flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-end' },
          mb: { xs: 3, md: 4 }, gap: 2
        }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box sx={{ width: 4, height: 24, bgcolor: '#DC2626', borderRadius: 1 }} />
              <Typography sx={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                fontSize: { xs: '1.2rem', md: '1.6rem' }, color: '#0F172A',
                lineHeight: 1.1, letterSpacing: '-0.02em',
              }}>
                Flash Deals
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
              Special offers end soon. Grab them before they are gone!
            </Typography>
          </Box>

          {/* Countdown Timer */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: '0.875rem', color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTime sx={{ fontSize: '1.1rem' }} /> Ends in:
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.8 }}>
              {[
                { label: 'h', value: timeLeft.hours },
                { label: 'm', value: timeLeft.minutes },
                { label: 's', value: timeLeft.seconds }
              ].map((time, idx) => (
                <Box key={idx} sx={{ 
                  bgcolor: '#DC2626', color: 'white', 
                  minWidth: '40px', py: 0.5, px: 1, 
                  borderRadius: 1, display: 'flex', 
                  flexDirection: 'column', alignItems: 'center' 
                }}>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}>
                    {time.value.toString().padStart(2, '0')}
                  </Typography>
                  <Typography sx={{ fontSize: '0.55rem', textTransform: 'uppercase', opacity: 0.9 }}>
                    {time.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Products Grid */}
        <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
          {dealProducts.map((product) => (
            <Grid item xs={6} sm={4} md={2.4} key={product._id}>
              <DealCard product={product} navigate={navigate} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default DealSlider;

