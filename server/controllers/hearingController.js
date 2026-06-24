const Hearing = require('../models/Hearing');
const Case = require('../models/Case');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

// @desc    Create a hearing
// @route   POST /api/hearings
// @access  Private (Judge, Admin)
exports.createHearing = async (req, res) => {
  try {
    const { caseId, hearingDate, hearingTime, courtroom, purpose } = req.body;

    const singleCase = await Case.findById(caseId);
    if (!singleCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const judgeId = singleCase.assignedJudge || req.user.id;

    // Create Hearing
    const hearing = await Hearing.create({
      caseId,
      hearingDate,
      hearingTime,
      courtroom,
      judge: judgeId,
      purpose,
      status: 'upcoming',
    });

    // Update case status to hearing scheduled
    singleCase.status = 'hearing_scheduled';
    await singleCase.save();

    // Audit Log
    await AuditLog.create({
      userId: req.user.id,
      action: 'HEARING_SCHEDULED',
      details: `Scheduled hearing for case ${singleCase.caseNumber} on ${hearingDate} at ${hearingTime}`,
      ipAddress: req.ip,
    });

    // Notify Petitioner & Lawyer
    const recipients = [singleCase.petitioner];
    if (singleCase.assignedLawyer) {
      recipients.push(singleCase.assignedLawyer);
    }

    for (const recipientId of recipients) {
      await Notification.create({
        recipient: recipientId,
        title: 'New Hearing Scheduled',
        message: `A hearing has been scheduled for case ${singleCase.caseNumber} on ${new Date(hearingDate).toLocaleDateString()} in courtroom ${courtroom}.`,
        type: 'hearing',
        link: `/cases/${singleCase._id}`,
      });
    }

    res.status(201).json({ success: true, data: hearing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get hearings
// @route   GET /api/hearings
// @access  Private
exports.getHearings = async (req, res) => {
  try {
    const { caseId, judgeId, date } = req.query;
    let query = {};

    if (caseId) query.caseId = caseId;
    if (judgeId) query.judge = judgeId;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.hearingDate = { $gte: startOfDay, $lte: endOfDay };
    }

    // Role filtering
    if (req.user.role === 'judge') {
      query.judge = req.user.id;
    } else if (req.user.role === 'citizen') {
      // Find citizen cases first (where petitioner is user or respondent email matches user email)
      const citizenCases = await Case.find({
        $or: [
          { petitioner: req.user.id },
          { respondentEmail: req.user.email }
        ]
      }).select('_id');
      query.caseId = { $in: citizenCases.map(c => c._id) };
    } else if (req.user.role === 'lawyer') {
      // Find lawyer cases first
      const lawyerCases = await Case.find({
        $or: [{ assignedLawyer: req.user.id }, { petitioner: req.user.id }],
      }).select('_id');
      query.caseId = { $in: lawyerCases.map(c => c._id) };
    }

    const hearings = await Hearing.find(query)
      .populate({
        path: 'caseId',
        select: 'caseNumber title type petitioner status',
        populate: { path: 'petitioner', select: 'name' }
      })
      .populate('judge', 'name courtroom')
      .sort({ hearingDate: 1 });

    res.status(200).json({ success: true, count: hearings.length, data: hearings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update hearing details / status
// @route   PUT /api/hearings/:id
// @access  Private (Judge, Admin)
exports.updateHearing = async (req, res) => {
  try {
    const { hearingDate, hearingTime, courtroom, status, remarks } = req.body;
    const hearing = await Hearing.findById(req.params.id);

    if (!hearing) {
      return res.status(404).json({ success: false, message: 'Hearing not found' });
    }

    hearing.hearingDate = hearingDate || hearing.hearingDate;
    hearing.hearingTime = hearingTime || hearing.hearingTime;
    hearing.courtroom = courtroom || hearing.courtroom;
    hearing.status = status || hearing.status;
    if (remarks) hearing.remarks = remarks;

    await hearing.save();

    const singleCase = await Case.findById(hearing.caseId);

    // Audit Log
    await AuditLog.create({
      userId: req.user.id,
      action: 'HEARING_UPDATED',
      details: `Hearing updated for case ${singleCase ? singleCase.caseNumber : 'unknown'}: status ${status}`,
      ipAddress: req.ip,
    });

    // Notify participants
    if (singleCase) {
      const recipients = [singleCase.petitioner];
      if (singleCase.assignedLawyer) {
        recipients.push(singleCase.assignedLawyer);
      }

      for (const recipientId of recipients) {
        await Notification.create({
          recipient: recipientId,
          title: `Hearing ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `The hearing scheduled for case ${singleCase.caseNumber} has been ${status}.`,
          type: 'hearing',
          link: `/cases/${singleCase._id}`,
        });
      }
    }

    res.status(200).json({ success: true, data: hearing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Citizen confirms and accepts scheduled hearing details
// @route   PUT /api/hearings/:id/accept
// @access  Private (Citizen/Petitioner)
exports.acceptHearing = async (req, res) => {
  try {
    const hearing = await Hearing.findById(req.params.id);

    if (!hearing) {
      return res.status(404).json({ success: false, message: 'Hearing not found' });
    }

    const singleCase = await Case.findById(hearing.caseId);
    if (!singleCase) {
      return res.status(404).json({ success: false, message: 'Case not found for this hearing' });
    }

    // Check if the petitioner is the logged-in citizen user
    if (singleCase.petitioner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the petitioner citizen can accept this hearing details' });
    }

    hearing.citizenAccepted = true;
    await hearing.save();

    // Create Audit Log
    await AuditLog.create({
      userId: req.user.id,
      action: 'HEARING_DETAILS_ACCEPTED',
      details: `Citizen ${req.user.name} accepted hearing details for case ${singleCase.caseNumber}`,
      ipAddress: req.ip,
    });

    // Notify judge/lawyer if assigned
    const notifyUsers = [];
    if (singleCase.assignedJudge) notifyUsers.push(singleCase.assignedJudge);
    if (singleCase.assignedLawyer) notifyUsers.push(singleCase.assignedLawyer);

    for (const recipientId of notifyUsers) {
      await Notification.create({
        recipient: recipientId,
        title: 'Hearing Details Confirmed',
        message: `Petitioner has accepted/confirmed the hearing scheduled on ${new Date(hearing.hearingDate).toLocaleDateString()} for case ${singleCase.caseNumber}.`,
        type: 'hearing',
        link: `/cases/${singleCase._id}`,
      });
    }

    res.status(200).json({ success: true, data: hearing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
