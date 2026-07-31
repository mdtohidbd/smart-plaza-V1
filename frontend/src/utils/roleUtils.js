export const SUPER_ADMIN_PLUS_ROLE = 'Super Admin Plus';

/** Modules Super Admin Plus has full access to (within their allowed menu) */
export const SUPER_ADMIN_PLUS_MODULES = [
  'sales',
  'products',
  'contacts',
  'inventory',
  'ecommerce',
  'settings',
  'warranty',
  'emi',
  'users',
];

export const isSuperAdminPlus = (user) =>
  user?.role?.toLowerCase() === 'super admin plus';

export const isSuperAdmin = (user) =>
  user?.role === 'Super Admin' || user?.role?.toLowerCase() === 'super admin';

export const isSuperAdminOrPlus = (user) =>
  isSuperAdmin(user) || isSuperAdminPlus(user);

export const isInvestor = (user) =>
  user?.role?.toLowerCase() === 'investor';

export const isSalesStaff = (user) =>
  user?.role?.toLowerCase() === 'sales staff';

export const isManager = (user) =>
  user?.role?.toLowerCase() === 'manager';

const INVESTOR_MODULES = ['investors'];

export const hasInvestorPermission = (module) =>
  INVESTOR_MODULES.includes(module);

/** Dashboard paths Investor role may access */
export const INVESTOR_ALLOWED_PATHS = [
  '/dashboard/investors/dashboard',
  '/dashboard/investors/business-reports',
];

const INVESTOR_DASHBOARD_PATH = /^\/dashboard\/investors\/dashboard(\/[a-f0-9]{24})?$/i;

export const isPathAllowedForInvestor = (pathname) => {
  if (INVESTOR_ALLOWED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return true;
  }
  if (INVESTOR_DASHBOARD_PATH.test(pathname)) {
    return true;
  }
  return false;
};

export const hasSuperAdminPlusPermission = (module) =>
  SUPER_ADMIN_PLUS_MODULES.includes(module);

/** Dashboard paths Super Admin Plus (govt/tax auditors) may access */
export const SUPER_ADMIN_PLUS_ALLOWED_PATHS = [
  '/dashboard',
  '/dashboard/',
  // Sales
  '/dashboard/sales',
  '/dashboard/sales-orders',
  '/dashboard/quotations',
  '/dashboard/fraud-checker',
  // Products & Stock
  '/dashboard/products',
  '/dashboard/inventory',
  // Contacts
  '/dashboard/contacts',
  // E-Commerce
  '/dashboard/testimonials',
  '/dashboard/reviews',
  '/dashboard/offers',
  // EMI
  '/dashboard/emi',
  // Settings
  '/dashboard/settings',
  // Employees
  '/dashboard/employees',
];

export const isPathAllowedForSuperAdminPlus = (pathname) => {
  return SUPER_ADMIN_PLUS_ALLOWED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
};
