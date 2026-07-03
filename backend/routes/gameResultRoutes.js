const express = require('express');
const router = express.Router();

const {
  saveGameResult,
  getGameResultsByUser,
} = require('../controllers/gameResultController');

router.post('/', saveGameResult);
router.get('/:userId', getGameResultsByUser);

module.exports = router;
