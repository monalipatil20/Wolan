const router = require('express').Router();

const {
	register,
	login,
	refreshToken,
	logout,
	forgotPassword,
	resetPassword,
	changePassword,
	me,
} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
	validateRegister,
	validateLogin,
	validateForgotPassword,
	validateResetPassword,
	validateChangePassword,
} = require('../validation/authValidation');



router.post('/register', validateRequest(validateRegister), register);
router.post('/login', validateRequest(validateLogin), login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', validateRequest(validateForgotPassword), forgotPassword);
router.post('/reset-password/:resetToken', validateRequest(validateResetPassword), resetPassword);
router.patch('/change-password', protect, validateRequest(validateChangePassword), changePassword);
router.get('/me', protect, me);

module.exports = router;