import React, { useState, useMemo } from 'react';
import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, TextField, InputAdornment, Grid, IconButton, Tooltip, Link, Button, Menu, MenuItem, Chip, Select, Divider, Card, ToggleButton, ToggleButtonGroup, TablePagination, Skeleton } from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { useQuery } from 'react-query';
import { Link as RouterLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Search as SearchIcon, PictureAsPdf as PictureAsPdfIcon, Print as PrintIcon, Add as AddIcon, Share as ShareIcon, WhatsApp as WhatsAppIcon, Telegram as TelegramIcon, Message as MessengerIcon, ShoppingCart as ShoppingCartIcon, LocalShipping as LocalShippingIcon, Visibility as VisibilityIcon, ArrowBack as ArrowBackIcon, CalendarMonth as CalendarIcon } from '@mui/icons-material';
import useShopRefresh from '../../hooks/useShopRefresh';
import InvoiceShareButtons from '../../components/InvoiceShareButtons';
import EditInvoiceModal from '../../components/EditInvoiceModal';
import SaleInvoiceModal from '../../components/invoices/PrintInvoiceModal';
import ExportButtons from '../../components/ExportButtons';
import ProfitAnalysisModal from '../../components/ProfitAnalysisModal';
import { formatDate } from '../../utils/dateUtils';


