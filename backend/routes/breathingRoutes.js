const express = require('express');
const router = express.Router();

const { completeBreathing } = require('../controllers/breathingController');

router.post('/complete', completeBreathing);

module.exports = router;