const express = require('express');
const { all, database, get, run } = require('../database');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function validateQuestion(question) {
  if (
    !question ||
    typeof question.question_text !== 'string' ||
    !question.question_text.trim() ||
    !Array.isArray(question.options) ||
    question.options.length < 2 ||
    question.options.length > 10 ||
    question.options.some((option) => typeof option !== 'string' || !option.trim()) ||
    typeof question.correct_answer !== 'string' ||
    !question.options.some((option) => option.trim() === question.correct_answer.trim()) ||
    typeof question.unit_name !== 'string' ||
    !question.unit_name.trim() ||
    typeof question.difficulty_level !== 'string' ||
    !question.difficulty_level.trim()
  ) {
    return 'Each question needs text, 2-10 options, a correct answer from those options, a unit, and a difficulty.';
  }

  return null;
}

function normalizeQuestion(question) {
  return {
    question_text: question.question_text.trim(),
    options: question.options.map((option) => option.trim()),
    correct_answer: question.correct_answer.trim(),
    unit_name: question.unit_name.trim(),
    difficulty_level: question.difficulty_level.trim()
  };
}

// Every admin endpoint requires a valid token and the administrator role.
router.use(authenticateToken, isAdmin);

router.get('/stats', async (req, res, next) => {
  try {
    const stats = await get(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE role = 'student') AS totalStudents,
         COUNT(*) AS totalAttempts,
         COALESCE(ROUND(AVG(score), 1), 0) AS averageScore,
         COALESCE(ROUND(
           100.0 * SUM(CASE WHEN score >= 50 THEN 1 ELSE 0 END) /
           NULLIF(COUNT(*), 0), 1
         ), 0) AS passRate
       FROM attempts`
    );
    const recentAttempts = await all(
      `SELECT a.id, u.name AS studentName, a.unit_name AS unitName,
              a.score, a.created_at AS createdAt
       FROM attempts a
       JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT 10`
    );

    return res.json({ ...stats, recentAttempts });
  } catch (error) {
    return next(error);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const users = await all(
      `SELECT id, name, email, role
       FROM users
       ORDER BY id`
    );
    return res.json({ users });
  } catch (error) {
    return next(error);
  }
});

router.get('/questions', async (req, res, next) => {
  try {
    const questions = await all(
      `SELECT id, question_text, options, correct_answer, unit_name, difficulty_level
       FROM questions
       ORDER BY unit_name, id`
    );
    return res.json({
      questions: questions.map((question) => ({
        ...question,
        options: JSON.parse(question.options)
      }))
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/questions', async (req, res, next) => {
  const validationError = validateQuestion(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const question = normalizeQuestion(req.body);
  try {
    const result = await run(
      `INSERT INTO questions
         (question_text, options, correct_answer, unit_name, difficulty_level)
       VALUES (?, ?, ?, ?, ?)`,
      [
        question.question_text,
        JSON.stringify(question.options),
        question.correct_answer,
        question.unit_name,
        question.difficulty_level
      ]
    );
    return res.status(201).json({ id: result.lastID, ...question });
  } catch (error) {
    return next(error);
  }
});

router.put('/questions/:id', async (req, res, next) => {
  const questionId = Number(req.params.id);
  const validationError = validateQuestion(req.body);
  if (!Number.isInteger(questionId) || questionId < 1 || validationError) {
    return res.status(400).json({ error: validationError || 'Invalid question ID.' });
  }

  const question = normalizeQuestion(req.body);
  try {
    const result = await run(
      `UPDATE questions
       SET question_text = ?, options = ?, correct_answer = ?,
           unit_name = ?, difficulty_level = ?
       WHERE id = ?`,
      [
        question.question_text,
        JSON.stringify(question.options),
        question.correct_answer,
        question.unit_name,
        question.difficulty_level,
        questionId
      ]
    );
    if (!result.changes) {
      return res.status(404).json({ error: 'Question not found.' });
    }
    return res.json({ id: questionId, ...question });
  } catch (error) {
    return next(error);
  }
});

router.delete('/questions/:id', async (req, res, next) => {
  const questionId = Number(req.params.id);
  if (!Number.isInteger(questionId) || questionId < 1) {
    return res.status(400).json({ error: 'Invalid question ID.' });
  }

  try {
    const result = await run('DELETE FROM questions WHERE id = ?', [questionId]);
    if (!result.changes) {
      return res.status(404).json({ error: 'Question not found.' });
    }
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

router.post('/questions/bulk', (req, res, next) => {
  const { questions } = req.body;

  if (!Array.isArray(questions) || questions.length === 0 || questions.length > 500) {
    return res.status(400).json({ error: 'Submit between 1 and 500 questions.' });
  }

  const validationErrors = questions
    .map(validateQuestion)
    .map((message, index) => message ? `Question ${index + 1}: ${message}` : null)
    .filter(Boolean);
  if (validationErrors.length) {
    return res.status(400).json({ error: 'Some questions are invalid.', details: validationErrors });
  }

  const normalizedQuestions = questions.map(normalizeQuestion);
  database.serialize(() => {
    database.run('BEGIN IMMEDIATE TRANSACTION', (beginError) => {
      if (beginError) return next(beginError);

      const insert = database.prepare(
        `INSERT INTO questions
           (question_text, options, correct_answer, unit_name, difficulty_level)
         VALUES (?, ?, ?, ?, ?)`
      );
      let insertError = null;
      let importedCount = 0;

      normalizedQuestions.forEach((question) => {
        insert.run(
          [
            question.question_text,
            JSON.stringify(question.options),
            question.correct_answer,
            question.unit_name,
            question.difficulty_level
          ],
          (error) => {
            if (error && !insertError) insertError = error;
            if (!error) importedCount += 1;
          }
        );
      });

      insert.finalize((finalizeError) => {
        const failure = insertError || finalizeError;
        database.run(failure ? 'ROLLBACK' : 'COMMIT', (transactionError) => {
          if (failure) return next(failure);
          if (transactionError) return next(transactionError);
          return res.status(201).json({ importedCount });
        });
      });
    });
  });
});

router.get('/results', async (req, res, next) => {
  const { unit, startDate, endDate } = req.query;
  if (
    (unit !== undefined && (typeof unit !== 'string' || !unit.trim())) ||
    (startDate !== undefined && (typeof startDate !== 'string' || !datePattern.test(startDate))) ||
    (endDate !== undefined && (typeof endDate !== 'string' || !datePattern.test(endDate)))
  ) {
    return res.status(400).json({ error: 'Invalid unit or date filter.' });
  }

  const conditions = [];
  const parameters = [];
  if (unit) {
    conditions.push('a.unit_name = ?');
    parameters.push(unit.trim());
  }
  if (startDate) {
    conditions.push("date(a.created_at) >= date(?)");
    parameters.push(startDate);
  }
  if (endDate) {
    conditions.push("date(a.created_at) <= date(?)");
    parameters.push(endDate);
  }

  try {
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const results = await all(
      `SELECT a.id, a.user_id AS userId, u.name AS studentName,
              u.email AS studentEmail, a.unit_name AS unitName,
              a.score, a.details, a.ai_feedback AS aiFeedback,
              a.created_at AS createdAt
       FROM attempts a
       JOIN users u ON u.id = a.user_id
       ${whereClause}
       ORDER BY a.created_at DESC, a.id DESC`,
      parameters
    );

    return res.json({
      results: results.map((result) => ({
        ...result,
        details: JSON.parse(result.details)
      }))
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
