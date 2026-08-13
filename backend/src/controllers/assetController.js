// src/controllers/assetController.js
//
// Computes dashboard inventory metrics on the fly from the transactional
// tables (purchases, transfers, assignments, expenditures) rather than
// maintaining a duplicated running-balance column, so the numbers are
// always consistent with the source-of-truth ledger.
//
// Formulas (see README §Business Rules):
//   netMovement    = purchases + transfersIn - transfersOut          (within period)
//   openingBalance = net of all movements strictly BEFORE the period start
//   closingBalance = openingBalance + netMovement - assigned - expended

import db from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Sums the `quantity` column of a table under a dynamic set of optional filters.
 * Builds a parameterized WHERE clause so every value is bound, never interpolated.
 */
const sumQuantity = async (table, { baseColumn, baseId, equipmentTypeId, dateColumn, dateFrom, dateTo, extraWhere }) => {
  const conditions = [];
  const params = [];

  if (baseColumn && baseId) {
    params.push(baseId);
    conditions.push(`${baseColumn} = $${params.length}`);
  }
  if (equipmentTypeId) {
    params.push(equipmentTypeId);
    conditions.push(`equipment_type_id = $${params.length}`);
  }
  if (dateColumn && dateFrom) {
    params.push(dateFrom);
    conditions.push(`${dateColumn} >= $${params.length}`);
  }
  if (dateColumn && dateTo) {
    params.push(dateTo);
    conditions.push(`${dateColumn} <= $${params.length}`);
  }
  if (dateColumn && dateFrom === '__BEFORE__' ) {
    // handled by caller via dateBefore instead; placeholder no-op
  }
  if (extraWhere) conditions.push(extraWhere);

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await db.query(`SELECT COALESCE(SUM(quantity), 0) AS total FROM ${table} ${whereClause}`, params);
  return Number(rows[0].total);
};

const sumQuantityBefore = async (table, { baseColumn, baseId, equipmentTypeId, dateColumn, before }) => {
  if (!before) return 0; // no start date given -> no meaningful "opening" window
  const conditions = [`${dateColumn} < $1`];
  const params = [before];

  if (baseColumn && baseId) {
    params.push(baseId);
    conditions.push(`${baseColumn} = $${params.length}`);
  }
  if (equipmentTypeId) {
    params.push(equipmentTypeId);
    conditions.push(`equipment_type_id = $${params.length}`);
  }

  const { rows } = await db.query(
    `SELECT COALESCE(SUM(quantity), 0) AS total FROM ${table} WHERE ${conditions.join(' AND ')}`,
    params
  );
  return Number(rows[0].total);
};

const resolveScope = (req) => {
  const baseId = req.query.baseId ? Number(req.query.baseId) : null; // enforceBaseScope already forced this for non-admins
  const equipmentTypeId = req.query.equipmentTypeId ? Number(req.query.equipmentTypeId) : null;
  return { baseId, equipmentTypeId };
};

