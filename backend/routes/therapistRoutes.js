const express = require('express');
const {
  getCbtTherapists,
  getPsychologists,
} = require('../controllers/therapistController');

const router = express.Router();

router.get('/cbt', getCbtTherapists);
router.get('/psychologists', getPsychologists);

module.exports = router;