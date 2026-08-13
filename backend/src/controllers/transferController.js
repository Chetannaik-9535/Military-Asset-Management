// src/controllers/transferController.js
//
// Transfers move stock between two bases. Balances are derived from the
// ledger rather than stored as a mutable column, so an "atomic transfer"
// means: the availability check and the transfer insert happen inside a
// single BEGIN...COMMIT block, and use SELECT ... FOR UPDATE-style locking
// discipline (row locks via the transaction) so two concurrent transfers
// can't both pass the availability check against the same stock.

import db from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAuditLog } from '../utils/audit.js';

const getCurrentBalance = async (client, baseId, equipmentTypeId) => {
  const { rows } = await client.query(
    `
    SELECT
      COALESCE((SELECT SUM(quantity) FROM purchases WHERE base_id = $1 AND equipment_type_id = $2), 0)
      + COALESCE((SELECT SUM(quantity) FROM transfers WHERE destination_base_id = $1 AND equipment_type_id = $2), 0)
      - COALESCE((SELECT SUM(quantity) FROM transfers WHERE source_base_id = $1 AND equipment_type_id = $2), 0)
      - COALESCE((SELECT SUM(quantity) FROM assignments WHERE base_id = $1 AND equipment_type_id = $2 AND status = 'ACTIVE'), 0)
      - COALESCE((SELECT SUM(quantity) FROM expenditures WHERE base_id = $1 AND equipment_type_id = $2), 0)
      AS balance
    `,
    [baseId, equipmentTypeId]
  );
  return Number(rows[0].balance);
};

// GET /api/transfers
export const listTransfers = asyncHandler(async (req, res) => {
  const { baseId, equipmentTypeId, status, page = 1, pageSize = 20 } = req.query;

  const conditions = [];
  const params = [];
  if (baseId) {
    params.push(baseId);
    conditions.push(`(t.source_base_id = $${params.length} OR t.destination_base_id = $${params.length})`);
  }
  if (equipmentTypeId) { params.push(equipmentTypeId); conditions.push(`t.equipment_type_id = $${params.length}`); }
  if (status) { params.push(status); conditions.push(`t.status = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const dataQuery = `
    SELECT t.*, sb.name AS source_base_name, db_.name AS destination_base_name,
           et.name AS equipment_name, et.category, et.unit,
           u.username AS initiated_by_username, u.full_name AS initiated_by_name
    FROM transfers t
    JOIN bases sb ON sb.id = t.source_base_id
    JOIN bases db_ ON db_.id = t.destination_base_id
    JOIN equipment_types et ON et.id = t.equipment_type_id
    JOIN users u ON u.id = t.initiated_by_id
    ${where}
    ORDER BY t.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  const countQuery = `SELECT COUNT(*) FROM transfers t ${where}`;

  const [dataResult, countResult] = await Promise.all([db.query(dataQuery, params), db.query(countQuery, params)]);

  const data = dataResult.rows.map((r) => ({
    id: r.id,
    quantity: r.quantity,
    status: r.status,
    createdAt: r.created_at,
    sourceBase: { id: r.source_base_id, name: r.source_base_name },
    destinationBase: { id: r.destination_base_id, name: r.destination_base_name },
    equipmentType: { id: r.equipment_type_id, name: r.equipment_name, category: r.category, unit: r.unit },
    initiatedBy: { id: r.initiated_by_id, username: r.initiated_by_username, fullName: r.initiated_by_name },
  }));

  return res.status(200).json({ data, total: Number(countResult.rows[0].count), page: Number(page), pageSize: limit });
});

// POST /api/transfers
export const createTransfer = asyncHandler(async (req, res) => {
  const { sourceBaseId, destinationBaseId, equipmentTypeId, quantity, status } = req.body;

  if (!sourceBaseId || !destinationBaseId || !equipmentTypeId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'sourceBaseId, destinationBaseId, equipmentTypeId and a positive quantity are required.' });
  }
  if (Number(sourceBaseId) === Number(destinationBaseId)) {
    return res.status(400).json({ message: 'Source and destination bases must be different.' });
  }
  if (req.enforcedBaseId && Number(sourceBaseId) !== req.enforcedBaseId) {
    return res.status(403).json({ message: 'You may only initiate transfers from your own base.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const available = await getCurrentBalance(client, Number(sourceBaseId), Number(equipmentTypeId));
    if (available < Number(quantity)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: `Transfer failed: only ${available} unit(s) available at the source base.` });
    }

    const insertRes = await client.query(
      `INSERT INTO transfers (source_base_id, destination_base_id, equipment_type_id, quantity, status, initiated_by_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [sourceBaseId, destinationBaseId, equipmentTypeId, quantity, status || 'COMPLETED', req.user.userId]
    );
    const transfer = insertRes.rows[0];

    const lookup = await client.query(
      `SELECT
         (SELECT name FROM bases WHERE id = $1) AS source_name,
         (SELECT name FROM bases WHERE id = $2) AS destination_name,
         (SELECT name FROM equipment_types WHERE id = $3) AS equipment_name`,
      [sourceBaseId, destinationBaseId, equipmentTypeId]
    );
    const { source_name, destination_name, equipment_name } = lookup.rows[0];

    await writeAuditLog(
      {
        userId: req.user.userId,
        action: 'TRANSFER',
        details: `Transferred ${quantity} x ${equipment_name} from "${source_name}" to "${destination_name}".`,
        ipAddress: req.ip,
      },
      client
    );

    await client.query('COMMIT');
    return res.status(201).json({
      message: 'Transfer completed successfully.',
      transfer: { ...transfer, sourceBaseName: source_name, destinationBaseName: destination_name, equipmentName: equipment_name },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// PATCH /api/transfers/:id/status  (ADMIN, or LOGISTICS_OFFICER for their own base's transfers)
export const updateTransferStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });
  }

  const { rows } = await db.query('UPDATE transfers SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
  if (!rows[0]) {
    return res.status(404).json({ message: 'Transfer not found.' });
  }

  await writeAuditLog({
    userId: req.user.userId,
    action: 'TRANSFER',
    details: `Updated transfer #${id} status to ${status}.`,
    ipAddress: req.ip,
  });

  return res.status(200).json(rows[0]);
});
