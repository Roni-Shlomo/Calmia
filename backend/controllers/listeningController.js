const pool = require('../config/db');

const saveListeningSession = async (req, res) => {
  try {
    const { userId, category, itemName, duration } = req.body;

    if (!userId || !category || !itemName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO listening_sessions (user_id, category, item_name, duration)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, category, itemName, duration || null]
    );

    res.status(201).json({
      message: 'Listening session saved successfully',
      session: result.rows[0],
    });
  } catch (error) {
    console.error('Error saving listening session:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  saveListeningSession,
};