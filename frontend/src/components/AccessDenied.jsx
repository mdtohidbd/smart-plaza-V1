import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  Alert,
  AlertTitle
} from '@mui/material';
import { Lock, Home, ContactSupport } from '@mui/icons-material';

const AccessDenied = ({ 
  title = "Access Denied", 
  message = "You don't have permission to access this resource.", 
  onGoHome,
  onContactSupport,
  showHomeButton = true,
  showSupportButton = true
}) => {
  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f7fa',
        p: 2
      }}
    >
      <Card 
        sx={{ 
          maxWidth: 500, 
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          borderRadius: 3
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ 
            width: 80, 
            height: 80, 
            borderRadius: '50%', 
            backgroundColor: '#feebee',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 24px',
            border: '2px solid #ffcdd2'
          }}>
            <Lock sx={{ fontSize: 40, color: '#f44336' }} />
          </Box>
          
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 700, 
              color: '#1a237e',
              mb: 2
            }}
          >
            {title}
          </Typography>
          
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 3, 
              textAlign: 'left',
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <AlertTitle>Permission Required</AlertTitle>
            {message}
          </Alert>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#5c6bc0', 
              mb: 3,
              lineHeight: 1.6
            }}
          >
            If you believe this is an error, please contact your administrator or our support team for assistance.
          </Typography>
        </CardContent>
        
        <CardActions sx={{ 
          justifyContent: 'center', 
          p: 3,
          pt: 0
        }}>
          {showHomeButton && (
            <Button
              variant="contained"
              startIcon={<Home />}
              onClick={onGoHome}
              sx={{
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
                py: 1.5,
                px: 3,
                mr: 2
              }}
            >
              Go to Dashboard
            </Button>
          )}
          
          {showSupportButton && (
            <Button
              variant="outlined"
              startIcon={<ContactSupport />}
              onClick={onContactSupport}
              sx={{
                borderColor: '#1976d2',
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: '#e3f2fd',
                  borderColor: '#1565c0',
                },
                py: 1.5,
                px: 3
              }}
            >
              Contact Support
            </Button>
          )}
        </CardActions>
      </Card>
    </Box>
  );
};

export default AccessDenied;