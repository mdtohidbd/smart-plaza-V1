import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import EcommerceLayout from '../../ecommerce/layout/EcommerceLayout';
import PaymentMethodSelector from '../../components/PaymentMethodSelector';
import { getPublicApiBase } from '../../utils/publicApi';
import api from '../../utils/api';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Breadcrumbs,
  Link,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel
} from '@mui/material';
import { ArrowBack, ShoppingCart, LocalShipping } from '@mui/icons-material';

const Checkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');

  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [emiPlan, setEmiPlan] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [deliveryArea, setDeliveryArea] = useState('inside');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Dhaka',
    state: 'Dhaka Division',
    country: 'Bangladesh',
    zipCode: '1000'
  });

  // Fetch product details if checking out a single item
  const { data: product, isLoading: isLoadingProduct, isError: isErrorProduct } = useQuery(
    ['product', id],
    async () => {
      const response = await axios.get(`${getPublicApiBase()}/products/${id}`);
      return response.data.data;
    },
    {
      enabled: !!id,
      refetchOnWindowFocus: false,
    }
  );

  // Load cart items if no product ID is provided
  useEffect(() => {
    if (!id) {
      const loadCart = () => {
        try {
          const savedCart = localStorage.getItem('ecommerceCart');
          if (savedCart) {
            setCartItems(JSON.parse(savedCart));
          } else {
            setCartItems([]);
          }
        } catch (error) {
          console.error("Error parsing cart from localStorage:", error);
          setCartItems([]);
        }
      };
      
      loadCart();
      window.addEventListener('storage', loadCart);
      return () => window.removeEventListener('storage', loadCart);
    }
  }, [id]);

  // Create order mutation
  const createOrderMutation = useMutation(
    async (orderData) => {
      const response = await api.post('/api/orders', orderData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('orders');
        // If it was a cart checkout, clear the cart
        if (!id) {
          localStorage.removeItem('ecommerceCart');
          window.dispatchEvent(new Event('storage')); // Notify other components
        }
        navigate('/shop/order-success', { 
          state: { 
            orderId: data.data.orderId,
            orderNumber: data.data.orderNumber,
            total: data.data.total,
            email: customerInfo.email
          } 
        });
      },
      onError: (error) => {
        console.error('Order creation failed:', error);
        alert(error.response?.data?.message || 'Failed to place order. Please check your network or try again.');
      }
    }
  );

  // Pre-fill customer info if user is logged in
  useEffect(() => {
    if (token) {
      try {
        const user = JSON.parse(atob(token.split('.')[1]));
        if (user.name || user.phone) {
          setCustomerInfo(prev => ({
            ...prev,
            name: user.name || prev.name,
            phone: user.phone || prev.phone,
            email: user.email || prev.email
          }));
        }
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }
  }, [token]);

  const calculateTotal = () => {
    if (id && product) {
      return product.sellingPrice * quantity;
    }
    return cartItems.reduce((total, item) => {
      const price = item.product?.price || item.product?.sellingPrice || item.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const subtotal = calculateTotal();
  const deliveryCharge = deliveryArea === 'outside' ? 60 : 0;
  const totalAmount = subtotal + deliveryCharge;

  const handlePlaceOrder = () => {
    // Validate required fields
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      alert('Please provide your full name, phone number, and delivery address.');
      return;
    }

    // Validate BD Phone Number
    if (!/^01[3-9]\d{8}$/.test(customerInfo.phone)) {
      alert('Please enter a valid 11-digit Bangladeshi phone number (e.g., 01316884689).');
      return;
    }

    // Validate Email if provided
    if (customerInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email.trim())) {
      alert('Please enter a valid email address.');
      return;
    }

    if (paymentMethod === 'emi' && !emiPlan) {
      alert('Please select an EMI plan');
      return;
    }

    let orderItems = [];

    if (id && product) {
      orderItems = [{
        product: product._id,
        name: product.name,
        model: product.model,
        quantity: quantity,
        price: product.sellingPrice,
        image: (product.images && product.images.length > 0) ? product.images[0] : (product.image || null)
      }];
    } else {
      orderItems = cartItems.map(item => ({
        product: item.product._id,
        name: item.product.name,
        model: item.product.model,
        quantity: item.quantity,
        price: item.product?.price || item.product?.sellingPrice || item.price || 0,
        image: (item.product.images && item.product.images.length > 0) ? item.product.images[0] : (item.product.image || null)
      }));
    }

    const orderData = {
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      customerEmail: customerInfo.email || '',
      shippingAddress: {
        address: customerInfo.address,
        city: customerInfo.city,
        state: customerInfo.state,
        country: customerInfo.country,
        pincode: customerInfo.zipCode
      },
      deliveryMode: 'home',
      deliveryArea: deliveryArea,
      orderItems,
      subtotal: subtotal,
      deliveryCharge: deliveryCharge,
      discount: 0,
      total: totalAmount,
      paymentMethod: paymentMethod,
      isGuest: !token,
      ...(paymentMethod === 'emi' && emiPlan && {
        emiOption: {
          duration: emiPlan,
          downPayment: totalAmount * 0.2,
          interestRate: emiPlan === 3 ? 5 : emiPlan === 6 ? 8 : 10
        }
      })
    };

    createOrderMutation.mutate(orderData);
  };

  if (id && isLoadingProduct) {
    return (
      <EcommerceLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </EcommerceLayout>
    );
  }

  if (id && (isErrorProduct || !product)) {
    return (
      <EcommerceLayout>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Alert severity="error">Product not found or error loading product details.</Alert>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ mt: 2 }}
          >
            Back
          </Button>
        </Container>
      </EcommerceLayout>
    );
  }

  if (!id && cartItems.length === 0) {
    return (
      <EcommerceLayout>
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <Alert severity="info" sx={{ mb: 4, justifyContent: 'center' }}>Your cart is empty. Please add items to checkout.</Alert>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ShoppingCart />}
            onClick={() => navigate('/shop')}
          >
            Continue Shopping
          </Button>
        </Container>
      </EcommerceLayout>
    );
  }

  // Items to display in the order summary
  const summaryItems = id && product 
    ? [{ product, quantity }] 
    : cartItems;

  return (
    <EcommerceLayout>
      <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', pb: 6 }}>
        <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1.5, sm: 3 } }}>
          {/* Breadcrumb */}
          <Breadcrumbs sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: '#94A3B8' } }}>
            <Link 
              underline="hover" 
              color="inherit" 
              onClick={() => navigate('/shop/products')}
              sx={{ cursor: 'pointer', color: 'text.secondary' }}
            >
              Products
            </Link>
              <Typography sx={{ color: '#0F172A', fontWeight: 600, fontSize: '0.85rem' }}>Checkout</Typography>
          </Breadcrumbs>

          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <IconButton 
              onClick={() => navigate(-1)}
              sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" sx={{ fontFamily: 'Outfit, sans-serif', color: '#0F172A', fontWeight: 800 }}>
              Checkout
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, md: 3 }}>
            {/* Left Column - Customer Info & Payment */}
            <Grid item xs={12} md={7}>
              {/* Customer Information */}
              <Card sx={{ mb: 3, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
                  <Typography variant="h6" sx={{ fontFamily: 'Outfit, sans-serif', color: '#0F172A', fontWeight: 700, mb: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.05rem', sm: '1.1rem' } }}>
                    <LocalShipping sx={{ color: '#14B8A6', fontSize: '1.25rem' }} />
                    Shipping Details
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Full Name"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        required
                        variant="outlined"
                        InputProps={{ sx: { borderRadius: '8px' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Phone Number"
                        value={customerInfo.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setCustomerInfo({ ...customerInfo, phone: val });
                        }}
                        error={customerInfo.phone.length > 0 && !/^01[3-9]\d{8}$/.test(customerInfo.phone)}
                        helperText={customerInfo.phone.length > 0 && !/^01[3-9]\d{8}$/.test(customerInfo.phone) ? "Must be a valid 11-digit BD number" : ""}
                        required
                        variant="outlined"
                        InputProps={{ sx: { borderRadius: '8px' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Email Address (Optional)"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                        type="email"
                        variant="outlined"
                        InputProps={{ sx: { borderRadius: '8px' } }}
                        helperText="Optional - Used to track your order status"
                        FormHelperTextProps={{ sx: { fontFamily: 'Inter, sans-serif', color: '#64748B' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Full Delivery Address"
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                        multiline
                        rows={2}
                        required
                        variant="outlined"
                        InputProps={{ sx: { borderRadius: '8px' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl component="fieldset" sx={{ mt: 1 }}>
                        <FormLabel component="legend" sx={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#64748B', mb: 1 }}>
                          Delivery Area
                        </FormLabel>
                        <RadioGroup
                          row
                          value={deliveryArea}
                          onChange={(e) => setDeliveryArea(e.target.value)}
                        >
                          <FormControlLabel 
                            value="inside" 
                            control={<Radio size="small" sx={{ color: '#14B8A6', '&.Mui-checked': { color: '#14B8A6' } }} />} 
                            label={<Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: '#0F172A' }}>Inside Khulna (Free)</Typography>} 
                          />
                          <FormControlLabel 
                            value="outside" 
                            control={<Radio size="small" sx={{ color: '#14B8A6', '&.Mui-checked': { color: '#14B8A6' } }} />} 
                            label={<Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: '#0F172A' }}>Outside Khulna (৳60)</Typography>} 
                          />
                        </RadioGroup>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
                  <Typography variant="h6" sx={{ fontFamily: 'Outfit, sans-serif', color: '#0F172A', fontWeight: 700, mb: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.05rem', sm: '1.1rem' } }}>
                    <ShoppingCart sx={{ color: '#14B8A6', fontSize: '1.25rem' }} />
                    Payment Method
                  </Typography>
                  
                  <PaymentMethodSelector
                    selectedMethod={paymentMethod}
                    onMethodChange={(method) => {
                      setPaymentMethod(method);
                      if (method !== 'emi') {
                        setEmiPlan(null);
                      }
                    }}
                    selectedEmiPlan={emiPlan}
                    onEmiPlanChange={setEmiPlan}
                    totalAmount={totalAmount}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Right Column - Order Summary */}
            <Grid item xs={12} md={5}>
              <Card sx={{ bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', position: 'sticky', top: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
                  <Typography variant="h6" sx={{ fontFamily: 'Outfit, sans-serif', color: '#0F172A', fontWeight: 700, mb: { xs: 1.5, sm: 2 }, fontSize: { xs: '1.05rem', sm: '1.1rem' } }}>
                    Order Summary
                  </Typography>

                  {/* Products List */}
                  <Box sx={{ mb: 2.5, maxHeight: '300px', overflowY: 'auto', pr: 1,
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: '10px' },
                    '&::-webkit-scrollbar-thumb:hover': { background: '#94A3B8' }
                  }}>
                    {summaryItems.map((item, index) => {
                      const prod = item.product;
                      const image = prod.images?.[0] || prod.image;
                      return (
                        <Box key={index} sx={{ display: 'flex', gap: 1.5, mb: 1.5, pb: 1.5, borderBottom: '1px dashed #E2E8F0' }}>
                          {image ? (
                            <Box sx={{ width: 50, height: 50, borderRadius: '6px', border: '1px solid #F1F5F9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img src={image} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </Box>
                          ) : (
                            <Box sx={{ width: 50, height: 50, bgcolor: '#F8FAFC', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography variant="subtitle2" sx={{ color: '#14B8A6' }}>{prod.name?.[0]}</Typography>
                            </Box>
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontFamily: 'Outfit, sans-serif', color: '#0F172A', fontWeight: 600, mb: 0.25, fontSize: { xs: '0.8rem', sm: '0.85rem' }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {prod.name}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ fontFamily: 'Inter, sans-serif', color: '#64748B', fontSize: '0.75rem' }}>Qty: {item.quantity}</Typography>
                              <Typography sx={{ fontFamily: 'Inter, sans-serif', color: '#0F172A', fontWeight: 700, fontSize: '0.85rem' }}>৳{((prod.price || prod.sellingPrice || item.price || 0) * item.quantity).toLocaleString()}</Typography>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>

                  {/* Price Breakdown */}
                  <Box sx={{ mb: 2.5, bgcolor: '#F8FAFC', p: 2, borderRadius: '8px' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontFamily: 'Inter, sans-serif', color: '#64748B', fontSize: '0.85rem' }}>Subtotal</Typography>
                      <Typography sx={{ fontFamily: 'Inter, sans-serif', color: '#0F172A', fontWeight: 600, fontSize: '0.85rem' }}>৳{subtotal.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography sx={{ fontFamily: 'Inter, sans-serif', color: '#64748B', fontSize: '0.85rem' }}>Shipping Estimate</Typography>
                      <Typography sx={{ fontFamily: 'Inter, sans-serif', color: deliveryArea === 'inside' ? '#14B8A6' : '#0F172A', fontWeight: 600, fontSize: '0.85rem' }}>
                        {deliveryArea === 'inside' ? 'Free' : '৳60'}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1.5, borderColor: '#E2E8F0' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontFamily: 'Outfit, sans-serif', color: '#0F172A', fontWeight: 700, fontSize: '1rem' }}>Total</Typography>
                      <Typography sx={{ fontFamily: 'Outfit, sans-serif', color: '#14B8A6', fontWeight: 800, fontSize: '1.15rem' }}>৳{totalAmount.toLocaleString()}</Typography>
                    </Box>
                  </Box>

                  {/* Place Order Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handlePlaceOrder}
                    disabled={
                      createOrderMutation.isLoading || 
                      !customerInfo.name.trim() || 
                      !customerInfo.phone.trim() || 
                      !customerInfo.address.trim() || 
                      (paymentMethod === 'emi' && !emiPlan)
                    }
                    sx={{
                      py: 1.2,
                      bgcolor: '#0F172A',
                      color: '#FFFFFF',
                      fontSize: '0.95rem',
                      fontFamily: 'Outfit, sans-serif',
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 10px rgba(15, 23, 42, 0.2)',
                      '&:hover': { bgcolor: '#1E293B', boxShadow: '0 6px 14px rgba(15, 23, 42, 0.3)' }
                    }}
                  >
                    {createOrderMutation.isLoading ? (
                      <CircularProgress size={24} sx={{ color: '#FFFFFF' }} />
                    ) : (
                      `Complete Order • ৳${totalAmount.toLocaleString()}`
                    )}
                  </Button>

                  {/* Security Notice */}
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#64748B' }}>
                      🔒 Secure, encrypted checkout
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </EcommerceLayout>
  );
};

export default Checkout;
