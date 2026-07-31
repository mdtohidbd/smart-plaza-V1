import React from 'react';
import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

/**
 * Smart Plaza Centralized Logo Component
 * 
 * This component uses the new website-logo.png as the 'S' in Smart Plaza.
 */
const Logo = ({ 
  height = 45, 
  fontSize = '1.25rem', 
  color = 'inherit', 
  showText = true, 
  variant = 'default', // 'default' or 'admin'
  sx = {} 
}) => {
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
        src="/website-logo.png"
        alt="Smart Plaza"
        style={{
          height: height,
          width: 'auto',
          marginRight: 0,
          objectFit: 'contain',
          display: 'block'
        }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/logo.jpeg'; // Fallback
        }}
      />
      {showText && (
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 800, 
            letterSpacing: '-0.02em',
            fontSize: fontSize,
            ml: 0.4, // Small natural gap after the "S" logo
            fontFamily: '"Outfit", sans-serif',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          mart Plaza{variant === 'admin' ? ' BD' : ''}
        </Typography>
      )}
    </Box>
  );
};

export default Logo;
