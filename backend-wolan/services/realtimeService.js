const { getIO } = require('../config/socket');

const emitToHub = (hubId, eventName, payload) => {
  const io = getIO();

  if (!io || !hubId) {
    return false;
  }

  io.to(`hub:${hubId}`).emit(eventName, payload);
  return true;
};

const emitToUser = (userId, eventName, payload) => {
  const io = getIO();

  if (!io || !userId) {
    return false;
  }

  io.to(`user:${userId}`).emit(eventName, payload);
  return true;
};

const emitGlobal = (eventName, payload) => {
  const io = getIO();

  if (!io) {
    return false;
  }

  io.emit(eventName, payload);
  return true;
};

module.exports = {
  emitToHub,
  emitToUser,
  emitGlobal,
};