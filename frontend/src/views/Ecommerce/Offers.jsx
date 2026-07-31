import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  Box, Container, Typography, Grid, Card, CardContent,
  CardMedia, Button, Chip, IconButton, Snackbar, Alert,
  Divider, Skeleton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EcommerceLayout from '../../ecommerce/layout/EcommerceLayout';
import DealSlider from '../../ecommerce/components/DealSlider';
import ProductSlider from '../../ecommerce/components/ProductSlider';
import {
  LocalOffer, AccountBalance, ShoppingBasket,
  ArrowForward, ContentCopy, CheckCircle, Timer,
  Percent
} from '@mui/icons-material';

// Brand tokens — keep consistent with the rest of the site
const BRAND = 'rgb(19, 52, 50)';
const BRAND_LIGHT = 'rgba(19, 52, 50, 0.08)';
const ACCENT = '#14B8A6';
const BORDER = '#E2E8F0';
const BG = '#F8FAFC';



// ────────────────────────────────────────
// Section heading — shared across sections
// ────────────────────────────────────────
const SectionHeading = ({ icon: Icon, iconColor, label, sub }) => (
  <Box sx={{ mb: 4 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: sub ? 1 : 0 }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: '10px',
        bgcolor: iconColor || BRAND_LIGHT,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon sx={{ fontSize: '1.1rem', color: iconColor ? '#fff' : BRAND }} />
      </Box>
      <Typography
        variant="h5"
        sx={{ fontWeight: 800, color: BRAND, letterSpacing: '-0.02em', lineHeight: 1.2 }}
      >
        {label}
      </Typography>
    </Box>
    {sub && (
      <Typography variant="body2" sx={{ color: 'text.secondary', pl: '52px' }}>
        {sub}
      </Typography>
    )}
    <Box sx={{ mt: 2, height: 2, width: 40, borderRadius: 1, bgcolor: ACCENT }} />
  </Box>
);

// ────────────────────────────────────────
// Campaign card - Pure Banner Style
// ────────────────────────────────────────
const CampaignCard = ({ sale }) => {
  const navigate = useNavigate();
  const imageUrl = sale.image || (sale.product && sale.product.image) || 'https://via.placeholder.com/900x400?text=Offer';
  
  const discountText = sale.discountType === 'flat'
    ? `৳${sale.discountAmount} Off`
    : (sale.discountPercentage ? `Up to ${sale.discountPercentage}% Off` : sale.subtitle);
  const titleText = sale.title || (sale.product && sale.product.name);
  
  const handleCardClick = () => {
    if (sale.product) {
      navigate(`/shop/products/${sale.product._id}`);
    } else {
      navigate('/shop/products'); // Fallback to shop page if no specific product is linked
    }
  };

  return (
    <Card 
      onClick={handleCardClick}
      sx={{
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'transparent',
        position: 'relative',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          '& img': {
            transform: 'scale(1.02)'
          }
        },
      }}
    >
      <Box sx={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
        <img
          src={imageUrl}
          alt={sale.title || 'Campaign Banner'}
          style={{ 
            width: '100%', 
            height: 'auto', 
            display: 'block',
            objectFit: 'cover',
            transition: 'transform 0.4s ease'
          }}
        />
        
        {/* Floating Badges */}
        <Box sx={{ position: 'absolute', top: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
          {discountText && (
            <Chip
              label={discountText}
              size="small"
              sx={{
                bgcolor: '#EF4444', color: '#fff', fontWeight: 800,
                fontSize: '0.85rem', height: 28, borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                letterSpacing: '0.5px'
              }}
            />
          )}
          {titleText && (
            <Chip
              label={titleText}
              size="small"
              sx={{
                bgcolor: 'rgba(0,0,0,0.7)', color: '#fff',
                fontWeight: 600, fontSize: '0.75rem', height: 26, borderRadius: '6px',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            />
          )}
        </Box>
      </Box>
    </Card>
  );
};

// ────────────────────────────────────────
// Bank offer card — clean, brand-colored
// ────────────────────────────────────────
const BankCard = ({ offer, onCopy }) => (
  <Card sx={{
    borderRadius: '14px',
    border: `1px solid ${BORDER}`,
    boxShadow: 'none',
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    height: '100%',
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: '0 8px 24px rgba(19,52,50,0.1)',
    },
  }}>
    {/* Color band at top */}
    <Box sx={{ height: 5, bgcolor: offer.color }} />
    <CardContent sx={{ p: 3 }}>
      {/* Bank name + color dot */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '8px',
          bgcolor: offer.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.01em' }}>
            {offer.subtitle}
          </Typography>
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: BRAND, lineHeight: 1.2 }}>
          {offer.title}
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6, minHeight: 44 }}>
        {offer.description}
      </Typography>

      {/* Code copy row */}
      <Box
        onClick={() => onCopy(offer.code)}
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: `1.5px dashed ${BORDER}`,
          borderRadius: '8px',
          px: 2, py: 1.25,
          cursor: 'pointer',
          transition: 'border-color 0.2s, background 0.2s',
          '&:hover': {
            borderColor: ACCENT,
            bgcolor: 'rgba(20,184,166,0.04)',
          },
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, display: 'block', lineHeight: 1, mb: 0.25 }}>
            PROMO CODE
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: BRAND, letterSpacing: '0.06em' }}>
            {offer.code}
          </Typography>
        </Box>
        <IconButton
          size="small"
          sx={{
            color: ACCENT,
            bgcolor: 'rgba(20,184,166,0.08)',
            borderRadius: '6px',
            '&:hover': { bgcolor: 'rgba(20,184,166,0.16)' },
          }}
        >
          <ContentCopy sx={{ fontSize: '0.9rem' }} />
        </IconButton>
      </Box>
    </CardContent>
  </Card>
);

