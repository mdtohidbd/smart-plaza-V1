import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequirePermission from '../../components/RequirePermission';
import SalesReports from './SalesReports';
import PurchaseReports from './PurchaseReports';
import StockReports from './StockReports';
import RetailReports from './RetailReports';
import WholesaleReports from './WholesaleReports';
import AllWholesale from './AllWholesale';
import AllSales from '../Sales/AllSales';
import ProductWiseSale from './ProductWiseSale';
import ProductWiseTopChart from './ProductWiseTopChart';
// import DeliveryWiseTopChart from './DeliveryWiseTopChart';
// import RouteWiseTopChart from './RouteWiseTopChart';
import ConsolidatedInvoice from './ConsolidatedInvoice';
import SalesTopSheet from './SalesTopSheet';
import CustomerLedger from './CustomerLedger';
import SalesDueReport from './SalesDueReport';
import SalesReturnReport from './SalesReturnReport';
import AllPurchase from './AllPurchase';
import ProductWisePurchase from './ProductWisePurchase';
import PurchaseTopSheet from './PurchaseTopSheet';
// import PurchaseCommission from './PurchaseCommission';
import SupplierLedger from './SupplierLedger';
import PurchaseDue from './PurchaseDue';
import PurchaseReturn from './PurchaseReturn';

const Reports = () => {
  return (
    <div>
      <Routes>
        <Route path="sales" element={<RequirePermission module="reports" action="read"><SalesReports /></RequirePermission>} />
        <Route path="retail" element={<RequirePermission module="reports" action="read"><RetailReports /></RequirePermission>} />
        <Route path="all-sales-reports" element={<RequirePermission module="reports" action="read"><WholesaleReports /></RequirePermission>} />
        <Route path="all-sales-reports/all-sales" element={<RequirePermission module="sales" action="read"><AllSales /></RequirePermission>} />
        <Route path="all-sales-reports/all" element={<RequirePermission module="reports" action="read"><AllWholesale /></RequirePermission>} />
        <Route path="all-sales-reports/product-wise" element={<RequirePermission module="reports" action="read"><ProductWiseSale /></RequirePermission>} />
        <Route path="all-sales-reports/product-top-chart" element={<RequirePermission module="reports" action="read"><ProductWiseTopChart /></RequirePermission>} />
        {/* <Route path="all-sales-reports/delivery-top-chart" element={<RequirePermission module="reports" action="read"><DeliveryWiseTopChart /></RequirePermission>} /> */}
        {/* <Route path="all-sales-reports/route-top-chart" element={<RequirePermission module="reports" action="read"><RouteWiseTopChart /></RequirePermission>} /> */}
        <Route path="all-sales-reports/consolidated-invoice" element={<RequirePermission module="reports" action="read"><ConsolidatedInvoice /></RequirePermission>} />
        <Route path="all-sales-reports/sales-top-sheet" element={<RequirePermission module="reports" action="read"><SalesTopSheet /></RequirePermission>} />
        <Route path="all-sales-reports/customer-ledger" element={<RequirePermission module="reports" action="read"><CustomerLedger /></RequirePermission>} />
        <Route path="all-sales-reports/sales-due" element={<RequirePermission module="reports" action="read"><SalesDueReport /></RequirePermission>} />
        <Route path="all-sales-reports/sales-return" element={<RequirePermission module="reports" action="read"><SalesReturnReport /></RequirePermission>} />
        <Route path="purchase" element={<RequirePermission module="reports" action="read"><PurchaseReports /></RequirePermission>} />
        <Route path="purchase/all" element={<RequirePermission module="reports" action="read"><AllPurchase /></RequirePermission>} />
        <Route path="purchase/product-wise" element={<RequirePermission module="reports" action="read"><ProductWisePurchase /></RequirePermission>} />
        <Route path="purchase/top-sheet" element={<RequirePermission module="reports" action="read"><PurchaseTopSheet /></RequirePermission>} />
        {/* <Route path="purchase/commission" element={<RequirePermission module="reports" action="read"><PurchaseCommission /></RequirePermission>} /> */}
        <Route path="purchase/supplier-ledger" element={<RequirePermission module="reports" action="read"><SupplierLedger /></RequirePermission>} />
        <Route path="purchase/due" element={<RequirePermission module="reports" action="read"><PurchaseDue /></RequirePermission>} />
        <Route path="purchase/return" element={<RequirePermission module="reports" action="read"><PurchaseReturn /></RequirePermission>} />
        <Route path="stock" element={<RequirePermission module="reports" action="read"><StockReports /></RequirePermission>} />
        <Route index element={<RequirePermission module="reports" action="read"><SalesReports /></RequirePermission>} />
      </Routes>
    </div>
  );
};

export default Reports;