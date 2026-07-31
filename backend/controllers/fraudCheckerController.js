const SaleOrder = require('../models/SaleOrder');
const { checkFraud } = require('../utils/fraudChecker');

/**
 * @desc    Manual fraud check for any phone number
 * @route   POST /api/v1/fraud-checker/check
 * @access  Private/Admin
 */
exports.check = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const result = await checkFraud(phoneNumber);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Fraud Check Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during fraud check',
      error: error.message
    });
  }
};

/**
 * @desc    Get fraud statistics across all checked orders
 * @route   GET /api/v1/fraud-checker/stats
 * @access  Private/Admin
 */
exports.stats = async (req, res) => {
  try {
    const orders = await SaleOrder.find({ 'fraudCheck.checkedAt': { $exists: true } });

    const totalChecked = orders.length;
    let highRisk = 0;
    let mediumRisk = 0;
    let lowRisk = 0;
    let newCustomers = 0;

    orders.forEach(order => {
      if (order.fraudCheck.riskLevel === 'HIGH') highRisk++;
      if (order.fraudCheck.riskLevel === 'MEDIUM') mediumRisk++;
      if (order.fraudCheck.riskLevel === 'LOW') lowRisk++;
      if (order.fraudCheck.riskLevel === 'NEW') newCustomers++;
    });

    res.status(200).json({
      success: true,
      data: {
        totalChecked,
        highRisk,
        mediumRisk,
        lowRisk,
        newCustomers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
};

/**
 * @desc    Get recent fraud checks
 * @route   GET /api/v1/fraud-checker/recent
 * @access  Private/Admin
 */
exports.recent = async (req, res) => {
  try {
    const orders = await SaleOrder.find({ 'fraudCheck.checkedAt': { $exists: true } })
      .sort({ 'fraudCheck.checkedAt': -1 })
      .limit(10)
      .populate('customer', 'contactName contactNumber');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent checks',
      error: error.message
    });
  }
};

/**
 * @desc    Get fraud check details for a specific order
 * @route   GET /api/v1/fraud-checker/order/:orderId
 * @access  Private/Admin
 */
exports.getOrderFraudCheck = async (req, res) => {
  try {
    const order = await SaleOrder.findById(req.params.orderId).populate('customer', 'contactName contactNumber');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!order.fraudCheck || !order.fraudCheck.checkedAt) {
      return res.status(404).json({ success: false, message: 'No fraud check data for this order' });
    }

    res.status(200).json({
      success: true,
      data: order.fraudCheck
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order fraud check',
      error: error.message
    });
  }
};

/**
 * @desc    Perform fraud check for an existing order
 * @route   POST /api/v1/fraud-checker/order/:orderId/check
 * @access  Private/Admin
 */
exports.checkOrderFraud = async (req, res) => {
  try {
    const order = await SaleOrder.findById(req.params.orderId).populate('customer');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const phoneNumber = order.customer?.contactNumber || req.body?.phoneNumber;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number not available for this order' });
    }

    const result = await checkFraud(phoneNumber);
    
    order.fraudCheck = result;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Fraud check completed and saved',
      data: order.fraudCheck
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking order fraud',
      error: error.message
    });
  }
};

/**
 * @desc    Get alerts for high and medium risk orders
 * @route   GET /api/v1/fraud-checker/alerts
 * @access  Private/Admin
 */
exports.getAlerts = async (req, res) => {
  try {
    const orders = await SaleOrder.find({
      'fraudCheck.riskLevel': { $in: ['HIGH', 'MEDIUM'] }
    })
    .sort({ 'fraudCheck.checkedAt': -1 })
    .populate('customer', 'contactName contactNumber');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
      error: error.message
    });
  }
};

/**
 * @desc    Export fraud data
 * @route   GET /api/v1/fraud-checker/export
 * @access  Private/Admin
 */
exports.exportData = async (req, res) => {
  try {
    const orders = await SaleOrder.find({ 'fraudCheck.checkedAt': { $exists: true } })
      .populate('customer', 'contactName contactNumber')
      .lean();

    // Simplified export returning JSON for frontend to parse, could be CSV via exceljs
    res.status(200).json({
      success: true,
      data: orders.map(o => ({
        orderNumber: o.orderNumber,
        customerName: o.customer?.contactName,
        phoneNumber: o.fraudCheck.phoneNumber,
        riskLevel: o.fraudCheck.riskLevel,
        successRatio: o.fraudCheck.successRatio,
        checkedAt: o.fraudCheck.checkedAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting data',
      error: error.message
    });
  }
};
