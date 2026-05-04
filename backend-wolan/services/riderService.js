const mongoose = require('mongoose');

const Rider = require('../models/Rider');
const User = require('../models/User');
const Order = require('../models/Order');
const Hub = require('../models/Hub');
const AppError = require('../utils/AppError');
const { emitToHub, emitToUser, emitGlobal } = require('./realtimeService');

const RIDER_STATUSES = ['available', 'on_delivery', 'break', 'offline'];
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

const ensureUserAndHub = async ({ userId, hubId }) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.role !== 'rider') {
    throw new AppError('User must have rider role', 400);
  }

  const effectiveHubId = hubId || user.hub_id;

  if (!effectiveHubId) {
    throw new AppError('hub_id is required for rider registration', 400);
  }

  const hubExists = await Hub.exists({ _id: effectiveHubId });
  if (!hubExists) {
    throw new AppError('hub_id is invalid', 400);
  }

  return { user, hubId: effectiveHubId };
};

const createRiderProfile = async ({ userId, payload, actor }) => {
  const { user, hubId } = await ensureUserAndHub({ userId, hubId: payload.hub_id });

  const existingRider = await Rider.findOne({ user_id: userId });
  if (existingRider) {
    throw new AppError('Rider profile already exists', 409);
  }

  const rider = new Rider({
    user_id: user._id,
    full_name: payload.full_name || user.full_name,
    phone: payload.phone || user.phone,
    bike_plate: payload.bike_plate,
    nin_number: payload.nin_number,
    next_of_kin: payload.next_of_kin,
    bond_amount: payload.bond_amount || 0,
    bond_status: 'pending',
    current_status: 'offline',
    gps_location: { type: 'Point', coordinates: [0, 0] },
    current_cod: 0,
    performance_score: 0,
    total_deliveries: 0,
    earnings: 0,
    hub_id: hubId,
    is_active: true,
    activation_date: new Date(),
  });

  await rider.save();
  return rider;
};

const getRiderByUserId = async (userId) => Rider.findOne({ user_id: userId });

const getRiderById = async (riderId) => Rider.findById(riderId).populate('hub_id', 'name code city');

