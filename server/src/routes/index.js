const { Router } = require('express');
const publicRoutes = require('./public.routes');
const adminRoutes = require('./admin.routes');

const router = Router();

router.use('/', publicRoutes);
router.use('/admin', adminRoutes);

module.exports = router;