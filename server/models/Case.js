const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema(
  {
    caseNumber: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a case title'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['civil', 'criminal', 'family', 'property', 'cyber_crime', 'consumer'],
      required: [true, 'Please select a case type'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description of the case'],
    },
    petitioner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    respondentName: {
      type: String,
      required: [true, 'Please add the respondent name'],
      trim: true,
    },
    respondentEmail: {
      type: String,
      required: [true, 'Please add the respondent email'],
      trim: true,
      lowercase: true,
    },
    assignedLawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedJudge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    filingDate: {
      type: Date,
      default: Date.now,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: [
        'draft',
        'filed',
        'under_review',
        'hearing_scheduled',
        'in_progress',
        'judgment_issued',
        'closed',
      ],
      default: 'filed',
    },
    remarks: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Case', CaseSchema);
