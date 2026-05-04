const mongoose = require('mongoose');

const allowedStatuses = ['pending', 'picked_up', 'at_hub', 'out_for_delivery', 'delivered', 'failed', 'returned'];
const deliveryIssueStatuses = ['failed', 'returned'];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+\-()\s]{7,20}$/;

const buildResult = (value, errors) => ({ value, errors });

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const toBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1';

const validateCreateOrder = (req) => {
  const errors = [];
  const value = {
    merchant_id: req.body.merchant_id ? String(req.body.merchant_id).trim() : null,
    rider_id: req.body.rider_id ? String(req.body.rider_id).trim() : null,
    customer_name: String(req.body.customer_name || '').trim(),
    customer_phone: String(req.body.customer_phone || '').trim(),
    delivery_address: String(req.body.delivery_address || '').trim(),
    item_description: String(req.body.item_description || '').trim(),
    declared_value: req.body.declared_value !== undefined ? Number(req.body.declared_value) : 0,
    hub_id: req.body.hub_id ? String(req.body.hub_id).trim() : null,
    delivery_zone: String(req.body.delivery_zone || '').trim(),
    delivery_fee: req.body.delivery_fee !== undefined ? Number(req.body.delivery_fee) : 0,
    cod_amount: req.body.cod_amount !== undefined ? Number(req.body.cod_amount) : 0,
    auto_assign: toBoolean(req.body.auto_assign),
    batch_id: req.body.batch_id ? String(req.body.batch_id).trim() : null,
  };

  if (value.merchant_id && !isObjectId(value.merchant_id)) errors.push('merchant_id must be a valid ObjectId');
  if (value.rider_id && !isObjectId(value.rider_id)) errors.push('rider_id must be a valid ObjectId');
  if (value.customer_name.length < 2) errors.push('customer_name is required');
  if (!phonePattern.test(value.customer_phone)) errors.push('customer_phone is invalid');
  if (value.delivery_address.length < 5) errors.push('delivery_address is required');
  if (value.item_description.length < 2) errors.push('item_description is required');
  if (Number.isNaN(value.declared_value) || value.declared_value < 0) errors.push('declared_value must be a positive number');
  if (value.hub_id && !isObjectId(value.hub_id)) errors.push('hub_id must be a valid ObjectId');
  if (value.delivery_zone.length < 2) errors.push('delivery_zone is required');
  if (Number.isNaN(value.delivery_fee) || value.delivery_fee < 0) errors.push('delivery_fee must be a positive number');
  if (Number.isNaN(value.cod_amount) || value.cod_amount < 0) errors.push('cod_amount must be a positive number');
  if (value.batch_id && value.batch_id.length < 2) errors.push('batch_id is invalid');

  return buildResult(value, errors);
};

const validateBatchOrders = (req) => {
  const errors = [];
  const orders = Array.isArray(req.body.orders) ? req.body.orders : [];

  if (orders.length === 0) {
    errors.push('orders array is required');
  }

  const value = {
    orders: orders.map((order) => ({
      merchant_id: order.merchant_id ? String(order.merchant_id).trim() : null,
      rider_id: order.rider_id ? String(order.rider_id).trim() : null,
      customer_name: String(order.customer_name || '').trim(),
      customer_phone: String(order.customer_phone || '').trim(),
      delivery_address: String(order.delivery_address || '').trim(),
      item_description: String(order.item_description || '').trim(),
      declared_value: order.declared_value !== undefined ? Number(order.declared_value) : 0,
      hub_id: order.hub_id ? String(order.hub_id).trim() : null,
      delivery_zone: String(order.delivery_zone || '').trim(),
      delivery_fee: order.delivery_fee !== undefined ? Number(order.delivery_fee) : 0,
      cod_amount: order.cod_amount !== undefined ? Number(order.cod_amount) : 0,
      auto_assign: toBoolean(order.auto_assign),
    })),
  };

  value.orders.forEach((order, index) => {
    if (order.merchant_id && !isObjectId(order.merchant_id)) errors.push(`orders[${index}].merchant_id must be a valid ObjectId`);
    if (order.rider_id && !isObjectId(order.rider_id)) errors.push(`orders[${index}].rider_id must be a valid ObjectId`);
    if (order.customer_name.length < 2) errors.push(`orders[${index}].customer_name is required`);
    if (!phonePattern.test(order.customer_phone)) errors.push(`orders[${index}].customer_phone is invalid`);
    if (order.delivery_address.length < 5) errors.push(`orders[${index}].delivery_address is required`);
    if (order.item_description.length < 2) errors.push(`orders[${index}].item_description is required`);
    if (Number.isNaN(order.declared_value) || order.declared_value < 0) errors.push(`orders[${index}].declared_value must be a positive number`);
    if (order.hub_id && !isObjectId(order.hub_id)) errors.push(`orders[${index}].hub_id must be a valid ObjectId`);
    if (order.delivery_zone.length < 2) errors.push(`orders[${index}].delivery_zone is required`);
    if (Number.isNaN(order.delivery_fee) || order.delivery_fee < 0) errors.push(`orders[${index}].delivery_fee must be a positive number`);
    if (Number.isNaN(order.cod_amount) || order.cod_amount < 0) errors.push(`orders[${index}].cod_amount must be a positive number`);
  });

  return buildResult(value, errors);
};

