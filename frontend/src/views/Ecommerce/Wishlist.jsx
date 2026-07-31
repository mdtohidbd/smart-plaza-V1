import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';

const Wishlist = () => {
  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        My Wishlist
      </Typography>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Your wishlist is empty. Add products you love!
        </Typography>
      </Paper>
    </Box>
  );
};

export default Wishlist;
