const Message = require('../models/Message');
const Case = require('../models/Case');

// @desc    Get all chat messages for a case room
// @route   GET /api/chat/:caseId
// @access  Private
exports.getMessagesByCase = async (req, res) => {
  try {
    const { caseId } = req.params;

    // Check case visibility
    const singleCase = await Case.findById(caseId);
    if (!singleCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    // Role-based visibility check
    if (req.user.role === 'citizen' && singleCase.petitioner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this room' });
    }
    if (req.user.role === 'lawyer' && 
        singleCase.assignedLawyer?.toString() !== req.user.id && 
        singleCase.petitioner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }
    if (req.user.role === 'judge' && singleCase.assignedJudge?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    const messages = await Message.find({ caseId })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save messages in database (API route fallback or backup)
// @route   POST /api/chat
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { caseId, text } = req.body;

    const message = await Message.create({
      caseId,
      sender: req.user.id,
      text,
    });

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name role');

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