const AllSales = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Check if accessed from reports module or URL view param
  const isFromReportsModule = location.pathname.includes('/reports') || searchParams.get('view') === 'table';

  const [viewMode, setViewMode] = useState(() => {
    const paramView = searchParams.get('view');
    if (paramView === 'table' || paramView === 'cards') return paramView;
    if (isFromReportsModule) return 'table';
    return 'cards';
  });

  // Sync state when URL query params or route change
  React.useEffect(() => {
    const urlView = searchParams.get('view');
    if (urlView === 'table' || urlView === 'cards') {
      setViewMode(urlView);
    } else if (location.pathname.includes('/reports')) {
      setViewMode('table');
    }
  }, [searchParams, location]);

  const handleViewModeChange = (e, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("view", newMode);
        return next;
      });
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [addSaleMenuAnchor, setAddSaleMenuAnchor] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSaleForEdit, setSelectedSaleForEdit] = useState(null);
  const [profitAnalysisOpen, setProfitAnalysisOpen] = useState(false);
  const [selectedSaleForProfit, setSelectedSaleForProfit] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState(null);
  const [completedSaleSourceType, setCompletedSaleSourceType] =
    useState("sale");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const isSuperAdmin = user?.role === "Super Admin";
  const isAdmin = user?.role === "Admin" || user?.role === "Super Admin";
  const isSalesStaff = user?.role === "Sales Staff";

  const isOnlineOrder = (sale) => {
    if (sale.type === "online") return true;
    const invoice = sale.invoiceNumber || "";
    return invoice.startsWith("SO-ECOM-") || invoice.startsWith("INV-ECOM-");
  };

  const {
    data: sales,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ["all-sales-and-orders", startDate, endDate],
    async () => {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [salesRes, ordersRes] = await Promise.all([
        api.get("/api/sales", { params }),
        api.get("/api/sales-orders", { params }),
      ]);

      // Combine sales and orders, marking them with type
      const salesData = salesRes.data.data.map((sale) => ({
        ...sale,
        sourceType: "sale",
      }));

      const ordersData = ordersRes.data.data
        .filter((order) => order.status !== "Converted")
        .map((order) => ({
          ...order,
          sourceType: "order",
          invoiceNumber: order.orderNumber,
          total: order.total,
          paidAmount: order.paidAmount,
          dueAmount: order.dueAmount,
          customer: order.customer,
          status:
            order.status === "Delivered"
              ? "Completed"
              : `Order ${order.approvalStatus}`,
        }));

      return [...salesData, ...ordersData].sort(
        (a, b) =>
          new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt),
      );
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // Data stays fresh in cache for 5 minutes
      cacheTime: 10 * 60 * 1000, // Cache data in memory for 10 minutes
    },
  );

  // Automatically refresh data when shop changes
  useShopRefresh(refetch);

  // Fetch company settings - MUST be at top level, not conditional
  const { data: settings } = useQuery("company-settings", async () => {
    const response = await api.get("/api/settings");
    return response.data.data;
  });

  const companyInfo = settings
    ? {
        companyName: settings.companyName,
        companyAddress: settings.companyAddress,
        phone: settings.phone,
        alternativePhone: settings.alternativePhone,
        email: settings.email,
        website: settings.website,
        logo: settings.logo,
      }
    : {};

  const getCustomerName = (sale) => {
    if (!sale) return "N/A";
    if (typeof sale.customer === "string" && sale.customer.trim() && !sale.customer.match(/^[0-9a-fA-F]{24}$/)) {
      return sale.customer;
    }
    return (
      sale.customer?.contactName ||
      sale.customer?.name ||
      sale.customer?.businessName ||
      sale.customerName ||
      sale.customerDetails?.contactName ||
      sale.customerDetails?.name ||
      sale.shippingAddress?.name ||
      sale.billingAddress?.name ||
      "N/A"
    );
  };

  const getCustomerPhone = (sale) => {
    if (!sale) return "";
    return (
      sale.customer?.contactNumber ||
      sale.customer?.phone ||
      sale.customer?.mobile ||
      sale.customerPhone ||
      sale.customerDetails?.contactNumber ||
      sale.customerDetails?.phone ||
      sale.shippingAddress?.phone ||
      ""
    );
  };

  const getProductCategory = (sale) => {
    if (!sale) return "N/A";
    if (!sale.items || !Array.isArray(sale.items) || sale.items.length === 0) {
      return sale.category || sale.productCategory || "N/A";
    }
    const categories = sale.items
      .map((item) => {
        if (item.product?.category?.name) return item.product.category.name;
        if (typeof item.product?.category === "string" && item.product.category) return item.product.category;
        if (item.category?.name) return item.category.name;
        if (typeof item.category === "string" && item.category) return item.category;
        if (item.productCategory) return item.productCategory;
        if (item.categoryName) return item.categoryName;
        return null;
      })
      .filter(Boolean);

    const uniqueCategories = [...new Set(categories)];
    return uniqueCategories.length > 0 ? uniqueCategories.join(", ") : (sale.category || "N/A");
  };

  const getProductNames = (sale) => {
    if (!sale) return "N/A";
    if (!sale.items || !Array.isArray(sale.items) || sale.items.length === 0) {
      return sale.productName || "N/A";
    }
    const names = sale.items
      .map((item) => {
        if (item.product?.name) return item.product.name;
        if (typeof item.product === "string" && item.product) return item.product;
        if (item.productName) return item.productName;
        if (item.name) return item.name;
        return null;
      })
      .filter(Boolean);

    const uniqueNames = [...new Set(names)];
    return uniqueNames.length > 0 ? uniqueNames.join(", ") : "N/A";
  };

  const getPaymentBreakdown = (sale) => {
    let cash = 0;
    let card = 0;
    let bank = 0;
    let mfs = 0;

    if (sale.payments && sale.payments.length > 0) {
      sale.payments.forEach(p => {
        const amt = parseFloat(p.amount) || 0;
        if (p.method === 'Cash') cash += amt;
        else if (p.method === 'Card') card += amt;
        else if (p.method === 'Bank') bank += amt;
        else if (p.method === 'MFS') mfs += amt;
      });
    } else if (sale.paidAmount > 0) {
      const amt = parseFloat(sale.paidAmount) || 0;
      const method = sale.paymentMethod || 'Cash';
      if (method === 'Cash') cash += amt;
      else if (method === 'Card') card += amt;
      else if (method === 'Bank') bank += amt;
      else if (['MFS', 'bKash', 'Nagad', 'Mobile Banking'].includes(method)) mfs += amt;
      else cash += amt;
    }

    return { cash, card, bank, mfs };
  };

  // Filter sales based on search term and date range
  const filteredSales = useMemo(() => {
    let result = sales || [];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((sale) => {
        let typeLabel = "";
        const type =
          sale.type || (sale.sourceType === "order" ? "online" : "wholesale");
        if (
          sale.sourceType === "order" &&
          (type === "online" ||
            (sale.invoiceNumber && sale.invoiceNumber.startsWith("SO-ECOM-")))
        ) {
          typeLabel = "online order";
        } else if (type === "retail") {
          typeLabel = "retail";
        } else {
          typeLabel = "wholesale sales";
        }

        const custName = getCustomerName(sale).toLowerCase();
        const custPhone = getCustomerPhone(sale);

        return (
          sale.invoiceNumber?.toLowerCase().includes(term) ||
          custName.includes(term) ||
          custPhone.includes(term) ||
          (sale.total && sale.total.toString().includes(term)) ||
          (sale.paidAmount && sale.paidAmount.toString().includes(term)) ||
          (sale.dueAmount && sale.dueAmount.toString().includes(term)) ||
          (sale.status && sale.status.toLowerCase().includes(term)) ||
          typeLabel.includes(term)
        );
      });

      result = result.sort((a, b) => {
        const aName = getCustomerName(a).toLowerCase();
        const bName = getCustomerName(b).toLowerCase();
        const aPhone = getCustomerPhone(a);
        const bPhone = getCustomerPhone(b);
        const aStarts = (a.invoiceNumber && a.invoiceNumber.toLowerCase().startsWith(term)) || 
                        aName.startsWith(term) ||
                        aPhone.startsWith(term);
        const bStarts = (b.invoiceNumber && b.invoiceNumber.toLowerCase().startsWith(term)) || 
                        bName.startsWith(term) ||
                        bPhone.startsWith(term);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return 0;
      });
    }

    return result;
  }, [sales, searchTerm]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(0);
  }, [searchTerm, startDate, endDate, viewMode]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedSales = useMemo(() => {
    return filteredSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredSales, page, rowsPerPage]);

  // Helper: compute COGS for a single sale (mirrors per-row table logic)
  const getSaleCOGS = (sale) => {
    let cogs = sale.invoices?.customerTax?.totalPurchaseValue;
    if (cogs === undefined || cogs === null || cogs === 0) {
      cogs =
        sale.items?.reduce(
          (sum, item) => sum + (item.product?.purchasePrice || 0) * (item.quantity || 0),
          0,
        ) || 0;
    }
    return cogs || 0;
  };

  // Helper: compute Net Profit for a single sale
  const getSaleNetProfit = (sale) => {
    if (sale.status !== 'Completed') return 0;
    const cogs = getSaleCOGS(sale);
    const paymentFees = (sale.payments || []).reduce((sum, p) => sum + (p.feeAmount || 0), 0);
    const expenses =
      (sale.deliveryCharge || 0) +
      (sale.installationCost || 0) +
      (sale.additionalExpense || 0) +
      paymentFees;
    const emiInterest =
      (sale.invoiceType === 'EMI' || sale.emiOption) && sale.emiOption?.interestRate
        ? (sale.total * sale.emiOption.interestRate) / 100
        : 0;
    return sale.total + emiInterest - cogs - expenses;
  };

  // Helper: get total items qty for a sale
  const getSaleItemQty = (sale) =>
    (sale.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Today's date string (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Determine if we are looking at today's filter
  const isViewingToday = startDate === todayStr && endDate === todayStr;

  // Today's sales computed client-side from full sales array
  const todaySales = useMemo(() => {
    if (!sales) return [];
    return sales.filter((s) => {
      const d = new Date(s.date || s.createdAt);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return dStr === todayStr;
    });
  }, [sales, todayStr]);

  // Compute metrics from a list of sales
  const computeMetrics = (list) => {
    const revenue = list.reduce((sum, s) => sum + (s.total || 0), 0);
    const cogs = list.reduce((sum, s) => sum + getSaleCOGS(s), 0);
    const netProfit = list.reduce((sum, s) => sum + getSaleNetProfit(s), 0);
    const itemsQty = list.reduce((sum, s) => sum + getSaleItemQty(s), 0);

    // Best employee aggregation
    const empMap = {};
    list.forEach((s) => {
      const name = s.assignedSR?.name || s.createdBy?.name || 'Unknown';
      if (!empMap[name]) empMap[name] = { name, revenue: 0, count: 0 };
      empMap[name].revenue += s.total || 0;
      empMap[name].count += 1;
    });
    const employees = Object.values(empMap).sort((a, b) => b.revenue - a.revenue);
    const bestEmployee = employees[0] || null;

    return { revenue, cogs, netProfit, itemsQty, bestEmployee };
  };

  // Range/all metrics (from filteredSales — respects date filter + search)
  const rangeMetrics = useMemo(() => computeMetrics(filteredSales), [filteredSales]);

  // Today-specific metrics (always from today's data, regardless of date filter)
  const todayMetrics = useMemo(() => computeMetrics(todaySales), [todaySales]);

  // Label for the range card sub-heading
  const rangeLabel = useMemo(() => {
    if (startDate && endDate && startDate === endDate) return startDate === todayStr ? 'Today' : startDate;
    if (startDate && endDate) return `${startDate} → ${endDate}`;
    if (startDate) return `From ${startDate}`;
    if (endDate) return `Until ${endDate}`;
    return 'All Time';
  }, [startDate, endDate, todayStr]);

  const handleSetToday = () => {
    const today = new Date();
    // Format to YYYY-MM-DD for the input type="date"
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    setStartDate(todayStr);
    setEndDate(todayStr);
  };

  const handleShareClick = (event, sale) => {
    setShareAnchorEl(event.currentTarget);
    setSelectedSale(sale);
  };

  const handleShareClose = () => {
    setShareAnchorEl(null);
    setSelectedSale(null);
  };

  const handleEditClick = (sale) => {
    setSelectedSaleForEdit(sale);
    setEditDialogOpen(true);
  };

  const handleEditClose = (shouldView = false, saleIdToView = null, sourceTypeToView = null) => {
    setEditDialogOpen(false);
    setSelectedSaleForEdit(null);
    refetch(); // Refresh data after editing
    if (shouldView && saleIdToView) {
      setCompletedSaleId(saleIdToView);
      setCompletedSaleSourceType(sourceTypeToView || "sale");
      setShowInvoiceModal(true);
    }
  };

  const handleOrderStatusChange = async (sale, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No authorization token found. Please log in again.");
        return;
      }

      const saleId = sale._id;
      const sourceType = sale.sourceType;

      let url = `${api.defaults.baseURL}/api/sales/${saleId}/order-status`;
      let method = "PUT";
      let body = JSON.stringify({ orderStatus: newStatus });

      if (sourceType === "order") {
        // If jumping straight to Delivered from Processing/Confirmed, we need to call out-for-delivery first to deduct stock
        if (newStatus === "Delivered" && sale.status !== "Out for Delivery") {
          const outForDeliveryRes = await fetch(
            `${api.defaults.baseURL}/api/sales-orders/${saleId}/out-for-delivery`,
            {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (!outForDeliveryRes.ok) {
            const errorData = await outForDeliveryRes.json().catch(() => ({}));
            throw new Error(
              errorData.message || "Failed to update stock before delivery",
            );
          }
        }

        if (newStatus === "Out for Delivery") {
          url = `${api.defaults.baseURL}/api/sales-orders/${saleId}/out-for-delivery`;
          body = null;
        } else if (newStatus === "Delivered") {
          url = `${api.defaults.baseURL}/api/sales-orders/${saleId}/deliver`;
          body = null;
        } else if (newStatus === "Returned") {
          url = `${api.defaults.baseURL}/api/sales-orders/${saleId}/return`;
          body = null;
        } else if (newStatus === "Cancelled") {
          url = `${api.defaults.baseURL}/api/sales-orders/${saleId}/cancel`;
          body = null;
        } else {
          url = `${api.defaults.baseURL}/api/sales-orders/${saleId}/order-status`;
          body = JSON.stringify({ orderStatus: newStatus });
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const result = await response.json();
      if (result.success) {
        // Refetch to update the table
        refetch();
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Error updating order status: " + error.message);
    }
  };


  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Error loading sales: {error.message}</Alert>
      </Box>
    );
  }

  const columns = [
    { label: "Invoice No", accessor: (row) => row.invoiceNumber || "—" },
    {
      label: "Type",
      accessor: (row) => {
        let t =
          row.type || (row.sourceType === "order" ? "online" : "wholesale");
        if (
          row.sourceType === "order" &&
          (t === "online" ||
            (row.invoiceNumber && row.invoiceNumber.startsWith("SO-ECOM-")))
        ) {
          return "Online Order";
        }
        if (t === "retail") {
          return row.invoiceType === "EMI" ? "Retail (EMI)" : "Retail";
        }
        return "Wholesale";
      },
    },
    {
      label: "Customer Name",
      accessor: (row) => getCustomerName(row),
    },
    {
      label: "Customer Number",
      accessor: (row) => getCustomerPhone(row) || "N/A",
    },
    {
      label: "Items Sold",
      accessor: (row) => getProductNames(row),
    },
    {
      label: "Product Category",
      accessor: (row) => getProductCategory(row),
    },
    {
      label: "Customer Address",
      accessor: (row) => row.customer?.address || "N/A",
    },
    {
      label: "Sold By",
      accessor: (row) =>
        row.assignedSR?.name || row.createdBy?.name || "Unknown",
    },
    {
      label: "Date",
      accessor: (row) => formatDate(row.date, true),
    },
    { label: "Total", accessor: (row) => `৳${row.total}` },
    {
      label: "Paid",
      accessor: (row) =>
        row.invoiceType === "EMI" || row.emiOption
          ? `Downpayment: ৳${row.emiOption?.downPayment ?? row.paidAmount}`
          : `৳${row.paidAmount}`,
    },
    {
      label: "Cash Paid",
      accessor: (row) => `৳${getPaymentBreakdown(row).cash.toFixed(2)}`,
    },
    {
      label: "Card Paid",
      accessor: (row) => {
        const bd = getPaymentBreakdown(row);
        const cardPayments = (row.payments || []).filter(p => p.method === 'Card');
        const details = cardPayments.map(p => p.posMachineName).filter(Boolean).join(', ');
        return `৳${bd.card.toFixed(2)}${details ? ` (${details})` : ''}`;
      },
    },
    {
      label: "Bank Paid",
      accessor: (row) => {
        const bd = getPaymentBreakdown(row);
        const bankPayments = (row.payments || []).filter(p => p.method === 'Bank');
        const details = bankPayments.map(p => p.bankName).filter(Boolean).join(', ');
        return `৳${bd.bank.toFixed(2)}${details ? ` (${details})` : ''}`;
      },
    },
    {
      label: "MFS Paid",
      accessor: (row) => {
        const bd = getPaymentBreakdown(row);
        const mfsPayments = (row.payments || []).filter(p => p.method === 'MFS');
        const details = mfsPayments.map(p => p.mfsProviderName).filter(Boolean).join(', ');
        return `৳${bd.mfs.toFixed(2)}${details ? ` (${details})` : ''}`;
      },
    },
    ...(isSalesStaff ? [] : [{
      label: "Net Profit",
      accessor: (row) => {
        if (row.status !== "Completed") return "---";
        const profit = row.calculatedNetProfit || 0;
        return `৳${profit.toFixed(2)}`;
      },
    }]),
    { label: "Due", accessor: (row) => `৳${row.dueAmount}` },
    {
      label: "Payment",
      accessor: (row) => {
        if (row.payments && row.payments.length > 0) {
          return row.payments.length === 1
            ? row.payments[0].method
            : `Split (${row.payments.map((p) => p.method).join(", ")})`;
        }
        return row.paymentMethod || "Cash";
      },
    },
    { label: "Status", accessor: (row) => row.status },
    {
      label: "Order Status",
      accessor: (row) =>
        isOnlineOrder(row) ? row.orderStatus || "Processing" : "—",
    },
  ];

  return (
    <Box sx={{ py: { xs: 1, sm: 2 } }}>
      <Grid container spacing={1.5}>

        <Grid item xs={12}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2.5, 
              mb: 2, 
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconButton 
                  onClick={() => navigate(-1)} 
                  sx={{ 
                    bgcolor: '#F1F5F9', 
                    '&:hover': { bgcolor: '#E2E8F0' },
                    borderRadius: '12px',
                    p: 1
                  }}
                >
                  <ArrowBackIcon sx={{ color: '#475569', fontSize: '1.25rem' }} />
                </IconButton>
                <Box>
                  <Typography variant="h6" sx={{ color: '#0F172A', fontWeight: 700, mb: 0.25, fontSize: '1.15rem' }}>
                    All Sales
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.825rem' }}>
                    Showing {filteredSales?.length || 0} of {sales?.length || 0} sales transactions.
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  gap: 1.5,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={handleViewModeChange}
                  size="small"
                  aria-label="view mode"
                  sx={{ 
                    backgroundColor: "#F8FAFC",
                    p: '3px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    '& .MuiToggleButton-root': {
                      border: 'none',
                      borderRadius: '7px !important',
                      px: 1.5,
                      py: 0.6,
                      color: '#64748B',
                      transition: 'all 0.2s ease',
                      '&.Mui-selected': {
                        backgroundColor: '#1D5F99',
                        color: '#FFFFFF',
                        boxShadow: '0 2px 5px rgba(29, 95, 153, 0.3)',
                        '&:hover': {
                          backgroundColor: '#174B7A',
                        },
                      },
                      '&:hover': {
                        backgroundColor: '#E2E8F0',
                      },
                    },
                  }}
                >
                  <ToggleButton value="cards" id="toggle-cards-view" aria-label="cards view">
                    <ViewModuleIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="table" id="toggle-table-view" aria-label="table view">
                    <ViewListIcon fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>

                <ExportButtons
                  data={filteredSales || []}
                  columns={columns}
                  filename="all_sales"
                  title="All Sales Report"
                />
              </Box>
            </Box>

            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} md={3.5}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search sales by invoice, customer, amount, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#94A3B8', fontSize: '1.2rem' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: "10px",
                      height: "40px",
                      fontSize: "13px",
                      backgroundColor: "#F8FAFC",
                      "& fieldset": { borderColor: "#E2E8F0" },
                      "&:hover fieldset": { borderColor: "#CBD5E1" },
                    },
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.25}>
                <TextField
                  fullWidth
                  type="date"
                  label="From Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    sx: {
                      borderRadius: "10px",
                      height: "40px",
                      fontSize: "13px",
                      backgroundColor: "#F8FAFC",
                      "& fieldset": { borderColor: "#E2E8F0" },
                    },
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.25}>
                <TextField
                  fullWidth
                  type="date"
                  label="To Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    sx: {
                      borderRadius: "10px",
                      height: "40px",
                      fontSize: "13px",
                      backgroundColor: "#F8FAFC",
                      "& fieldset": { borderColor: "#E2E8F0" },
                    },
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ display: 'flex', gap: 1, height: '40px' }}>
                  <Button
                    variant={isViewingToday ? "contained" : "outlined"}
                    onClick={handleSetToday}
                    sx={{
                      flex: 1,
                      textTransform: "none",
                      fontSize: "13px",
                      fontWeight: 600,
                      height: "40px",
                      borderRadius: "10px",
                      whiteSpace: "nowrap",
                      ...(isViewingToday
                        ? {
                            bgcolor: "#1D5F99",
                            color: "#ffffff",
                            boxShadow: "0 2px 6px rgba(29, 95, 153, 0.3)",
                            "&:hover": { bgcolor: "#174B7A" },
                          }
                        : {
                            borderColor: "#CBD5E1",
                            color: "#334155",
                            bgcolor: "#F8FAFC",
                            "&:hover": { borderColor: "#1D5F99", bgcolor: "#F0F9FF", color: "#1D5F99" },
                          }),
                    }}
                  >
                    Today
                  </Button>
                  {(startDate || endDate) && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                      }}
                      sx={{
                        textTransform: "none",
                        fontSize: "12px",
                        fontWeight: 600,
                        height: "40px",
                        borderRadius: "10px",
                        px: 1.5,
                        borderColor: "#FECACA",
                        bgcolor: "#FEF2F2",
                        "&:hover": { bgcolor: "#FEE2E2", borderColor: "#EF4444" },
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </Box>
              </Grid>
              <Grid
                item
                xs={12}
                sm={6}
                md={2}
                sx={{ display: "flex", justifyContent: "flex-end" }}
              >
                {user?.permissions?.sales?.create && (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={(e) => setAddSaleMenuAnchor(e.currentTarget)}
                      sx={{
                        borderRadius: "10px",
                        textTransform: "none",
                        height: "40px",
                        fontSize: "13px",
                        width: "100%",
                        bgcolor: "#1D5F99",
                        "&:hover": { bgcolor: "#174B7A" },
                        boxShadow: "0 2px 6px rgba(29, 95, 153, 0.25)",
                      }}
                    >
                      Add Sale
                    </Button>
                    <Menu
                      anchorEl={addSaleMenuAnchor}
                      open={Boolean(addSaleMenuAnchor)}
                      onClose={() => setAddSaleMenuAnchor(null)}
                      PaperProps={{
                        sx: {
                          mt: 1,
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        },
                      }}
                    >
                      <MenuItem
                        onClick={() => {
                          navigate("/dashboard/sales/retail");
                          setAddSaleMenuAnchor(null);
                        }}
                        sx={{
                          py: 1.5,
                          px: 2,
                          "&:hover": { backgroundColor: "action.hover" },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <ShoppingCartIcon
                            sx={{ color: "#1D5F99", fontSize: 20 }}
                          />
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              Retail Sale
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block" }}
                            >
                              Direct cash/card sales
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          navigate("/dashboard/sales/wholesale");
                          setAddSaleMenuAnchor(null);
                        }}
                        sx={{
                          py: 1.5,
                          px: 2,
                          "&:hover": { backgroundColor: "action.hover" },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <LocalShippingIcon
                            sx={{ color: "#1D5F99", fontSize: 20 }}
                          />
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              Wholesale Sale
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block" }}
                            >
                              Bulk credit sales
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* ── Metric Summary Cards ── */}
        <Grid item xs={12}>
          <Grid container spacing={1.5}>

            {/* Card 1: Sales Revenue */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 1.75,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '10px',
                  border: '1px solid #E0F2FE',
                  borderLeft: '4px solid #0EA5E9',
                  background: '#F0F9FF',
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                    Sales Revenue
                  </Typography>
                  <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color: '#0C4A6E', lineHeight: 1.1 }}>
                    {isLoading ? <Skeleton width="70%" /> : `৳${rangeMetrics.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#0369A1', mt: 0.25, fontWeight: 500 }}>
                    {rangeLabel}
                  </Typography>
                </Box>
                {!isViewingToday && (
                  <Box sx={{ mt: 1, pt: 0.75, borderTop: '1px solid #BAE6FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#0369A1', fontWeight: 500 }}>Today</Typography>
                    <Typography sx={{ fontSize: '0.825rem', fontWeight: 700, color: '#0369A1' }}>
                      {isLoading ? <Skeleton width="50px" /> : `৳${todayMetrics.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Card 2: COGS */}
            {!isSalesStaff && (
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.75,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: '10px',
                    border: '1px solid #FFEDD5',
                    borderLeft: '4px solid #F97316',
                    background: '#FFF7ED',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                        Cost of Goods
                      </Typography>
                      <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#7C2D12', lineHeight: 1.1 }}>
                        {isLoading ? <Skeleton width="70px" /> : `৳${rangeMetrics.cogs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#C2410C', mt: 0.25, fontWeight: 500 }}>
                        {rangeLabel}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                        Net Profit
                      </Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: rangeMetrics.netProfit >= 0 ? '#15803D' : '#DC2626', lineHeight: 1.1 }}>
                        {isLoading ? <Skeleton width="50px" /> : `৳${rangeMetrics.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </Typography>
                    </Box>
                  </Box>
                  {!isViewingToday && (
                    <Box sx={{ mt: 1, pt: 0.75, borderTop: '1px solid #FED7AA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.65rem', color: '#C2410C' }}>Today's COGS</Typography>
                        <Typography sx={{ fontSize: '0.825rem', fontWeight: 700, color: '#C2410C' }}>
                          {isLoading ? <Skeleton width="40px" /> : `৳${todayMetrics.cogs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '0.65rem', color: '#64748B' }}>Today's Profit</Typography>
                        <Typography sx={{ fontSize: '0.825rem', fontWeight: 700, color: todayMetrics.netProfit >= 0 ? '#16A34A' : '#DC2626' }}>
                          {isLoading ? <Skeleton width="40px" /> : `৳${todayMetrics.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Paper>
              </Grid>
            )}

            {/* Card 3: Items Sold */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 1.75,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '10px',
                  border: '1px solid #DCFCE7',
                  borderLeft: '4px solid #10B981',
                  background: '#F0FDF4',
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                    Items Sold
                  </Typography>
                  <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color: '#065F46', lineHeight: 1.1 }}>
                    {isLoading ? <Skeleton width="40%" /> : rangeMetrics.itemsQty.toLocaleString()}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#15803D', mt: 0.25, fontWeight: 500 }}>
                    {rangeLabel} · {filteredSales.length} inv.
                  </Typography>
                </Box>
                {!isViewingToday && (
                  <Box sx={{ mt: 1, pt: 0.75, borderTop: '1px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#15803D', fontWeight: 500 }}>Today</Typography>
                    <Typography sx={{ fontSize: '0.825rem', fontWeight: 700, color: '#15803D' }}>
                      {isLoading ? <Skeleton width="50px" /> : `${todayMetrics.itemsQty.toLocaleString()} items (${todaySales.length})`}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Card 4: Best Employee */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 1.75,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '10px',
                  border: '1px solid #EDE9FE',
                  borderLeft: '4px solid #8B5CF6',
                  background: '#F5F3FF',
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                    Best Employee
                  </Typography>
                  {isLoading ? (
                    <Skeleton width="60%" height={28} />
                  ) : rangeMetrics.bestEmployee ? (
                    <>
                      <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#4C1D95', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rangeMetrics.bestEmployee.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.825rem', fontWeight: 700, color: '#6D28D9', mt: 0.25 }}>
                        ৳{rangeMetrics.bestEmployee.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <Typography component="span" sx={{ fontSize: '0.68rem', color: '#7C3AED', ml: 0.5, fontWeight: 500 }}>
                          ({rangeMetrics.bestEmployee.count} sales)
                        </Typography>
                      </Typography>
                    </>
                  ) : (
                    <Typography sx={{ fontSize: '0.825rem', color: '#64748B' }}>No data</Typography>
                  )}
                </Box>
                {!isViewingToday && (
                  <Box sx={{ mt: 1, pt: 0.75, borderTop: '1px solid #DDD6FE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#7C3AED', fontWeight: 500 }}>Today's Top</Typography>
                    {todayMetrics.bestEmployee ? (
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '0.775rem', fontWeight: 700, color: '#5B21B6' }}>
                          {todayMetrics.bestEmployee.name}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography sx={{ fontSize: '0.7rem', color: '#8B5CF6' }}>No sales today</Typography>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>

          </Grid>
        </Grid>
        {/* ── End Metric Cards ── */}

        <Grid item xs={12}>
          {viewMode === "table" ? (
            <Box sx={{ display: "block" }}>
              <Paper sx={{ overflow: "visible", p: 0 }}>
                <TableContainer sx={{ overflow: "auto" }}>
                  <Table
                    sx={{
                      minWidth: 800,
                      tableLayout: "auto",
                    }}
                  >
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor: "background.paper",
                          "& .MuiTableCell-head": {
                            color: "text.secondary",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            borderBottom: (theme) =>
                              `1px solid ${theme.palette.divider}`,
                            padding: "10px 16px",
                          },
                        }}
                      >
                        <TableCell>Invoice</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Items Sold</TableCell>
                        <TableCell>Product Category</TableCell>
                        <TableCell>Sold By</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Paid</TableCell>
                        <TableCell align="right">Cash Paid</TableCell>
                        <TableCell align="right">Card Paid</TableCell>
                        <TableCell align="right">Bank Paid</TableCell>
                        <TableCell align="right">MFS Paid</TableCell>
                        {!isSalesStaff && <TableCell align="right">Net Profit</TableCell>}
                        <TableCell align="right">Due</TableCell>
                        <TableCell>Payment</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Order Status</TableCell>
                        <TableCell align="center">Actions & Invoices</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {isLoading ? (
                        [1, 2, 3, 4, 5].map((item) => (
                          <TableRow key={item}>
                            <TableCell><Skeleton variant="text" width="80%" height={24} /></TableCell>
                            <TableCell><Skeleton variant="text" width="60%" height={24} /></TableCell>
                            <TableCell><Skeleton variant="text" width="70%" height={24} /></TableCell>
                            <TableCell><Skeleton variant="text" width="75%" height={24} /></TableCell>
                            <TableCell><Skeleton variant="text" width="70%" height={24} /></TableCell>
                            <TableCell><Skeleton variant="text" width="50%" height={24} /></TableCell>
                            <TableCell><Skeleton variant="text" width="65%" height={24} /></TableCell>
                            <TableCell align="right"><Skeleton variant="text" width="60%" height={24} /></TableCell>
                            <TableCell align="right"><Skeleton variant="text" width="60%" height={24} /></TableCell>
                            <TableCell align="right"><Skeleton variant="text" width="60%" height={24} /></TableCell>
                            <TableCell align="right"><Skeleton variant="text" width="60%" height={24} /></TableCell>
                            <TableCell align="right"><Skeleton variant="text" width="60%" height={24} /></TableCell>
                            <TableCell align="right"><Skeleton variant="text" width="60%" height={24} /></TableCell>
                            {!isSalesStaff && <TableCell align="right"><Skeleton variant="text" width="60%" height={24} /></TableCell>}
                            <TableCell align="right"><Skeleton variant="text" width="60%" height={24} /></TableCell>
                            <TableCell><Skeleton variant="text" width="50%" height={24} /></TableCell>
                            <TableCell><Skeleton variant="text" width="45%" height={24} /></TableCell>
                            <TableCell><Skeleton variant="text" width="80%" height={24} /></TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                <Skeleton variant="circular" width={28} height={28} />
                                <Skeleton variant="circular" width={28} height={28} />
                                <Skeleton variant="circular" width={28} height={28} />
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : paginatedSales?.length > 0 ? (
                        paginatedSales.map((sale, idx) => (
                          <TableRow
                            key={sale._id ? `${sale.sourceType}-${sale._id}` : `sale-row-${idx}`}
                            sx={{
                              "&:nth-of-type(odd)": {
                                backgroundColor: "action.hover",
                              },
                              "&:hover": { backgroundColor: "action.selected" },
                              "& .MuiTableCell-root": {
                                whiteSpace: "nowrap",
                                padding: "6px 10px",
                              },
                            }}
                          >
                            <TableCell>
                              {sale.sourceType === "order" ? (
                                <RouterLink
                                  to={`/sales-orders/${sale._id}`}
                                  style={{
                                    textDecoration: "none",
                                    color: "var(--color-text-primary)",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {sale.invoiceNumber}
                                </RouterLink>
                              ) : (
                                <RouterLink
                                  to={`/sales/${sale._id}`}
                                  style={{
                                    textDecoration: "none",
                                    color: "var(--color-text-primary)",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {sale.invoiceNumber}
                                </RouterLink>
                              )}
                            </TableCell>
                            <TableCell>
                              {(() => {
                                let type = sale.type;
                                if (sale.sourceType === "order") {
                                  if (
                                    type === "online" ||
                                    (sale.invoiceNumber &&
                                      sale.invoiceNumber.startsWith("SO-ECOM-"))
                                  ) {
                                    type = "online";
                                  } else {
                                    type = type || "wholesale";
                                  }
                                } else {
                                  type = type || "wholesale";
                                }

                                if (type === "wholesale") {
                                  return (
                                    <Chip
                                      label="Wholesale Sales"
                                      size="small"
                                      sx={{
                                        backgroundColor: "#EEF2FF",
                                        color: "#4F46E5",
                                        border: "1px solid #C7D2FE",
                                        fontWeight: 600,
                                        fontSize: "0.75rem",
                                        px: 0.5,
                                      }}
                                    />
                                  );
                                } else if (type === "retail") {
                                  if (sale.invoiceType === "EMI") {
                                    return (
                                      <Chip
                                        label="Retail (EMI)"
                                        size="small"
                                        sx={{
                                          backgroundColor: "#FEF2F2",
                                          color: "#DC2626",
                                          border: "1px solid #FECACA",
                                          fontWeight: 600,
                                          fontSize: "0.75rem",
                                          px: 0.5,
                                        }}
                                      />
                                    );
                                  }
                                  return (
                                    <Chip
                                      label="Retail"
                                      size="small"
                                      sx={{
                                        backgroundColor: "#ECFDF5",
                                        color: "#059669",
                                        border: "1px solid #A7F3D0",
                                        fontWeight: 600,
                                        fontSize: "0.75rem",
                                        px: 0.5,
                                      }}
                                    />
                                  );
                                } else if (type === "online") {
                                  return (
                                    <Chip
                                      label="online order"
                                      size="small"
                                      sx={{
                                        backgroundColor: "#FFFBEB",
                                        color: "#D97706",
                                        border: "1px solid #FDE68A",
                                        fontWeight: 600,
                                        fontSize: "0.75rem",
                                        px: 0.5,
                                      }}
                                    />
                                  );
                                }
                                return null;
                              })()}
                            </TableCell>
                            <TableCell sx={{ color: "text.primary" }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {getCustomerName(sale)}
                              </Typography>
                              {getCustomerPhone(sale) && (
                                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                                  {getCustomerPhone(sale)}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ color: "text.primary", whiteSpace: "normal", minWidth: 150 }}>
                              {getProductNames(sale)}
                            </TableCell>
                            <TableCell sx={{ color: "text.primary", whiteSpace: "normal", minWidth: 120 }}>
                              {getProductCategory(sale)}
                            </TableCell>
                            <TableCell sx={{ color: "text.primary" }}>
                              {sale.assignedSR?.name ||
                                sale.createdBy?.name ||
                                "Unknown"}
                            </TableCell>
                            <TableCell sx={{ color: "text.primary" }}>
                              {formatDate(sale.date, true)}
                            </TableCell>
                            <TableCell align="right">
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-end",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "success.main",
                                    fontWeight: "500",
                                  }}
                                >
                                  ৳{sale.total}
                                </Typography>
                                {(sale.invoiceType === "EMI" ||
                                  sale.emiOption) &&
                                  sale.emiOption?.interestRate > 0 && (
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: "text.secondary",
                                        fontSize: "0.65rem",
                                      }}
                                    >
                                      + ৳
                                      {(
                                        (sale.total *
                                          sale.emiOption.interestRate) /
                                        100
                                      ).toFixed(2)}{" "}
                                      Int.
                                    </Typography>
                                  )}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-end",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: "info.main", fontWeight: "500" }}
                                >
                                  {sale.invoiceType === "EMI" || sale.emiOption
                                    ? `Downpayment: ৳${sale.emiOption?.downPayment ?? sale.paidAmount}`
                                    : `৳${sale.paidAmount}`}
                                </Typography>
                                {(sale.paymentMethod === "Split" ||
                                  (sale.payments && sale.payments.length > 0) ||
                                  sale.invoices?.customerSales?.cashPaid > 0 ||
                                  sale.invoices?.customerSales?.cardPaid >
                                    0) && (
                                  <Box
                                    sx={{
                                      mt: 0.5,
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "flex-end",
                                    }}
                                  >
                                    {sale.payments &&
                                    sale.payments.length > 0 ? (
                                      sale.payments.map((p, idx) => (
                                        <Typography
                                          key={idx}
                                          variant="caption"
                                          sx={{
                                            color: "text.secondary",
                                            display: "flex",
                                            gap: 0.5,
                                            lineHeight: 1.2,
                                          }}
                                        >
                                          <span>{p.method}:</span>
                                          <span style={{ fontWeight: 500 }}>
                                            ৳{p.amount}
                                          </span>
                                        </Typography>
                                      ))
                                    ) : (
                                      <>
                                        {sale.invoices?.customerSales
                                          ?.cashPaid > 0 && (
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              color: "text.secondary",
                                              display: "flex",
                                              gap: 0.5,
                                              lineHeight: 1.2,
                                            }}
                                          >
                                            <span>Cash:</span>
                                            <span style={{ fontWeight: 500 }}>
                                              ৳
                                              {
                                                sale.invoices.customerSales
                                                  .cashPaid
                                              }
                                            </span>
                                          </Typography>
                                        )}
                                        {sale.invoices?.customerSales
                                          ?.cardPaid > 0 && (
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              color: "text.secondary",
                                              display: "flex",
                                              gap: 0.5,
                                              lineHeight: 1.2,
                                            }}
                                          >
                                            <span>Card:</span>
                                            <span style={{ fontWeight: 500 }}>
                                              ৳
                                              {
                                                sale.invoices.customerSales
                                                  .cardPaid
                                              }
                                            </span>
                                          </Typography>
                                        )}
                                      </>
                                    )}
                                  </Box>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="right">৳{getPaymentBreakdown(sale).cash.toFixed(2)}</TableCell>
                            <TableCell align="right">
                              ৳{getPaymentBreakdown(sale).card.toFixed(2)}
                              {(() => {
                                const cardPayments = (sale.payments || []).filter(p => p.method === 'Card');
                                const details = cardPayments.map(p => p.posMachineName).filter(Boolean).join(', ');
                                return details ? ` (${details})` : '';
                              })()}
                            </TableCell>
                            <TableCell align="right">
                              ৳{getPaymentBreakdown(sale).bank.toFixed(2)}
                              {(() => {
                                const bankPayments = (sale.payments || []).filter(p => p.method === 'Bank');
                                const details = bankPayments.map(p => p.bankName).filter(Boolean).join(', ');
                                return details ? ` (${details})` : '';
                              })()}
                            </TableCell>
                            <TableCell align="right">
                              ৳{getPaymentBreakdown(sale).mfs.toFixed(2)}
                              {(() => {
                                const mfsPayments = (sale.payments || []).filter(p => p.method === 'MFS');
                                const details = mfsPayments.map(p => p.mfsProviderName).filter(Boolean).join(', ');
                                return details ? ` (${details})` : '';
                              })()}
                            </TableCell>
                            {!isSalesStaff && (
                              <TableCell align="right">
                                {(() => {
                                  if (sale.status !== "Completed") {
                                    return (
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          color: "text.secondary",
                                          fontWeight: "500",
                                        }}
                                      >
                                        ---
                                      </Typography>
                                    );
                                  }
                                  let cogs =
                                    sale.invoices?.customerTax
                                      ?.totalPurchaseValue;
                                  if (
                                    cogs === undefined ||
                                    cogs === null ||
                                    cogs === 0
                                  ) {
                                    cogs =
                                      sale.items?.reduce(
                                        (sum, item) =>
                                          sum +
                                          (item.product?.purchasePrice || 0) *
                                            item.quantity,
                                        0,
                                      ) || 0;
                                  }
                                  const paymentFees = (
                                    sale.payments || []
                                  ).reduce(
                                    (sum, p) => sum + (p.feeAmount || 0),
                                    0,
                                  );
                                  const expenses =
                                    (sale.deliveryCharge || 0) +
                                    (sale.installationCost || 0) +
                                    (sale.additionalExpense || 0) +
                                    paymentFees;
                                  const emiInterest =
                                    (sale.invoiceType === "EMI" ||
                                      sale.emiOption) &&
                                    sale.emiOption?.interestRate
                                      ? (sale.total *
                                          sale.emiOption.interestRate) /
                                        100
                                      : 0;
                                  const netProfit =
                                    sale.total + emiInterest - cogs - expenses;
                                  const profitColor =
                                    netProfit >= 0
                                      ? "success.main"
                                      : "error.main";
                                  return (
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: profitColor,
                                        fontWeight: "500",
                                      }}
                                    >
                                      ৳{netProfit.toFixed(2)}
                                    </Typography>
                                  );
                                })()}
                              </TableCell>
                            )}
                            <TableCell
                              align="right"
                              sx={{ color: "error.main", fontWeight: "500" }}
                            >
                              {(() => {
                                if (
                                  sale.invoiceType === "EMI" ||
                                  sale.emiOption
                                ) {
                                  const interest = sale.emiOption?.interestRate
                                    ? (sale.total *
                                        sale.emiOption.interestRate) /
                                      100
                                    : 0;
                                  const downPayment =
                                    sale.emiOption?.downPayment ??
                                    sale.paidAmount ??
                                    0;
                                  const totalPayable = sale.total + interest;
                                  const remainingEmi =
                                    totalPayable - downPayment;
                                  return (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-end",
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        sx={{ fontWeight: "500" }}
                                      >
                                        ৳{remainingEmi.toFixed(2)}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: "text.secondary",
                                          fontSize: "0.65rem",
                                        }}
                                      >
                                        Loan Bal.
                                      </Typography>
                                    </Box>
                                  );
                                }
                                return `৳${sale.dueAmount}`;
                              })()}
                            </TableCell>
                            <TableCell>
                              {sale.payments && sale.payments.length > 0
                                ? sale.payments.length === 1
                                  ? sale.payments[0].method
                                  : `Split (${sale.payments.map((p) => p.method).join(", ")})`
                                : sale.paymentMethod || "Cash"}
                            </TableCell>
                            <TableCell
                              sx={{
                                color:
                                  sale.status === "Completed"
                                    ? "success.main"
                                    : sale.status === "Partial"
                                      ? "warning.main"
                                      : "error.main",
                                fontWeight: "500",
                              }}
                            >
                              {sale.status}
                            </TableCell>
                            <TableCell>
                              {isOnlineOrder(sale) ? (
                                <Select
                                  value={sale.orderStatus || "Processing"}
                                  onChange={(e) =>
                                    handleOrderStatusChange(
                                      sale,
                                      e.target.value,
                                    )
                                  }
                                  size="small"
                                  disabled={!isSuperAdmin && !isAdmin}
                                  sx={{
                                    minWidth: 140,
                                    backgroundColor: "#F8FAFC",
                                    color: "#1E293B",
                                    "& .MuiOutlinedInput-notchedOutline": {
                                      borderColor: "#E2E8F0",
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline":
                                      {
                                        borderColor: "#CBD5E1",
                                      },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                      {
                                        borderColor: "#6366F1",
                                      },
                                  }}
                                >
                                  <MenuItem value="Processing">
                                    Processing
                                  </MenuItem>
                                  <MenuItem value="Confirmed">
                                    Confirmed
                                  </MenuItem>
                                  <MenuItem value="Out for Delivery">
                                    Out for Delivery
                                  </MenuItem>
                                  <MenuItem value="Delivered">
                                    Delivered
                                  </MenuItem>
                                  <MenuItem value="Cancelled">
                                    Cancelled
                                  </MenuItem>
                                  <MenuItem value="Returned">Returned</MenuItem>
                                </Select>
                              ) : (
                                <Typography
                                  variant="body2"
                                  sx={{ color: "text.disabled" }}
                                >
                                  —
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {isSuperAdmin && (
                                <Tooltip title="Edit Invoice">
                                  <IconButton
                                    onClick={() => handleEditClick(sale)}
                                  >
                                    <svg
                                      style={{ width: "24px", height: "24px" }}
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        fill="#1D5F99"
                                        d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"
                                      />
                                    </svg>
                                  </IconButton>
                                </Tooltip>
                              )}
                              {!isSalesStaff && (
                                <Tooltip title="Profit Analysis">
                                  <IconButton
                                    onClick={() => {
                                      setSelectedSaleForProfit(sale);
                                      setProfitAnalysisOpen(true);
                                    }}
                                  >
                                    <svg
                                      style={{ width: "24px", height: "24px" }}
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        fill="#16A34A"
                                        d="M16,11.78L20.24,4.45L21.97,5.45L16.74,14.5L10.23,10.75L5.46,19H22V21H2V3H4V17.54L9.5,8L16,11.78Z"
                                      />
                                    </svg>
                                  </IconButton>
                                </Tooltip>
                              )}
                              {(sale.invoiceType === "EMI" || sale.emiOption) && (
                                <Tooltip title="View EMI Schedule & Payments">
                                  <IconButton
                                    onClick={async () => {
                                      try {
                                        const res = await api.get(`/api/emi/invoices?relatedSaleOrder=${sale._id}`);
                                        if (res.data?.data && res.data.data.length > 0) {
                                          const emiInvoiceId = res.data.data[0]._id;
                                          navigate(`/dashboard/emi/invoice/${emiInvoiceId}`);
                                        } else {
                                          alert("EMI Invoice not found for this sale.");
                                        }
                                      } catch (err) {
                                        console.error(err);
                                        alert("Failed to find EMI Invoice.");
                                      }
                                    }}
                                  >
                                    <CalendarIcon sx={{ color: "#0F766E" }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="View All Invoices">
                                <IconButton
                                  onClick={() => {
                                    setCompletedSaleId(sale._id);
                                    setCompletedSaleSourceType(
                                      sale.sourceType || "sale",
                                    );
                                    setShowInvoiceModal(true);
                                  }}
                                >
                                  <VisibilityIcon color="primary" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                            <Typography variant="body1" color="textSecondary">
                              No sales found matching your search criteria.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {filteredSales?.length > 0 && (
                  <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={filteredSales.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{ borderTop: '1px solid #E2E8F0' }}
                  />
                )}
              </Paper>
            </Box>
          ) : (
            <Box sx={{ display: 'block' }}>
              <Grid container spacing={2}>
              {isLoading ? (
                [1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                  <Grid item xs={12} sm={6} md={4} xl={3} key={item}>
                    <Card
                      elevation={0}
                      sx={{
                        border: "1px solid #E2E8F0",
                        borderRadius: "12px",
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      <Box sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                          <Skeleton variant="text" width="60%" height={24} />
                          <Skeleton variant="rectangular" width="20%" height={24} sx={{ borderRadius: "4px" }} />
                        </Box>
                        <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                          <Grid item xs={6}>
                            <Skeleton variant="text" width="50%" height={14} />
                            <Skeleton variant="text" width="80%" height={20} />
                          </Grid>
                          <Grid item xs={6}>
                            <Skeleton variant="text" width="50%" height={14} />
                            <Skeleton variant="text" width="80%" height={20} />
                          </Grid>
                          <Grid item xs={6}>
                            <Skeleton variant="text" width="50%" height={14} />
                            <Skeleton variant="text" width="70%" height={20} />
                          </Grid>
                          <Grid item xs={6}>
                            <Skeleton variant="text" width="50%" height={14} />
                            <Skeleton variant="text" width="70%" height={20} />
                          </Grid>
                        </Grid>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.5 }}>
                          <Skeleton variant="text" width="40%" height={20} />
                          <Skeleton variant="text" width="40%" height={20} />
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                          <Skeleton variant="text" width="30%" height={20} />
                          <Skeleton variant="text" width="30%" height={20} />
                        </Box>
                        <Divider sx={{ my: 1.5 }} />
                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                          <Skeleton variant="rectangular" width={60} height={28} sx={{ borderRadius: "6px" }} />
                          <Skeleton variant="rectangular" width={60} height={28} sx={{ borderRadius: "6px" }} />
                          <Skeleton variant="rectangular" width={60} height={28} sx={{ borderRadius: "6px" }} />
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))
              ) : paginatedSales?.length > 0 ? (
                paginatedSales.map((sale, idx) => {
                  let type = sale.type;
                  if (sale.sourceType === "order") {
                    if (
                      type === "online" ||
                      (sale.invoiceNumber &&
                        sale.invoiceNumber.startsWith("SO-ECOM-"))
                    ) {
                      type = "online";
                    } else {
                      type = type || "wholesale";
                    }
                  } else {
                    type = type || "wholesale";
                  }

                  return (
                    <Grid item xs={12} sm={6} md={4} xl={3} key={sale._id ? `${sale.sourceType}-${sale._id}` : `sale-card-${idx}`}>
                      <Card
                        elevation={0}
                        sx={{
                          border: "1px solid #E2E8F0",
                          borderRadius: "12px",
                          backgroundColor: "#FFFFFF",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                          },
                        }}
                      >
                        <Box sx={{ p: 2 }}>
                          {/* Header: Invoice and Type */}
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1.5,
                              gap: 1,
                            }}
                          >
                            {sale.sourceType === "order" ? (
                              <RouterLink
                                to={`/sales-orders/${sale._id}`}
                                style={{
                                  textDecoration: "none",
                                  color: "#1D5F99",
                                  fontWeight: 700,
                                  fontSize: "0.95rem",
                                  fontFamily: '"Outfit", sans-serif',
                                }}
                              >
                                {sale.invoiceNumber}
                              </RouterLink>
                            ) : (
                              <RouterLink
                                to={`/sales/${sale._id}`}
                                style={{
                                  textDecoration: "none",
                                  color: "#1D5F99",
                                  fontWeight: 700,
                                  fontSize: "0.95rem",
                                  fontFamily: '"Outfit", sans-serif',
                                }}
                              >
                                {sale.invoiceNumber}
                              </RouterLink>
                            )}
                            <Box>
                              {(() => {
                                if (type === "wholesale") {
                                  return (
                                    <Chip
                                      label="Wholesale"
                                      size="small"
                                      sx={{
                                        backgroundColor: "#EEF2FF",
                                        color: "#4F46E5",
                                        border: "1px solid #C7D2FE",
                                        fontWeight: 600,
                                        fontSize: "0.7rem",
                                        height: "24px",
                                      }}
                                    />
                                  );
                                } else if (type === "retail") {
                                  if (sale.invoiceType === "EMI") {
                                    return (
                                      <Chip
                                        label="Retail (EMI)"
                                        size="small"
                                        sx={{
                                          backgroundColor: "#FEF2F2",
                                          color: "#DC2626",
                                          border: "1px solid #FECACA",
                                          fontWeight: 600,
                                          fontSize: "0.7rem",
                                          height: "24px",
                                        }}
                                      />
                                    );
                                  }
                                  return (
                                    <Chip
                                      label="Retail"
                                      size="small"
                                      sx={{
                                        backgroundColor: "#ECFDF5",
                                        color: "#059669",
                                        border: "1px solid #A7F3D0",
                                        fontWeight: 600,
                                        fontSize: "0.7rem",
                                        height: "24px",
                                      }}
                                    />
                                  );
                                } else if (type === "online") {
                                  return (
                                    <Chip
                                      label="Online"
                                      size="small"
                                      sx={{
                                        backgroundColor: "#FFFBEB",
                                        color: "#D97706",
                                        border: "1px solid #FDE68A",
                                        fontWeight: 600,
                                        fontSize: "0.7rem",
                                        height: "24px",
                                      }}
                                    />
                                  );
                                }
                                return null;
                              })()}
                            </Box>
                          </Box>

                          {/* Info: Customer, Date, Creator, Payment Status */}
                          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                            <Grid item xs={6}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#94A3B8",
                                  display: "block",
                                  textTransform: "uppercase",
                                  fontWeight: 600,
                                  fontSize: "0.65rem",
                                }}
                              >
                                Customer
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 500,
                                  color: "#1E293B",
                                  fontFamily: '"Outfit", sans-serif',
                                }}
                              >
                                {getCustomerName(sale)}
                              </Typography>
                              {getCustomerPhone(sale) && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#64748B",
                                    display: "block",
                                    fontFamily: '"Outfit", sans-serif',
                                    mt: 0.2,
                                  }}
                                >
                                  {getCustomerPhone(sale)}
                                </Typography>
                              )}
                              {getProductCategory(sale) && getProductCategory(sale) !== "N/A" && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#1D5F99",
                                    display: "block",
                                    fontWeight: 500,
                                    fontFamily: '"Outfit", sans-serif',
                                    mt: 0.2,
                                  }}
                                >
                                  Category: {getProductCategory(sale)}
                                </Typography>
                              )}
                              {getProductNames(sale) && getProductNames(sale) !== "N/A" && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#0F766E",
                                    display: "block",
                                    fontWeight: 500,
                                    fontFamily: '"Outfit", sans-serif',
                                    mt: 0.2,
                                    whiteSpace: "normal",
                                  }}
                                >
                                  Items: {getProductNames(sale)}
                                </Typography>
                              )}
                            </Grid>
                            <Grid item xs={6} sx={{ textAlign: "right" }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#94A3B8",
                                  display: "block",
                                  textTransform: "uppercase",
                                  fontWeight: 600,
                                  fontSize: "0.65rem",
                                }}
                              >
                                Date
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#64748B",
                                  fontFamily: '"Outfit", sans-serif',
                                }}
                              >
                                {formatDate(sale.date, true)}
                               </Typography>
                             </Grid>
                            <Grid item xs={6}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#94A3B8",
                                  display: "block",
                                  textTransform: "uppercase",
                                  fontWeight: 600,
                                  fontSize: "0.65rem",
                                }}
                              >
                                Sold By
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#475569",
                                  fontSize: "0.8rem",
                                  fontFamily: '"Outfit", sans-serif',
                                }}
                              >
                                {sale.assignedSR?.name ||
                                  sale.createdBy?.name ||
                                  "Unknown"}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sx={{ textAlign: "right" }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#94A3B8",
                                  display: "block",
                                  textTransform: "uppercase",
                                  fontWeight: 600,
                                  fontSize: "0.65rem",
                                }}
                              >
                                Status
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color:
                                    sale.status === "Completed"
                                      ? "success.main"
                                      : sale.status === "Partial"
                                        ? "warning.main"
                                        : "error.main",
                                  fontWeight: "600",
                                  fontSize: "0.8rem",
                                  fontFamily: '"Outfit", sans-serif',
                                }}
                              >
                                {sale.status}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#94A3B8",
                                  display: "block",
                                  textTransform: "uppercase",
                                  fontWeight: 600,
                                  fontSize: "0.65rem",
                                }}
                              >
                                Payment
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#475569",
                                  fontSize: "0.8rem",
                                  fontFamily: '"Outfit", sans-serif',
                                }}
                              >
                                {sale.payments && sale.payments.length > 0
                                  ? sale.payments.length === 1
                                    ? sale.payments[0].method
                                    : `Split (${sale.payments.map((p) => p.method).join(", ")})`
                                  : sale.paymentMethod || "Cash"}
                              </Typography>
                            </Grid>
                            {!isSalesStaff && (
                            <Grid item xs={6} sx={{ textAlign: "right" }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#94A3B8",
                                  display: "block",
                                  textTransform: "uppercase",
                                  fontWeight: 600,
                                  fontSize: "0.65rem",
                                }}
                              >
                                Net Profit
                              </Typography>
                              {(() => {
                                let cogs =
                                  sale.invoices?.customerTax
                                    ?.totalPurchaseValue;
                                if (
                                  cogs === undefined ||
                                  cogs === null ||
                                  cogs === 0
                                ) {
                                  cogs =
                                    sale.items?.reduce(
                                      (sum, item) =>
                                        sum +
                                        (item.product?.purchasePrice || 0) *
                                          item.quantity,
                                      0,
                                    ) || 0;
                                }
                                const paymentFees = (
                                  sale.payments || []
                                ).reduce(
                                  (sum, p) => sum + (p.feeAmount || 0),
                                  0,
                                );
                                const expenses =
                                  (sale.deliveryCharge || 0) +
                                  (sale.installationCost || 0) +
                                  (sale.additionalExpense || 0) +
                                  paymentFees;
                                const netProfit = sale.total - cogs - expenses;
                                const profitColor =
                                  netProfit >= 0
                                    ? "success.main"
                                    : "error.main";
                                return (
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: profitColor,
                                      fontWeight: "600",
                                      fontSize: "0.8rem",
                                      fontFamily: '"Outfit", sans-serif',
                                    }}
                                  >
                                    ৳{netProfit.toFixed(2)}
                                  </Typography>
                                );
                              })()}
                            </Grid>
                            )}
                          </Grid>

                          {/* Order Status Selector — online orders only */}
                          {isOnlineOrder(sale) && (
                          <Box sx={{ mb: 2 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#94A3B8",
                                display: "block",
                                textTransform: "uppercase",
                                fontWeight: 600,
                                fontSize: "0.65rem",
                                mb: 0.5,
                              }}
                            >
                              Order Status
                            </Typography>
                            <Select
                              value={sale.orderStatus || "Processing"}
                              onChange={(e) =>
                                handleOrderStatusChange(
                                  sale,
                                  e.target.value,
                                )
                              }
                              size="small"
                              disabled={!isSuperAdmin && !isAdmin}
                              fullWidth
                              sx={{
                                backgroundColor: "#F8FAFC",
                                color: "#1E293B",
                                borderRadius: "8px",
                                fontSize: "0.8rem",
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "#E2E8F0",
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "#CBD5E1",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                  {
                                    borderColor: "#6366F1",
                                  },
                              }}
                            >
                              <MenuItem value="Processing">Processing</MenuItem>
                              <MenuItem value="Confirmed">Confirmed</MenuItem>
                              <MenuItem value="Out for Delivery">
                                Out for Delivery
                              </MenuItem>
                              <MenuItem value="Delivered">Delivered</MenuItem>
                              <MenuItem value="Cancelled">Cancelled</MenuItem>
                              <MenuItem value="Returned">Returned</MenuItem>
                            </Select>
                          </Box>
                          )}

                          <Divider sx={{ borderStyle: "dashed", mb: 2 }} />

                          {/* Amounts: Total, Paid, Due */}
                          <Grid container spacing={1} sx={{ mb: 2 }}>
                            <Grid item xs={4}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#94A3B8",
                                  display: "block",
                                  textTransform: "uppercase",
                                  fontWeight: 600,
                                  fontSize: "0.65rem",
                                }}
                              >
                                Total
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                  color: "#1E293B",
                                  fontFamily: '"Outfit", sans-serif',
                                }}
                              >
                                ৳{sale.total}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#94A3B8",
                                  display: "block",
                                  textTransform: "uppercase",
                                  fontWeight: 600,
                                  fontSize: "0.65rem",
                                }}
                              >
                                Paid
                              </Typography>
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    color: "#10B981",
                                    fontFamily: '"Outfit", sans-serif',
                                  }}
                                >
                                  {sale.invoiceType === "EMI"
                                    ? `DP: ৳${sale.emiOption?.downPayment ?? sale.paidAmount}`
                                    : `৳${sale.paidAmount}`}
                                </Typography>
                                {(sale.paymentMethod === "Split" ||
                                  (sale.payments && sale.payments.length > 0) ||
                                  sale.invoices?.customerSales?.cashPaid > 0 ||
                                  sale.invoices?.customerSales?.cardPaid >
                                    0) && (
                                  <Box sx={{ mt: 0.5 }}>
                                    {sale.payments &&
                                    sale.payments.length > 0 ? (
                                      sale.payments.map((p, idx) => (
                                        <Typography
                                          key={idx}
                                          variant="caption"
                                          sx={{
                                            color: "text.secondary",
                                            display: "block",
                                            lineHeight: 1.2,
                                          }}
                                        >
                                          {p.method}:{" "}
                                          <span style={{ fontWeight: 500 }}>
                                            ৳{p.amount}
                                          </span>
                                        </Typography>
                                      ))
                                    ) : (
                                      <>
                                        {sale.invoices?.customerSales
                                          ?.cashPaid > 0 && (
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              color: "text.secondary",
                                              display: "block",
                                              lineHeight: 1.2,
                                            }}
                                          >
                                            Cash:{" "}
                                            <span style={{ fontWeight: 500 }}>
                                              ৳
                                              {
                                                sale.invoices.customerSales
                                                  .cashPaid
                                              }
                                            </span>
                                          </Typography>
                                        )}
                                        {sale.invoices?.customerSales
                                          ?.cardPaid > 0 && (
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              color: "text.secondary",
                                              display: "block",
                                              lineHeight: 1.2,
                                            }}
                                          >
                                            Card:{" "}
                                            <span style={{ fontWeight: 500 }}>
                                              ৳
                                              {
                                                sale.invoices.customerSales
                                                  .cardPaid
                                              }
                                            </span>
                                          </Typography>
                                        )}
                                      </>
                                    )}
                                  </Box>
                                )}
                              </Box>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#94A3B8",
                                  display: "block",
                                  textTransform: "uppercase",
                                  fontWeight: 600,
                                  fontSize: "0.65rem",
                                }}
                              >
                                Due
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color:
                                    sale.dueAmount > 0 ? "#EF4444" : "#64748B",
                                  fontFamily: '"Outfit", sans-serif',
                                }}
                              >
                                ৳{sale.dueAmount}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Divider sx={{ mb: 1.5 }} />

                          {/* Actions Footer */}
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              justifyContent: "flex-end",
                              flexWrap: "wrap",
                              alignItems: "center",
                            }}
                          >
                            {isSuperAdmin && (
                              <Button
                                variant="outlined"
                                color="warning"
                                size="small"
                                onClick={() => handleEditClick(sale)}
                                sx={{
                                  borderRadius: "6px",
                                  textTransform: "none",
                                  fontSize: "0.7rem",
                                  py: 0.5,
                                  px: 1.2,
                                  borderColor: "#D97706",
                                  color: "#D97706",
                                  "&:hover": {
                                    borderColor: "#B45309",
                                    backgroundColor: "rgba(217, 119, 6, 0.04)",
                                  },
                                }}
                              >
                                Edit
                              </Button>
                            )}
                            {!isSalesStaff && (
                            <IconButton
                              onClick={() => {
                                setSelectedSaleForProfit(sale);
                                setProfitAnalysisOpen(true);
                              }}
                              size="small"
                              sx={{
                                backgroundColor: "rgba(22, 163, 74, 0.1)",
                                color: "#16A34A",
                                borderRadius: "6px",
                                p: 0.75,
                                "&:hover": {
                                  backgroundColor: "rgba(22, 163, 74, 0.2)",
                                },
                              }}
                            >
                              <svg
                                style={{ width: "18px", height: "18px" }}
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M16,11.78L20.24,4.45L21.97,5.45L16.74,14.5L10.23,10.75L5.46,19H22V21H2V3H4V17.54L9.5,8L16,11.78Z"
                                />
                              </svg>
                            </IconButton>
                            )}

                            {(sale.invoiceType === "EMI" || sale.emiOption) && (
                               <IconButton
                                 onClick={async () => {
                                   try {
                                     const res = await api.get(`/api/emi/invoices?relatedSaleOrder=${sale._id}`);
                                     if (res.data?.data && res.data.data.length > 0) {
                                       const emiInvoiceId = res.data.data[0]._id;
                                       navigate(`/dashboard/emi/invoice/${emiInvoiceId}`);
                                     } else {
                                       alert("EMI Invoice not found for this sale.");
                                     }
                                   } catch (err) {
                                     console.error(err);
                                     alert("Failed to find EMI Invoice.");
                                   }
                                 }}
                                 size="small"
                                 sx={{
                                   backgroundColor: "rgba(15, 118, 110, 0.1)",
                                   color: "#0F766E",
                                   borderRadius: "6px",
                                   p: 0.75,
                                   "&:hover": {
                                     backgroundColor: "rgba(15, 118, 110, 0.2)",
                                   },
                                 }}
                               >
                                 <CalendarIcon sx={{ fontSize: 18 }} />
                               </IconButton>
                             )}
                             <IconButton
                              onClick={() => {
                                setCompletedSaleId(sale._id);
                                setCompletedSaleSourceType(
                                  sale.sourceType || "sale",
                                );
                                setShowInvoiceModal(true);
                              }}
                              size="small"
                              sx={{
                                backgroundColor: "rgba(29, 95, 153, 0.1)",
                                color: "#1D5F99",
                                borderRadius: "6px",
                                p: 0.75,
                                "&:hover": {
                                  backgroundColor: "rgba(29, 95, 153, 0.2)",
                                },
                              }}
                            >
                              <VisibilityIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  );
                })
              ) : (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      py: 3,
                      textAlign: "center",
                      color: "#64748B",
                      fontFamily: '"Outfit", sans-serif',
                    }}
                  >
                    No sales found matching your search criteria.
                  </Box>
                </Grid>
              )}
            </Grid>
            {filteredSales?.length > 0 && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Paper sx={{ width: '100%' }}>
                  <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={filteredSales.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </Paper>
              </Box>
            )}
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Share Menu */}
      <Menu
        anchorEl={shareAnchorEl}
        open={Boolean(shareAnchorEl)}
        onClose={handleShareClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {selectedSale && (
          <Box sx={{ p: 2, minWidth: 300 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Share Invoice #{selectedSale.invoiceNumber}
            </Typography>
            <InvoiceShareButtons
              sale={selectedSale}
              companyInfo={companyInfo}
            />
          </Box>
        )}
      </Menu>

      {/* Edit Invoice Modal - Super Admin Only */}
      {isSuperAdmin && selectedSaleForEdit && (
        <EditInvoiceModal
          open={editDialogOpen}
          onClose={handleEditClose}
          saleId={selectedSaleForEdit._id}
          initialData={selectedSaleForEdit}
          sourceType={selectedSaleForEdit.sourceType}
        />
      )}
      {/* Sale Invoice Modal */}
      <SaleInvoiceModal
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        saleId={completedSaleId}
        sourceType={completedSaleSourceType}
      />

      {profitAnalysisOpen && (
        <ProfitAnalysisModal
          open={profitAnalysisOpen}
          onClose={() => {
            setProfitAnalysisOpen(false);
            setSelectedSaleForProfit(null);
          }}
          sale={selectedSaleForProfit}
        />
      )}
    </Box>
  );
};

export default AllSales;
