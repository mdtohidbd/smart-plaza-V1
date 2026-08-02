import React from 'react';
import { Box, Container, Grid, Typography, Link, IconButton, Divider, Stack } from '@mui/material';
import { Facebook, Instagram, YouTube, LinkedIn, ArrowUpward, ChevronRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const EcommerceFooter = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { settings } = useSettings();
  const isStaffUser = ['Super Admin', 'Admin', 'Manager', 'SR', 'DSR', 'Investor'].includes(user?.role);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerSections = {
    about: {
      title: 'Shop',
      links: [
        { name: 'All Products', path: '/shop/products' },
        { name: 'Contact Us', path: '/contact' },
        { name: 'About Us', path: '/about' },
        { name: 'Staff Login', path: '/login' }
      ]
    },
    help: {
      title: 'Help',
      links: [
        { name: 'Track Order', path: isAuthenticated && !isStaffUser ? '/shop/account/track-order' : '/shop/orders/tracking' },
        { name: 'My Orders', path: '/shop/account/orders' },
        { name: 'Shopping Cart', path: '/shop/cart' },
        { name: 'Privacy & Terms', path: '/contact' }
      ]
    },
    contact: {
      title: 'Contact Us',
      content: (
        <Stack spacing={1.5}>
          <Logo 
            variant="ecommerce"
            height={32}
            fontSize="1.2rem"
            color="#006c48"
            sx={{ mb: 0.5 }}
          />
          <Typography variant="body2" sx={{ color: '#3c4a41', lineHeight: 1.6, fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
            {settings?.companyAddress || '1 KDA Avenue, Shibbari, Khulna, Bangladesh'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#3c4a41', fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
            Phone: {settings?.phone || '+880-1842-144844'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#3c4a41', fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
            Email: {settings?.email || 'smartplazabd@gmail.com'}
          </Typography>
        </Stack>
      )
    },
    social: {
      title: 'Follow Us',
      links: [
        { name: 'Facebook', icon: <Facebook fontSize="small" />, url: 'https://facebook.com/smartplazabd' },
        { name: 'Instagram', icon: <Instagram fontSize="small" />, url: 'https://instagram.com/smartplazabd' },
        { name: 'YouTube', icon: <YouTube fontSize="small" />, url: 'https://youtube.com/smartplazabd' },
        { name: 'LinkedIn', icon: <LinkedIn fontSize="small" />, url: 'https://linkedin.com/company/smartplazabd' }
      ]
    }
  };

  return (
    <Box component="footer" sx={{
      background: '#e7f0e9',
      color: '#151d19',
      pt: { xs: 3, md: 8 }, 
      pb: { xs: 10, md: 6 },
      mt: 'auto',
      borderTopLeftRadius: { xs: 24, md: 0 }, 
      borderTopRightRadius: { xs: 24, md: 0 },
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background shapes */}
      <Box sx={{
        position: 'absolute', top: '-10%', left: '-5%', width: '30%', height: '50%',
        background: 'radial-gradient(circle, rgba(0, 108, 72, 0.05) 0%, rgba(0, 108, 72, 0) 70%)',
        borderRadius: '50%', zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute', bottom: '0%', right: '-5%', width: '40%', height: '60%',
        background: 'radial-gradient(circle, rgba(0, 108, 72, 0.03) 0%, rgba(0, 108, 72, 0) 70%)',
        borderRadius: '50%', zIndex: 0
      }} />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 2.5, md: 5 }}>
          <Grid item xs={6} sm={6} md={3}>
            <Typography variant="h6" gutterBottom
              sx={{ fontWeight: 700, color: '#151d19', mb: { xs: 1.5, md: 2.5 }, fontSize: { xs: '1rem', md: '1.15rem' }, letterSpacing: '0.5px' }}>
              {footerSections.about.title}
            </Typography>
            <Stack spacing={1.5}>
              {footerSections.about.links.map((link) => (
                <Link key={link.name} component="button" type="button"
                  onClick={() => navigate(link.path)} underline="none"
                  sx={{
                    textAlign: 'left', display: 'flex', alignItems: 'center', gap: 0.5,
                    color: '#3c4a41', fontSize: { xs: '0.85rem', md: '0.95rem' }, 
                    cursor: 'pointer', transition: 'all 0.2s',
                    '&:hover': { color: '#006c48', transform: 'translateX(4px)' }
                  }}>
                  <ChevronRight sx={{ fontSize: '1rem', opacity: 0.7 }} />
                  {link.name}
                </Link>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Typography variant="h6" gutterBottom
              sx={{ fontWeight: 700, color: '#151d19', mb: { xs: 1.5, md: 2.5 }, fontSize: { xs: '1rem', md: '1.15rem' }, letterSpacing: '0.5px' }}>
              {footerSections.help.title}
            </Typography>
            <Stack spacing={1.5}>
              {footerSections.help.links.map((link) => (
                <Link key={link.name} component="button" type="button"
                  onClick={() => navigate(link.path)} underline="none"
                  sx={{
                    textAlign: 'left', display: 'flex', alignItems: 'center', gap: 0.5,
                    color: '#3c4a41', fontSize: { xs: '0.85rem', md: '0.95rem' }, 
                    cursor: 'pointer', transition: 'all 0.2s',
                    '&:hover': { color: '#006c48', transform: 'translateX(4px)' }
                  }}>
                  <ChevronRight sx={{ fontSize: '1rem', opacity: 0.7 }} />
                  {link.name}
                </Link>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom
              sx={{ fontWeight: 700, color: '#151d19', mb: { xs: 1.5, md: 2.5 }, fontSize: { xs: '1rem', md: '1.15rem' }, letterSpacing: '0.5px' }}>
              {footerSections.contact.title}
            </Typography>
            <Box>{footerSections.contact.content}</Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom
              sx={{ fontWeight: 700, color: '#151d19', mb: { xs: 1.5, md: 2.5 }, fontSize: { xs: '1rem', md: '1.15rem' }, letterSpacing: '0.5px' }}>
              {footerSections.social.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {footerSections.social.links.map((social) => (
                <IconButton key={social.name} href={social.url} target="_blank" rel="noopener noreferrer"
                  sx={{
                    color: '#006c48',
                    bgcolor: '#ffffff',
                    p: { xs: 1, md: 1.2 },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    '&:hover': { 
                      bgcolor: '#0bd593', 
                      color: '#ffffff',
                      transform: 'translateY(-4px) scale(1.05)',
                      boxShadow: '0 8px 16px rgba(11, 213, 147, 0.2)'
                    }
                  }}>
                  {social.icon}
                </IconButton>
              ))}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: { xs: 2.5, md: 5 }, borderColor: '#dce5dd' }} />

        <Box sx={{
          display: 'flex', 
          flexDirection: { xs: 'column-reverse', md: 'row' },
          justifyContent: { xs: 'center', md: 'space-between' }, 
          alignItems: 'center',
          gap: { xs: 2.5, md: 2 }
        }}>
          <Typography variant="body2" sx={{ color: '#3c4a41', fontWeight: 500, fontSize: { xs: '0.8rem', md: '0.9rem' }, textAlign: 'center' }}>
            © {new Date().getFullYear()} {settings?.companyName || 'Smart Plaza BD'}. All rights reserved.
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <IconButton onClick={scrollToTop}
              sx={{ 
                bgcolor: '#ffffff', 
                color: '#006c48', 
                backdropFilter: 'blur(4px)',
                width: 36, 
                height: 36, 
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  bgcolor: '#0bd593', 
                  color: '#ffffff',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 6px 16px rgba(11, 213, 147, 0.2)'
                } 
              }}
              aria-label="Back to top">
              <ArrowUpward fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default EcommerceFooter;

