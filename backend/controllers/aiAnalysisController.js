const pool = require('../config/db');

const moodScores = {
  'Very Low': 1,
  'Very low': 1,
  Bad: 2,
  Low: 2,
  Okay: 3,
  Good: 4,
  Great: 5,
};

const moodLabels = [
  { label: 'Very Low', score: 1 },
  { label: 'Bad', score: 2 },
  { label: 'Okay', score: 3 },
  { label: 'Good', score: 4 },
  { label: 'Great', score: 5 },
];

const sleepGroups = ['Less than 5', '5-6', '7-8', '9+'];

const getRangeStartDate = (range) => {
  if (range === 'all') return null;

  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (range === '7d' ? 6 : 29));
  return date;
};

const averageDecimal = (values) => {
  if (!values.length) return null;

  const value = values.reduce((sum, item) => sum + Number(item), 0) / values.length;
  return Math.round(value * 10) / 10;
};

const getAverageMood = (reflections) => {
  const scores = reflections
    .map((reflection) => moodScores[reflection.mood])
    .filter((score) => typeof score === 'number');

  if (!scores.length) return null;

  const averageScore = Math.round(
    scores.reduce((sum, score) => sum + score, 0) / scores.length
  );

  return moodLabels.find((mood) => mood.score === averageScore)?.label || 'Okay';
};

