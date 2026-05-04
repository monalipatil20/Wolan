const router = require('express').Router();

const {
  createHub,
  listHubs,
  getHubById,
  updateHub,
  suspendHub,
  assignManager,
  getHubAnalytics,
  getHQDashboard,
  getHubDeliveryReport,
  getHubRiderReport,
  getHubTimeSeries,
} = require('../controllers/hubController');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const enforceHubIsolation = require('../middleware/hubMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  validateCreateHub,
  validateUpdateHub,
  validateSuspendHub,
  validateAssignManager,
  validateHubQuery,
  validateAnalyticsQuery,
} = require('../validation/hubValidation');

// Hub management routes
router.route('/hubs')
  .get(protect, authorizeRoles('super_admin', 'hub_manager', 'ops_coordinator'), validateRequest(validateHubQuery), listHubs)
  .post(protect, authorizeRoles('super_admin'), validateRequest(validateCreateHub), createHub);

router.route('/hubs/:id')
  .get(protect, authorizeRoles('super_admin', 'hub_manager'), getHubById)
  .patch(protect, authorizeRoles('super_admin', 'hub_manager'), validateRequest(validateUpdateHub), updateHub);

router.route('/hubs/:id/suspend')
  .post(protect, authorizeRoles('super_admin'), validateRequest(validateSuspendHub), suspendHub);

router.route('/hubs/:id/assign-manager')
  .post(protect, authorizeRoles('super_admin'), validateRequest(validateAssignManager), assignManager);

// Analytics & reports
router.route('/hubs/:id/analytics')
  .get(protect, authorizeRoles('super_admin', 'hub_manager', 'ops_coordinator'), validateRequest(validateAnalyticsQuery), getHubAnalytics);

router.route('/hubs/:id/delivery-report')
  .get(protect, authorizeRoles('super_admin', 'hub_manager', 'ops_coordinator'), validateRequest(validateAnalyticsQuery), getHubDeliveryReport);

router.route('/hubs/:id/rider-report')
  .get(protect, authorizeRoles('super_admin', 'hub_manager'), getHubRiderReport);

router.route('/hubs/:id/time-series')
  .get(protect, authorizeRoles('super_admin', 'hub_manager', 'ops_coordinator'), getHubTimeSeries);

// HQ Dashboard (all hubs)
router.route('/hq/dashboard')
  .get(protect, authorizeRoles('super_admin', 'ops_coordinator'), getHQDashboard);

module.exports = router;
