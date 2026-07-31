import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Button,
  Chip,
  Rating,
  IconButton,
  TextField,
  Tooltip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Divider,
  Paper,
  Collapse,
  Snackbar,
  Alert,
  Slider,
  Dialog,
  DialogContent,
  DialogTitle,
  Skeleton
} from '@mui/material';
import { Search, FilterList, ShoppingCart, RemoveRedEye, ExpandLess, ExpandMore, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import EcommerceLayout from '../../ecommerce/layout/EcommerceLayout';
import { getPublicApiBase } from '../../utils/publicApi';
import { cloudCard } from '../../utils/cloudinaryUtils';

const EcommerceProducts = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') ? searchParams.get('brand').split(',') : []);
  const [sortBy, setSortBy] = useState('');
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [expandedCats, setExpandedCats] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      const selectedCat = categories.find(c => c._id === selectedCategory);
      if (selectedCat) {
        const parentId = selectedCat.parent?._id || selectedCat.parent;
        if (parentId) {
          setExpandedCats(prev => ({ ...prev, [parentId.toString()]: true }));
        }
      }
    }
  }, [selectedCategory, categories]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      });

      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedBrand.length > 0) params.append('brand', selectedBrand.join(','));
      if (sortBy) params.append('sortBy', sortBy);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (inStockOnly) params.append('inStock', 'true');

      const base = getPublicApiBase();
      const response = await axios.get(`${base}/products?${params}`);

      setProducts(response.data.data || []);
      setTotalProducts(
        typeof response.data.total === 'number'
          ? response.data.total
          : response.data.count || response.data.data?.length || 0
      );
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${getPublicApiBase()}/categories`);
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await axios.get(`${getPublicApiBase()}/brands`);
      setBrands(response.data.data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrands([]);
    }
  };

  useEffect(() => {
    const cat = searchParams.get('category') || '';
    const q = searchParams.get('search') || '';
    const br = searchParams.get('brand') || '';
    setSelectedCategory(cat);
    setSearchTerm(q);
    setSearchInput(q);
    setSelectedBrand(br ? br.split(",") : []);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, [page, selectedCategory, selectedBrand, sortBy, searchTerm, inStockOnly]);

  const handleAddToCart = (product) => {
    if (!product || !product._id) {
      console.error('Invalid product:', product);
      setSnackbar({ open: true, message: 'Unable to add product to cart. Please try again.', severity: 'error' });
      return;
    }
    
    const cart = JSON.parse(localStorage.getItem('ecommerceCart') || '[]');
    // Check if product already in cart
    const existingIndex = cart.findIndex(item => (item.product?._id || item._id) === product._id);
    
    if (existingIndex >= 0) {
      cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
    } else {
      cart.push({ product, quantity: 1 });
    }
    
    localStorage.setItem('ecommerceCart', JSON.stringify(cart));
    
    // Dispatch storage event to update header cart count
    window.dispatchEvent(new Event('storage'));
    
    // Auto open the cart drawer
    window.dispatchEvent(new Event('open-cart-drawer'));
    
    setSnackbar({ open: true, message: 'Product added to cart!', severity: 'success' });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchInput.trim();
    setSearchTerm(q);
    setPage(1);
  };

  return (
    <EcommerceLayout>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
        <Box sx={{ py: 2 }} />

        <Container maxWidth="xl">
          <Grid container spacing={4}>
            {/* Desktop Sidebar Filters */}
            <Grid item xs={12} md={3} lg={2.5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ position: 'sticky', top: 100 }}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3.5, 
                    borderRadius: 1, 
                    bgcolor: 'background.paper', 
                    border: (theme) => `1px solid ${theme.palette.divider}`
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: 'text.primary', 
                        fontWeight: 700, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5 
                      }}
                    >
                      <FilterList fontSize="small" sx={{ color: 'primary.main' }} /> Filters
                    </Typography>

                    <Button
                      size="small"
                      variant="text"
                      onClick={() => {
                        setSearchInput('');
                        setSearchTerm('');
                        setSelectedCategory('');
                        setSelectedBrand([]);
                        setInStockOnly(false);
                        setPage(1);
                        setSearchParams({});
                      }}
                      sx={{
                        color: 'text.secondary',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { color: 'error.main', bgcolor: 'transparent' }
                      }}
                    >
                      Clear All
                    </Button>
                  </Box>
                  
                  {/* BRAND FILTER */}
                  <Box sx={{ mb: 4 }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        color: 'text.primary', 
                        fontWeight: 800, 
                        mb: 2, 
                        textTransform: 'uppercase', 
                        fontSize: '0.75rem', 
                        letterSpacing: '0.05em' 
                      }}
                    >
                      Brand
                    </Typography>
                    <List disablePadding>
                      {brands.map((brand) => (
                        <ListItem 
                          key={brand._id}
                          disablePadding
                          sx={{ mb: 0.5 }}
                        >
                          <Box 
                            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%' }}
                            onClick={() => {
                              setSelectedBrand(prev => {
                                if (prev.includes(brand._id)) return prev.filter(id => id !== brand._id);
                                return [...prev, brand._id];
                              });
                              setPage(1);
                            }}
                          >
                            <Checkbox 
                              checked={selectedBrand.includes(brand._id)}
                              size="small"
                              sx={{ 
                                p: 0.5, mr: 1, 
                                color: 'text.disabled',
                                '&.Mui-checked': { color: '#006c48' }
                              }}
                            />
                            <ListItemText 
                              primary={`${brand.name}${brand.productCount !== undefined ? ` (${brand.productCount})` : ``}`} 
                              primaryTypographyProps={{ fontSize: '0.85rem', color: 'text.secondary' }} 
                            />
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  {/* PRICE RANGE */}
                  <Box sx={{ mb: 4 }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        color: 'text.primary', 
                        fontWeight: 800, 
                        mb: 2, 
                        textTransform: 'uppercase', 
                        fontSize: '0.75rem', 
                        letterSpacing: '0.05em' 
                      }}
                    >
                      Price Range (Tk)
                    </Typography>
                    <Slider
                      value={priceRange}
                      onChange={(e, newValue) => setPriceRange(newValue)}
                      valueLabelDisplay="auto"
                      min={0}
                      max={300000}
                      sx={{ 
                        color: '#006c48',
                        '& .MuiSlider-thumb': {
                          height: 16,
                          width: 16,
                        }
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">0</Typography>
                      <Typography variant="body2" color="text.secondary">300,000+</Typography>
                    </Box>
                  </Box>


                </Paper>
              </Box>
            </Grid>

            {/* Products Grid */}
            <Grid item xs={12} md={9} lg={9.5}>
              {loading ? (
                <Grid container spacing={{ xs: 1.5, md: 4 }}>
                  {[...Array(12)].map((_, index) => (
                    <Grid item xs={6} sm={6} lg={4} xl={3} key={index}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: { xs: '12px', md: '16px' }, border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
                        <Skeleton variant="rectangular" sx={{ pt: '100%' }} />
                        <CardContent sx={{ p: { xs: 1.2, md: 3 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                          <Skeleton variant="text" width="60%" sx={{ fontSize: { xs: '0.55rem', md: '0.7rem' }, mb: 0.5 }} />
                          <Skeleton variant="text" width="100%" sx={{ fontSize: { xs: '0.78rem', md: '1rem' } }} />
                          <Skeleton variant="text" width="80%" sx={{ fontSize: { xs: '0.78rem', md: '1rem' }, mb: 1 }} />
                          <Skeleton variant="text" width="30%" sx={{ fontSize: { xs: '0.65rem', md: '0.8rem' }, mb: { xs: 0.8, md: 1.5 } }} />
                          <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pt: { xs: 0.5, md: 0 } }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                              <Skeleton variant="text" width="50%" sx={{ fontSize: { xs: '0.95rem', md: '1.25rem' } }} />
                              <Skeleton variant="text" width="30%" sx={{ fontSize: { xs: '0.68rem', md: '0.9rem' }, mt: 0.2 }} />
                            </Box>
                          </Box>
                          <Skeleton variant="rounded" width="100%" height={36} sx={{ mt: 1.5, borderRadius: '8px' }} />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : products.length === 0 ? (
                <Paper 
                  sx={{ 
                    textAlign: 'center', 
                    py: 15, 
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Search sx={{ fontSize: 72, color: 'text.disabled', mb: 3 }} />
                  <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 700, mb: 1.5 }}>
                    No products found
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', mb: 5 }}>
                    Try adjusting your search or filters to find what you're looking for.
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      borderRadius: 1, 
                      bgcolor: 'primary.main',
                      px: 5,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 700,
                      boxShadow: 'none',
                      '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' }
                    }}
                    onClick={() => {
                      setSearchInput('');
                      setSearchTerm('');
                      setSelectedCategory('');
                      setSelectedBrand([]);
                      setInStockOnly(false);
                      setPage(1);
                      setSearchParams({});
                    }}
                  >
                    Reset Filters
                  </Button>
                </Paper>
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 2 }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      Showing <strong style={{ color: 'text.primary' }}>{totalProducts.toLocaleString()}</strong> products
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Button
                        onClick={() => setMobileFilterOpen(true)}
                        sx={{ 
                          display: { xs: 'flex', md: 'none' },
                          borderRadius: 1,
                          color: 'text.primary',
                          borderColor: 'divider',
                          minWidth: 'auto',
                          px: 2,
                          py: 0.5,
                          border: '1px solid',
                        }}
                        startIcon={<FilterList />}
                      >
                        Filters
                      </Button>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary', fontSize: '0.85rem' }}>Sort:</Typography>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value={sortBy}
                            onChange={(e) => {
                              setSortBy(e.target.value);
                              setPage(1);
                            }}
                            displayEmpty
                            variant="standard"
                            disableUnderline
                            sx={{ 
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              color: 'text.primary',
                              '& .MuiSelect-select': { py: 0.5, pr: 3 }
                            }}
                          >
                            <MenuItem value="">Newest Arrivals</MenuItem>
                            <MenuItem value="price_asc">Price: Low to High</MenuItem>
                            <MenuItem value="price_desc">Price: High to Low</MenuItem>
                            <MenuItem value="name_asc">Name: A to Z</MenuItem>
                            <MenuItem value="rating">Highest Rated</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>
                  </Box>
                  <Grid container spacing={{ xs: 1.5, md: 4 }}>
                    {(() => {
                      const sortedProducts = searchTerm.trim() ? [...products].sort((a, b) => {
                        const term = searchTerm.toLowerCase();
                        const aStarts = (a.name || '').toLowerCase().startsWith(term) ||
                                        (a.model || a.sku || '').toLowerCase().startsWith(term);
                        const bStarts = (b.name || '').toLowerCase().startsWith(term) ||
                                        (b.model || b.sku || '').toLowerCase().startsWith(term);
                        if (aStarts && !bStarts) return -1;
                        if (!aStarts && bStarts) return 1;
                        return 0;
                      }) : products;
                      
                      return sortedProducts.map((product) => (
                        <Grid item xs={6} sm={6} lg={4} xl={3} key={product._id}>
                        <Card 
                          onClick={() => navigate(`/shop/products/${product._id}`)}
                          sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column',
                            backgroundColor: 'background.paper',
                            border: (theme) => `1px solid ${theme.palette.divider}`,
                            borderRadius: { xs: '12px', md: '16px' },
                            overflow: 'hidden',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                            cursor: 'pointer',
                            '&:hover': {
                              borderColor: 'primary.main',
                              boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
                              transform: { md: 'translateY(-4px)' },
                              '& .quick-action-btns': {
                                opacity: 1,
                                transform: 'translateY(0)'
                              },
                              '& .product-image': {
                                transform: { md: 'scale(1.08)' }
                              }
                            }
                          }}
                        >
                          {/* Image Section */}
                          <Box 
                            sx={{ 
                              position: 'relative', 
                              pt: '100%',
                              backgroundColor: '#FFFFFF',
                              borderBottom: '1px solid #F1F5F9',
                              overflow: 'hidden'
                            }}
                          >
                            <CardMedia
                              component="img"
                              image={
                                cloudCard(
                                  (product.images && Array.isArray(product.images) && product.images.length > 0 && product.images[0] && (typeof product.images[0] === 'string' ? product.images[0].trim() : product.images[0]?.url?.trim())) ||
                                  (product.image && typeof product.image === 'string' && product.image.trim() ? product.image : null) ||
                                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23f1f5f9"/%3E%3Ctext x="50%25" y="45%25" dominant-baseline="middle" text-anchor="middle" font-size="48"%3E📷%3C/text%3E%3Ctext x="50%25" y="58%25" dominant-baseline="middle" text-anchor="middle" font-family="Inter,Arial" font-size="14" fill="%2394a3b8"%3ENo Image%3C/text%3E%3C/svg%3E'
                                )
                              }
                              alt={product.name}
                              className="product-image"
                              sx={{ 
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                padding: { xs: '0.4rem', md: '1.5rem' },
                                objectFit: 'contain', 
                                mixBlendMode: 'normal',
                                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                            />
                            
                            {/* Badges */}
                            <Box sx={{ position: 'absolute', top: { xs: 8, md: 20 }, right: { xs: 8, md: 20 }, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {product.cuttedPrice && product.cuttedPrice > product.price && (
                                <Box sx={{ 
                                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', 
                                  color: '#fff', 
                                  px: { xs: 0.8, md: 1.2 }, 
                                  py: 0.4, 
                                  borderRadius: '6px', 
                                  fontWeight: 800, 
                                  fontSize: { xs: '0.55rem', md: '0.7rem' },
                                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.25)'
                                }}>
                                  {Math.round(((product.cuttedPrice - product.price) / product.cuttedPrice) * 100)}% OFF
                                </Box>
                              )}
                            </Box>
 
                            {/* Quick Action Buttons on Hover (Desktop Only) */}
                            <Box 
                              className="quick-action-btns"
                              sx={{ 
                                position: 'absolute', 
                                bottom: 20, 
                                left: 0, 
                                right: 0, 
                                display: { xs: 'none', md: 'flex' }, 
                                justifyContent: 'center', 
                                gap: 1.5,
                                opacity: 0,
                                transform: 'translateY(20px)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                zIndex: 2
                              }}
                            >
                              <IconButton 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(product);
                                }}
                                disabled={false}
                                sx={{ 
                                  bgcolor: 'primary.main', 
                                  color: '#fff',
                                  width: 44,
                                  height: 44,
                                  boxShadow: 'none',
                                  '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.1)' },
                                  '&:disabled': { bgcolor: 'action.disabledBackground', color: 'text.disabled', boxShadow: 'none' }
                                }}
                              >
                                <ShoppingCart fontSize="small" />
                              </IconButton>
                              <IconButton 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickViewProduct(product);
                                  setQuickViewOpen(true);
                                }}
                                sx={{ 
                                  bgcolor: 'action.hover', 
                                  color: 'text.primary',
                                  width: 44,
                                  height: 44,
                                  border: (theme) => `1px solid ${theme.palette.divider}`,
                                  '&:hover': { bgcolor: 'background.default', transform: 'scale(1.1)' }
                                }}
                              >
                                <RemoveRedEye fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                          
                          <CardContent sx={{ p: { xs: 1.2, md: 3 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                color: 'primary.main', 
                                fontWeight: 700, 
                                textTransform: 'uppercase', 
                                fontSize: { xs: '0.55rem', md: '0.7rem' }, 
                                letterSpacing: '0.1em', 
                                mb: 0.5 
                              }}
                            >
                              {product.brand?.name ? `${product.brand.name} | ${product.category?.name}` : (product.category?.name || 'Electronics')}
                            </Typography>
                            
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                color: 'text.primary', 
                                fontWeight: 700, 
                                fontSize: { xs: '0.78rem', md: '1rem' }, 
                                lineHeight: 1.3,
                                mb: 1,
                                height: '2.6em',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                '&:hover': { color: 'primary.main' }
                              }}
                            >
                              {product.name}
                            </Typography>
 
                            {((product.colors && product.colors.length > 0) || product.color) && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                {product.colors && product.colors.length > 0 ? (
                                  product.colors.slice(0, 5).map((col, idx) => (
                                    <Tooltip key={idx} title={col.name}>
                                      <Box
                                        sx={{
                                          width: 10,
                                          height: 10,
                                          borderRadius: '50%',
                                          bgcolor: col.code || '#14B8A6',
                                          border: (col.code === '#FFFFFF' || col.code === '#ffffff') ? '1px solid #CBD5E1' : '1px solid rgba(0,0,0,0.1)',
                                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                        }}
                                      />
                                    </Tooltip>
                                  ))
                                ) : (
                                  <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#64748B' }}>
                                    Color: {product.color}
                                  </Typography>
                                )}
                              </Box>
                            )}

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 0.8, md: 1.5 } }}>
                              <Rating value={4.5} precision={0.5} size="small" readOnly sx={{ color: '#F59E0B', fontSize: { xs: '0.7rem', md: '1rem' } }} />
                              <Typography sx={{ ml: 0.5, color: 'text.secondary', fontSize: { xs: '0.65rem', md: '0.8rem' }, fontWeight: 600 }}>(12)</Typography>
                            </Box>
 
                            <Box 
                              sx={{ 
                                mt: 'auto', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                width: '100%',
                                pt: { xs: 0.5, md: 0 }
                              }}
                            >
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <Typography sx={{ color: 'text.primary', fontWeight: 800, fontSize: { xs: '0.95rem', md: '1.25rem' }, lineHeight: 1.1 }}>
                                  ৳{product.price?.toLocaleString()}
                                </Typography>
                                {product.cuttedPrice && product.cuttedPrice > product.price && (
                                  <Typography 
                                    sx={{ 
                                      color: 'text.secondary', 
                                      textDecoration: 'line-through', 
                                      fontSize: { xs: '0.68rem', md: '0.9rem' },
                                      fontWeight: 500,
                                      lineHeight: 1,
                                      mt: 0.2
                                    }}
                                  >
                                    ৳{product.cuttedPrice?.toLocaleString()}
                                  </Typography>
                                )}
                              </Box>
                            </Box>

                            <Button 
                              fullWidth 
                              variant="contained" 
                              size="small"
                              startIcon={<ShoppingCart sx={{ fontSize: { xs: '0.75rem !important', md: '0.9rem !important' } }} />}
                              onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                              disabled={false}
                              sx={{
                                mt: 1.5,
                                bgcolor: '#14B8A6', color: '#FFFFFF', fontFamily: 'Inter, sans-serif',
                                fontSize: { xs: '0.68rem', md: '0.82rem' }, fontWeight: 700,
                                borderRadius: '8px', textTransform: 'none',
                                py: { xs: 0.5, md: 1 }, boxShadow: 'none',
                                background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                                '&:hover': { background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)', boxShadow: '0 4px 14px rgba(20, 184, 166, 0.35)' },
                                '&:disabled': { bgcolor: '#F1F5F9', color: '#94A3B8', border: '1px solid #E2E8F0', background: 'none' },
                                transition: 'all 0.25s ease',
                              }}
                            >
                              Add to Cart
                            </Button>
                          </CardContent>
                          </Card>
                        </Grid>
                      ));
                    })()}
                  </Grid>

                  {/* Pagination */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                    <Pagination
                      count={Math.max(1, Math.ceil(totalProducts / limit) || 1)}
                      page={page}
                      onChange={(e, v) => {
                        setPage(v);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      sx={{
                        '& .MuiPaginationItem-root': {
                          color: 'text.secondary',
                          borderRadius: 1,
                          fontWeight: 700,
                          px: 2,
                          '&:hover': { bgcolor: 'action.hover' },
                          '&.Mui-selected': {
                            bgcolor: 'primary.main',
                            color: '#fff',
                            boxShadow: 'none'
                          }
                        }
                      }}
                    />
                  </Box>
                </>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="right"
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        PaperProps={{ sx: { width: '85%', maxWidth: 320, borderRadius: '24px 0 0 24px', bgcolor: 'background.paper' } }}
      >
        <Box sx={{ p: 3.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h5" sx={{ color: '#1E293B', fontWeight: 800 }}>Filters</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  setSearchInput('');
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedBrand([]);
                  setInStockOnly(false);
                  setPage(1);
                  setSearchParams({});
                }}
                sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600, mr: 1 }}
              >
                Clear All
              </Button>
              <IconButton onClick={() => setMobileFilterOpen(false)} sx={{ color: '#94A3B8' }}><Search /></IconButton>
            </Box>
          </Box>
          
          <Divider sx={{ my: 3, borderColor: '#E2E8F0' }} />
          
          {/* BRAND FILTER */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'text.primary', 
                fontWeight: 800, 
                mb: 2, 
                textTransform: 'uppercase', 
                fontSize: '0.75rem', 
                letterSpacing: '0.05em' 
              }}
            >
              Brand
            </Typography>
            <List disablePadding>
              {brands.map((brand) => (
                <ListItem 
                  key={brand._id}
                  disablePadding
                  sx={{ mb: 0.5 }}
                >
                  <Box 
                    sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%' }}
                    onClick={() => {
                      setSelectedBrand(prev => {
                        if (prev.includes(brand._id)) return prev.filter(id => id !== brand._id);
                        return [...prev, brand._id];
                      });
                      setPage(1);
                    }}
                  >
                    <Checkbox 
                      checked={selectedBrand.includes(brand._id)}
                      size="small"
                      sx={{ 
                        p: 0.5, mr: 1, 
                        color: 'text.disabled',
                        '&.Mui-checked': { color: '#006c48' }
                      }}
                    />
                    <ListItemText 
                      primary={`${brand.name}${brand.productCount !== undefined ? ` (${brand.productCount})` : ``}`} 
                      primaryTypographyProps={{ fontSize: '0.85rem', color: 'text.secondary' }} 
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Box>

          {/* PRICE RANGE */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'text.primary', 
                fontWeight: 800, 
                mb: 2, 
                textTransform: 'uppercase', 
                fontSize: '0.75rem', 
                letterSpacing: '0.05em' 
              }}
            >
              Price Range (Tk)
            </Typography>
            <Slider
              value={priceRange}
              onChange={(e, newValue) => setPriceRange(newValue)}
              valueLabelDisplay="auto"
              min={0}
              max={300000}
              sx={{ 
                color: '#006c48',
                '& .MuiSlider-thumb': {
                  height: 16,
                  width: 16,
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">0</Typography>
              <Typography variant="body2" color="text.secondary">300,000+</Typography>
            </Box>
          </Box>



          <Divider sx={{ my: 4, borderColor: '#E2E8F0' }} />
          


          <Button
            variant="contained"
            fullWidth
            sx={{ 
              mt: 6, 
              borderRadius: '16px', 
              py: 2, 
              fontWeight: 800,
              bgcolor: '#6366F1',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
              textTransform: 'none'
            }}
            onClick={() => {
              setMobileFilterOpen(false);
              setPage(1);
            }}
          >
            Apply Filters
          </Button>
        </Box>
      </Drawer>

      {/* Quick View Modal */}
      <Dialog 
        open={quickViewOpen} 
        onClose={() => setQuickViewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {quickViewProduct && (
          <Box sx={{ position: 'relative' }}>
            <IconButton 
              onClick={() => setQuickViewOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1, bgcolor: 'rgba(255,255,255,0.8)' }}
            >
              <CloseIcon />
            </IconButton>
            <Grid container>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 4, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
                  <Box 
                    component="img" 
                    src={
                      cloudCard(
                        (quickViewProduct.images && Array.isArray(quickViewProduct.images) && quickViewProduct.images.length > 0 && quickViewProduct.images[0] && (typeof quickViewProduct.images[0] === 'string' ? quickViewProduct.images[0].trim() : quickViewProduct.images[0]?.url?.trim())) ||
                        (quickViewProduct.image && typeof quickViewProduct.image === 'string' && quickViewProduct.image.trim() ? quickViewProduct.image : null) ||
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23f1f5f9"/%3E%3Ctext x="50%25" y="45%25" dominant-baseline="middle" text-anchor="middle" font-size="48"%3E📷%3C/text%3E%3Ctext x="50%25" y="58%25" dominant-baseline="middle" text-anchor="middle" font-family="Inter,Arial" font-size="14" fill="%2394a3b8"%3ENo Image%3C/text%3E%3C/svg%3E'
                      )
                    } 
                    sx={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }} 
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="overline" color="primary.main" fontWeight={700}>
                    {quickViewProduct.brand?.name || quickViewProduct.category?.name}
                  </Typography>
                  <Typography variant="h5" fontWeight={800} gutterBottom sx={{ mt: 1 }}>
                    {quickViewProduct.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Rating value={quickViewProduct.rating || 5} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary">({quickViewProduct.numReviews || 0} reviews)</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, mb: 3 }}>
                    <Typography variant="h4" color="text.primary" fontWeight={800}>
                      ৳{quickViewProduct.price?.toLocaleString()}
                    </Typography>
                    {quickViewProduct.cuttedPrice > quickViewProduct.price && (
                      <Typography variant="h6" color="text.secondary" sx={{ textDecoration: 'line-through', fontWeight: 500, mb: 0.5 }}>
                        ৳{quickViewProduct.cuttedPrice?.toLocaleString()}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ mb: 4, minHeight: 60 }}>
                    {quickViewProduct.description && quickViewProduct.description.replace(/<[^>]+>/g, '').trim().length > 0 ? (
                      <Typography variant="body1" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {quickViewProduct.description.replace(/<[^>]+>/g, '')}
                      </Typography>
                    ) : quickViewProduct.highlights && quickViewProduct.highlights.length > 0 ? (
                      <Box component="ul" sx={{ m: 0, pl: 2, color: 'text.secondary', typography: 'body2' }}>
                        {quickViewProduct.highlights.slice(0, 3).map((hl, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{hl}</li>
                        ))}
                      </Box>
                    ) : quickViewProduct.specifications && quickViewProduct.specifications.length > 0 && quickViewProduct.specifications.some(c => c.items && c.items.length > 0) ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        {quickViewProduct.specifications.flatMap(cat => cat.items || []).slice(0, 3).map((spec, i) => (
                          <Typography key={i} variant="body2" color="text.secondary" sx={{ display: 'flex', gap: 1 }}>
                            <Box component="span" fontWeight={600}>{spec.label}:</Box>
                            <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{spec.value}</Box>
                          </Typography>
                        ))}
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        {quickViewProduct.model && (
                          <Typography variant="body2" color="text.secondary">
                            <Box component="span" fontWeight={600}>Model:</Box> {quickViewProduct.model}
                          </Typography>
                        )}
                        {quickViewProduct.warrantyPeriod && (
                          <Typography variant="body2" color="text.secondary">
                            <Box component="span" fontWeight={600}>Warranty:</Box> {quickViewProduct.warrantyPeriod}
                          </Typography>
                        )}
                        {!quickViewProduct.model && !quickViewProduct.warrantyPeriod && (
                          <Typography variant="body1" color="text.secondary">
                            No description available for this product.
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>

                  <Button 
                    variant="contained" 
                    fullWidth 
                    size="large"
                    startIcon={<ShoppingCart />}
                    onClick={() => {
                      handleAddToCart(quickViewProduct);
                      setQuickViewOpen(false);
                    }}
                    sx={{ 
                      py: 1.5, 
                      borderRadius: 2,
                      fontWeight: 700,
                      boxShadow: '0 8px 16px rgba(0, 108, 72, 0.2)',
                      '&:hover': { boxShadow: '0 12px 20px rgba(0, 108, 72, 0.3)' }
                    }}
                  >
                    Add to Cart
                  </Button>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    size="large"
                    onClick={() => {
                      navigate(`/shop/products/${quickViewProduct._id}`);
                      setQuickViewOpen(false);
                    }}
                    sx={{ 
                      mt: 2,
                      py: 1.5, 
                      borderRadius: 2,
                      fontWeight: 700
                    }}
                  >
                    View Full Details
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: '100%',
            borderRadius: '12px',
            fontWeight: 600,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            ...(snackbar.severity === 'success' && {
              bgcolor: '#14B8A6',
            }),
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </EcommerceLayout>
  );
};

export default EcommerceProducts;
