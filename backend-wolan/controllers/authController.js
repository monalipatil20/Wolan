const User = require('../models/User');
const Hub = require('../models/Hub');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generatePasswordResetToken,
} = require('../utils/token');

const TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

const ACCESS_TOKEN_COOKIE_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    ...TOKEN_COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
  });

  res.cookie('refreshToken', refreshToken, {
    ...TOKEN_COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    path: '/api/v1/auth',
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', { ...TOKEN_COOKIE_OPTIONS });
  res.clearCookie('refreshToken', { ...TOKEN_COOKIE_OPTIONS, path: '/api/v1/auth' });
};

const createAuthTokens = (user) => {
  const payload = {
    id: user._id,
    role: user.role,
    hub_id: user.hub_id,
    email: user.email,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { accessToken, refreshToken };
};

const buildUserResponse = (user) => ({
  id: user._id,
  full_name: user.full_name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  hub_id: user.hub_id,
  profile_image: user.profile_image,
  is_active: user.is_active,
  last_login: user.last_login,
});

const canAssignRole = (req, role) => {
  if (!req.user && role !== 'merchant') {
    return false;
  }

  if (!req.user) {
    return true;
  }

  return ['super_admin', 'hub_manager', 'ops_coordinator'].includes(req.user.role);
};

const register = asyncHandler(async (req, res) => {
  const { full_name, email, phone, password, role, hub_id, profile_image } = req.validatedBody || req.body;

  if (!canAssignRole(req, role)) {
    throw new AppError('You are not allowed to assign this role', 403);
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError('Email already exists', 409);
  }

  if (hub_id) {
    const hubExists = await Hub.exists({ _id: hub_id });
    if (!hubExists) {
      throw new AppError('hub_id is invalid', 400);
    }
  }

  const user = await User.create({
    full_name,
    email,
    phone,
    password,
    role,
    hub_id: hub_id || null,
    profile_image,
    is_active: true,
    last_login: new Date(),
  });

  const { accessToken, refreshToken } = createAuthTokens(user);
  user.refresh_token_hash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  setAuthCookies(res, accessToken, refreshToken);

  return successResponse(res, 'User registered successfully', {
    accessToken,
    refreshToken,
    user: buildUserResponse(user),
  }, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validatedBody || req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await User.findOne({ email }).select('+password +refresh_token_hash');

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!user.is_active) {
    throw new AppError('Account is inactive', 403);
  }

  const isPasswordValid = await user.matchPassword(password);

  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  user.last_login = new Date();
  const { accessToken, refreshToken } = createAuthTokens(user);
  user.refresh_token_hash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  setAuthCookies(res, accessToken, refreshToken);

  return successResponse(res, 'Login successful', {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      hub_id: user.hub_id,
      phone: user.phone,
      profile_image: user.profile_image,
      is_active: user.is_active,
      last_login: user.last_login,
    },
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingToken) {
    throw new AppError('Refresh token is required', 401);
  }

  const decoded = verifyRefreshToken(incomingToken);
  const user = await User.findById(decoded.id).select('+refresh_token_hash');

  if (!user || !user.refresh_token_hash || user.refresh_token_hash !== hashToken(incomingToken)) {
    throw new AppError('Invalid refresh token', 401);
  }

  const { accessToken, refreshToken: nextRefreshToken } = createAuthTokens(user);
  user.refresh_token_hash = hashToken(nextRefreshToken);
  await user.save({ validateBeforeSave: false });

  setAuthCookies(res, accessToken, nextRefreshToken);

  return successResponse(res, 'Token refreshed successfully', {
    accessToken,
    refreshToken: nextRefreshToken,
  });
});

const logout = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (incomingToken) {
    try {
      const decoded = verifyRefreshToken(incomingToken);
      await User.findByIdAndUpdate(decoded.id, { $unset: { refresh_token_hash: '' } });
    } catch (error) {
      // Ignore invalid refresh token during logout.
    }
  }

  clearAuthCookies(res);

  return successResponse(res, 'Logout successful');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.validatedBody || req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError('No account found for this email', 404);
  }

  const { resetToken, resetTokenHash, resetTokenExpires } = generatePasswordResetToken();

  user.password_reset_token_hash = resetTokenHash;
  user.password_reset_expires = new Date(resetTokenExpires);
  await user.save({ validateBeforeSave: false });

  return successResponse(res, 'Password reset token generated', {
    resetToken: process.env.NODE_ENV === 'production' ? undefined : resetToken,
    resetTokenExpires: user.password_reset_expires,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.validatedBody || req.body;
  const hashedToken = hashToken(resetToken);

  const user = await User.findOne({
    password_reset_token_hash: hashedToken,
    password_reset_expires: { $gt: new Date() },
  }).select('+password_reset_token_hash +password_reset_expires');

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  user.password = password;
  user.password_reset_token_hash = null;
  user.password_reset_expires = null;
  user.refresh_token_hash = null;
  await user.save();

  const { accessToken, refreshToken: nextRefreshToken } = createAuthTokens(user);
  user.refresh_token_hash = hashToken(nextRefreshToken);
  await user.save({ validateBeforeSave: false });

  setAuthCookies(res, accessToken, nextRefreshToken);

  return successResponse(res, 'Password reset successful', {
    accessToken,
    refreshToken: nextRefreshToken,
    user: buildUserResponse(user),
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { current_password, password } = req.validatedBody || req.body;
  const user = await User.findById(req.user.id).select('+password +refresh_token_hash');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isCurrentPasswordValid = await user.matchPassword(current_password);

  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  user.password = password;
  user.refresh_token_hash = null;
  await user.save();

  const { accessToken, refreshToken: nextRefreshToken } = createAuthTokens(user);
  user.refresh_token_hash = hashToken(nextRefreshToken);
  await user.save({ validateBeforeSave: false });

  setAuthCookies(res, accessToken, nextRefreshToken);

  return successResponse(res, 'Password changed successfully', {
    accessToken,
    refreshToken: nextRefreshToken,
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('hub_id', 'name code city');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return successResponse(res, 'Profile fetched successfully', {
    user: buildUserResponse(user),
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
};