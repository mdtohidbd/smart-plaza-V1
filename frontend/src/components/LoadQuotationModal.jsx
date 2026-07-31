import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Paper,
  IconButton
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon, Description as DescriptionIcon } from '@mui/icons-material';
import { useQuery } from 'react-query';
import api from '../utils/api';

const LoadQuotationModal = ({ open, onClose, onSelectQuotation }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: quotations, isLoading, error } = useQuery(
    ['quotations-load-search', searchTerm],
    async () => {
      const res = await api.get('/api/quotations', {
        params: {
          search: searchTerm,
          status: 'ALL'
        }
      });
      return res.data?.data || [];
    },
    {
      enabled: open,
      refetchOnWindowFocus: false
    }
  );

  const handleSelect = (quotation) => {
    onSelectQuotation(quotation);
    onClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Rejected': return 'error';
      case 'Converted': return 'info';
      default: return 'default';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: '#F8FAFC', 
        borderBottom: '1px solid #E2E8F0',
        py: 2, 
        px: 3 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DescriptionIcon sx={{ color: '#1D5F99' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontFamily: '"Outfit", sans-serif' }}>
            Load Quotation
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search quotation by quote number, customer name, phone, or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8' }} />
                </InputAdornment>
              ),
              sx: { borderRadius: '8px' }
            }}
          />
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={36} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">Failed to load quotations.</Typography>
          </Box>
        ) : quotations && quotations.length > 0 ? (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px', maxHeight: 380 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-head': { backgroundColor: '#F8FAFC', fontWeight: 700, color: '#475569' } }}>
                  <TableCell>Quote #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotations.map((quote) => (
                  <TableRow 
                    key={quote._id} 
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {quote.quotationNumber}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {quote.customer?.contactName || quote.customer?.businessName || 'N/A'}
                      </Typography>
                      {quote.customer?.contactNumber && (
                        <Typography variant="caption" color="text.secondary">
                          {quote.customer.contactNumber}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(quote.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={quote.status}
                        color={getStatusColor(quote.status)}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#1D5F99' }}>
                      ৳{(quote.total || 0).toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => handleSelect(quote)}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '6px' }}
                      >
                        Load
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
            <Typography variant="body2" color="text.secondary">
              No quotations found matching your search.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: 'none', fontWeight: 600 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoadQuotationModal;
