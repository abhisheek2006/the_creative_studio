const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const CustomOrder = require('../models/CustomOrder');
const JobListing = require('../models/JobListing');
const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

exports.getStats = asyncHandler(async (req, res) => {
  const [
    activeProducts,
    totalProducts,
    categories,
    totalOrders,
    pendingOrders,
    confirmedOrders,
    customOrders,
    customForbidden,
    activeJobs,
    unreadContacts,
    lowStock,
    recentOrders,
  ] = await Promise.all([
    Product.countDocuments({ status: 'active' }),
    Product.countDocuments({}),
    Category.countDocuments({}),
    Order.countDocuments({}),
    Order.countDocuments({ status: 'pending_confirmation' }),
    Order.countDocuments({ status: { $in: ['confirmed', 'processing', 'ready_for_dispatch', 'shipped', 'completed'] } }),
    CustomOrder.countDocuments({}),
    CustomOrder.countDocuments({ status: 'pending_confirmation' }),
    JobListing.countDocuments({ status: 'published', isVerified: true }),
    ContactMessage.countDocuments({ status: 'new' }),
    Product.countDocuments({ stockQuantity: { $lte: 5 } }),
    Order.find({}).sort({ createdAt: -1 }).limit(8).select('orderReference customerName status subtotal createdAt').lean(),
  ]);

  return sendSuccess(res, {
    activeProducts,
    totalProducts,
    categories,
    totalOrders,
    pendingOrders,
    confirmedOrders,
    customOrders,
    pendingCustomOrders: customForbidden,
    activeJobs,
    unreadContacts,
    lowStock,
    recentOrders,
  });
});