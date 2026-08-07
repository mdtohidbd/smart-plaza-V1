import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Box,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  IconButton,
  TextField,
  Paper,
  Chip,
  Rating,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  LinearProgress,
  Avatar,
  Stack,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  QuestionAnswer as QuestionIcon,
  ChevronRight as ChevronRightIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import axios from 'axios';
import { getPublicApiBase } from '../../utils/publicApi';
import EcommerceLayout from '../../ecommerce/layout/EcommerceLayout';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageAnimKey, setImageAnimKey] = useState(0); // triggers slide animation
  const [banners, setBanners] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showStickyNav, setShowStickyNav] = useState(false);

  // Change image with slide animation
  const handleImageChange = (idx) => {
    if (idx === selectedImage) return;
    setSelectedImage(idx);
    setImageAnimKey(prev => prev + 1); // bump key to re-trigger animation
  };

  // Section Refs for scrolling
  const specsRef = useRef(null);
  const featureRef = useRef(null);
  const descRef = useRef(null);
  const quesRef = useRef(null);
  const revsRef = useRef(null);



  // Question forms and submission states
  const [questionForm, setQuestionForm] = useState({ name: '', email: '', queryText: '' });
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  // Review forms and submission states
  const [reviewForm, setReviewForm] = useState({ name: '', email: '', rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Fetch product details
  const { data: product, isLoading, isError } = useQuery(
    ['public-product', id],
    async () => {
      const response = await axios.get(`${getPublicApiBase()}/products/${id}`);
      return response.data.data;
    },
    { refetchOnWindowFocus: false, retry: 1 }
  );

  const displayFeatures = product?.features || [];
  const hasFeatures = displayFeatures.length > 0;

  const tabsConfig = [
    { label: 'Specification', ref: specsRef },
    { label: 'Feature', ref: featureRef },
    { label: 'Description', ref: descRef },
    { label: 'Questions', ref: quesRef },
    { label: 'Reviews', ref: revsRef }
  ];

  const scrollToSection = (index) => {
    setActiveTab(index);
    const target = tabsConfig[index]?.ref?.current;
    if (target) {
      window.scrollTo({
        top: target.offsetTop - 100, // Offset for sticky header/tabs
        behavior: 'smooth'
      });
    }
  };


  // Dynamic SEO Title and Metadata updates & Color Selection Initialization
  useEffect(() => {
    if (product) {
      document.title = product.metaTitle || `${product.name} - DemoERP`;
      
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', product.metaDescription || product.description || `Buy ${product.name} at DemoERP.`);

      // Preselect first color option
      if (product.colors && product.colors.length > 0) {
        setSelectedColor(product.colors[0]);
      } else if (product.color) {
        setSelectedColor({ name: product.color, code: '#14B8A6' });
      }
    }
  }, [product]);

  // Fetch contextually targeted banners for sidebar
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const categoryId = product?.category?._id || product?.category;
        const res = await axios.get(`${getPublicApiBase()}/banners?productId=${id}&categoryId=${categoryId || ''}`);
        if (res.data.success) setBanners(res.data.data);
      } catch (error) {
        console.error('Error fetching banners:', error);
      }
    };
    if (product) {
      fetchBanners();
    }
  }, [product, id]);

  // Fetch live approved reviews & aggregate statistics
  const { data: reviewsData, refetch: refetchReviews } = useQuery(
    ['product-reviews', id],
    async () => {
      const response = await axios.get(`${getPublicApiBase()}/products/${id}/reviews`);
      return response.data;
    },
    { refetchOnWindowFocus: false }
  );

  const reviewsList = reviewsData?.data || [];
  const reviewsStats = reviewsData?.stats ? { averageRating: reviewsData.stats.averageRating, numOfReviews: reviewsData.stats.totalReviews || 0 } : { averageRating: 0, numOfReviews: 0 };
  const ratingBreakdown = reviewsData?.stats?.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  // Fetch live Q&A queries
  const { data: questionsData, refetch: refetchQuestions } = useQuery(
    ['product-questions', id],
    async () => {
      const response = await axios.get(`${getPublicApiBase()}/products/${id}/questions`);
      return response.data.data;
    },
    { refetchOnWindowFocus: false }
  );
  
  const questionsList = questionsData || [];

    // No mock features fallback to avoid showing default features when none are uploaded

  // Show/Hide sticky sub-nav based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 600) {
        setShowStickyNav(true);
      } else {
        setShowStickyNav(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const animatedElements = document.querySelectorAll('.scroll-animate');
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [product, displayFeatures]);

  // Fetch smart related products (limits to exactly 4 in the backend)
  const { data: relatedProducts = [] } = useQuery(
    ['related-products', id],
    async () => {
      const response = await axios.get(`${getPublicApiBase()}/products/${id}/related`);
      return response.data.data;
    },
    { refetchOnWindowFocus: false, enabled: !!product }
  );

  // Dynamic specifications configuration
  const specificationsList = (product?.specifications && product.specifications.length > 0)
    ? product.specifications
    : [
        {
          category: 'General',
          items: [
            { label: 'Brand', value: product?.brand?.name || 'DemoERP' },
            { label: 'Supplier', value: product?.supplier?.name || 'N/A' },
            { label: 'Model', value: product?.model || 'N/A' },
            { label: 'Category', value: product?.category?.name || 'Electronics' },
            { label: 'Availability', value: 'In Stock' },
          ]
        }
      ];

  // Submit a Q&A question
  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!questionForm.queryText.trim()) return;
    setSubmittingQuestion(true);
    try {
      const response = await axios.post(`${getPublicApiBase()}/products/${id}/questions`, questionForm);
      if (response.data.success) {
        setSnackbar({ open: true, message: 'Question submitted successfully! It will appear once approved/answered.', severity: 'success' });
        setQuestionForm({ name: '', email: '', queryText: '' });
        setShowQuestionForm(false);
      }
    } catch (error) {
      console.error('Error submitting question:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to submit question.', severity: 'error' });
    } finally {
      setSubmittingQuestion(false);
    }
  };

  // Submit a Review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) return;
    setSubmittingReview(true);
    try {
      const response = await axios.post(`${getPublicApiBase()}/products/${id}/reviews`, reviewForm);
      if (response.data.success) {
        setSnackbar({ open: true, message: 'Review submitted successfully! Thank you for your feedback.', severity: 'success' });
        setReviewForm({ name: '', email: '', rating: 5, comment: '' });
        setShowReviewForm(false);
        refetchReviews();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to submit review.', severity: 'error' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = () => {
    const existingCart = JSON.parse(localStorage.getItem('ecommerceCart') || '[]');
    const cartItemColor = selectedColor?.name || product.color || '';
    const existingIndex = existingCart.findIndex(item => (item.product?._id || item._id) === product._id && item.selectedColor === cartItemColor);
    if (existingIndex >= 0) {
      existingCart[existingIndex].quantity += quantity;
    } else {
      existingCart.push({ 
        product: { 
          _id: product._id, 
          name: product.name, 
          sku: product.sku, 
          price: product.sellingPrice, 
          image: product.images?.[0] || product.image 
        }, 
        quantity,
        selectedColor: cartItemColor
      });
    }
    localStorage.setItem('ecommerceCart', JSON.stringify(existingCart));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('open-cart-drawer'));
    setSnackbar({ open: true, message: `Product added to cart! ${cartItemColor ? `(${cartItemColor})` : ''}`, severity: 'success' });
  };

  if (isError || (!isLoading && !product)) {
    return (
      <EcommerceLayout>
        <Container sx={{ py: 8 }}><Alert severity="error">Product not found.</Alert></Container>
      </EcommerceLayout>
    );
  }

  const sideBanners = banners.filter(b => b.position !== 'main').slice(0, 3);

  return (
    <EcommerceLayout>
      <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', pb: 10, pt: 2 }}>
        <Container maxWidth="xl">
          {isLoading ? (
            <>
              <Skeleton variant="text" width={250} height={24} sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} lg={9}>
                  <Card sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: 'none', overflow: 'hidden', mb: 3 }}>
                    <Grid container>
                      <Grid item xs={12} md={6} sx={{ p: 3, borderRight: { md: '1px solid #E2E8F0' } }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, height: { xs: 'auto', md: 400 } }}>
                          <Skeleton variant="rectangular" sx={{ flex: 1, order: { xs: 1, md: 2 }, borderRadius: '8px', height: { xs: 300, md: '100%' } }} />
                          <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} sx={{ width: { xs: '100%', md: 80 }, order: { xs: 2, md: 1 } }}>
                            <Skeleton variant="rectangular" width={70} height={70} sx={{ borderRadius: '8px', flexShrink: 0 }} />
                            <Skeleton variant="rectangular" width={70} height={70} sx={{ borderRadius: '8px', flexShrink: 0 }} />
                            <Skeleton variant="rectangular" width={70} height={70} sx={{ borderRadius: '8px', flexShrink: 0 }} />
                            <Skeleton variant="rectangular" width={70} height={70} sx={{ borderRadius: '8px', flexShrink: 0 }} />
                          </Stack>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6} sx={{ p: 4 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Skeleton variant="text" width="80%" height={40} />
                          <Skeleton variant="circular" width={32} height={32} />
                        </Stack>
                        <Skeleton variant="text" width="40%" height={24} sx={{ mb: 3 }} />
                        <Box sx={{ mb: 4 }}>
                          <Skeleton variant="text" width="30%" height={48} />
                          <Skeleton variant="text" width="50%" height={20} sx={{ mt: 1 }} />
                        </Box>
                        <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: '8px', mb: 3 }} />
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 1.5 }}>
                          <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: '8px' }} />
                          <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: '8px' }} />
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                  {/* Highlights Skeleton */}
                  <Box sx={{ bgcolor: '#FFFFFF', borderRadius: '24px', p: { xs: 3, md: 8 }, mb: 4, border: '1px solid rgba(0,0,0,0.05)' }}>
                    <Grid container spacing={{ xs: 3, md: 6 }} alignItems="center">
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                          <Skeleton variant="rectangular" width="50%" height={250} sx={{ borderRadius: '16px' }} />
                          <Skeleton variant="rectangular" width="50%" height={250} sx={{ borderRadius: '16px' }} />
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Skeleton variant="text" width="40%" height={50} sx={{ mb: 3 }} />
                        <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="90%" height={24} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="70%" height={24} sx={{ mb: 4 }} />
                        <Skeleton variant="text" width="30%" height={32} sx={{ mb: 1.5 }} />
                        <Skeleton variant="text" width="100%" height={20} />
                      </Grid>
                    </Grid>
                  </Box>
                  {/* Tabs Skeleton */}
                  <Box sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={2}>
                      <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: '8px' }} />
                      <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: '8px' }} />
                      <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: '8px' }} />
                      <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: '8px' }} />
                    </Stack>
                  </Box>
                  <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: '12px' }} />
                </Grid>
                {/* Right Sidebar Skeleton */}
                <Grid item xs={12} lg={3}>
                  <Stack spacing={4} sx={{ height: '100%' }}>
                    <Box>
                      <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
                      <Box sx={{ display: 'flex', gap: 2, overflowX: { xs: 'auto', md: 'visible' }, flexWrap: { xs: 'nowrap', md: 'wrap' } }}>
                        <Skeleton variant="rectangular" width="100%" height={160} sx={{ borderRadius: '16px' }} />
                      </Box>
                    </Box>
                    <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: '20px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' }}>
                      <Skeleton variant="text" width="70%" height={32} sx={{ mb: 3 }} />
                      <Stack spacing={1}>
                        {Array.from(new Array(4)).map((_, idx) => (
                          <Stack key={idx} direction="row" spacing={2.5} sx={{ p: 1.5 }}>
                            <Skeleton variant="rectangular" width={72} height={72} sx={{ borderRadius: '12px', flexShrink: 0 }} />
                            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                              <Skeleton variant="text" width="100%" height={20} sx={{ mb: 0.75 }} />
                              <Skeleton variant="text" width="80%" height={20} sx={{ mb: 0.75 }} />
                              <Skeleton variant="text" width="40%" height={24} />
                            </Box>
                          </Stack>
                        ))}
                      </Stack>
                    </Paper>
                  </Stack>
                </Grid>
              </Grid>
            </>
          ) : (
            <>
              <Breadcrumbs separator={<ChevronRightIcon sx={{ fontSize: 14 }} />} sx={{ mb: 3 }}>
                <Link component={RouterLink} to="/" underline="hover" color="inherit" sx={{ fontSize: 13 }}>Home</Link>
                <Link component={RouterLink} to="/shop/products" underline="hover" color="inherit" sx={{ fontSize: 13 }}>Product</Link>
                <Link component={RouterLink} to={`/shop/products?category=${product.category?._id}`} underline="hover" color="inherit" sx={{ fontSize: 13 }}>
                  {product.category?.name || 'Products'}
                </Link>
                <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 500 }}>{product.name}</Typography>
              </Breadcrumbs>

              <Grid container spacing={3}>
            
            <Grid item xs={12} lg={9}>
              {/* Product Top Info Section */}
              <Card sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: 'none', overflow: 'hidden', mb: 3 }}>
                <Grid container>
                  <Grid item xs={12} md={6} sx={{ p: 3, borderRight: { md: '1px solid #E2E8F0' } }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', md: 'row' },
                      gap: 2, 
                      height: { xs: 'auto', md: 400 } 
                    }}>
                      {/* Main Image with slide-from-right animation */}
                      <Box sx={{
                        flex: 1, 
                        order: { xs: 1, md: 2 },
                        position: 'relative', 
                        bgcolor: 'white', 
                        borderRadius: '8px',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        height: { xs: 300, md: '100%' },
                        overflow: 'hidden',
                        '@keyframes slideFromRight': {
                          '0%': { opacity: 0, transform: 'translateX(60px)' },
                          '100%': { opacity: 1, transform: 'translateX(0)' },
                        },
                      }}>
                        <CardMedia
                          key={imageAnimKey}
                          component="img"
                          image={product.images?.[selectedImage] || product.image || '/placeholder-product.png'}
                          alt={product.name}
                          sx={{
                            maxHeight: '100%', maxWidth: '100%', objectFit: 'contain',
                            animation: 'slideFromRight 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          }}
                        />
                      </Box>

                      {/* Thumbnails Sidebar/Bottombar */}
                      {product.images?.length > 1 && (
                        <Stack 
                          direction={ { xs: 'row', md: 'column' } }
                          spacing={1} 
                          sx={{ 
                            width: { xs: '100%', md: 80 }, 
                            order: { xs: 2, md: 1 },
                            overflowX: { xs: 'auto', md: 'hidden' }, 
                            overflowY: { xs: 'hidden', md: 'auto' },
                            pb: { xs: 1, md: 0 },
                            pr: { xs: 0, md: 0.5 },
                            '&::-webkit-scrollbar': { height: 4, width: 4 },
                            '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 2 }
                          }}
                        >
                          {product.images.map((img, idx) => (
                            <Box
                              key={idx}
                              onMouseEnter={() => handleImageChange(idx)}
                              onClick={() => handleImageChange(idx)}
                              sx={{
                                width: { xs: 70, md: '100%' }, 
                                aspectRatio: '1/1', 
                                borderRadius: '8px', 
                                overflow: 'hidden', 
                                cursor: 'pointer',
                                border: `2px solid ${selectedImage === idx ? '#14B8A6' : '#E2E8F0'}`,
                                flexShrink: 0,
                                bgcolor: 'white',
                                transition: 'all 0.2s ease',
                                '&:hover': { borderColor: '#14B8A6' }
                              }}
                            >
                              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6} sx={{ p: 4 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h5" fontWeight={700} sx={{ color: '#1E293B', mb: 1 }}>{product.name}</Typography>
                      <IconButton><ShareIcon fontSize="small" /></IconButton>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                      <Rating value={reviewsStats.averageRating || 0} precision={0.1} size="small" readOnly />
                      <Typography variant="body2" color="text.secondary">({reviewsStats.numOfReviews || 0} Reviews)</Typography>
                    </Stack>

                    <Box sx={{ mb: 4 }}>
                      <Stack direction="row" spacing={2} alignItems="baseline" flexWrap="wrap">
                        {(() => {
                          const displayPrice = product.price ?? product.sellingPrice ?? 0;
                          const displayCutted = product.cuttedPrice ?? product.mrp;
                          const hasDiscount = displayCutted > displayPrice;
                          const discountPct = hasDiscount ? Math.round(((displayCutted - displayPrice) / displayCutted) * 100) : 0;
                          
                          return (
                            <>
                              <Typography variant="h4" fontWeight={800} color="#14B8A6">৳{displayPrice.toLocaleString()}</Typography>
                              {hasDiscount && (
                                <>
                                  <Typography variant="h6" sx={{ textDecoration: 'line-through', color: '#94A3B8' }}>৳{displayCutted.toLocaleString()}</Typography>
                                  <Chip 
                                    label={`-${discountPct}% OFF`} 
                                    size="small" 
                                    sx={{ 
                                      bgcolor: '#EF4444', 
                                      color: 'white', 
                                      fontWeight: 800, 
                                      fontSize: '0.85rem',
                                      height: 28,
                                      borderRadius: '6px',
                                      ml: 1
                                    }} 
                                  />
                                </>
                              )}
                            </>
                          );
                        })()}
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 1, color: '#64748B' }}>Product Code: <strong>{product?.model || product?.sku}</strong></Typography>
                    </Box>

                    {/* Available Colors Section */}
                    {((product.colors && product.colors.length > 0) || product.color) && (
                      <Paper sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', mb: 2.5, border: '1px solid #E2E8F0' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1E293B' }}>
                            Color: <span style={{ color: '#14B8A6', fontWeight: 700 }}>{selectedColor?.name || product.color || 'Default'}</span>
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                          {product.colors && product.colors.length > 0 ? (
                            product.colors.map((colorObj, idx) => {
                              const isSelected = selectedColor?.name === colorObj.name;
                              return (
                                <Box
                                  key={idx}
                                  onClick={() => setSelectedColor(colorObj)}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 1.5,
                                    py: 0.75,
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    border: isSelected ? '2px solid #14B8A6' : '1px solid #CBD5E1',
                                    bgcolor: isSelected ? '#F0FDF4' : 'white',
                                    boxShadow: isSelected ? '0 0 0 3px rgba(20, 184, 166, 0.15)' : 'none',
                                    transition: 'all 0.2s ease',
                                    '&:hover': { borderColor: '#14B8A6' }
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 18,
                                      height: 18,
                                      borderRadius: '50%',
                                      bgcolor: colorObj.code || '#14B8A6',
                                      border: (colorObj.code === '#FFFFFF' || colorObj.code === '#ffffff') ? '1px solid #CBD5E1' : 'none',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ fontWeight: isSelected ? 700 : 500, color: isSelected ? '#0D9488' : '#334155' }}>
                                    {colorObj.name}
                                  </Typography>
                                </Box>
                              );
                            })
                          ) : (
                            <Chip
                              label={product.color}
                              avatar={
                                <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: '#14B8A6', ml: 0.5 }} />
                              }
                              sx={{ fontWeight: 600, bgcolor: '#E0F2FE', color: '#0369A1' }}
                            />
                          )}
                        </Stack>
                      </Paper>
                    )}

                    <Paper sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '8px', mb: 3, border: '1px solid #E2E8F0' }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Quantity</Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Stack direction="row" alignItems="center" sx={{ border: '1px solid #CBD5E1', borderRadius: '6px', bgcolor: 'white' }}>
                          <IconButton size="small" onClick={() => setQuantity(q => Math.max(1, q - 1))}><RemoveIcon fontSize="small" /></IconButton>
                          <Typography sx={{ width: 30, textAlign: 'center', fontWeight: 700 }}>{quantity}</Typography>
                          <IconButton size="small" onClick={() => setQuantity(q => q + 1)}><AddIcon fontSize="small" /></IconButton>
                        </Stack>
                        <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 1 }}>
                          <Button
                            variant="contained"
                            fullWidth
                            startIcon={<CartIcon />}
                            onClick={handleAddToCart}
                            sx={{ 
                              background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                              color: 'white',
                              '&:hover': { 
                                background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                                boxShadow: '0 4px 14px rgba(20, 184, 166, 0.35)' 
                              }, 
                              py: 1.2,
                              fontWeight: 700,
                              textTransform: 'none',
                              borderRadius: '8px',
                              transition: 'all 0.25s ease'
                            }}
                          >
                            Add to Cart
                          </Button>
                        </Box>
                      </Stack>
                    </Paper>

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 1.5 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<CartIcon />}
                        onClick={handleAddToCart}
                        sx={{ 
                          display: { xs: 'flex', md: 'none' },
                          background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                          color: 'white',
                          '&:hover': { 
                            background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                            boxShadow: '0 4px 14px rgba(20, 184, 166, 0.35)' 
                          }, 
                          py: 1.2,
                          fontWeight: 700,
                          textTransform: 'none',
                          borderRadius: '8px',
                          transition: 'all 0.25s ease',
                          flex: 1
                        }}
                      >
                        Add to Cart
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate(`/shop/checkout/${product._id}`, { state: { selectedColor: selectedColor?.name || product.color || null } })}
                        sx={{ 
                          border: '2px solid #14B8A6', 
                          color: '#14B8A6', 
                          fontWeight: 700, 
                          py: 1.2,
                          borderRadius: '8px',
                          textTransform: 'none',
                          '&:hover': { 
                            border: '2px solid #0D9488', 
                            bgcolor: 'rgba(20, 184, 166, 0.04)',
                            color: '#0D9488'
                          },
                          transition: 'all 0.2s ease',
                          flex: 1
                        }}
                      >
                        Buy Now
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Card>

              {/* ── HAIER STYLE HIGHLIGHTS SECTION (LIGHT THEME) ── */}
              <Box sx={{ 
                bgcolor: '#FFFFFF', 
                color: '#1E293B', 
                borderRadius: '24px', 
                p: { xs: 3, md: 8 }, 
                mb: 4,
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.03)'
              }}>
                <Grid container spacing={{ xs: 3, md: 6 }} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1.5, 
                      overflowX: { xs: 'auto', md: 'visible' },
                      flexWrap: { xs: 'nowrap', md: 'wrap' },
                      pb: { xs: 1.5, md: 0 },
                      '&::-webkit-scrollbar': { display: 'none' },
                      scrollbarWidth: 'none',
                      mx: { xs: -1, md: 0 },
                      px: { xs: 1, md: 0 }
                    }}>
                      {(product.highlightImages && product.highlightImages.length > 0 
                        ? product.highlightImages 
                        : (product.images?.slice(0, 4) || [])
                      ).map((img, idx) => (
                        <Box 
                          key={idx}
                          className="scroll-animate"
                          sx={{ 
                            bgcolor: '#F8FAFC', 
                            borderRadius: '16px', 
                            p: 2, 
                            height: { xs: 160, md: 250 }, 
                            width: { xs: 160, md: 'calc(50% - 8px)' },
                            flexShrink: 0,
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            border: '1px solid #F1F5F9',
                            opacity: 0,
                            transform: 'scale(0.9) translateY(30px)',
                            transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            '&.animate-in': { opacity: 1, transform: 'scale(1) translateY(0)' },
                            '&:hover img': { transform: 'scale(1.1) rotate(2deg)' }
                          }}
                        >
                          <img 
                            src={img} 
                            alt="" 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '100%', 
                              objectFit: 'contain',
                              transition: 'transform 0.5s ease'
                            }} 
                          />
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box 
                      className="scroll-animate"
                      sx={{ 
                        opacity: 0, 
                        transform: 'translateX(50px)', 
                        transition: 'all 0.8s ease-out 0.2s',
                        '&.animate-in': { opacity: 1, transform: 'translateX(0)' }
                      }}
                    >
                      <Typography variant="h3" fontWeight={800} sx={{ mb: 3, letterSpacing: '-0.02em', color: '#0F172A', fontSize: { xs: '1.75rem', md: '2.5rem' } }}>Highlights</Typography>
                      <Stack spacing={2} sx={{ mb: 4 }}>
                        {(product.highlights && product.highlights.length > 0 
                          ? product.highlights 
                          : ['Premium Build Quality', 'Energy Efficient Technology', 'Advanced Smart Features']
                        ).map((h, i) => (
                          <Stack key={i} direction="row" spacing={2} alignItems="center">
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#14B8A6', boxShadow: '0 0 10px rgba(20, 184, 166, 0.3)' }} />
                            <Typography variant="body1" sx={{ color: '#475569', fontWeight: 600, fontSize: { xs: '0.85rem', md: '1.1rem' } }}>{h}</Typography>
                          </Stack>
                        ))}
                      </Stack>

                      <Typography variant="h5" fontWeight={700} sx={{ mb: 1.5, color: '#0F172A', fontSize: { xs: '1.15rem', md: '1.5rem' } }}>Specs</Typography>
                      <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6, fontWeight: 500, fontSize: { xs: '0.82rem', md: '0.95rem' } }}>
                        {product.shortSpecs || `${product.category?.name} / ${product.model || product.sku} / Premium Edition`}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* ── STICKY ANCHOR TABS ── */}
              <Box sx={{ 
                position: 'sticky', top: { xs: 112, md: 120 }, zIndex: 100, 
                bgcolor: 'white', borderBottom: '1px solid #E2E8F0', 
                mb: 3, borderRadius: '12px 12px 0 0',
                transition: 'top 0.3s ease'
              }}>
                <Tabs 
                  value={activeTab} 
                  onChange={(e, v) => scrollToSection(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{ 
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minWidth: 80, fontSize: { xs: '0.8rem', md: '0.9rem' } },
                    '& .Mui-selected': { color: '#14B8A6 !important' },
                    '& .MuiTabs-indicator': { backgroundColor: '#14B8A6' },
                    '& .MuiTabs-scroller': {
                      '&::-webkit-scrollbar': { display: 'none' },
                      scrollbarWidth: 'none'
                    }
                  }}
                >
                  {tabsConfig.map((t, idx) => (
                    <Tab key={idx} label={t.label} />
                  ))}
                </Tabs>
              </Box>

              {/* ── CONTENT SECTIONS (ONE AFTER ANOTHER) ── */}
              <Stack spacing={4}>
                
                {/* Specification Section */}
                <Box id="specification" ref={specsRef} sx={{ scrollMarginTop: '100px' }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2, px: 2 }}>Specifications</Typography>
                  <Card sx={{ p: 2, borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                    {specificationsList.map((cat, i) => (
                      <Box key={i} sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ bgcolor: '#F1F5F9', p: 1.5, borderRadius: '6px', mb: 1 }}>{cat.category}</Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableBody>
                              {cat.items.map((item, j) => (
                                <TableRow key={j} sx={{ '&:last-child td': { border: 0 } }}>
                                  <TableCell sx={{ width: '30%', color: '#64748B' }}>{item.label}</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>{item.value}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    ))}
                  </Card>
                </Box>

                {/* Features Section */}
                <Box id="features" ref={featureRef} sx={{ scrollMarginTop: '100px' }}>
                  <Typography variant="h4" fontWeight={800} sx={{ mb: 4, px: 2, letterSpacing: '-0.02em', color: '#0F172A' }}>
                    Key Features
                  </Typography>
                  {!hasFeatures ? (
                    <Card sx={{ p: 4, borderRadius: '24px', border: '1px dashed #CBD5E1', boxShadow: 'none', textAlign: 'center', bgcolor: 'transparent' }}>
                      <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 500 }}>
                        No special features have been highlighted for this product yet.
                      </Typography>
                    </Card>
                  ) : (
                    <Stack spacing={4}>
                      {displayFeatures.map((feature, idx) => (
                        <Card 
                          key={idx} 
                          className="scroll-animate"
                          sx={{ 
                            borderRadius: '32px', 
                            overflow: 'hidden', 
                            boxShadow: '0 24px 48px rgba(0,0,0,0.06)',
                            border: '1px solid #F1F5F9',
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            position: 'relative',
                            minHeight: { xs: 'auto', md: 500 },
                            bgcolor: '#FFFFFF',
                            opacity: 0,
                            transform: 'translateY(40px)',
                            transition: 'all 1s cubic-bezier(0.2, 0.8, 0.2, 1)',
                            '&.animate-in': { opacity: 1, transform: 'translateY(0)' },
                            '&:hover .feature-img': { transform: { md: 'scale(1.05) translateY(-10px)' } },
                          }}
                        >
                          {/* Background Glow Effect */}
                          <Box sx={{
                            position: 'absolute',
                            width: '50%',
                            height: '50%',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(255,255,255,0) 70%)',
                            top: feature.layout === 'left' ? '-10%' : 'auto',
                            bottom: feature.layout === 'left' ? 'auto' : '-10%',
                            left: feature.layout === 'left' ? '-10%' : 'auto',
                            right: feature.layout === 'left' ? 'auto' : '-10%',
                            zIndex: 0,
                          }} />

                          {/* Image Container */}
                          <Box sx={{
                            width: { xs: '100%', md: '50%' },
                            height: { xs: 320, md: 'auto' },
                            order: { xs: 1, md: feature.layout === 'left' ? 1 : 2 },
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            p: { xs: 4, md: 6 },
                            bgcolor: '#F8FAFC',
                          }}>
                            <img 
                              className="feature-img"
                              src={feature.image} 
                              alt={feature.title} 
                              style={{ 
                                maxHeight: '100%', 
                                maxWidth: '100%',
                                objectFit: 'contain',
                                transition: 'transform 1s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                filter: 'drop-shadow(0 24px 36px rgba(0,0,0,0.12))'
                              }} 
                            />
                          </Box>

                          {/* Content Container */}
                          <Box sx={{ 
                            width: { xs: '100%', md: '50%' }, 
                            order: { xs: 2, md: feature.layout === 'left' ? 2 : 1 },
                            zIndex: 2, 
                            p: { xs: 4, md: 8 },
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            textAlign: 'left',
                            bgcolor: '#FFFFFF',
                          }}>
                            <Typography 
                              variant="overline" 
                              sx={{ 
                                color: '#6366F1', 
                                fontWeight: 800, 
                                letterSpacing: 2, 
                                mb: 2,
                                display: 'inline-block',
                                background: 'rgba(99, 102, 241, 0.1)',
                                px: 2,
                                py: 0.5,
                                borderRadius: '20px',
                                alignSelf: 'flex-start'
                              }}
                            >
                              PREMIUM FEATURE
                            </Typography>
                            <Typography 
                              variant="h2" 
                              fontWeight={900} 
                              sx={{ 
                                mb: 3,
                                fontSize: { xs: '2rem', md: '3.25rem' },
                                letterSpacing: '-0.03em',
                                lineHeight: 1.15,
                                background: 'linear-gradient(135deg, #0F172A 0%, #6366F1 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              }}
                            >
                              {feature.title}
                            </Typography>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                color: '#475569', 
                                lineHeight: 1.8,
                                fontSize: { xs: '1rem', md: '1.15rem' },
                                fontWeight: 500,
                              }}
                            >
                              {feature.description}
                            </Typography>
                          </Box>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Box>

                {/* Description Section */}
                <Box id="description" ref={descRef} sx={{ scrollMarginTop: '100px' }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2, px: 2 }}>Description</Typography>
                  <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                    <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                      {product.description || "Premium quality product from DemoERP. Designed for durability and performance."}
                    </Typography>
                  </Card>
                </Box>

                {/* Questions Section */}
                <Box id="questions" ref={quesRef} sx={{ scrollMarginTop: '100px' }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2, px: 2 }}>Questions & Answers</Typography>
                  <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                    <Stack spacing={3}>
                      {questionsList.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="body2" color="text.secondary">No questions have been asked about this product yet.</Typography>
                        </Box>
                      ) : (
                        questionsList.map((q) => (
                          <Box key={q._id} sx={{ p: 2, borderRadius: '8px', border: '1px solid #F1F5F9', bgcolor: '#F8FAFC' }}>
                            <Typography fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1E293B' }}>
                              <QuestionIcon sx={{ color: '#14B8A6', fontSize: 20 }} /> {q.queryText}
                            </Typography>
                            {q.answerText && (
                              <Box sx={{ mt: 1.5, ml: 4, pl: 2, borderLeft: '3px solid #14B8A6' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.5 }}>Answer from DemoERP Admin:</Typography>
                                <Typography variant="body2" sx={{ color: '#64748B' }}>{q.answerText}</Typography>
                              </Box>
                            )}
                          </Box>
                        ))
                      )}

                      {!showQuestionForm ? (
                        <Button 
                          variant="outlined" 
                          onClick={() => setShowQuestionForm(true)}
                          sx={{ alignSelf: 'flex-start', border: '1.5px solid #14B8A6', color: '#14B8A6', '&:hover': { border: '1.5px solid #0F766E', bgcolor: 'rgba(20, 184, 166, 0.04)' }, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                        >
                          Ask a Question
                        </Button>
                      ) : (
                        <Box component="form" onSubmit={handleQuestionSubmit} sx={{ p: 2.5, borderRadius: '8px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1E293B', mb: 2 }}>Submit Your Question</Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Your Name"
                                value={questionForm.name}
                                onChange={(e) => setQuestionForm({ ...questionForm, name: e.target.value })}
                                size="small"
                                required
                                InputProps={{ sx: { borderRadius: '6px' } }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Your Email"
                                type="email"
                                value={questionForm.email}
                                onChange={(e) => setQuestionForm({ ...questionForm, email: e.target.value })}
                                size="small"
                                required
                                InputProps={{ sx: { borderRadius: '6px' } }}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Your Question"
                                placeholder="What would you like to know about this product?"
                                value={questionForm.queryText}
                                onChange={(e) => setQuestionForm({ ...questionForm, queryText: e.target.value })}
                                multiline
                                rows={3}
                                required
                                InputProps={{ sx: { borderRadius: '6px' } }}
                              />
                            </Grid>
                            <Grid item xs={12} sx={{ display: 'flex', gap: 1.5 }}>
                              <Button
                                variant="contained"
                                type="submit"
                                disabled={submittingQuestion}
                                sx={{ bgcolor: '#14B8A6', '&:hover': { bgcolor: '#0F766E' }, textTransform: 'none', borderRadius: '6px', px: 3 }}
                              >
                                {submittingQuestion ? <CircularProgress size={20} color="inherit" /> : 'Submit Question'}
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={() => setShowQuestionForm(false)}
                                sx={{ textTransform: 'none', borderRadius: '6px' }}
                              >
                                Cancel
                              </Button>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </Stack>
                  </Card>
                </Box>

                {/* Reviews Section */}
                <Box id="reviews" ref={revsRef} sx={{ scrollMarginTop: '100px' }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2, px: 2 }}>Reviews</Typography>
                  <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                    <Grid container spacing={4} sx={{ mb: 4 }}>
                      <Grid item xs={12} md={5}>
                        <Box sx={{ p: 3, bgcolor: '#F8FAFC', borderRadius: '12px' }}>
                          <Typography variant="h3" fontWeight={800} sx={{ color: '#1E293B' }}>
                            {reviewsStats.averageRating ? reviewsStats.averageRating.toFixed(1) : '0.0'}
                          </Typography>
                          <Rating value={reviewsStats.averageRating || 0} precision={0.1} readOnly sx={{ my: 1 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Based on {reviewsStats.numOfReviews || 0} verified ratings
                          </Typography>
                          <Stack spacing={1}>
                            {[5, 4, 3, 2, 1].map((star) => (
                              <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" sx={{ width: 10, fontWeight: 700 }}>{star}</Typography>
                                <StarIcon sx={{ color: '#FAAF00', fontSize: 14 }} />
                                <LinearProgress 
                                  variant="determinate" 
                                  value={((ratingBreakdown[star] || 0) / (reviewsStats.numOfReviews || 1)) * 100} 
                                  sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { bgcolor: '#FAAF00' } }}
                                />
                                <Typography variant="caption" sx={{ width: 25, textAlign: 'right', color: '#64748B' }}>
                                  {ratingBreakdown[star] || 0}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={7}>
                        <Stack spacing={2} sx={{ height: '100%', justifyContent: 'center' }}>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#1E293B' }}>Have you bought this product?</Typography>
                          <Typography variant="body2" color="text.secondary">Share your feedback to help other prospective buyers make informed decisions!</Typography>
                          {!showReviewForm ? (
                            <Button 
                              variant="contained" 
                              onClick={() => setShowReviewForm(true)}
                              sx={{ alignSelf: 'flex-start', bgcolor: '#14B8A6', '&:hover': { bgcolor: '#0F766E' }, borderRadius: '8px', textTransform: 'none', px: 3, py: 1, fontWeight: 600 }}
                            >
                              Write a Customer Review
                            </Button>
                          ) : (
                            <Button 
                              variant="outlined" 
                              onClick={() => setShowReviewForm(false)}
                              sx={{ alignSelf: 'flex-start', border: '1.5px solid #14B8A6', color: '#14B8A6', borderRadius: '8px', textTransform: 'none', px: 3 }}
                            >
                              Close Review Form
                            </Button>
                          )}
                        </Stack>
                      </Grid>
                    </Grid>

                    {/* Review Form Expansion */}
                    {showReviewForm && (
                      <Box component="form" onSubmit={handleReviewSubmit} sx={{ p: 3, mb: 4, borderRadius: '8px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1E293B', mb: 2 }}>Write Your Review</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Your Name"
                              value={reviewForm.name}
                              onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                              size="small"
                              required
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Your Email"
                              type="email"
                              value={reviewForm.email}
                              onChange={(e) => setReviewForm({ ...reviewForm, email: e.target.value })}
                              size="small"
                              required
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </Grid>
                          <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#475569' }}>Your Rating:</Typography>
                            <Rating
                              value={reviewForm.rating}
                              onChange={(event, newValue) => {
                                setReviewForm({ ...reviewForm, rating: newValue });
                              }}
                              precision={1}
                              size="medium"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Detailed Review Comment"
                              placeholder="Describe your user experience. What did you like or dislike about this product?"
                              value={reviewForm.comment}
                              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                              multiline
                              rows={4}
                              required
                              InputProps={{ sx: { borderRadius: '6px' } }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Button
                              variant="contained"
                              type="submit"
                              disabled={submittingReview}
                              sx={{ bgcolor: '#14B8A6', '&:hover': { bgcolor: '#0F766E' }, textTransform: 'none', borderRadius: '6px', px: 4, py: 1 }}
                            >
                              {submittingReview ? <CircularProgress size={20} color="inherit" /> : 'Submit Review'}
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    <Divider sx={{ my: 3 }} />

                    {/* Reviews List */}
                    <Stack spacing={3}>
                      {reviewsList.length === 0 ? (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">No reviews have been published for this product yet.</Typography>
                        </Box>
                      ) : (
                        reviewsList.map((rev) => (
                          <Box key={rev._id} sx={{ pb: 3, borderBottom: '1px solid #F1F5F9', '&:last-child': { pb: 0, borderBottom: 0 } }}>
                            <Stack direction="row" spacing={2} sx={{ mb: 1.5 }} alignItems="center">
                              <Avatar sx={{ width: 36, height: 36, bgcolor: '#14B8A6', fontSize: '0.95rem', fontWeight: 600 }}>
                                {rev.name ? rev.name[0].toUpperCase() : 'G'}
                              </Avatar>
                              <Box>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1E293B' }}>{rev.name}</Typography>
                                  {rev.isVerified && (
                                    <Chip 
                                      label="Verified Purchase" 
                                      color="success" 
                                      size="small" 
                                      icon={<CheckCircleIcon style={{ fontSize: 12 }} />}
                                      sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                                    />
                                  )}
                                </Stack>
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.2 }}>
                                  <Rating value={rev.rating} size="small" readOnly />
                                  <Typography variant="caption" color="text.secondary">
                                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
                                  </Typography>
                                </Stack>
                              </Box>
                            </Stack>
                            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>{rev.comment}</Typography>
                          </Box>
                        ))
                      )}
                    </Stack>
                  </Card>
                </Box>
              </Stack>
            </Grid>

            {/* ── SIDEBAR ── */}
            <Grid item xs={12} lg={3}>
              <Stack spacing={4} sx={{ height: '100%' }}>
                
                {/* Offers Section */}
                <Box>
                  <Typography variant="h6" fontWeight={800} sx={{ mb: 2, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.5, letterSpacing: '-0.02em' }}>
                    <Box sx={{ width: 5, height: 22, background: 'linear-gradient(180deg, #14B8A6 0%, #0D9488 100%)', borderRadius: 4 }} />
                    Offers for You
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    overflowX: { xs: 'auto', md: 'visible' },
                    flexWrap: { xs: 'nowrap', md: 'wrap' },
                    pb: { xs: 1.5, md: 0 },
                    mx: { xs: -2, md: 0 },
                    px: { xs: 2, md: 0 },
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none',
                  }}>
                    {sideBanners.map((banner) => (
                      <Card 
                        key={banner._id} 
                        sx={{ 
                          borderRadius: '16px', 
                          overflow: 'hidden', 
                          cursor: 'pointer',
                          flexShrink: 0,
                          width: { xs: 280, sm: 320, md: '100%' },
                          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.08)',
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                          transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 20px 40px -10px rgba(20, 184, 166, 0.15)',
                            borderColor: 'rgba(20, 184, 166, 0.3)'
                          }
                        }} 
                        onClick={() => navigate(banner.link || '/shop/products')}
                      >
                        <CardMedia 
                          component="img" 
                          image={banner.image} 
                          sx={{ 
                            height: { xs: 150, sm: 160, md: 'auto' }, 
                            aspectRatio: { md: '16/9' },
                            objectFit: 'contain', 
                            bgcolor: '#F8FAFC' 
                          }} 
                        />
                      </Card>
                    ))}
                  </Box>
                </Box>

                {/* Related Products Section */}
                <Paper sx={{ 
                  position: 'sticky', 
                  top: { xs: 80, md: 120 }, 
                  zIndex: 10,
                  p: { xs: 2.5, md: 3 }, 
                  borderRadius: '20px', 
                  border: '1px solid rgba(226, 232, 240, 0.8)', 
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)',
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
                  overflow: 'hidden'
                }}>
                  {/* Decorative background blur */}
                  <Box sx={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', zIndex: 0 }} />

                  <Typography variant="h6" fontWeight={800} sx={{ mb: 3, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.5, letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>
                    <Box sx={{ width: 5, height: 22, background: 'linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)', borderRadius: 4 }} />
                    Related Products
                  </Typography>

                  <Stack spacing={1} sx={{ position: 'relative', zIndex: 1 }}>
                    {relatedProducts.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>No related products found.</Typography>
                    ) : (
                      relatedProducts.map(item => (
                        <Stack 
                          key={item._id} 
                          direction="row" 
                          spacing={2.5} 
                          sx={{ 
                            cursor: 'pointer', 
                            p: 1.5,
                            mx: -1.5,
                            borderRadius: '14px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': { 
                              bgcolor: '#FFFFFF',
                              boxShadow: '0 8px 20px -4px rgba(0,0,0,0.06)',
                              transform: 'translateX(4px)',
                              '& .product-img-container': {
                                borderColor: '#6366F1',
                                transform: 'scale(1.05)'
                              }
                            } 
                          }}
                          onClick={() => navigate(`/shop/products/${item._id}`)}
                        >
                          <Box 
                            className="product-img-container"
                            sx={{ 
                              width: 72, 
                              height: 72, 
                              bgcolor: '#F8FAFC', 
                              borderRadius: '12px', 
                              border: '1px solid #E2E8F0', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              flexShrink: 0, 
                              p: 1,
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <img 
                              src={item.images?.[0] || item.image || '/placeholder-product.png'} 
                              alt={item.name} 
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                            />
                          </Box>
                          <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Typography 
                              variant="subtitle2" 
                              fontWeight={700} 
                              sx={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: '#1E293B',
                                lineHeight: 1.4,
                                mb: 0.75,
                                fontSize: '0.9rem',
                                transition: 'color 0.2s',
                                '&:hover': { color: '#6366F1' }
                              }}
                            >
                              {item.name}
                            </Typography>
                            <Typography variant="subtitle2" color="#14B8A6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              ৳{item.sellingPrice?.toLocaleString()}
                            </Typography>
                          </Box>
                        </Stack>
                      ))
                    )}
                  </Stack>
                </Paper>
              </Stack>
            </Grid>
          </Grid>
            </>
          )}
        </Container>



        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </EcommerceLayout>
  );
};

export default ProductDetails;
