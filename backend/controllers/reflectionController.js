const pool = require('../config/db');

const ensureReflectionsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reflections (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      stress_level INTEGER NOT NULL CHECK (stress_level BETWEEN 1 AND 10),
      anxious BOOLEAN NOT NULL,
      notes TEXT,
      calming_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
      mood TEXT,
      sleep_quality TEXT,
      stress_source TEXT,
      stress_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
      completed_breathing BOOLEAN,
      exercised BOOLEAN,
      exercise_duration TEXT,
      calming_effectiveness INTEGER CHECK (calming_effectiveness BETWEEN 1 AND 5),
      post_reflection_feeling TEXT,
      reflection_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, reflection_date)
    )
  `);

  await pool.query(`
    ALTER TABLE reflections
    ADD COLUMN IF NOT EXISTS calming_tools JSONB NOT NULL DEFAULT '[]'::jsonb
  `);

  await pool.query(`
    ALTER TABLE reflections
    ADD COLUMN IF NOT EXISTS mood TEXT,
    ADD COLUMN IF NOT EXISTS sleep_quality TEXT,
    ADD COLUMN IF NOT EXISTS stress_source TEXT,
    ADD COLUMN IF NOT EXISTS stress_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS completed_breathing BOOLEAN,
    ADD COLUMN IF NOT EXISTS exercised BOOLEAN,
    ADD COLUMN IF NOT EXISTS exercise_duration TEXT,
    ADD COLUMN IF NOT EXISTS calming_effectiveness INTEGER CHECK (calming_effectiveness BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS post_reflection_feeling TEXT
  `);
};

const saveReflection = async (req, res) => {
  try {
    await ensureReflectionsTable();

    const {
      userId,
      stressLevel,
      anxious,
      notes,
      calmingTools,
      mood,
      sleepQuality,
      stressSource,
      stressSources,
      completedBreathing,
      exercised,
      exerciseDuration,
      calmingEffectiveness,
      postReflectionFeeling,
      reflectionDate,
    } = req.body;

    if (!userId || !stressLevel || typeof anxious !== 'boolean') {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO reflections
        (
          user_id,
          stress_level,
          anxious,
          notes,
          calming_tools,
          mood,
          sleep_quality,
          stress_source,
          stress_sources,
          completed_breathing,
          exercised,
          exercise_duration,
          calming_effectiveness,
          post_reflection_feeling,
          reflection_date
        )
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9::jsonb, $10, $11, $12, $13, $14, COALESCE($15::date, CURRENT_DATE))
       ON CONFLICT (user_id, reflection_date)
       DO UPDATE SET
        stress_level = EXCLUDED.stress_level,
        anxious = EXCLUDED.anxious,
        notes = EXCLUDED.notes,
        calming_tools = EXCLUDED.calming_tools,
        mood = EXCLUDED.mood,
        sleep_quality = EXCLUDED.sleep_quality,
        stress_source = EXCLUDED.stress_source,
        stress_sources = EXCLUDED.stress_sources,
        completed_breathing = EXCLUDED.completed_breathing,
        exercised = EXCLUDED.exercised,
        exercise_duration = EXCLUDED.exercise_duration,
        calming_effectiveness = EXCLUDED.calming_effectiveness,
        post_reflection_feeling = EXCLUDED.post_reflection_feeling,
        updated_at = NOW()
       RETURNING *`,
      [
        userId,
        stressLevel,
        anxious,
        notes || null,
        JSON.stringify(Array.isArray(calmingTools) ? calmingTools : []),
        mood || null,
        sleepQuality || null,
        stressSource || null,
        JSON.stringify(Array.isArray(stressSources) ? stressSources : []),
        typeof completedBreathing === 'boolean' ? completedBreathing : null,
        typeof exercised === 'boolean' ? exercised : null,
        typeof exercised === 'boolean' && exercised ? exerciseDuration || null : null,
        calmingEffectiveness || null,
        postReflectionFeeling || null,
        reflectionDate || null,
      ]
    );

    res.status(201).json({
      message: 'Reflection saved successfully',
      reflection: result.rows[0],
    });
  } catch (error) {
    console.error('Error saving reflection:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getReflectionsByUser = async (req, res) => {
  try {
    await ensureReflectionsTable();

    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User id is required' });
    }

    const result = await pool.query(
      `SELECT
        id,
        user_id,
        stress_level,
        anxious,
        notes,
        calming_tools,
        mood,
        sleep_quality,
        stress_source,
        stress_sources,
        completed_breathing,
        exercised,
        exercise_duration,
        calming_effectiveness,
        post_reflection_feeling,
        reflection_date,
        created_at,
        updated_at
       FROM reflections
       WHERE user_id = $1
       ORDER BY reflection_date DESC, created_at DESC`,
      [userId]
    );

    res.status(200).json({ reflections: result.rows });
  } catch (error) {
    console.error('Error fetching reflections:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTodayReflection = async (req, res) => {
  try {
    await ensureReflectionsTable();

    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User id is required' });
    }

    const result = await pool.query(
      `SELECT
        id,
        user_id,
        stress_level,
        anxious,
        notes,
        calming_tools,
        mood,
        sleep_quality,
        stress_source,
        stress_sources,
        completed_breathing,
        exercised,
        exercise_duration,
        calming_effectiveness,
        post_reflection_feeling,
        reflection_date,
        created_at,
        updated_at
       FROM reflections
       WHERE user_id = $1
        AND reflection_date = CURRENT_DATE
       LIMIT 1`,
      [userId]
    );

    res.status(200).json({ reflection: result.rows[0] || null });
  } catch (error) {
    console.error('Error fetching today reflection:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  saveReflection,
  getReflectionsByUser,
  getTodayReflection,
};
