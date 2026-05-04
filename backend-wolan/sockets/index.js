const { createSocketServer } = require('../config/socket');
const { verifyAccessToken } = require('../utils/token');
const User = require('../models/User');

// Handler imports
const { 
  handleRiderLocationUpdate, 
  handleRiderOnline, 
  handleRiderOffline,
  cleanupRiderData 
} = require('./handlers/riderHandlers');

/**
 * Main socket initialization
 * Sets up all event handlers and room management
 */
const initSockets = (server) => {
  const io = createSocketServer(server);

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      // Allow unauthenticated connections for public tracking
      return next();
    }

    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('+role +hub_id +merchant_id');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = {
        id: user._id.toString(),
        role: user.role,
        hub_id: user.hub_id?.toString() || null,
        merchant_id: user.merchant_id?.toString() || null,
      };

      return next();
    } catch (error) {
      return next(new Error('Unauthorized socket connection'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}, User: ${socket.user?.id || 'anonymous'}, Role: ${socket.user?.role || 'none'}`);

    // Join user-specific room
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }

    // Join role-based rooms
    if (socket.user?.role) {
      // Riders join rider room
      if (socket.user.role === 'rider') {
        socket.join('riders');
        
        // Auto-announce online
        handleRiderOnline(socket);
      }
      
      // Merchants join merchant room
      if (socket.user.role === 'merchant') {
        socket.join('merchants');
        if (socket.user.merchant_id) {
          socket.join(`merchant:${socket.user.merchant_id}`);
        }
      }
      
      // Admins join admin room
      if (['super_admin', 'hub_manager', 'ops_coordinator'].includes(socket.user.role)) {
        socket.join('admin');
      }
    }

    // Join hub room if applicable
    if (socket.user?.hub_id) {
      socket.join(`hub:${socket.user.hub_id}`);
    }

    // ========== Rider Event Handlers ==========
    
    // Rider updates location
    socket.on('rider:update-location', (data) => {
      handleRiderLocationUpdate(socket, data);
    });

    // Rider announces online
    socket.on('rider:online', () => {
      handleRiderOnline(socket);
    });

    // Rider announces offline
    socket.on('rider:offline', () => {
      handleRiderOffline(socket);
    });

    // ========== Room Management ==========

    // Join specific hub room
    socket.on('join:hub', (hubId) => {
      if (hubId && socket.user?.hub_id === hubId) {
        socket.join(`hub:${hubId}`);
        socket.emit('joined-hub', { hub_id: hubId, success: true });
      }
    });

    // Join specific merchant room
    socket.on('join:merchant', (merchantId) => {
      if (merchantId && socket.user?.merchant_id === merchantId) {
        socket.join(`merchant:${merchantId}`);
        socket.emit('joined-merchant', { merchant_id: merchantId, success: true });
      }
    });

    // Join specific rider room
    socket.on('join:rider', (riderId) => {
      if (riderId && socket.user?.id === riderId) {
        socket.join(`rider:${riderId}`);
        socket.emit('joined-rider', { rider_id: riderId, success: true });
      }
    });

    // Subscribe to order tracking
    socket.on('subscribe:order', (orderId) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
      }
    });

    // Unsubscribe from order tracking
    socket.on('unsubscribe:order', (orderId) => {
      if (orderId) {
        socket.leave(`order:${orderId}`);
      }
    });

    // ========== Request Handlers ==========

    // Get rider locations for hub
    socket.on('request:hub-riders', (hubId, callback) => {
      if (!socket.user?.hub_id || socket.user.hub_id !== hubId) {
        if (callback) callback({ error: 'Unauthorized' });
        return;
      }
      
      // Import handlers dynamically to avoid circular dependency
      const { getHubActiveRiders } = require('./handlers/riderHandlers');
      const riders = getHubActiveRiders(hubId);
      
      if (callback) callback({ success: true, riders });
    });

    // Request dashboard data
    socket.on('request:dashboard', async (callback) => {
      if (!socket.user?.role || !['super_admin', 'hub_manager', 'ops_coordinator'].includes(socket.user.role)) {
        if (callback) callback({ error: 'Unauthorized' });
        return;
      }
      
      const { updateDashboardCounters } = require('./handlers/adminHandlers');
      const counters = await updateDashboardCounters();
      
      if (callback) callback({ success: true, counters });
    });

    // ========== Ping/Pong for Keep-alive ==========
    
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    // ========== Disconnect Handler ==========
    
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id}, Reason: ${reason}`);
      
      // Cleanup rider data
      if (socket.user?.role === 'rider') {
        cleanupRiderData(socket);
      }
    });
  });

  return io;
};

module.exports = {
  initSockets,
};