const listRiders = async ({ query, actor }) => {
  const { page, limit, skip } = normalizePagination(query);
  const context = buildAuthContext(actor);

  const match = {};
  if (context.role !== 'super_admin' && context.hub_id) {
    match.hub_id = new mongoose.Types.ObjectId(context.hub_id);
  } else if (query.hub_id) {
    match.hub_id = new mongoose.Types.ObjectId(query.hub_id);
  }

  if (query.current_status) {
    match.current_status = query.current_status;
  }

  if (query.is_active !== undefined) {
    match.is_active = query.is_active === 'true' || query.is_active === true;
  }

  if (query.search) {
    match.$or = [
      { full_name: { $regex: query.search, $options: 'i' } },
      { phone: { $regex: query.search, $options: 'i' } },
      { bike_plate: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Rider.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('hub_id', 'name code city'),
    Rider.countDocuments(match),
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

const updateRiderStatus = async ({ rider, status, actor }) => {
  if (!RIDER_STATUSES.includes(status)) {
    throw new AppError('Invalid rider status', 400);
  }

  rider.current_status = status;
  if (status === 'offline') {
    rider.gps_location = { type: 'Point', coordinates: [0, 0] };
  }

  await rider.save();

  emitToHub(resolveIdValue(rider.hub_id), 'rider:status-updated', {
    rider_id: rider._id,
    user_id: rider.user_id,
    full_name: rider.full_name,
    current_status: status,
  });

  return rider;
};

const updateRiderGpsLocation = async ({ rider, latitude, longitude }) => {
  if (latitude < -90 || latitude > 90) {
    throw new AppError('Invalid latitude', 400);
  }
  if (longitude < -180 || longitude > 180) {
    throw new AppError('Invalid longitude', 400);
  }

  rider.gps_location = {
    type: 'Point',
    coordinates: [longitude, latitude],
  };
  rider.last_location_update = new Date();

  if (rider.current_status === 'offline') {
    rider.current_status = 'available';
  }

  await rider.save();

  emitToHub(resolveIdValue(rider.hub_id), 'rider:location-updated', {
    rider_id: rider._id,
    gps_location: rider.gps_location,
    last_location_update: rider.last_location_update,
  });

  return rider;
};

const uploadRiderDocument = async ({ rider, documentType, url, publicId }) => {
  const existingIndex = rider.documents.findIndex((doc) => doc.type === documentType);

  const docData = {
    type: documentType,
    url,
    public_id: publicId,
    verified: false,
    uploaded_at: new Date(),
  };

  if (existingIndex >= 0) {
    rider.documents[existingIndex] = docData;
  } else {
    rider.documents.push(docData);
  }

  const allRequired = ['license', 'insurance', 'bike_registration', 'id_card'];
  const allUploaded = allRequired.every((type) =>
    rider.documents.some((doc) => doc.type === type)
  );

  if (allUploaded) {
    rider.all_documents_verified = true;
  }

  await rider.save();
  return rider;
};

const verifyRiderDocument = async ({ rider, documentType, verified }) => {
  const doc = rider.documents.find((d) => d.type === documentType);
  if (!doc) {
    throw new AppError('Document not found', 404);
  }

  doc.verified = verified;
  await rider.save();
  return rider;
};

const registerBondPayment = async ({ rider, amount, actor }) => {
  rider.bond_amount = amount;
  rider.bond_status = 'deposited';
  await rider.save();

  return rider;
};

const updateRiderPerformance = async ({ rider }) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const deliveryStats = await Order.aggregate([
    {
      $match: {
        rider_id: rider.user_id,
        delivered_at: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        successful: {
          $sum: { $cond: [{ $eq: ['$order_status', 'delivered'] }, 1, 0] },
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$order_status', 'failed'] }, 1, 0] },
        },
        returned: {
          $sum: { $cond: [{ $eq: ['$order_status', 'returned'] }, 1, 0] },
        },
      },
    },
  ]);

  const stats = deliveryStats[0] || { total: 0, successful: 0, failed: 0, returned: 0 };
  rider.total_deliveries = stats.total;
  rider.successful_deliveries = stats.successful;
  rider.failed_deliveries = stats.failed;
  rider.returned_orders = stats.returned;

  if (stats.total > 0) {
    rider.performance_score = Math.round((stats.successful / stats.total) * 100);
  }

  await rider.save();
  return rider;
};

const addFine = async ({ rider, amount, reason, actor }) => {
  const context = buildAuthContext(actor);

  rider.fines.push({
    amount,
    reason,
    status: 'pending',
    issued_by: context.id ? new mongoose.Types.ObjectId(context.id) : null,
    issued_at: new Date(),
  });

  rider.pending_payout += amount;
  await rider.save();

  emitToUser(resolveIdValue(rider.user_id), 'rider:fine-added', {
    amount,
    reason,
    total_fines: rider.fines.length,
  });

  return rider;
};

const payFine = async ({ rider, fineId }) => {
  const fine = rider.fines.id(fineId);
  if (!fine) {
    throw new AppError('Fine not found', 404);
  }

  if (fine.status !== 'pending') {
    throw new AppError('Fine is not pending', 400);
  }

  fine.status = 'paid';
  fine.paid_at = new Date();
  rider.pending_payout -= fine.amount;
  await rider.save();

  return rider;
};

const reportIncident = async ({ rider, type, description, location }) => {
  rider.incidents.push({
    type,
    description,
    location,
    status: 'open',
    reported_at: new Date(),
  });

  await rider.save();

  emitToHub(resolveIdValue(rider.hub_id), 'rider:incident-reported', {
    rider_id: rider._id,
    type,
    description,
  });

  return rider;
};

const resolveIncident = async ({ rider, incidentId, resolution, actor }) => {
  const incident = rider.incidents.id(incidentId);
  if (!incident) {
    throw new AppError('Incident not found', 404);
  }

  incident.status = 'resolved';
  incident.resolution = resolution;
  incident.resolved_at = new Date();
  await rider.save();

  return rider;
};

const getDailyEarnings = async ({ rider, date }) => {
  const targetDate = date || new Date();
  targetDate.setHours(0, 0, 0, 0);

  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const dayStats = await Order.aggregate([
    {
      $match: {
        rider_id: rider.user_id,
        createdAt: { $gte: targetDate, $lt: nextDate },
      },
    },
    {
      $group: {
        _id: null,
        deliveries: { $sum: 1 },
        successful: {
          $sum: { $cond: [{ $eq: ['$order_status', 'delivered'] }, 1, 0] },
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$order_status', 'failed'] }, 1, 0] },
        },
        returned: {
          $sum: { $cond: [{ $eq: ['$order_status', 'returned'] }, 1, 0] },
        },
      },
    },
  ]);

  const stats = dayStats[0] || { deliveries: 0, successful: 0, failed: 0, returned: 0 };

  const dayEarnings = {
    date: targetDate,
    deliveries: stats.deliveries,
    successful_deliveries: stats.successful,
    failed_deliveries: stats.failed,
    returned_orders: stats.returned,
    total_distance: 0,
    earnings: stats.successful * 50,
    cod_collected: 0,
    fines: 0,
    bonus: 0,
    net_earnings: stats.successful * 50,
  };

  return dayEarnings;
};

const getEarningsSummary = async ({ rider, from, to }) => {
  const startDate = from ? new Date(from) : new Date();
  startDate.setDate(startDate.getDate() - 30);

  const endDate = to ? new Date(to) : new Date();
  endDate.setHours(23, 59, 59, 999);

  const periodStats = await Order.aggregate([
    {
      $match: {
        rider_id: rider.user_id,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        total_deliveries: { $sum: 1 },
        successful: {
          $sum: { $cond: [{ $eq: ['$order_status', 'delivered'] }, 1, 0] },
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$order_status', 'failed'] }, 1, 0] },
        },
        returned: {
          $sum: { $cond: [{ $eq: ['$order_status', 'returned'] }, 1, 0] },
        },
      },
    },
  ]);

  const stats = periodStats[0] || { total_deliveries: 0, successful: 0, failed: 0, returned: 0 };

  const totalFines = rider.fines
    .filter((f) => f.status === 'pending')
    .reduce((sum, f) => sum + f.amount, 0);

  return {
    period: {
      from: startDate,
      to: endDate,
    },
    deliveries: stats.total_deliveries,
    successful_deliveries: stats.successful,
    failed_deliveries: stats.failed,
    returned_orders: stats.returned,
    gross_earnings: stats.successful * 50,
    total_fines: totalFines,
    net_earnings: stats.successful * 50 - totalFines,
    pending_payout: rider.pending_payout,
    total_earnings: rider.earnings,
  };
};

const updateRiderFromOrder = async ({ rider, order, status }) => {
  if (status === 'delivered') {
    rider.total_deliveries += 1;
    rider.successful_deliveries += 1;
    rider.earnings += 50;
    rider.last_delivery_at = new Date();
  } else if (status === 'failed') {
    rider.failed_deliveries += 1;
  } else if (status === 'returned') {
    rider.returned_orders += 1;
  }

  rider.current_cod += order.cod_amount || 0;
  await rider.save();

  return rider;
};

const findNearbyRiders = async ({ hubId, latitude, longitude, radiusKm = 5 }) => {
  return Rider.find({
    hub_id: hubId,
    current_status: 'available',
    is_active: true,
    gps_location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: radiusKm * 1000,
      },
    },
  }).limit(10);
};

module.exports = {
  RIDER_STATUSES,
  buildAuthContext,
  normalizePagination,
  ensureUserAndHub,
  createRiderProfile,
  getRiderByUserId,
  getRiderById,
  listRiders,
  updateRiderStatus,
  updateRiderGpsLocation,
  uploadRiderDocument,
  verifyRiderDocument,
  registerBondPayment,
  updateRiderPerformance,
  addFine,
  payFine,
  reportIncident,
  resolveIncident,
  getDailyEarnings,
  getEarningsSummary,
  updateRiderFromOrder,
  findNearbyRiders,
};
