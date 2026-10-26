const questionPattern = /^Q:\s*(.*?)\s*\|\s*Options:\s*(.*?)\s*\|\s*Answer:\s*(.*?)\s*\|\s*Diff:\s*(.+)$/i;

// Converts one question per line from the documented Word-friendly format.
export function parseQuestionText(text, unitName) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const questions = [];
  const errors = [];

  lines.forEach((line, index) => {
    const match = line.match(questionPattern);
    if (!match) {
      errors.push(`Line ${index + 1}: expected Q: ... | Options: ... | Answer: ... | Diff: ...`);
      return;
    }

    const options = match[2].split(',').map((option) => option.trim()).filter(Boolean);
    const answer = match[3].trim();
    if (!match[1].trim() || options.length < 2 || !options.includes(answer) || !match[4].trim()) {
      errors.push(`Line ${index + 1}: question, 2+ options, matching answer, and difficulty are required.`);
      return;
    }

    questions.push({
      question_text: match[1].trim(),
      options,
      correct_answer: answer,
      unit_name: unitName.trim(),
      difficulty_level: match[4].trim()
    });
  });

  return { questions, errors };
}

export function normalizeImportedQuestion(question, fallbackUnit) {
  return {
    question_text: question.question_text ?? question.questionText,
    options: question.options,
    correct_answer: question.correct_answer ?? question.correctAnswer,
    unit_name: question.unit_name ?? question.unitName ?? fallbackUnit,
    difficulty_level: question.difficulty_level ?? question.difficultyLevel
  };
}
