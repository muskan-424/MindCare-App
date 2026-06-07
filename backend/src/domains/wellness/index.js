const express = require('express');
const router = express.Router();

router.use('/goals', require('./routes/goals'));
router.use('/mood', require('./routes/mood'));
router.use('/journals', require('./routes/journals'));
router.use('/fitness', require('./routes/fitness'));
router.use('/wellness', require('./routes/wellness'));

module.exports = router;
