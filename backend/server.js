require('dotenv').config();

const cors = require('cors');
const express = require('express');
const { initializeDatabase } = require('./database');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const questionRoutes = require('./routes/questions');
const quizRoutes = require('./routes/quiz');
const studentRoutes = require('./routes/student');

const app = express();
const port = Number(process.env.PORT) || 5000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set to a secret of at least 32 characters.');
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/student', studentRoutes);
app.use('/api', quizRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

// Do not accept requests until the schema has been created successfully.
initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`SmartQuiz AI API listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize the database:', error);
    process.exitCode = 1;
  });
