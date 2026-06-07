const express = require('express');
const router = express.Router();

router.use('/aiIntake', require('./routes/aiIntake'));

module.exports = router;
