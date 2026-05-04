const Shipment = require('../models/Shipment');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');
const { emitToHub } = require('../services/realtimeService');

const createShipment = asyncHandler(async (req, res) => {
  const shipment = await Shipment.create({
    ...req.body,
    hub_id: req.body.hub_id || req.user.hub_id,
    merchant_id: req.body.merchant_id || req.user.id,
  });

  emitToHub(shipment.hub_id, 'shipment:created', shipment);

  return successResponse(res, 'Shipment created successfully', { shipment }, 201);
});

const listShipments = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role !== 'super_admin') {
    filter.hub_id = req.user.hub_id;
  }

  const shipments = await Shipment.find(filter)
    .sort({ createdAt: -1 })
    .populate('hub_id', 'name code')
    .populate('merchant_id', 'full_name email role profile_image')
    .populate('rider_id', 'full_name email role profile_image');

  return successResponse(res, 'Shipments fetched successfully', { shipments });
});

const getShipmentById = asyncHandler(async (req, res) => {
  const shipment = await Shipment.findById(req.params.id)
    .populate('hub_id', 'name code')
    .populate('merchant_id', 'full_name email role profile_image')
    .populate('rider_id', 'full_name email role profile_image');

  if (!shipment) {
    throw new AppError('Shipment not found', 404);
  }

  return successResponse(res, 'Shipment fetched successfully', { shipment });
});

const updateShipmentStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const shipment = await Shipment.findById(req.params.id);

  if (!shipment) {
    throw new AppError('Shipment not found', 404);
  }

  shipment.status = status;
  shipment.status_history.push({
    status,
    note,
    updated_by: req.user.id,
  });

  await shipment.save();

  emitToHub(shipment.hub_id, 'shipment:updated', shipment);

  return successResponse(res, 'Shipment status updated successfully', { shipment });
});

module.exports = {
  createShipment,
  listShipments,
  getShipmentById,
  updateShipmentStatus,
};