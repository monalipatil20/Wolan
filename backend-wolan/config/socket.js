const { Server } = require('socket.io');

let ioInstance = null;

/**
 * Create and configure Socket.IO server with scaling in mind
 */
const createSocketServer = (server) => {
  // Get environment configurations
  const corsOrigin = process.env.SOCKET_CORS_ORIGIN 
    ? process.env.SOCKET_CORS_ORIGIN.split(',').map((origin) => origin.trim()) 
    : true;

  const pingInterval = parseInt(process.env.SOCKET_PING_INTERVAL || '25000', 10);
  const pingTimeout = parseInt(process.env.SOCKET_PING_TIMEOUT || '20000', 10);
  const maxPayload = parseInt(process.env.SOCKET_MAX_PAYLOAD || '1e6', 10);
  const maxConnections = parseInt(process.env.SOCKET_MAX_CONNECTIONS || '1000', 10);

  ioInstance = new Server(server, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
    // Scaling configurations
    pingInterval,
    pingTimeout,
    maxHttpBufferSize: maxPayload,
    // Transport configurations
    transports: ['polling', 'websocket'],
    allowEIO4: true,
    // Room configurations
    namespaceResolver: (path) => {
      // Custom namespace handling if needed
      return path;
    },
    // Adapter for scaling (Redis in production)
    // adapter: require('socket.io-redis')(),
  });

  // Set connection limit
  ioInstance.engine.maxConnections = maxConnections;

  return ioInstance;
};

/**
 * Get Socket.IO instance
 */
const getIO = () => ioInstance;

/**
 * Get connection count
 */
const getConnectionCount = () => {
  if (!ioInstance) return 0;
  return ioInstance.engine.clientsCount;
};

/**
 * Get rooms info
 */
const getRoomsInfo = () => {
  if (!ioInstance) return {};
  
  const rooms = {};
  for (const [roomName, room] of ioInstance.sockets.adapter.rooms) {
    if (roomName.startsWith('hub:') || roomName.startsWith('merchant:') || 
        roomName.startsWith('rider:') || roomName === 'admin' || 
        roomName === 'merchants' || roomName === 'riders') {
      rooms[roomName] = room.size;
    }
  }
  return rooms;
};

module.exports = {
  createSocketServer,
  getIO,
  getConnectionCount,
  getRoomsInfo,
};
