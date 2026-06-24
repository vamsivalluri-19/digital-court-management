const mongoose = require('mongoose');

const HearingSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
    },
    hearingDate: {
      type: Date,
      required: [true, 'Please add a hearing date'],
    },
    hearingTime: {
      type: String,
      required: [true, 'Please add a hearing time'],
    },
    courtroom: {
      type: String,
      required: [true, 'Please assign a courtroom'],
    },
    judge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    purpose: {
      type: String,
      required: [true, 'Please add a purpose for the hearing'],
    },
    status: {
      type: String,
      enum: ['upcoming', 'completed', 'cancelled', 'postponed'],
      default: 'upcoming',
    },
    remarks: {
      type: String,
    },
    citizenAccepted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Hearing', HearingSchema);
