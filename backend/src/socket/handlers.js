const User = require('../models/User');
const Request = require('../models/Request');

const onlineUsers = new Map(); // userId -> socketId

module.exports = (io) => {
  io.on('connection', (socket) => {
    // Register user on connect
    socket.on('user:register', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
    });

    // Mechanic updates location
    socket.on('mechanic:location', async ({ userId, coordinates }) => {
      try {
        await User.findByIdAndUpdate(userId, {
          location: { type: 'Point', coordinates },
        });
        // Broadcast to any active job room
        socket.rooms.forEach((room) => {
          if (room !== socket.id) {
            io.to(room).emit('mechanic:location:update', { coordinates });
          }
        });
      } catch (_) {}
    });

    // Mechanic toggles online
    socket.on('mechanic:toggle', async ({ userId, isOnline, coordinates }) => {
      try {
        const update = { isOnline };
        if (coordinates) update.location = { type: 'Point', coordinates };
        await User.findByIdAndUpdate(userId, update);
      } catch (_) {}
    });

    // Car owner sends a new service request
    socket.on('request:new', async ({ requestId, ownerLocation }) => {
      try {
        const radiusKm = 5;
        const nearbyMechanics = await User.find({
          role: 'MECHANIC',
          isOnline: true,
          location: {
            $geoWithin: {
              $centerSphere: [ownerLocation, radiusKm / 6378.1],
            },
          },
        });

        const request = await Request.findById(requestId)
          .populate('owner', 'name phone avatar');

        nearbyMechanics.forEach((mechanic) => {
          const socketId = onlineUsers.get(mechanic._id.toString());
          if (socketId) {
            io.to(socketId).emit('request:incoming', request);
          }
        });
      } catch (_) {}
    });

    // Owner joins job room (e.g. opens TrackingScreen after the fact)
    socket.on('job:join', ({ requestId }) => {
      socket.join(`job:${requestId}`);
    });

    // Mechanic accepts a job
    socket.on('request:accepted', async ({ requestId, mechanicId, ownerId }) => {
      // Put both in a private room
      const room = `job:${requestId}`;
      socket.join(room);
      const ownerSocketId = onlineUsers.get(ownerId);
      if (ownerSocketId) {
        const ownerSocket = io.sockets.sockets.get(ownerSocketId);
        if (ownerSocket) ownerSocket.join(room);
      }
      // Tell owner who accepted
      io.to(room).emit('request:mechanic_assigned', { requestId, mechanicId });
      // Tell other mechanics job is taken
      socket.broadcast.emit('request:taken', { requestId });
    });

    // Status update within a job room
    socket.on('request:status_update', ({ requestId, status }) => {
      io.to(`job:${requestId}`).emit('request:status_changed', { requestId, status });
    });

    // Cancel request
    socket.on('request:cancel', ({ requestId }) => {
      io.to(`job:${requestId}`).emit('request:cancelled', { requestId });
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        User.findByIdAndUpdate(socket.userId, { isOnline: false }).catch(() => {});
      }
    });
  });
};
