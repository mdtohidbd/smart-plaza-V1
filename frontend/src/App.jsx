import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import ErrorBoundary from './components/ErrorBoundary';

import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import RequireAuth from './components/RequireAuth';
import RequirePermission from './components/RequirePermission';
import Layout from './layouts/Layout';
const Homepage = React.lazy(() => import('./views/Homepage'));
const Login = React.lazy(() => import('./views/Login'));
const Register = React.lazy(() => import('./views/Register'));
const Sales = React.lazy(() => import('./views/Sales/Sales'));
const Purchase = React.lazy(() => import('./views/Purchase/Purchase'));
const Products = React.lazy(() => import('./views/Products/Products'));
const Contacts = React.lazy(() => import('./views/Contacts/Contacts'));
const Inventory = React.lazy(() => import('./views/Inventory/Inventory'));
const Accounts = React.lazy(() => import('./views/Accounts/Accounts'));
const Reports = React.lazy(() => import('./views/Reports/Reports'));
const Users = React.lazy(() => import('./views/Users/Users'));
const Sms = React.lazy(() => import('./views/SMS/Sms'));
const Settings = React.lazy(() => import('./views/Settings/Settings'));
const Warranty = React.lazy(() => import('./views/Warranty/Warranty'));

// Import new components
const SalesOrders = React.lazy(() => import('./views/SalesOrders/SalesOrders'));
const SaleOrderDetail = React.lazy(() => import('./views/SalesOrders/SaleOrderDetail'));

// Account Layout
const AccountLayout = React.lazy(() => import('./views/Ecommerce/Account/AccountLayout'));

// EMI Routes
const EMI = React.lazy(() => import('./views/EMI/EMI'));

// E-commerce imports
const EcommerceHomepage = React.lazy(() => import('./views/Ecommerce/EcommerceHomepage'));
const EcommerceProducts = React.lazy(() => import('./views/Ecommerce/EcommerceProducts'));
const About = React.lazy(() => import('./views/Ecommerce/About'));
const Contact = React.lazy(() => import('./views/Ecommerce/Contact'));
const Offers = React.lazy(() => import('./views/Ecommerce/Offers'));
const EMIDashboardWidget = React.lazy(() => import('./views/Ecommerce/EMIDashboardWidget'));
const OrderHistory = React.lazy(() => import('./views/Ecommerce/OrderHistory'));
const OrderDetails = React.lazy(() => import('./views/Ecommerce/OrderDetails'));
const EMIOutstanding = React.lazy(() => import('./views/Ecommerce/EMIOutstanding'));
const Checkout = React.lazy(() => import('./views/Ecommerce/Checkout'));
const UserProfile = React.lazy(() => import('./views/Ecommerce/UserProfile'));
const EMIDashboard = React.lazy(() => import('./views/Ecommerce/EMIDashboard'));
const OrderTracking = React.lazy(() => import('./views/Ecommerce/OrderTracking'));
const PaymentHistory = React.lazy(() => import('./views/Ecommerce/PaymentHistory'));
const OrderSuccess = React.lazy(() => import('./views/Ecommerce/OrderSuccess'));

// Investor Management
const Investors = React.lazy(() => import('./views/Investors/Investors'));

// E-commerce Routes (also accessible without /shop prefix)
const ProductDetails = React.lazy(() => import('./views/Products/ProductDetails'));

const Wishlist = React.lazy(() => import('./views/Ecommerce/Wishlist'));
const Orders = React.lazy(() => import('./views/Ecommerce/Orders'));

