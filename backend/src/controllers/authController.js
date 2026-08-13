// src/controllers/authController.js

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAuditLog } from '../utils/audit.js';

const signToken = (user) =>
  jwt.sign(
    { userId: user.id, username: user.username, role: user.role, baseId: user.base_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const { rows } = await db.query(
    `SELECT u.id, u.username, u.password_hash, u.full_name, u.role, u.base_id,
            b.id AS base_id_ref, b.name AS base_name
     FROM users u
     LEFT JOIN bases b ON b.id = u.base_id
     WHERE u.username = $1`,
    [username]
  );

  const user = rows[0];
  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const token = signToken(user);

  await writeAuditLog({
    userId: user.id,
    action: 'LOGIN',
    details: `User "${user.username}" logged in.`,
    ipAddress: req.ip,
  });

  return res.status(200).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      base: user.base_id ? { id: user.base_id_ref, name: user.base_name } : null,
    },
  });
});

// GET /api/auth/me
export const getCurrentUser = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT u.id, u.username, u.full_name, u.role, u.created_at,
            b.id AS base_id, b.name AS base_name, b.location AS base_location
     FROM users u
     LEFT JOIN bases b ON b.id = u.base_id
     WHERE u.id = $1`,
    [req.user.userId]
  );

  const user = rows[0];
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.status(200).json({
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    role: user.role,
    createdAt: user.created_at,
    base: user.base_id ? { id: user.base_id, name: user.base_name, location: user.base_location } : null,
  });
});
