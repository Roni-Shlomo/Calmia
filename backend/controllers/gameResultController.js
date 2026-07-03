const pool = require('../config/db');

const ensureGameResultsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      game_key TEXT NOT NULL,
      game_name TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      won BOOLEAN,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
};

const saveGameResult = async (req, res) => {
  try {
    await ensureGameResultsTable();

    const { userId, gameKey, gameName, score, won } = req.body;

    if (!userId || !gameKey || !gameName || typeof score !== 'number') {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO game_results (user_id, game_key, game_name, score, won)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, gameKey, gameName, score, typeof won === 'boolean' ? won : null]
    );

    res.status(201).json({
      message: 'Game result saved successfully',
      result: result.rows[0],
    });
  } catch (error) {
    console.error('Error saving game result:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getGameResultsByUser = async (req, res) => {
  try {
    await ensureGameResultsTable();

    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User id is required' });
    }

    const result = await pool.query(
      `SELECT id, user_id, game_key, game_name, score, won, created_at
       FROM game_results
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 8`,
      [userId]
    );

    const bestResult = await pool.query(
      `SELECT game_key, MAX(score)::int AS best_score
       FROM game_results
       WHERE user_id = $1
       GROUP BY game_key`,
      [userId]
    );

    const bestScores = bestResult.rows.reduce((scores, row) => {
      scores[row.game_key] = row.best_score;
      return scores;
    }, {});

    res.status(200).json({
      results: result.rows,
      bestScores,
    });
  } catch (error) {
    console.error('Error fetching game results:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  saveGameResult,
  getGameResultsByUser,
};
