const pool = require('../config/db');

const ensureBreathingSessionsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS breathing_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      duration INTEGER NOT NULL,
      cycles INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE breathing_sessions
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()
  `);
};

const completeBreathing = async (req, res) => {
  try {
    await ensureBreathingSessionsTable();

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

const getBreathingSummary = async (req, res) => {
  try {
    await ensureBreathingSessionsTable();

    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        message: 'Missing user id',
      });
    }

    const result = await pool.query(
      `SELECT
        COUNT(*)::int AS total_sessions,
        COUNT(DISTINCT DATE(created_at))::int AS breathing_days,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)::int AS today_sessions
      FROM breathing_sessions
      WHERE user_id = $1`,
      [userId]
    );

    const summary = result.rows[0] || {};

    res.json({
      totalSessions: summary.total_sessions || 0,
      breathingDays: summary.breathing_days || 0,
      todaySessions: summary.today_sessions || 0,
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
  getBreathingSummary,
};
