const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Product = require('../models/Product');
const EMIInvoice = require('../models/EMIInvoice');
const StockBatch = require('../models/StockBatch');
const moment = require('moment');

/** Documented list: when Super Admin receives in-app notifications (stored + live shop alerts when a shop is selected). */
const SUPER_ADMIN_NOTIFICATION_SOURCES = [
  { trigger: 'New shop registered in the system', type: 'System', delivery: 'Stored (audience: super_admin)' },
  { trigger: 'Sale order created and awaiting approval (creator is not Super Admin)', type: 'New Order', delivery: 'Stored (audience: super_admin)' },
  { trigger: 'Platform / maintenance announcements', type: 'System', delivery: 'Stored (audience: super_admin)' },
  { trigger: 'Low stock or stock alert for the selected shop', type: 'Stock', delivery: 'Live (computed for current shop)' },
  { trigger: 'Overdue EMI instalment for the selected shop', type: 'Installment Reminder', delivery: 'Live (computed for current shop)' }
];

function formatRelativeTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

/**
 * Build Mongo match for notifications visible to the current user.
 */
function buildNotificationQuery(req) {
  const userId = req.user._id;
  const shopId = req.shopId;
  const isSuperAdmin = req.user.role === 'Super Admin';

  const or = [{ user: userId }];

  if (shopId) {
    or.push({
      $and: [
        { shop: new mongoose.Types.ObjectId(shopId) },
        {
          $or: [
            { audience: { $in: ['shop', null] } },
            { audience: { $exists: false } },
            { targetRoles: req.user.role }
          ]
        }
      ]
    });
  }

  if (isSuperAdmin) {
    or.push({ audience: 'super_admin' });
  }

  or.push({ targetRoles: req.user.role });

  return { $or: or };
}

async function getLiveShopAlerts(shopId) {
  if (!shopId) return [];

  const shopOid = new mongoose.Types.ObjectId(shopId);
  const match = { shop: shopOid };

  const lowStockProducts = await Product.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'stockbatches',
        localField: '_id',
        foreignField: 'product',
        pipeline: [{ $match: { isActive: true } }],
        as: 'batches'
      }
    },
    {
      $addFields: {
        totalStock: { $sum: '$batches.remainingQty' }
      }
    },
    {
      $match: {
        $expr: { $lte: ['$totalStock', '$alertQuantity'] }
      }
    },
    { $limit: 10 },
    {
      $project: {
        name: 1,
        totalStock: 1,
        alertQuantity: 1
      }
    }
  ]);

  const endOfToday = moment().utcOffset('+06:00').endOf('day').toDate();

  const upcomingEMIs = await EMIInvoice.aggregate([
    { $match: { ...match, status: 'active' } },
    { $unwind: '$instalments' },
    { 
      $match: { 
        'instalments.status': { $in: ['pending', 'overdue'] },
        'instalments.dueDate': { $lte: endOfToday }
      } 
    },
    { $sort: { 'instalments.dueDate': 1 } },
    { $limit: 10 },
    {
      $project: {
        customerName: 1,
        invoiceNumber: 1,
        productName: { $arrayElemAt: ['$products.name', 0] },
        amount: '$instalments.amount',
        dueDate: '$instalments.dueDate',
        status: '$instalments.status'
      }
    }
  ]);

  const live = [
    ...lowStockProducts.map((p) => ({
      computed: true,
      type: 'Stock',
      message: p.totalStock <= 0 ? `${p.name} is completely out of stock.` : `Only ${p.totalStock} units remaining of ${p.name}.`,
      severity: p.totalStock <= 0 ? 'high' : 'medium',
      isRead: false,
      priority: 5,
      targetRoles: ['Sales', 'Manager', 'Super Admin'],
      actionLabel: 'Order Stock',
      actionLink: '/dashboard/products',
      createdAt: new Date(),
      metadata: { productId: p._id }
    })),
    ...upcomingEMIs
      .map((e) => ({
        computed: true,
        type: 'Installment Reminder',
        message: `${e.customerName} has an installment ${e.status === 'overdue' ? 'overdue' : 'due today'} for ${e.productName || 'EMI'}.`,
        severity: 'high',
        isRead: false,
        priority: 10,
        targetRoles: ['Sales', 'Manager', 'Super Admin'],
        actionLabel: 'View EMIs',
        actionLink: '/dashboard/emi/dashboard',
        createdAt: new Date(),
        metadata: { invoiceNumber: e.invoiceNumber }
      }))
  ];

  return live;
}

function mapDbDoc(doc) {
  return {
    _id: doc._id,
    computed: false,
    shop: doc.shop,
    user: doc.user,
    type: doc.type,
    message: doc.message,
    severity: doc.severity || 'low',
    isRead: doc.isRead,
    actionLink: doc.actionLink,
    actionLabel: doc.actionLabel,
    metadata: doc.metadata,
    audience: doc.audience,
    targetRoles: doc.targetRoles,
    priority: doc.priority || 0,
    createdAt: doc.createdAt,
    time: formatRelativeTime(doc.createdAt)
  };
}

function mapLive(doc) {
  return {
    _id: null,
    ...doc,
    time: formatRelativeTime(doc.createdAt)
  };
}

/**
 * Merged feed: DB notifications + live shop alerts (when shop context exists). Sorted newest first.
 */
async function getMergedNotificationFeed(req, { limit = 50 } = {}) {


  const query = buildNotificationQuery(req);


  const dbDocs = await Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean();
  if (dbDocs.length > 0) {
    // Console log removed
  }

  let live = req.shopId ? await getLiveShopAlerts(req.shopId) : [];
  if (req.user.role !== 'Super Admin') {
    live = live.filter(n => !n.targetRoles || n.targetRoles.includes(req.user.role));
  }
  if (live.length > 0) {
    // Console log removed
  }

  const mappedDb = dbDocs.map(mapDbDoc);
  const mappedLive = live.map(mapLive);

  const combined = [...mappedDb, ...mappedLive].sort((a, b) => {
    const priorityA = a.priority || 0;
    const priorityB = b.priority || 0;
    if (priorityA !== priorityB) {
      return priorityB - priorityA; // Highest priority first
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return combined.slice(0, limit);
}

async function createNotification(payload) {
  const {
    shop,
    user,
    type,
    message,
    severity = 'medium',
    actionLink,
    actionLabel,
    metadata,
    audience = 'shop',
    targetRoles = [],
    priority = 0
  } = payload;



  const notification = await Notification.create({
    shop,
    user,
    type,
    message,
    severity,
    actionLink,
    actionLabel,
    metadata,
    audience,
    targetRoles,
    priority,
    isRead: false
  });



  return notification;
}

module.exports = {
  SUPER_ADMIN_NOTIFICATION_SOURCES,
  buildNotificationQuery,
  formatRelativeTime,
  getLiveShopAlerts,
  getMergedNotificationFeed,
  createNotification
};
