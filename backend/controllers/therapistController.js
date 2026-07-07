const pool = require('../config/db');

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

async function getCbtTherapists(req, res) {
  try {
    const { city, lat, lng } = req.query;

    let result;

    if (city) {
      result = await pool.query(
        `SELECT *
        FROM therapists
        WHERE LOWER(city) LIKE LOWER($1)
        ORDER BY name ASC`,
        [`%${city}%`]
      );

      return res.json(result.rows);
    }

    result = await pool.query(
      `SELECT *
       FROM therapists`,
       []
    );

    let therapists = result.rows;

    if (lat && lng) {
      therapists = therapists
        .map((therapist) => {
          const distance = calculateDistance(
            Number(lat),
            Number(lng),
            Number(therapist.latitude),
            Number(therapist.longitude)
          );

          return {
            ...therapist,
            distance: Number(distance.toFixed(2)),
          };
        })
        .sort((a, b) => a.distance - b.distance);
    }

    res.json(therapists);
  } catch (error) {
    console.error('Error fetching CBT therapists:', error);
    res.status(500).json({ message: 'Failed to fetch CBT therapists' });
  }
}

async function getPsychologists(req, res) {
  try {
    const { city, lat, lng } = req.query;

    let result;

    if (city) {
      result = await pool.query(
        `SELECT *
         FROM therapists
         WHERE type = $1
         AND LOWER(city) LIKE LOWER($2)
         ORDER BY name ASC`,
        ['psychologist', `%${city}%`]
      );

      return res.json(result.rows);
    }

    result = await pool.query(
      `SELECT *
       FROM therapists
       WHERE type = $1`,
      ['psychologist']
    );

    let psychologists = result.rows;

    if (lat && lng) {
      psychologists = psychologists
        .map((psychologist) => {
          const distance = calculateDistance(
            Number(lat),
            Number(lng),
            Number(psychologist.latitude),
            Number(psychologist.longitude)
          );

          return {
            ...psychologist,
            distance: Number(distance.toFixed(2)),
          };
        })
        .sort((a, b) => a.distance - b.distance);
    }

    res.json(psychologists);
  } catch (error) {
    console.error('Error fetching psychologists:', error);
    res.status(500).json({ message: 'Failed to fetch psychologists' });
  }
}

module.exports = {
  getCbtTherapists,
  getPsychologists,
};