require('dotenv').config();

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { all, run } = require('../database');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/evaluate-quiz', authenticateToken, async (req, res, next) => {
  const { unitName, answers } = req.body;

  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only student accounts can submit quizzes.' });
  }

  if (
    typeof unitName !== 'string' ||
    !unitName.trim() ||
    !Array.isArray(answers) ||
    answers.length === 0 ||
    answers.length > 100 ||
    answers.some((item) =>
      !item ||
      !Number.isInteger(item.questionId) ||
      item.questionId <= 0 ||
      typeof item.answer !== 'string' ||
      !item.answer.trim() ||
      item.answer.length > 1000
    )
  ) {
    return res.status(400).json({ error: 'Provide a unit and valid quiz answers.' });
  }

  const questionIds = answers.map((item) => item.questionId);
  if (new Set(questionIds).size !== questionIds.length) {
    return res.status(400).json({ error: 'Each question can only be answered once.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Quiz feedback is not configured on the server.' });
  }

  try {
    const placeholders = questionIds.map(() => '?').join(', ');
    const questions = await all(
      `SELECT id, question_text, options, correct_answer, unit_name
       FROM questions
       WHERE unit_name = ? AND id IN (${placeholders})`,
      [unitName.trim(), ...questionIds]
    );

    if (questions.length !== answers.length) {
      return res.status(400).json({
        error: 'One or more submitted questions do not belong to this unit.'
      });
    }

    const answersByQuestionId = new Map(
      answers.map((item) => [item.questionId, item.answer.trim()])
    );
    const details = questions.map((question) => {
      const submittedAnswer = answersByQuestionId.get(question.id);
      const isCorrect = submittedAnswer === question.correct_answer;

      return {
        questionId: question.id,
        questionText: question.question_text,
        options: JSON.parse(question.options),
        submittedAnswer,
        correctAnswer: question.correct_answer,
        isCorrect
      };
    });
    const score = Math.round(
      (details.filter((item) => item.isCorrect).length / details.length) * 100
    );
    const incorrectAnswers = details
      .filter((item) => !item.isCorrect)
      .map(({ questionText, submittedAnswer, correctAnswer }) => ({
        question: questionText,
        studentAnswer: submittedAnswer,
        correctAnswer
      }));

    let aiFeedback;
    try {
      // Keep the Gemini credential on the server; send only quiz performance data.
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      const result = await model.generateContent([
        'أنت مساعد تعليمي لمقرر مكونات الحاسوب. اكتب تقريرًا عربيًا موجزًا ومشجعًا يشرح أخطاء الطالب في مكونات الحاسوب ويقدم توصيات دراسية عملية. استخدم الدرجة والأخطاء أدناه فقط، ولا تخترع معلومات عن الطالب أو إجاباته.',
        JSON.stringify({ unit: unitName.trim(), score, incorrectAnswers })
      ].join('\n'));
      aiFeedback = result.response.text();
    } catch (error) {
      console.error('Gemini quiz evaluation failed:', {
        name: error && error.name,
        message: error && error.message,
        status: error && error.status,
        statusText: error && error.statusText,
        errorDetails: error && error.errorDetails,
        stack: error && error.stack
      });
      return res.status(502).json({ error: 'AI feedback is temporarily unavailable. Please retry.' });
    }

    if (typeof aiFeedback !== 'string' || !aiFeedback.trim()) {
      return res.status(502).json({ error: 'The AI service returned empty feedback. Please retry.' });
    }

    const savedAttempt = await run(
      `INSERT INTO attempts (user_id, score, unit_name, details, ai_feedback)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        score,
        unitName.trim(),
        JSON.stringify(details),
        aiFeedback.trim()
      ]
    );

    return res.status(201).json({
      attemptId: savedAttempt.lastID,
      score,
      unitName: unitName.trim(),
      details,
      aiFeedback: aiFeedback.trim()
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(500).json({ error: 'Question data is malformed in the database.' });
    }
    return next(error);
  }
});

module.exports = router;
