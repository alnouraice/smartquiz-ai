const fs = require('node:fs/promises');
const path = require('node:path');
const { database, initializeDatabase, run } = require('./database');

function normalizeQuestion(question, index) {
  const normalized = {
    question_text: question?.question_text ?? question?.questionText,
    options: question?.options,
    correct_answer: question?.correct_answer ?? question?.correctAnswer,
    unit_name: question?.unit_name ?? question?.unitName,
    difficulty_level: question?.difficulty_level ?? question?.difficultyLevel
  };

  const isValid =
    typeof normalized.question_text === 'string' &&
    normalized.question_text.trim() &&
    Array.isArray(normalized.options) &&
    normalized.options.length >= 2 &&
    normalized.options.length <= 10 &&
    normalized.options.every((option) => typeof option === 'string' && option.trim()) &&
    typeof normalized.correct_answer === 'string' &&
    typeof normalized.unit_name === 'string' &&
    normalized.unit_name.trim() &&
    typeof normalized.difficulty_level === 'string' &&
    normalized.difficulty_level.trim();

  if (!isValid) {
    throw new Error(
      `Question ${index + 1} is invalid. Each item needs question_text, 2-10 string options, correct_answer, unit_name, and difficulty_level.`
    );
  }

  const options = normalized.options.map((option) => option.trim());
  const correctAnswer = normalized.correct_answer.trim();
  if (!options.includes(correctAnswer)) {
    throw new Error(`Question ${index + 1}: correct_answer must match one of its options.`);
  }

  return {
    question_text: normalized.question_text.trim(),
    options,
    correct_answer: correctAnswer,
    unit_name: normalized.unit_name.trim(),
    difficulty_level: normalized.difficulty_level.trim()
  };
}

function closeDatabase() {
  return new Promise((resolve, reject) => {
    database.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function seedQuestions() {
  const args = process.argv.slice(2);
  const replaceExisting = args.includes('--replace');
  const inputPath = args.find((arg) => arg !== '--replace');
  const jsonPath = path.resolve(inputPath || path.join(__dirname, 'questions.json'));

  let transactionStarted = false;

  try {
    const fileContents = await fs.readFile(jsonPath, 'utf8');
    const input = JSON.parse(fileContents);
    if (!Array.isArray(input) || input.length === 0) {
      throw new Error('The JSON file must contain a non-empty array of questions.');
    }

    // Validate all records before starting the transaction or deleting old data.
    const questions = input.map(normalizeQuestion);
    await initializeDatabase();

    await run('BEGIN IMMEDIATE TRANSACTION');
    transactionStarted = true;

    if (replaceExisting) {
      await run('DELETE FROM questions');
    }

    for (const question of questions) {
      await run(
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
    }

    await run('COMMIT');
    transactionStarted = false;
    console.log(
      `Imported ${questions.length} question(s) from ${jsonPath}.` +
      (replaceExisting ? ' Existing questions were replaced.' : '')
    );
  } catch (error) {
    if (transactionStarted) {
      try {
        await run('ROLLBACK');
      } catch (rollbackError) {
        console.error('Failed to roll back the import:', rollbackError);
      }
    }
    throw error;
  } finally {
    await closeDatabase();
  }
}

seedQuestions().catch((error) => {
  console.error(`Question import failed: ${error.message}`);
  process.exitCode = 1;
});
