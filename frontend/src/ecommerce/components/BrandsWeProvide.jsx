import React, { useEffect, useState, useRef } from 'react';
import { Box, Container, Typography } from '@mui/material';
import axios from 'axios';
import { getPublicApiBase } from '../../utils/publicApi';
import VerifiedIcon from '@mui/icons-material/Verified';

const BrandsWeProvide = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => { fetchBrands(); }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${getPublicApiBase()}/brands`);
      setBrands(response.data.data || []);
    } catch (error) {
      console.error('[BRANDS WE PROVIDE] Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography sx={{ color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>Loading brands...</Typography>
      </Box>
    );
  }

  if (brands.length === 0) return null;

  const duplicatedBrands = [...brands, ...brands];

  return (
    <Box sx={{
      py: { xs: 4, md: 10 }, bgcolor: '#FFFFFF',
      borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative gradient orbs */}
      <Box sx={{ position: 'absolute', top: '-20%', left: '10%', width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(15,118,110,0.05) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', display: { xs: 'none', md: 'block' },
      }} />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 7 } }}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1,
            bgcolor: 'rgba(15,118,110,0.08)', border: '1px solid rgba(15,118,110,0.2)',
            borderRadius: '100px', px: 2, py: 0.6, mb: 2,
          }}>
            <VerifiedIcon sx={{ fontSize: '0.85rem', color: '#0F766E' }} />
            <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700,
              color: '#0F766E', letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>Authorized Partners</Typography>
          </Box>

          <Typography variant="h3" sx={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: { xs: '1.4rem', md: '2.8rem' }, fontWeight: 800,
            color: '#0F172A', letterSpacing: '-0.03em', mb: 1.5, lineHeight: 1.15,
          }}>
            Brands We <Box component="span" sx={{ color: '#0F766E' }}>Trust</Box>
          </Typography>
          <Typography sx={{
            maxWidth: 520, mx: 'auto', color: '#64748B', lineHeight: 1.7,
            fontSize: { xs: '0.85rem', md: '1rem' }, fontFamily: 'Inter, sans-serif',
            px: { xs: 2, md: 0 },
          }}>
            Official dealer of world-class electronics — every product comes with genuine warranty & after-sales support.
          </Typography>
        </Box>

        {/* Brand Cards — Scrolling Marquee */}
        <Box ref={scrollRef} sx={{
          display: 'flex', gap: { xs: 1.5, md: 2.5 }, overflow: 'hidden', py: 2, position: 'relative',
          maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
        }}>
          <Box sx={{
            display: 'flex', gap: { xs: 1.5, md: 2.5 },
            animation: 'brandScroll 35s linear infinite',
            '@keyframes brandScroll': {
              '0%': { transform: 'translateX(0)' },
              '100%': { transform: `translateX(-${brands.length * (140 + 16)}px)` },
            },
            '&:hover': { animationPlayState: 'paused' },
          }}>
            {duplicatedBrands.map((brand, index) => (
              <Box key={`${brand._id || index}-${index}`} className="brand-card" sx={{
                minWidth: { xs: 100, md: 160 }, height: { xs: 80, md: 120 },
                borderRadius: { xs: '12px', md: '16px' }, bgcolor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 1, px: 1.5, cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative', overflow: 'hidden',
                '&:hover': { bgcolor: '#FFFFFF', transform: 'translateY(-4px)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.08)', borderColor: '#0F766E' },
              }}>
                {brand.logo ? (
                  <Box component="img" src={brand.logo} alt={brand.name}
                    sx={{
                      width: '80%', maxWidth: { xs: 64, md: 100 }, height: { xs: 30, md: 48 },
                      objectFit: 'contain', filter: 'grayscale(100%)', opacity: 0.6,
                      transition: 'all 0.4s ease',
                      '.brand-card:hover &': { opacity: 1, filter: 'none' },
                    }}
                  />
                ) : (
                  <Typography sx={{
                    fontFamily: 'Outfit, sans-serif', fontSize: { xs: '1rem', md: '1.4rem' },
                    fontWeight: 800, color: '#334155', letterSpacing: '0.05em', textTransform: 'uppercase',
                  }}>
                    {brand.name.length > 8 ? brand.name.substring(0, 8) : brand.name}
                  </Typography>
                )}
                <Typography sx={{
                  fontFamily: 'Inter, sans-serif', fontSize: { xs: '0.62rem', md: '0.72rem' },
                  fontWeight: 600, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  {brand.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Bottom Trust Stat Bar */}
        <Box sx={{
          display: 'flex', justifyContent: 'center',
          gap: { xs: 2.5, md: 8 }, mt: { xs: 3, md: 7 }, flexWrap: 'wrap',
        }}>
          {[
            { value: `${brands.length}+`, label: 'Official Brands' },
            { value: '100%', label: 'Genuine Products' },
            { value: '5000+', label: 'Happy Customers' },
          ].map((stat) => (
            <Box key={stat.label} sx={{ textAlign: 'center' }}>
              <Typography sx={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: { xs: '1.4rem', md: '2.4rem' }, fontWeight: 800,
                color: '#0F172A', lineHeight: 1, mb: 0.3,
              }}>{stat.value}</Typography>
              <Typography sx={{
                fontFamily: 'Inter, sans-serif',
                fontSize: { xs: '0.65rem', md: '0.78rem' }, fontWeight: 600,
                color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>{stat.label}</Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default BrandsWeProvide;
