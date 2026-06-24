const Case = require('../models/Case');
const Hearing = require('../models/Hearing');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const aiService = require('../services/aiService');

// Helper to generate sequential case number e.g. CC-2026-10045
const generateCaseNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Case.countDocuments();
  const sequentialNum = 10000 + count + 1;
  return `CC-${year}-${sequentialNum}`;
};

// @desc    File new case
// @route   POST /api/cases
// @access  Private (Citizen, Lawyer, Admin)
exports.fileCase = async (req, res) => {
  try {
    const { title, type, description, respondentName, respondentEmail, priority, assignedLawyer } = req.body;

    const caseNumber = await generateCaseNumber();

    const newCase = await Case.create({
      caseNumber,
      title,
      type,
      description,
      petitioner: req.user.role === 'citizen' ? req.user.id : req.body.petitionerId || req.user.id,
      respondentName,
      respondentEmail,
      assignedLawyer: req.user.role === 'lawyer' ? req.user.id : assignedLawyer,
      priority: priority || 'medium',
      status: 'filed',
    });

    // Create Audit Log
    await AuditLog.create({
      userId: req.user.id,
      action: 'CASE_FILED',
      details: `Case ${caseNumber} filed successfully`,
      ipAddress: req.ip,
    });

    // Create system notification for admins
    await Notification.create({
      title: 'New Case Filed',
      message: `Case ${caseNumber}: "${title}" has been filed and requires review.`,
      type: 'case',
      link: `/cases/${newCase._id}`,
    });

    res.status(201).json({ success: true, data: newCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all cases with search and filters
// @route   GET /api/cases
// @access  Private
exports.getCases = async (req, res) => {
  try {
    const { search, type, status, priority, judgeId, lawyerId, petitionerId, dateRange } = req.query;
    
    let query = {};

    // Role-based restrictions
    if (req.user.role === 'citizen') {
      query.petitioner = req.user.id;
    } else if (req.user.role === 'lawyer') {
      // Lawyer sees cases where they are assigned, petitioner, or unassigned cases (to accept representation)
      query.$or = [
        { assignedLawyer: req.user.id },
        { petitioner: req.user.id },
        { assignedLawyer: null },
        { assignedLawyer: { $exists: false } }
      ];
    } else if (req.user.role === 'judge') {
      // Judge sees cases where they are assigned, or unassigned cases (to preside over them)
      query.$or = [
        { assignedJudge: req.user.id },
        { assignedJudge: null },
        { assignedJudge: { $exists: false } }
      ];
    }

    // Apply Search
    if (search) {
      query.$or = [
        { caseNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { respondentName: { $regex: search, $options: 'i' } },
      ];
    }

    // Apply Filters
    if (type) query.type = type;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (judgeId) query.assignedJudge = judgeId;
    if (lawyerId) query.assignedLawyer = lawyerId;
    if (petitionerId) query.petitioner = petitionerId;
    
    if (dateRange) {
      const [start, end] = dateRange.split(',');
      query.filingDate = { $gte: new Date(start), $lte: new Date(end) };
    }

    const cases = await Case.find(query)
      .populate('petitioner', 'name email')
      .populate('assignedLawyer', 'name email barNumber')
      .populate('assignedJudge', 'name email courtroom')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: cases.length, data: cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get case details by ID
// @route   GET /api/cases/:id
// @access  Private
exports.getCaseById = async (req, res) => {
  try {
    const singleCase = await Case.findById(req.params.id)
      .populate('petitioner', 'name email phoneNumber')
      .populate('assignedLawyer', 'name email barNumber phoneNumber')
      .populate('assignedJudge', 'name email courtroom');

    if (!singleCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    // Role check security
    if (req.user.role === 'citizen' && 
        singleCase.petitioner._id.toString() !== req.user.id && 
        (!singleCase.respondentEmail || singleCase.respondentEmail.toLowerCase() !== req.user.email.toLowerCase())) {
      return res.status(403).json({ success: false, message: 'Access denied to this case' });
    }
    if (req.user.role === 'lawyer' && 
        singleCase.assignedLawyer && 
        singleCase.assignedLawyer._id.toString() !== req.user.id && 
        singleCase.petitioner._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (req.user.role === 'judge' && 
        singleCase.assignedJudge && 
        singleCase.assignedJudge._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Fetch related hearings & documents
    const hearings = await Hearing.find({ caseId: singleCase._id }).sort({ hearingDate: 1 });
    const documents = await Document.find({ caseId: singleCase._id })
      .populate('uploadedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        caseDetails: singleCase,
        hearings,
        documents,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update case status
// @route   PUT /api/cases/:id/status
// @access  Private (Judge, Admin)
exports.updateCaseStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const singleCase = await Case.findById(req.params.id);

    if (!singleCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    singleCase.status = status;
    if (remarks) singleCase.remarks = remarks;
    await singleCase.save();

    // Create Audit Log
    await AuditLog.create({
      userId: req.user.id,
      action: 'CASE_STATUS_UPDATED',
      details: `Status of ${singleCase.caseNumber} changed to ${status}`,
      ipAddress: req.ip,
    });

    // Notify Petitioner
    await Notification.create({
      recipient: singleCase.petitioner,
      title: 'Case Status Updated',
      message: `Your case ${singleCase.caseNumber} status has changed to: ${status.replace('_', ' ')}.`,
      type: 'case',
      link: `/dashboard`,
    });

    res.status(200).json({ success: true, data: singleCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign judge and/or lawyer to a case
// @route   PUT /api/cases/:id/assign
// @access  Private (Admin)
exports.assignJudgeOrLawyer = async (req, res) => {
  try {
    const { judgeId, lawyerId } = req.body;
    const singleCase = await Case.findById(req.params.id);

    if (!singleCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    if (judgeId) {
      singleCase.assignedJudge = judgeId;
      singleCase.status = 'under_review'; // Progress from filed to under review when judge assigned
    }
    if (lawyerId) {
      singleCase.assignedLawyer = lawyerId;
    }

    await singleCase.save();

    // Audit Log
    await AuditLog.create({
      userId: req.user.id,
      action: 'CASE_ASSIGNMENT',
      details: `Assigned judge: ${judgeId || 'none'}, lawyer: ${lawyerId || 'none'} to ${singleCase.caseNumber}`,
      ipAddress: req.ip,
    });

    // Notify petitioner and judge
    if (judgeId) {
      await Notification.create({
        recipient: judgeId,
        title: 'New Case Assigned',
        message: `Case ${singleCase.caseNumber} has been assigned to you.`,
        type: 'case',
        link: `/cases/${singleCase._id}`,
      });
    }

    res.status(200).json({ success: true, data: singleCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Ask AI Assistant for legal assessment/FAQs
// @route   POST /api/cases/:id/ai
// @access  Private
exports.askAiAssistant = async (req, res) => {
  try {
    const { query } = req.body;
    const singleCase = await Case.findById(req.params.id);

    if (!singleCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    let reply = '';
    let relatedCases = [];
    let summary = '';

    if (query) {
      reply = await aiService.answerFAQ(query, singleCase, req.user);
    } else {
      summary = await aiService.generateCaseSummary(singleCase);
      relatedCases = await aiService.getRelatedCases(singleCase.type, singleCase.title, singleCase.description);
    }

    res.status(200).json({
      success: true,
      data: {
        summary,
        relatedCases,
        reply,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Lawyer accepts to represent a case
// @route   PUT /api/cases/:id/accept-lawyer
// @access  Private (Lawyer)
exports.acceptLawyer = async (req, res) => {
  try {
    const singleCase = await Case.findById(req.params.id);
    if (!singleCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    if (singleCase.assignedLawyer) {
      return res.status(400).json({ success: false, message: 'Case already has an assigned lawyer' });
    }

    singleCase.assignedLawyer = req.user.id;
    await singleCase.save();

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'LAWYER_CASE_ACCEPTED',
      details: `Lawyer ${req.user.name} accepted to represent case ${singleCase.caseNumber}`,
      ipAddress: req.ip,
    });

    // Notify Petitioner
    await Notification.create({
      recipient: singleCase.petitioner,
      title: 'Advocate Assigned',
      message: `${req.user.name} has accepted to represent your case ${singleCase.caseNumber}.`,
      type: 'case',
      link: `/cases/${singleCase._id}`,
    });

    res.status(200).json({ success: true, data: singleCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Lawyer files the case to the judge for review
// @route   PUT /api/cases/:id/file-to-judge
// @access  Private (Lawyer)
exports.fileCaseToJudge = async (req, res) => {
  try {
    const singleCase = await Case.findById(req.params.id);
    if (!singleCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    
    // Check if the logged-in user is the assigned lawyer
    if (!singleCase.assignedLawyer || singleCase.assignedLawyer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the assigned lawyer can file this case to the judge' });
    }

    if (singleCase.status !== 'filed') {
      return res.status(400).json({ success: false, message: `Case cannot be filed to judge in status: ${singleCase.status}` });
    }

    singleCase.status = 'under_review';
    await singleCase.save();

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'CASE_FILED_TO_JUDGE',
      details: `Lawyer ${req.user.name} filed case ${singleCase.caseNumber} to court/judge`,
      ipAddress: req.ip,
    });

    // Notify Petitioner
    await Notification.create({
      recipient: singleCase.petitioner,
      title: 'Case Submitted to Court',
      message: `Your advocate ${req.user.name} has submitted your case ${singleCase.caseNumber} to the judge for review.`,
      type: 'case',
      link: `/cases/${singleCase._id}`,
    });

    res.status(200).json({ success: true, data: singleCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Judge accepts to preside over a case
// @route   PUT /api/cases/:id/accept-judge
// @access  Private (Judge)
exports.acceptJudge = async (req, res) => {
  try {
    const singleCase = await Case.findById(req.params.id);
    if (!singleCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    if (singleCase.assignedJudge) {
      return res.status(400).json({ success: false, message: 'Case already has an assigned judge' });
    }

    singleCase.assignedJudge = req.user.id;
    if (singleCase.status === 'filed') {
      singleCase.status = 'under_review';
    }
    await singleCase.save();

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'JUDGE_CASE_ACCEPTED',
      details: `Judge ${req.user.name} accepted to preside over case ${singleCase.caseNumber}`,
      ipAddress: req.ip,
    });

    // Notify Petitioner
    await Notification.create({
      recipient: singleCase.petitioner,
      title: 'Judge Assigned',
      message: `${req.user.name} has accepted to preside over your case ${singleCase.caseNumber}.`,
      type: 'case',
      link: `/cases/${singleCase._id}`,
    });

    res.status(200).json({ success: true, data: singleCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
