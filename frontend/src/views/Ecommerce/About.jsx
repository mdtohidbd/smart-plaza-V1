import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Avatar } from '@mui/material';
import EcommerceLayout from '../../ecommerce/layout/EcommerceLayout';
import { useSettings } from '../../context/SettingsContext';

const About = () => {
  const { settings } = useSettings();
  const companyName = settings?.companyName || 'Smart Plaza BD';

  const team = [
    {
      name: "Akash Ghosh",
      role: "Founder & CEO",
      image: "https://i.ibb.co/spSTz4rr/akash.jpg",
      bio: "Visionary leader driving innovation in business management solutions."
    },
    {
      name: "C. M Mahim Masrafi",
      role: "Lead Designer & Full Stack Developer",
      image: "https://i.ibb.co/dZ9R5Yw/487558084-2648658821998427-4760036966159547830-n.jpg",
      bio: "Creating intuitive and beautiful user experiences."
    }
  ];

  return (
    <EcommerceLayout>
      {/* Hero Section */}
      <Box sx={{ 
        bgcolor: 'primary.main', 
        color: 'white', 
        py: 8,
        textAlign: 'center'
      }}>
        <Container maxWidth="xl">
          <Typography variant="h2" fontWeight="bold" gutterBottom>
            About {companyName}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: '800px', mx: 'auto' }}>
            Empowering businesses with innovative solutions
          </Typography>
        </Container>
      </Box>

      {/* Company Overview */}
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box
              component="img"
              src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800"
              alt="Office"
              sx={{
                width: '100%',
                height: 'auto',
                borderRadius: 1,
                border: (theme) => `1px solid ${theme.palette.divider}`
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Top-quality Electronics & Home Appliances in Bangladesh!
            </Typography>
            <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
              {companyName} is your trusted destination for premium electronics and home appliances 
              across Bangladesh. We offer an extensive range of products from leading brands, 
              combining great deals with expert advice to help you make informed decisions.
            </Typography>
            <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
              Whether you're looking for the latest smartphones, cutting-edge laptops, energy-efficient 
              home appliances, or innovative consumer electronics, we've got you covered. Our commitment 
              to quality, competitive pricing, and exceptional customer service has made us a preferred 
              choice for thousands of customers nationwide.
            </Typography>
            <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
              With our convenient home delivery service, you can shop from the comfort of your home 
              and receive your products safely anywhere in Bangladesh. We also provide expert product 
              demonstrations, warranty support, and after-sales service to ensure your complete satisfaction.
            </Typography>
          </Grid>
        </Grid>
      </Container>

      {/* Services Section */}
      <Box sx={{ bgcolor: 'background.default', py: 8, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Container maxWidth="xl">
          <Typography variant="h3" fontWeight="bold" align="center" gutterBottom color="text.primary">
            Why Choose {companyName}?
          </Typography>
          <Box
            sx={{
              width: '80px',
              height: '4px',
              bgcolor: 'primary.main',
              mx: 'auto',
              mb: 6,
              borderRadius: 2
            }}
          />
          <Grid container spacing={4}>
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 4, textAlign: 'center', height: '100%', bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 1 }}>
                <CardContent>
                  <Box sx={{ fontSize: '3rem', mb: 2 }}>🏆</Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="text.primary">
                    Genuine Products
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    100% authentic products from authorized brands with official warranties
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 4, textAlign: 'center', height: '100%', bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 1 }}>
                <CardContent>
                  <Box sx={{ fontSize: '3rem', mb: 2 }}>💰</Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="text.primary">
                    Best Prices
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Competitive pricing with regular discounts and special offers
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 4, textAlign: 'center', height: '100%', bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 1 }}>
                <CardContent>
                  <Box sx={{ fontSize: '3rem', mb: 2 }}>🚚</Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="text.primary">
                    Home Delivery
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fast and reliable delivery service across all districts of Bangladesh
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 4, textAlign: 'center', height: '100%', bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 1 }}>
                <CardContent>
                  <Box sx={{ fontSize: '3rem', mb: 2 }}>🎧</Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="text.primary">
                    Expert Support
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Professional guidance and dedicated after-sales customer support
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Values Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Container maxWidth="xl">
          <Typography variant="h3" fontWeight="bold" align="center" gutterBottom color="text.primary">
            Our Commitment to You
          </Typography>
          <Box
            sx={{
              width: '80px',
              height: '4px',
              bgcolor: 'primary.main',
              mx: 'auto',
              mb: 6,
              borderRadius: 2
            }}
          />
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 4, textAlign: 'center', height: '100%', bgcolor: 'background.default', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 1 }}>
                <CardContent>
                  <Typography variant="h5" fontWeight="bold" gutterBottom color="text.primary">
                    Quality Assurance
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Every product is carefully selected and tested to meet international quality standards
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 4, textAlign: 'center', height: '100%', bgcolor: 'background.default', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 1 }}>
                <CardContent>
                  <Typography variant="h5" fontWeight="bold" gutterBottom color="text.primary">
                    Customer Satisfaction
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your happiness is our priority - we offer hassle-free returns and exchanges
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 4, textAlign: 'center', height: '100%', bgcolor: 'background.default', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 1 }}>
                <CardContent>
                  <Typography variant="h5" fontWeight="bold" gutterBottom color="text.primary">
                    Innovation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bringing you the latest technology and innovative products from around the world
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Team Section */}
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Typography variant="h3" fontWeight="bold" align="center" gutterBottom color="text.primary">
          Meet Our Leadership Team
        </Typography>
        <Box
          sx={{
            width: '80px',
            height: '4px',
            bgcolor: 'primary.main',
            mx: 'auto',
            mb: 6,
            borderRadius: 2
          }}
        />
        <Grid container spacing={4}>
          {team.map((member, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ textAlign: 'center', p: 3, bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none', borderRadius: 1 }}>
                <Avatar
                  src={member.image}
                  alt={member.name}
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mx: 'auto', 
                    mb: 2,
                    border: '4px solid',
                    borderColor: 'primary.main'
                  }}
                >
                  {!member.image && member.name.charAt(0)}
                </Avatar>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom color="text.primary">
                    {member.name}
                  </Typography>
                  <Typography variant="subtitle2" color="primary.main" gutterBottom>
                    {member.role}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {member.bio}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Contact CTA */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 6 }}>
        <Container maxWidth="xl" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Ready to Transform Your Business?
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
            Get in touch with us today
          </Typography>
          <Typography variant="body1">
            📍 {settings?.companyAddress || '1 KDA Avenue, Shibbari, Khulna, Bangladesh, 9100'}
          </Typography>
          <Typography variant="body1">
            📞 {settings?.phone || '01842-144844'} | ✉️ {settings?.email || 'smartplazabd@gmail.com'}
          </Typography>
        </Container>
      </Box>
    </EcommerceLayout>
  );
};

export default About;
