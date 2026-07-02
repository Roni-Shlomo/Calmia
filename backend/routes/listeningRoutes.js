const express = require('express');
const router = express.Router();

const {
  saveListeningSession,
} = require('../controllers/listeningController');

router.post('/complete', saveListeningSession);

module.exports = router;