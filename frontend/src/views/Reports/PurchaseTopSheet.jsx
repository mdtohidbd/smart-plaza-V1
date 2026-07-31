import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  Tooltip
} from '@mui/material';
import { Search as SearchIcon, PictureAsPdf as PdfIcon, Download as ExcelIcon, Refresh as RefreshIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';


const PurchaseTopSheet = () => {
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { activeShop } = useAuth();

  // Fetch purchase top sheet data
  const {
    data: topSheetData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['purchaseTopSheet', activeShop?._id],
    async () => {
      const response = await api.get('/api/reports/purchase-top-sheet', {
        params: {
          shopId: activeShop?._id,
          limit: 100
        }
      });
      return response.data.data;
    },
    {

      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Automatically refresh data when shop changes
  useEffect(() => {
    const handleShopChange = () => {
      refetch();
    };
    
    window.addEventListener('shopChanged', handleShopChange);
    
    return () => {
      window.removeEventListener('shopChanged', handleShopChange);
    };
  }, [refetch]);

  // Filter data based on search
  const filteredData = topSheetData?.filter(item => 
    item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Exporting PDF...');
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    console.log('Exporting Excel...');
  };
  return (
    <Box sx={{ py: { xs: 1, sm: 2 }, 
      backgroundColor: '#F8FAFC',
      
    }}>
      
      {/* Slick Back Button */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Box
          onClick={() => navigate(-1)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            px: 1.5,
            py: 0.75,
            borderRadius: '8px',
            border: '1px solid rgba(0,0,0,0.08)',
            bgcolor: 'white',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            transition: 'all 0.18s ease',
            '&:hover': {
              boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
              transform: 'translateX(-2px)',
              borderColor: 'rgba(0,0,0,0.18)',
            },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 16, color: '#64748b' }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.82rem', fontFamily: '"Outfit", sans-serif' }}>
            Back
          </Typography>
        </Box>
      </Box>
      <Grid container spacing={1.5} >
        <Grid item xs={12}>
          <Paper 
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              border: '1px solid #eaeef3',
              borderRadius: '8px',
              fontFamily: '"Outfit", sans-serif',
            }}
          >
            <Grid container spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search top items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
                <Tooltip title="Refresh Data">
                  <Button 
                    variant="outlined" 
                    sx={{ mr: 1 }}
                    onClick={() => refetch()}
                    disabled={isLoading}
                    startIcon={<RefreshIcon />}
                  >
                    Refresh
                  </Button>
                </Tooltip>
                <Button 
                  variant="contained" 
                  color="primary" 
                  sx={{ mr: 1 }}
                  onClick={handleExportPDF}
                  disabled={isLoading || !topSheetData?.length}
                  startIcon={<PdfIcon />}
                >
                  Export PDF
                </Button>
                <Button 
                  variant="contained" 
                  color="secondary"
                  onClick={handleExportExcel}
                  disabled={isLoading || !topSheetData?.length}
                  startIcon={<ExcelIcon />}
                >
                  Export Excel
                </Button>
              </Grid>
            </Grid>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>Loading purchase data...</Typography>
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                Error loading purchase data: {error?.response?.data?.message || error?.message || 'Unknown error'}
              </Alert>
            ) : !topSheetData?.length ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No purchase data available for the selected criteria.
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: '#E57141',
                        '& .MuiTableCell-head': {
                          color: 'black !important',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          borderBottom: '2px solid #e0e0e0',
                          whiteSpace: 'nowrap',
                          padding: '6px 10px'
                        }
                      }}
                    >
                      <TableCell >Product Name</TableCell>
                      <TableCell >Supplier</TableCell>
                      <TableCell >Total Quantity</TableCell>
                      <TableCell >Total Value</TableCell>
                      <TableCell >Avg. Rate</TableCell>
                      <TableCell >Rank</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData.map((item, index) => (
                      <TableRow 
                        key={item._id || index}
                        sx={{
                          backgroundColor: index % 2 === 0 ? 'transparent' : '#f9fbfd',
                          '&:hover': {
                            backgroundColor: '#eef5ff',
                          },
                          '& .MuiTableCell-root': {
                            whiteSpace: 'nowrap',
                            padding: '6px 10px'
                          }
                        }}
                      >
                        <TableCell sx={{ color: '#333' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.productName || 'N/A'}
                            </Typography>
                            {item.purchaseCount > 1 && (
                              <Chip size="small" label={`${item.purchaseCount} orders`} sx={{ mt: 0.5 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#333' }}>
                          {item.supplierName || 'N/A'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#333' }}>
                          {item.totalQuantity?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#E57141', fontWeight: '500' }}>
                          ৳{item.totalValue?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#E57141', fontWeight: '500' }}>
                          ৳{item.avgRate?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell sx={{ color: '#E57141', fontWeight: '500' }}>
                          <Chip 
                            label={`#${item.rank}`} 
                            size="small"
                            sx={{
                              backgroundColor: item.rank <= 3 ? '#E57141' : '#f0f0f0',
                              color: item.rank <= 3 ? 'white' : '#333',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PurchaseTopSheet;
