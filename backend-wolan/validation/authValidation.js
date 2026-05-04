const mongoose = require('mongoose');

const allowedRoles = ['super_admin', 'hub_manager', 'ops_coordinator', 'rider', 'merchant'];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const buildResult = (value, errors) => ({ value, errors });

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const validateRegister = (req) => {
  const errors = [];
  const value = {
    full_name: String(req.body.full_name || '').trim(),
    email: String(req.body.email || '').trim().toLowerCase(),
    phone: String(req.body.phone || '').trim(),
    password: String(req.body.password || ''),
    role: String(req.body.role || 'merchant').trim(),
    hub_id: req.body.hub_id || null,
    profile_image: req.body.profile_image ? String(req.body.profile_image).trim() : null,
  };

  if (value.full_name.length < 2) errors.push('full_name is required');
  if (!emailPattern.test(value.email)) errors.push('email is invalid');
  if (value.password.length < 8) errors.push('password must be at least 8 characters');
  if (!allowedRoles.includes(value.role)) errors.push('role is invalid');
  if (value.hub_id && !isObjectId(value.hub_id)) errors.push('hub_id must be a valid ObjectId');

  return buildResult(value, errors);
};

const validateLogin = (req) => {
  const errors = [];
  const value = {
    email: String(req.body.email || '').trim().toLowerCase(),
    password: String(req.body.password || ''),
  };

  if (!emailPattern.test(value.email)) errors.push('email is invalid');
  if (!value.password) errors.push('password is required');

  return buildResult(value, errors);
};

const validateForgotPassword = (req) => {
  const errors = [];
  const value = {
    email: String(req.body.email || '').trim().toLowerCase(),
  };

  if (!emailPattern.test(value.email)) errors.push('email is invalid');

  return buildResult(value, errors);
};

const validateResetPassword = (req) => {
  const errors = [];
  const value = {
    password: String(req.body.password || ''),
    confirm_password: String(req.body.confirm_password || ''),
  };

  if (value.password.length < 8) errors.push('password must be at least 8 characters');
  if (value.password !== value.confirm_password) errors.push('confirm_password must match password');

  return buildResult(value, errors);
};

const validateChangePassword = (req) => {
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
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
};