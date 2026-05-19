// Socket.IO Configuration
// Full implementation in Phase 4 — stub here for Phase 0 scaffolding
let io = null;

function initializeSocket(server) {
  if (io) return io;

  const { Server } = require('socket.io');

  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected:', socket.id);
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
}

module.exports = { initializeSocket, getIO };
