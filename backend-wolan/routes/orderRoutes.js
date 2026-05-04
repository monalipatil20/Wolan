const router = require('express').Router();

const {
  createOrder,
  createBatchOrders,
  listAllOrders,
  getOrderById,
  getOrderByPackageTrackingId,
  getOrderByRiderTrackingId,
  assignRider,
  updateOrderStatus,
  verifyOrderDeliveryOtp,
  markOrderFailed,
  returnOrderToMerchant,
  trackOrder,
} = require('../controllers/orderController');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  validateCreateOrder,
  validateBatchOrders,
  validateOrderQuery,
  validateOrderStatusUpdate,
  validateAssignRider,
  validateOtpVerification,
  validateDeliveryIssue,
} = require('../validation/orderValidation');

const managerRoles = ['super_admin', 'hub_manager', 'ops_coordinator', 'merchant'];
const dispatchRoles = ['super_admin', 'hub_manager', 'ops_coordinator', 'rider'];

router.post('/batch', protect, authorizeRoles(...managerRoles), validateRequest(validateBatchOrders), createBatchOrders);
router.post('/', protect, authorizeRoles(...managerRoles), validateRequest(validateCreateOrder), createOrder);

router.get('/track/:packageTrackingId', trackOrder);
router.get('/', protect, authorizeRoles(...['super_admin', 'hub_manager', 'ops_coordinator', 'merchant', 'rider']), validateRequest(validateOrderQuery), listAllOrders);
router.get('/track/:packageTrackingId/details', protect, authorizeRoles(...['super_admin', 'hub_manager', 'ops_coordinator', 'merchant', 'rider']), getOrderByPackageTrackingId);
router.get('/rider-tracking/:riderTrackingId', protect, authorizeRoles(...['super_admin', 'hub_manager', 'ops_coordinator', 'merchant', 'rider']), getOrderByRiderTrackingId);
router.get('/:id', protect, authorizeRoles(...['super_admin', 'hub_manager', 'ops_coordinator', 'merchant', 'rider']), getOrderById);

router.patch('/:id/assign-rider', protect, authorizeRoles('super_admin', 'hub_manager', 'ops_coordinator'), validateRequest(validateAssignRider), assignRider);
router.patch('/:id/status', protect, authorizeRoles(...dispatchRoles), validateRequest(validateOrderStatusUpdate), updateOrderStatus);
router.post('/:id/verify-otp', protect, authorizeRoles(...dispatchRoles), validateRequest(validateOtpVerification), verifyOrderDeliveryOtp);
router.post('/:id/failed', protect, authorizeRoles(...dispatchRoles), validateRequest(validateDeliveryIssue), markOrderFailed);
router.post('/:id/return-to-merchant', protect, authorizeRoles('super_admin', 'hub_manager', 'ops_coordinator', 'merchant'), validateRequest(validateDeliveryIssue), returnOrderToMerchant);

module.exports = router;