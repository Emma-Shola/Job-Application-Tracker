let io

const setIO = (socketIO) => {
  io = socketIO
}

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized')
  }
  return io
}

const emitToUser = (userId, event, data) => {
  try {
    const socketIO = getIO()
    socketIO.to(`user-${userId}`).emit(event, data)
  } catch (error) {
    console.error('WebSocket emit error:', error.message)
  }
}

module.exports = {
  setIO,
  getIO,
  emitToUser
}