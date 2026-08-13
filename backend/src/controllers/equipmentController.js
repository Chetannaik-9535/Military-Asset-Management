// src/controllers/equipmentController.js

import db from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/equipment-types
export const listEquipmentTypes = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const { rows } = await db.query(
    category
      ? 'SELECT * FROM equipment_types WHERE category = $1 ORDER BY category ASC, name ASC'
      : 'SELECT * FROM equipment_types ORDER BY category ASC, name ASC',
    category ? [category.toUpperCase()] : []
  );
  return res.status(200).json(rows);
});

// POST /api/equipment-types  (ADMIN only)
export const createEquipmentType = asyncHandler(async (req, res) => {
  const { name, category, unit } = req.body;
  if (!name || !category) {
    return res.status(400).json({ message: 'name and category are required.' });
  }
  const { rows } = await db.query(
    'INSERT INTO equipment_types (name, category, unit) VALUES ($1, $2, $3) RETURNING *',
    [name, category.toUpperCase(), unit || 'unit']
  );
  return res.status(201).json(rows[0]);
});
