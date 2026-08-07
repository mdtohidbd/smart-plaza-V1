import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Card, CardContent, Avatar, Rating, Button, CircularProgress } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import StarIcon from '@mui/icons-material/Star';
import AddIcon from '@mui/icons-material/Add';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import SubmitTestimonial from '../../components/SubmitTestimonial';
import axios from 'axios';
import { getPublicApiBase } from '../../utils/publicApi';
import { useSettings } from '../../context/SettingsContext';

const Testimonials = () => {
  const { settings } = useSettings();
  const companyName = settings?.companyName || 'Demo Electronics ERP';
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const accents = ['#0F766E', '#F59E0B', '#8B5CF6', '#EC4899', '#3B82F6', '#10B981'];

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${getPublicApiBase()}/testimonials/approved`);
      if (response.data.success) {
        setTestimonials(response.data.data.slice(0, 6)); // Limit to 6 for the Bento layout
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGridPosition = (index) => {
    const layout = [
      { gridCol: { xs: '1 / -1', md: '1 / 3' }, gridRow: { xs: 'auto', md: '1 / 2' } },
      { gridCol: { xs: '1 / -1', md: '3 / 4' }, gridRow: { xs: 'auto', md: '1 / 3' } },
      { gridCol: { xs: '1 / -1', md: '1 / 2' }, gridRow: { xs: 'auto', md: '2 / 3' } },
      { gridCol: { xs: '1 / -1', md: '2 / 3' }, gridRow: { xs: 'auto', md: '2 / 3' } },
      { gridCol: { xs: '1 / -1', md: '1 / 3' }, gridRow: { xs: 'auto', md: '3 / 4' } },
      { gridCol: { xs: '1 / -1', md: '3 / 4' }, gridRow: { xs: 'auto', md: '3 / 4' } },
    ];
    return layout[index % layout.length];
  };

  return (
    <Box sx={{
      py: { xs: 5, md: 10 }, bgcolor: '#F8FAFC', position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle background pattern */}
      <Box sx={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
        backgroundSize: '32px 32px', pointerEvents: 'none',
      }} />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <Box sx={{
          display: 'flex', flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', alignItems: { xs: 'center', md: 'flex-end' },
          gap: 2, mb: { xs: 4, md: 6 },
        }}>
          <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.8,
              bgcolor: 'rgba(15,118,110,0.08)', border: '1px solid rgba(15,118,110,0.2)',
              borderRadius: '100px', px: 1.5, py: 0.4, mb: 2,
            }}>
              <StarIcon sx={{ fontSize: '0.75rem', color: '#F59E0B' }} />
              <Typography sx={{
                fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700,
                color: '#0F766E', letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>Customer Reviews</Typography>
            </Box>

            <Typography variant="h3" sx={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: { xs: '1.6rem', md: '2.8rem' }, fontWeight: 800,
              color: '#0F172A', letterSpacing: '-0.03em', mb: 1, lineHeight: 1.15,
            }}>
              What Our Customers{' '}
              <Box component="span" sx={{
                background: 'linear-gradient(135deg, #0D9488, #0F766E)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Say</Box>
            </Typography>
            <Typography sx={{
              maxWidth: 460, mx: { xs: 'auto', md: 0 },
              color: '#64748B', fontSize: { xs: '0.85rem', md: '1rem' }, lineHeight: 1.7,
              fontFamily: 'Inter, sans-serif',
            }}>
              Real reviews from real customers who shop at {companyName}
            </Typography>
          </Box>

          <Button variant="contained" size="large" startIcon={<AddIcon />}
            onClick={() => setShowSubmitDialog(true)}
            sx={{
              px: { xs: 3, md: 4 }, py: { xs: 1, md: 1.5 }, fontWeight: 700,
              fontFamily: 'Inter, sans-serif', textTransform: 'none',
              borderRadius: '0', bgcolor: '#0F766E', color: '#fff',
              fontSize: { xs: '0.82rem', md: '1rem' },
              boxShadow: 'none',
              transition: 'all 0.3s ease',
              '&:hover': { bgcolor: '#0D9488', boxShadow: 'none', transform: 'translateY(-2px)' },
            }}>
            Write a Review
          </Button>
        </Box>

        {/* Bento Grid Layout */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gridAutoRows: 'minmax(180px, auto)',
          gap: { xs: 2, md: 3 },
          minHeight: loading ? '300px' : 'auto',
          position: 'relative'
        }}>
          {loading ? (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress sx={{ color: '#0F766E' }} />
            </Box>
          ) : testimonials.length > 0 ? (
            testimonials.map((testimonial, index) => {
              const accent = accents[index % accents.length];
              const position = getGridPosition(index);
              return (
                <Card key={testimonial._id || index} sx={{
                  gridColumn: position.gridCol,
                  gridRow: position.gridRow,
                  display: 'flex', flexDirection: 'column',
                  bgcolor: '#FFFFFF', border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)',
                  position: 'relative', overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)', 
                    borderColor: accent 
                  },
                }}>
                  <Box sx={{ height: 4, width: '100%',
                    background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
                  }} />
                  <Box sx={{
                    position: 'absolute', top: 16, right: 16,
                    width: 36, height: 36, borderRadius: '50%', bgcolor: `${accent}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FormatQuoteIcon sx={{ fontSize: '1.2rem', color: accent, transform: 'scaleX(-1)' }} />
                  </Box>
  
                  <CardContent sx={{ flexGrow: 1, p: { xs: 2.5, md: 3.5 }, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {testimonial.imageUrl ? (
                        <Avatar src={testimonial.imageUrl} alt={testimonial.name}
                          sx={{
                            width: { xs: 48, md: 56 }, height: { xs: 48, md: 56 }, mr: 2,
                            border: `2px solid ${accent}30`,
                          }}
                        />
                      ) : (
                        <Avatar sx={{
                          width: { xs: 48, md: 56 }, height: { xs: 48, md: 56 }, mr: 2,
                          bgcolor: accent, color: '#fff', fontWeight: 'bold'
                        }}>
                          {testimonial.name?.charAt(0)}
                        </Avatar>
                      )}
                      <Box sx={{ flexGrow: 1, minWidth: 0, pr: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography sx={{
                            fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                            fontSize: { xs: '1rem', md: '1.1rem' }, color: '#0F172A',
                          }}>{testimonial.name}</Typography>
                          {testimonial.verified && (
                            <VerifiedIcon sx={{ fontSize: '0.9rem', color: '#0F766E' }} />
                          )}
                        </Box>
                        <Typography sx={{
                          fontFamily: 'Inter, sans-serif', fontSize: '0.75rem',
                          color: '#64748B', fontWeight: 500,
                        }}>
                          {testimonial.location ? `${testimonial.location} • ` : ''}
                          {testimonial.designation || 'Customer'}
                        </Typography>
                      </Box>
                    </Box>
  
                    <Rating value={testimonial.rating} readOnly size="small"
                      sx={{ mb: 2, '& .MuiRating-iconFilled': { color: '#F59E0B' }, fontSize: '1.1rem' }} />
  
                    <Typography sx={{
                      fontFamily: 'Inter, sans-serif', fontSize: { xs: '0.9rem', md: '0.95rem' },
                      lineHeight: 1.6, color: '#334155', flexGrow: 1, mb: 3,
                      fontWeight: 500
                    }}>
                      &ldquo;{testimonial.message}&rdquo;
                    </Typography>
  
                    {/* Purchased Product Tag */}
                    {(testimonial.product || testimonial.productRef || testimonial.recommend) && (
                      <Box sx={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                        pt: 2, borderTop: '1px dashed #E2E8F0', mt: 'auto'
                      }}>
                        {(testimonial.product || testimonial.productRef) && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {testimonial.productRef?.image && (
                              <img src={testimonial.productRef.image} alt={testimonial.productRef.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                            )}
                            <Box>
                              <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.2 }}>
                                Purchased Product
                              </Typography>
                              <Typography sx={{
                                fontFamily: 'Inter, sans-serif', fontSize: '0.8rem',
                                fontWeight: 600, color: '#0F766E', display: 'flex', alignItems: 'center', gap: 0.5
                              }}>
                                {!testimonial.productRef?.image && <ShoppingBagOutlinedIcon sx={{ fontSize: '1rem', color: '#0F766E' }} />}
                                {testimonial.productRef?.name || testimonial.product}
                              </Typography>
                              {testimonial.purchasedDate && (
                                <Typography sx={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 500 }}>
                                  {new Date(testimonial.purchasedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        )}
    
                        {testimonial.recommend && (
                          <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 0.5,
                            bgcolor: '#F0FDF4', borderRadius: '100px', px: 1.2, py: 0.4,
                            border: '1px solid #BBF7D0', ml: 'auto'
                          }}>
                            <FavoriteBorderIcon sx={{ fontSize: '0.75rem', color: '#16A34A' }} />
                            <Typography sx={{
                              fontFamily: 'Inter, sans-serif', fontSize: '0.65rem',
                              color: '#16A34A', fontWeight: 700, textTransform: 'uppercase'
                            }}>Recommended</Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 4, color: '#64748B' }}>
              <Typography>No testimonials available at the moment.</Typography>
            </Box>
          )}
        </Box>
      </Container>

      <SubmitTestimonial open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)} />
    </Box>
  );
};

export default Testimonials;
