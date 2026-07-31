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
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';

import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import PrintInvoiceModal from '../../components/invoices/PrintInvoiceModal';
import LoadQuotationModal from '../../components/LoadQuotationModal';
import ProductCatalog from './components/ProductCatalog';
import CartTable from './components/CartTable';
import CustomerSelection from './components/CustomerSelection';
import PaymentDetails from './components/PaymentDetails';
import SaleModals from './components/SaleModals';

const RetailSales = () => {
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
    email: '',
    address: ''
  });
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
    'retailInventoryProducts',
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

  // Fetch employees for Sold By
  const { data: employees } = useQuery(
    'sales-employees',
    async () => {
      const response = await api.get('/api/users');
      return response.data.data.filter(u => 
        u.role !== 'Online Customer' && 
        u.role !== 'Customer' &&
        u.role !== 'Investor'
      );
    },
    {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      cacheTime: Infinity,
    }
  );

  // Fetch Warranty Templates
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
      type: 'retail',
      invoiceType: isEmi ? 'EMI' : 'Cash',
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
          tax: item.tax
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
        setSuccess('Retail sale created successfully!');
        
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
        await queryClient.invalidateQueries('retail-records');
        await queryClient.invalidateQueries('dashboardData');
        await queryClient.invalidateQueries('retailInventoryProducts'); // Refresh stock under new unique key
        
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
        serialNumber: isTrackingSerials && allAvailableSerials.length > 0 ? allAvailableSerials[0] : ''
      }]);
    }
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
    if (!newCustomer.contactName || !newCustomer.contactNumber) {
      setError('Customer Name and Phone Number are required!');
      return;
    }

    try {
      const response = await api.post('/api/contacts/customers', {
        ...newCustomer,
        contactType: 'Customer'
      });
      setSuccess('New customer created successfully!');
      
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
        email: '',
        address: ''
      });
    } catch (err) {
      const errorMessage = err.response && err.response.data ? err.response.data.message : err.message;
      setError('Failed to create customer: ' + errorMessage);
    }
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
      {isMobile ? (
        // MOBILE TABBED LAYOUT
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          {/* Mobile Tabs Header */}
          <Paper elevation={0} sx={{ 
            borderRadius: '12px', 
            mb: 1, 
            border: '1px solid #E2E8F0', 
            overflow: 'hidden'
          }}>
            <Tabs 
              value={mobileTab} 
              onChange={(e, val) => setMobileTab(val)}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
              sx={{
                minHeight: '44px',
                '& .MuiTab-root': {
                  fontSize: '13px',
                  fontWeight: 600,
                  minHeight: '44px',
                  textTransform: 'none',
                  color: '#64748B',
                  '&.Mui-selected': {
                    color: '#6366F1',
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#6366F1',
                  height: '3px'
                }
              }}
            >
              <Tab label={`Products (${filteredProducts.length})`} />
              <Tab 
                icon={<ShoppingCartIcon sx={{ fontSize: 16, mr: 0.5 }} />}
                iconPosition="start"
                label={`Cart & Checkout (${cart.length})`} 
              />
            </Tabs>
          </Paper>

          {/* Tab Content Panels */}
          {mobileTab === 0 ? (
            // TAB 0: PRODUCTS CATALOG
            <ProductCatalog
              isMobile={true}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredProducts={filteredProducts}
              productsLoading={productsLoading}
              addToCart={addToCart}
              cart={cart}
              total={total}
              setMobileTab={setMobileTab}
              activeOffers={activeOffers}
            />
          ) : (
            // TAB 1: CART REVIEW & CHECKOUT FORM
            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, overflowY: 'auto', pb: 4 }}>
              
              {/* Cart List */}
              <CartTable
                isMobile={true}
                cart={cart}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                toggleWarranty={toggleWarranty}
                updateCartSerialAtIndex={updateCartSerialAtIndex}
                updateDiscount={updateDiscount}
                warrantyTemplates={warrantyTemplates}
              />

              {/* Transaction Config details Card */}
              {cart.length > 0 && (
                <Box>
                  <Paper sx={{ 
                    p: 1.5, 
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: 'none',
                    mb: 1.5
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '13px' }}>
                        Transaction Details
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        color="info"
                        onClick={() => setOpenLoadQuotation(true)}
                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: '11px', borderRadius: '6px', py: 0.3 }}
                      >
                        Load Quote
                      </Button>
                    </Box>
                    
                    <Grid container spacing={1.5}>
                      <Grid item xs={12}>
                        <Autocomplete
                          size="small"
                          options={employees || []}
                          getOptionLabel={(option) => `${option.name} (${option.role})`}
                          value={(employees || []).find(e => e._id === assignedSR) || null}
                          onChange={(e, newValue) => setAssignedSR(newValue ? newValue._id : '')}
                          renderInput={(params) => (
                            <TextField 
                              {...params} 
                              label="Sold By (Sales Rep)" 
                              placeholder="Select Employee..."
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '8px',
                                  backgroundColor: '#F8FAFC',
                                }
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <CustomerSelection
                        customers={customers}
                        customer={customer}
                        setCustomer={setCustomer}
                        openCustomerDialog={openCustomerDialog}
                        setOpenCustomerDialog={setOpenCustomerDialog}
                        newCustomer={newCustomer}
                        setNewCustomer={setNewCustomer}
                        handleCreateCustomer={handleCreateCustomer}
                      />
                      <PaymentDetails
                        isEmi={isEmi}
                        setIsEmi={setIsEmi}
                        paidAmount={paidAmount}
                        setPaidAmount={setPaidAmount}
                        setHasManuallyEditedPaidAmount={setHasManuallyEditedPaidAmount}
                        emiDuration={emiDuration}
                        setEmiDuration={setEmiDuration}
                        emiInterestRate={emiInterestRate}
                        setEmiInterestRate={setEmiInterestRate}
                        discount={discount}
                        setDiscount={setDiscount}
                        discountType={discountType}
                        setDiscountType={setDiscountType}
                        grandTotal={total}
                        onPaymentsChange={(p, paid) => { setPayments(p); setPaidAmount(paid); }}
                        expense={expense}
                        setExpense={setExpense}
                        delivery={delivery}
                        setDelivery={setDelivery}
                        installation={installation}
                        setInstallation={setInstallation}
                        isOperatingExpense={isOperatingExpense}
                        setIsOperatingExpense={setIsOperatingExpense}
                        isOperatingDelivery={isOperatingDelivery}
                        setIsOperatingDelivery={setIsOperatingDelivery}
                        isOperatingInstallation={isOperatingInstallation}
                        setIsOperatingInstallation={setIsOperatingInstallation}
                      />
                      {/* Notes */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          placeholder="Add order note/remarks here..."
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          size="small"
                          multiline
                          rows={2}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              fontSize: '12px',
                              borderRadius: '8px',
                              backgroundColor: '#F8FAFC',
                              '& fieldset': { borderColor: '#E2E8F0' },
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Calculations & Actions */}
                  <Paper sx={{ 
                    p: 2, 
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: 'none',
                    backgroundColor: '#FFFFFF'
                  }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '13px', mb: 1.5 }}>
                      Payment Summary
                    </Typography>

                    {/* Financial Rows */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>Sub Total:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '12px' }}>৳{subTotal.toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>Discount:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#EF4444', fontSize: '12px' }}>-৳{discountAmount.toFixed(2)}</Typography>
                      </Box>
                      {parseFloat(expense) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>Expense:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '12px' }}>৳{parseFloat(expense).toFixed(2)}</Typography>
                        </Box>
                      )}
                      {parseFloat(delivery) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>Delivery:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '12px' }}>৳{parseFloat(delivery).toFixed(2)}</Typography>
                        </Box>
                      )}
                      {parseFloat(installation) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>Installation:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '12px' }}>৳{parseFloat(installation).toFixed(2)}</Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px dashed #E2E8F0' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '13px' }}>Grand Total:</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#6366F1', fontSize: '15px' }}>৳{total.toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>Paid Amount:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#6366F1', fontSize: '12px' }}>৳{(parseFloat(paidAmount) || 0).toFixed(2)}</Typography>
                      </Box>
                    </Box>

                    {/* Due ribbon */}
                    {(() => {
                      const due = total - (parseFloat(paidAmount) || 0);
                      const isPaidFull = due <= 0;
                      return (
                        <Box sx={{
                          p: 1,
                          borderRadius: '8px',
                          backgroundColor: isPaidFull ? '#D1FAE5' : '#FEE2E2',
                          border: '1px solid',
                          borderColor: isPaidFull ? '#10B981' : '#EF4444',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 2
                        }}>
                          <Typography sx={{ 
                            fontWeight: 700, 
                            color: isPaidFull ? '#059669' : '#B91C1C',
                            fontSize: '11px',
                            textTransform: 'uppercase'
                          }}>
                            {isPaidFull ? '✅ Fully Paid' : '⚠️ Due Balance'}
                          </Typography>
                          <Typography sx={{ 
                            fontWeight: 800, 
                            color: isPaidFull ? '#059669' : '#B91C1C',
                            fontSize: '13.5px'
                          }}>
                            ৳{Math.max(0, due).toFixed(2)}
                          </Typography>
                        </Box>
                      );
                    })()}

                    {/* Buttons row */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={handleShowPreview}
                        disabled={cart.length === 0}
                        sx={{
                          flexGrow: 1,
                          py: 1,
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '13px',
                          borderColor: '#E2E8F0',
                          color: 'text.secondary',
                          '&:hover': { borderColor: '#6366F1', color: '#6366F1', backgroundColor: 'rgba(99, 102, 241, 0.04)' }
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
                          py: 1,
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '13.5px',
                          backgroundColor: '#6366F1',
                          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                          '&:hover': {
                            backgroundColor: '#4F46E5',
                            boxShadow: '0 6px 16px rgba(99, 102, 241, 0.3)',
                          }
                        }}
                      >
                        {isSubmitting ? (
                          <CircularProgress size={18} sx={{ color: 'white' }} />
                        ) : (
                          `Complete - ৳${total.toFixed(2)}`
                        )}
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </Box>
      ) : (
        // DESKTOP LAYOUT (100% UNCHANGED to avoid regressions)
        <Grid container spacing={1.5} sx={{ flexGrow: 1, height: '100%', minHeight: 0 }}>
          {/* Left Column: Product Grid Selector & Shopping Cart */}
          <Grid item xs={12} md={7.5} sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            
            {/* Catalog Selector */}
            <ProductCatalog
              isMobile={false}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredProducts={filteredProducts}
              productsLoading={productsLoading}
              addToCart={addToCart}
              cart={cart}
              total={total}
              setMobileTab={setMobileTab}
              activeOffers={activeOffers}
            />

            {/* Shopping Cart Table */}
            <Paper sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              minHeight: 0, 
              p: 1, 
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: '1px solid #E2E8F0'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '13px', mb: 1 }}>
                Selected Items ({cart.length} items)
              </Typography>
              <CartTable
                isMobile={false}
                cart={cart}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                toggleWarranty={toggleWarranty}
                updateCartSerialAtIndex={updateCartSerialAtIndex}
                updateDiscount={updateDiscount}
                warrantyTemplates={warrantyTemplates}
              />
              
              {/* Remarks note textfield tucked here to preserve screen height */}
              <TextField
                fullWidth
                placeholder="Add order note/remarks here..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                size="small"
                multiline
                rows={1.5}
                sx={{
                  mt: 1,
                  '& .MuiOutlinedInput-root': {
                    fontSize: '11px',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    '& fieldset': { borderColor: '#E2E8F0' },
                    '&:hover fieldset': { borderColor: '#CBD5E1' },
                    '&.Mui-focused fieldset': { borderColor: '#6366F1' },
                  }
                }}
              />
            </Paper>
          </Grid>

          {/* Right Column: Customer Details, Calculations & Processing */}
          <Grid item xs={12} md={4.5} sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <form onSubmit={handleSubmit} style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, gap: 10, overflowY: 'auto', paddingRight: '4px' }}>
              
              {/* Sale Config details Card */}
              <Paper sx={{ 
                p: 1.5, 
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid #E2E8F0'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '13px' }}>
                    Transaction Details
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    color="info"
                    onClick={() => setOpenLoadQuotation(true)}
                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '12px', borderRadius: '6px', py: 0.3 }}
                  >
                    Load Quote
                  </Button>
                </Box>
                
                <Grid container spacing={1.25}>
                  
                  <Grid item xs={12}>
                    <Autocomplete
                      size="small"
                      options={employees || []}
                      getOptionLabel={(option) => `${option.name} (${option.role})`}
                      value={(employees || []).find(e => e._id === assignedSR) || null}
                      onChange={(e, newValue) => setAssignedSR(newValue ? newValue._id : '')}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Sold By (Sales Rep)" 
                          placeholder="Select Employee..."
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px',
                              backgroundColor: '#F8FAFC',
                            }
                          }}
                        />
                      )}
                    />
                  </Grid>
                  
                  <CustomerSelection
                    customers={customers}
                    customer={customer}
                    setCustomer={setCustomer}
                    openCustomerDialog={openCustomerDialog}
                    setOpenCustomerDialog={setOpenCustomerDialog}
                    newCustomer={newCustomer}
                    setNewCustomer={setNewCustomer}
                    handleCreateCustomer={handleCreateCustomer}
                  />
                  <PaymentDetails
                    isEmi={isEmi}
                    setIsEmi={setIsEmi}
                    paidAmount={paidAmount}
                    setPaidAmount={setPaidAmount}
                    setHasManuallyEditedPaidAmount={setHasManuallyEditedPaidAmount}
                    emiDuration={emiDuration}
                    setEmiDuration={setEmiDuration}
                    emiInterestRate={emiInterestRate}
                    setEmiInterestRate={setEmiInterestRate}
                    discount={discount}
                    setDiscount={setDiscount}
                    discountType={discountType}
                    setDiscountType={setDiscountType}
                    grandTotal={total}
                    onPaymentsChange={(p, paid) => { setPayments(p); setPaidAmount(paid); }}
                    expense={expense}
                    setExpense={setExpense}
                    delivery={delivery}
                    setDelivery={setDelivery}
                    installation={installation}
                    setInstallation={setInstallation}
                    isOperatingExpense={isOperatingExpense}
                    setIsOperatingExpense={setIsOperatingExpense}
                    isOperatingDelivery={isOperatingDelivery}
                    setIsOperatingDelivery={setIsOperatingDelivery}
                    isOperatingInstallation={isOperatingInstallation}
                    setIsOperatingInstallation={setIsOperatingInstallation}
                  />
                </Grid>
              </Paper>

              {/* Calculations Card Summary & Actions */}
              <Paper sx={{ 
                flexGrow: 1,
                p: 1.5, 
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 0,
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '13px', mb: 0.5 }}>
                    Payment Details
                  </Typography>
                  
                  {/* Financial Details Table */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>Sub Total:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '12px' }}>৳{subTotal.toFixed(2)}</Typography>
                    </Box>
                    {discountAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>Discount:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#EF4444', fontSize: '12px' }}>-৳{discountAmount.toFixed(2)}</Typography>
                      </Box>
                    )}
                    {parseFloat(expense) > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>Expense:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '12px' }}>৳{parseFloat(expense).toFixed(2)}</Typography>
                      </Box>
                    )}
                    {parseFloat(delivery) > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>Delivery:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '12px' }}>৳{parseFloat(delivery).toFixed(2)}</Typography>
                      </Box>
                    )}
                    {parseFloat(installation) > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>Installation:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '12px' }}>৳{parseFloat(installation).toFixed(2)}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5, borderTop: '1px dashed #E2E8F0' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '12px' }}>Grand Total:</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#6366F1', fontSize: '13.5px' }}>৳{total.toFixed(2)}</Typography>
                    </Box>

                    {isEmi ? (() => {
                      const downPayment = parseFloat(paidAmount) || 0;
                      const interestRate = parseFloat(emiInterestRate) || 0;
                      const interestAmount = total * (interestRate / 100);
                      const totalPayable = total + interestAmount - downPayment;
                      const monthlyInstalment = totalPayable / (parseInt(emiDuration) || 12);
                      
                      return (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>Down Payment:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#10B981', fontSize: '12px' }}>৳{downPayment.toFixed(2)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>Interest Amount ({interestRate}%):</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#F59E0B', fontSize: '12px' }}>+৳{interestAmount.toFixed(2)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5, borderTop: '1px dashed #E2E8F0', mt: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '12px' }}>Monthly Instalment ({parseInt(emiDuration) || 12} Mos):</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#8B5CF6', fontSize: '13px' }}>৳{monthlyInstalment.toFixed(2)}</Typography>
                          </Box>
                        </>
                      );
                    })() : (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }}>Paid:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#6366F1', fontSize: '12px' }}>৳{(parseFloat(paidAmount) || 0).toFixed(2)}</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
                
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  
                  {/* Due balance ribbon */}
                  {!isEmi && (() => {
                    const due = total - (parseFloat(paidAmount) || 0);
                    const isPaidFull = due <= 0;
                    return (
                      <Box sx={{
                        p: 0.75,
                        borderRadius: '8px',
                        backgroundColor: isPaidFull ? '#D1FAE5' : '#FEE2E2',
                        border: '1px solid',
                        borderColor: isPaidFull ? '#10B981' : '#EF4444',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Typography sx={{ 
                          fontWeight: 700, 
                          color: isPaidFull ? '#059669' : '#B91C1C',
                          fontSize: '10px',
                          textTransform: 'uppercase'
                        }}>
                          {isPaidFull ? '✅ Fully Paid' : '⚠️ Due Balance'}
                        </Typography>
                        <Typography sx={{ 
                          fontWeight: 800, 
                          color: isPaidFull ? '#059669' : '#B91C1C',
                          fontSize: '12px'
                        }}>
                          ৳{Math.max(0, due).toFixed(2)}
                        </Typography>
                      </Box>
                    );
                  })()}

                  {/* Main Action buttons row */}
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
                        color: 'text.secondary',
                        '&:hover': { borderColor: '#6366F1', color: '#6366F1', backgroundColor: 'rgba(99, 102, 241, 0.04)' }
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
                        backgroundColor: '#6366F1',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                        '&:hover': {
                          backgroundColor: '#4F46E5',
                          boxShadow: '0 6px 16px rgba(99, 102, 241, 0.3)',
                          transform: 'translateY(-0.5px)'
                        }
                      }}
                    >
                      {isSubmitting ? (
                        <CircularProgress size={18} sx={{ color: 'white' }} />
                      ) : (
                        `Complete - ৳${total.toFixed(2)}`
                      )}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </form>
          </Grid>
        </Grid>
      )}

      {/* Sale Invoice Modal */}
      <PrintInvoiceModal 
        open={showInvoiceModal} 
        onClose={() => setShowInvoiceModal(false)} 
        saleId={completedSaleId} 
      />
      
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

      {/* TOAST NOTIFICATION SNACKBARS */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%', borderRadius: '8px', boxShadow: 3 }}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" sx={{ width: '100%', borderRadius: '8px', boxShadow: 3 }}>
          {error}
        </Alert>
      </Snackbar>

      <LoadQuotationModal
        open={openLoadQuotation}
        onClose={() => setOpenLoadQuotation(false)}
        onSelectQuotation={handleSelectQuotation}
      />
    </Box>
  );
};

export default RetailSales;