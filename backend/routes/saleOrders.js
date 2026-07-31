const express = require('express');
const router = express.Router();
const { protect, authorize, optionalProtect } = require('../middleware/auth');

const {
  createSaleOrder,
  approveSaleOrder,
  deliverSaleOrder,
  getSaleOrders,
  getSaleOrder,
  updateSaleOrderPayment,
  getSupplierWiseSalesAnalytics,
  getSrWiseSalesAnalytics,
  generateOrderInvoice,
  calculateSRCommission,
  convertSaleOrderToSale,
  getMyOrders,
  getMyOrderDetails,
  lookupGuestOrders,
  outForDeliverySaleOrder,
  returnSaleOrder,
  cancelSaleOrder,
  updateOrderStatus,
  editSaleOrder
} = require('../controllers/saleOrderController');

router.route('/')
  .post(protect, authorize('Super Admin', 'Admin', 'Manager', 'SR', 'Sales Staff'), createSaleOrder)
  .get(protect, authorize('Super Admin', 'Admin', 'Manager', 'SR', 'DSR', 'Super Admin Plus', 'E-Commerce Admin', 'Sales Staff'), getSaleOrders);

// Customer order history routes
router.route('/my')
  .get(protect, getMyOrders);

router.route('/my/:id')
  .get(protect, getMyOrderDetails);

router.route('/guest-lookup')
  .post(lookupGuestOrders);

router.route('/:id')
  .get(optionalProtect, getSaleOrder);

router.route('/:id/approve')
  .put(protect, authorize('Super Admin', 'Admin', 'Manager', 'DSR', 'E-Commerce Admin', 'Sales Staff'), approveSaleOrder);

router.route('/:id/out-for-delivery')
  .put(protect, authorize('Super Admin', 'Admin', 'Manager', 'DSR', 'E-Commerce Admin', 'Sales Staff'), outForDeliverySaleOrder);

router.route('/:id/deliver')
  .put(protect, authorize('Super Admin', 'Admin', 'Manager', 'DSR', 'E-Commerce Admin', 'Sales Staff'), deliverSaleOrder);

router.route('/:id/return')
  .put(protect, authorize('Super Admin', 'Admin', 'Manager', 'DSR', 'E-Commerce Admin', 'Sales Staff'), returnSaleOrder);

router.route('/:id/cancel')
  .put(optionalProtect, cancelSaleOrder);

router.route('/:id/order-status')
  .put(protect, authorize('Super Admin', 'Admin', 'Manager', 'DSR', 'E-Commerce Admin', 'Sales Staff'), updateOrderStatus);

router.route('/:id/edit')
  .put(protect, authorize('Super Admin', 'Admin', 'Sales Staff'), editSaleOrder);

router.route('/:id/payment')
  .put(protect, authorize('Super Admin', 'Admin', 'Manager', 'SR', 'Sales Staff'), updateSaleOrderPayment);

router.route('/analytics/supplier')
  .get(protect, authorize('Super Admin', 'Admin', 'Manager'), getSupplierWiseSalesAnalytics);

router.route('/analytics/sr')
  .get(protect, authorize('Super Admin', 'Admin', 'Manager'), getSrWiseSalesAnalytics);

router.route('/:id/invoice')
  .get(protect, authorize('Super Admin', 'Admin', 'Manager', 'SR', 'DSR', 'Super Admin Plus', 'E-Commerce Admin', 'Sales Staff'), generateOrderInvoice);

router.route('/sr-commission/:srId')
  .get(protect, authorize('Super Admin', 'Admin', 'Manager'), calculateSRCommission);

router.route('/:id/convert-to-sale')
  .post(protect, authorize('Super Admin', 'Admin', 'Manager', 'SR', 'Sales Staff'), convertSaleOrderToSale);



module.exports = router;