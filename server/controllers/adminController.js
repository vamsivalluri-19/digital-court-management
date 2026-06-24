const User = require('../models/User');
const Case = require('../models/Case');
const Hearing = require('../models/Hearing');
const AuditLog = require('../models/AuditLog');
const Report = require('../models/Report');

// @desc    Get system-wide metrics and dashboard cards
// @route   GET /api/admin/metrics
// @access  Private (Admin)
exports.getMetrics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalLawyers = await User.countDocuments({ role: 'lawyer' });
    const totalJudges = await User.countDocuments({ role: 'judge' });
    const totalCases = await Case.countDocuments();
    const pendingCases = await Case.countDocuments({ status: { $ne: 'closed' } });
    const closedCases = await Case.countDocuments({ status: 'closed' });

    // Hearings scheduled today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const todaysHearingsCount = await Hearing.countDocuments({
      hearingDate: { $gte: startOfToday, $lte: endOfToday },
    });

    // Case type distribution aggregation
    const caseTypesAggregation = await Case.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    // Case status distribution aggregation
    const caseStatusAggregation = await Case.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Monthly filing trend (last 6 months)
    const monthlyAggregation = await Case.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$filingDate' },
            month: { $month: '$filingDate' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        cards: {
          totalUsers,
          totalLawyers,
          totalJudges,
          totalCases,
          pendingCases,
          closedCases,
          todaysHearingsCount,
        },
        distributions: {
          types: caseTypesAggregation,
          statuses: caseStatusAggregation,
          monthlyTrend: monthlyAggregation,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (with search and role filter)
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
  try {
    const { search, role, isVerified } = req.query;
    let query = {};

    if (role) query.role = role;
    if (isVerified) query.isVerified = isVerified === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify or approve a user (Judge/Lawyer)
// @route   PUT /api/admin/users/:id/approve
// @access  Private (Admin)
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      action: 'USER_APPROVED',
      details: `Approved user credentials and verified email for: ${user.email} (${user.role})`,
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all system audit logs
// @route   GET /api/admin/auditlogs
// @access  Private (Admin)
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200);

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate a report
// @route   POST /api/admin/reports
// @access  Private (Admin)
exports.generateReport = async (req, res) => {
  try {
    const { title, type } = req.body;

    let reportData = {};

    if (type === 'analytics') {
      const activeCases = await Case.countDocuments({ status: { $ne: 'closed' } });
      const completedHearings = await Hearing.countDocuments({ status: 'completed' });
      const caseTypes = await Case.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
      
      reportData = { activeCases, completedHearings, caseTypes };
    } else {
      const usersList = await User.find().select('name email role isVerified');
      reportData = { usersList };
    }

    const report = await Report.create({
      title,
      type,
      data: reportData,
      generatedBy: req.user.id,
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
