const router = require('express').Router();

const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const hubRoutes = require('./hubRoutes');
const merchantRoutes = require('./merchantRoutes');
const orderRoutes = require('./orderRoutes');
const riderRoutes = require('./riderRoutes');
const shipmentRoutes = require('./shipmentRoutes');
const uploadRoutes = require('./uploadRoutes');
const notificationRoutes = require('./notificationRoutes');

router.use('/auth', healthRoutes);
router.use('/auth', authRoutes);
router.use('/auth', hubRoutes);
router.use('/auth/merchants', merchantRoutes);
router.use('/auth/orders', orderRoutes);
router.use('/auth/riders', riderRoutes);
router.use('/auth', shipmentRoutes);
router.use('/auth', uploadRoutes);
router.use('/auth/notifications', notificationRoutes);

module.exports = router;
