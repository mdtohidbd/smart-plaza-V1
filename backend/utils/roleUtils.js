const isSuperAdminPlus = (user) =>
  user?.role?.toLowerCase() === 'super admin plus';

const isSuperAdmin = (user) =>
  user?.role === 'Super Admin' || user?.role?.toLowerCase() === 'super admin';

const isInvestor = (user) =>
  user?.role?.toLowerCase() === 'investor';

const isSalesStaff = (user) =>
  user?.role?.toLowerCase() === 'sales staff';

const isSR = (user) =>
  user?.role?.toLowerCase() === 'sr';

const isDSR = (user) =>
  user?.role?.toLowerCase() === 'dsr';

const isManager = (user) =>
  user?.role?.toLowerCase() === 'manager';

const INVESTOR_MODULES = ['investors'];

const SUPER_ADMIN_PLUS_MODULES = [
  'sales',
  'products',
  'contacts',
  'inventory',
  'ecommerce',
  'settings',
  'warranty',
];

const allTrue = { read: true, create: true, update: true, delete: true };
const noAccess = { read: false, create: false, update: false, delete: false };
const readOnly = { read: true, create: false, update: false, delete: false };

const getInvestorPermissions = () => ({
  dashboard: noAccess,
  sales: noAccess,
  purchase: noAccess,
  products: noAccess,
  contacts: noAccess,
  inventory: noAccess,
  accounts: noAccess,
  reports: noAccess,
  users: noAccess,
  messages: noAccess,
  settings: noAccess,
  warranty: noAccess,
  routes: noAccess,
  investors: readOnly,
  emi: noAccess,
  ecommerce: noAccess,
});

const hasInvestorPermission = (module) =>
  INVESTOR_MODULES.includes(module);

const getSuperAdminPlusPermissions = () => ({
  dashboard: noAccess,
  sales: allTrue,
  purchase: noAccess,
  products: allTrue,
  contacts: allTrue,
  inventory: allTrue,
  accounts: noAccess,
  reports: noAccess,
  users: readOnly,
  messages: noAccess,
  settings: { read: true, create: false, update: true, delete: false },
  warranty: allTrue,
  routes: noAccess,
  investors: noAccess,
  emi: readOnly,
  ecommerce: allTrue,
});

// Super Admin gets full access to EVERYTHING
const getSuperAdminPermissions = () => ({
  dashboard: allTrue,
  sales: allTrue,
  purchase: allTrue,
  products: allTrue,
  contacts: allTrue,
  inventory: allTrue,
  accounts: allTrue,
  reports: allTrue,
  users: allTrue,
  messages: allTrue,
  settings: allTrue,
  warranty: allTrue,
  routes: allTrue,
  investors: allTrue,
  emi: allTrue,
  ecommerce: allTrue,
});

const hasSuperAdminPlusPermission = (module) =>
  SUPER_ADMIN_PLUS_MODULES.includes(module);

const sanitizeSaleForRole = (saleObj, user) => {
  if (!saleObj) return saleObj;
  
  const obj = typeof saleObj.toObject === 'function' ? saleObj.toObject() : { ...saleObj };
  
  // First handle Super Admin Plus
  if (isSuperAdminPlus(user) && obj.invoices) {
    obj.invoices = sanitizeInvoicesForRole(obj.invoices, user);
  }
  
  // Now handle Sales Staff and SR/DSR - remove all profit-related fields
  if (isSalesStaff(user) || isSR(user) || isDSR(user)) {
    delete obj.calculatedNetProfit;
    delete obj.netProfit;
    delete obj.profitMargin;
    if (obj.items) {
      obj.items = obj.items.map(item => {
        const itemCopy = { ...item };
        delete itemCopy.purchaseCost;
        delete itemCopy.purchasePrice;
        if (itemCopy.product && typeof itemCopy.product === 'object') {
          delete itemCopy.product.purchasePrice;
        }
        return itemCopy;
      });
    }
    if (obj.invoices) {
      // Remove any profit-related fields from invoices
      Object.keys(obj.invoices).forEach(key => {
        const inv = obj.invoices[key];
        if (inv && typeof inv === 'object') {
          delete inv.totalPurchaseValue;
          delete inv.purchaseTotal;
          delete inv.profit;
        }
      });
    }
  }
  
  return obj;
};

const sanitizeSalesListForRole = (sales, user) => {
  if (!Array.isArray(sales)) return sales;
  return sales.map(sale => sanitizeSaleForRole(sale, user));
};

const sanitizeInvoicesForRole = (invoices, user) => {
  if (!invoices || !isSuperAdminPlus(user)) {
    return invoices;
  }

  const invObj = typeof invoices.toObject === 'function' ? invoices.toObject() : invoices;

  return {
    fabricatedSales: invObj.fabricatedSales,
    fabricatedTax: invObj.fabricatedTax,
  };
};

module.exports = {
  isSuperAdminPlus,
  isSuperAdmin,
  isInvestor,
  isSalesStaff,
  isSR,
  isDSR,
  isManager,
  hasSuperAdminPlusPermission,
  hasInvestorPermission,
  getSuperAdminPlusPermissions,
  getSuperAdminPermissions,
  getInvestorPermissions,
  sanitizeInvoicesForRole,
  sanitizeSaleForRole,
  sanitizeSalesListForRole,
};