const validateOrderQuery = (req) => {
  const value = {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search ? String(req.query.search).trim() : undefined,
    status: req.query.status ? String(req.query.status).trim() : undefined,
    merchant_id: req.query.merchant_id ? String(req.query.merchant_id).trim() : undefined,
    rider_id: req.query.rider_id ? String(req.query.rider_id).trim() : undefined,
    hub_id: req.query.hub_id ? String(req.query.hub_id).trim() : undefined,
    delivery_zone: req.query.delivery_zone ? String(req.query.delivery_zone).trim() : undefined,
    batch_id: req.query.batch_id ? String(req.query.batch_id).trim() : undefined,
    sort: req.query.sort ? String(req.query.sort).trim() : undefined,
    from: req.query.from ? String(req.query.from).trim() : undefined,
    to: req.query.to ? String(req.query.to).trim() : undefined,
  };

  return buildResult(value, []);
};

const validateOrderStatusUpdate = (req) => {
  const errors = [];
  const value = {
    order_status: String(req.body.order_status || '').trim(),
    note: req.body.note ? String(req.body.note).trim() : null,
  };

  if (!allowedStatuses.includes(value.order_status)) errors.push('order_status is invalid');
  if (value.order_status === 'delivered') errors.push('Use OTP verification to mark an order as delivered');

  return buildResult(value, errors);
};

const validateAssignRider = (req) => {
  const errors = [];
  const value = {
    rider_id: req.body.rider_id ? String(req.body.rider_id).trim() : null,
    auto_assign: toBoolean(req.body.auto_assign),
    note: req.body.note ? String(req.body.note).trim() : null,
  };

  if (!value.rider_id && !value.auto_assign) errors.push('Either rider_id or auto_assign is required');
  if (value.rider_id && !isObjectId(value.rider_id)) errors.push('rider_id must be a valid ObjectId');

  return buildResult(value, errors);
};

const validateOtpVerification = (req) => {
  const errors = [];
  const value = {
    otp_code: String(req.body.otp_code || '').trim(),
    note: req.body.note ? String(req.body.note).trim() : null,
  };

  if (value.otp_code.length !== 4) errors.push('otp_code must be a 4 digit code');

  return buildResult(value, errors);
};

const validateDeliveryIssue = (req) => {
  const errors = [];
  const value = {
    reason: String(req.body.reason || '').trim(),
  };

  if (value.reason.length < 3) errors.push('reason is required');

  return buildResult(value, errors);
};

const validateTrackLookup = (req) => {
  const value = {
    package_tracking_id: String(req.params.packageTrackingId || '').trim().toUpperCase(),
  };

  return buildResult(value, []);
};

const validateRiderTrackingLookup = (req) => {
  const value = {
    rider_tracking_id: String(req.params.riderTrackingId || '').trim().toUpperCase(),
  };

  return buildResult(value, []);
};

module.exports = {
  validateCreateOrder,
  validateBatchOrders,
  validateOrderQuery,
  validateOrderStatusUpdate,
  validateAssignRider,
  validateOtpVerification,
  validateDeliveryIssue,
  validateTrackLookup,
  validateRiderTrackingLookup,
};