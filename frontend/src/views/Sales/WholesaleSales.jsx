import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  InputAdornment,
  Snackbar,
  Autocomplete,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab
} from '@mui/material';

import {
  Add as AddIcon,
  LocalShipping as LocalShippingIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';

import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import PrintInvoiceModal from '../../components/invoices/PrintInvoiceModal';
import LoadQuotationModal from '../../components/LoadQuotationModal';
import WholesaleOrderPad from './components/WholesaleOrderPad';
import CustomerSelection from './components/CustomerSelection';
import PaymentDetails from './components/PaymentDetails';
import SaleModals from './components/SaleModals';

const WholesaleSales = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileTab, setMobileTab] = useState(0);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState('');
  const [discount, setDiscount] = useState('');
  const [discountType, setDiscountType] = useState('amount');
  const [isEmi, setIsEmi] = useState(false);
  const [emiDuration, setEmiDuration] = useState(12);
  const [emiInterestRate, setEmiInterestRate] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');
  const [hasManuallyEditedPaidAmount, setHasManuallyEditedPaidAmount] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [assignedSR, setAssignedSR] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [route, setRoute] = useState('');
  const [deliveredBy, setDeliveredBy] = useState('');
  const [invoiceType, setInvoiceType] = useState('Cash');
  const [expense, setExpense] = useState('');
  const [isOperatingExpense, setIsOperatingExpense] = useState(false);
  const [delivery, setDelivery] = useState('');
  const [isOperatingDelivery, setIsOperatingDelivery] = useState(false);
  const [installation, setInstallation] = useState('');
  const [isOperatingInstallation, setIsOperatingInstallation] = useState(false);
  // Split payments state
  const [payments, setPayments] = useState([]);
  const [note, setNote] = useState('');
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    contactName: '',
    contactNumber: '',
    businessName: '',
    email: '',
    address: ''
  });
  const [openRouteDialog, setOpenRouteDialog] = useState(false);
  const [newRoute, setNewRoute] = useState({ name: '', code: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewSaleData, setPreviewSaleData] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSaleData, setPendingSaleData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openLoadQuotation, setOpenLoadQuotation] = useState(false);
  const [loadedQuoteId, setLoadedQuoteId] = useState(quoteId || null);
  
  // Snackbars state
  const [success, setSuccess] = useState('');
  const [error, setError]               = useState('');

  const queryClient = useQueryClient();

  const handleSelectQuotation = (q) => {
    if (!q) return;
    setLoadedQuoteId(q._id);
    if (q.customer?._id) setCustomer(q.customer._id);
    if (q.discount) {
      setDiscount(q.discount.toString());
      setDiscountType('flat');
    }
    if (q.note) setNote(q.note);
    if (q.deliveryCharge) setDelivery(q.deliveryCharge.toString());
    if (q.installationCost) setInstallation(q.installationCost.toString());
    if (q.cardCharge) setCardCharge(q.cardCharge.toString());
    if (q.items && products) {
      const newCart = [];
      q.items.forEach(item => {
        const prod = products.find(p => p._id === (item.product?._id || item.product));
        if (prod) {
          newCart.push({
            product: prod,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || prod.price,
            total: (item.quantity || 1) * (item.unitPrice || prod.price),
            warranties: item.warranties || [],
            serialNumbers: item.serialNumbers || [],
            isGift: false
          });
        }
      });
      if (newCart.length > 0) setCart(newCart);
    }
    setSuccess(`Loaded Quotation #${q.quotationNumber}`);
  };

  // Calculate totals
  const baseSubTotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const totalItemDiscounts = cart.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
  const subTotal = baseSubTotal - totalItemDiscounts; // Subtotal is AFTER product-level offer discounts

  const discountAmount = discountType === 'percent' 
    ? (subTotal * (parseFloat(discount) || 0)) / 100 
    : (parseFloat(discount) || 0);
  const additionalCharges = 
    (isOperatingExpense ? 0 : (parseFloat(expense) || 0)) + 
    (isOperatingDelivery ? 0 : (parseFloat(delivery) || 0)) + 
    (isOperatingInstallation ? 0 : (parseFloat(installation) || 0));
  const total = subTotal - discountAmount + additionalCharges;

  // Sync paidAmount with cart total automatically unless manually overridden
  useEffect(() => {
    if (!hasManuallyEditedPaidAmount) {
      setPaidAmount(total > 0 ? total : '');
    }
  }, [total, hasManuallyEditedPaidAmount]);

  // Fetch products with current stock - USING UNIQUE QUERY KEY TO SOLVE FIRST-RENDER LOADING BUG
  const { data: products, isLoading: productsLoading } = useQuery(
    'wholesaleInventoryProducts',
    async () => {
      // Phase 16: use batch-aware stock — prices reflect actual purchase batches (FIFO)
      const response = await api.get('/api/inventory/current-batches');
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      cacheTime: Infinity,
    }
  );
  
  // Fetch active offers to apply dynamic discounts
  const { data: activeOffers } = useQuery(
    'activeOffersRetail',
    async () => {
      const response = await api.get('/api/offers?isActive=true&type=campaign');
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    },
    {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      cacheTime: Infinity,
    }
  );
  
  // Filter products based on search term (name, model, or color)
  const filteredProducts = products?.filter(item => {
    const s = searchTerm.toLowerCase();
    const nameMatch = item.product?.name && item.product.name.toLowerCase().includes(s);
    const modelMatch = item.product?.model && item.product.model.toLowerCase().includes(s);
    const colorMatch = (item.product?.color && item.product.color.toLowerCase().includes(s)) ||
      (item.product?.colors && item.product.colors.some(c => c.name?.toLowerCase().includes(s)));
    return nameMatch || modelMatch || colorMatch;
  }) || [];

  // Fetch customers
  const { data: customers } = useQuery(
    'customers',
    async () => {
      const response = await api.get('/api/contacts/customers');
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      cacheTime: Infinity,
    }
  );

  const businessCustomers = (customers || []).filter(c => c.customerType === 'Business');

  // Fetch employees for Sold By
  const { data: employees } = useQuery(
    'sales-employees',
    async () => {
      const response = await api.get('/api/users');
      return response.data.data.filter(u => 
        u.role === 'SR' || u.role === 'DSR'
      );
    },
    {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      cacheTime: Infinity,
    }
  );

  const srs = (employees || []).filter(e => e.role === 'SR');
  const dsrs = (employees || []).filter(e => e.role === 'DSR');

  // Fetch Warranty Templates
  const { data: routes } = useQuery(
    'routes',
    async () => {
      const response = await api.get('/api/routes');
      return response.data.data;
    },
    {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      cacheTime: Infinity,
    }
  );

  const { data: templatesRes } = useQuery(
    'warranty-templates',
    async () => {
      const response = await api.get('/api/warranty/templates');
      return response.data;
    },
    {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      cacheTime: Infinity,
    }
  );
  const warrantyTemplates = templatesRes?.data || [];

  // Fetch Quotation if quoteId is present
  const { data: quotation } = useQuery(
    ['quotation-convert', quoteId],
    async () => {
      if (!quoteId) return null;
      const response = await api.get(`/api/quotations/${quoteId}`);
      return response.data.data;
    },
    {
      enabled: !!quoteId,
      refetchOnWindowFocus: false,
    }
  );

  const handleSRChange = (v) => {
    const srId = v ? v._id : '';
    setAssignedSR(srId);
    if (srId && routes) {
      const foundRoute = routes.find(r => r.assignedSR && (r.assignedSR._id === srId || r.assignedSR === srId));
      if (foundRoute) {
        setRoute(foundRoute._id);
      }
    }
  };

  // Initialize cart and fields from quotation when loaded
  useEffect(() => {
    if (quotation && products && products.length > 0) {
      // 1. Set customer
      if (quotation.customer?._id) {
        setCustomer(quotation.customer._id);
      }
      
      // 2. Set discount
      if (quotation.discount) {
        setDiscount(quotation.discount.toString());
        setDiscountType('flat');
      }

      // 3. Set note
      if (quotation.note) {
        setNote(quotation.note);
      }

      // 4. Map extra charges
      if (quotation.deliveryCharge) {
        setDelivery(quotation.deliveryCharge.toString());
      }
      if (quotation.installationCost) {
        setInstallation(quotation.installationCost.toString());
      }
      
      let totalExpense = 0;
      if (quotation.otherCharges && quotation.otherCharges.length > 0) {
        totalExpense += quotation.otherCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
      }
      if (quotation.cardCharge) {
        totalExpense += quotation.cardCharge;
      }
      if (totalExpense > 0) {
        setExpense(totalExpense.toString());
      }

      // 5. Populate cart items
      const newCart = quotation.items.map(quoteItem => {
        // Find corresponding product in products list to get live stock quantity and full details
        const invProduct = products.find(p => p.product?._id === (quoteItem.product?._id || quoteItem.product));
        const currentQty = invProduct ? invProduct.currentQuantity : 0;
        
        // Ensure serial tracking works for converted quotes
        const allAvailableSerials = invProduct?.batches ? invProduct.batches.flatMap(b => b.availableSerials || []) : [];
        const isTrackingSerials = invProduct?.product?.trackSerials || false;
        
        return {
          product: invProduct ? invProduct.product : quoteItem.product,
          currentQuantity: currentQty,
          quantity: quoteItem.quantity,
          unitPrice: quoteItem.unitPrice,
          discount: quoteItem.discount !== undefined ? quoteItem.discount : undefined,
          tax: quoteItem.tax || 0,
          warranties: quoteItem.warranties?.map(w => ({
            templateId: w.templateId?._id || w.templateId,
            duration: w.duration,
            warrantyName: w.warrantyName
          })) || [],
          batches: invProduct?.batches || [],
          trackSerials: isTrackingSerials,
          availableSerials: allAvailableSerials,
          selectedSerials: isTrackingSerials && allAvailableSerials.length >= quoteItem.quantity 
             ? allAvailableSerials.slice(0, quoteItem.quantity) 
             : [],
          serialNumber: isTrackingSerials && allAvailableSerials.length >= quoteItem.quantity
             ? allAvailableSerials.slice(0, quoteItem.quantity).join(', ')
             : ''
        };
      });
      setCart(newCart);
    }
  }, [quotation, products]);

  // Helper to check if a string is a valid ObjectId
  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  // Handle form submission - NOW shows confirmation first with stock validation
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (cart.length === 0) {
      setError('Please add items to cart before creating a sale');
      return;
    }
    
    if (!customer) {
      setError('Please select or enter a customer');
      return;
    }
    
    if (!assignedSR) {
      setError('Please select a Sales Rep (Sold By) before completing the sale');
      return;
    }
    
    setIsSubmitting(true);
    let resolvedCustomerId = customer;
    
    // Check if the customer is a custom-typed name (not a valid ObjectId)
    if (typeof customer === 'string' && !isValidObjectId(customer)) {
      setError('Please select a valid customer from the list or add a new one via the plus icon.');
      setIsSubmitting(false);
      return;
    }
    
    setIsSubmitting(false);
    
    // Validate stock availability - prevent negative inventory
    const stockValidationErrors = [];
    cart.forEach(item => {
      const currentStock = item.currentQuantity || 0;
      if (currentStock < item.quantity) {
        stockValidationErrors.push(
          `${item.product.name}: Requested ${item.quantity}, but only ${currentStock} in stock`
        );
      }
      if (currentStock < 0) {
        stockValidationErrors.push(
          `${item.product.name}: Currently has NEGATIVE stock (${currentStock}). Please update stock!`
        );
      }
    });
    
    if (stockValidationErrors.length > 0) {
      setError('Stock Validation Error: ' + stockValidationErrors.join(', '));
      return;
    }

    // Validate EMI down payment and details
    if (isEmi) {
      const downPayment = hasManuallyEditedPaidAmount && paidAmount === '' ? 0 : parseFloat(paidAmount) || 0;
      if (downPayment < 0) {
        setError('A valid down payment cannot be negative.');
        return;
      }
      
      const duration = parseInt(emiDuration);
      if (!duration || duration <= 0) {
        setError('EMI duration must be a valid number of months (greater than 0).');
        return;
      }
      
      // if (downPayment >= total) {
      //   setError('Down payment cannot be equal or greater than the grand total. If so, process this as a regular sale instead of EMI.');
      //   return;
      // }
    }
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const allWarranties = [];
    
    const saleData = {
      customer: resolvedCustomerId,
      assignedSR: assignedSR || undefined,
      shippingAddress,
      route: route || undefined,
      deliveredBy: deliveredBy || undefined,
      invoiceType: isEmi ? 'EMI' : invoiceType,
      type: 'wholesale',
      invoiceNumber,
      items: cart.map(item => {
        const warrantyNames = item.warranties && item.warranties.length > 0 
          ? item.warranties.map(w => {
              if (w.warrantyName && w.duration) return `${w.warrantyName} (${w.duration} Months)`;
              if (w.warrantyName) return w.warrantyName;
              return `${w.duration} Months`;
            }).join(', ') 
          : 'N/A';
          
        const baseItem = {
          product: item.product._id,
          productName: item.product.name || 'Unknown Product',
          model: item.product.model || '',
          warranty: warrantyNames,
          serialNumber: item.serialNumber || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          tax: item.tax,
          color: item.selectedColor || null
        };
        
        if (item.warranties && item.warranties.length > 0) {
          item.warranties.forEach(w => {
            allWarranties.push({
              productId: item.product._id,
              templateId: w.templateId,
              customDurationMonths: w.duration,
              warrantyName: w.warrantyName
            });
          });
        }
        return baseItem;
      }),
      warrantyData: allWarranties,
      subTotal,
      discount: discountAmount,
      total,
      // Derive paidAmount and paymentMethod from split payments array
      paidAmount: payments.length > 0
        ? payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
        : (hasManuallyEditedPaidAmount && paidAmount === '' ? 0 : (parseFloat(paidAmount) || (isEmi ? 0 : total))),
      dueAmount: isEmi ? 0 : Math.max(0, total - (
        payments.length > 0
          ? payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
          : (hasManuallyEditedPaidAmount && paidAmount === '' ? 0 : (parseFloat(paidAmount) || total))
      )),
      status: isEmi ? 'Completed' : (() => {
        const paid = payments.length > 0
          ? payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
          : (hasManuallyEditedPaidAmount && paidAmount === '' ? 0 : (parseFloat(paidAmount) || total));
        return total <= paid ? 'Completed' : 'Partial';
      })(),
      paymentMethod: payments.length > 1 ? 'Split' : (payments[0]?.method || paymentMethod),
      payments,
      isEmi,
      emiOption: isEmi ? {
        duration: parseInt(emiDuration) || 12,
        interestRate: parseFloat(emiInterestRate) || 0,
        downPayment: hasManuallyEditedPaidAmount && paidAmount === '' ? 0 : (parseFloat(paidAmount) || 0)
      } : undefined,
      note,
      additionalExpense: parseFloat(expense) || 0,
      isOperatingExpense,
      deliveryCharge: parseFloat(delivery) || 0,
      isOperatingDelivery,
      installationCost: parseFloat(installation) || 0,
      isOperatingInstallation
    };
    
    // Store the sale data and show confirmation dialog
    setPendingSaleData(saleData);
    setShowConfirmDialog(true);
  };

  // Handle confirmation - actually create the sale
  const handleConfirmCreateSale = () => {
    if (pendingSaleData) {
      setIsSubmitting(true);
      createSaleMutation.mutate(pendingSaleData);
      setShowConfirmDialog(false);
      setPendingSaleData(null);
    }
  };

  // Handle cancel
  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setPendingSaleData(null);
  };

  // Handle form submission
  const createSaleMutation = useMutation(
    (data) => api.post('/api/sales', data),
    {
      onSuccess: async (response) => {
        setIsSubmitting(false);
        setSuccess('Wholesale sale created successfully!');
        
        const activeQuoteId = quoteId || loadedQuoteId;
        if (activeQuoteId) {
          try {
            await api.post(`/api/quotations/${activeQuoteId}/convert`);
            await queryClient.invalidateQueries('all-quotations');
          } catch (convertError) {
            console.error('Failed to mark quotation as converted:', convertError);
          }
        }
        
        // Invalidate queries to refresh data
        await queryClient.invalidateQueries('sales');
        await queryClient.invalidateQueries('wholesale-records');
        await queryClient.invalidateQueries('dashboardData');
        await queryClient.invalidateQueries('wholesaleInventoryProducts'); // Refresh stock under new unique key
        
        // Reset form
        setCart([]);
        setCustomer('');
        setDiscount('');
        setDiscountType('percent');
        setPaidAmount('');
        setNote('');
        setHasManuallyEditedPaidAmount(false);
        setIsEmi(false);
        setEmiDuration(12);
        setEmiInterestRate(0);
        setExpense('');
        setDelivery('');
        setInstallation('');
        setAssignedSR('');
        setShippingAddress('');
        setRoute('');
        setDeliveredBy('');
        setInvoiceType('Cash');
        
        // Show invoice modal with the completed sale ID
        const saleId = response.data.data._id;
        setCompletedSaleId(saleId);
        setShowInvoiceModal(true);
      },
      onError: (err) => {
        setIsSubmitting(false);
        console.error('[RETAIL SALE] Error creating sale:', err);
        const errorMessage = err.response && err.response.data ? err.response.data.message : err.message;
        setError('Error creating retail sale: ' + errorMessage);
      }
    }
  );

  // Update serial at a specific index in the cart
  const updateCartSerialAtIndex = (productId, index, value) => {
    setCart(cart.map(item => {
      if (item.product._id !== productId) return item;
      const newSerials = [...(item.selectedSerials || [])];
      newSerials[index] = value;
      return {
        ...item,
        selectedSerials: newSerials,
        serialNumber: newSerials.filter(Boolean).join(', ')
      };
    }));
  };

  // Add product to cart
  const addToCart = (item) => {
    const product = item.product;
    const currentQuantity = item.currentQuantity || 0;
    const existingItem = cart.find(cartItem => cartItem.product._id === product._id);
    
    // Extract available serials from all batches for this product
    const allAvailableSerials = item.batches ? item.batches.flatMap(b => b.availableSerials || []) : [];
    const isTrackingSerials = product?.trackSerials || false;
    
    if (existingItem) {
      if (existingItem.quantity >= currentQuantity) {
        setError(`Cannot add more. Live stock is limited to ${currentQuantity} for "${product.name}"`);
        return;
      }
      setCart(cart.map(cartItem => {
        if (cartItem.product._id !== product._id) return cartItem;
        const newQuantity = cartItem.quantity + 1;
        let newSerials = [...(cartItem.selectedSerials || [])];
        const availableToAdd = (cartItem.availableSerials || []).filter(s => !newSerials.includes(s));
        newSerials.push(availableToAdd[0] || '');
        
        return { 
          ...cartItem, 
          quantity: newQuantity,
          selectedSerials: newSerials,
          serialNumber: newSerials.filter(Boolean).join(', ')
        };
      }));
    } else {
      // Find matching template based on product's brand and category
      const matchingTemplates = warrantyTemplates.filter(
        t => t.brand?._id === (product.brand?._id || product.brand) && t.category?._id === (product.category?._id || product.category) && t.isActive
      );
      
      const basePrice = item.sellingPrice || product.sellingPrice || 0;
      let itemDiscount;

      let matchingOffer = null;
      // Check if there is an active offer linked to this product
      if (activeOffers && Array.isArray(activeOffers)) {
        const offer = activeOffers.find(o => {
          const offerProductId = o.product?._id || o.product;
          const itemProductId = product?._id || product;
          return offerProductId && itemProductId && String(offerProductId) === String(itemProductId);
        });
        if (offer) {
          matchingOffer = offer;
          if (offer.discountType === 'flat') {
            itemDiscount = offer.discountAmount || 0;
          } else if (offer.discountType === 'percentage' || offer.discountPercentage) {
            itemDiscount = (basePrice * (offer.discountPercentage || 0)) / 100;
          }
        }
      }
      
      setCart([...cart, {
        product,
        currentQuantity,
        quantity: 1,
        // Phase 16: prefer batch-level sellingPrice (FIFO), fall back to product field
        unitPrice: basePrice,
        discount: itemDiscount,
        offer: matchingOffer,
        tax: 0,
        warranties: matchingTemplates.map(t => ({ templateId: t._id, duration: t.durationMonths, warrantyName: t.name })),
        batches: item.batches || [],
        trackSerials: isTrackingSerials,
        availableSerials: allAvailableSerials,
        selectedSerials: isTrackingSerials && allAvailableSerials.length > 0 ? [allAvailableSerials[0]] : [],
        serialNumber: isTrackingSerials && allAvailableSerials.length > 0 ? allAvailableSerials[0] : '',
        selectedColor: (product.colors && product.colors.length > 0) ? product.colors[0].name : (product.color || null)
      }]);
    }
  };

  // Update selected color in cart
  const updateCartColor = (productId, colorName) => {
    setCart(cart.map(item => {
      if (item.product._id !== productId) return item;
      return { ...item, selectedColor: colorName };
    }));
  };

  // Toggle warranty in cart
  const toggleWarranty = (productId, template) => {
    setCart(cart.map(item => {
      if (item.product._id !== productId) return item;
      
      const hasWarranty = item.warranties.some(w => w.templateId === template._id);
      
      if (hasWarranty) {
        return {
          ...item,
          warranties: item.warranties.filter(w => w.templateId !== template._id)
        };
      } else {
        return {
          ...item,
          warranties: [...item.warranties, { templateId: template._id, duration: template.durationMonths, warrantyName: template.name }]
        };
      }
    }));
  };

  // Update quantity in cart
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const cartItem = cart.find(item => item.product._id === productId);
    if (cartItem && newQuantity > cartItem.currentQuantity) {
      setError(`Insufficient Stock! Available stock for this product is ${cartItem.currentQuantity}`);
      return;
    }
    
    setCart(cart.map(item => {
      if (item.product._id !== productId) return item;
      
      let newSerials = [...(item.selectedSerials || [])];
      if (newSerials.length > newQuantity) {
        newSerials = newSerials.slice(0, newQuantity);
      } else if (newSerials.length < newQuantity) {
        const addedCount = newQuantity - newSerials.length;
        const availableToAdd = (item.availableSerials || []).filter(s => !newSerials.includes(s));
        for (let i = 0; i < addedCount; i++) {
          newSerials.push(availableToAdd[i] || '');
        }
      }
      
      return { 
        ...item, 
        quantity: newQuantity,
        selectedSerials: newSerials,
        serialNumber: newSerials.filter(Boolean).join(', ')
      };
    }));
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product._id !== productId));
  };

  // Update discount for cart item
  const updateDiscount = (productId, newDiscount) => {
    setCart(prev => prev.map(item => {
      if (item.product._id !== productId) return item;
      // Store 0 as a valid value so controlled input stays stable while typing;
      // clamp upper bound to unit price
      const clamped = Math.max(0, Math.min(newDiscount, item.unitPrice));
      return { ...item, discount: clamped };
    }));
  };

  // Update unit price for a cart item (wholesale-specific — reps can negotiate line prices)
  const updateUnitPrice = (productId, newPrice) => {
    setCart(prev => prev.map(item => {
      if (item.product._id !== productId) return item;
      const price = Math.max(0, parseFloat(newPrice) || 0);
      return { ...item, unitPrice: price };
    }));
  };

  // Show invoice preview
  const handleShowPreview = () => {
    if (cart.length === 0) {
      setError('Please add items to cart first');
      return;
    }
    
    // Generate preview invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Resolve customer info for preview
    let previewCustomer = { contactName: 'Walk-in Customer' };
    if (customer) {
      if (isValidObjectId(customer)) {
        const found = customers?.find(c => c._id === customer);
        if (found) previewCustomer = found;
      } else {
        previewCustomer = { contactName: customer };
      }
    }
    
    const previewData = {
      invoiceNumber,
      customer: previewCustomer,
      assignedSR: assignedSR || undefined,
      date: new Date().toISOString().split('T')[0],
      items: cart.map(item => ({
        product: item.product,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: item.tax,
        warranties: item.warranties || []
      })),
      subTotal,
      discount: discountAmount,
      tax: cart.reduce((sum, item) => sum + (item.tax || 0), 0),
      total,
      paidAmount: parseFloat(paidAmount) || total,
      dueAmount: Math.max(0, total - (parseFloat(paidAmount) || total)),
      paymentMethod,
      status: 'Preview',
      note,
      additionalExpense: parseFloat(expense) || 0,
      deliveryCharge: parseFloat(delivery) || 0,
      installationCost: parseFloat(installation) || 0
    };
    
    setPreviewSaleData(previewData);
    setShowPreviewDialog(true);
  };

  // Handle customer creation
  const handleCreateCustomer = async () => {
    if (!newCustomer.contactName || !newCustomer.contactNumber || !newCustomer.businessName) {
      setError('Business Name, Contact Name and Phone Number are required!');
      return;
    }

    try {
      const response = await api.post('/api/contacts/customers', {
        ...newCustomer,
        contactType: 'Customer',
        customerType: 'Business'
      });
      setSuccess('New business customer created successfully!');
      
      // Update local cache immediately so the newly created customer's name renders in the dropdown
      queryClient.setQueryData('customers', old => {
        return old ? [...old, response.data.data] : [response.data.data];
      });
      
      await queryClient.invalidateQueries('customers');
      setCustomer(response.data.data._id);
      setOpenCustomerDialog(false);
      setNewCustomer({
        contactName: '',
        contactNumber: '',
        businessName: '',
        email: '',
        address: ''
      });
    } catch (err) {
      const errorMessage = err.response && err.response.data ? err.response.data.message : err.message;
      setError('Failed to create customer: ' + errorMessage);
    }
  };

  const handleCreateRoute = async () => {
    if (!newRoute.name || !newRoute.code) {
      setError('Route Name and Code are required!');
      return;
    }
    try {
      const response = await api.post('/api/routes', {
        name: newRoute.name,
        code: newRoute.code,
        assignedSR: assignedSR || undefined
      });
      setSuccess('New route created successfully!');
      
      queryClient.setQueryData('routes', old => {
        return old ? [...old, response.data.data] : [response.data.data];
      });
      await queryClient.invalidateQueries('routes');
      setRoute(response.data.data._id);
      setOpenRouteDialog(false);
      setNewRoute({ name: '', code: '' });
    } catch (err) {
      setError('Failed to create route: ' + (err.response?.data?.message || err.message));
    }
  };

  // ── Wholesale colour tokens ────────────────────────────────────
  const WS_BLUE       = '#2563EB';
  const WS_BLUE_DARK  = '#1D4ED8';
  const WS_BLUE_BG    = '#EFF6FF';
  const WS_BLUE_BORD  = '#BFDBFE';

  // Shared input sx for the header strip fields
  const wsInputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: '#FFFFFF',
      fontSize: '12px',
      '& fieldset': { borderColor: WS_BLUE_BORD },
      '&:hover fieldset': { borderColor: WS_BLUE },
      '&.Mui-focused fieldset': { borderColor: WS_BLUE },
    },
    '& .MuiInputLabel-root': { fontSize: '12px' },
  };

  return (
    <Box sx={{
      height: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      p: isMobile ? 1 : 1.5,
      backgroundColor: '#F8FAFC',
      boxSizing: 'border-box',
    }}>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MODULE HEADER STRIP — the primary visual differentiator
          Contains: B2B badge · Customer · Sales Rep · Route ·
                    Invoice Type · Delivered By · [Load Quote btn]
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Paper
        elevation={0}
        sx={{
          mb: isMobile ? 1 : 1.25,
          borderRadius: '12px',
          border: `1px solid ${WS_BLUE_BORD}`,
          borderLeft: `4px solid ${WS_BLUE}`,
          backgroundColor: WS_BLUE_BG,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {isMobile ? (
          /* ── Compact mobile header ── */
          <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon sx={{ fontSize: 16, color: WS_BLUE }} />
              <Chip
                label="­B2B WHOLESALE"
                size="small"
                sx={{
                  backgroundColor: WS_BLUE,
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '9px',
                  height: 20,
                  borderRadius: '4px',
                  letterSpacing: '0.5px',
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {cart.length > 0 && (
                <Chip
                  label={`${cart.reduce((s, i) => s + i.quantity, 0)} units · ৳${total.toFixed(0)}`}
                  size="small"
                  sx={{ backgroundColor: '#DBEAFE', color: WS_BLUE, fontWeight: 700, fontSize: '10px', height: 20 }}
                />
              )}
              <Button
                size="small"
                variant="outlined"
                onClick={() => setOpenLoadQuotation(true)}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '10px', borderRadius: '6px', py: 0.2, borderColor: WS_BLUE, color: WS_BLUE }}
              >
                Load Quote
              </Button>
            </Box>
          </Box>
        ) : (
          /* ── Full desktop header strip ── */
          <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'nowrap', overflowX: 'auto' }}>
            
            {/* Badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
              <BusinessIcon sx={{ fontSize: 18, color: WS_BLUE }} />
              <Chip
                label="B2B WHOLESALE"
                size="small"
                sx={{
                  backgroundColor: WS_BLUE,
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '9.5px',
                  height: 22,
                  borderRadius: '4px',
                  letterSpacing: '0.5px',
                }}
              />
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: WS_BLUE_BORD }} />

            {/* ── Customer ── */}
            <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0, minWidth: 200 }}>
              <Autocomplete
                size="small"
                sx={{ width: 200 }}
                options={businessCustomers}
                getOptionLabel={(o) => o.businessName ? `${o.businessName} (${o.contactName}) - ${o.contactNumber}` : (o.contactName ? `${o.contactName} - ${o.contactNumber}` : '')}
                value={businessCustomers.find(c => c._id === customer) || null}
                onChange={(_, v) => setCustomer(v ? v._id : '')}
                renderInput={(params) => (
                  <TextField {...params} label="Business Customer *" required sx={wsInputSx} />
                )}
              />
              <IconButton
                size="small"
                onClick={() => setOpenCustomerDialog(true)}
                sx={{ border: `1px solid ${WS_BLUE_BORD}`, borderRadius: '8px', p: 0.75, color: WS_BLUE, backgroundColor: '#FFFFFF', '&:hover': { backgroundColor: WS_BLUE_BG } }}
              >
                <AddIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>

            {/* ── Sold By ── */}
            <Autocomplete
              size="small"
              sx={{ flexShrink: 0, minWidth: 175 }}
              options={srs}
              getOptionLabel={(o) => `${o.name} (${o.role})`}
              value={srs.find(e => e._id === assignedSR) || null}
              onChange={(_, v) => handleSRChange(v)}
              renderInput={(params) => (
                <TextField {...params} label="Sold By (SR) *" sx={wsInputSx} />
              )}
            />

            {/* ── Route ── */}
            <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0, minWidth: 145 }}>
              <Autocomplete
                size="small"
                sx={{ flexGrow: 1 }}
                options={routes || []}
                getOptionLabel={(o) => o.name}
                value={(routes || []).find(r => r._id === route) || null}
                onChange={(_, v) => setRoute(v ? v._id : '')}
                renderInput={(params) => (
                  <TextField {...params} label="Route" sx={wsInputSx} />
                )}
              />
              <IconButton
                size="small"
                onClick={() => setOpenRouteDialog(true)}
                sx={{ border: `1px solid ${WS_BLUE_BORD}`, borderRadius: '8px', p: 0.75, color: WS_BLUE, backgroundColor: '#FFFFFF', '&:hover': { backgroundColor: WS_BLUE_BG } }}
              >
                <AddIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>

            {/* ── Invoice Type ── */}
            <FormControl size="small" sx={{ flexShrink: 0, minWidth: 130 }}>
              <InputLabel sx={{ fontSize: '12px' }}>Invoice Type</InputLabel>
              <Select
                value={invoiceType}
                onChange={(e) => setInvoiceType(e.target.value)}
                label="Invoice Type"
                sx={{ borderRadius: '8px', backgroundColor: '#FFFFFF', fontSize: '12px', '& .MuiOutlinedInput-notchedOutline': { borderColor: WS_BLUE_BORD } }}
              >
                <MenuItem value="Cash"   sx={{ fontSize: '12px' }}>Cash</MenuItem>
                <MenuItem value="Credit" sx={{ fontSize: '12px' }}>Credit</MenuItem>
                <MenuItem value="Delivery" sx={{ fontSize: '12px' }}>Delivery</MenuItem>
                <MenuItem value="Tax"    sx={{ fontSize: '12px' }}>Tax</MenuItem>
                <MenuItem value="VAT Adjustment" sx={{ fontSize: '12px' }}>VAT Adjustment</MenuItem>
              </Select>
            </FormControl>

            {/* ── Delivered By ── */}
            <Autocomplete
              size="small"
              sx={{ flexShrink: 0, minWidth: 145 }}
              options={dsrs}
              getOptionLabel={(o) => `${o.name} (${o.role})`}
              value={dsrs.find(e => e._id === deliveredBy) || null}
              onChange={(_, v) => setDeliveredBy(v ? v._id : '')}
              renderInput={(params) => (
                <TextField {...params} label="Delivered By (DSR)" sx={wsInputSx} />
              )}
            />

            {/* Spacer */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Load Quote */}
            <Button
              size="small"
              variant="outlined"
              onClick={() => setOpenLoadQuotation(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '12px',
                borderRadius: '8px',
                py: 0.6,
                borderColor: WS_BLUE,
                color: WS_BLUE,
                flexShrink: 0,
                '&:hover': { backgroundColor: WS_BLUE_BG, borderColor: WS_BLUE_DARK },
              }}
            >
              📋 Load Quote
            </Button>
          </Box>
        )}
      </Paper>

      {/* â•â•â•â•â•â•â•â•â•â•â•â• MOBILE TABBED LAYOUT â•â•â•â•â•â•â•â•â•â•â•â• */}
      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>

          {/* Mobile Tabs */}
          <Paper elevation={0} sx={{ borderRadius: '12px', mb: 1, border: '1px solid #E2E8F0', overflow: 'hidden', flexShrink: 0 }}>
            <Tabs
              value={mobileTab}
              onChange={(_, val) => setMobileTab(val)}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
              sx={{
                minHeight: '44px',
                '& .MuiTab-root': { fontSize: '13px', fontWeight: 600, minHeight: '44px', textTransform: 'none', color: '#64748B', '&.Mui-selected': { color: WS_BLUE } },
                '& .MuiTabs-indicator': { backgroundColor: WS_BLUE, height: '3px' },
              }}
            >
              <Tab icon={<ShoppingCartIcon sx={{ fontSize: 14 }} />} iconPosition="start" label={`Order Pad (${cart.length})`} />
              <Tab label="Review & Payment" />
            </Tabs>
          </Paper>

          {/* TAB 0: Order Pad */}
          {mobileTab === 0 ? (
            <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0, borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <Box sx={{ px: 1.5, py: 0.75, borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#1E293B' }}>Order Lines</Typography>
                {cart.length > 0 && (
                  <Typography sx={{ fontSize: '11px', color: WS_BLUE, fontWeight: 600 }}>
                    {cart.reduce((s, i) => s + i.quantity, 0)} units
                  </Typography>
                )}
              </Box>
              <WholesaleOrderPad
                isMobile
                cart={cart}
                products={products}
                addToCart={addToCart}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                updateDiscount={updateDiscount}
                updateUnitPrice={updateUnitPrice}
              />
            </Paper>
          ) : (
            /* TAB 1: Review & Payment */
            <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5, pb: 4 }}>

              {/* Logistics fields */}
              <Paper sx={{ p: 1.5, borderRadius: '12px', border: '1px solid #E2E8F0', borderLeft: `3px solid ${WS_BLUE}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '12px', color: '#1E293B', mb: 1.25 }}>Order Configuration</Typography>
                <Grid container spacing={1.25}>
                  {/* Customer */}
                  <CustomerSelection
                    customers={businessCustomers}
                    isBusiness={true}
                    customer={customer}
                    setCustomer={setCustomer}
                    openCustomerDialog={openCustomerDialog}
                    setOpenCustomerDialog={setOpenCustomerDialog}
                    newCustomer={newCustomer}
                    setNewCustomer={setNewCustomer}
                    handleCreateCustomer={handleCreateCustomer}
                  />
                  {/* Sold By */}
                  <Grid item xs={12}>
                    <Autocomplete
                      size="small"
                      options={srs}
                      getOptionLabel={(o) => `${o.name} (${o.role})`}
                      value={srs.find(e => e._id === assignedSR) || null}
                      onChange={(_, v) => handleSRChange(v)}
                      renderInput={(params) => <TextField {...params} label="Sold By (SR)" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />}
                    />
                  </Grid>
                  {/* Route */}
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                      <Autocomplete
                        size="small"
                        sx={{ flexGrow: 1 }}
                        options={routes || []}
                        getOptionLabel={(o) => o.name}
                        value={(routes || []).find(r => r._id === route) || null}
                        onChange={(_, v) => setRoute(v ? v._id : '')}
                        renderInput={(params) => <TextField {...params} label="Route" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />}
                      />
                      <IconButton
                        size="small"
                        onClick={() => setOpenRouteDialog(true)}
                        sx={{ border: `1px solid ${WS_BLUE_BORD}`, borderRadius: '8px', p: 0.75, color: WS_BLUE, backgroundColor: '#FFFFFF', '&:hover': { backgroundColor: WS_BLUE_BG } }}
                      >
                        <AddIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Grid>
                  {/* Invoice Type */}
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ fontSize: '12px' }}>Invoice Type</InputLabel>
                      <Select
                        value={invoiceType}
                        onChange={(e) => setInvoiceType(e.target.value)}
                        label="Invoice Type"
                        sx={{ borderRadius: '8px', fontSize: '12px' }}
                      >
                        <MenuItem value="Cash">Cash</MenuItem>
                        <MenuItem value="Credit">Credit</MenuItem>
                        <MenuItem value="Delivery">Delivery</MenuItem>
                        <MenuItem value="Tax">Tax</MenuItem>
                        <MenuItem value="VAT Adjustment">VAT Adjustment</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {/* Delivered By */}
                  <Grid item xs={12}>
                    <Autocomplete
                      size="small"
                      options={dsrs}
                      getOptionLabel={(o) => `${o.name} (${o.role})`}
                      value={dsrs.find(e => e._id === deliveredBy) || null}
                      onChange={(_, v) => setDeliveredBy(v ? v._id : '')}
                      renderInput={(params) => <TextField {...params} label="Delivered By (DSR)" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />}
                    />
                  </Grid>
                  {/* Shipping Address */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth size="small"
                      label="Shipping Address"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      InputProps={{ sx: { borderRadius: '8px' } }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Payment Details */}
              <Paper sx={{ p: 1.5, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <Grid container spacing={1.25}>
                  <PaymentDetails
                    isEmi={isEmi} setIsEmi={setIsEmi}
                    paidAmount={paidAmount} setPaidAmount={setPaidAmount}
                    setHasManuallyEditedPaidAmount={setHasManuallyEditedPaidAmount}
                    emiDuration={emiDuration} setEmiDuration={setEmiDuration}
                    emiInterestRate={emiInterestRate} setEmiInterestRate={setEmiInterestRate}
                    discount={discount} setDiscount={setDiscount}
                    discountType={discountType} setDiscountType={setDiscountType}
                    grandTotal={total}
                    onPaymentsChange={(p, paid) => { setPayments(p); setPaidAmount(paid); }}
                    expense={expense} setExpense={setExpense}
                    delivery={delivery} setDelivery={setDelivery}
                    installation={installation} setInstallation={setInstallation}
                    isOperatingExpense={isOperatingExpense} setIsOperatingExpense={setIsOperatingExpense}
                    isOperatingDelivery={isOperatingDelivery} setIsOperatingDelivery={setIsOperatingDelivery}
                    isOperatingInstallation={isOperatingInstallation} setIsOperatingInstallation={setIsOperatingInstallation}
                  />
                </Grid>
              </Paper>

              {/* Note */}
              <Paper sx={{ p: 1.5, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <TextField
                  fullWidth multiline rows={2} size="small"
                  placeholder="Order notes / remarks..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '12px' } }}
                />
              </Paper>

              {/* Totals + Actions */}
              <Paper sx={{ p: 1.5, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '12px', mb: 1 }}>Order Summary</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '12px', color: '#64748B' }}>Sub Total:</Typography>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>৳{subTotal.toFixed(2)}</Typography>
                  </Box>
                  {discountAmount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '12px', color: '#64748B' }}>Discount:</Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#EF4444' }}>-৳{discountAmount.toFixed(2)}</Typography>
                    </Box>
                  )}
                  {parseFloat(expense) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '12px', color: '#64748B' }}>Expense:</Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>৳{parseFloat(expense).toFixed(2)}</Typography>
                    </Box>
                  )}
                  {parseFloat(delivery) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '12px', color: '#64748B' }}>Delivery:</Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>৳{parseFloat(delivery).toFixed(2)}</Typography>
                    </Box>
                  )}
                  {parseFloat(installation) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '12px', color: '#64748B' }}>Installation:</Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>৳{parseFloat(installation).toFixed(2)}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.75, borderTop: '2px solid #E2E8F0', mt: 0.25 }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700 }}>Grand Total:</Typography>
                    <Typography sx={{ fontSize: '15px', fontWeight: 800, color: WS_BLUE }}>৳{total.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '12px', color: '#64748B' }}>Paid:</Typography>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: WS_BLUE }}>৳{(parseFloat(paidAmount) || 0).toFixed(2)}</Typography>
                  </Box>
                </Box>

                {/* Due ribbon */}
                {!isEmi && (() => {
                  const due = total - (parseFloat(paidAmount) || 0);
                  const ok  = due <= 0;
                  return (
                    <Box sx={{ p: 1, borderRadius: '8px', mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: ok ? '#D1FAE5' : '#FEE2E2', border: '1px solid', borderColor: ok ? '#10B981' : '#EF4444' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: ok ? '#059669' : '#B91C1C' }}>{ok ? '✅ Fully Paid' : '⚠️ Due Balance'}</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: '13px', color: ok ? '#059669' : '#B91C1C' }}>৳{Math.max(0, due).toFixed(2)}</Typography>
                    </Box>
                  );
                })()}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={handleShowPreview}
                    disabled={cart.length === 0}
                    sx={{ flexGrow: 1, py: 1, borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '12px', borderColor: '#E2E8F0', color: '#64748B', '&:hover': { borderColor: WS_BLUE, color: WS_BLUE } }}
                  >
                    📄 Preview
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isSubmitting || cart.length === 0}
                    sx={{ flexGrow: 2.5, py: 1, borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '13px', backgroundColor: WS_BLUE, boxShadow: `0 4px 12px rgba(37,99,235,0.25)`, '&:hover': { backgroundColor: WS_BLUE_DARK } }}
                  >
                    {isSubmitting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : `✅ Confirm Order · ৳${total.toFixed(0)}`}
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}
        </Box>

      ) : (
        /* â•â•â•â•â•â•â•â•â•â•â•â• DESKTOP LAYOUT â•â•â•â•â•â•â•â•â•â•â•â• */
        <Grid container spacing={1.5} sx={{ flexGrow: 1, minHeight: 0, height: '100%' }}>

          {/* ── Left 7.5: Wholesale Order Pad ── */}
          <Grid item xs={12} md={7.5} sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Paper
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                overflow: 'hidden',
              }}
            >
              {/* Order pad header */}
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  borderBottom: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#1E293B' }}>
                  Order Lines
                  {cart.length > 0 && (
                    <Chip label={`${cart.length} product${cart.length > 1 ? 's' : ''}`} size="small" sx={{ ml: 0.75, height: 18, fontSize: '10px', backgroundColor: '#DBEAFE', color: WS_BLUE, fontWeight: 700 }} />
                  )}
                </Typography>
                {cart.length > 0 && (
                  <Typography sx={{ fontSize: '11px', color: WS_BLUE, fontWeight: 700 }}>
                    {cart.reduce((s, i) => s + i.quantity, 0)} total units
                  </Typography>
                )}
              </Box>

              {/* Order pad table — grows to fill height */}
              <WholesaleOrderPad
                isMobile={false}
                cart={cart}
                products={products}
                addToCart={addToCart}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                updateDiscount={updateDiscount}
                updateUnitPrice={updateUnitPrice}
              />

              {/* Notes */}
              <TextField
                fullWidth
                placeholder="Order notes / remarks…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                size="small"
                multiline
                rows={1.5}
                sx={{
                  px: 1, pb: 1, flexShrink: 0,
                  '& .MuiOutlinedInput-root': {
                    fontSize: '11px',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    '& fieldset': { borderColor: '#E2E8F0' },
                    '&:hover fieldset': { borderColor: '#CBD5E1' },
                    '&.Mui-focused fieldset': { borderColor: WS_BLUE },
                  },
                }}
              />
            </Paper>
          </Grid>

          {/* ── Right 4.5: B2B Config Panel ── */}
          <Grid item xs={12} md={4.5} sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <form
              onSubmit={handleSubmit}
              style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}
            >

              {/* ── Shipping Address ── */}
              <Paper
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  borderLeft: `3px solid ${WS_BLUE}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  flexShrink: 0,
                }}
              >
                <TextField
                  fullWidth size="small"
                  label="Shipping / Delivery Address"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter delivery address for this order…"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocalShippingIcon sx={{ fontSize: 15, color: WS_BLUE }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '8px' },
                  }}
                />
              </Paper>

              {/* ── Payment Details ── */}
              <Paper
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  flexShrink: 0,
                }}
              >
                <Grid container spacing={1.25}>
                  <PaymentDetails
                    isEmi={isEmi} setIsEmi={setIsEmi}
                    paidAmount={paidAmount} setPaidAmount={setPaidAmount}
                    setHasManuallyEditedPaidAmount={setHasManuallyEditedPaidAmount}
                    emiDuration={emiDuration} setEmiDuration={setEmiDuration}
                    emiInterestRate={emiInterestRate} setEmiInterestRate={setEmiInterestRate}
                    discount={discount} setDiscount={setDiscount}
                    discountType={discountType} setDiscountType={setDiscountType}
                    grandTotal={total}
                    onPaymentsChange={(p, paid) => { setPayments(p); setPaidAmount(paid); }}
                    expense={expense} setExpense={setExpense}
                    delivery={delivery} setDelivery={setDelivery}
                    installation={installation} setInstallation={setInstallation}
                    isOperatingExpense={isOperatingExpense} setIsOperatingExpense={setIsOperatingExpense}
                    isOperatingDelivery={isOperatingDelivery} setIsOperatingDelivery={setIsOperatingDelivery}
                    isOperatingInstallation={isOperatingInstallation} setIsOperatingInstallation={setIsOperatingInstallation}
                  />
                </Grid>
              </Paper>

              {/* ── Order Summary & Actions ── */}
              <Paper
                sx={{
                  flexGrow: 1,
                  p: 1.5,
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#1E293B' }}>Order Summary</Typography>
                    {cart.length > 0 && (
                      <Typography sx={{ fontSize: '10px', color: WS_BLUE, fontWeight: 600 }}>
                        {cart.reduce((s, i) => s + i.quantity, 0)} units across {cart.length} SKUs
                      </Typography>
                    )}
                  </Box>

                  {/* Financial rows */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '12px', color: '#64748B' }}>Sub Total:</Typography>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>৳{subTotal.toFixed(2)}</Typography>
                  </Box>
                  {discountAmount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '12px', color: '#64748B' }}>Discount:</Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#EF4444' }}>-৳{discountAmount.toFixed(2)}</Typography>
                    </Box>
                  )}
                  {parseFloat(expense) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '12px', color: '#64748B' }}>Expense:</Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>৳{parseFloat(expense).toFixed(2)}</Typography>
                    </Box>
                  )}
                  {parseFloat(delivery) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '12px', color: '#64748B' }}>Delivery:</Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>৳{parseFloat(delivery).toFixed(2)}</Typography>
                    </Box>
                  )}
                  {parseFloat(installation) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '12px', color: '#64748B' }}>Installation:</Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>৳{parseFloat(installation).toFixed(2)}</Typography>
                    </Box>
                  )}

                  {/* Grand total divider row */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.75, mt: 0.25, borderTop: `2px solid ${WS_BLUE_BORD}` }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>Grand Total:</Typography>
                    <Typography sx={{ fontSize: '15px', fontWeight: 800, color: WS_BLUE }}>৳{total.toFixed(2)}</Typography>
                  </Box>

                  {/* EMI breakdown or paid row */}
                  {isEmi ? (() => {
                    const downPayment    = parseFloat(paidAmount) || 0;
                    const interestRate   = parseFloat(emiInterestRate) || 0;
                    const interestAmt    = total * (interestRate / 100);
                    const totalPayable   = total + interestAmt - downPayment;
                    const monthlyInstalment = totalPayable / (parseInt(emiDuration) || 12);
                    return (
                      <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontSize: '12px', color: '#64748B' }}>Down Payment:</Typography>
                          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#10B981' }}>৳{downPayment.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontSize: '12px', color: '#64748B' }}>Interest ({interestRate}%):</Typography>
                          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#F59E0B' }}>+৳{interestAmt.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5, borderTop: '1px dashed #E2E8F0', mt: 0.5 }}>
                          <Typography sx={{ fontSize: '12px', fontWeight: 700 }}>Monthly ({parseInt(emiDuration) || 12} mos):</Typography>
                          <Typography sx={{ fontSize: '13px', fontWeight: 800, color: '#8B5CF6' }}>৳{monthlyInstalment.toFixed(2)}</Typography>
                        </Box>
                      </>
                    );
                  })() : (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '12px', color: '#64748B' }}>Paid:</Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: WS_BLUE }}>৳{(parseFloat(paidAmount) || 0).toFixed(2)}</Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {/* Due balance ribbon */}
                  {!isEmi && (() => {
                    const due = total - (parseFloat(paidAmount) || 0);
                    const ok  = due <= 0;
                    return (
                      <Box sx={{ p: 0.75, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: ok ? '#D1FAE5' : '#FEE2E2', border: '1px solid', borderColor: ok ? '#10B981' : '#EF4444' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', color: ok ? '#059669' : '#B91C1C' }}>{ok ? '✅ Fully Paid' : '⚠️ Due Balance'}</Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: '12px', color: ok ? '#059669' : '#B91C1C' }}>৳{Math.max(0, due).toFixed(2)}</Typography>
                      </Box>
                    );
                  })()}

                  {/* Action buttons */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={handleShowPreview}
                      disabled={cart.length === 0}
                      sx={{
                        flexGrow: 1,
                        py: 0.75,
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '12px',
                        borderColor: '#E2E8F0',
                        color: '#64748B',
                        '&:hover': { borderColor: WS_BLUE, color: WS_BLUE, backgroundColor: WS_BLUE_BG },
                      }}
                    >
                      📄 Preview
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={isSubmitting || cart.length === 0}
                      sx={{
                        flexGrow: 2.5,
                        py: 0.75,
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '12.5px',
                        backgroundColor: WS_BLUE,
                        boxShadow: `0 4px 12px rgba(37,99,235,0.2)`,
                        '&:hover': { backgroundColor: WS_BLUE_DARK, boxShadow: `0 6px 16px rgba(37,99,235,0.3)`, transform: 'translateY(-0.5px)' },
                      }}
                    >
                      {isSubmitting ? (
                        <CircularProgress size={18} sx={{ color: 'white' }} />
                      ) : (
                        `✅ Confirm Order · ৳${total.toFixed(0)}`
                      )}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </form>
          </Grid>
        </Grid>
      )}

      {/* ── Add Customer Dialog ── */}
      <Dialog
        open={openCustomerDialog}
        onClose={() => setOpenCustomerDialog(false)}
        PaperProps={{ sx: { borderRadius: '12px', bgcolor: '#FFFFFF', minWidth: 400 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #E2E8F0', pb: 1.5 }}>Add New Business Customer</DialogTitle>
        <DialogContent sx={{ mt: 1.5 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Business Name *" value={newCustomer.businessName} onChange={(e) => setNewCustomer({ ...newCustomer, businessName: e.target.value })} InputProps={{ sx: { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Contact Name *" value={newCustomer.contactName} onChange={(e) => setNewCustomer({ ...newCustomer, contactName: e.target.value })} InputProps={{ sx: { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Phone Number *" value={newCustomer.contactNumber} onChange={(e) => setNewCustomer({ ...newCustomer, contactNumber: e.target.value })} InputProps={{ sx: { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Email" type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} InputProps={{ sx: { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Address" multiline rows={2} value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} InputProps={{ sx: { borderRadius: '8px' } }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0', gap: 1 }}>
          <Button onClick={() => setOpenCustomerDialog(false)} sx={{ color: '#94A3B8' }}>Cancel</Button>
          <Button onClick={handleCreateCustomer} variant="contained" sx={{ backgroundColor: WS_BLUE, borderRadius: '8px', textTransform: 'none', fontWeight: 600, '&:hover': { backgroundColor: WS_BLUE_DARK } }}>Add Business</Button>
        </DialogActions>
      </Dialog>

      {/* ── Add Route Dialog ── */}
      <Dialog
        open={openRouteDialog}
        onClose={() => setOpenRouteDialog(false)}
        PaperProps={{ sx: { borderRadius: '12px', bgcolor: '#FFFFFF', minWidth: 400 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #E2E8F0', pb: 1.5 }}>Add New Route</DialogTitle>
        <DialogContent sx={{ mt: 1.5 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Route Name *" value={newRoute.name} onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })} InputProps={{ sx: { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Route Code *" value={newRoute.code} onChange={(e) => setNewRoute({ ...newRoute, code: e.target.value })} InputProps={{ sx: { borderRadius: '8px' } }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0', gap: 1 }}>
          <Button onClick={() => setOpenRouteDialog(false)} sx={{ color: '#94A3B8' }}>Cancel</Button>
          <Button onClick={handleCreateRoute} variant="contained" sx={{ backgroundColor: WS_BLUE, borderRadius: '8px', textTransform: 'none', fontWeight: 600, '&:hover': { backgroundColor: WS_BLUE_DARK } }}>Add Route</Button>
        </DialogActions>
      </Dialog>

      {/* ── Invoice Modal ── */}
      <PrintInvoiceModal open={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} saleId={completedSaleId} />

      <SaleModals
        showPreviewDialog={showPreviewDialog}
        setShowPreviewDialog={setShowPreviewDialog}
        previewSaleData={previewSaleData}
        showConfirmDialog={showConfirmDialog}
        handleCancelConfirm={handleCancelConfirm}
        handleConfirmCreateSale={handleConfirmCreateSale}
        pendingSaleData={pendingSaleData}
        customers={customers}
        handleSubmit={handleSubmit}
      />

      {/* ── Toast Snackbars ── */}
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" sx={{ width: '100%', borderRadius: '8px', boxShadow: 3 }}>{success}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="error" sx={{ width: '100%', borderRadius: '8px', boxShadow: 3 }}>{error}</Alert>
      </Snackbar>

      <LoadQuotationModal open={openLoadQuotation} onClose={() => setOpenLoadQuotation(false)} onSelectQuotation={handleSelectQuotation} />
    </Box>
  );
};

export default WholesaleSales;
