const router = require('express').Router();
const { healthCheck } = require('../controllers/healthController');

router.get('/health', healthCheck);

module.exports = router;