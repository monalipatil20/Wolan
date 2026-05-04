const { getIO } = require('../../config/socket');
const User = require('../../models/User');
const Order = require('../../models/Order');

/**
 * Rider location tracking data (in-memory for fast access)
 * In production, use Redis for scaling
 */
const riderLocations = new Map();

/**
 * Track rider online/offline status
 */
const riderStatus = new Map();

/**
 * Handle rider location update
 */
const handleRiderLocationUpdate = async (socket, data) => {
  if (!socket.user?.id || socket.user.role !== 'rider') {
    return;
  }

  const { latitude, longitude, accuracy, timestamp } = data;

  const locationData = {
    rider_id: socket.user.id,
    hub_id: socket.user.hub_id,
    latitude,
    longitude,
    accuracy,
    timestamp: timestamp || new Date(),
  };

  // Store in memory
  riderLocations.set(socket.user.id, {
    ...locationData,
    socket_id: socket.id,
    updated_at: new Date(),
  });

  // Emit to relevant rooms
  const io = getIO();
  if (io) {
    // To hub and admin
    if (socket.user.hub_id) {
      io.to(`hub:${socket.user.hub_id}`).emit('rider-location-update', locationData);
    }
    io.to('admin').emit('rider-location-update', locationData);
  }

  // Acknowledge
  socket.emit('location-update-acknowledged', {
    success: true,
    timestamp: locationData.timestamp,
  });
};

/**
 * Handle rider online event
 */
const handleRiderOnline = async (socket) => {
  if (!socket.user?.id || socket.user.role !== 'rider') {
    return;
  }

  const riderId = socket.user.id;
  const hubId = socket.user.hub_id;

  // Update status
  riderStatus.set(riderId, {
    status: 'online',
    hub_id: hubId,
    last_seen: new Date(),
  });

  // Join relevant rooms
  socket.join(`rider:${riderId}`);
  if (hubId) {
    socket.join(`hub:${hubId}`);
  }
  socket.join('admin');

  // Emit events
  const io = getIO();
  if (io) {
    io.to('admin').emit('rider-online', {
      rider_id: riderId,
      hub_id: hubId,
      timestamp: new Date(),
    });

    // Update hub dashboard
    if (hubId) {
      io.to(`hub:${hubId}`).emit('rider-online', {
        rider_id: riderId,
        hub_id: hubId,
        timestamp: new Date(),
      });
    }
  }
};

/**
 * Handle rider offline event
 */
const handleRiderOffline = async (socket) => {
  if (!socket.user?.id || socket.user.role !== 'rider') {
    return;
  }

  const riderId = socket.user.id;
  const hubId = socket.user.hub_id;

  // Update status
  riderStatus.set(riderId, {
    status: 'offline',
    hub_id: hubId,
    last_seen: new Date(),
  });

  // Remove from locations
  riderLocations.delete(riderId);

  // Emit events
  const io = getIO();
  if (io) {
    io.to('admin').emit('rider-offline', {
      rider_id: riderId,
      hub_id: hubId,
      timestamp: new Date(),
    });

    // Alert for hub if rider was on active delivery
    if (hubId) {
      io.to(`hub:${hubId}`).emit('rider-gone-offline', {
        rider_id: riderId,
        hub_id: hubId,
        message: 'Rider went offline during active delivery',
        timestamp: new Date(),
      });
    }
  }
};

/**
 * Get rider's current location
 */
const getRiderLocation = (riderId) => {
  return riderLocations.get(riderId) || null;
};

/**
 * Get all active riders at a hub
 */
const getHubActiveRiders = (hubId) => {
  const activeRiders = [];
  for (const [riderId, data] of riderLocations) {
    if (data.hub_id === hubId) {
      activeRiders.push({
        rider_id: riderId,
        ...data,
      });
    }
  }
  return activeRiders;
};

/**
 * Get all rider statuses
 */
const getAllRiderStatuses = () => {
  return Object.fromEntries(riderStatus);
};

/**
 * Cleanup rider data on disconnect
 */
const cleanupRiderData = (socket) => {
  if (socket.user?.role === 'rider') {
    const riderId = socket.user.id;

    // Only mark offline if no other socket is connected for this rider
    // In production, use Redis to track connections
    const hasOtherConnections = false; // Simplified for single-instance

    if (!hasOtherConnections) {
      handleRiderOffline(socket);
    }
  }
};

module.exports = {
  handleRiderLocationUpdate,
  handleRiderOnline,
  handleRiderOffline,
  getRiderLocation,
  getHubActiveRiders,
  getAllRiderStatuses,
  cleanupRiderData,
  riderLocations,
  riderStatus,
};
