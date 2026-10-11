const { Router } = require('express');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const orderController = require('../controllers/orderController');
const customOrderController = require('../controllers/customOrderController');
const contactController = require('../controllers/contactController');
const jobController = require('../controllers/jobController');
const settingsController = require('../controllers/settingsController');
const uploadController = require('../controllers/uploadController');
const { publicFormLimiter } = require('../middleware/rateLimit');

const router = Router();

// Health
router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, data: { healthy: true, service: 'tcs-api' } });
});

// Public settings
router.get('/settings/public', settingsController.getPublicSettings);

// Categories
router.get('/categories', categoryController.getCategories);
router.get('/categories/:slug', categoryController.getCategoryBySlug);
router.get('/categories/:slug/products', categoryController.getCategoryProducts);

// Products
router.get('/products', productController.getProducts);
router.get('/products/home', productController.getHomeProducts);
router.get('/products/:slug', productController.getProductBySlug);

// Orders (WhatsApp checkout)
router.post('/orders', publicFormLimiter, orderController.createOrder);
router.get('/orders/reference/:reference', orderController.getOrderByReference);

// Custom orders
router.post('/custom-orders', publicFormLimiter, customOrderController.createCustomOrder);

// Public image upload (custom-order reference images)
router.post('/uploads/public', publicFormLimiter, uploadController.uploadPublicImage);

// Contact
router.post('/contact', publicFormLimiter, contactController.createContact);

// Jobs
router.get('/jobs', jobController.listJobs);
router.get('/jobs/:slug', jobController.getJobBySlug);

module.exports = router;