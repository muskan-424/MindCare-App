const express = require('express');
const router = express.Router();

router.use('/admin', require('./routes/admin'));
router.use('/issues', require('./routes/issues'));
router.use('/emergencyContact', require('./routes/emergencyContact'));
router.use('/analytics', require('./routes/analytics'));

module.exports = router;
