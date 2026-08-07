import React from 'react';
import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

/**
 * Demo ERP Centralized Dynamic Logo Component
 */
const Logo = ({ 
  height = 45, 
  fontSize = '1.25rem', 
  color = 'inherit', 
  showText = true, 
  showIcon = true,
  variant = 'default', // 'default' or 'admin'
  sx = {} 
}) => {
  const { settings } = useSettings();
  
  // Dynamic values from Settings (Logo image is optional)
  const logoSrc = settings?.logo || '';
  const companyName = settings?.companyName || 'Demo Electronics ERP';

  const hasLogoImage = showIcon && logoSrc && logoSrc.trim() !== '';

  return (
    <Box
      component={Link}
      to="/"
      sx={{ 
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
        color: color,
        '&:hover': {
          opacity: 0.9
        },
        ...sx
      }}
    >
      {hasLogoImage && (
        <img
          src={logoSrc}
          alt={companyName}
          style={{
            height: height,
            width: 'auto',
            marginRight: showText ? 6 : 0,
            objectFit: 'contain',
            display: 'block'
          }}
          onError={(e) => {
            e.target.style.display = 'none'; // Hide if image fails to load
          }}
        />
      )}
      {showText && (
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 800, 
            letterSpacing: '-0.02em',
            fontSize: fontSize,
            ml: hasLogoImage ? 0.4 : 0,
            fontFamily: '"Outfit", sans-serif',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {companyName}
        </Typography>
      )}
    </Box>
  );
};

export default Logo;
