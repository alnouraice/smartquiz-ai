const express = require('express');
const { all, get } = require('../database');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken, (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student access required.' });
  }
  return next();
});

router.get('/dashboard', async (req, res, next) => {
  try {
    const stats = await get(
      `SELECT COUNT(*) AS totalAttempts,
              COALESCE(MAX(score), 0) AS highestScore
       FROM attempts
       WHERE user_id = ?`,
      [req.user.id]
    );
    const units = await all(
      `SELECT q.unit_name AS unitName,
              COUNT(DISTINCT q.id) AS questionCount,
              COUNT(DISTINCT a.id) AS attempts
       FROM questions q
       LEFT JOIN attempts a
         ON a.unit_name = q.unit_name AND a.user_id = ?
       GROUP BY q.unit_name
       ORDER BY q.unit_name`,
      [req.user.id]
    );
    const practicedUnits = units.filter((unit) => unit.attempts > 0).length;

    return res.json({
      ...stats,
      practicedUnits,
      totalUnits: units.length,
      progress: units.length ? Math.round((practicedUnits / units.length) * 100) : 0,
      units
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
