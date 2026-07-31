import React, { useState, useEffect } from 'react';
import { Box, Container, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import axios from 'axios';
import { getPublicApiBase } from '../../utils/publicApi';

const HeroBanner = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await axios.get(`${getPublicApiBase()}/banners`);
        if (res.data.success) {
          setBanners(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  const mainBanners = banners.filter(b => b.position === 'main');
  const sideTopBanner = banners.find(b => b.position === 'side_top');
  const sideBottomBanner = banners.find(b => b.position === 'side_bottom');

  const responsive = {
    all: {
      breakpoint: { max: 4000, min: 0 },
      items: 1
    }
  };

  return (
    <Box
      sx={{
        bgcolor: '#FFFFFF',
        color: '#0F172A',
        pt: { xs: 0, md: 3 },
        pb: { xs: 0, md: 4 },
        borderBottom: '1px solid #E2E8F0',
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 0, sm: 2, md: 3 } }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '6.8fr 3.2fr' },
          gap: { xs: 0, md: 2 },
          minHeight: { xs: 'auto', lg: '450px' },
        }}>
          
          {/* ── LEFT: Dynamic Banner Carousel ── */}
          <Box sx={{
            bgcolor: '#F8FAFC',
            borderRadius: { xs: 0, md: '8px' },
            border: { xs: 'none', md: '1px solid #E2E8F0' },
            position: 'relative',
            overflow: 'hidden',
            minHeight: { xs: '180px', sm: '250px', md: '450px' },
            /* Fix carousel dots on mobile */
            '& .react-multi-carousel-dot-list': {
              bottom: { xs: '8px', md: '16px' },
            },
            '& .react-multi-carousel-dot button': {
              width: { xs: '8px', md: '12px' },
              height: { xs: '8px', md: '12px' },
              borderColor: 'rgba(255,255,255,0.5)',
            },
            '& .react-multi-carousel-dot--active button': {
              backgroundColor: '#14B8A6',
              borderColor: '#14B8A6',
            },
            /* Carousel arrows on mobile */
            '& .react-multiple-carousel__arrow': {
              minWidth: { xs: '30px', md: '43px' },
              minHeight: { xs: '30px', md: '43px' },
            },
          }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress sx={{ color: '#14B8A6' }} />
              </Box>
            ) : mainBanners.length > 0 ? (
              <Carousel
                responsive={responsive}
                infinite={true}
                autoPlay={true}
                autoPlaySpeed={3000}
                keyBoardControl={true}
                customTransition="transform 500ms ease-in-out"
                transitionDuration={500}
                containerClass="carousel-container"
                removeArrowOnDeviceType={["tablet", "mobile"]}
                dotListClass="custom-dot-list-style"
                showDots={true}
                arrows={true}
                itemClass="carousel-item-padding-40-px"
                style={{ height: '100%' }}
              >
                {mainBanners.map((banner) => (
                  <Box
                    key={banner._id}
                    onClick={() => navigate(banner.link || '/shop/products')}
                    sx={{
                      width: '100%',
                      height: { xs: '180px', sm: '250px', md: '450px' },
                      cursor: 'pointer',
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      component="img"
                      src={banner.image?.replace(/^https?:\/\/localhost:\d+/, import.meta.env.VITE_BACKEND_URL || '')}
                      alt={banner.title}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'fill',
                        display: 'block'
                      }}
                    />
                  </Box>
                ))}
              </Carousel>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography sx={{ color: '#64748B' }}>No main banners available</Typography>
              </Box>
            )}
          </Box>

          {/* ── RIGHT: Stacked Side Banners (Side-by-side on mobile, stacked on desktop) ── */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'row', lg: 'column' },
            gap: { xs: 1, md: 2 },
            mt: { xs: 1, lg: 0 },
            px: { xs: 1, sm: 0 },
          }}>
            {/* Top Right Banner */}
            <Box sx={{
              flex: 1, bgcolor: '#F8FAFC', borderRadius: { xs: '6px', md: '8px' }, border: '1px solid #E2E8F0',
              position: 'relative', overflow: 'hidden',
              cursor: sideTopBanner ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              minHeight: { xs: '100px', sm: '140px', lg: 'auto' },
              '&:hover': sideTopBanner ? { borderColor: '#14B8A6', transform: 'translateY(-2px)' } : {},
            }} onClick={() => sideTopBanner && navigate(sideTopBanner.link || '/shop/products')}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress size={24} sx={{ color: '#14B8A6' }} />
                </Box>
              ) : sideTopBanner ? (
                <Box component="img" src={sideTopBanner.image?.replace(/^https?:\/\/localhost:\d+/, import.meta.env.VITE_BACKEND_URL || '')} alt={sideTopBanner.title}
                  sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="caption" sx={{ color: '#475569' }}>No banner</Typography>
                </Box>
              )}
            </Box>

            {/* Bottom Right Banner */}
            <Box sx={{
              flex: 1, bgcolor: '#F8FAFC', borderRadius: { xs: '6px', md: '8px' }, border: '1px solid #E2E8F0',
              position: 'relative', overflow: 'hidden',
              cursor: sideBottomBanner ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              minHeight: { xs: '100px', sm: '140px', lg: 'auto' },
              '&:hover': sideBottomBanner ? { borderColor: '#14B8A6', transform: 'translateY(-2px)' } : {},
            }} onClick={() => sideBottomBanner && navigate(sideBottomBanner.link || '/shop/products')}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress size={24} sx={{ color: '#14B8A6' }} />
                </Box>
              ) : sideBottomBanner ? (
                <Box component="img" src={sideBottomBanner.image?.replace(/^https?:\/\/localhost:\d+/, import.meta.env.VITE_BACKEND_URL || '')} alt={sideBottomBanner.title}
                  sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="caption" sx={{ color: '#475569' }}>No banner</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HeroBanner;
