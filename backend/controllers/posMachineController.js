const POSMachine = require('../models/POSMachine');
const asyncHandler = require('express-async-handler');

// @desc    Get all POS Machines
// @route   GET /api/pos-machines
// @access  Private
const getPOSMachines = asyncHandler(async (req, res) => {
  const filter = req.shopId ? { shop: req.shopId } : {};
  const machines = await POSMachine.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: machines.length, data: machines });
});

// @desc    Get single POS Machine
// @route   GET /api/pos-machines/:id
// @access  Private
const getPOSMachine = asyncHandler(async (req, res) => {
  const machine = await POSMachine.findById(req.params.id);
  if (!machine) return res.status(404).json({ success: false, message: 'POS Machine not found' });
  res.status(200).json({ success: true, data: machine });
});

// @desc    Create POS Machine
// @route   POST /api/pos-machines
// @access  Private (Admin+)
const createPOSMachine = asyncHandler(async (req, res) => {
  const { name, bankName, feePercentage, isActive } = req.body;
  const machine = await POSMachine.create({
    name,
    bankName,
    feePercentage,
    isActive: isActive !== undefined ? isActive : true,
    ...(req.shopId && { shop: req.shopId })
  });
  res.status(201).json({ success: true, data: machine });
});

// @desc    Update POS Machine
// @route   PUT /api/pos-machines/:id
// @access  Private (Admin+)
const updatePOSMachine = asyncHandler(async (req, res) => {
  let machine = await POSMachine.findById(req.params.id);
  if (!machine) return res.status(404).json({ success: false, message: 'POS Machine not found' });

  machine = await POSMachine.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true
  });
  res.status(200).json({ success: true, data: machine });
});

// @desc    Delete POS Machine
// @route   DELETE /api/pos-machines/:id
// @access  Private (Admin+)
const deletePOSMachine = asyncHandler(async (req, res) => {
  const machine = await POSMachine.findById(req.params.id);
  if (!machine) return res.status(404).json({ success: false, message: 'POS Machine not found' });
  await machine.deleteOne();
  res.status(200).json({ success: true, message: 'POS Machine deleted' });
});

module.exports = {
  getPOSMachines,
  getPOSMachine,
  createPOSMachine,
  updatePOSMachine,
  deletePOSMachine
};
