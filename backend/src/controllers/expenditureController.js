// src/controllers/expenditureController.js

import db from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAuditLog } from '../utils/audit.js';

// GET /api/expenditures
export const listExpenditures = asyncHandler(async (req, res) => {
  const { baseId, page = 1, pageSize = 20 } = req.query;
  const conditions = [];
  const params = [];
  if (baseId) { params.push(baseId); conditions.push(`e.base_id = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const dataQuery = `
    SELECT e.*, b.name AS base_name, et.name AS equipment_name, et.category, et.unit,
           u.username AS reported_by_username, u.full_name AS reported_by_name
    FROM expenditures e
    JOIN bases b ON b.id = e.base_id
    JOIN equipment_types et ON et.id = e.equipment_type_id
    JOIN users u ON u.id = e.reported_by_id
    ${where}
    ORDER BY e.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  const countQuery = `SELECT COUNT(*) FROM expenditures e ${where}`;
  const [dataResult, countResult] = await Promise.all([db.query(dataQuery, params), db.query(countQuery, params)]);

  const data = dataResult.rows.map((r) => ({
    id: r.id,
    quantity: r.quantity,
    reason: r.reason,
    createdAt: r.created_at,
    base: { id: r.base_id, name: r.base_name },
    equipmentType: { id: r.equipment_type_id, name: r.equipment_name, category: r.category, unit: r.unit },
    reportedBy: { id: r.reported_by_id, username: r.reported_by_username, fullName: r.reported_by_name },
  }));

  return res.status(200).json({ data, total: Number(countResult.rows[0].count), page: Number(page), pageSize: limit });
});

// POST /api/expenditures
export const createExpenditure = asyncHandler(async (req, res) => {
  const { baseId, equipmentTypeId, quantity, reason } = req.body;

  if (req.enforcedBaseId && Number(baseId) !== req.enforcedBaseId) {
    return res.status(403).json({ message: 'You may only report expenditure for your own base.' });
  }
  if (!baseId || !equipmentTypeId || !quantity || quantity <= 0 || !reason) {
    return res.status(400).json({ message: 'baseId, equipmentTypeId, quantity and reason are required.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const insertRes = await client.query(
      `INSERT INTO expenditures (base_id, equipment_type_id, quantity, reason, reported_by_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [baseId, equipmentTypeId, quantity, reason, req.user.userId]
    );
    const expenditure = insertRes.rows[0];

    const lookup = await client.query(
      `SELECT b.name AS base_name, et.name AS equipment_name FROM bases b, equipment_types et WHERE b.id = $1 AND et.id = $2`,
      [baseId, equipmentTypeId]
    );
    const { base_name, equipment_name } = lookup.rows[0];

    await writeAuditLog(
      {
        userId: req.user.userId,
        action: 'EXPENDITURE',
        details: `Recorded expenditure of ${quantity} x ${equipment_name} at "${base_name}" (${reason}).`,
        ipAddress: req.ip,
      },
      client
    );

    await client.query('COMMIT');
    return res.status(201).json(expenditure);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});