const countItems = (items) => {
  const counts = new Map();

  items.flat().forEach((item) => {
    if (!item) return;
    counts.set(item, (counts.get(item) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((first, second) => second.value - first.value);
};

const getStressSources = (reflection) => {
  if (Array.isArray(reflection.stress_sources) && reflection.stress_sources.length) {
    return reflection.stress_sources;
  }

  return reflection.stress_source ? [reflection.stress_source] : [];
};

const buildSleepVsStress = (reflections) =>
  sleepGroups.map((label) => {
    const entries = reflections.filter((reflection) => reflection.sleep_quality === label);

    return {
      label,
      count: entries.length,
      averageStress: averageDecimal(
        entries.map((reflection) => reflection.stress_level)
      ),
    };
  });

const buildExerciseImpact = (reflections) => {
  const exerciseEntries = reflections.filter(
    (reflection) => reflection.exercised === true
  );
  const nonExerciseEntries = reflections.filter(
    (reflection) => reflection.exercised === false
  );

  return {
    exerciseRate:
      reflections.length === 0
        ? null
        : Math.round((exerciseEntries.length / reflections.length) * 100),
    exerciseDays: exerciseEntries.length,
    averageStressOnExerciseDays: averageDecimal(
      exerciseEntries.map((reflection) => reflection.stress_level)
    ),
    averageStressOnNonExerciseDays: averageDecimal(
      nonExerciseEntries.map((reflection) => reflection.stress_level)
    ),
  };
};

const buildMoodDistribution = (reflections) => {
  const total = reflections.filter((reflection) => reflection.mood).length;

  return moodLabels.map((mood) => {
    const count = reflections.filter((reflection) => {
      if (mood.label === 'Very Low') {
        return reflection.mood === 'Very Low' || reflection.mood === 'Very low';
      }

      if (mood.label === 'Bad') {
        return reflection.mood === 'Bad' || reflection.mood === 'Low';
      }

      return reflection.mood === mood.label;
    }).length;

    return {
      label: mood.label,
      count,
      percent: total === 0 ? 0 : Math.round((count / total) * 100),
    };
  });
};

const buildAnalysisInput = (reflections, range, breathingSessions) => {
  const anxietyDays = reflections.filter((reflection) => reflection.anxious).length;

  return {
    timeRange: range,
    overview: {
      totalReflections: reflections.length,
      averageStress: averageDecimal(
        reflections.map((reflection) => reflection.stress_level)
      ),
      averageMood: getAverageMood(reflections),
      anxietyRate:
        reflections.length === 0
          ? null
          : Math.round((anxietyDays / reflections.length) * 100),
    },
    moodDistribution: buildMoodDistribution(reflections),
    stressSources: countItems(reflections.map(getStressSources)),
    calmingMethods: countItems(
      reflections.map((reflection) => reflection.calming_tools || [])
    ),
    sleepVsStress: buildSleepVsStress(reflections),
    exerciseImpact: buildExerciseImpact(reflections),
    breathingSessions: {
      completedInApp: breathingSessions.length,
      latestSessions: breathingSessions.slice(0, 5).map((session) => ({
        duration: session.duration,
        cycles: session.cycles,
        createdAt: session.created_at,
      })),
    },
    journalNotes: reflections
      .filter((reflection) => reflection.notes && reflection.notes.trim())
      .slice(0, 20)
      .map((reflection) => ({
        date: reflection.reflection_date,
        stressLevel: reflection.stress_level,
        mood: reflection.mood,
        note: reflection.notes,
        calmingTools: reflection.calming_tools || [],
        stressSources: getStressSources(reflection),
      })),
  };
};

const extractGeminiText = (data) =>
  data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();

const parseJsonText = (text) => {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  return JSON.parse(cleaned);
};

const generateAiAnalysis = async (req, res) => {
  const { userId } = req.params;
  const range = ['7d', '30d', 'all'].includes(req.query.range)
    ? req.query.range
    : '7d';

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      message: 'GEMINI_API_KEY is missing in the backend environment',
    });
  }

  try {
    const rangeStart = getRangeStartDate(range);
    const reflectionParams = [userId];
    let reflectionQuery = 'SELECT * FROM reflections WHERE user_id = $1';

    if (rangeStart) {
      reflectionParams.push(rangeStart);
      reflectionQuery += ' AND reflection_date >= $2';
    }

    reflectionQuery += ' ORDER BY reflection_date DESC';

    const reflectionResult = await pool.query(reflectionQuery, reflectionParams);
    const reflections = reflectionResult.rows;

    if (!reflections.length) {
      return res.status(400).json({
        message: 'Save reflections first to generate your AI analysis.',
      });
    }

    const breathingParams = [userId];
    let breathingQuery = 'SELECT * FROM breathing_sessions WHERE user_id = $1';

    if (rangeStart) {
      breathingParams.push(rangeStart);
      breathingQuery += ' AND created_at >= $2';
    }

    breathingQuery += ' ORDER BY created_at DESC';

    const breathingResult = await pool.query(breathingQuery, breathingParams);
    const analysisInput = buildAnalysisInput(
      reflections,
      range,
      breathingResult.rows
    );

    const prompt = `
You are a wellness assistant analyzing a user's reflection data.

Important rules:
- Do not diagnose.
- Do not give medical advice.
- Do not say the user has anxiety, depression, or any disorder.
- Use careful language like "it seems", "you tend to", "your entries suggest".
- Base your answer only on the data provided.
- Keep the tone calm, supportive, and simple.
- Do not repeat obvious chart numbers unless they help explain a pattern.
- Keep the language practical and app-friendly, not clinical.
- Avoid phrases like "support system", "stable baseline", and "manage stress effectively".
- Keep the summary under 60 words.
- Keep each pattern insight to one short sentence.
- Keep each strategy insight to one short sentence.
- Use the summary title "Reflection Overview".
- Use the gentleSuggestion title "Lifestyle Insights".

Return only valid JSON in this exact shape:
{
  "summary": { "title": "string", "text": "string" },
  "patterns": [
    { "title": "string", "insight": "string", "confidence": "low|medium|high" }
  ],
  "helpfulStrategies": [
    { "name": "string", "insight": "string", "confidence": "low|medium|high" }
  ],
  "gentleSuggestion": { "title": "string", "text": "string" },
  "encouragingMessage": "string"
}

Use up to 3 patterns and up to 3 helpful strategies.

User data:
${JSON.stringify(analysisInput, null, 2)}
`;

    const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    const geminiData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return res.status(502).json({
        message:
          geminiData?.error?.message ||
          'Gemini AI analysis failed. Please try again.',
      });
    }

    const text = extractGeminiText(geminiData);

    if (!text) {
      return res.status(502).json({
        message: 'Gemini returned an empty analysis.',
      });
    }

    return res.json({ analysis: parseJsonText(text) });
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return res.status(500).json({
      message: 'Failed to generate Gemini AI analysis.',
    });
  }
};

module.exports = {
  generateAiAnalysis,
};
