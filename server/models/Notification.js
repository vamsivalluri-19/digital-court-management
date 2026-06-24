const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // If null, it is a broadcast notification
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // If null, it is sent by system
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['case', 'hearing', 'judgment', 'message', 'system'],
      default: 'system',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Post-save hook to dispatch socket notification in real-time
NotificationSchema.post('save', function (doc) {
  try {
    const socketHandler = require('../sockets/socketHandler');
    if (doc.recipient) {
      socketHandler.sendRealTimeNotification(doc.recipient, doc);
    } else {
      socketHandler.broadcastNotification(doc);
    }
  } catch (error) {
    console.error('Error dispatching socket notification from model hook:', error);
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);

