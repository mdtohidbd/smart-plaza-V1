import React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import RequireAuth from '../components/RequireAuth';

// Import all route components
import DashboardRouter from '../views/DashboardRouter';
import Sales from '../views/Sales/Sales';
import Purchase from '../views/Purchase/Purchase';
import Products from '../views/Products/Products';
import Contacts from '../views/Contacts/Contacts';
import Inventory from '../views/Inventory/Inventory';
import Accounts from '../views/Accounts/Accounts';
import Reports from '../views/Reports/Reports';
import Users from '../views/Users/Users';
import EmployeeRouter from '../views/Employees/EmployeeRouter';
import Sms from '../views/SMS/Sms';
import Settings from '../views/Settings/Settings';
import Testimonials from '../views/Testimonials/Testimonials';
import ReviewsList from '../views/Reviews/ReviewsList';
import OffersManagement from '../views/Offers/OffersManagement';
import Notifications from '../views/Notifications/Notifications';

import SalesOrders from '../views/SalesOrders/SalesOrders';
import SaleOrderDetail from '../views/SalesOrders/SaleOrderDetail';
import QuotationList from '../views/Quotations/QuotationList';
import CreateQuotation from '../views/Quotations/CreateQuotation';
import EditQuotation from '../views/Quotations/EditQuotation';
import QuotationDetail from '../views/Quotations/QuotationDetail';
import ProductImagesManagement from '../views/Products/ProductImagesManagement';
import EMI from '../views/EMI/EMI';
import Investors from '../views/Investors/Investors';
import InvestorDashboard from '../views/Investors/InvestorDashboard';
import WithdrawalRequests from '../views/Investors/WithdrawalRequests';
import BusinessReports from '../views/Investors/BusinessReports';
import FraudCheckerDashboard from '../views/FraudChecker/FraudCheckerDashboard';

const MainContent = () => {
  const theme = useTheme();

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#F5F7FA',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: theme.transitions.create('margin', {
          easing: theme.transitions.easing.easeInOut,
          duration: theme.transitions.duration.standard,
        }),
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important' }} />
      <Box sx={{ flexGrow: 1, p: 0, width: '100%' }}>
        <ErrorBoundary>
          <RequireAuth>
            <Routes>
              <Route index element={<DashboardRouter />} />
              <Route path="dashboard" element={<DashboardRouter />} />
              <Route path="fraud-checker" element={<FraudCheckerDashboard />} />
              <Route path="sales/*" element={<Sales />} />
              <Route path="quotations" element={<QuotationList />} />
              <Route path="quotations/create" element={<CreateQuotation />} />
              <Route path="quotations/edit/:id" element={<EditQuotation />} />
              <Route path="quotations/:id" element={<QuotationDetail />} />
              <Route path="sales-orders" element={<SalesOrders />} />
              <Route path="sales-orders/:id" element={<SaleOrderDetail />} />
              <Route path="purchase/*" element={<Purchase />} />
              <Route path="products/images" element={<ProductImagesManagement />} />
              <Route path="products/*" element={<Products />} />
              <Route path="contacts/*" element={<Contacts />} />
              <Route path="users/*" element={<Users />} />
              <Route path="employees/*" element={<EmployeeRouter />} />
              <Route path="inventory/*" element={<Inventory />} />
              <Route path="accounts/*" element={<Accounts />} />
              <Route path="reports/*" element={<Reports />} />
              <Route path="sms/*" element={<Sms />} />
              <Route path="settings/*" element={<Settings />} />
              <Route path="testimonials/*" element={<Testimonials />} />
              <Route path="reviews/*" element={<ReviewsList />} />
              <Route path="offers/*" element={<OffersManagement />} />
              <Route path="notifications/*" element={<Notifications />} />
              <Route path="emi/*" element={<EMI />} />
              <Route path="investors/dashboard/:id" element={<InvestorDashboard />} />
              <Route path="investors/dashboard" element={<InvestorDashboard />} />
              <Route path="investors/demo-dashboard" element={<InvestorDashboard />} />
              <Route path="investors/business-reports" element={<BusinessReports />} />
              <Route path="investors/withdrawals" element={<WithdrawalRequests />} />
              <Route path="investors/*" element={<Investors />} />
            </Routes>
          </RequireAuth>
        </ErrorBoundary>
      </Box>
    </Box>
  );
};

export default MainContent;
