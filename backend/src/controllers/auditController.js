// src/controllers/auditController.js
// Admin-only visibility into the full system audit trail.

import db from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/audit-logs
export const listAuditLogs = asyncHandler(async (req, res) => {
  const { action, userId, page = 1, pageSize = 25 } = req.query;
  const conditions = [];
  const params = [];
  if (action) { params.push(action); conditions.push(`al.action = $${params.length}`); }
  if (userId) { params.push(userId); conditions.push(`al.user_id = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const dataQuery = `
    SELECT al.*, u.username, u.full_name, u.role
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.user_id
    ${where}
    ORDER BY al.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  const countQuery = `SELECT COUNT(*) FROM audit_logs al ${where}`;
  const [dataResult, countResult] = await Promise.all([db.query(dataQuery, params), db.query(countQuery, params)]);

  const data = dataResult.rows.map((r) => ({
    id: r.id,
    action: r.action,
    details: r.details,
    ipAddress: r.ip_address,
    createdAt: r.created_at,
    user: r.user_id ? { id: r.user_id, username: r.username, fullName: r.full_name, role: r.role } : null,
  }));

  return res.status(200).json({ data, total: Number(countResult.rows[0].count), page: Number(page), pageSize: limit });
});