// ────────────────────────────────────────
// Page header strip — site-consistent style
// ────────────────────────────────────────
const PageHeader = () => (
  <Box sx={{
    background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)', // Light teal gradient
    borderBottom: `1px solid ${BORDER}`,
    position: 'relative',
    overflow: 'hidden',
    py: { xs: 3, md: 4 },
  }}>
    {/* Decorative background elements */}
    <Box sx={{ position: 'absolute', top: -50, right: -20, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)' }} />
    <Box sx={{ position: 'absolute', bottom: -50, left: 100, width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)' }} />
    
    <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Percent sx={{ fontSize: '1rem', color: BRAND }} />
            <Typography variant="overline" sx={{ color: BRAND, fontWeight: 800, letterSpacing: '0.12em', lineHeight: 1 }}>
              SMART PLAZA EXCLUSIVE
            </Typography>
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900, color: '#0f172a',
              letterSpacing: '-0.02em',
              fontSize: { xs: '1.5rem', md: '2.25rem' },
              lineHeight: 1.1,
            }}
          >
            Offers &amp; Campaigns
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, color: '#475569', maxWidth: 600, fontSize: { xs: '0.9rem', md: '1rem' } }}>
            Discover exclusive bank discounts, exciting EMI plans, and limited-time flash sales — updated daily.
          </Typography>
        </Box>

        {/* Live badge */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          px: 2, py: 1,
          bgcolor: '#fff',
          border: '1px solid rgba(20,184,166,0.3)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(20,184,166,0.1)',
        }}>
          <Box sx={{
            width: 8, height: 8, borderRadius: '50%',
            bgcolor: '#10b981',
            boxShadow: '0 0 0 3px rgba(16,185,129,0.2)',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%, 100%': { boxShadow: '0 0 0 3px rgba(16,185,129,0.2)' },
              '50%': { boxShadow: '0 0 0 6px rgba(16,185,129,0.08)' },
            },
          }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: BRAND, letterSpacing: '0.04em', fontSize: '0.8rem' }}>
            LIVE DEALS
          </Typography>
        </Box>
      </Box>
    </Container>
  </Box>
);

