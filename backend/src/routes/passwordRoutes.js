const express = require('express');
const router = express.Router();
const { requestPasswordReset } = require('../controllers/passwordController');

router.post('/forgot-password', requestPasswordReset);

module.exports = router;