function App() {
  console.log('App component rendered');
  const location = useLocation();

  // Log route changes at app level
  React.useEffect(() => {
    console.log('App - Current location:', location.pathname);
  }, [location.pathname]);

  return (
    <SettingsProvider>
      <AuthProvider>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', backgroundColor: '#FAFAF8', minHeight: '100vh' }}>
          {/* Route fix applied - products/* before products/:id */}
          <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</Box>}>
            <Routes>
              {/* Main Homepage - E-commerce Site (EyeGears Style) */}
              <Route path="/" element={<EcommerceHomepage />} />
              
              {/* E-commerce Routes - All under /shop namespace */}
              <Route path="/shop" element={<EcommerceHomepage />} />
              <Route path="/shop/products" element={<EcommerceProducts />} />
              <Route path="/shop/cart" element={<Navigate to="/shop/checkout" replace />} />
              <Route path="/shop/order-success" element={<OrderSuccess />} />
              <Route path="/shop/checkout" element={<Checkout />} />
              <Route path="/shop/checkout/:id" element={<Checkout />} />
              <Route path="/shop/about" element={<About />} />
              <Route path="/shop/contact" element={<Contact />} />
              <Route path="/shop/offers" element={<Offers />} />
              
              {/* E-commerce Auth Routes */}
              <Route path="/shop/login" element={<Login isEcommerce={true} />} />
              <Route path="/shop/register" element={<Register isEcommerce={true} />} />
              
              {/* E-commerce User Account Routes */}
              <Route path="/shop/account" element={<RequireAuth><AccountLayout /></RequireAuth>}>
                <Route index element={<Navigate to="profile" replace />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="orders" element={<OrderHistory noLayout={true} />} />
                <Route path="track-order" element={<OrderTracking noLayout={true} />} />
                <Route path="emi" element={<EMIDashboard />} />
                <Route path="payments" element={<PaymentHistory />} />
                <Route path="wishlist" element={<Wishlist />} />
              </Route>
              
              {/* Legacy or Standalone orders (guest access) */}
              <Route path="/shop/orders" element={<OrderHistory />} />
              <Route path="/shop/orders/:id" element={<OrderDetails />} />
              <Route path="/shop/orders/tracking" element={<OrderTracking />} />
              {/* E-commerce Product Details Route */}
              <Route path="/shop/products/:id" element={<ProductDetails />} />
              
              {/* E-commerce Routes (also accessible without /shop prefix) */}
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              
              {/* E-commerce Account Routes */}
              <Route path="/account/*" element={<Navigate to="/shop/account" replace />} />
              <Route path="/wishlist" element={<Navigate to="/shop/account/wishlist" replace />} />
              <Route path="/orders" element={<Navigate to="/shop/orders" replace />} />
              <Route path="/orders/:id" element={<Navigate to="/shop/orders/:id" replace />} />
              <Route path="/emi-outstanding" element={<EMIOutstanding />} />
              
              {/* Auth Routes */}
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin/register" element={<Register />} />
              <Route path="/login" element={<Navigate to="/admin/login" replace />} />
              <Route path="/register" element={<Navigate to="/admin/register" replace />} />
              
              {/* ERP Dashboard Routes - Protected */}
              <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard/*" element={<Layout />} />
              
              {/* Redirect legacy /users routes to /dashboard/users */}
              <Route path="/users/*" element={<Navigate to="/dashboard/users" replace />} />
              
              {/* Redirect legacy /products routes to /dashboard/products */}
              <Route path="/products/*" element={<Navigate to="/dashboard/products" replace />} />
              
              {/* Redirect legacy /routes to /dashboard/settings/routes */}
              <Route path="/routes" element={<Navigate to="/dashboard/settings/routes" replace />} />
              
              {/* Redirect legacy /contacts routes to /dashboard/contacts */}
              <Route path="/contacts/*" element={<Navigate to="/dashboard/contacts" replace />} />
              
              {/* Redirect legacy /settings routes to /dashboard/settings */}
              <Route path="/settings/*" element={<Navigate to="/dashboard/settings" replace />} />
              
              {/* Redirect legacy /inventory routes to /dashboard/inventory */}
              <Route path="/inventory/*" element={<Navigate to="/dashboard/inventory" replace />} />
              
              {/* Redirect legacy /accounts routes to /dashboard/accounts */}
              <Route path="/accounts/*" element={<Navigate to="/dashboard/accounts" replace />} />
              
              {/* Redirect legacy /reports routes to /dashboard/reports */}
              <Route path="/reports/*" element={<Navigate to="/dashboard/reports" replace />} />
              
              {/* Redirect legacy /sms routes to /dashboard/sms */}
              <Route path="/sms/*" element={<Navigate to="/dashboard/sms" replace />} />
              
              {/* Redirect legacy /warranty routes to /dashboard/warranty */}
              <Route path="/warranty" element={<Navigate to="/dashboard/warranty" replace />} />
              
              {/* EMI Routes - Protected */}
              <Route path="/emi/*" element={<EMI />} />
              
              {/* Legacy Homepage (ERP Landing) */}
              <Route path="/home" element={<Homepage />} />
              
              {/* Legacy /ecommerce paths → shop */}
              <Route path="/ecommerce/cart" element={<Navigate to="/shop/checkout" replace />} />
              <Route path="/ecommerce/*" element={<Navigate to="/shop" replace />} />
              
              <Route path="/cart" element={<Navigate to="/shop/checkout" replace />} />
            </Routes>
          </React.Suspense>
        </Box>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;