// GET /api/assets/dashboard
// Query params: baseId, equipmentTypeId, startDate, endDate (all optional)
export const getDashboardMetrics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const { baseId, equipmentTypeId } = resolveScope(req);
  const from = startDate ? new Date(startDate) : null;
  const to = endDate ? new Date(`${endDate}T23:59:59.999Z`) : null;

  const [purchases, transfersIn, transfersOut] = await Promise.all([
    sumQuantity('purchases', { baseColumn: 'base_id', baseId, equipmentTypeId, dateColumn: 'created_at', dateFrom: from, dateTo: to }),
    sumQuantity('transfers', { baseColumn: 'destination_base_id', baseId, equipmentTypeId, dateColumn: 'created_at', dateFrom: from, dateTo: to }),
    sumQuantity('transfers', { baseColumn: 'source_base_id', baseId, equipmentTypeId, dateColumn: 'created_at', dateFrom: from, dateTo: to }),
  ]);

  const [openingPurchases, openingTransfersIn, openingTransfersOut] = await Promise.all([
    sumQuantityBefore('purchases', { baseColumn: 'base_id', baseId, equipmentTypeId, dateColumn: 'created_at', before: from }),
    sumQuantityBefore('transfers', { baseColumn: 'destination_base_id', baseId, equipmentTypeId, dateColumn: 'created_at', before: from }),
    sumQuantityBefore('transfers', { baseColumn: 'source_base_id', baseId, equipmentTypeId, dateColumn: 'created_at', before: from }),
  ]);
  const openingAssigned = await sumQuantityBefore('assignments', { baseColumn: 'base_id', baseId, equipmentTypeId, dateColumn: 'assigned_at', before: from });
  const openingExpended = await sumQuantityBefore('expenditures', { baseColumn: 'base_id', baseId, equipmentTypeId, dateColumn: 'created_at', before: from });

  const [assigned, expended] = await Promise.all([
    sumQuantity('assignments', { baseColumn: 'base_id', baseId, equipmentTypeId, dateColumn: 'assigned_at', dateFrom: from, dateTo: to, extraWhere: `status = 'ACTIVE'` }),
    sumQuantity('expenditures', { baseColumn: 'base_id', baseId, equipmentTypeId, dateColumn: 'created_at', dateFrom: from, dateTo: to }),
  ]);

  const netMovement = purchases + transfersIn - transfersOut;
  const openingBalance = openingPurchases + openingTransfersIn - openingTransfersOut - openingAssigned - openingExpended;
  const closingBalance = openingBalance + netMovement - assigned - expended;

  return res.status(200).json({
    filters: { baseId, equipmentTypeId, startDate: startDate ?? null, endDate: endDate ?? null },
    openingBalance,
    netMovement,
    purchases,
    transfersIn,
    transfersOut,
    assigned,
    expended,
    closingBalance,
  });
});

// GET /api/assets/by-base
// Current closing balance per base per equipment type (used for the admin overview table).
export const getAssetsByBase = asyncHandler(async (req, res) => {
  const isCommander = req.user.role === 'BASE_COMMANDER';

  const { rows } = await db.query(
    `
    SELECT
      b.id AS base_id,
      b.name AS base_name,
      et.id AS equipment_type_id,
      et.name AS equipment_name,
      et.category,
      et.unit,
      COALESCE(p.qty, 0) + COALESCE(ti.qty, 0) - COALESCE(t_out.qty, 0) - COALESCE(a.qty, 0) - COALESCE(e.qty, 0) AS balance
    FROM bases b
    CROSS JOIN equipment_types et
    LEFT JOIN (SELECT base_id, equipment_type_id, SUM(quantity) qty FROM purchases GROUP BY base_id, equipment_type_id) p
      ON p.base_id = b.id AND p.equipment_type_id = et.id
    LEFT JOIN (SELECT destination_base_id AS base_id, equipment_type_id, SUM(quantity) qty FROM transfers GROUP BY destination_base_id, equipment_type_id) ti
      ON ti.base_id = b.id AND ti.equipment_type_id = et.id
    LEFT JOIN (SELECT source_base_id AS base_id, equipment_type_id, SUM(quantity) qty FROM transfers GROUP BY source_base_id, equipment_type_id) t_out
      ON t_out.base_id = b.id AND t_out.equipment_type_id = et.id
    LEFT JOIN (SELECT base_id, equipment_type_id, SUM(quantity) qty FROM assignments WHERE status = 'ACTIVE' GROUP BY base_id, equipment_type_id) a
      ON a.base_id = b.id AND a.equipment_type_id = et.id
    LEFT JOIN (SELECT base_id, equipment_type_id, SUM(quantity) qty FROM expenditures GROUP BY base_id, equipment_type_id) e
      ON e.base_id = b.id AND e.equipment_type_id = et.id
    WHERE ($1::int IS NULL OR b.id = $1)
    ORDER BY b.name, et.category, et.name
    `,
    [isCommander ? req.user.baseId : null]
  );

  const byBase = {};
  for (const row of rows) {
    if (Number(row.balance) === 0) continue;
    if (!byBase[row.base_id]) byBase[row.base_id] = { baseId: row.base_id, baseName: row.base_name, rows: [] };
    byBase[row.base_id].rows.push({
      equipmentTypeId: row.equipment_type_id,
      name: row.equipment_name,
      category: row.category,
      unit: row.unit,
      balance: Number(row.balance),
    });
  }

  return res.status(200).json(Object.values(byBase));
});
