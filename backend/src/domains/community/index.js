const express = require('express');
const router = express.Router();

router.use('/groups', require('./routes/groups'));
router.use('/peers', require('./routes/peers'));
router.use('/blogs', require('./routes/blogs'));
router.use('/chat', require('./routes/chat'));

module.exports = router;
