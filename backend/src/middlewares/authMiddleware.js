// src/middlewares/authMiddleware.js
// Verifies the JWT sent in the Authorization header and attaches the
// decoded payload (userId, role, baseId) to req.user for downstream use.

import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Access denied: no authentication token provided.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { userId, username, role, baseId }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(403).json({ message: 'Invalid authentication token.' });
  }
};
