const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({ 
      success: false,
      message: `User not found with id ${req.params.id}` 
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Get user performance (sales metrics)
// @route   GET /api/users/:id/performance
// @access  Private
const getUserPerformance = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: `User not found with id ${userId}`
    });
  }

  const Sale = require('../models/Sale');
  
  // Find all retail sales credited to this user (either as assignedSR, or as createdBy if no assignedSR exists)
  const sales = await Sale.find({ 
    type: 'retail',
    $or: [
      { assignedSR: userId },
      { assignedSR: { $exists: false }, createdBy: userId },
      { assignedSR: null, createdBy: userId }
    ]
  });
  
  const salesCount = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);

  res.status(200).json({
    success: true,
    data: {
      salesCount,
      totalRevenue
    }
  });
});

// @desc    Create user
// @route   POST /api/users
// @access  Private
const createUser = asyncHandler(async (req, res) => {
  // If password is not provided, set a default
  if (!req.body.password) {
    req.body.password = '123456';
  }
  
  // Auto-approve users created by admins/super admins
  req.body.approvalStatus = 'Approved';
  req.body.isApproved = true;
  if (req.body.isActive === undefined) req.body.isActive = true;
  
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ 
      success: false,
      message: `User not found with id ${req.params.id}` 
    });
  }

  // Handle password update if provided
  if (req.body.password) {
    user.password = req.body.password;
    await user.save();
    delete req.body.password; // Remove from body so it's not updated again by findByIdAndUpdate
  }

  // Update other user fields if there are any
  if (Object.keys(req.body).length > 0) {
    user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');
  } else {
    // If only password was updated, get the updated user without password
    user = await User.findById(req.params.id).select('-password');
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ 
      success: false,
      message: `User not found with id ${req.params.id}` 
    });
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Update user permissions
// @route   PUT /api/users/:id/permissions
// @access  Private
const updateUserPermissions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ 
      success: false,
      message: `User not found with id ${req.params.id}` 
    });
  }

  // Update permissions
  user.permissions = req.body.permissions;
  await user.save();

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private
const updateUserRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ 
      success: false,
      message: `User not found with id ${req.params.id}` 
    });
  }

  // Update role
  user.role = req.body.role;
  await user.save();

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Approve/Reject user
// @route   PUT /api/users/:id/approve
// @access  Private (Super Admin only)
const approveUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ 
      success: false,
      message: `User not found with id ${req.params.id}` 
    });
  }

  const { approvalStatus, isActive, role } = req.body;

  // Validate approval status
  if (approvalStatus && !['Approved', 'Rejected'].includes(approvalStatus)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid approval status. Must be "Approved" or "Rejected"' 
    });
  }

  // Update approval status
  if (approvalStatus) {
    user.approvalStatus = approvalStatus;
    
    // Update role if provided during approval
    if (approvalStatus === 'Approved' && role) {
      user.role = role;
    }
    
    // If approved and currently inactive, optionally activate the user
    if (approvalStatus === 'Approved' && isActive !== undefined) {
      user.isActive = isActive;
    } else if (approvalStatus === 'Approved') {
      // Auto-activate when approved (default behavior)
      user.isActive = true;
    } else if (approvalStatus === 'Rejected') {
      // Deactivate if rejected
      user.isActive = false;
    }
  }

  // Update isActive directly if provided
  if (isActive !== undefined) {
    user.isActive = isActive;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${approvalStatus === 'Approved' ? 'approved' : 'rejected'} successfully`,
    data: user
  });
});

module.exports = {
  getUsers,
  getUser,
  getUserPerformance,
  createUser,
  updateUser,
  deleteUser,
  updateUserPermissions,
  updateUserRole,
  approveUser
};