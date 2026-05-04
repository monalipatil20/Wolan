const router = require('express').Router();

const {
  registerMerchant,
  createMerchant,
  loginMerchant,
  refreshMerchantToken,
  logoutMerchant,
  forgotPassword,
  resetPassword,
  changePassword,
  getCurrentMerchant,
  updateCurrentMerchant,
  listAllMerchants,
  getMerchantById,
  updateMerchant,
  deleteMerchant,
  getMerchantDashboard,
  getMerchantDashboardById,
  getReferralEarnings,
  getCodReports,
  getPayoutHistory,
  getMerchantQrCode,
  regenerateMerchantQrCode,
} = require('../controllers/merchantController');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  validateMerchantRegister,
  validateMerchantLogin,
  validateMerchantForgotPassword,
  validateMerchantUpdate,
  validateMerchantQuery,
  validateMerchantPasswordReset,
  validateMerchantChangePassword,
} = require('../validation/merchantValidation');

const adminRoles = ['super_admin', 'hub_manager', 'ops_coordinator'];
const anyMerchantRole = ['super_admin', 'hub_manager', 'ops_coordinator', 'merchant'];

router.post('/register', validateRequest(validateMerchantRegister), registerMerchant);
router.post('/login', validateRequest(validateMerchantLogin), loginMerchant);
router.post('/refresh-token', refreshMerchantToken);
router.post('/logout', logoutMerchant);
router.post('/forgot-password', validateRequest(validateMerchantForgotPassword), forgotPassword);
router.post('/reset-password/:resetToken', validateRequest(validateMerchantPasswordReset), resetPassword);
router.patch('/change-password', protect, authorizeRoles(...anyMerchantRole), validateRequest(validateMerchantChangePassword), changePassword);

router.get('/me', protect, authorizeRoles(...anyMerchantRole), getCurrentMerchant);
router.patch('/me', protect, authorizeRoles(...anyMerchantRole), validateRequest(validateMerchantUpdate), updateCurrentMerchant);
router.get('/dashboard', protect, authorizeRoles(...anyMerchantRole), getMerchantDashboard);
router.get('/referral-earnings', protect, authorizeRoles(...anyMerchantRole), getReferralEarnings);
router.get('/cod-reports', protect, authorizeRoles(...anyMerchantRole), getCodReports);
router.get('/payout-history', protect, authorizeRoles(...anyMerchantRole), getPayoutHistory);
router.get('/qr-code', protect, authorizeRoles(...anyMerchantRole), getMerchantQrCode);

router.get('/', protect, authorizeRoles(...adminRoles), validateRequest(validateMerchantQuery), listAllMerchants);
router.post('/', protect, authorizeRoles(...adminRoles), validateRequest(validateMerchantRegister), createMerchant);
router.get('/:id', protect, authorizeRoles(...adminRoles), getMerchantById);
router.patch('/:id', protect, authorizeRoles(...adminRoles), validateRequest(validateMerchantUpdate), updateMerchant);
router.delete('/:id', protect, authorizeRoles(...adminRoles), deleteMerchant);
router.get('/:id/dashboard', protect, authorizeRoles(...adminRoles), getMerchantDashboardById);
router.get('/:id/qr-code', protect, authorizeRoles(...adminRoles), getMerchantQrCode);
router.post('/:id/qr-code', protect, authorizeRoles(...adminRoles), regenerateMerchantQrCode);

module.exports = router;