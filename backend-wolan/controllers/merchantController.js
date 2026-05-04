const Merchant = require('../models/Merchant');
const MerchantTransaction = require('../models/MerchantTransaction');
const Hub = require('../models/Hub');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');
const { generatePasswordResetToken, verifyRefreshToken, hashToken } = require('../utils/token');
const {
  createMerchantTokens,
  hashMerchantToken,
  generateReferralCode,
  generateQrCode,
  resolveReferralMerchant,
  createReferralPayout,
  recalculateMerchantTier,
  getMerchantDashboardStats,
  listMerchants,
  aggregateMerchantTransactions,
} = require('../services/merchantService');

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
    path: '/api/v1/merchants',
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', TOKEN_COOKIE_OPTIONS);
  res.clearCookie('refreshToken', { ...TOKEN_COOKIE_OPTIONS, path: '/api/v1/merchants' });
};

const buildMerchantResponse = (merchant) => merchant.toPublicJSON();

const buildQueryMatch = (query) => {
  const match = {};

  if (query.status) match.status = query.status;
  if (query.tier_level) match.tier_level = query.tier_level;
  if (query.hub_id) match.hub_id = query.hub_id;
  if (query.search) {
    match.$or = [
      { merchant_name: { $regex: query.search, $options: 'i' } },
      { shop_name: { $regex: query.search, $options: 'i' } },
      { building_name: { $regex: query.search, $options: 'i' } },
      { phone: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { referral_code: { $regex: query.search, $options: 'i' } },
    ];
  }

  return match;
};

const registerMerchant = asyncHandler(async (req, res) => {
  const {
    merchant_name,
    shop_name,
    building_name,
    phone,
    email,
    password,
    address,
    referred_by,
    hub_id,
    tier_level,
    status,
  } = req.validatedBody || req.body;

  const existingMerchant = await Merchant.findOne({ $or: [{ email }, { phone }] });

  if (existingMerchant) {
    throw new AppError('Merchant already exists', 409);
  }

  if (hub_id) {
    const hubExists = await Hub.exists({ _id: hub_id });
    if (!hubExists) {
      throw new AppError('hub_id is invalid', 400);
    }
  }

  const referralMerchant = await resolveReferralMerchant(referred_by);

  const referral_code = await generateReferralCode(merchant_name, email);

  const merchant = await Merchant.create({
    merchant_name,
    shop_name,
    building_name,
    phone,
    email,
    password,
    address,
    referral_code,
    referred_by: referralMerchant ? referralMerchant._id : null,
    tier_level: tier_level || 'Starter',
    total_deliveries: 0,
    cod_balance: 0,
    earnings: 0,
    hub_id: hub_id || null,
    status: status || 'active',
  });

  merchant.qr_code = await generateQrCode(merchant);

  if (referralMerchant) {
    await createReferralPayout({ referredByMerchant: referralMerchant, newMerchant: merchant });
  }

  recalculateMerchantTier(merchant);
  await merchant.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } = createMerchantTokens(merchant);
  merchant.refresh_token_hash = hashMerchantToken(refreshToken);
  await merchant.save({ validateBeforeSave: false });

  setAuthCookies(res, accessToken, refreshToken);

  return successResponse(res, 'Merchant registered successfully', {
    accessToken,
    refreshToken,
    merchant: buildMerchantResponse(merchant),
  }, 201);
});

const loginMerchant = asyncHandler(async (req, res) => {
  const { email, password } = req.validatedBody || req.body;

  const merchant = await Merchant.findOne({ email }).select('+password +refresh_token_hash');

  if (!merchant) {
    throw new AppError('Invalid credentials', 401);
  }

  if (merchant.status !== 'active') {
    throw new AppError('Merchant account is not active', 403);
  }

  const isPasswordValid = await merchant.matchPassword(password);

  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  merchant.last_login = new Date();
  const { accessToken, refreshToken } = createMerchantTokens(merchant);
  merchant.refresh_token_hash = hashMerchantToken(refreshToken);
  await merchant.save({ validateBeforeSave: false });

  setAuthCookies(res, accessToken, refreshToken);

  return successResponse(res, 'Merchant login successful', {
    accessToken,
    refreshToken,
    merchant: buildMerchantResponse(merchant),
  });
});

const refreshMerchantToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingToken) {
    throw new AppError('Refresh token is required', 401);
  }

  const decoded = verifyRefreshToken(incomingToken);
  const merchant = await Merchant.findById(decoded.id).select('+refresh_token_hash');

  if (!merchant || merchant.refresh_token_hash !== hashMerchantToken(incomingToken)) {
    throw new AppError('Invalid refresh token', 401);
  }

  const { accessToken, refreshToken } = createMerchantTokens(merchant);
  merchant.refresh_token_hash = hashMerchantToken(refreshToken);
  await merchant.save({ validateBeforeSave: false });

  setAuthCookies(res, accessToken, refreshToken);

  return successResponse(res, 'Merchant token refreshed successfully', {
    accessToken,
    refreshToken,
  });
});

const logoutMerchant = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (incomingToken) {
    try {
      const decoded = verifyRefreshToken(incomingToken);
      await Merchant.findByIdAndUpdate(decoded.id, { $unset: { refresh_token_hash: '' } });
    } catch (error) {
      // ignore invalid refresh token during logout
    }
  }

  clearAuthCookies(res);

  return successResponse(res, 'Merchant logout successful');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.validatedBody || req.body;
  const merchant = await Merchant.findOne({ email });

  if (!merchant) {
    throw new AppError('Merchant not found', 404);
  }

  const { resetToken, resetTokenHash, resetTokenExpires } = generatePasswordResetToken();

  merchant.password_reset_token_hash = resetTokenHash;
  merchant.password_reset_expires = new Date(resetTokenExpires);
  await merchant.save({ validateBeforeSave: false });

  return successResponse(res, 'Password reset token generated', {
    resetToken: process.env.NODE_ENV === 'production' ? undefined : resetToken,
    resetTokenExpires: merchant.password_reset_expires,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.validatedBody || req.body;

  const merchant = await Merchant.findOne({
    password_reset_token_hash: hashToken(resetToken),
    password_reset_expires: { $gt: new Date() },
  }).select('+password_reset_token_hash +password_reset_expires +refresh_token_hash');

  if (!merchant) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  merchant.password = password;
  merchant.password_reset_token_hash = null;
  merchant.password_reset_expires = null;
  merchant.refresh_token_hash = null;
  await merchant.save();

  const { accessToken, refreshToken } = createMerchantTokens(merchant);
  merchant.refresh_token_hash = hashMerchantToken(refreshToken);
  await merchant.save({ validateBeforeSave: false });

  setAuthCookies(res, accessToken, refreshToken);

  return successResponse(res, 'Password reset successful', {
    accessToken,
    refreshToken,
    merchant: buildMerchantResponse(merchant),
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { current_password, password } = req.validatedBody || req.body;
  const merchant = await Merchant.findById(req.user.id).select('+password +refresh_token_hash');

  if (!merchant) {
    throw new AppError('Merchant not found', 404);
  }

  const isPasswordValid = await merchant.matchPassword(current_password);

  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  merchant.password = password;
  merchant.refresh_token_hash = null;
  await merchant.save();

  const { accessToken, refreshToken } = createMerchantTokens(merchant);
  merchant.refresh_token_hash = hashMerchantToken(refreshToken);
  await merchant.save({ validateBeforeSave: false });

  setAuthCookies(res, accessToken, refreshToken);

  return successResponse(res, 'Password changed successfully', {
    accessToken,
    refreshToken,
  });
});

const getCurrentMerchant = asyncHandler(async (req, res) => {
  const merchant = await Merchant.findById(req.user.id);

  if (!merchant) {
    throw new AppError('Merchant not found', 404);
  }

  return successResponse(res, 'Merchant profile fetched successfully', {
    merchant: buildMerchantResponse(merchant),
  });
});

const updateCurrentMerchant = asyncHandler(async (req, res) => {
  const merchant = await Merchant.findById(req.user.id).select('+refresh_token_hash');

  if (!merchant) {
    throw new AppError('Merchant not found', 404);
  }

  const updates = req.validatedBody || req.body;
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      merchant[key] = value;
    }
  });

  if (req.validatedBody?.hub_id) {
    merchant.hub_id = req.validatedBody.hub_id;
  }

  recalculateMerchantTier(merchant);
  merchant.qr_code = await generateQrCode(merchant);
  await merchant.save();

  return successResponse(res, 'Merchant profile updated successfully', {
    merchant: buildMerchantResponse(merchant),
  });
});

const listAllMerchants = asyncHandler(async (req, res) => {
  const result = await listMerchants({ query: req.query });

  return successResponse(res, 'Merchants fetched successfully', {
    merchants: result.items.map((merchant) => merchant.toPublicJSON()),
  }, 200, result.pagination);
});

const createMerchant = asyncHandler(async (req, res) => {
  req.validatedBody = req.validatedBody || req.body;
  return registerMerchant(req, res);
});

