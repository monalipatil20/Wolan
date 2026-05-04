const crypto = require('crypto');

const mongoose = require('mongoose');
const QRCode = require('qrcode');

const Order = require('../models/Order');
const Merchant = require('../models/Merchant');
const User = require('../models/User');
const Hub = require('../models/Hub');
const AppError = require('../utils/AppError');
const { emitToHub, emitToUser, emitGlobal } = require('./realtimeService');

const ORDER_STATUSES = ['pending', 'picked_up', 'at_hub', 'out_for_delivery', 'delivered', 'failed', 'returned'];
const ACTIVE_RIDER_STATUSES = ['pending', 'picked_up', 'at_hub', 'out_for_delivery'];
const ADMIN_ROLES = ['super_admin', 'hub_manager', 'ops_coordinator'];
const MANAGER_ROLES = ['super_admin', 'hub_manager', 'ops_coordinator', 'merchant'];
const DISPATCH_WINDOW_DAYS = 30;

const buildAuthContext = (actor = {}) => ({
  id: actor.id ? String(actor.id) : null,
  role: actor.role || 'system',
  hub_id: actor.hub_id ? String(actor.hub_id) : null,
});

const resolveIdValue = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'object') {
    return String(value._id || value.id || value);
  }

  return String(value);
};

const normalizePagination = (query = {}) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const randomToken = (length = 6) => crypto.randomBytes(length).toString('hex').toUpperCase();

