const router = require('express').Router();

const {
  createShipment,
  listShipments,
  getShipmentById,
  updateShipmentStatus,
} = require('../controllers/shipmentController');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.route('/shipments')
  .get(protect, authorizeRoles('super_admin', 'hub_manager', 'ops_coordinator', 'merchant', 'rider'), listShipments)
  .post(protect, authorizeRoles('super_admin', 'hub_manager', 'ops_coordinator', 'merchant'), createShipment);

router.route('/shipments/:id')
  .get(protect, authorizeRoles('super_admin', 'hub_manager', 'ops_coordinator', 'merchant', 'rider'), getShipmentById)
  .patch(protect, authorizeRoles('super_admin', 'hub_manager', 'ops_coordinator', 'rider'), updateShipmentStatus);

module.exports = router;