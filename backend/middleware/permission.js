const User = require('../models/User');
const { isSuperAdminPlus, hasSuperAdminPlusPermission, getSuperAdminPlusPermissions, isInvestor, hasInvestorPermission, getInvestorPermissions } = require('../utils/roleUtils');

// Check permission for specific module and action
const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Super Admins bypass all permission checks
      if (user.role === 'Super Admin') {
        return next();
      }

      // Super Admin Plus: full access within allowed modules
      if (isSuperAdminPlus(user) && hasSuperAdminPlusPermission(module)) {
        return next();
      }

      // Investor: read access within allowed modules
      if (isInvestor(user) && hasInvestorPermission(module) && action === 'read') {
        return next();
      }

      // Check if user has the required permission (nested structure: permissions.module.action)
      let hasPermission = false;
      
      if (user.permissions[module] && typeof user.permissions[module] === 'object') {
        hasPermission = !!user.permissions[module][action];
      }
      
      // Implicit read grants: users who can transact in a domain can read its dependencies
      if (!hasPermission && action === 'read') {
        const salesPerms    = user.permissions.sales    || {};
        const purchasePerms = user.permissions.purchase || {};
        const canTransact   = salesPerms.read || salesPerms.create || salesPerms.update ||
                              purchasePerms.read || purchasePerms.create || purchasePerms.update;

        if (module === 'contacts' && canTransact) hasPermission = true;
        if (module === 'products' && (canTransact || (user.permissions.inventory || {}).read)) hasPermission = true;
        if (module === 'users'    && canTransact) hasPermission = true;
      }
      
      if (!hasPermission) {
        console.log(`[PERMISSION DENIED] User ${user.email} (${user.role}) attempted ${action} on ${module}`);
        return res.status(403).json({ 
          message: `You don't have permission to ${action} ${module}` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Server error during permission check' });
    }
  };
};

// Authorize based on role (array of allowed roles)
const authorize = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ message: 'Server error during authorization' });
    }
  };
};

module.exports = { checkPermission, authorize };