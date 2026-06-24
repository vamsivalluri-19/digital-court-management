const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Please add a message text'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Message', MessageSchema);
