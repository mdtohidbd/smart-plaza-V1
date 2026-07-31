const MFSProvider = require('../models/MFSProvider');
const asyncHandler = require('express-async-handler');

// @desc    Get all MFS Providers
// @route   GET /api/mfs-providers
// @access  Private
const getMFSProviders = asyncHandler(async (req, res) => {
  const filter = req.shopId ? { shop: req.shopId } : {};
  const providers = await MFSProvider.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: providers.length, data: providers });
});

// @desc    Get single MFS Provider
// @route   GET /api/mfs-providers/:id
// @access  Private
const getMFSProvider = asyncHandler(async (req, res) => {
  const provider = await MFSProvider.findById(req.params.id);
  if (!provider) return res.status(404).json({ success: false, message: 'MFS Provider not found' });
  res.status(200).json({ success: true, data: provider });
});

// @desc    Create MFS Provider
// @route   POST /api/mfs-providers
// @access  Private (Admin+)
const createMFSProvider = asyncHandler(async (req, res) => {
  const { name, feePerThousand, isActive } = req.body;
  const provider = await MFSProvider.create({
    name,
    feePerThousand: feePerThousand || 0,
    isActive: isActive !== undefined ? isActive : true,
    ...(req.shopId && { shop: req.shopId })
  });
  res.status(201).json({ success: true, data: provider });
});

// @desc    Update MFS Provider
// @route   PUT /api/mfs-providers/:id
// @access  Private (Admin+)
const updateMFSProvider = asyncHandler(async (req, res) => {
  let provider = await MFSProvider.findById(req.params.id);
  if (!provider) return res.status(404).json({ success: false, message: 'MFS Provider not found' });

  provider = await MFSProvider.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true
  });
  res.status(200).json({ success: true, data: provider });
});

// @desc    Delete MFS Provider
// @route   DELETE /api/mfs-providers/:id
// @access  Private (Admin+)
const deleteMFSProvider = asyncHandler(async (req, res) => {
  const provider = await MFSProvider.findById(req.params.id);
  if (!provider) return res.status(404).json({ success: false, message: 'MFS Provider not found' });
  await provider.deleteOne();
  res.status(200).json({ success: true, message: 'MFS Provider deleted' });
});

module.exports = {
  getMFSProviders,
  getMFSProvider,
  createMFSProvider,
  updateMFSProvider,
  deleteMFSProvider
};
