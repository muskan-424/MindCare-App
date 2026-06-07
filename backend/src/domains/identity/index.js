const express = require('express');
const router = express.Router();

router.use('/auth', require('./routes/auth'));
router.use('/user', require('./routes/user'));
router.use('/profile', require('./routes/profile'));
router.use('/institutions', require('./routes/institutions'));

module.exports = router;