// ────────────────────────────────────────
// Main page
// ────────────────────────────────────────
const Offers = () => {
  const [snackbar, setSnackbar] = useState({ open: false, code: '' });
  const [campaigns, setCampaigns] = useState([]);
  const [bankOffers, setBankOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await api.get('/api/offers?isActive=true');
        const data = res.data;
        setCampaigns(data.filter(offer => offer.type === 'campaign'));
        setBankOffers(data.filter(offer => offer.type === 'bank'));
      } catch (error) {
        console.error('Failed to fetch offers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setSnackbar({ open: true, code });
  };

  return (
    <EcommerceLayout>
      <Box sx={{ bgcolor: BG, minHeight: '100vh', pb: { xs: 8, md: 12 } }}>

        <PageHeader />

        <Container maxWidth="xl" sx={{ pt: { xs: 3, md: 5 } }}>

          {/* ── Active Campaigns ── */}
          {(loading || campaigns.length > 0) && (
            <Box sx={{ mb: { xs: 5, md: 6 } }}>
              <SectionHeading
                icon={LocalOffer}
                iconColor={BRAND}
                label="Active Campaigns"
                sub="Limited-time offers on top electronics categories"
              />
              <Grid container spacing={{ xs: 2, md: 4 }}>
                {loading ? (
                  Array.from(new Array(2)).map((_, i) => (
                    <Grid item xs={12} md={6} key={i}>
                      <Skeleton variant="rectangular" width="100%" height={260} sx={{ borderRadius: '12px' }} />
                    </Grid>
                  ))
                ) : (
                  campaigns.map((sale, i) => (
                    <Grid item xs={12} md={6} key={i}>
                      <CampaignCard sale={sale} />
                    </Grid>
                  ))
                )}
              </Grid>
            </Box>
          )}

          {(loading || (campaigns.length > 0 && bankOffers.length > 0)) && (
            <Divider sx={{ mb: { xs: 5, md: 6 }, borderColor: BORDER }} />
          )}

          {/* ── Bank & Payment Offers ── */}
          {(loading || bankOffers.length > 0) && (
            <Box sx={{ mb: { xs: 5, md: 6 } }}>
              <SectionHeading
                icon={AccountBalance}
                iconColor={BRAND}
                label="Bank &amp; Payment Partners"
                sub="Use your card or mobile banking to save more at checkout"
              />
              <Grid container spacing={{ xs: 2, md: 3 }}>
                {loading ? (
                  Array.from(new Array(4)).map((_, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                      <Card sx={{ borderRadius: '14px', border: `1px solid ${BORDER}`, boxShadow: 'none', height: '100%' }}>
                        <Skeleton variant="rectangular" height={5} sx={{ bgcolor: '#e0e0e0' }} />
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: '8px' }} />
                            <Skeleton variant="text" width="60%" height={28} />
                          </Box>
                          <Skeleton variant="text" width="100%" height={20} />
                          <Skeleton variant="text" width="80%" height={20} sx={{ mb: 3 }} />
                          <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: '8px', border: `1.5px dashed ${BORDER}` }} />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  bankOffers.map((offer, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                      <BankCard offer={offer} onCopy={handleCopy} />
                    </Grid>
                  ))
                )}
              </Grid>
            </Box>
          )}

          {(loading || bankOffers.length > 0) && (
            <Divider sx={{ mb: { xs: 5, md: 6 }, borderColor: BORDER }} />
          )}

          {/* ── Deal of the Day ── */}
          <Box sx={{ mb: { xs: 5, md: 6 } }}>
            <SectionHeading
              icon={ShoppingBasket}
              iconColor={BRAND}
              label="Deal of the Day"
              sub="Products with over 15% off — updated every 24 hours"
            />
            <DealSlider />
          </Box>

          <Divider sx={{ mb: { xs: 5, md: 6 }, borderColor: BORDER }} />

          {/* ── Clearance ── */}
          <Box>
            <ProductSlider title="Clearance Sale" limit={8} />
          </Box>

        </Container>
      </Box>

      {/* Copy confirmation toast */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          icon={<CheckCircle fontSize="small" />}
          severity="success"
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          sx={{
            borderRadius: '10px', fontWeight: 600,
            bgcolor: BRAND, color: '#fff',
            '& .MuiAlert-icon': { color: ACCENT },
          }}
        >
          Code <strong>{snackbar.code}</strong> copied to clipboard
        </Alert>
      </Snackbar>
    </EcommerceLayout>
  );
};

export default Offers;
