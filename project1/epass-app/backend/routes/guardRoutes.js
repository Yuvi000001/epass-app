const express = require('express');
const router = express.Router();

const { scanPass, getRecentScans } = require('../controllers/guardController');
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roleCheck');

router.use(protect, allowRoles('GUARD'));

router.post('/scan', scanPass);
router.get('/scans/recent', getRecentScans);

module.exports = router;
