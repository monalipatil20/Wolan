const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/token');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.accessToken;

  let token = cookieToken || null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Not authorized, token missing', 401);
  }

  const decoded = verifyAccessToken(token);

  req.user = decoded;
  next();
});

module.exports = protect;