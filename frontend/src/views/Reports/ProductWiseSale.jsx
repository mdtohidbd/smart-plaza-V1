import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
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
  Snackbar,
  Alert as MuiAlert,
  TablePagination,
  Chip,
  Tooltip,
  LinearProgress,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  TableSortLabel,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
  Download as ExcelIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  EmojiEvents as TrophyIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ArrowBack as ArrowBackIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import useShopRefresh from '../../hooks/useShopRefresh';



const ProductWiseSale = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');
  const [searchTerm, setSearchTerm] = useState('');
  const [saleType, setSaleType] = useState('all'); // 'all', 'wholesale', 'retail'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [orderBy, setOrderBy] = useState('totalValue');
  const [order, setOrder] = useState('desc');

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Collapsible rows state
  const [openRows, setOpenRows] = useState({});

  const toggleRow = (id) => {
    setOpenRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const { activeShop } = useAuth();

  // Fetch product-wise sales data (wholesale)
  const { data: wholesaleData, isLoading: isLoadingWholesale, refetch: refetchWholesale } = useQuery(
    ['product-wise-sales-wholesale', activeShop?._id],
    async () => {
      const response = await api.get('/api/reports/product-wise-sales', {
        params: { type: 'wholesale' }
      });
      return response.data.data || [];
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  // Fetch product-wise sales data (retail)
  const { data: retailData, isLoading: isLoadingRetail, refetch: refetchRetail } = useQuery(
    ['product-wise-sales-retail', activeShop?._id],
    async () => {
      const response = await api.get('/api/reports/product-wise-sales', {
        params: { type: 'retail' }
      });
      return response.data.data || [];
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  const isLoading = isLoadingWholesale || isLoadingRetail;

  const refetch = () => {
    refetchWholesale();
    refetchRetail();
  };

  // Automatically refresh data when shop changes
  useShopRefresh(refetch);

  // Combine and process data based on sale type
  const processedData = useMemo(() => {
    let data = [];
    
    if (saleType === 'wholesale') {
      data = wholesaleData || [];
    } else if (saleType === 'retail') {
      data = retailData || [];
    } else {
      // Combine wholesale and retail: merge by product _id
      const combined = {};
      (wholesaleData || []).forEach(item => {
        const key = item._id?.toString() || item.productName;
        if (!combined[key]) {
          combined[key] = { ...item, wholesaleQty: item.totalQuantity, retailQty: 0 };
        }
      });
      (retailData || []).forEach(item => {
        const key = item._id?.toString() || item.productName;
        if (combined[key]) {
          combined[key].totalQuantity += item.totalQuantity;
          combined[key].totalValue += item.totalValue;
          combined[key].salesCount += item.salesCount;
          combined[key].retailQty = item.totalQuantity;
          combined[key].avgRate = (combined[key].totalValue) / (combined[key].totalQuantity || 1);
        } else {
          combined[key] = { ...item, wholesaleQty: 0, retailQty: item.totalQuantity };
        }
      });
      data = Object.values(combined);
    }

    // Re-rank by totalValue descending
    data.sort((a, b) => b.totalValue - a.totalValue);
    data = data.map((item, index) => ({ ...item, rank: index + 1 }));

    return data;
  }, [wholesaleData, retailData, saleType]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set();
    processedData.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats).sort();
  }, [processedData]);

  // Summary stats
  const summary = useMemo(() => {
    const totalProducts = processedData.length;
    const totalRevenue = processedData.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const totalQtySold = processedData.reduce((sum, item) => sum + (item.totalQuantity || 0), 0);
    const totalSalesCount = processedData.reduce((sum, item) => sum + (item.salesCount || 0), 0);
    const totalCost = processedData.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    const totalProfit = processedData.reduce((sum, item) => sum + (item.profit || 0), 0);
    const topProduct = processedData[0] || null;
    const avgRevenuePerProduct = totalProducts > 0 ? totalRevenue / totalProducts : 0;

    return { totalProducts, totalRevenue, totalQtySold, totalSalesCount, totalCost, totalProfit, topProduct, avgRevenuePerProduct };
  }, [processedData]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let data = processedData;

    // Search filter
    if (searchTerm) {
      data = data.filter(item =>
        item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      data = data.filter(item => item.category === categoryFilter);
    }

    // Sort
    data = [...data].sort((a, b) => {
      const aVal = a[orderBy] || 0;
      const bVal = b[orderBy] || 0;
      if (typeof aVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return data;
  }, [processedData, searchTerm, categoryFilter, orderBy, order]);

  // Max values for progress bars
  const maxRevenue = useMemo(() => Math.max(...processedData.map(i => i.totalValue || 0), 1), [processedData]);
  const maxQty = useMemo(() => Math.max(...processedData.map(i => i.totalQuantity || 0), 1), [processedData]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/reports/export/excel', {
        params: {
          reportType: 'product-wise',
          startDate: null,
          endDate: null
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `product-wise-sales-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      showToast('Excel report downloaded successfully!', 'success');
    } catch (error) {
      console.error('Excel download error:', error);
      showToast('Failed to download Excel report. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const handleCloseToast = () => {
    setToastOpen(false);
  };

  const formatCurrency = (value) => {
    if (value >= 10000000) return `৳${(value / 10000000).toFixed(2)} Crore`;
    if (value >= 100000) return `৳${(value / 100000).toFixed(2)} Lakh`;
    if (value >= 1000) return `৳${(value / 1000).toFixed(1)}k`;
    return `৳${value?.toLocaleString() || 0}`;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { bg: 'linear-gradient(135deg, #FFD700, #FFA000)', color: '#fff', icon: '🥇' };
    if (rank === 2) return { bg: 'linear-gradient(135deg, #C0C0C0, #9E9E9E)', color: '#fff', icon: '🥈' };
    if (rank === 3) return { bg: 'linear-gradient(135deg, #CD7F32, #A0522D)', color: '#fff', icon: '🥉' };
    if (rank <= 10) return { bg: '#E8F5E9', color: '#2E7D32', icon: '' };
    return { bg: '#F5F5F5', color: '#757575', icon: '' };
  };

  const getPerformanceLevel = (item) => {
    const revenuePercent = ((item.totalValue || 0) / maxRevenue) * 100;
    if (revenuePercent >= 70) return { label: 'Top Seller', color: '#2E7D32', bg: '#E8F5E9' };
    if (revenuePercent >= 40) return { label: 'Good', color: '#ED6C02', bg: '#FFF3E0' };
    if (revenuePercent >= 15) return { label: 'Average', color: '#0288D1', bg: '#E1F5FE' };
    return { label: 'Low', color: '#D32F2F', bg: '#FFEBEE' };
  };

  return (
    <>
      
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
      <Grid container spacing={1.5}>
        {/* Header */}
        {/* Summary Cards */}
        <Grid item xs={12}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6} md={4}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #eaeef3',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea11, #764ba211)',
                  borderLeft: '4px solid #667eea',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                        Total Products
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
                        {isLoading ? <CircularProgress size={20} /> : summary.totalProducts}
                      </Typography>
                    </Box>
                    <InventoryIcon sx={{ fontSize: 36, color: '#667eea', opacity: 0.6 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #eaeef3',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #11998e11, #38ef7d11)',
                  borderLeft: '4px solid #11998e',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                        Total Revenue
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
                        {isLoading ? <CircularProgress size={20} /> : formatCurrency(summary.totalRevenue)}
                      </Typography>
                    </Box>
                    <MoneyIcon sx={{ fontSize: 36, color: '#11998e', opacity: 0.6 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #eaeef3',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #eb3349cc08, #f4551608)',
                  borderLeft: '4px solid #eb3349',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                        Total Qty Sold
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
                        {isLoading ? <CircularProgress size={20} /> : summary.totalQtySold?.toLocaleString()}
                      </Typography>
                    </Box>
                    <CartIcon sx={{ fontSize: 36, color: '#eb3349', opacity: 0.6 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>


            <Grid item xs={12} sm={6} md={4}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #eaeef3',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #F09819cc08, #FF512F08)',
                  borderLeft: '4px solid #F09819',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                        Top Product
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 700, fontFamily: '"Outfit", sans-serif', fontSize: '0.95rem', lineHeight: 1.3 }}>
                        {isLoading ? <CircularProgress size={20} /> : (summary.topProduct?.productName || 'N/A')}
                      </Typography>
                      {!isLoading && summary.topProduct && (
                        <Typography variant="caption" sx={{ color: '#F09819', fontWeight: 500 }}>
                          ৳{summary.topProduct.totalValue?.toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                    <TrophyIcon sx={{ fontSize: 36, color: '#F09819', opacity: 0.6 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #eaeef3',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #f59e0b11, #fbbf2411)',
                  borderLeft: '4px solid #f59e0b',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                        Total COGS (Cost of Goods)
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
                        {isLoading ? <CircularProgress size={20} /> : formatCurrency(summary.totalCost)}
                      </Typography>
                    </Box>
                    <MoneyIcon sx={{ fontSize: 36, color: '#f59e0b', opacity: 0.6 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #eaeef3',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #10b98111, #34d39911)',
                  borderLeft: '4px solid #10b981',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                        Total Profit
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
                        {isLoading ? <CircularProgress size={20} /> : formatCurrency(summary.totalProfit)}
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 36, color: '#10b981', opacity: 0.6 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

          </Grid>
        </Grid>

        {/* Main Table Card */}
        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid #eaeef3',
              borderRadius: '8px',
            }}
          >
            <CardContent sx={{ p: 2 }}>
              {/* Toolbar */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <TextField
                    size="small"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      minWidth: 220,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                      }
                    }}
                  />

                  <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel sx={{ fontSize: '0.85rem' }}>Sale Type</InputLabel>
                    <Select
                      value={saleType}
                      label="Sale Type"
                      onChange={(e) => { setSaleType(e.target.value); setPage(0); }}
                      sx={{ borderRadius: '8px', fontSize: '0.85rem' }}
                    >
                      <MenuItem value="all">All Sales</MenuItem>
                      <MenuItem value="wholesale">Wholesale</MenuItem>
                      <MenuItem value="retail">Retail</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel sx={{ fontSize: '0.85rem' }}>Category</InputLabel>
                    <Select
                      value={categoryFilter}
                      label="Category"
                      onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
                      sx={{ borderRadius: '8px', fontSize: '0.85rem' }}
                    >
                      <MenuItem value="all">All Categories</MenuItem>
                      {categories.map(cat => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={`${filteredData.length} products`}
                    size="small"
                    sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 500, backgroundColor: '#E8F5E9', color: '#2E7D32' }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ExcelIcon />}
                    onClick={handleExportExcel}
                    disabled={loading || filteredData.length === 0}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontFamily: '"Outfit", sans-serif',
                      borderColor: '#4CAF50',
                      color: '#4CAF50',
                      '&:hover': { borderColor: '#388E3C', backgroundColor: '#E8F5E9' }
                    }}
                  >
                    Excel
                  </Button>
                </Box>
              </Box>

              {/* Table */}
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                  <CircularProgress />
                </Box>
              ) : filteredData.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: '8px' }}>
                  No product sales data found. Try adjusting your filters.
                </Alert>
              ) : (
                <>
                  <TableContainer sx={{ maxHeight: 'calc(100vh - 420px)', borderRadius: '8px', border: '1px solid #eaeef3' }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow
                          sx={{
                            '& .MuiTableCell-head': {
                              color: '#475569',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              fontFamily: '"Outfit", sans-serif',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              borderBottom: '2px solid #42A2C2',
                              padding: '10px 12px',
                              backgroundColor: '#F8FAFC',
                              whiteSpace: 'nowrap',
                            }
                          }}
                        >
                          <TableCell sx={{ width: 50 }}>Rank</TableCell>
                          <TableCell>
                            <TableSortLabel
                              active={orderBy === 'productName'}
                              direction={orderBy === 'productName' ? order : 'asc'}
                              onClick={() => handleSort('productName')}
                            >
                              Product
                            </TableSortLabel>
                          </TableCell>
                          <TableCell>Category & Brand</TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'totalQuantity'}
                              direction={orderBy === 'totalQuantity' ? order : 'asc'}
                              onClick={() => handleSort('totalQuantity')}
                            >
                              Qty Sold
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'avgRate'}
                              direction={orderBy === 'avgRate' ? order : 'asc'}
                              onClick={() => handleSort('avgRate')}
                            >
                              Avg. Rate
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right" sx={{ minWidth: 160 }}>
                            <TableSortLabel
                              active={orderBy === 'totalValue'}
                              direction={orderBy === 'totalValue' ? order : 'asc'}
                              onClick={() => handleSort('totalValue')}
                            >
                              Revenue
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'totalCost'}
                              direction={orderBy === 'totalCost' ? order : 'asc'}
                              onClick={() => handleSort('totalCost')}
                            >
                              COGS
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'profit'}
                              direction={orderBy === 'profit' ? order : 'asc'}
                              onClick={() => handleSort('profit')}
                            >
                              Profit
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="right">
                            <TableSortLabel
                              active={orderBy === 'salesCount'}
                              direction={orderBy === 'salesCount' ? order : 'asc'}
                              onClick={() => handleSort('salesCount')}
                            >
                              Times Sold
                            </TableSortLabel>
                          </TableCell>
                          <TableCell align="center">Batches</TableCell>
                          <TableCell align="center">Performance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => {
                          const rankBadge = getRankBadge(item.rank);
                          const performance = getPerformanceLevel(item);
                          const revenuePercent = ((item.totalValue || 0) / maxRevenue) * 100;
                          const qtyPercent = ((item.totalQuantity || 0) / maxQty) * 100;

                          return (
                            <React.Fragment key={item._id || index}>
                            <TableRow
                              sx={{
                                '&:nth-of-type(odd)': { backgroundColor: '#fafbfc' },
                                '&:hover': { backgroundColor: '#eef5ff' },
                                transition: 'background-color 0.15s ease',
                                '& .MuiTableCell-root': {
                                  padding: '8px 12px',
                                  fontFamily: '"Outfit", sans-serif',
                                  fontSize: '0.82rem',
                                  borderBottom: '1px solid #f0f0f0',
                                }
                              }}
                            >
                              {/* Rank */}
                              <TableCell>
                                <Box
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: rankBadge.bg,
                                    color: rankBadge.color,
                                    fontWeight: 700,
                                    fontSize: item.rank <= 3 ? '0.9rem' : '0.75rem',
                                  }}
                                >
                                  {rankBadge.icon || `#${item.rank}`}
                                </Box>
                              </TableCell>

                              {/* Product Name & Details */}
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  {item.image ? (
                                    <Box
                                      component="img"
                                      src={item.image}
                                      alt={item.productName}
                                      sx={{ width: 40, height: 40, borderRadius: '8px', objectFit: 'cover', border: '1px solid #E2E8F0' }}
                                    />
                                  ) : (
                                    <Box sx={{ width: 40, height: 40, borderRadius: '8px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
                                      <InventoryIcon sx={{ color: '#94A3B8', fontSize: '1.2rem' }} />
                                    </Box>
                                  )}
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.82rem' }}>
                                      {item.productName || 'N/A'}
                                    </Typography>
                                    {(item.sku || item.model) && (
                                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>
                                        {item.model ? `Model: ${item.model}` : 'N/A'}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>

                              {/* Category & Brand */}
                              <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                                  <Chip
                                    label={item.category || 'Uncategorized'}
                                    size="small"
                                    sx={{
                                      fontSize: '0.65rem',
                                      height: 20,
                                      backgroundColor: '#F1F5F9',
                                      color: '#475569',
                                      fontWeight: 500,
                                    }}
                                  />
                                  {item.brand && item.brand !== 'N/A' && (
                                    <Chip
                                      label={item.brand}
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        fontSize: '0.65rem',
                                        height: 20,
                                        color: '#6366F1',
                                        borderColor: '#C7D2FE',
                                        fontWeight: 500,
                                      }}
                                    />
                                  )}
                                </Box>
                              </TableCell>

                              {/* Quantity Sold */}
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                    {item.totalQuantity?.toLocaleString() || 0}
                                  </Typography>
                                  <LinearProgress
                                    variant="determinate"
                                    value={qtyPercent}
                                    sx={{
                                      width: 60,
                                      height: 4,
                                      borderRadius: 2,
                                      mt: 0.5,
                                      backgroundColor: '#E8F5E9',
                                      '& .MuiLinearProgress-bar': {
                                        backgroundColor: '#4CAF50',
                                        borderRadius: 2,
                                      }
                                    }}
                                  />
                                </Box>
                              </TableCell>

                              {/* Avg Rate */}
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#64748b' }}>
                                  ৳{item.avgRate?.toFixed(2) || 0}
                                </Typography>
                              </TableCell>

                              {/* Revenue */}
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#42A2C2' }}>
                                    ৳{item.totalValue?.toLocaleString() || 0}
                                  </Typography>
                                  <LinearProgress
                                    variant="determinate"
                                    value={revenuePercent}
                                    sx={{
                                      width: 80,
                                      height: 4,
                                      borderRadius: 2,
                                      mt: 0.5,
                                      backgroundColor: '#E0F2F1',
                                      '& .MuiLinearProgress-bar': {
                                        backgroundColor: '#42A2C2',
                                        borderRadius: 2,
                                      }
                                    }}
                                  />
                                </Box>
                              </TableCell>

                              {/* COGS */}
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#f59e0b' }}>
                                  ৳{item.totalCost?.toLocaleString() || 0}
                                </Typography>
                              </TableCell>

                              {/* Profit */}
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 700, color: item.profit >= 0 ? '#10b981' : '#ef4444' }}>
                                  ৳{item.profit?.toLocaleString() || 0}
                                </Typography>
                              </TableCell>

                              {/* Times Sold */}
                              <TableCell align="right">
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, backgroundColor: '#F8FAFC', px: 1.5, py: 0.5, borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                                  <CartIcon sx={{ fontSize: '0.9rem', color: '#6366F1' }} />
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.85rem' }}>
                                    {item.salesCount || 0}
                                  </Typography>
                                </Box>
                              </TableCell>

                              {/* Batches Toggle */}
                              <TableCell align="center">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => toggleRow(item._id)}
                                  endIcon={openRows[item._id] ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                                  sx={{
                                    textTransform: 'none',
                                    borderRadius: '20px',
                                    fontWeight: 600,
                                    fontSize: '11px',
                                    padding: '2px 10px',
                                    color: '#334155',
                                    borderColor: '#e2e8f0',
                                    backgroundColor: '#f8fafc',
                                    '&:hover': {
                                      backgroundColor: '#f1f5f9',
                                      borderColor: '#cbd5e1'
                                    }
                                  }}
                                >
                                  {(item.batchesUsed?.length || 0)} Batches
                                </Button>
                              </TableCell>

                              {/* Performance */}
                              <TableCell align="center">
                                <Chip
                                  label={performance.label}
                                  size="small"
                                  icon={revenuePercent >= 40 ? <TrendingUpIcon sx={{ fontSize: '14px !important' }} /> : <TrendingDownIcon sx={{ fontSize: '14px !important' }} />}
                                  sx={{
                                    fontSize: '0.68rem',
                                    height: 24,
                                    backgroundColor: performance.bg,
                                    color: performance.color,
                                    fontWeight: 600,
                                    '& .MuiChip-icon': { color: performance.color },
                                  }}
                                />
                                </TableCell>
                              </TableRow>

                              {/* Collapsible Batches Row */}
                              <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                                <TableCell style={{ paddingBottom: 0, paddingTop: 0, backgroundColor: '#f8fafc' }} colSpan={11}>
                                  <Collapse in={openRows[item._id]} timeout="auto" unmountOnExit>
                                    <Box sx={{ margin: 2 }}>
                                      <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 600, color: '#475569' }}>
                                        Batches Sold
                                      </Typography>
                                      {item.batchesUsed && item.batchesUsed.length > 0 ? (
                                        <Table size="small" aria-label="batches">
                                          <TableHead>
                                            <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                                              <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.75rem' }}>Batch Number</TableCell>
                                              <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.75rem' }}>Quantity</TableCell>
                                              <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.75rem' }} align="right">Purchase Rate</TableCell>
                                              <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.75rem' }} align="right">Cost of Good</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {item.batchesUsed.map((batch, bIdx) => (
                                              <TableRow key={bIdx}>
                                                <TableCell component="th" scope="row" sx={{ fontSize: '0.8rem', color: '#334155' }}>
                                                  {batch.batchInfo?.batchNumber || batch.batchNumber || 'Unknown'}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', color: '#334155' }}>{batch.quantity}</TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.8rem', color: '#334155' }}>৳{batch.purchasePrice?.toLocaleString() || 0}</TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#475569' }}>
                                                  ৳{((batch.quantity || 0) * (batch.purchasePrice || 0)).toLocaleString()}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      ) : (
                                        <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                          No batch information available for these sales.
                                        </Typography>
                                      )}
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={filteredData.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                      '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                        fontFamily: '"Outfit", sans-serif',
                        fontSize: '0.8rem',
                      }
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Toast Notification */}
        <Snackbar
          open={toastOpen}
          autoHideDuration={6000}
          onClose={handleCloseToast}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <MuiAlert
            onClose={handleCloseToast}
            severity={toastSeverity}
            elevation={6}
            variant="filled"
          >
            {toastMessage}
          </MuiAlert>
        </Snackbar>
      </Grid>
    </>
  );
};

export default ProductWiseSale;