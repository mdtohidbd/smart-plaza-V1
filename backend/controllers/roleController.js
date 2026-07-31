const Role = require('../models/Role');
const asyncHandler = require('express-async-handler');

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private
const getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find({}).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: roles.length,
    data: roles
  });
});

// @desc    Get single role
// @route   GET /api/roles/:id
// @access  Private
const getRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    return res.status(404).json({ 
      success: false,
      message: `Role not found with id ${req.params.id}` 
    });
  }

  res.status(200).json({
    success: true,
    data: role
  });
});

// @desc    Create role
// @route   POST /api/roles
// @access  Private
const createRole = asyncHandler(async (req, res) => {
  const role = await Role.create(req.body);

  res.status(201).json({
    success: true,
    data: role
  });
});

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private
const updateRole = asyncHandler(async (req, res) => {
  let role = await Role.findById(req.params.id);

  if (!role) {
    return res.status(404).json({ 
      success: false,
      message: `Role not found with id ${req.params.id}` 
    });
  }

  // Update role
  role = await Role.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });



  // SYNC PERMISSIONS TO ALL USERS WITH THIS ROLE
  // This ensures dynamic permission updates take effect immediately
  if (req.body.permissions) {
    const User = require('../models/User');
    await User.updateMany(
      { role: role.name },
      { 
        $set: { permissions: role.permissions },
        $inc: { permissionVersion: 1 } // Increment to force frontend refresh
      }
    );
    console.log(`✅ Synced updated permissions to all ${role.name} users`);
  }



  res.status(200).json({
    success: true,
    data: role
  });
});

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private
const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    return res.status(404).json({ 
      success: false,
      message: `Role not found with id ${req.params.id}` 
    });
  }

  const protectedRoles = ['super admin', 'super admin plus', 'manager', 'sales staff', 'investor', 'e-commerce admin', 'superadmin', 'admin', 'sr', 'dsr', 'super-admin'];
  if (protectedRoles.includes(role.name.toLowerCase())) {
     return res.status(400).json({
       success: false,
       message: `${role.name} role cannot be deleted, but it can be edited.`
     });
  }

  await role.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole
};