import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  InputAdornment,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress,
  IconButton,
  Chip,
  LinearProgress,
  TableSortLabel,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
  Download as ExcelIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  EmojiEvents as TrophyIcon,
  Visibility as EyeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import useShopRefresh from '../../hooks/useShopRefresh';


import ProductPurchaseInvoicesModal from '../../components/ProductPurchaseInvoicesModal';

const ProductWisePurchase = () => {
  const navigate = useNavigate();
  const { activeShop } = useAuth();
  
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Search and Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [orderBy, setOrderBy] = useState('totalAmount');
  const [order, setOrder] = useState('desc');
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Invoices Modal state
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProductName, setSelectedProductName] = useState('');

  // Fetch product-wise purchase report from backend
  const { data: purchasesData = [], isLoading: isReportLoading, refetch } = useQuery(
    ['product-wise-purchase', activeShop?._id],
    async () => {
      const response = await api.get('/api/reports/purchase-product-wise');
      return response.data.data || [];
    },
    {
      refetchOnWindowFocus: false,
      enabled: true
    }
  );

  // Auto-refresh on shop change
  useShopRefresh(refetch);

  // Process and sort data
  const processedData = useMemo(() => {
    let data = [...purchasesData];
    
    // Sort initially by totalAmount to assign rankings
    data.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    data = data.map((item, index) => ({ ...item, rank: index + 1 }));
    
    return data;
  }, [purchasesData]);

  // Extract unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set();
    processedData.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats).sort();
  }, [processedData]);

  // Compute summary stats
  const summary = useMemo(() => {
    const totalProducts = processedData.length;
    const totalQuantity = processedData.reduce((sum, item) => sum + (item.totalQuantity || 0), 0);
    const totalValue = processedData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const topProduct = processedData[0] || null;

    return { totalProducts, totalQuantity, totalValue, topProduct };
  }, [processedData]);

  // Filter and sort the dataset for display
  const filteredData = useMemo(() => {
    let data = processedData;

    // Search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter(item =>
        item.productName?.toLowerCase().includes(lowerSearch) ||
        item.category?.toLowerCase().includes(lowerSearch)
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

  // Max values for relative progress indicators
  const maxAmount = useMemo(() => Math.max(...processedData.map(i => i.totalAmount || 0), 1), [processedData]);
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

  const handleOpenInvoiceModal = (productId, name) => {
    setSelectedProductId(productId);
    setSelectedProductName(name);
    setInvoiceModalOpen(true);
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    
    // Add UTF-8 BOM for perfect local Excel compatibility
    let csvContent = "\uFEFF";
    csvContent += "Rank,Product Name,Category,Total Quantity,Total Value (৳),Avg. Rate (৳),Suppliers\n";
    
    filteredData.forEach(item => {
      const name = `"${(item.productName || '').replace(/"/g, '""')}"`;
      const cat = `"${(item.category || '').replace(/"/g, '""')}"`;
      csvContent += `${item.rank},${name},${cat},${item.totalQuantity},${item.totalAmount.toFixed(2)},${item.avgUnitPrice.toFixed(2)},${item.suppliers || 0}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `product_wise_purchase_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    return { bg: '#F1F5F9', color: '#64748B', icon: '' };
  };

  const handlePrintPreview = () => {
    window.print();
  };

  return (
    <Box sx={{ py: { xs: 1, sm: 2 }, backgroundColor: '#F8FAFC' }}>
      
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
        {/* Header card */}
        {/* Summary stats row */}
        <Grid item xs={12}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: '1px solid #eaeef3', borderRadius: '8px', background: 'linear-gradient(135deg, #e0f2fe, #e0f2fe33)', borderLeft: '4px solid #0EA5E9' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem', fontWeight: 600 }}>
                        Total Products
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 700, fontFamily: '"Outfit", sans-serif', mt: 0.5 }}>
                        {isReportLoading ? <CircularProgress size={20} /> : summary.totalProducts}
                      </Typography>
                    </Box>
                    <InventoryIcon sx={{ fontSize: 32, color: '#0EA5E9', opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: '1px solid #eaeef3', borderRadius: '8px', background: 'linear-gradient(135deg, #F0FDF4, #F0FDF433)', borderLeft: '4px solid #22C55E' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem', fontWeight: 600 }}>
                        Total Purchased Value
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 700, fontFamily: '"Outfit", sans-serif', mt: 0.5 }}>
                        {isReportLoading ? <CircularProgress size={20} /> : formatCurrency(summary.totalValue)}
                      </Typography>
                    </Box>
                    <MoneyIcon sx={{ fontSize: 32, color: '#22C55E', opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: '1px solid #eaeef3', borderRadius: '8px', background: 'linear-gradient(135deg, #FEF2F2, #FEF2F233)', borderLeft: '4px solid #EF4444' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem', fontWeight: 600 }}>
                        Total Qty Acquired
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 700, fontFamily: '"Outfit", sans-serif', mt: 0.5 }}>
                        {isReportLoading ? <CircularProgress size={20} /> : summary.totalQuantity.toLocaleString()}
                      </Typography>
                    </Box>
                    <CartIcon sx={{ fontSize: 32, color: '#EF4444', opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: '1px solid #eaeef3', borderRadius: '8px', background: 'linear-gradient(135deg, #FFFBEB, #FFFBEB33)', borderLeft: '4px solid #F59E0B' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ maxWidth: '75%' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem', fontWeight: 600 }}>
                        Top Acquired Product
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700, mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isReportLoading ? <CircularProgress size={16} /> : (summary.topProduct?.productName || 'N/A')}
                      </Typography>
                      {!isReportLoading && summary.topProduct && (
                        <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 600 }}>
                          ৳{summary.topProduct.totalAmount?.toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                    <TrophyIcon sx={{ fontSize: 32, color: '#F59E0B', opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Main report block */}
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
            {/* Filters and Exports bar */}
            <Grid container spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  variant="outlined"
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
                    minWidth: 200,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                    }
                  }}
                />

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
              </Grid>
              
              <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1 }}>
                <Button 
                  variant="contained" 
                  size="small"
                  startIcon={<PdfIcon />}
                  onClick={() => {
                    setActiveTab(0);
                    setPreviewOpen(true);
                  }}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    bgcolor: '#E11D48',
                    fontFamily: '"Outfit", sans-serif',
                    '&:hover': { bgcolor: '#BE123C' }
                  }}
                >
                  Preview PDF
                </Button>
                <Button 
                  variant="contained" 
                  size="small"
                  startIcon={<ExcelIcon />}
                  onClick={() => {
                    setActiveTab(1);
                    setPreviewOpen(true);
                  }}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    bgcolor: '#10B981',
                    fontFamily: '"Outfit", sans-serif',
                    '&:hover': { bgcolor: '#047857' }
                  }}
                >
                  Preview Excel
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<ExcelIcon />}
                  onClick={handleExportCSV}
                  disabled={filteredData.length === 0}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    color: '#22C55E',
                    borderColor: '#22C55E',
                    fontFamily: '"Outfit", sans-serif',
                    '&:hover': { borderColor: '#16A34A', bgcolor: '#F0FDF4' }
                  }}
                >
                  Export CSV
                </Button>
              </Grid>
            </Grid>

            {/* Table or spinner */}
            {isReportLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px' }}>
                <CircularProgress />
              </Box>
            ) : filteredData.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: '8px' }}>
                No product purchase data found. Try adjusting your search or category filters.
              </Alert>
            ) : (
              <>
                <TableContainer sx={{ border: '1px solid #eaeef3', borderRadius: '8px', mb: 1 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow
                        sx={{
                          '& .MuiTableCell-head': {
                            color: '#475569',
                            fontWeight: 600,
                            fontSize: '0.72rem',
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
                            Product Name
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">
                          <TableSortLabel
                            active={orderBy === 'totalQuantity'}
                            direction={orderBy === 'totalQuantity' ? order : 'asc'}
                            onClick={() => handleSort('totalQuantity')}
                          >
                            Total Quantity
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">
                          <TableSortLabel
                            active={orderBy === 'totalAmount'}
                            direction={orderBy === 'totalAmount' ? order : 'asc'}
                            onClick={() => handleSort('totalAmount')}
                          >
                            Total Value
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">
                          <TableSortLabel
                            active={orderBy === 'avgUnitPrice'}
                            direction={orderBy === 'avgUnitPrice' ? order : 'asc'}
                            onClick={() => handleSort('avgUnitPrice')}
                          >
                            Avg. Rate
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="center">
                          <TableSortLabel
                            active={orderBy === 'suppliers'}
                            direction={orderBy === 'suppliers' ? order : 'asc'}
                            onClick={() => handleSort('suppliers')}
                          >
                            Suppliers
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => {
                        const rankBadge = getRankBadge(item.rank);
                        const qtyPercent = ((item.totalQuantity || 0) / maxQty) * 100;
                        const amountPercent = ((item.totalAmount || 0) / maxAmount) * 100;

                        return (
                          <TableRow 
                            key={item._id || index}
                            sx={{
                              backgroundColor: index % 2 === 0 ? 'transparent' : '#f9fbfd',
                              '&:hover': {
                                backgroundColor: '#eef5ff',
                              },
                              '& .MuiTableCell-root': {
                                whiteSpace: 'nowrap',
                                padding: '8px 12px',
                                fontFamily: '"Outfit", sans-serif',
                                fontSize: '0.82rem',
                                borderBottom: '1px solid #f0f0f0'
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
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  background: rankBadge.bg,
                                  color: rankBadge.color,
                                  fontWeight: 700,
                                  fontSize: '0.78rem',
                                }}
                              >
                                {rankBadge.icon || `#${item.rank}`}
                              </Box>
                            </TableCell>

                            {/* Product Name */}
                            <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>
                              {item.productName || 'N/A'}
                            </TableCell>

                            {/* Category */}
                            <TableCell sx={{ color: '#475569' }}>
                              <Chip
                                label={item.category || 'N/A'}
                                size="small"
                                sx={{
                                  fontSize: '0.68rem',
                                  height: 20,
                                  backgroundColor: '#F1F5F9',
                                  color: '#475569',
                                  fontWeight: 500,
                                }}
                              />
                            </TableCell>

                            {/* Quantity purchased */}
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
                                    height: 3,
                                    borderRadius: 2,
                                    mt: 0.5,
                                    backgroundColor: '#E8F5E9',
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: '#22C55E',
                                      borderRadius: 2,
                                    }
                                  }}
                                />
                              </Box>
                            </TableCell>

                            {/* Total Value */}
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#42A2C2' }}>
                                  ৳{item.totalAmount?.toLocaleString() || 0}
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={amountPercent}
                                  sx={{
                                    width: 75,
                                    height: 3,
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

                            {/* Avg. Rate */}
                            <TableCell align="right" sx={{ fontWeight: 500, color: '#475569' }}>
                              ৳{item.avgUnitPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </TableCell>

                            {/* Supplier Count */}
                            <TableCell align="center" sx={{ fontWeight: 500, color: '#1e293b' }}>
                              {item.suppliers || 0}
                            </TableCell>

                            {/* Action view invoices button */}
                            <TableCell align="center">
                              <Tooltip title="View Purchase Invoices">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenInvoiceModal(item._id, item.productName)}
                                  sx={{
                                    color: '#42A2C2',
                                    bgcolor: '#E0F2F1',
                                    '&:hover': { bgcolor: '#B2DFDB' }
                                  }}
                                >
                                  <EyeIcon fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
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
          </Paper>
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog 
        open={previewOpen} 
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '60vh',
            maxHeight: '80vh',
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#F8FAFC', color: '#1e293b', fontWeight: 600, fontSize: '1.2rem', p: 2, borderBottom: '1px solid #eaeef3' }}>
          Report Print Preview
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mt: 1 }}
          >
            <Tab label="PDF Print View" />
            <Tab label="Excel Dataset View" />
          </Tabs>
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {activeTab === 0 ? (
                <Box sx={{ p: 1.5, border: '1px solid #ccc', borderRadius: 1, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="subtitle2" gutterBottom color="primary">PDF Printable Preview Layout</Typography>
                  <Paper elevation={2} sx={{ p: 3, mb: 2, bgcolor: '#fff', borderRadius: '8px' }}>
                    <Typography variant="h5" align="center" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700 }} gutterBottom>Smart Plaza BD</Typography>
                    <Typography variant="subtitle1" align="center" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 600 }} gutterBottom>Product Wise Purchase Report</Typography>
                    <Typography variant="body2" align="center" sx={{ mb: 3 }}>Generated on: {new Date().toLocaleDateString()}</Typography>
                    
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Qty Acquired</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Value</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Avg. Rate</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Suppliers</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredData.slice(0, 15).map((row, index) => (
                            <TableRow key={row._id || index}>
                              <TableCell>#{row.rank}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{row.productName}</TableCell>
                              <TableCell>{row.category}</TableCell>
                              <TableCell align="right">{row.totalQuantity}</TableCell>
                              <TableCell align="right">৳{row.totalAmount?.toLocaleString()}</TableCell>
                              <TableCell align="right">৳{row.avgUnitPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell align="center">{row.suppliers || 0}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                  <Typography variant="caption" color="textSecondary">
                    * Showing top 15 records in the print layout view. Use system Print to print all records.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ p: 1.5, border: '1px solid #ccc', borderRadius: 1, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="subtitle2" gutterBottom color="secondary">Excel Dataset Grid Preview</Typography>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: '#fff', borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 1 }}>Sheet: Product Wise Purchase Report</Typography>
                    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell>Rank</TableCell>
                            <TableCell>Product Name</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell align="right">Qty</TableCell>
                            <TableCell align="right">Value (৳)</TableCell>
                            <TableCell align="right">Avg. Rate (৳)</TableCell>
                            <TableCell align="center">Unique Suppliers</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredData.slice(0, 10).map((row, index) => (
                            <TableRow key={row._id || index}>
                              <TableCell>{row.rank}</TableCell>
                              <TableCell>{row.productName}</TableCell>
                              <TableCell>{row.category}</TableCell>
                              <TableCell align="right">{row.totalQuantity}</TableCell>
                              <TableCell align="right">{row.totalAmount}</TableCell>
                              <TableCell align="right">{row.avgUnitPrice?.toFixed(2)}</TableCell>
                              <TableCell align="center">{row.suppliers || 0}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    This is a preview grid representation of the spreadsheet generated.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eaeef3', bgcolor: '#F8FAFC' }}>
          <Button onClick={() => setPreviewOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color={activeTab === 0 ? "primary" : "success"}
            startIcon={activeTab === 0 ? <PdfIcon /> : <ExcelIcon />}
            onClick={() => {
              if (activeTab === 0) {
                handlePrintPreview();
              } else {
                handleExportCSV();
              }
              setPreviewOpen(false);
            }}
          >
            {activeTab === 0 ? 'Print PDF' : 'Download Excel (CSV)'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoices List and Detailed viewer Modal */}
      <ProductPurchaseInvoicesModal
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        productId={selectedProductId}
        productName={selectedProductName}
      />
    </Box>
  );
};

export default ProductWisePurchase;