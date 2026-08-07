import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StoreIcon from '@mui/icons-material/Store';
import CategoryIcon from '@mui/icons-material/Category';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import MessageIcon from '@mui/icons-material/Message';
import SettingsIcon from '@mui/icons-material/Settings';
import StarIcon from '@mui/icons-material/Star';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../context/AuthContext';
import { isSuperAdmin, isSuperAdminPlus, hasSuperAdminPlusPermission, isInvestor, isSalesStaff } from '../utils/roleUtils';

const SUPER_ADMIN_PLUS_MENU_PATHS = new Set([
  '/dashboard/inventory/list',
  '/dashboard/inventory/history',
  '/dashboard/inventory/alert',
  '/dashboard/inventory/damaged',
  '/dashboard/inventory/stock-in',
  '/dashboard/sales/retail',
  '/dashboard/sales/retail-records',
  '/dashboard/sales/warranty',
  '/dashboard/sales/due-collection',
  '/dashboard/sales/all',
  '/dashboard/sales-orders',
  '/dashboard/fraud-checker',
  '/dashboard/products/all',
  '/dashboard/products/ecommerce',
  '/dashboard/products/images',
  '/dashboard/products/categories',
  '/dashboard/products/units',
  '/dashboard/products/brands',
  '/dashboard/contacts/customers',
  '/dashboard/contacts/companies',
  '/dashboard/contacts/add',
  '/dashboard/testimonials',
  '/dashboard/reviews',
  '/dashboard/offers',
  '/dashboard/settings/banners',
  '/dashboard/settings/general',
  '/dashboard/settings/shops',
  '/dashboard/quotations',
]);

const INVESTOR_MENU_PATHS = new Set([
  '/dashboard/investors/dashboard',
  '/dashboard/investors/business-reports',
]);

