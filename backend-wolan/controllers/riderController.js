const mongoose = require('mongoose');

const Rider = require('../models/Rider');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');
const riderService = require('../services/riderService');

const {
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
  payFine: payRiderFine,
  reportIncident,
  resolveIncident: resolveRiderIncident,
  getDailyEarnings,
  getEarningsSummary,
} = riderService;

const getRiderActorContext = (req) => ({
  id: req.user.id,
  role: req.user.role,
  hub_id: req.user.hub_id,
});

const registerRider = asyncHandler(async (req, res) => {
  const payload = req.validatedBody || req.body;

  const rider = await createRiderProfile({
    userId: req.user.id,
    payload,
    actor: getRiderActorContext(req),
  });

  return successResponse(res, 'Rider profile created successfully', { rider: rider.toPublicJSON() }, 201);
});

const getMyRiderProfile = asyncHandler(async (req, res) => {
  const rider = await getRiderByUserId(req.user.id);

  if (!rider) {
    throw new AppError('Rider profile not found', 404);
  }

  return successResponse(res, 'Rider profile fetched successfully', { rider: rider.toPublicJSON() });
});

const getRiderByIdController = asyncHandler(async (req, res) => {
  const rider = await getRiderById(req.params.id);

  if (!rider) {
    throw new AppError('Rider not found', 404);
  }

  return successResponse(res, 'Rider fetched successfully', { rider: rider.toPublicJSON() });
});

const listAllRiders = asyncHandler(async (req, res) => {
  const result = await listRiders({ query: req.query, actor: getRiderActorContext(req) });

  return successResponse(res, 'Riders fetched successfully', {
    riders: result.items.map((rider) => rider.toPublicJSON()),
  }, 200, result.pagination);
});

const updateStatus = asyncHandler(async (req, res) => {
  const rider = await getRiderByUserId(req.user.id);

  if (!rider) {
    throw new AppError('Rider profile not found', 404);
  }

  const payload = req.validatedBody || req.body;
  const updatedRider = await updateRiderStatus({
    rider,
    status: payload.current_status,
    actor: getRiderActorContext(req),
  });

  return successResponse(res, 'Rider status updated successfully', { rider: updatedRider.toPublicJSON() });
});

const updateGpsLocation = asyncHandler(async (req, res) => {
  const rider = await getRiderByUserId(req.user.id);

  if (!rider) {
    throw new AppError('Rider profile not found', 404);
  }

  const payload = req.validatedBody || req.body;
  const updatedRider = await updateRiderGpsLocation({
    rider,
    latitude: payload.latitude,
    longitude: payload.longitude,
  });

  return successResponse(res, 'GPS location updated successfully', {
    gps_location: updatedRider.gps_location,
    last_location_update: updatedRider.last_location_update,
  });
});

const uploadDocument = asyncHandler(async (req, res) => {
  const rider = await getRiderByUserId(req.user.id);

  if (!rider) {
    throw new AppError('Rider profile not found', 404);
  }

  const payload = req.validatedBody || req.body;
  const updatedRider = await uploadRiderDocument({
    rider,
    documentType: payload.document_type,
    url: payload.url,
    publicId: payload.public_id,
  });

  return successResponse(res, 'Document uploaded successfully', { rider: updatedRider.toPublicJSON() });
});

const verifyDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { document_type } = req.body;

  const rider = await getRiderById(id);

  if (!rider) {
    throw new AppError('Rider not found', 404);
  }

  const verified = req.body.verified === true || req.body.verified === 'true';
  const updatedRider = await verifyRiderDocument({
    rider,
    documentType: document_type,
    verified,
  });

  return successResponse(res, 'Document verified successfully', { rider: updatedRider.toPublicJSON() });
});

const registerBond = asyncHandler(async (req, res) => {
  const rider = await getRiderByUserId(req.user.id);

  if (!rider) {
    throw new AppError('Rider profile not found', 404);
  }

  const payload = req.validatedBody || req.body;
  const updatedRider = await registerBondPayment({
    rider,
    amount: payload.bond_amount,
    actor: getRiderActorContext(req),
  });

  return successResponse(res, 'Bond registered successfully', { rider: updatedRider.toPublicJSON() });
});

