const express = require('express');
const router = express.Router();

const { applyLeave, getMyRequests, getHistory, getLeaveById } = require('../controllers/leaveController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');
const { uploadAttachment } = require('../middleware/upload');

router.use(protect);

router.post('/apply', allowRoles('STUDENT'), uploadAttachment.single('attachment'), applyLeave);
router.get('/my-requests', allowRoles('STUDENT'), getMyRequests);
router.get('/history', allowRoles('STUDENT'), getHistory);
router.get('/:id', getLeaveById); // shared — faculty/HOD/student all need to view a single request

module.exports = router;
