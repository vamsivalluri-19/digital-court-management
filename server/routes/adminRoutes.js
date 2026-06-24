const express = require('express');
const {
  getMetrics,
  getUsers,
  approveUser,
  getAuditLogs,
  generateReport,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/metrics', getMetrics);
router.get('/users', getUsers);
router.put('/users/:id/approve', approveUser);
router.get('/auditlogs', getAuditLogs);
router.post('/reports', generateReport);

module.exports = router;
