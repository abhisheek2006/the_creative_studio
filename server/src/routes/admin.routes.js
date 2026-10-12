const { Router } = require('express');
const adminAuthController = require('../controllers/adminAuthController');
const adminProductController = require('../controllers/adminProductController');
const adminCategoryController = require('../controllers/adminCategoryController');
const adminOrderController = require('../controllers/adminOrderController');
const adminCustomOrderController = require('../controllers/adminCustomOrderController');
const adminContactController = require('../controllers/adminContactController');
const adminJobController = require('../controllers/adminJobController');
const adminSettingsController = require('../controllers/adminSettingsController');
const adminDashboardController = require('../controllers/adminDashboardController');
const uploadController = require('../controllers/uploadController');
const { requireAuth } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');

const router = Router();

// ---- Authentication (public endpoints) ----
router.post('/auth/login', loginLimiter, adminAuthController.login);
router.post('/auth/google', loginLimiter, adminAuthController.googleLogin);
router.post('/auth/logout', adminAuthController.logout);
router.get('/auth/me', requireAuth, adminAuthController.me);

// Everything below requires an active admin session.
router.use(requireAuth);

// ---- Uploads ----
router.post('/uploads', uploadController.uploadAdminImage);

// ---- Dashboard ----
router.get('/dashboard/stats', adminDashboardController.getStats);

// ---- Products ----
router.get('/products', adminProductController.listProducts);
router.post('/products', adminProductController.createProduct);
router.get('/products/:id', adminProductController.getProduct);
router.patch('/products/:id', adminProductController.updateProduct);
router.patch('/products/:id/status', adminProductController.updateProductStatus);
router.delete('/products/:id', adminProductController.deleteProduct);

// ---- Categories ----
router.get('/categories', adminCategoryController.listCategories);
router.post('/categories', adminCategoryController.createCategory);
router.patch('/categories/:id', adminCategoryController.updateCategory);
router.delete('/categories/:id', adminCategoryController.deleteCategory);

// ---- Orders ----
router.get('/orders', adminOrderController.listOrders);
router.get('/orders/export', adminOrderController.exportCsv);
router.get('/orders/:id', adminOrderController.getOrder);
router.patch('/orders/:id/status', adminOrderController.updateStatus);
router.patch('/orders/:id/notes', adminOrderController.updateNotes);

// ---- Custom orders ----
router.get('/custom-orders', adminCustomOrderController.listCustomOrders);
router.get('/custom-orders/:id', adminCustomOrderController.getCustomOrder);
router.patch('/custom-orders/:id/status', adminCustomOrderController.updateStatus);
router.patch('/custom-orders/:id/notes', adminCustomOrderController.updateNotes);

// ---- Contacts ----
router.get('/contacts', adminContactController.listMessages);
router.get('/contacts/:id', adminContactController.getMessage);
router.patch('/contacts/:id/status', adminContactController.updateStatus);

// ---- Jobs ----
router.get('/jobs', adminJobController.listJobs);
router.post('/jobs', adminJobController.createJob);
router.get('/jobs/:id', adminJobController.getJob);
router.patch('/jobs/:id', adminJobController.updateJob);
router.delete('/jobs/:id', adminJobController.deleteJob);

// ---- Settings ----
router.get('/settings', adminSettingsController.getSettings);
router.put('/settings', adminSettingsController.updateSettings);

module.exports = router;