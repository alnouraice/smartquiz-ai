const jwt = require('jsonwebtoken');
const { get } = require('../database');

async function authenticateToken(req, res, next) {
  const authorization = req.get('authorization');
  const [scheme, token] = authorization ? authorization.split(' ') : [];

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!Number.isInteger(payload.id)) {
      return res.status(401).json({ error: 'Invalid authentication token.' });
    }

    // Read the current role from SQLite so role changes take effect immediately.
    const user = await get('SELECT id, role FROM users WHERE id = ?', [payload.id]);
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }

    return next(error);
  }
}

function isAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required.' });
  }

  return next();
}

module.exports = { authenticateToken, isAdmin };