const generateIdentifier = async (prefix, fieldName) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomToken(2)}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await Order.exists({ [fieldName]: candidate });
    if (!exists) {
      return candidate;
    }
  }

  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomToken(4)}`;
};

const generateOrderId = () => generateIdentifier('ORD', 'order_id');
const generatePackageTrackingId = () => generateIdentifier('PKG', 'package_tracking_id');
const generateRiderTrackingId = () => generateIdentifier('RDR', 'rider_tracking_id');
const generateBatchId = () => `${Date.now().toString(36).toUpperCase()}-${randomToken(3)}`;
const generateOtpCode = () => String(crypto.randomInt(1000, 10000)).padStart(4, '0');

const buildQrPayload = (order) => ({
  order_id: order.order_id,
  package_tracking_id: order.package_tracking_id,
  rider_tracking_id: order.rider_tracking_id,
  merchant_id: String(order.merchant_id),
  hub_id: String(order.hub_id),
  delivery_zone: order.delivery_zone,
  order_status: order.order_status,
});

const generateQrCode = async (order) => QRCode.toDataURL(JSON.stringify(buildQrPayload(order)), {
  errorCorrectionLevel: 'M',
  margin: 1,
  scale: 8,
});

const addHistoryEntry = (order, status, note, actor, metadata = {}) => {
  const context = buildAuthContext(actor);

  order.status_history.push({
    status,
    note: note || null,
    updated_by: context.id,
    updated_by_role: context.role,
    metadata,
    updated_at: new Date(),
  });
};

const addActivityLog = (order, action, note, actor, metadata = {}) => {
  const context = buildAuthContext(actor);

  order.activity_logs.push({
    action,
    note: note || null,
    actor_id: context.id,
    actor_role: context.role,
    metadata,
    created_at: new Date(),
  });
};

const emitOrderEvent = (order, eventName, payload = null) => {
  const publicPayload = payload || order.toPublicJSON();

  emitGlobal(eventName, publicPayload);
  emitToHub(resolveIdValue(order.hub_id), eventName, publicPayload);

  if (order.merchant_id) {
    emitToUser(resolveIdValue(order.merchant_id), eventName, publicPayload);
  }

  if (order.rider_id) {
    emitToUser(resolveIdValue(order.rider_id), eventName, publicPayload);
  }
};

const buildOrderMatch = ({ search, status, merchant_id, rider_id, hub_id, delivery_zone, batch_id, from, to }, actor = {}) => {
  const match = {};
  const context = buildAuthContext(actor);

  if (context.role === 'merchant' && context.id) {
    match.merchant_id = new mongoose.Types.ObjectId(context.id);
  } else if (merchant_id) {
    match.merchant_id = new mongoose.Types.ObjectId(merchant_id);
  }

  if (context.role === 'rider' && context.id) {
    match.rider_id = new mongoose.Types.ObjectId(context.id);
  } else if (rider_id) {
    match.rider_id = new mongoose.Types.ObjectId(rider_id);
  }

  if (context.role !== 'super_admin') {
    if (context.hub_id) {
      match.hub_id = new mongoose.Types.ObjectId(context.hub_id);
    }
  } else if (hub_id) {
    match.hub_id = new mongoose.Types.ObjectId(hub_id);
  }

  if (status) match.order_status = status;
  if (delivery_zone) match.delivery_zone = delivery_zone;
  if (batch_id) match.batch_id = batch_id;

  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  if (search) {
    match.$or = [
      { order_id: { $regex: search, $options: 'i' } },
      { package_tracking_id: { $regex: search, $options: 'i' } },
      { rider_tracking_id: { $regex: search, $options: 'i' } },
      { customer_name: { $regex: search, $options: 'i' } },
      { customer_phone: { $regex: search, $options: 'i' } },
      { delivery_address: { $regex: search, $options: 'i' } },
      { item_description: { $regex: search, $options: 'i' } },
      { delivery_zone: { $regex: search, $options: 'i' } },
    ];
  }

  return match;
};

const scoreRiders = async ({ hubId, deliveryZone }) => {
  const hubObjectId = new mongoose.Types.ObjectId(hubId);
  const riders = await User.find({ role: 'rider', is_active: true, hub_id: hubObjectId }).lean();

  if (riders.length === 0) {
    return [];
  }

  const activeCounts = await Order.aggregate([
    {
      $match: {
        hub_id: hubObjectId,
        rider_id: { $in: riders.map((rider) => rider._id) },
        order_status: { $in: ACTIVE_RIDER_STATUSES },
      },
    },
    {
      $group: {
        _id: '$rider_id',
        activeCount: { $sum: 1 },
      },
    },
  ]);

  const zoneWindow = new Date();
  zoneWindow.setDate(zoneWindow.getDate() - DISPATCH_WINDOW_DAYS);

  const zoneScores = deliveryZone
    ? await Order.aggregate([
      {
        $match: {
          hub_id: hubObjectId,
          rider_id: { $in: riders.map((rider) => rider._id) },
          delivery_zone: deliveryZone,
          createdAt: { $gte: zoneWindow },
        },
      },
      {
        $group: {
          _id: '$rider_id',
          zoneScore: { $sum: 1 },
        },
      },
    ])
    : [];

  const activeMap = activeCounts.reduce((accumulator, item) => {
    accumulator[String(item._id)] = item.activeCount;
    return accumulator;
  }, {});

  const zoneMap = zoneScores.reduce((accumulator, item) => {
    accumulator[String(item._id)] = item.zoneScore;
    return accumulator;
  }, {});

  return riders
    .map((rider) => ({
      ...rider,
      activeCount: activeMap[String(rider._id)] || 0,
      zoneScore: zoneMap[String(rider._id)] || 0,
    }))
    .sort((left, right) => {
      if (right.zoneScore !== left.zoneScore) {
        return right.zoneScore - left.zoneScore;
      }

      if (left.activeCount !== right.activeCount) {
        return left.activeCount - right.activeCount;
      }

      return new Date(left.createdAt) - new Date(right.createdAt);
    });
};

const findNearestRider = async ({ hubId, deliveryZone }) => {
  const scoredRiders = await scoreRiders({ hubId, deliveryZone });
  return scoredRiders[0] || null;
};

const ensureMerchantAndHub = async ({ merchantId, hubId }) => {
  const merchant = await Merchant.findById(merchantId);

  if (!merchant) {
    throw new AppError('Merchant not found', 404);
  }

  const effectiveHubId = hubId || merchant.hub_id;

  if (!effectiveHubId) {
    throw new AppError('hub_id is required for order creation', 400);
  }

  const hubExists = await Hub.exists({ _id: effectiveHubId });
  if (!hubExists) {
    throw new AppError('hub_id is invalid', 400);
  }

  return { merchant, hubId: effectiveHubId };
};

const createOrderRecord = async ({ payload, actor, session, batchId = null }) => {
  const context = buildAuthContext(actor);
  const merchantId = payload.merchant_id || (context.role === 'merchant' ? context.id : null);

  if (!merchantId) {
    throw new AppError('merchant_id is required', 400);
  }

  const { merchant, hubId } = await ensureMerchantAndHub({ merchantId, hubId: payload.hub_id });

  let rider = null;
  if (payload.rider_id) {
    rider = await User.findOne({ _id: payload.rider_id, role: 'rider', is_active: true, hub_id: hubId }).session(session);
    if (!rider) {
      throw new AppError('rider_id is invalid or unavailable', 400);
    }
  } else if (payload.auto_assign) {
    rider = await findNearestRider({ hubId, deliveryZone: payload.delivery_zone });
    if (!rider) {
      throw new AppError('No active rider found for auto assignment', 404);
    }
  }

  const order = new Order({
    order_id: await generateOrderId(),
    merchant_id: merchant._id,
    rider_id: rider ? rider._id : null,
    customer_name: payload.customer_name,
    customer_phone: payload.customer_phone,
    delivery_address: payload.delivery_address,
    item_description: payload.item_description,
    declared_value: payload.declared_value || 0,
    order_status: 'pending',
    otp_code: generateOtpCode(),
    package_tracking_id: await generatePackageTrackingId(),
    rider_tracking_id: await generateRiderTrackingId(),
    qr_code: null,
    hub_id: hubId,
    delivery_zone: payload.delivery_zone,
    delivery_fee: payload.delivery_fee || 0,
    cod_amount: payload.cod_amount || 0,
    batch_id: batchId,
    assigned_at: rider ? new Date() : null,
    status_history: [],
    activity_logs: [],
  });

  order.qr_code = await generateQrCode(order);
  addHistoryEntry(order, 'pending', 'Order created', actor, { batch_id: batchId });
  addActivityLog(order, 'order_created', 'Order created successfully', actor, {
    merchant_id: String(merchant._id),
    hub_id: String(hubId),
    rider_id: rider ? String(rider._id) : null,
  });

  if (rider) {
    addHistoryEntry(order, 'pending', `Auto assigned to rider ${rider.full_name}`, actor, {
      rider_id: String(rider._id),
      auto_assigned: true,
    });
    addActivityLog(order, 'rider_assigned', 'Rider assigned during order creation', actor, {
      rider_id: String(rider._id),
      auto_assigned: true,
    });
  }

  await order.save({ session });
  return order;
};

const createOrderBatch = async ({ orders, actor, session }) => {
  const batchId = generateBatchId();
  const createdOrders = [];

  for (const payload of orders) {
    // eslint-disable-next-line no-await-in-loop
    const order = await createOrderRecord({ payload, actor, session, batchId });
    createdOrders.push(order);
  }

  return { batchId, createdOrders };
};

const listOrders = async ({ query, actor }) => {
  const { page, limit, skip } = normalizePagination(query);
  const match = buildOrderMatch(query, actor);
  const sortMode = String(query.sort || '').toLowerCase();

  const sort = sortMode === 'zone'
    ? { delivery_zone: 1, createdAt: -1 }
    : { createdAt: -1 };

  const [items, total] = await Promise.all([
    Order.find(match)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('merchant_id', 'merchant_name shop_name email phone referral_code hub_id status')
      .populate('rider_id', 'full_name email phone profile_image role hub_id')
      .populate('hub_id', 'name code city state'),
    Order.countDocuments(match),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const findOrderById = async (orderId) => Order.findById(orderId)
  .populate('merchant_id', 'merchant_name shop_name email phone referral_code hub_id status')
  .populate('rider_id', 'full_name email phone profile_image role hub_id')
  .populate('hub_id', 'name code city state');

const findOrderByPackageTrackingId = async (trackingId) => Order.findOne({ package_tracking_id: trackingId })
  .populate('merchant_id', 'merchant_name shop_name email phone referral_code hub_id status')
  .populate('rider_id', 'full_name email phone profile_image role hub_id')
  .populate('hub_id', 'name code city state');

const findOrderByRiderTrackingId = async (trackingId) => Order.findOne({ rider_tracking_id: trackingId })
  .populate('merchant_id', 'merchant_name shop_name email phone referral_code hub_id status')
  .populate('rider_id', 'full_name email phone profile_image role hub_id')
  .populate('hub_id', 'name code city state');

const assertOrderAccess = (order, actor) => {
  const context = buildAuthContext(actor);
  const merchantId = resolveIdValue(order.merchant_id);
  const riderId = resolveIdValue(order.rider_id);
  const hubId = resolveIdValue(order.hub_id);

  if (context.role === 'super_admin') {
    return true;
  }

  if (context.role === 'merchant' && merchantId === context.id) {
    return true;
  }

  if (context.role === 'rider' && riderId === context.id) {
    return true;
  }

  if (ADMIN_ROLES.includes(context.role) && context.hub_id && hubId === context.hub_id) {
    return true;
  }

  throw new AppError('Forbidden', 403);
};

const ensureValidTransition = (order, nextStatus) => {
  const allowedTransitions = {
    pending: ['picked_up', 'failed', 'returned'],
    picked_up: ['at_hub', 'out_for_delivery', 'failed', 'returned'],
    at_hub: ['out_for_delivery', 'returned', 'failed'],
    out_for_delivery: ['failed', 'returned'],
    failed: ['returned'],
    returned: [],
    delivered: [],
  };

  const allowed = allowedTransitions[order.order_status] || [];
  if (!allowed.includes(nextStatus)) {
    throw new AppError(`Cannot move order from ${order.order_status} to ${nextStatus}`, 400);
  }
};

const transitionOrderStatus = async ({ order, nextStatus, actor, note, session, metadata = {}, otpVerified = false }) => {
  ensureValidTransition(order, nextStatus);

  if (nextStatus === 'delivered' && !otpVerified) {
    throw new AppError('OTP verification is required before marking an order as delivered', 400);
  }

  order.order_status = nextStatus;

  if (nextStatus === 'picked_up') {
    order.picked_up_at = new Date();
  } else if (nextStatus === 'at_hub') {
    order.at_hub_at = new Date();
  } else if (nextStatus === 'out_for_delivery') {
    order.out_for_delivery_at = new Date();
  } else if (nextStatus === 'delivered') {
    order.delivered_at = new Date();
    order.otp_verified_at = new Date();
    order.otp_code = null;
  } else if (nextStatus === 'failed') {
    order.failed_at = new Date();
    order.delivery_attempts += 1;
  } else if (nextStatus === 'returned') {
    order.returned_at = new Date();
  }

  addHistoryEntry(order, nextStatus, note || `Order moved to ${nextStatus}`, actor, metadata);
  addActivityLog(order, `status_${nextStatus}`, note || `Order moved to ${nextStatus}`, actor, metadata);
  await order.save({ session });

  return order;
};

const assignRiderToOrder = async ({ order, riderId, actor, session, autoAssigned = false }) => {
  const rider = await User.findOne({ _id: riderId, role: 'rider', is_active: true, hub_id: order.hub_id }).session(session);

  if (!rider) {
    throw new AppError('rider_id is invalid or unavailable', 400);
  }

  order.rider_id = rider._id;
  order.assigned_at = new Date();
  addHistoryEntry(order, 'pending', autoAssigned ? 'Auto rider assigned' : 'Rider assigned', actor, {
    rider_id: String(rider._id),
    auto_assigned: autoAssigned,
  });
  addActivityLog(order, 'rider_assigned', autoAssigned ? 'Auto rider assigned' : 'Rider assigned', actor, {
    rider_id: String(rider._id),
    auto_assigned: autoAssigned,
  });

  await order.save({ session });
  return { order, rider };
};

const verifyOrderOtp = async ({ order, otpCode, actor, session, note }) => {
  if (!order.otp_code) {
    throw new AppError('OTP has not been generated for this order', 400);
  }

  if (String(order.otp_code) !== String(otpCode).trim()) {
    throw new AppError('Invalid OTP code', 400);
  }

  return transitionOrderStatus({
    order,
    nextStatus: 'delivered',
    actor,
    note: note || 'OTP verified successfully',
    session,
    metadata: { otp_verified: true },
    otpVerified: true,
  });
};

const updateOrderDeliveryIssue = async ({ order, nextStatus, reason, actor, session }) => transitionOrderStatus({
  order,
  nextStatus,
  actor,
  note: reason,
  session,
  metadata: { reason },
});

const populateOrder = async (orderIdOrDoc) => {
  if (!orderIdOrDoc) {
    return null;
  }

  if (typeof orderIdOrDoc.populate === 'function') {
    return orderIdOrDoc
      .populate('merchant_id', 'merchant_name shop_name email phone referral_code hub_id status')
      .populate('rider_id', 'full_name email phone profile_image role hub_id')
      .populate('hub_id', 'name code city state');
  }

  return findOrderById(orderIdOrDoc);
};

module.exports = {
  ORDER_STATUSES,
  ADMIN_ROLES,
  MANAGER_ROLES,
  buildAuthContext,
  normalizePagination,
  generateOrderId,
  generatePackageTrackingId,
  generateRiderTrackingId,
  generateBatchId,
  generateOtpCode,
  generateQrCode,
  addHistoryEntry,
  addActivityLog,
  emitOrderEvent,
  buildOrderMatch,
  scoreRiders,
  findNearestRider,
  ensureMerchantAndHub,
  createOrderRecord,
  createOrderBatch,
  listOrders,
  findOrderById,
  findOrderByPackageTrackingId,
  findOrderByRiderTrackingId,
  assertOrderAccess,
  transitionOrderStatus,
  assignRiderToOrder,
  verifyOrderOtp,
  updateOrderDeliveryIssue,
  populateOrder,
};