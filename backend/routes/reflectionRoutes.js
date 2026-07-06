const express = require('express');
const router = express.Router();

const {
  saveReflection,
  getReflectionsByUser,
  getTodayReflection,
} = require('../controllers/reflectionController');

router.post('/', saveReflection);
router.get('/:userId/today', getTodayReflection);
router.get('/:userId', getReflectionsByUser);

module.exports = router;
