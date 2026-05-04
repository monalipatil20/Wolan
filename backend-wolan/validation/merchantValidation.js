const mongoose = require('mongoose');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedTiers = ['Starter', 'Active', 'Priority', 'Elite'];
const allowedStatuses = ['pending', 'active', 'suspended'];

const buildResult = (value, errors) => ({ value, errors });

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const validateMerchantRegister = (req) => {
  const errors = [];
  const value = {
    merchant_name: String(req.body.merchant_name || '').trim(),
    shop_name: String(req.body.shop_name || '').trim(),
    building_name: String(req.body.building_name || '').trim(),
    phone: String(req.body.phone || '').trim(),
    email: String(req.body.email || '').trim().toLowerCase(),
    password: String(req.body.password || ''),
    address: String(req.body.address || '').trim(),
    referred_by: req.body.referred_by ? String(req.body.referred_by).trim() : null,
    hub_id: req.body.hub_id ? String(req.body.hub_id).trim() : null,
    tier_level: String(req.body.tier_level || 'Starter').trim(),
    status: String(req.body.status || 'active').trim(),
  };

  if (value.merchant_name.length < 2) errors.push('merchant_name is required');
  if (value.shop_name.length < 2) errors.push('shop_name is required');
  if (value.building_name.length < 2) errors.push('building_name is required');
  if (value.phone.length < 8) errors.push('phone is invalid');
  if (!emailPattern.test(value.email)) errors.push('email is invalid');
  if (value.password.length < 8) errors.push('password must be at least 8 characters');
  if (value.address.length < 5) errors.push('address is required');
  if (value.referred_by && !isObjectId(value.referred_by) && value.referred_by.length < 3) errors.push('referred_by must be a valid merchant id or referral code');
  if (value.hub_id && !isObjectId(value.hub_id)) errors.push('hub_id must be a valid ObjectId');
  if (!allowedStatuses.includes(value.status)) errors.push('status is invalid');
  if (!allowedTiers.includes(value.tier_level)) errors.push('tier_level is invalid');

  return buildResult(value, errors);
};

const validateMerchantLogin = (req) => {
  const errors = [];
  const value = {
    email: String(req.body.email || '').trim().toLowerCase(),
    password: String(req.body.password || ''),
  };

  if (!emailPattern.test(value.email)) errors.push('email is invalid');
  if (!value.password) errors.push('password is required');

  return buildResult(value, errors);
};

const validateMerchantForgotPassword = (req) => {
  const errors = [];
  const value = {
    email: String(req.body.email || '').trim().toLowerCase(),
  };

  if (!emailPattern.test(value.email)) errors.push('email is invalid');

  return buildResult(value, errors);
};

const validateMerchantUpdate = (req) => {
  const errors = [];
  const value = {
    merchant_name: req.body.merchant_name ? String(req.body.merchant_name).trim() : undefined,
    shop_name: req.body.shop_name ? String(req.body.shop_name).trim() : undefined,
    building_name: req.body.building_name ? String(req.body.building_name).trim() : undefined,
    phone: req.body.phone ? String(req.body.phone).trim() : undefined,
    email: req.body.email ? String(req.body.email).trim().toLowerCase() : undefined,
    address: req.body.address ? String(req.body.address).trim() : undefined,
    hub_id: req.body.hub_id ? String(req.body.hub_id).trim() : undefined,
    status: req.body.status ? String(req.body.status).trim() : undefined,
    tier_level: req.body.tier_level ? String(req.body.tier_level).trim() : undefined,
    referral_code: req.body.referral_code ? String(req.body.referral_code).trim().toUpperCase() : undefined,
  };

  if (value.email && !emailPattern.test(value.email)) errors.push('email is invalid');
  if (value.phone && value.phone.length < 8) errors.push('phone is invalid');
  if (value.hub_id && !isObjectId(value.hub_id)) errors.push('hub_id must be a valid ObjectId');
  if (value.status && !allowedStatuses.includes(value.status)) errors.push('status is invalid');
  if (value.tier_level && !allowedTiers.includes(value.tier_level)) errors.push('tier_level is invalid');

  return buildResult(value, errors);
};

const validateMerchantQuery = (req) => {
  const value = {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search ? String(req.query.search).trim() : undefined,
    status: req.query.status ? String(req.query.status).trim() : undefined,
    tier_level: req.query.tier_level ? String(req.query.tier_level).trim() : undefined,
    hub_id: req.query.hub_id ? String(req.query.hub_id).trim() : undefined,
  };

  return buildResult(value, []);
};

const validateMerchantPasswordReset = (req) => {
  const errors = [];
  const value = {
    password: String(req.body.password || ''),
    confirm_password: String(req.body.confirm_password || ''),
  };

  if (value.password.length < 8) errors.push('password must be at least 8 characters');
  if (value.password !== value.confirm_password) errors.push('confirm_password must match password');

  return buildResult(value, errors);
};

const validateMerchantChangePassword = (req) => {
  const errors = [];
  const value = {
    current_password: String(req.body.current_password || ''),
    password: String(req.body.password || ''),
    confirm_password: String(req.body.confirm_password || ''),
  };

  if (!value.current_password) errors.push('current_password is required');
  if (value.password.length < 8) errors.push('password must be at least 8 characters');
  if (value.password !== value.confirm_password) errors.push('confirm_password must match password');

  return buildResult(value, errors);
};

module.exports = {
  validateMerchantRegister,
  validateMerchantLogin,
  validateMerchantForgotPassword,
  validateMerchantUpdate,
  validateMerchantQuery,
  validateMerchantPasswordReset,
  validateMerchantChangePassword,
};