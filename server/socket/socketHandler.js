import { Server } from 'socket.io';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // We can restrict this if needed, but '*' is useful for local and remote dev
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Join room based on user ID
    socket.on('join_room', (userId) => {
      if (userId) {
        socket.join(userId.toString());
        console.log(`👤 User ${userId} joined room`);
      }
    });

    // Join admin group
    socket.on('join_admin', () => {
      socket.join('admins');
      console.log(`🔑 Admin joined room 'admins'`);
    });

    // Join officer group
    socket.on('join_officer', () => {
      socket.join('officers');
      console.log(`👮 Officer joined room 'officers'`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};
