// src/controllers/assignmentController.js

import db from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAuditLog } from '../utils/audit.js';

// GET /api/assignments
export const listAssignments = asyncHandler(async (req, res) => {
  const { baseId, status, page = 1, pageSize = 20 } = req.query;

  const conditions = [];
  const params = [];
  if (baseId) { params.push(baseId); conditions.push(`a.base_id = $${params.length}`); }
  if (status) { params.push(status); conditions.push(`a.status = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const dataQuery = `
    SELECT a.*, b.name AS base_name, et.name AS equipment_name, et.category, et.unit,
           u.username AS assigned_by_username, u.full_name AS assigned_by_name
    FROM assignments a
    JOIN bases b ON b.id = a.base_id
    JOIN equipment_types et ON et.id = a.equipment_type_id
    JOIN users u ON u.id = a.assigned_by_id
    ${where}
    ORDER BY a.assigned_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  const countQuery = `SELECT COUNT(*) FROM assignments a ${where}`;
  const [dataResult, countResult] = await Promise.all([db.query(dataQuery, params), db.query(countQuery, params)]);

  const data = dataResult.rows.map((r) => ({
    id: r.id,
    quantity: r.quantity,
    personnelName: r.personnel_name,
    personnelServiceId: r.personnel_service_id,
    status: r.status,
    assignedAt: r.assigned_at,
    returnedAt: r.returned_at,
    base: { id: r.base_id, name: r.base_name },
    equipmentType: { id: r.equipment_type_id, name: r.equipment_name, category: r.category, unit: r.unit },
    assignedBy: { id: r.assigned_by_id, username: r.assigned_by_username, fullName: r.assigned_by_name },
  }));

  return res.status(200).json({ data, total: Number(countResult.rows[0].count), page: Number(page), pageSize: limit });
});

// POST /api/assignments
export const createAssignment = asyncHandler(async (req, res) => {
  const { baseId, equipmentTypeId, quantity, personnelName, personnelServiceId } = req.body;

  if (req.enforcedBaseId && Number(baseId) !== req.enforcedBaseId) {
    return res.status(403).json({ message: 'You may only assign assets belonging to your own base.' });
  }
  if (!baseId || !equipmentTypeId || !quantity || quantity <= 0 || !personnelName) {
    return res.status(400).json({ message: 'baseId, equipmentTypeId, quantity and personnelName are required.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const insertRes = await client.query(
      `INSERT INTO assignments (base_id, equipment_type_id, quantity, personnel_name, personnel_service_id, assigned_by_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [baseId, equipmentTypeId, quantity, personnelName, personnelServiceId || null, req.user.userId]
    );
    const assignment = insertRes.rows[0];

    const lookup = await client.query(
      `SELECT b.name AS base_name, et.name AS equipment_name FROM bases b, equipment_types et WHERE b.id = $1 AND et.id = $2`,
      [baseId, equipmentTypeId]
    );
    const { base_name, equipment_name } = lookup.rows[0];

    await writeAuditLog(
      {
        userId: req.user.userId,
        action: 'ASSIGNMENT',
        details: `Assigned ${quantity} x ${equipment_name} to ${personnelName} at "${base_name}".`,
        ipAddress: req.ip,
      },
      client
    );

    await client.query('COMMIT');
    return res.status(201).json(assignment);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// PATCH /api/assignments/:id/return
export const returnAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await db.query(
    `UPDATE assignments SET status = 'RETURNED', returned_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [id]
  );
  if (!rows[0]) {
    return res.status(404).json({ message: 'Assignment not found.' });
  }

  await writeAuditLog({
    userId: req.user.userId,
    action: 'ASSIGNMENT',
    details: `Marked assignment #${id} as returned.`,
    ipAddress: req.ip,
  });

  return res.status(200).json(rows[0]);
});
