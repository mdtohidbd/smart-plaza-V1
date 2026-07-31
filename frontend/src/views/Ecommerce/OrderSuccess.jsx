import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Button, useTheme, CircularProgress } from '@mui/material';
import { CheckCircle, ShoppingBag, Home, ArrowForward, LocalShipping } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import EcommerceLayout from '../../ecommerce/layout/EcommerceLayout';
import { useAuth } from '../../context/AuthContext';

const TEAL = '#14B8A6';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const { isAuthenticated } = useAuth();

  // Animate in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Auto-redirect after 5 seconds with countdown
  useEffect(() => {
    if (countdown <= 0) {
      if (isAuthenticated) {
        navigate('/shop/orders');
      } else {
        navigate('/shop/orders/tracking', { state: { email: location.state?.email } });
      }
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, isAuthenticated, navigate, location.state]);

  // Save guest details if present and not authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = location.state?.email;
    if (!token && email) {
      localStorage.setItem('guestEmail', email);
      localStorage.setItem('guestOrderPlaced', 'true');
    }
  }, [location.state]);

  // Order ref from state (if passed) or generate a placeholder
  const orderRef = location.state?.orderNumber || location.state?.orderRef || `SP-${Date.now().toString().slice(-6)}`;

  return (
    <EcommerceLayout>
      <Box sx={{
        bgcolor: 'background.default', 
        minHeight: '100vh',
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        display: 'flex', 
        alignItems: 'center',
      }}>
        <Container maxWidth="sm" sx={{ py: 10 }}>
          <Box sx={{
            textAlign: 'center',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)',
          }}>

            {/* Icon */}
            <Box sx={{
              width: 96, height: 96, mx: 'auto', mb: 4,
              border: `1px solid ${TEAL}`,
              borderRadius: '4px',
              bgcolor: 'rgba(20,184,166,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              {/* Corner accents */}
              {[{ top: -1, left: -1 }, { top: -1, right: -1 }, { bottom: -1, left: -1 }, { bottom: -1, right: -1 }].map((pos, i) => (
                <Box key={i} sx={{
                  position: 'absolute', ...pos,
                  width: 10, height: 10,
                  borderTop: i < 2 ? `2px solid ${TEAL}` : 'none',
                  borderBottom: i >= 2 ? `2px solid ${TEAL}` : 'none',
                  borderLeft: (i === 0 || i === 2) ? `2px solid ${TEAL}` : 'none',
                  borderRight: (i === 1 || i === 3) ? `2px solid ${TEAL}` : 'none',
                }} />
              ))}
              <CheckCircle sx={{ fontSize: '3rem', color: TEAL }} />
            </Box>

            {/* Badge */}
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1,
              border: `1px solid ${TEAL}`, borderRadius: '4px',
              px: 1.5, py: 0.5, mb: 3,
            }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: TEAL }} />
              <Typography sx={{
                color: TEAL, fontSize: '0.65rem', fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                fontFamily: 'Inter, sans-serif',
              }}>
                Order Confirmed
              </Typography>
            </Box>

            {/* Heading */}
            <Typography sx={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '2.6rem' },
              color: 'text.primary',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              mb: 1.5,
            }}>
              Thank you for your order!
            </Typography>
            <Typography sx={{
              fontFamily: 'Inter, sans-serif',
              color: 'text.secondary',
              fontSize: '1rem',
              lineHeight: 1.7,
              mb: 1,
            }}>
              Your order has been placed successfully. We'll contact you shortly to confirm delivery details.
            </Typography>
            
            <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(20,184,166,0.06)', px: 2, py: 1, borderRadius: '6px', mb: 4 }}>
              <CircularProgress size={16} sx={{ color: TEAL, mr: 1.5 }} thickness={5} />
              <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: 'text.secondary', fontWeight: 500 }}>
                Redirecting to tracking in <Box component="span" sx={{ color: TEAL, fontWeight: 700 }}>{countdown}</Box> seconds...
              </Typography>
            </Box>

            {/* Order ref card */}
            <Box sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '4px',
              p: 3, mb: 5,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            }}>
              <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1 }}>
                Order Reference
              </Typography>
              <Typography sx={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: TEAL, letterSpacing: '0.04em' }}>
                {orderRef}
              </Typography>
              <Box sx={{ height: '1px', bgcolor: 'divider', my: 2 }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {[
                  { label: 'Payment', value: 'Cash on Delivery' },
                  { label: 'Delivery', value: '2–4 Business Days' },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ textAlign: 'left' }}>
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', color: 'text.secondary', mb: 0.25, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: 'text.primary', fontWeight: 600 }}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Steps */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0, mb: 5 }}>
              {[
                { label: 'Order Placed', done: true },
                { label: 'Confirmed', done: false },
                { label: 'Out for Delivery', done: false },
                { label: 'Delivered', done: false },
              ].map(({ label, done }, i, arr) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{
                      width: 28, height: 28, borderRadius: '4px', mx: 'auto', mb: 0.75,
                      bgcolor: done ? TEAL : 'transparent',
                      border: '1px solid',
                      borderColor: done ? TEAL : 'divider',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {done
                        ? <CheckCircle sx={{ fontSize: '0.95rem', color: '#fff' }} />
                        : <Box sx={{ width: 8, height: 8, borderRadius: '1px', bgcolor: 'divider' }} />
                      }
                    </Box>
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', color: done ? TEAL : 'text.secondary', fontWeight: done ? 700 : 400, whiteSpace: 'nowrap' }}>
                      {label}
                    </Typography>
                  </Box>
                  {i < arr.length - 1 && (
                    <Box sx={{ width: { xs: 20, sm: 40 }, height: 1, bgcolor: 'divider', mb: 2.5, mx: 0.5 }} />
                  )}
                </Box>
              ))}
            </Box>

            {/* CTAs */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/shop/orders', { state: { email: location.state?.email } })}
                startIcon={<LocalShipping />}
                sx={{
                  bgcolor: TEAL, color: '#fff',
                  fontFamily: 'Inter, sans-serif', fontWeight: 700,
                  fontSize: '0.9rem', py: 1.4, px: 3.5,
                  borderRadius: '4px', textTransform: 'none', boxShadow: 'none',
                  '&:hover': { bgcolor: '#0F766E', boxShadow: 'none', transform: 'translateY(-1px)' },
                  transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                Track My Order
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/shop/products')}
                endIcon={<ArrowForward />}
                sx={{
                  color: TEAL, borderColor: TEAL,
                  fontFamily: 'Inter, sans-serif', fontWeight: 700,
                  fontSize: '0.9rem', py: 1.4, px: 3,
                  borderRadius: '4px', textTransform: 'none',
                  '&:hover': { borderColor: '#0F766E', color: '#0F766E', bgcolor: 'rgba(20,184,166,0.04)', transform: 'translateY(-1px)' },
                  transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                Continue Shopping
              </Button>
              <Button
                onClick={() => navigate('/')}
                startIcon={<Home />}
                sx={{
                  color: 'text.secondary', fontFamily: 'Inter, sans-serif', fontWeight: 600,
                  fontSize: '0.9rem', py: 1.4, px: 3,
                  border: '1px solid transparent',
                  borderRadius: '4px', textTransform: 'none',
                  '&:hover': { color: TEAL, bgcolor: 'rgba(20,184,166,0.04)' },
                  transition: 'all 0.15s ease',
                }}
              >
                Back to Home
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </EcommerceLayout>
  );
};

export default OrderSuccess;
