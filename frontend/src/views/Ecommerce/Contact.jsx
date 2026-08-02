import React, { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, TextField, Button, Paper, IconButton, Alert, Divider } from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Send as SendIcon
} from '@mui/icons-material';
import EcommerceLayout from '../../ecommerce/layout/EcommerceLayout';
import { useSettings } from '../../context/SettingsContext';

const Contact = () => {
  console.log('Contact component rendering');
  const { settings } = useSettings();
  const companyName = settings?.companyName || 'Smart Plaza BD';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    
    // Simulate sending message
    setTimeout(() => {
      setSending(false);
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      
      setTimeout(() => setSuccess(false), 5000);
    }, 1500);
  };

  const contactInfo = [
    {
      icon: <PhoneIcon />,
      title: 'Call Us',
      details: [settings?.phone || '+880 1842-144844', settings?.alternativePhone || ''].filter(Boolean),
      action: 'Call now'
    },
    {
      icon: <EmailIcon />,
      title: 'Email Us',
      details: [settings?.email || 'smartplazabd@gmail.com'],
      action: 'Send email'
    },
    {
      icon: <LocationIcon />,
      title: 'Visit Our Store',
      details: [settings?.companyAddress || '1 KDA Avenue, Shibbari, Khulna-9100, Bangladesh'],
      action: 'Get directions'
    },
    {
      icon: <TimeIcon />,
      title: 'Opening Hours',
      details: ['Sat - Thu: 9:00 AM - 9:00 PM', 'Friday: 2:00 PM - 9:00 PM'],
      action: null
    }
  ];

  return (
    <EcommerceLayout>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Typography variant="h2" gutterBottom fontWeight="bold">
          Contact Us
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Get in touch with {companyName}
        </Typography>
      </Box>

      {/* Contact Information Cards */}
      <Grid container spacing={3} sx={{ mt: -4, mb: 6 }}>
        {contactInfo.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                p: 3,
                bgcolor: 'background.paper',
                border: (theme) => `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                boxShadow: 'none'
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  fontSize: 28
                }}
              >
                {item.icon}
              </Box>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {item.title}
              </Typography>
              {item.details.map((detail, idx) => (
                <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {detail}
                </Typography>
              ))}
              {item.action && (
                <Button size="small" variant="outlined" sx={{ mt: 2 }}>
                  {item.action}
                </Button>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {/* Contact Form */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 4, bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold" mb={3} color="text.primary">
              Send Us a Message
            </Typography>

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Thank you! Your message has been sent successfully. We'll get back to you soon.
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={5}
                    label="Your Message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={sending}
                    endIcon={sending ? null : <SendIcon />}
                    sx={{ px: 4 }}
                  >
                    {sending ? 'Sending...' : 'Send Message'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        {/* Map & Additional Info */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 4, height: '100%', bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold" mb={3} color="text.primary">
              Our Showroom Location
            </Typography>

            {/* Main Showroom */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {companyName} - Showroom
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {settings?.companyAddress || '1 KDA Avenue, Shibbari\nKhulna-9100, Bangladesh'}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Customer Support Services
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Need help choosing the right product? Have questions about your order? 
              Visit our showroom or call our dedicated customer support team. We offer:
            </Typography>
            
            <Box sx={{ ml: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>• Product demonstrations and expert advice</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>• Order tracking and delivery updates</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>• Warranty claims and after-sales support</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>• Technical assistance and troubleshooting</Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Delivery Coverage
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              We deliver products to all 64 districts of Bangladesh through reliable 
              courier services. Dhaka, Chittagong, and Sylhet deliveries typically 
              arrive within 2-3 days, while other locations may take 3-5 business days.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Connect With Us
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Follow us on social media for the latest product launches, special offers, 
              and tech updates!
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton color="primary" size="small">
                <svg style={{ width: 24, height: 24 }} viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.15 5.96C15.21 5.96 16.12 6.04 16.12 6.04V8.51H15.01C13.77 8.51 13.38 9.28 13.38 10.07V12.06H16.16L15.71 14.96H13.38V21.96C18.16 21.21 21.82 17.06 21.82 12.06C21.82 6.53 17.32 2.04 12 2.04Z" />
                </svg>
              </IconButton>
              <IconButton color="primary" size="small">
                <svg style={{ width: 24, height: 24 }} viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.46 7.57L12.352 2L2.25 7.57L4.18 19.18L12.35 22L20.53 19.18L22.46 7.57M12.36 19.79L5.4 17.39L3.73 7.34L12.36 2.58L20.99 7.34L19.32 17.39L12.36 19.79M12.35 10.91C11.53 10.91 10.87 11.58 10.87 12.4C10.87 13.22 11.53 13.89 12.35 13.89C13.17 13.89 13.83 13.22 13.83 12.4C13.83 11.58 13.17 10.91 12.35 10.91M16.79 12.4C16.79 13.22 16.13 13.89 15.31 13.89C14.49 13.89 13.83 13.22 13.83 12.4C13.83 11.58 14.49 10.91 15.31 10.91C16.13 10.91 16.79 11.58 16.79 12.4M7.92 12.4C7.92 13.22 8.58 13.89 9.4 13.89C10.22 13.89 10.88 13.22 10.88 12.4C10.88 11.58 10.22 10.91 9.4 10.91C8.58 10.91 7.92 11.58 7.92 12.4Z" />
                </svg>
              </IconButton>
              <IconButton color="primary" size="small">
                <svg style={{ width: 24, height: 24 }} viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.46 7.57L12.352 2L2.25 7.57L4.18 19.18L12.35 22L20.53 19.18L22.46 7.57M12.36 19.79L5.4 17.39L3.73 7.34L12.36 2.58L20.99 7.34L19.32 17.39L12.36 19.79M12.35 10.91C11.53 10.91 10.87 11.58 10.87 12.4C10.87 13.22 11.53 13.89 12.35 13.89C13.17 13.89 13.83 13.22 13.83 12.4C13.83 11.58 13.17 10.91 12.35 10.91M16.79 12.4C16.79 13.22 16.13 13.89 15.31 13.89C14.49 13.89 13.83 13.22 13.83 12.4C13.83 11.58 14.49 10.91 15.31 10.91C16.13 10.91 16.79 11.58 16.79 12.4M7.92 12.4C7.92 13.22 8.58 13.89 9.4 13.89C10.22 13.89 10.88 13.22 10.88 12.4C10.88 11.58 10.22 10.91 9.4 10.91C8.58 10.91 7.92 11.58 7.92 12.4Z" />
                </svg>
              </IconButton>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </EcommerceLayout>
  );
};

export default Contact;
