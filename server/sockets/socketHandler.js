const Message = require('../models/Message');

let ioInstance = null;

// Map user ID to socket IDs for direct routing
const userSocketMap = new Map();

const initSockets = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Register user to their private room for receiving notifications
    socket.on('register_user', (userId) => {
      if (userId) {
        socket.join(userId);
        userSocketMap.set(userId, socket.id);
        console.log(`User ${userId} registered to private channel`);
      }
    });

    // Join case discussion room
    socket.on('join_case', (caseId) => {
      if (caseId) {
        socket.join(caseId);
        console.log(`Socket ${socket.id} joined case room: ${caseId}`);
      }
    });

    // Leave case room
    socket.on('leave_case', (caseId) => {
      if (caseId) {
        socket.leave(caseId);
        console.log(`Socket ${socket.id} left case room: ${caseId}`);
      }
    });

    // Relay real-time case records refresh triggers
    socket.on('update_case_data', (data) => {
      if (data && data.caseId) {
        socket.to(data.caseId).emit('case_data_updated', data);
        console.log(`Case data update emitted to room: ${data.caseId}`);
      }
    });

    // Relaying real-time message inside a case room
    socket.on('send_message', async (data) => {
      try {
        const { caseId, senderId, text } = data;
        if (!caseId || !senderId || !text) return;

        // Save in DB
        const message = await Message.create({
          caseId,
          sender: senderId,
          text,
        });

        const populatedMsg = await Message.findById(message._id)
          .populate('sender', 'name role');

        // Broadcast to case room
        io.to(caseId).emit('receive_message', populatedMsg);
      } catch (error) {
        console.error('Error handling socket message:', error);
      }
    });

    // --- WebRTC Video Hearing Signaling ---
    socket.on('join_hearing', ({ hearingId, userId, userName, userRole }) => {
      if (!hearingId) return;
      socket.join(hearingId);
      socket.hearingId = hearingId;
      socket.userId = userId;
      socket.userName = userName;
      socket.userRole = userRole;

      // Broadcast to other users in the room
      socket.to(hearingId).emit('peer_joined', {
        socketId: socket.id,
        userId,
        userName,
        userRole,
      });

      // Send the list of existing peers in the room to the new user
      const clients = io.sockets.adapter.rooms.get(hearingId);
      if (clients) {
        const peers = [];
        for (const clientSocketId of clients) {
          if (clientSocketId !== socket.id) {
            const clientSocket = io.sockets.sockets.get(clientSocketId);
            if (clientSocket) {
              peers.push({
                socketId: clientSocket.id,
                userId: clientSocket.userId,
                userName: clientSocket.userName,
                userRole: clientSocket.userRole,
              });
            }
          }
        }
        socket.emit('current_peers', peers);
      }
      console.log(`User ${userName} (${userRole}) joined hearing room: ${hearingId}`);
    });

    socket.on('webrtc_offer', ({ targetSocketId, sdp }) => {
      io.to(targetSocketId).emit('webrtc_offer', {
        senderSocketId: socket.id,
        sdp,
      });
    });

    socket.on('webrtc_answer', ({ targetSocketId, sdp }) => {
      io.to(targetSocketId).emit('webrtc_answer', {
        senderSocketId: socket.id,
        sdp,
      });
    });

    socket.on('webrtc_ice_candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('webrtc_ice_candidate', {
        senderSocketId: socket.id,
        candidate,
      });
    });

    socket.on('leave_hearing', (hearingId) => {
      if (hearingId) {
        socket.leave(hearingId);
        socket.to(hearingId).emit('peer_left', { socketId: socket.id });
        console.log(`Socket ${socket.id} left hearing room: ${hearingId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      // Clean up map
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          break;
        }
      }
      if (socket.hearingId) {
        socket.to(socket.hearingId).emit('peer_left', { socketId: socket.id });
        console.log(`Socket ${socket.id} disconnected from hearing room: ${socket.hearingId}`);
      }
    });
  });
};

// Send real-time notification to a specific user
const sendRealTimeNotification = (userId, notification) => {
  if (ioInstance && userId) {
    ioInstance.to(userId.toString()).emit('new_notification', notification);
    console.log(`Real-time notification emitted to user: ${userId}`);
  }
};

// Broadcast notification to all connected clients
const broadcastNotification = (notification) => {
  if (ioInstance) {
    ioInstance.emit('new_notification', notification);
    console.log('Real-time broadcast notification emitted');
  }
};

module.exports = {
  initSockets,
  sendRealTimeNotification,
  broadcastNotification,
};
