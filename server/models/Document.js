const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a document name'],
    },
    type: {
      type: String,
      enum: [
        'petition',
        'evidence',
        'fir',
        'identity_proof',
        'affidavit',
        'judgment',
        'court_order',
      ],
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    signatures: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        signedAt: {
          type: Date,
          default: Date.now,
        },
        signatureDataUrl: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Document', DocumentSchema);
