import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import InventoryIcon from '@mui/icons-material/Inventory';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import { useSettings } from '../context/SettingsContext';

const features = [
  {
    icon: <SecurityIcon />,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with role-based access control to protect your business data'
  },
  {
    icon: <TrendingUpIcon />,
    title: 'Business Growth',
    description: 'Comprehensive tools to track sales, manage inventory, and optimize business performance'
  },
  {
    icon: <SupportAgentIcon />,
    title: '24/7 Support',
    description: 'Dedicated customer support team available round the clock to assist you'
  },
  {
    icon: <InventoryIcon />,
    title: 'Smart Inventory',
    description: 'Real-time inventory tracking with automated alerts and stock management'
  },
  {
    icon: <AnalyticsIcon />,
    title: 'Advanced Analytics',
    description: 'Detailed reports and insights to make data-driven business decisions'
  },
  {
    icon: <BusinessCenterIcon />,
    title: 'Multi-Shop Management',
    description: 'Manage multiple shops and locations from a single unified dashboard'
  }
];

const WhyChooseUs = () => {
  const { settings } = useSettings();
  const companyName = settings?.companyName || 'Demo Electronics ERP';

  return (
    <Box 
      sx={{ 
        py: { xs: 8, md: 12 }, 
        bgcolor: '#F8FAFC',
        position: 'relative'
      }}
    >
      <Container maxWidth="lg">
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography 
            variant="h4" 
            component="h2" 
            gutterBottom 
            sx={{ 
              color: 'rgb(29, 29, 28)', // Demo Electronics ERP logo color
              fontWeight: 800, 
              mb: 2,
              fontSize: { xs: '1.75rem', md: '2.25rem' }
            }}
          >
            Why Choose {companyName}?
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#475569', 
              maxWidth: '700px', 
              mx: 'auto',
              fontSize: { xs: '0.95rem', md: '1.05rem' }
            }}
          >
            Empower your business with our comprehensive management solution designed for modern retailers and wholesalers
          </Typography>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid #E2E8F0',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 24px rgba(29, 29, 28, 0.15)',
                    borderColor: 'rgb(29, 29, 28)'
                  }
                }}
              >
                {/* Icon */}
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    backgroundColor: 'rgba(29, 29, 28, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    color: 'rgb(29, 29, 28)',
                    '& svg': {
                      fontSize: 32
                    }
                  }}
                >
                  {feature.icon}
                </Box>

                {/* Title */}
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{
                    color: 'rgb(29, 29, 28)',
                    fontWeight: 700,
                    mb: 1.5,
                    fontSize: '1.1rem'
                  }}
                >
                  {feature.title}
                </Typography>

                {/* Description */}
                <Typography
                  variant="body2"
                  sx={{
                    color: '#64748B',
                    lineHeight: 1.6,
                    fontSize: '0.925rem'
                  }}
                >
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Call to Action */}
        <Box 
          sx={{ 
            mt: 6, 
            textAlign: 'center',
            p: 4,
            backgroundColor: 'rgba(29, 29, 28, 0.05)',
            borderRadius: 3
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgb(29, 29, 28)',
              fontWeight: 700,
              mb: 2
            }}
          >
            Ready to Transform Your Business?
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#64748B',
              mb: 3
            }}
          >
            Join hundreds of successful businesses using {companyName}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default WhyChooseUs;
