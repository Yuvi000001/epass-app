const express = require('express');
const router = express.Router();

const {
  addMember,
  listStudents,
  listFaculty,
  listHod,
  listGuards,
  listDirectors,
  listAdmins,
  getMember,
  updateMember,
  toggleActive,
  deleteMember,
  listDepartments,
  getStats,
  getDepartmentWiseChart,
  getMonthlyTrendChart,
  getAuditLogs,
  getPendingHod,
  approveHod,
  rejectHod,
  getPendingFaculty,
  approveFaculty,
  rejectFaculty,
  getPendingGuards,
  approveGuard,
  rejectGuard,
  getPendingDirectors,
  approveDirector,
  rejectDirector,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');

// Directors should be able to access the same dashboard APIs as admins.
router.use(protect, allowRoles('ADMIN', 'DIRECTOR'));

router.post('/members', addMember);
router.get('/members/:id', getMember);
router.put('/members/:id', updateMember);
router.put('/members/:id/toggle-active', toggleActive);
router.delete('/members/:id', deleteMember);

router.get('/students', listStudents);
router.get('/faculty', listFaculty);
router.get('/hod', listHod);
router.get('/guards', listGuards);
router.get('/directors', listDirectors);
router.get('/admins', listAdmins);

router.get('/hod/pending', getPendingHod);
router.put('/hod/:id/approve', approveHod);
router.put('/hod/:id/reject', rejectHod);

router.get('/faculty/pending', getPendingFaculty);
router.put('/faculty/:id/approve', approveFaculty);
router.put('/faculty/:id/reject', rejectFaculty);

router.get('/guards/pending', getPendingGuards);
router.put('/guards/:id/approve', approveGuard);
router.put('/guards/:id/reject', rejectGuard);

router.get('/directors/pending', getPendingDirectors);
router.put('/directors/:id/approve', approveDirector);
router.put('/directors/:id/reject', rejectDirector);

router.get('/departments', listDepartments);
router.get('/stats', getStats);
router.get('/charts/department-wise', getDepartmentWiseChart);
router.get('/charts/monthly-trend', getMonthlyTrendChart);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
