const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');

const healthCheck = asyncHandler(async (req, res) => successResponse(
  res,
  'API is healthy',
  {
    service: 'wolan-logistics-backend',
    timestamp: new Date().toISOString(),
  },
  200
));

module.exports = {
  healthCheck,
};