const updatePerformance = asyncHandler(async (req, res) => {
  const rider = await getRiderById(req.params.id);

  if (!rider) {
    throw new AppError('Rider not found', 404);
  }

  const updatedRider = await updateRiderPerformance({ rider });

  return successResponse(res, 'Performance updated successfully', { rider: updatedRider.toPublicJSON() });
});

const issueFine = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = req.validatedBody || req.body;

  const rider = await getRiderById(id);

  if (!rider) {
    throw new AppError('Rider not found', 404);
  }

  const updatedRider = await addFine({
    rider,
    amount: payload.amount,
    reason: payload.reason,
    actor: getRiderActorContext(req),
  });

  return successResponse(res, 'Fine issued successfully', { rider: updatedRider.toPublicJSON() });
});

const payFineController = asyncHandler(async (req, res) => {
  const rider = await getRiderByUserId(req.user.id);

  if (!rider) {
    throw new AppError('Rider profile not found', 404);
  }

  const { fineId } = req.params;
  const updatedRider = await payRiderFine(rider, fineId);

  return successResponse(res, 'Fine paid successfully', { rider: updatedRider.toPublicJSON() });
});

const getFines = asyncHandler(async (req, res) => {
  const rider = await getRiderByUserId(req.user.id);

  if (!rider) {
    throw new AppError('Rider profile not found', 404);
  }

  return successResponse(res, 'Fines fetched successfully', { fines: rider.fines });
});

const createIncident = asyncHandler(async (req, res) => {
  const rider = await getRiderByUserId(req.user.id);

  if (!rider) {
    throw new AppError('Rider profile not found', 404);
  }

  const payload = req.validatedBody || req.body;
  const updatedRider = await reportIncident({
    rider,
    type: payload.type,
    description: payload.description,
    location: payload.location,
  });

  return successResponse(res, 'Incident reported successfully', { rider: updatedRider.toPublicJSON() });
});

const resolveIncidentController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { incidentId } = req.params;
  const payload = req.validatedBody || req.body;

  const rider = await getRiderById(id);

  if (!rider) {
    throw new AppError('Rider not found', 404);
  }

  const updatedRider = await resolveRiderIncident({
    rider,
    incidentId,
    resolution: payload.resolution,
    actor: getRiderActorContext(req),
  });

  return successResponse(res, 'Incident resolved successfully', { rider: updatedRider.toPublicJSON() });
});

const getIncidents = asyncHandler(async (req, res) => {
  const rider = await getRiderByUserId(req.user.id);

  if (!rider) {
    throw new AppError('Rider profile not found', 404);
  }

  return successResponse(res, 'Incidents fetched successfully', { incidents: rider.incidents });
});

const getDailySummary = asyncHandler(async (req, res) => {
  const rider = await getRiderByUserId(req.user.id);

  if (!rider) {
    throw new AppError('Rider profile not found', 404);
  }

  const payload = req.validatedBody || req.body;
  const date = payload.date ? new Date(payload.date) : new Date();

  const summary = await getDailyEarnings({ rider, date });

  return successResponse(res, 'Daily summary fetched successfully', { summary });
});

const getEarnings = asyncHandler(async (req, res) => {
  const rider = await getRiderByUserId(req.user.id);

  if (!rider) {
    throw new AppError('Rider profile not found', 404);
  }

  const payload = req.validatedBody || req.body;
  const summary = await getEarningsSummary({
    rider,
    from: payload.from,
    to: payload.to,
  });

  return successResponse(res, 'Earnings fetched successfully', { summary });
});

const getRiderEarnings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rider = await getRiderById(id);

  if (!rider) {
    throw new AppError('Rider not found', 404);
  }

  const payload = req.validatedBody || req.body;
  const summary = await getEarningsSummary({
    rider,
    from: payload.from,
    to: payload.to,
  });

  return successResponse(res, 'Earnings fetched successfully', { summary });
});

module.exports = {
  registerRider,
  getMyRiderProfile,
  getRiderByIdController,
  listAllRiders,
  updateStatus,
  updateGpsLocation,
  uploadDocument,
  verifyDocument,
  registerBond,
  updatePerformance,
  issueFine,
  payFineController,
  getFines,
  createIncident,
  resolveIncidentController,
  getIncidents,
  getDailySummary,
  getEarnings,
  getRiderEarnings,
};
