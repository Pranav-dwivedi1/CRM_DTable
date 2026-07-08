const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

let io;

/**
 * Initialise Socket.io on the HTTP server.
 * Clients must send a valid JWT access token in the auth handshake:
 *   socket = io(url, { auth: { token } })
 *
 * After verification the socket is joined into a company-scoped room:
 *   company:<companyId>
 * This keeps all real-time events tenant-isolated.
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  // Authenticate every connecting socket via the access JWT
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication token missing'));

    try {
      // Decode the JWT using the same secret as the REST auth middleware
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      // Look up the full user document so we have companyId, name, role etc.
      const user = await User.findById(decoded.id).setOptions({ bypassTenant: true }).lean();
      if (!user) return next(new Error('User not found'));
      if (user.status === 'inactive') return next(new Error('Account is inactive'));

      // Attach the user to the socket for later use
      socket.user = {
        _id: user._id.toString(),
        name: user.name,
        role: user.role,
        companyId: user.companyId?.toString()
      };

      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { companyId, _id } = socket.user;
    if (companyId) {
      // Join the company-scoped room so events stay tenant-isolated
      socket.join(`company:${companyId}`);
    }
    if (_id) {
      // Join the user-scoped room for direct notifications
      socket.join(`user:${_id}`);
    }

    socket.on('disconnect', () => {
      // No-op: Socket.io auto-cleans rooms on disconnect
    });
  });

  console.log('Socket.io initialised');
  return io;
};

/**
 * Get the io instance for use in controllers.
 * Throws if called before initSocket().
 */
const getIO = () => {
  if (!io) throw new Error('Socket.io not initialised — call initSocket(server) first');
  return io;
};

module.exports = { initSocket, getIO };
