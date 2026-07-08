const express = require('express');
const router = express.Router();

const { getEpass, downloadEpass, verifyEpass } = require('../controllers/epassController');
const { protect } = require('../middleware/auth');

router.get('/verify/:passId', verifyEpass); // public — scanned from QR, no auth required

router.use(protect);
router.get('/:leaveRequestId', getEpass);
router.get('/:leaveRequestId/download', downloadEpass);

module.exports = router;
