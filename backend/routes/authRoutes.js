const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { get, run } = require('../database');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const bcryptSaltRounds = 12;

function createToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    // Keep login sessions short-lived; clients can sign in again after expiry.
    { expiresIn: '1d' }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

router.post('/register', async (req, res, next) => {
  const { name, email, password } = req.body || {};

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    name.trim().length > 100 ||
    typeof email !== 'string' ||
    email.trim().length > 254 ||
    !emailPattern.test(email.trim()) ||
    typeof password !== 'string' ||
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(400).json({
      error: 'Provide a name, valid email, and password of 8-72 bytes.'
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await get(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, bcryptSaltRounds);
    // Public registration cannot grant admin access; provision admins separately.
    const result = await run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name.trim(), normalizedEmail, hashedPassword, 'student']
    );
    const user = {
      id: result.lastID,
      name: name.trim(),
      email: normalizedEmail,
      role: 'student'
    };

    return res.status(201).json({ token: createToken(user), user });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT' || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body || {};

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !email.trim() ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await get(
      'SELECT id, name, email, password, role FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    return res.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await get(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