const getMerchantById = asyncHandler(async (req, res) => {
  const merchant = await Merchant.findById(req.params.id);

  if (!merchant) {
    throw new AppError('Merchant not found', 404);
  }

  return successResponse(res, 'Merchant fetched successfully', {
    merchant: buildMerchantResponse(merchant),
  });
});

const updateMerchant = asyncHandler(async (req, res) => {
  const merchant = await Merchant.findById(req.params.id).select('+refresh_token_hash');

  if (!merchant) {
    throw new AppError('Merchant not found', 404);
  }

  const updates = req.validatedBody || req.body;
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      merchant[key] = value;
    }
  });

  if (req.validatedBody?.hub_id) {
    const hubExists = await Hub.exists({ _id: req.validatedBody.hub_id });
    if (!hubExists) {
      throw new AppError('hub_id is invalid', 400);
    }
  }

  recalculateMerchantTier(merchant);
  merchant.qr_code = await generateQrCode(merchant);
  await merchant.save();

  return successResponse(res, 'Merchant updated successfully', {
    merchant: buildMerchantResponse(merchant),
  });
});

const deleteMerchant = asyncHandler(async (req, res) => {
  const merchant = await Merchant.findByIdAndDelete(req.params.id);

  if (!merchant) {
    throw new AppError('Merchant not found', 404);
  }

  await MerchantTransaction.deleteMany({ merchant_id: merchant._id });

  return successResponse(res, 'Merchant deleted successfully');
});

const getMerchantDashboard = asyncHandler(async (req, res) => {
  const merchantId = req.user.role === 'merchant' ? req.user.id : (req.query.merchant_id || req.user.id);
  const merchant = await Merchant.findById(merchantId);

  if (!merchant) {
    throw new AppError('Merchant not found', 404);
  }

  const dashboard = await getMerchantDashboardStats(merchant);

  return successResponse(res, 'Merchant dashboard fetched successfully', dashboard);
});

const getMerchantDashboardById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const merchant = await Merchant.findById(id);

  if (!merchant) {
    throw new AppError('Merchant not found', 404);
  }

  const dashboard = await getMerchantDashboardStats(merchant);

  return successResponse(res, 'Merchant dashboard fetched successfully', {
    merchant,
    dashboard,
  });
});

const getReferralEarnings = asyncHandler(async (req, res) => {
  const merchantId = req.user.role === 'merchant' ? req.user.id : (req.query.merchant_id || req.user.id);
  const result = await aggregateMerchantTransactions(merchantId, 'referral', req.query);

  return successResponse(res, 'Referral earnings fetched successfully', {
    referralEarnings: result.summary.totalAmount,
    referrals: result.items,
  }, 200, result.pagination);
});

const getCodReports = asyncHandler(async (req, res) => {
  const merchantId = req.user.role === 'merchant' ? req.user.id : (req.query.merchant_id || req.user.id);
  const result = await aggregateMerchantTransactions(merchantId, 'cod', req.query);

  const merchant = await Merchant.findById(merchantId);

  return successResponse(res, 'COD reports fetched successfully', {
    cod_balance: merchant?.cod_balance || 0,
    codReports: result.items,
    totalCodAmount: result.summary.totalAmount,
  }, 200, result.pagination);
});

const getPayoutHistory = asyncHandler(async (req, res) => {
  const merchantId = req.user.role === 'merchant' ? req.user.id : (req.query.merchant_id || req.user.id);
  const result = await aggregateMerchantTransactions(merchantId, 'payout', req.query);

  return successResponse(res, 'Payout history fetched successfully', {
    payoutHistory: result.items,
    totalPayoutAmount: result.summary.totalAmount,
  }, 200, result.pagination);
});

const getMerchantQrCode = asyncHandler(async (req, res) => {
  const merchant = req.user.role === 'merchant' ? await Merchant.findById(req.user.id) : await Merchant.findById(req.params.id);

  if (!merchant) {
    throw new AppError('Merchant not found', 404);
  }

  return successResponse(res, 'Merchant QR code fetched successfully', {
    merchant_id: merchant._id,
    referral_code: merchant.referral_code,
    qr_code: merchant.qr_code,
  });
});

const regenerateMerchantQrCode = asyncHandler(async (req, res) => {
  const merchant = await Merchant.findById(req.params.id);

  if (!merchant) {
    throw new AppError('Merchant not found', 404);
  }

  merchant.qr_code = await generateQrCode(merchant);
  await merchant.save({ validateBeforeSave: false });

  return successResponse(res, 'Merchant QR code regenerated successfully', {
    merchant_id: merchant._id,
    qr_code: merchant.qr_code,
  });
});

module.exports = {
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
};