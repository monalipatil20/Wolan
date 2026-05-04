const router = require('express').Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All notification routes require authentication
router.use(authMiddleware);

// Get notification statistics (admin-level only)
router.get('/stats',
  roleMiddleware(['super_admin', 'hub_manager', 'ops_coordinator']),
  notificationController.getNotificationStats
);

// Get all notifications with filtering
router.get('/',
  roleMiddleware(['super_admin', 'hub_manager', 'ops_coordinator', 'merchant', 'rider']),
  notificationController.getNotifications
);

// Get single notification
router.get('/:id',
  roleMiddleware(['super_admin', 'hub_manager', 'ops_coordinator', 'merchant', 'rider']),
  notificationController.getNotification
);

// Create single notification
router.post('/',
  roleMiddleware(['super_admin', 'hub_manager', 'ops_coordinator', 'merchant']),
  notificationController.createNotification
);

// Bulk create notifications
router.post('/bulk',
  roleMiddleware(['super_admin', 'hub_manager', 'ops_coordinator', 'merchant']),
  notificationController.bulkCreateNotifications
);

// Update notification status
router.patch('/:id/status',
  roleMiddleware(['super_admin', 'hub_manager', 'ops_coordinator', 'merchant']),
  notificationController.updateNotificationStatus
);

// Retry failed notification
router.post('/:id/retry',
  roleMiddleware(['super_admin', 'hub_manager', 'ops_coordinator', 'merchant']),
  notificationController.retryNotification
);

// Delete notification
router.delete('/:id',
  roleMiddleware(['super_admin', 'hub_manager', 'ops_coordinator', 'merchant']),
  notificationController.deleteNotification
);

module.exports = router;