import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Tooltip,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import { Search as SearchIcon, PictureAsPdf as PdfIcon, Download as ExcelIcon, Refresh as RefreshIcon, BarChart as ChartIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import useShopRefresh from '../../hooks/useShopRefresh';


const ProductWiseTopChart = () => {
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [chartType, setChartType] = useState('quantity');
  const { activeShop } = useAuth();

  // Fetch product wise top chart data
  const {
    data: chartData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['productWiseTopChart', activeShop?._id, chartType],
    async () => {
      const response = await api.get('/api/reports/product-wise-top-chart', {
        params: {
          shopId: activeShop?._id,
          type: chartType,
          limit: 50
        }
      });
      return response.data.data;
    },
    {
      
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Automatically refresh data when shop changes
  useShopRefresh(refetch);

  // Filter data based on search
  const filteredData = chartData?.filter(item => 
    item.productName?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <Card 
            sx={{ 
              p: 1.5,
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              borderRadius: 1,
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#E57141', fontWeight: 700 }}>
                  Top Selling Products Chart
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="quantity">By Quantity</MenuItem>
                      <MenuItem value="revenue">By Revenue</MenuItem>
                      <MenuItem value="profit">By Profit</MenuItem>
                    </Select>
                  </FormControl>
                  <Tooltip title="Refresh Data">
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => refetch()}
                      disabled={isLoading}
                      startIcon={<RefreshIcon />}
                    >
                      Refresh
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
              
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ ml: 2 }}>Loading product data...</Typography>
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Error loading product data: {error?.response?.data?.message || error?.message || 'Unknown error'}
                </Alert>
              ) : !chartData?.length ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No product data available for the selected criteria.
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow 
                        sx={{
                          backgroundColor: '#E57141',
                          '& .MuiTableCell-head': {
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            borderBottom: '2px solid #e0e0e0',
                            whiteSpace: 'nowrap',
                            padding: '8px 12px'
                          }
                        }}
                      >
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 200 }}>Product Name</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 120 }}>Category</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 120 }}>Sold</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 120 }}>Revenue</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 120 }}>Avg Rate</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 120 }}>Rank</TableCell>
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
                              padding: '8px 12px'
                            }
                          }}
                        >
                          <TableCell sx={{ color: '#333' }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {item.productName || 'N/A'}
                              </Typography>
                              {item.salesCount > 1 && (
                                <Chip size="small" label={`${item.salesCount} sales`} sx={{ mt: 0.5 }} />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: '#333' }}>
                            {item.category || 'N/A'}
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
              
              <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button 
                  variant="outlined" 
                  color="secondary"
                  startIcon={<ChartIcon />}
                  disabled={isLoading || !chartData?.length}
                >
                  Generate Chart
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary"
                  startIcon={<PdfIcon />}
                  onClick={handleExportPDF}
                  disabled={isLoading || !chartData?.length}
                >
                  Export to PDF
                </Button>
                <Button 
                  variant="outlined" 
                  color="secondary"
                  startIcon={<ExcelIcon />}
                  onClick={handleExportExcel}
                  disabled={isLoading || !chartData?.length}
                >
                  Export to Excel
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductWiseTopChart;
