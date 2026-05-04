const mongoose = require('mongoose');

const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');
const {
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
  emitOrderEvent,
  findNearestRider,
} = require('../services/orderService');

const DEFAULT_ORDER_POPULATE = [
  { path: 'merchant_id', select: 'merchant_name shop_name email phone referral_code hub_id status' },
  { path: 'rider_id', select: 'full_name email phone profile_image role hub_id' },
  { path: 'hub_id', select: 'name code city state' },
];

const getOrderActorContext = (req) => ({
  id: req.user.id,
  role: req.user.role,
  hub_id: req.user.hub_id,
});

const resolveMerchantId = async (req, fallbackMerchantId = null) => {
  if (fallbackMerchantId) {
    return fallbackMerchantId;
  }

  if (req.user.role === 'merchant') {
    return req.user.id;
  }

  throw new AppError('merchant_id is required', 400);
};

const createOrder = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payload = req.validatedBody || req.body;
    payload.merchant_id = await resolveMerchantId(req, payload.merchant_id);

    const order = await createOrderRecord({
      payload,
      actor: getOrderActorContext(req),
      session,
    });

    await session.commitTransaction();
    session.endSession();

    const populatedOrder = await order.populate(DEFAULT_ORDER_POPULATE);
    emitOrderEvent(populatedOrder, 'order:created');

    return successResponse(res, 'Order created successfully', { order: populatedOrder.toPublicJSON() }, 201);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

const createBatchOrders = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payload = req.validatedBody || req.body;
    const ordersPayload = await Promise.all(payload.orders.map(async (orderPayload) => ({
      ...orderPayload,
      merchant_id: await resolveMerchantId(req, orderPayload.merchant_id),
    })));

    const { batchId, createdOrders } = await createOrderBatch({
      orders: ordersPayload,
      actor: getOrderActorContext(req),
      session,
    });

    await session.commitTransaction();
    session.endSession();

    const populatedOrders = [];
    for (const order of createdOrders) {
      // eslint-disable-next-line no-await-in-loop
      populatedOrders.push(await order.populate(DEFAULT_ORDER_POPULATE));
    }

    populatedOrders.forEach((order) => emitOrderEvent(order, 'order:created'));
    emitOrderEvent(populatedOrders[0], 'order:batch-created', {
      batch_id: batchId,
      total_orders: populatedOrders.length,
      orders: populatedOrders.map((order) => order.toPublicJSON()),
    });

    return successResponse(res, 'Batch orders created successfully', {
      batch_id: batchId,
      orders: populatedOrders.map((order) => order.toPublicJSON()),
    }, 201);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

const listAllOrders = asyncHandler(async (req, res) => {
  const result = await listOrders({ query: req.query, actor: getOrderActorContext(req) });

  return successResponse(res, 'Orders fetched successfully', {
    orders: result.items.map((order) => order.toPublicJSON()),
  }, 200, result.pagination);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await findOrderById(req.params.id);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  assertOrderAccess(order, getOrderActorContext(req));

  return successResponse(res, 'Order fetched successfully', { order: order.toPublicJSON() });
});

