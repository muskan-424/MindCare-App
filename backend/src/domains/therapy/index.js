const express = require('express');
const router = express.Router();

router.use('/therapists', require('./routes/therapists'));
router.use('/appointments', require('./routes/appointments'));

module.exports = router;
