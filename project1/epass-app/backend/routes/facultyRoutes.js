const express = require('express');
const router = express.Router();

const { getRequests, getRequestById, approveRequest, rejectRequest, forwardToHod } = require('../controllers/facultyController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');

router.use(protect, allowRoles('FACULTY'));

router.get('/requests', getRequests);
router.get('/requests/:id', getRequestById);
router.put('/requests/:id/approve', approveRequest);
router.put('/requests/:id/reject', rejectRequest);
router.put('/requests/:id/forward', forwardToHod);

module.exports = router;
