// src/controllers/baseController.js

import db from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/bases
export const listBases = asyncHandler(async (req, res) => {
  const isCommander = req.user.role === 'BASE_COMMANDER';
  const { rows } = await db.query(
    isCommander
      ? 'SELECT * FROM bases WHERE id = $1 ORDER BY name ASC'
      : 'SELECT * FROM bases ORDER BY name ASC',
    isCommander ? [req.user.baseId] : []
  );
  return res.status(200).json(rows);
});

// POST /api/bases  (ADMIN only)
export const createBase = asyncHandler(async (req, res) => {
  const { name, location } = req.body;
  if (!name || !location) {
    return res.status(400).json({ message: 'name and location are required.' });
  }
  const { rows } = await db.query(
    'INSERT INTO bases (name, location) VALUES ($1, $2) RETURNING *',
    [name, location]
  );
  return res.status(201).json(rows[0]);
});

// PUT /api/bases/:id  (ADMIN only)
export const updateBase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, location } = req.body;

  const { rows } = await db.query(
    `UPDATE bases SET name = COALESCE($1, name), location = COALESCE($2, location)
     WHERE id = $3 RETURNING *`,
    [name || null, location || null, id]
  );
  if (!rows[0]) {
    return res.status(404).json({ message: 'Base not found.' });
  }
  return res.status(200).json(rows[0]);
});

// DELETE /api/bases/:id  (ADMIN only)
export const deleteBase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await db.query('DELETE FROM bases WHERE id = $1', [id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Base not found.' });
  }
  return res.status(204).send();
});