const getOrderByPackageTrackingId = asyncHandler(async (req, res) => {
  const trackingId = req.validatedBody?.package_tracking_id || req.params.packageTrackingId;
  const order = await findOrderByPackageTrackingId(trackingId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  return successResponse(res, 'Order tracking fetched successfully', { order: order.toPublicJSON() });
});

const getOrderByRiderTrackingId = asyncHandler(async (req, res) => {
  const trackingId = req.validatedBody?.rider_tracking_id || req.params.riderTrackingId;
  const order = await findOrderByRiderTrackingId(trackingId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  assertOrderAccess(order, getOrderActorContext(req));

  return successResponse(res, 'Order rider tracking fetched successfully', { order: order.toPublicJSON() });
});

const assignRider = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const actor = getOrderActorContext(req);
    assertOrderAccess(order, actor);

    const payload = req.validatedBody || req.body;
    const riderId = payload.auto_assign
      ? (await findNearestRider({ hubId: order.hub_id, deliveryZone: order.delivery_zone }))?._id
      : payload.rider_id;

    if (!riderId) {
      throw new AppError('No rider available for assignment', 404);
    }

    const result = await assignRiderToOrder({
      order,
      riderId,
      actor,
      session,
      autoAssigned: Boolean(payload.auto_assign),
    });

    await session.commitTransaction();
    session.endSession();

    const populatedOrder = await result.order.populate(DEFAULT_ORDER_POPULATE);
    emitOrderEvent(populatedOrder, 'order:assigned');

    return successResponse(res, 'Rider assigned successfully', { order: populatedOrder.toPublicJSON() });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const actor = getOrderActorContext(req);
    assertOrderAccess(order, actor);

    const payload = req.validatedBody || req.body;
    const updatedOrder = await transitionOrderStatus({
      order,
      nextStatus: payload.order_status,
      actor,
      note: payload.note,
      session,
    });

    await session.commitTransaction();
    session.endSession();

    const populatedOrder = await updatedOrder.populate(DEFAULT_ORDER_POPULATE);
    emitOrderEvent(populatedOrder, 'order:status-updated');

    return successResponse(res, 'Order status updated successfully', { order: populatedOrder.toPublicJSON() });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

const verifyOrderDeliveryOtp = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).select('+otp_code').session(session);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const actor = getOrderActorContext(req);
    assertOrderAccess(order, actor);

    const payload = req.validatedBody || req.body;
    const updatedOrder = await verifyOrderOtp({
      order,
      otpCode: payload.otp_code,
      actor,
      session,
      note: payload.note,
    });

    await session.commitTransaction();
    session.endSession();

    const populatedOrder = await updatedOrder.populate(DEFAULT_ORDER_POPULATE);
    emitOrderEvent(populatedOrder, 'order:otp-verified');

    return successResponse(res, 'OTP verified and order delivered successfully', { order: populatedOrder.toPublicJSON() });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

const markOrderFailed = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const actor = getOrderActorContext(req);
    assertOrderAccess(order, actor);

    const payload = req.validatedBody || req.body;
    const updatedOrder = await updateOrderDeliveryIssue({
      order,
      nextStatus: 'failed',
      reason: payload.reason,
      actor,
      session,
    });

    await session.commitTransaction();
    session.endSession();

    const populatedOrder = await updatedOrder.populate(DEFAULT_ORDER_POPULATE);
    emitOrderEvent(populatedOrder, 'order:failed');

    return successResponse(res, 'Order marked as failed successfully', { order: populatedOrder.toPublicJSON() });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

const returnOrderToMerchant = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const actor = getOrderActorContext(req);
    assertOrderAccess(order, actor);

    const payload = req.validatedBody || req.body;
    const updatedOrder = await updateOrderDeliveryIssue({
      order,
      nextStatus: 'returned',
      reason: payload.reason,
      actor,
      session,
    });

    updatedOrder.rider_id = null;
    updatedOrder.otp_code = null;
    await updatedOrder.save({ session });

    await session.commitTransaction();
    session.endSession();

    const populatedOrder = await updatedOrder.populate(DEFAULT_ORDER_POPULATE);
    emitOrderEvent(populatedOrder, 'order:returned');

    return successResponse(res, 'Order returned to merchant successfully', { order: populatedOrder.toPublicJSON() });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

const trackOrder = asyncHandler(async (req, res) => {
  const order = await findOrderByPackageTrackingId(req.params.packageTrackingId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  return successResponse(res, 'Order tracking fetched successfully', { order: order.toPublicJSON() });
});

module.exports = {
  createOrder,
  createBatchOrders,
  listAllOrders,
  getOrderById,
  getOrderByPackageTrackingId,
  getOrderByRiderTrackingId,
  assignRider,
  updateOrderStatus,
  verifyOrderDeliveryOtp,
  markOrderFailed,
  returnOrderToMerchant,
  trackOrder,
};
