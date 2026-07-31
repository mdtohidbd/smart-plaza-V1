import React from 'react';
import { Box, ThemeProvider, createTheme } from '@mui/material';
import EcommerceHeader from './EcommerceHeader';
import EcommerceFooter from './EcommerceFooter';
import MobileBottomNav from './MobileBottomNav';

// Light theme specifically for E-commerce user-facing sections
const ecommerceTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0bd593',
      light: '#3eeca8',
      dark: '#006c48',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#4a8266',
      light: '#b4f0ce',
      dark: '#31694e',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#ffc962',
      light: '#ffdea7',
      dark: '#7c5800',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#f3fcf4',
      paper: '#ffffff',
    },
    text: {
      primary: '#151d19',
      secondary: '#3c4a41',
      disabled: '#6b7b71',
    },
    divider: '#dce5dd',
  },
  typography: {
    fontFamily: ['Inter', '-apple-system', 'system-ui', 'sans-serif'].join(','),
    h1: { fontSize: '32px', fontWeight: 700, lineHeight: '40px' },
    h2: { fontSize: '24px', fontWeight: 600, lineHeight: '32px' },
    body1: { fontSize: '16px', fontWeight: 400, lineHeight: '24px' },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        contained: {
          backgroundColor: '#0bd593',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#006c48',
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0, 108, 72, 0.08)',
          border: '1px solid #dce5dd',
          backgroundColor: '#ffffff',
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#bacabf' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6b7b71' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0bd593', borderWidth: '2px' },
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '9999px',
        },
        filled: {
          backgroundColor: '#e7f0e9',
          color: '#151d19',
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        }
      }
    }
  }
});

const EcommerceLayout = ({ children }) => {
  return (
    <ThemeProvider theme={ecommerceTheme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
        {/* Header - Always visible */}
        <EcommerceHeader />
        
        {/* Main Content */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1,
            width: '100%',
            minHeight: 'calc(100vh - 200px)', // Account for header and footer
            pb: { xs: 8, md: 0 } // Extra bottom space on mobile for the fixed nav bar
          }}
        >
          {children}
        </Box>
        
        {/* Footer - Always visible */}
        <EcommerceFooter />

        {/* Mobile Bottom Navigation - Visible on mobile only */}
        <MobileBottomNav />
      </Box>
    </ThemeProvider>
  );
};

export default EcommerceLayout;
