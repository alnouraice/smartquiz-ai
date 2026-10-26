const express = require('express');
const { all } = require('../database');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, async (req, res, next) => {
  const unitName = req.query.unit;

  if (typeof unitName !== 'string' || !unitName.trim()) {
    return res.status(400).json({ error: 'A unit query parameter is required.' });
  }

  try {
    const questions = await all(
      `SELECT id, question_text, options, unit_name, difficulty_level
       FROM questions
       WHERE unit_name = ?
       ORDER BY id`,
      [unitName.trim()]
    );

    const publicQuestions = questions.map((question) => ({
      ...question,
      options: JSON.parse(question.options)
    }));

    return res.json({ questions: publicQuestions });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
