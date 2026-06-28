const pool = require('../config/db');

const completeBreathing = async (req, res) => {
  try {
    const { userId, duration, cycles } = req.body;

    if (!userId || !duration || !cycles) {
      return res.status(400).json({
        message: 'Missing required fields',
      });
    }

    await pool.query(
      `INSERT INTO breathing_sessions
      (user_id, duration, cycles)
      VALUES ($1,$2,$3)`,
      [userId, duration, cycles]
    );

    res.status(201).json({
      message: 'Breathing session saved successfully',
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Server error',
    });
  }
};

module.exports = {
  completeBreathing,
};