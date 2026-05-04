const router = require('express').Router();

const { uploadSingleFile } = require('../controllers/uploadController');
const protect = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const upload = require('../utils/upload');

router.post(
  '/uploads/single',
  protect,
  authorizeRoles('super_admin', 'hub_manager', 'ops_coordinator', 'merchant', 'rider'),
  upload.single('file'),
  uploadSingleFile
);

module.exports = router;