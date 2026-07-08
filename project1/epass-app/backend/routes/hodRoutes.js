const express = require('express');
const router = express.Router();

const {
  getRequests,
  getRequestById,
  getMembers,
  getPendingFaculty,
  approveFaculty,
  rejectFaculty,
  getPendingGuards,
  approveGuard,
  rejectGuard,
  approveRequest,
  rejectRequest,
  getStats,
  getReports,
} = require('../controllers/hodController');
const { getDepartmentLeaves, approveLeave, rejectLeave, getDashboardStats } = require('../controllers/hodAuthController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');

router.use(protect, allowRoles('HOD', 'ADMIN'));

// ---- HOD Leave Management (from hodController) ----
router.get('/members', getMembers);
router.get('/faculty/pending', getPendingFaculty);
router.put('/faculty/:id/approve', approveFaculty);
router.put('/faculty/:id/reject', rejectFaculty);
router.get('/guards/pending', getPendingGuards);
router.put('/guards/:id/approve', approveGuard);
router.put('/guards/:id/reject', rejectGuard);
router.get('/requests', getRequests);
router.get('/requests/:id', getRequestById);
router.put('/requests/:id/approve', approveRequest);
router.put('/requests/:id/reject', rejectRequest);
router.get('/stats', getStats);
router.get('/reports', getReports);

// ---- HOD Department Leave Actions (from hodAuthController) ----
router.get('/department/leaves', getDepartmentLeaves);
router.put('/department/leaves/:id/approve', approveLeave);
router.put('/department/leaves/:id/reject', rejectLeave);
router.get('/dashboard', getDashboardStats);

module.exports = router;
