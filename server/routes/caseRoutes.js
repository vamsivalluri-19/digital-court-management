const express = require('express');
const {
  fileCase,
  getCases,
  getCaseById,
  updateCaseStatus,
  assignJudgeOrLawyer,
  askAiAssistant,
  acceptLawyer,
  acceptJudge,
  fileCaseToJudge,
} = require('../controllers/caseController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.post('/', authorize('citizen', 'lawyer', 'admin'), fileCase);
router.get('/', getCases);
router.get('/:id', getCaseById);
router.put('/:id/status', authorize('judge', 'admin'), updateCaseStatus);
router.put('/:id/assign', authorize('admin'), assignJudgeOrLawyer);
router.put('/:id/accept-lawyer', authorize('lawyer'), acceptLawyer);
router.put('/:id/file-to-judge', authorize('lawyer'), fileCaseToJudge);
router.put('/:id/accept-judge', authorize('judge'), acceptJudge);
router.post('/:id/ai', askAiAssistant);

module.exports = router;
