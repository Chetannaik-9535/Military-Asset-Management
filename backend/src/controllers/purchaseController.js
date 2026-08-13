// src/controllers/purchaseController.js

import db from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAuditLog } from '../utils/audit.js';

// GET /api/purchases
export const listPurchases = asyncHandler(async (req, res) => {
  const { baseId, equipmentTypeId, startDate, endDate, page = 1, pageSize = 20 } = req.query;

  const conditions = [];
  const params = [];
  if (baseId) { params.push(baseId); conditions.push(`pu.base_id = $${params.length}`); }
  if (equipmentTypeId) { params.push(equipmentTypeId); conditions.push(`pu.equipment_type_id = $${params.length}`); }
  if (startDate) { params.push(new Date(startDate)); conditions.push(`pu.created_at >= $${params.length}`); }
  if (endDate) { params.push(new Date(`${endDate}T23:59:59.999Z`)); conditions.push(`pu.created_at <= $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const dataQuery = `
    SELECT pu.*, b.name AS base_name, et.name AS equipment_name, et.category, et.unit,
           u.username AS recorded_by_username, u.full_name AS recorded_by_name
    FROM purchases pu
    JOIN bases b ON b.id = pu.base_id
    JOIN equipment_types et ON et.id = pu.equipment_type_id
    JOIN users u ON u.id = pu.recorded_by_id
    ${where}
    ORDER BY pu.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  const countQuery = `SELECT COUNT(*) FROM purchases pu ${where}`;

  const [dataResult, countResult] = await Promise.all([db.query(dataQuery, params), db.query(countQuery, params)]);

  const data = dataResult.rows.map((r) => ({
    id: r.id,
    quantity: r.quantity,
    unitCost: r.unit_cost,
    supplier: r.supplier,
    createdAt: r.created_at,
    base: { id: r.base_id, name: r.base_name },
    equipmentType: { id: r.equipment_type_id, name: r.equipment_name, category: r.category, unit: r.unit },
    recordedBy: { id: r.recorded_by_id, username: r.recorded_by_username, fullName: r.recorded_by_name },
  }));

  return res.status(200).json({ data, total: Number(countResult.rows[0].count), page: Number(page), pageSize: limit });
});

// POST /api/purchases
export const createPurchase = asyncHandler(async (req, res) => {
  const { baseId, equipmentTypeId, quantity, unitCost, supplier } = req.body;

  if (req.enforcedBaseId && Number(baseId) !== req.enforcedBaseId) {
    return res.status(403).json({ message: 'You may only record purchases for your own base.' });
  }
  if (!baseId || !equipmentTypeId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'baseId, equipmentTypeId and a positive quantity are required.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const insertRes = await client.query(
      `INSERT INTO purchases (base_id, equipment_type_id, quantity, unit_cost, supplier, recorded_by_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [baseId, equipmentTypeId, quantity, unitCost || null, supplier || null, req.user.userId]
    );
    const purchase = insertRes.rows[0];

    const lookup = await client.query(
      `SELECT b.name AS base_name, et.name AS equipment_name FROM bases b, equipment_types et
       WHERE b.id = $1 AND et.id = $2`,
      [baseId, equipmentTypeId]
    );
    const { base_name, equipment_name } = lookup.rows[0];

    await writeAuditLog(
      {
        userId: req.user.userId,
        action: 'PURCHASE',
        details: `Purchased ${quantity} x ${equipment_name} for base "${base_name}".`,
        ipAddress: req.ip,
      },
      client
    );

    await client.query('COMMIT');
    return res.status(201).json({ ...purchase, baseName: base_name, equipmentName: equipment_name });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});
