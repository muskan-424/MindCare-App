const express = require('express');
const router = express.Router();

router.use('/home', require('./routes/home'));
router.use('/content', require('./routes/content'));
router.use('/quotes', require('./routes/quotes'));
router.use('/resources', require('./routes/resources'));

module.exports = router;
