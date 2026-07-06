const express = require('express');
const {
  generateAiAnalysis,
} = require('../controllers/aiAnalysisController');

const router = express.Router();

router.get('/:userId', generateAiAnalysis);

module.exports = router;
