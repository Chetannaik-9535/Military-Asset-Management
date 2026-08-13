// src/controllers/userController.js
// ADMIN-only user management: list users and create new accounts
// (e.g. onboarding a new Base Commander or Logistics Officer).

import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAuditLog } from '../utils/audit.js';

// GET /api/users
export const listUsers = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT u.id, u.username, u.full_name, u.role, u.created_at, b.id AS base_id, b.name AS base_name
     FROM users u
     LEFT JOIN bases b ON b.id = u.base_id
     ORDER BY u.created_at DESC`
  );

  const data = rows.map((r) => ({
    id: r.id,
    username: r.username,
    fullName: r.full_name,
    role: r.role,
    createdAt: r.created_at,
    base: r.base_id ? { id: r.base_id, name: r.base_name } : null,
  }));

  return res.status(200).json(data);
});

// POST /api/users
export const createUser = asyncHandler(async (req, res) => {
  const { username, password, fullName, role, baseId } = req.body;
  const validRoles = ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'];

  if (!username || !password || !fullName || !validRoles.includes(role)) {
    return res.status(400).json({ message: 'username, password, fullName and a valid role are required.' });
  }
  if (role !== 'ADMIN' && !baseId) {
    return res.status(400).json({ message: 'baseId is required for Base Commander and Logistics Officer accounts.' });
  }

  const { rows: existingRows } = await db.query('SELECT id FROM users WHERE username = $1', [username]);
  if (existingRows[0]) {
    return res.status(409).json({ message: 'That username is already taken.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await db.query(
    `INSERT INTO users (username, password_hash, full_name, role, base_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, username, full_name, role, base_id, created_at`,
    [username, passwordHash, fullName, role, baseId ? Number(baseId) : null]
  );

  await writeAuditLog({
    userId: req.user.userId,
    action: 'USER_CREATED',
    details: `Created ${role} account "${username}".`,
    ipAddress: req.ip,
  });

  const user = rows[0];
  return res.status(201).json({
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    role: user.role,
    baseId: user.base_id,
    createdAt: user.created_at,
  });
});
