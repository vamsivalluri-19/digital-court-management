const express = require('express');
const { getMessagesByCase, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/:caseId', getMessagesByCase);
router.post('/', sendMessage);

module.exports = router;
