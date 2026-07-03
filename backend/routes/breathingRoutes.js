const express = require('express');
const router = express.Router();

const {
  completeBreathing,
  getBreathingSummary,
} = require('../controllers/breathingController');

router.post('/complete', completeBreathing);
router.get('/:userId/summary', getBreathingSummary);

module.exports = router;
