const express = require('express');
const {
  createHearing,
  getHearings,
  updateHearing,
  acceptHearing,
} = require('../controllers/hearingController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.post('/', authorize('judge', 'admin'), createHearing);
router.get('/', getHearings);
router.put('/:id', authorize('judge', 'admin'), updateHearing);
router.put('/:id/accept', authorize('citizen'), acceptHearing);

module.exports = router;
