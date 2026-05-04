const router = require('express').Router();

const {
  registerRider,
  getMyRiderProfile,
  getRiderByIdController,
  listAllRiders,
  updateStatus,
  updateGpsLocation,
  uploadDocument,
  verifyDocument,
  registerBond,
  updatePerformance,
  issueFine,
  payFineController,
  getFines,
  createIncident,
  resolveIncidentController,
  getIncidents,
  getDailySummary,
  getEarnings,
  getRiderEarnings,
} = require('../controllers/riderController');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  validateRegisterRider,
  validateRiderQuery,
  validateUpdateStatus,
  validateGpsLocation,
  validateDocumentUpload,
  validateVerifyDocument,
  validateRegisterBond,
  validateIssueFine,
  validateIncident,
  validateResolveIncident,
  validateEarningsQuery,
} = require('../validation/riderValidation');

const adminRoles = ['super_admin', 'hub_manager', 'ops_coordinator'];
const managerRoles = ['super_admin', 'hub_manager', 'ops_coordinator', 'merchant'];
const riderRoles = ['super_admin', 'hub_manager', 'ops_coordinator', 'rider'];

router.post('/register', protect, authorizeRoles('rider'), validateRequest(validateRegisterRider), registerRider);
router.get('/me', protect, authorizeRoles('rider'), getMyRiderProfile);

router.get('/me/fines', protect, authorizeRoles('rider'), getFines);
router.get('/me/incidents', protect, authorizeRoles('rider'), getIncidents);
router.get('/me/daily-summary', protect, authorizeRoles('rider'), getDailySummary);
router.get('/me/earnings', protect, authorizeRoles('rider'), validateRequest(validateEarningsQuery), getEarnings);

router.post('/me/status', protect, authorizeRoles('rider'), validateRequest(validateUpdateStatus), updateStatus);
router.post('/me/location', protect, authorizeRoles('rider'), validateRequest(validateGpsLocation), updateGpsLocation);
router.post('/me/document', protect, authorizeRoles('rider'), validateRequest(validateDocumentUpload), uploadDocument);
router.post('/me/bond', protect, authorizeRoles('rider'), validateRequest(validateRegisterBond), registerBond);
router.post('/me/fines/:fineId/pay', protect, authorizeRoles('rider'), payFineController);
router.post('/me/incident', protect, authorizeRoles('rider'), validateRequest(validateIncident), createIncident);

router.get('/', protect, authorizeRoles(...adminRoles), validateRequest(validateRiderQuery), listAllRiders);
router.get('/:id', protect, authorizeRoles(...adminRoles), getRiderByIdController);
router.get('/:id/earnings', protect, authorizeRoles(...adminRoles), validateRequest(validateEarningsQuery), getRiderEarnings);

router.patch('/:id/status', protect, authorizeRoles(...adminRoles), validateRequest(validateUpdateStatus), updateStatus);
router.patch('/:id/document', protect, authorizeRoles(...adminRoles), validateRequest(validateVerifyDocument), verifyDocument);
router.patch('/:id/performance', protect, authorizeRoles(...adminRoles), updatePerformance);
router.patch('/:id/incident/:incidentId/resolve', protect, authorizeRoles(...adminRoles), validateRequest(validateResolveIncident), resolveIncidentController);
router.post('/:id/fine', protect, authorizeRoles(...adminRoles), validateRequest(validateIssueFine), issueFine);

module.exports = router;
