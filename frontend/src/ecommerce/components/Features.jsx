import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { 
  LocalShipping, VerifiedUser, CreditCard, Speed, Payments 
} from '@mui/icons-material';

const FEATURES = [
  {
    title: '4 Hours Delivery',
    desc: 'Inside Khulna City Only',
    icon: <LocalShipping sx={{ color: '#14B8A6', fontSize: { xs: 26, md: 32 } }} />,
    bgColor: 'rgba(20, 184, 166, 0.1)'
  },
  {
    title: 'Official Warranty',
    desc: '100% Original Product',
    icon: <VerifiedUser sx={{ color: '#3B82F6', fontSize: { xs: 26, md: 32 } }} />,
    bgColor: 'rgba(59, 130, 246, 0.1)'
  },
  {
    title: 'Cash on Delivery',
    desc: 'Pay cash after receiving',
    icon: <Payments sx={{ color: '#EF4444', fontSize: { xs: 26, md: 32 } }} />,
    bgColor: 'rgba(239, 68, 68, 0.1)'
  },
  {
    title: 'Faster Delivery',
    desc: 'At Your Doorstep',
    icon: <Speed sx={{ color: '#F59E0B', fontSize: { xs: 26, md: 32 } }} />,
    bgColor: 'rgba(245, 158, 11, 0.1)'
  },
  {
    title: 'Flexible Payment',
    desc: 'Easy & Secured',
    icon: <CreditCard sx={{ color: '#10B981', fontSize: { xs: 26, md: 32 } }} />,
    bgColor: 'rgba(16, 185, 129, 0.1)'
  }
];

const Features = () => {
  return (
    <Box sx={{ 
      bgcolor: '#FFFFFF',
      py: { xs: 2.5, md: 5 },
      borderBottom: '1px solid #E2E8F0',
      position: 'relative'
    }}>
      <Container maxWidth="xl">
        {/* Mobile: Horizontal swiping row with snap | Desktop: 5-column grid */}
        <Box sx={{
          display: { xs: 'flex', md: 'grid' },
          gridTemplateColumns: { md: 'repeat(5, 1fr)' },
          overflowX: { xs: 'auto', md: 'visible' },
          scrollSnapType: { xs: 'x mandatory', md: 'none' },
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          gap: { xs: 1.5, md: 2 },
          pb: { xs: 1.5, md: 0 },
        }}>
          {FEATURES.map((feature, index) => (
            <Box key={index} sx={{
              bgcolor: '#FFFFFF',
              p: { xs: '12px 10px', md: '16px 20px' },
              borderRadius: { xs: '10px', md: '16px' },
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              textAlign: { xs: 'center', md: 'left' },
              gap: { xs: 0.5, md: 2 },
              cursor: 'pointer',
              flexShrink: { xs: 0, md: 1 },
              width: { xs: '135px', md: '100%' },
              scrollSnapAlign: { xs: 'center', md: 'none' },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: { md: 'translateY(-4px)' },
                borderColor: feature.bgColor.replace('0.1', '0.4'),
                boxShadow: { md: `0 8px 16px -8px ${feature.bgColor.replace('0.1', '0.4')}` },
              }
            }}>
              {/* Icon */}
              <Box sx={{
                width: { xs: 36, md: 52 }, height: { xs: 36, md: 52 },
                borderRadius: { xs: '8px', md: '14px' },
                bgcolor: feature.bgColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                mb: { xs: 0.5, md: 0 },
                '& svg': { fontSize: { xs: '1.1rem !important', md: '2rem !important' } }
              }}>
                {feature.icon}
              </Box>

              {/* Text */}
              <Box sx={{ flex: 1, width: '100%' }}>
                <Typography variant="subtitle1" sx={{ 
                  color: '#0F172A', fontWeight: 700, 
                  fontSize: { xs: '0.62rem', md: '0.95rem' },
                  lineHeight: 1.2, mb: { xs: 0.2, md: 0.3 }, letterSpacing: '0.01em',
                  overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#64748B', fontSize: { xs: '0.55rem', md: '0.75rem' },
                  fontWeight: 500, lineHeight: 1.3,
                  overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {feature.desc}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default Features;
