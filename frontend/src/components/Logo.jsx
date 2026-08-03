import React from 'react';
import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

/**
 * Smart Plaza Centralized Dynamic Logo Component
 */
const Logo = ({ 
  height = 45, 
  fontSize = '1.25rem', 
  color = 'inherit', 
  showText = true, 
  variant = 'default', // 'default' or 'admin'
  sx = {} 
}) => {
  const { settings } = useSettings();
  
  // Dynamic values from Settings
  const logoSrc = settings?.logo || '/website-logo.png';
  const companyName = settings?.companyName || 'Smart Plaza BD';

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
      <img
        src={logoSrc}
        alt={companyName}
        style={{
          height: height,
          width: 'auto',
          marginRight: 0,
          objectFit: 'contain',
          display: 'block'
        }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/website-logo.png'; // Fallback
        }}
      />
      {showText && (
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 800, 
            letterSpacing: '-0.02em',
            fontSize: fontSize,
            ml: 0.4,
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
