// src/utils/audit.js
// Central helper for writing to the audit_logs table. Every mutating
// operation (purchase, transfer, assignment, expenditure, login) calls
// this so there is a single, consistent audit trail format.
//
// Accepts either the default db (pool.query) or a checked-out transaction
// client (client.query) so a log entry can be written inside the same
// BEGIN/COMMIT block as the mutation it describes.

import db from '../config/db.js';

export const writeAuditLog = async ({ userId, action, details, ipAddress }, executor = db) => {
  const query = `
    INSERT INTO audit_logs (user_id, action, details, ip_address)
    VALUES ($1, $2, $3, $4)
    RETURNING id, user_id, action, details, ip_address, created_at;
  `;
  const result = await executor.query(query, [userId ?? null, action, details, ipAddress ?? null]);
  return result.rows[0];
};
