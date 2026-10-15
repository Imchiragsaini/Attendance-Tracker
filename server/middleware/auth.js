const jwt = require('jsonwebtoken');

// Verifies the Bearer token and attaches { id, role } to req.user
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not logged in' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    res.status(401).json({ message: 'Session expired, please log in again' });
  }
}

// For phase 2: requireRole('teacher') on teacher-only routes
function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) return res.status(403).json({ message: 'Not allowed' });
    next();
  };
}

module.exports = { requireAuth, requireRole };