export const useMenu = () => {
  const { user } = useAuth();

  // Check if user has permission for a module
  const hasPermission = (module, action = 'read') => {
    if (!user || !user.permissions) return false;
    if (isSuperAdmin(user)) return true;
    if (isSuperAdminPlus(user) && hasSuperAdminPlusPermission(module)) return true;

    const modulePermissions = user.permissions[module];
    if (!modulePermissions) return false;

    return modulePermissions[action] === true;
  };

  // Filter menu items based on user permissions
  const filterMenuForSuperAdminPlus = (items) => {
    return items
      .map((item) => {
        if (item.subItems) {
          const filteredSubItems = item.subItems
            .map((subItem) => {
              if (subItem.subItems) {
                const nested = subItem.subItems.filter(
                  (nestedItem) => nestedItem.path && SUPER_ADMIN_PLUS_MENU_PATHS.has(nestedItem.path)
                );
                return nested.length > 0 ? { ...subItem, subItems: nested } : null;
              }
              return subItem.path && SUPER_ADMIN_PLUS_MENU_PATHS.has(subItem.path) ? subItem : null;
            })
            .filter(Boolean);

          if (filteredSubItems.length > 0) {
            return { ...item, subItems: filteredSubItems };
          }
          return null;
        }

        return item.path && SUPER_ADMIN_PLUS_MENU_PATHS.has(item.path) ? item : null;
      })
      .filter(Boolean);
  };

  const filterMenuForInvestor = (items) => {
    return items
      .map((item) => {
        if (item.subItems) {
          const filteredSubItems = item.subItems.filter(
            (subItem) => subItem.path && INVESTOR_MENU_PATHS.has(subItem.path)
          );
          if (filteredSubItems.length > 0) {
            return { ...item, subItems: filteredSubItems };
          }
          return null;
        }
        return item.path && INVESTOR_MENU_PATHS.has(item.path) ? item : null;
      })
      .filter(Boolean);
  };

  const filterMenuByPermission = (items) => {
    if (!user || !user.permissions) return [];
    if (isSuperAdmin(user)) return items;
    if (isSuperAdminPlus(user)) return filterMenuForSuperAdminPlus(items);
    if (isInvestor(user)) return filterMenuForInvestor(items);

    return items.map(item => {
      // Explicitly hide Purchase, Accounts, Ecommerce modules for Sales Staff
      if (isSalesStaff(user)) {
        if (item.text === 'Purchase' || item.text === 'Accounts' || item.text === 'E-Commerce') {
          return null;
        }
      }
      
      // If item has subItems, filter out unauthorized ones
      if (item.subItems) {
        const filteredSubItems = item.subItems.map(subItem => {
          // Explicitly hide certain items for Sales Staff
          if (isSalesStaff(user)) {
            if (
              subItem.text === 'Sales Return' || 
              subItem.text === 'All Sales Reports'
            ) {
              return null;
            }
          }
          
          if (subItem.subItems) {
            // Handle second-level nesting
            const filteredNestedItems = subItem.subItems.filter(nestedItem => {
              if (nestedItem.permissionModule) {
                return hasPermission(nestedItem.permissionModule, nestedItem.permissionAction || 'read');
              }
              return false;
            });

            if (filteredNestedItems.length > 0) {
              return { ...subItem, subItems: filteredNestedItems };
            }
            return null;
          }

          // Check permission for regular subItem
          if (subItem.permissionModule) {
            return hasPermission(subItem.permissionModule, subItem.permissionAction || 'read') ? subItem : null;
          }
          return null; // NO permission specified = HIDE by default
        }).filter(Boolean); // Remove null items

        // Only show parent if it has at least one authorized sub-item
        if (filteredSubItems.length > 0) {
          return { ...item, subItems: filteredSubItems };
        }
        return null;
      }

      // For items without subItems, check permission directly
      if (item.permissionModule) {
        return hasPermission(item.permissionModule, item.permissionAction || 'read') ? item : null;
      }
      return null; // NO permission specified = HIDE by default
    }).filter(Boolean);
  };

  const getMenuItems = () => {
    const baseItems = [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', permissionModule: 'dashboard', permissionAction: 'read' },
      {
        text: 'Sales',
        icon: <ShoppingCartIcon />,
        permissionModule: 'sales',
        permissionAction: 'read',
        subItems: [
          { text: 'Wholesale Sales', path: '/dashboard/sales/wholesale', permissionModule: 'sales', permissionAction: 'create' },
          { text: 'Wholesale Records', path: '/dashboard/sales/wholesale-records', permissionModule: 'sales', permissionAction: 'read' },
          { text: 'Retail Sales', path: '/dashboard/sales/retail', permissionModule: 'sales', permissionAction: 'create' },
          { text: 'Retail Records', path: '/dashboard/sales/retail-records', permissionModule: 'sales', permissionAction: 'read' },
          { text: 'Warranty Management', path: '/dashboard/sales/warranty', permissionModule: 'sales', permissionAction: 'read' },
          { text: 'Quotations', path: '/dashboard/quotations', permissionModule: 'sales', permissionAction: 'read' },
          { text: 'Transfers', path: '/dashboard/sales/transfers', permissionModule: 'sales', permissionAction: 'read' }, // Unimplemented
          { text: 'Online Orders', path: '/dashboard/sales-orders', permissionModule: 'sales', permissionAction: 'read' },
          { text: 'Sales Return', path: '/dashboard/sales/return', permissionModule: 'sales', permissionAction: 'create' },
          { text: 'Sales Due Collection', path: '/dashboard/sales/due-collection', permissionModule: 'sales', permissionAction: 'update' },
          { text: 'All Sales', path: '/dashboard/sales/all', permissionModule: 'sales', permissionAction: 'read' },
          { text: 'Sales Reports', path: '/dashboard/reports/all-sales-reports', permissionModule: 'reports', permissionAction: 'read' },
        ].filter(Boolean)
      },
      {
        text: 'EMI Management',
        icon: <BusinessIcon />,
        permissionModule: 'emi',
        permissionAction: 'read',
        subItems: [
          { text: 'EMI Dashboard', path: '/dashboard/emi/dashboard', permissionModule: 'emi', permissionAction: 'read' },
          { text: 'EMI Sales', path: '/dashboard/emi/sales', permissionModule: 'emi', permissionAction: 'read' },
          { text: 'EMI Overdue', path: '/dashboard/emi/overdue', permissionModule: 'emi', permissionAction: 'read' },
          { text: 'EMI Receivable', path: '/dashboard/emi/receivable', permissionModule: 'emi', permissionAction: 'read' },
          { text: 'EMI Reports', path: '/dashboard/emi/reports', permissionModule: 'emi', permissionAction: 'read' },
          { text: 'EMI Collections', path: '/dashboard/emi/collections', permissionModule: 'emi', permissionAction: 'read' },
          { text: 'EMI Collections List', path: '/dashboard/emi/collections-list', permissionModule: 'emi', permissionAction: 'read' },
        ]
      },
      {
        text: 'Purchase',
        icon: <StoreIcon />,
        permissionModule: 'purchase',
        permissionAction: 'read',
        subItems: [
          { text: 'Add Purchase', path: '/dashboard/purchase/add', permissionModule: 'purchase', permissionAction: 'create' },
          { text: 'All Purchases', path: '/dashboard/purchase/all', permissionModule: 'purchase', permissionAction: 'read' },
          { text: 'Purchase Return', path: '/dashboard/purchase/return', permissionModule: 'purchase', permissionAction: 'create' },
          { text: 'Purchase Due Payment', path: '/dashboard/purchase/due-payment', permissionModule: 'purchase', permissionAction: 'update' },
          { text: 'Purchase Reports', path: '/dashboard/reports/purchase', permissionModule: 'reports', permissionAction: 'read' },
        ]
      },
      {
        text: 'Products and Stock',
        icon: <CategoryIcon />,
        permissionModule: 'products',
        permissionAction: 'read',
        subItems: [
          { text: 'All Products', path: '/dashboard/products/all', permissionModule: 'products', permissionAction: 'read' },
          { text: 'Add Product', path: '/dashboard/products/add', permissionModule: 'products', permissionAction: 'create' },
          { text: 'Stock In', path: '/dashboard/inventory/stock-in', permissionModule: 'inventory', permissionAction: 'create' },
          { text: 'Stock List', path: '/dashboard/inventory/list', permissionModule: 'inventory', permissionAction: 'read' },
          { text: 'Stock History', path: '/dashboard/inventory/history', permissionModule: 'inventory', permissionAction: 'read' },
          { text: 'Stock Alert', path: '/dashboard/inventory/alert', permissionModule: 'inventory', permissionAction: 'read' },
          { text: 'Damaged Products', path: '/dashboard/inventory/damaged', permissionModule: 'inventory', permissionAction: 'update' },
          { text: 'Ecommerce Visibility', path: '/dashboard/products/ecommerce', permissionModule: 'products', permissionAction: 'update' },
          { text: 'Manage Images', path: '/dashboard/products/images', permissionModule: 'products', permissionAction: 'update' },
          { text: 'Categories', path: '/dashboard/products/categories', permissionModule: 'products', permissionAction: 'read' },
          { text: 'Units', path: '/dashboard/products/units', permissionModule: 'products', permissionAction: 'read' },
          { text: 'Brands', path: '/dashboard/products/brands', permissionModule: 'products', permissionAction: 'read' },
          { text: 'Stock Reports', path: '/dashboard/reports/stock', permissionModule: 'reports', permissionAction: 'read' },
        ]
      },
      {
        text: 'Contacts',
        icon: <PeopleIcon />,
        permissionModule: 'contacts',
        permissionAction: 'read',
        subItems: [
          { text: 'Add Contact', path: '/dashboard/contacts/add', permissionModule: 'contacts', permissionAction: 'create' },
          { text: 'Customers', path: '/dashboard/contacts/customers', permissionModule: 'contacts', permissionAction: 'read' },
          { text: 'Suppliers', path: '/dashboard/contacts/companies', permissionModule: 'contacts', permissionAction: 'read' },
        ]
      },

      {
        text: 'Accounts',
        icon: <AccountBalanceIcon />,
        permissionModule: 'accounts',
        permissionAction: 'read',
        subItems: [
          { text: 'Types Management', path: '/dashboard/accounts/heads', permissionModule: 'accounts', permissionAction: 'read' },
          { text: 'Income', path: '/dashboard/accounts/income', permissionModule: 'accounts', permissionAction: 'read' },
          { text: 'Expense', path: '/dashboard/accounts/expense', permissionModule: 'accounts', permissionAction: 'read' },
          { text: 'Profit & Loss', path: '/dashboard/accounts/profit-loss', permissionModule: 'reports', permissionAction: 'read' },
          { text: 'Cash Flow', path: '/dashboard/accounts/cash-flow', permissionModule: 'reports', permissionAction: 'read' },
        ]
      },

      {
        text: 'Investors',
        icon: <AccountBalanceWalletIcon />,
        permissionModule: 'investors',
        permissionAction: 'read',
        subItems: [
          { text: 'My Dashboard', path: '/dashboard/investors/dashboard', permissionModule: 'investors', permissionAction: 'read' },
          { text: 'Investor List', path: '/dashboard/investors', exactMatch: true, permissionModule: 'investors', permissionAction: 'read' },
          { text: 'Withdrawal Requests', path: '/dashboard/investors/withdrawals', permissionModule: 'investors', permissionAction: 'update' },
          { text: 'Business Reports', path: '/dashboard/investors/business-reports', permissionModule: 'investors', permissionAction: 'read' },
        ]
      },
      {
        text: 'E-Commerce',
        icon: <StarIcon />,
        permissionModule: 'ecommerce',
        permissionAction: 'read',
        subItems: [
          { text: 'Store Visibility', path: '/dashboard/products/ecommerce', permissionModule: 'products', permissionAction: 'update' },
          { text: 'Categories', path: '/dashboard/products/categories', permissionModule: 'products', permissionAction: 'read' },
          { text: 'Manage Banners', path: '/dashboard/settings/banners', permissionModule: 'settings', permissionAction: 'read' },
          { text: 'Product Images', path: '/dashboard/products/images', permissionModule: 'products', permissionAction: 'update' },
          { text: 'Customer Testimonials', path: '/dashboard/testimonials', permissionModule: 'ecommerce', permissionAction: 'read' },
          { text: 'Online Orders', path: '/dashboard/sales-orders', permissionModule: 'sales', permissionAction: 'read' },
          { text: 'Fraud Detection', path: '/dashboard/fraud-checker', permissionModule: 'sales', permissionAction: 'read' },
          { text: 'Reviews Management', path: '/dashboard/reviews', permissionModule: 'ecommerce', permissionAction: 'read' }
        ]
      },
      {
        text: 'Employees',
        icon: <WorkIcon />,
        permissionModule: 'users',
        permissionAction: 'read',
        subItems: [
          { text: 'All Employees', path: '/dashboard/employees', permissionModule: 'users', permissionAction: 'read' },
          { text: 'Add Employee', path: '/dashboard/employees/add', permissionModule: 'users', permissionAction: 'create' },
        ]
      },
      {
        text: 'Users',
        icon: <PersonIcon />,
        permissionModule: 'users',
        permissionAction: 'read',
        subItems: [
          { text: 'Add User', path: '/dashboard/users/add', permissionModule: 'users', permissionAction: 'create' },
          { text: 'All Users', path: '/dashboard/users/all', permissionModule: 'users', permissionAction: 'read' },
          { text: 'SR List', path: '/dashboard/users/sr-list', permissionModule: 'users', permissionAction: 'read' },
          { text: 'DSR List', path: '/dashboard/users/dsr-list', permissionModule: 'users', permissionAction: 'read' },
          { text: 'User Approval', path: '/dashboard/users/approval', permissionModule: 'users', permissionAction: 'update' },
          { text: 'Roles', path: '/dashboard/users/roles', permissionModule: 'users', permissionAction: 'read' },
        ]
      },
      {
        text: 'SMS',
        icon: <MessageIcon />,
        permissionModule: 'messages',
        permissionAction: 'read',
        subItems: [
          { text: 'Individual SMS', path: '/dashboard/sms/individual-sms', permissionModule: 'messages', permissionAction: 'read' },
          { text: 'Bulk SMS Campaign', path: '/dashboard/sms/bulk-sms', permissionModule: 'messages', permissionAction: 'create' },
          { text: 'SMS Reports & Logs', path: '/dashboard/sms/sms-reports', permissionModule: 'messages', permissionAction: 'read' },
        ]
      },
      {
        text: 'Offers Management',
        icon: <LocalOfferIcon />,
        path: '/dashboard/offers',
        permissionModule: 'ecommerce',
        permissionAction: 'read',
      },
      {
        text: 'Notification',
        icon: <NotificationsIcon />,
        path: '/dashboard/notifications',
        permissionModule: 'notifications', // Assuming 'notifications' is the permission module
        permissionAction: 'read',
      },
      {
        text: 'Settings',
        icon: <SettingsIcon />,
        permissionModule: 'settings',
        permissionAction: 'read',
        subItems: [
          { text: 'General', path: '/dashboard/settings/general', permissionModule: 'settings', permissionAction: 'read' },
          { text: 'Shops & Branches', path: '/dashboard/settings/shops', permissionModule: 'settings', permissionAction: 'read' },
          { text: 'Route/Beat Mgmt', path: '/dashboard/settings/routes', permissionModule: 'settings', permissionAction: 'read' },
          { text: 'SMS Configuration', path: '/dashboard/settings/sms', permissionModule: 'settings', permissionAction: 'update' },
          { text: 'Payment Config', path: '/dashboard/settings/payment-config', permissionModule: 'settings', permissionAction: 'update' },
          { text: 'Banner Management', path: '/dashboard/settings/banners', permissionModule: 'settings', permissionAction: 'read' },
        ]
      },
    ];

    // Filter items based on user permissions
    return filterMenuByPermission(baseItems);
  };

  return { getMenuItems, hasPermission };
};
