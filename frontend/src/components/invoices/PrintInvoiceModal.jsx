import React, { useState, useRef, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Tabs, 
  Tab, 
  Box,
  IconButton,
  CircularProgress,
  Typography,
  Alert,
  Skeleton,
  Paper,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import { useReactToPrint } from 'react-to-print';
import { useQuery } from 'react-query';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdmin, isSuperAdminPlus, isManager, isSalesStaff } from '../../utils/roleUtils';
import CustomerSalesInvoice from './CustomerSalesInvoice';
import CustomerTaxInvoice from './CustomerTaxInvoice';
const RETAIL_SALES_INVOICE_TITLE = 'Retail Sales Invoice';
const RETAIL_TAX_INVOICE_TITLE = 'Retail Tax Invoice';

const PrintInvoiceModal = ({ open, onClose, saleId, sourceType = 'sale' }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const { user } = useAuth();
  const isGovtAuditor = isSuperAdminPlus(user);
  const canViewTaxInvoice = (isSuperAdmin(user) || isManager(user) || isSalesStaff(user)) && !isGovtAuditor;

  const salesInvoiceRef = useRef();
  const taxInvoiceRef = useRef();
  const fabSalesInvoiceRef = useRef();
  const fabTaxInvoiceRef = useRef();

  useEffect(() => {
    if (open) {
      setTabIndex(0);
    }
  }, [open, saleId]);

  // Fetch sale data and invoices
  const { data: saleData, isLoading, error } = useQuery(
    ['sale-with-invoices', saleId, sourceType],
    async () => {
      if (!saleId) return null;
      let endpoint = `/api/sales/${saleId}`;
      if (sourceType === 'order') {
        endpoint = `/api/sales-orders/${saleId}`;
      } else if (sourceType === 'emi') {
        endpoint = `/api/emi/invoices/${saleId}`;
      }
      const response = await api.get(endpoint);
      return response.data.data;
    },
    {
      enabled: !!saleId && open,
      staleTime: 0,
      cacheTime: 0
    }
  );

  const handlePrintSales = useReactToPrint({
    contentRef: salesInvoiceRef,
    documentTitle: `Sales_Invoice_${saleData?.invoiceNumber || 'New'}`
  });

  const handlePrintTax = useReactToPrint({
    contentRef: taxInvoiceRef,
    documentTitle: `Tax_Invoice_${saleData?.invoiceNumber || 'New'}`
  });

  const handlePrintFabSales = useReactToPrint({
    contentRef: fabSalesInvoiceRef,
    documentTitle: `Retail_Sales_Invoice_${saleData?.invoiceNumber || 'New'}`
  });

  const handlePrintFabTax = useReactToPrint({
    contentRef: fabTaxInvoiceRef,
    documentTitle: `Retail_Tax_Invoice_${saleData?.invoiceNumber || 'New'}`
  });

  const handlePrintEMITax = useReactToPrint({
    contentRef: taxInvoiceRef,
    documentTitle: `EMI_Tax_Invoice_${saleData?.invoiceNumber || 'New'}`
  });

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  if (error || (open && !isLoading && !saleData)) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Alert severity="error">Error loading invoice data.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Only return null if not loading and data is missing
  if (!isLoading && !saleData) return null;

  const isEMI = sourceType === 'emi';
  const isOrder = sourceType === 'order' || saleData?.type === 'online' || (!saleData?.invoices?.customerSales && !isEMI);
  let invoices = saleData?.invoices || {};
  let formattedSaleData = saleData;

  if (isEMI && saleData) {
    const items = saleData.products?.map(p => ({
      productName: p.name || p.product?.name,
      model: p.product?.model || '',
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      total: p.total,
      warranty: p.product?.warranty || p.warranty || 'N/A',
      goodsDescription: p.name || p.product?.name,
      salesTaxPercent: 15,
      grandTotal: p.total
    })) || [];

    const mappedInvoiceData = {
      items,
      subTotal: saleData.subtotal,
      deliveryCharge: saleData.deliveryCharge,
      installationCost: saleData.installationCost,
      discount: saleData.discount,
      payableAmount: saleData.totalAmount,
      paidAmount: saleData.downPayment?.amount || 0,
      dueAmount: saleData.outstandingBalance,
      grandTotal: items.reduce((sum, item) => sum + (item.grandTotal || 0), 0)
    };

    invoices = {
      customerSales: mappedInvoiceData,
      customerTax: mappedInvoiceData,
    };

    formattedSaleData = {
      ...saleData,
      date: saleData.invoiceDate || saleData.createdAt,
      customer: {
        ...saleData.customer,
        contactName: saleData.customerName || saleData.customer?.name || saleData.customer?.contactName,
        contactNumber: saleData.customerPhone || saleData.customer?.phone || saleData.customer?.contactNumber,
        address: saleData.customerAddress || saleData.customer?.address,
        businessName: saleData.customer?.businessName
      },
      soldBy: saleData.assignedSR || saleData.createdBy,
      isEmi: true,
      emiOption: saleData.emiPlan ? {
        duration: saleData.emiPlan.duration,
        downPayment: saleData.downPayment?.amount || 0,
        interestRate: saleData.emiPlan.interestRate || 0,
      } : null,
      paymentMethod: 'EMI',
      invoices: invoices
    };
  } else if (isOrder && saleData && !invoices.customerSales) {
    const items = (saleData.items || []).map(p => {
      const prodName = p.product?.name || p.productName || p.name || 'Product';
      const prodModel = p.product?.model || p.model || '';
      const qty = Number(p.quantity) || 1;
      const unitPrice = Number(p.unitPrice || p.price || 0);
      const disc = Number(p.discount || 0);
      const itemTotal = (unitPrice - disc) * qty;
      return {
        productName: prodName,
        model: prodModel,
        quantity: qty,
        unitPrice: unitPrice,
        discount: disc,
        total: itemTotal,
        warranty: p.product?.warranty || p.warranty || 'N/A',
        goodsDescription: prodName,
        salesTaxPercent: 15,
        grandTotal: itemTotal
      };
    });

    const numSubTotal = Number(saleData.subTotal || saleData.subtotal || 0) || items.reduce((sum, item) => sum + item.total, 0);
    const numDeliveryCharge = Number(saleData.deliveryCharge || 0);
    const numInstallationCost = Number(saleData.installationCost || 0);
    const numDiscount = Number(saleData.discount || 0);
    const numPayable = Number(saleData.total || saleData.payableAmount || 0) || (numSubTotal + numDeliveryCharge + numInstallationCost - numDiscount);
    const numPaid = Number(saleData.paidAmount || 0);
    const numDue = Number(saleData.dueAmount ?? (numPayable - numPaid));

    const mappedInvoiceData = {
      items,
      subTotal: numSubTotal,
      deliveryCharge: numDeliveryCharge,
      installationCost: numInstallationCost,
      discount: numDiscount,
      payableAmount: numPayable,
      paidAmount: numPaid,
      dueAmount: numDue,
      grandTotal: numPayable
    };

    invoices = {
      customerSales: mappedInvoiceData,
      customerTax: mappedInvoiceData,
    };

    formattedSaleData = {
      ...saleData,
      date: saleData.date || saleData.createdAt || new Date(),
      invoiceNumber: saleData.invoiceNumber || saleData.orderNumber || '',
      customer: {
        ...(typeof saleData.customer === 'object' ? saleData.customer : {}),
        contactName: saleData.customer?.contactName || saleData.customerName || saleData.customer?.name || 'Online Customer',
        contactNumber: saleData.customer?.contactNumber || saleData.customerPhone || saleData.customer?.phone || '',
        address: saleData.shippingAddress || saleData.customer?.address || saleData.customerAddress || '',
        email: saleData.customerEmail || saleData.customer?.email || ''
      },
      soldBy: saleData.assignedSR || saleData.soldBy || { name: 'Online Store' },
      paymentMethod: saleData.paymentMethod || 'Cash on Delivery',
      invoices: invoices
    };
  }

  const getPrintHandler = () => {
    if (isGovtAuditor && !isEMI) {
      return tabIndex === 0 ? handlePrintFabSales : handlePrintFabTax;
    }
    if (tabIndex === 0) return handlePrintSales;
    if (tabIndex === 1 && canViewTaxInvoice) return handlePrintTax;
    return handlePrintSales;
  };

  const getPrintLabel = () => {
    if (isGovtAuditor && !isEMI) {
      return tabIndex === 0 ? 'Retail Sales' : 'Retail Tax';
    }
    if (tabIndex === 0) return 'Sales';
    if (tabIndex === 1 && canViewTaxInvoice) return 'Tax';
    return 'Sales';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isGovtAuditor && !isEMI ? 'Print Retail Invoices' : 'Print Customer Invoices'}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={tabIndex} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          {isGovtAuditor && !isEMI
            ? [
                <Tab key="fab-sales" label={RETAIL_SALES_INVOICE_TITLE} />,
                <Tab key="fab-tax" label={RETAIL_TAX_INVOICE_TITLE} />
              ]
            : [
                <Tab key="sales" label="Customer Sales Invoice" />,
                ...(canViewTaxInvoice ? [<Tab key="tax" label="Customer Tax Invoice" />] : [])
              ]
          }
        </Tabs>
      </Box>

      <DialogContent dividers sx={{ bgcolor: '#f0f2f5', minHeight: '60vh' }}>
        {isLoading ? (
          <Paper sx={{ p: 4, mx: 'auto', maxWidth: '800px', minHeight: '500px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Header Skeleton */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Skeleton variant="circular" width={60} height={60} />
                <Box>
                  <Skeleton variant="text" width={150} height={28} />
                  <Skeleton variant="text" width={100} height={16} />
                </Box>
              </Box>
              <Skeleton variant="text" width={120} height={40} />
            </Box>
            
            {/* Info Section Skeleton */}
            <Grid container spacing={4} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Skeleton variant="text" width="40%" height={20} />
                <Skeleton variant="text" width="80%" height={24} />
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="70%" height={20} />
              </Grid>
              <Grid item xs={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Skeleton variant="rectangular" width={220} height={32} sx={{ mb: 1, borderRadius: '4px' }} />
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="50%" height={20} />
                <Skeleton variant="text" width="40%" height={20} />
              </Grid>
            </Grid>
            
            {/* Table Skeleton */}
            <Box sx={{ mt: 2 }}>
              <Skeleton variant="rectangular" height={36} sx={{ mb: 1, borderRadius: '4px' }} />
              <Skeleton variant="rectangular" height={44} sx={{ mb: 1, borderRadius: '4px' }} />
              <Skeleton variant="rectangular" height={44} sx={{ mb: 1, borderRadius: '4px' }} />
            </Box>
            
            {/* Totals Skeleton */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, mt: 'auto', pt: 2 }}>
              <Skeleton variant="text" width="30%" height={20} />
              <Skeleton variant="text" width="25%" height={20} />
              <Skeleton variant="text" width="35%" height={24} />
            </Box>
          </Paper>
        ) : isGovtAuditor && !isEMI ? (
          <>
            <Box sx={{ display: tabIndex === 0 ? 'block' : 'none' }} ref={fabSalesInvoiceRef}>
              <CustomerSalesInvoice invoiceData={invoices.fabricatedSales} sale={formattedSaleData} title={RETAIL_SALES_INVOICE_TITLE} />
            </Box>
            <Box sx={{ display: tabIndex === 1 ? 'block' : 'none' }} ref={fabTaxInvoiceRef}>
              <CustomerTaxInvoice invoiceData={invoices.fabricatedTax} sale={formattedSaleData} title={RETAIL_TAX_INVOICE_TITLE} />
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ display: tabIndex === 0 ? 'block' : 'none' }} ref={salesInvoiceRef}>
              <CustomerSalesInvoice invoiceData={invoices.customerSales} sale={formattedSaleData} />
            </Box>

            {canViewTaxInvoice && (
              <Box sx={{ display: tabIndex === 1 ? 'block' : 'none' }} ref={taxInvoiceRef}>
                <CustomerTaxInvoice invoiceData={invoices.customerTax} sale={formattedSaleData} />
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button 
          variant="contained" 
          onClick={getPrintHandler()}
          startIcon={<PrintIcon />}
          disabled={isLoading}
        >
          Print {getPrintLabel()} Invoice
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrintInvoiceModal;
