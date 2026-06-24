const express = require('express');
const { uploadDocument, signDocument } = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.post('/', upload.single('file'), uploadDocument);
router.post('/:id/sign', signDocument);

module.exports = router;
